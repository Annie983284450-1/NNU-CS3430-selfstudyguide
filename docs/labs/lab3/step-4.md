# Step 4. Map superpages, and teach `fork` about them

## Why this step

The question: how does one PTE cover 2 MB?

In Sv39 a page-table entry at level 1 is allowed to be a leaf. Normally it
points down to a level-0 table of 512 small entries; if instead its R, W or X
bit is set, the hardware stops there and treats the entry as mapping a whole
2 MB region. One entry instead of 512, and one TLB slot instead of 512. Linux
calls these huge pages, and databases ask for them by name.

This step has two halves. First, when a process grows its heap by a large
amount (`sbrk` calls `growproc`, which calls `uvmalloc`), use a 2 MB block from
[Step 3](step-3.md) whenever a 2 MB-aligned chunk fits. Second, every function that walks
user memory one page at a time (`walkaddr`, `uvmunmap`, `uvmcopy`) must notice a
superpage and step over it in one 2 MB stride.

The picture: a delivery route where most houses get one letter, but one
address is an apartment block with 512 units. You do not need 512 entries in
your route book for it; one entry says "the block at number 40, all units".
Every clerk who reads the route book has to know that one entry means 512
doors.

## The picture

```
   NORMAL 4 KB PATH                          SUPERPAGE (2 MB)
   level-1 PTE (interior, only V)            level-1 PTE (LEAF: R/W/X set)
        |                                         |
        v                                         v
   +------------------+                      +----------------------+
   | level-0 table    |                      |  one 2 MB block from |
   |  [0]   -> 4 KB   |                      |  superalloc()        |
   |  [1]   -> 4 KB   |                      |                      |
   |  ...             |                      |  mapped by ONE PTE,  |
   |  [511] -> 4 KB   |                      |  ONE TLB entry       |
   +------------------+                      +----------------------+
   512 PTEs, 512 TLB entries                 1 PTE, 1 TLB entry

   uvmalloc, growing from a to newsz:
     a % 2 MB == 0 and a + 2 MB <= newsz and superalloc() != 0 ?
        yes: mapsuperpage(a, block), a += 2 MB
        no:  kalloc(), mappages(a, page), a += 4 KB
```

Three helpers make the rest short. `superwalk()` goes to the level-1 slot for
an address and stops there (the ordinary `walk()` goes on to level 0 unless it meets a leaf).
`mapsuperpage()` writes a leaf into that slot. `walkleaf()` finds the leaf for
an address, at whichever level it is, and reports whether it was a superpage.
`walkaddr`, `uvmunmap` and `uvmcopy` then all ask `walkleaf` instead of `walk`.

## Do this, part A: three helpers

Open `kernel/vm.c`. `walk()` ends at line 118 with `return &pagetable[PX(0,
va)];` and `}`. Insert the following block after that `}` (before the comment
`// Look up a virtual address`). One blank: the level `superwalk` stops at.

```c
#ifdef LAB_PGTBL
// Walk to the level-1 PTE that holds (or would hold) a 2MB superpage for va,
// allocating the level-2 table if needed.
static pte_t *
superwalk(pagetable_t pagetable, uint64 va, int alloc)
{
  if(va >= MAXVA)
    panic("superwalk");
  pte_t *pte = &pagetable[PX(2, va)];
  if(*pte & PTE_V){
    pagetable = (pagetable_t)PTE2PA(*pte);
  } else {
    if(!alloc || (pagetable = (pde_t*)kalloc()) == 0)
      return 0;
    memset(pagetable, 0, PGSIZE);
    *pte = PA2PTE(pagetable) | PTE_V;
  }
  return &pagetable[PX(________, va)];
}

// Install a 2MB superpage leaf PTE at level 1.
int
mapsuperpage(pagetable_t pagetable, uint64 va, uint64 pa, int perm)
{
  pte_t *pte = superwalk(pagetable, va, 1);
  if(pte == 0)
    return -1;
  if(*pte & PTE_V)
    panic("mapsuperpage: remap");
  *pte = PA2PTE(pa) | perm | PTE_V;
  return 0;
}

// Return the leaf PTE for va and set *superp = 1 if it is a 2MB superpage
// (a leaf found at level 1) or 0 for a regular 4KB page (leaf at level 0).
static pte_t *
walkleaf(pagetable_t pagetable, uint64 va, int *superp)
{
  *superp = 0;
  if(va >= MAXVA)
    return 0;
  for(int level = 2; level > 0; level--){
    pte_t *pte = &pagetable[PX(level, va)];
    if((*pte & PTE_V) == 0)
      return 0;
    if(PTE_LEAF(*pte)){
      *superp = (level == 1);
      return pte;
    }
    pagetable = (pagetable_t)PTE2PA(*pte);
  }
  return &pagetable[PX(0, va)];
}
#endif
```

## Do this, part B: four functions, replaced whole

Each of these four functions already exists in `kernel/vm.c`. Replace the
whole function, from its return-type line to its closing `}`, with the version
given. The line numbers are where each one sits in your file right now, after
the [Step 2](step-2.md) and part A edits (part A added 55 lines, so these numbers already
include it):

| Function | Your file now | What changes |
|---|---|---|
| `walkaddr` | lines 178 to 196 | ask `walkleaf`; add the 4 KB page's offset inside a 2 MB block |
| `uvmunmap` | lines 292 to 316 | ask `walkleaf`; stride and free by the right size |
| `uvmalloc` | lines 321 to 349 | try a superpage first |
| `uvmcopy` | lines 406 to 437 | copy a superpage as a superpage |

The line numbers are valid before any of the four replacements. Each new
version is longer than the old one, so work from the bottom of the file up
(`uvmcopy` first, then `uvmalloc`, `uvmunmap`, `walkaddr`) and the numbers stay
right. For each one: delete the old function, then paste the new one in the
same place. Afterwards `grep -n "^walkaddr\|^uvmunmap\|^uvmalloc\|^uvmcopy" kernel/vm.c`
must print exactly four lines.

**`walkaddr`** (one blank: the offset of `va`'s 4 KB page inside its 2 MB
block):

```c
uint64
walkaddr(pagetable_t pagetable, uint64 va)
{
  pte_t *pte;
  uint64 pa;

  if(va >= MAXVA)
    return 0;

#ifdef LAB_PGTBL
  int super;
  pte = walkleaf(pagetable, va, &super);
  if(pte == 0)
    return 0;
  if((*pte & PTE_V) == 0)
    return 0;
  if((*pte & PTE_U) == 0)
    return 0;
  pa = PTE2PA(*pte);
  if(super)                         // add this 4KB page's offset within the 2MB block
    pa += ________ - ________;
  return pa;
#else
  pte = walk(pagetable, va, 0);
  if(pte == 0)
    return 0;
  if((*pte & PTE_V) == 0)
    return 0;
  if((*pte & PTE_U) == 0)
    return 0;
  pa = PTE2PA(*pte);
  return pa;
#endif
}
```

**`uvmunmap`** (no blanks; note that `sz` is reset to `PGSIZE` before every
`continue`, so a hole after a superpage is stepped over 4 KB at a time):

```c
void
uvmunmap(pagetable_t pagetable, uint64 va, uint64 npages, int do_free)
{
  uint64 a;
  pte_t *pte;
  int sz = PGSIZE;

  if((va % PGSIZE) != 0)
    panic("uvmunmap: not aligned");

  for(a = va; a < va + npages*PGSIZE; a += sz){
    int super = 0;
#ifdef LAB_PGTBL
    pte = walkleaf(pagetable, a, &super);
#else
    pte = walk(pagetable, a, 0);
#endif
    if(pte == 0){                 // leaf page table entry allocated?
      sz = PGSIZE;
      continue;
    }
    if((*pte & PTE_V) == 0){      // has physical page been allocated?
      sz = PGSIZE;
      continue;
    }
    if(PTE_FLAGS(*pte) == PTE_V)
      panic("uvmunmap: not a leaf");
    sz = super ? SUPERPGSIZE : PGSIZE;
    if(do_free){
      uint64 pa = PTE2PA(*pte);
      if(super)
        superfree((void*)pa);
      else
        kfree((void*)pa);
    }
    *pte = 0;
  }
}
```

**`uvmalloc`** (no blanks; the new `if` is the whole idea):

```c
uint64
uvmalloc(pagetable_t pagetable, uint64 oldsz, uint64 newsz, int xperm)
{
  char *mem;
  uint64 a;
  int sz;

  if(newsz < oldsz)
    return oldsz;

  oldsz = PGROUNDUP(oldsz);
  for(a = oldsz; a < newsz; a += sz){
#ifdef LAB_PGTBL
    // Use a 2MB superpage when the next chunk is 2MB-aligned and big enough.
    if((a % SUPERPGSIZE) == 0 && a + SUPERPGSIZE <= newsz &&
       (mem = superalloc()) != 0){
      sz = SUPERPGSIZE;
      memset(mem, 0, sz);
      if(mapsuperpage(pagetable, a, (uint64)mem, PTE_R|PTE_U|xperm) != 0){
        superfree(mem);
        uvmdealloc(pagetable, a, oldsz);
        return 0;
      }
      continue;
    }
#endif
    sz = PGSIZE;
    mem = kalloc();
    if(mem == 0){
      uvmdealloc(pagetable, a, oldsz);
      return 0;
    }
    memset(mem, 0, sz);
    if(mappages(pagetable, a, sz, (uint64)mem, PTE_R|PTE_U|xperm) != 0){
      kfree(mem);
      uvmdealloc(pagetable, a, oldsz);
      return 0;
    }
  }
  return newsz;
}
```

**`uvmcopy`** (no blanks):

```c
int
uvmcopy(pagetable_t old, pagetable_t new, uint64 sz)
{
  pte_t *pte;
  uint64 pa, i;
  uint flags;
  char *mem;
  int szinc = PGSIZE;

  for(i = 0; i < sz; i += szinc){
    int super = 0;
#ifdef LAB_PGTBL
    pte = walkleaf(old, i, &super);
#else
    pte = walk(old, i, 0);
#endif
    if(pte == 0){
      szinc = PGSIZE;
      continue;
    }
    if((*pte & PTE_V) == 0){
      szinc = PGSIZE;
      continue;
    }
    pa = PTE2PA(*pte);
    flags = PTE_FLAGS(*pte);
#ifdef LAB_PGTBL
    if(super){
      szinc = SUPERPGSIZE;
      if((mem = superalloc()) == 0)
        goto err;
      memmove(mem, (char*)pa, SUPERPGSIZE);
      if(mapsuperpage(new, i, (uint64)mem, flags) != 0){
        superfree(mem);
        goto err;
      }
      continue;
    }
#endif
    szinc = PGSIZE;
    if((mem = kalloc()) == 0)
      goto err;
    memmove(mem, (char*)pa, PGSIZE);
    if(mappages(new, i, PGSIZE, (uint64)mem, flags) != 0){
      kfree(mem);
      goto err;
    }
  }
  return 0;

 err:
  uvmunmap(new, 0, i / PGSIZE, 1);
  return -1;
}
```

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ pgtbltest
```

## You should see

```
print_kpgtbl: OK
superpg_fork starting
usertrap(): unexpected scause 0xf pid=69
            sepc=0x2ec stval=0x5001
superpg_fork: OK
superpg_free starting
pgtbltest: superpg_free failed: lost content after freeing part of super page, pid=3
```

`superpg_fork: OK`. The test grew its heap by 16 MB (`sbrk(8 * SUPERPGSIZE)`),
checked that 512 consecutive 4 KB addresses inside a 2 MB-aligned region all
report the same PTE (that is what "one entry covers 2 MB" looks like from user
space), wrote to every page, forked, and had the child check the same.

The two `usertrap()` lines are part of the test, not an error. After freeing
the memory with `sbrk(-SZ)`, the test forks a child that deliberately touches
the freed address. `scause 0xf` is a store page fault; `stval=0x5001` is the
address it wrote. The kernel kills the child, the parent sees the non-zero
exit status, and that is the `OK`. Your `pid` will differ.

!!! theory "Connect to theory: one big page, one entry"

    **What the theory says.** Bigger pages mean fewer entries. But every page wastes
    whatever part of it is not used (internal fragmentation). So systems keep 4 KB as
    the normal size and offer big pages as an option. Their real purpose is the TLB:
    one TLB entry for a 2 MB page covers 512 times as much memory as one for a 4 KB
    page ([Week 5, Section 1.2](../../w05/class-1.md#sec-1-2); the TLB itself is
    [Week 4, Section 6.2](../../w04/class-2.md#sec-6-2)).

    **What this run showed.** `superpg_fork` found the same PTE for 512 consecutive
    4 KB addresses inside one aligned 2 MB region, in the parent and again in the
    forked child.

    **Why the run confirms the theory.** 512 pages, one entry: a level-1 leaf maps the
    whole region. That is one entry in the table, and on real hardware one TLB slot
    for all of it. The waste the theory warns about is kept out by the condition in
    `uvmalloc`. A superpage is used only when a whole aligned 2 MB chunk is wanted.
    The rest of the request, such as the start of the heap below the first 2 MB
    boundary, still gets 4 KB pages.

Then `superpg_free failed: lost content after freeing part of super page`.
That is [Step 5](step-5.md).

??? success "The answer: the three blanks"

    `PX(1, va)`: `superwalk` stops at level 1 and returns that slot. In
    `walkaddr`: `pa += PGROUNDDOWN(va) - SUPERPGROUNDDOWN(va);`. The PTE holds the
    start of the 2 MB block; the 4 KB page the caller wants is somewhere inside it,
    and the distance from the block's start to that page is the same in virtual and
    physical space.

??? success "The answer: the three helpers, complete (lines 120 to 173 of `kernel/vm.c` after Step 4)"

    ```c linenums="120"
    #ifdef LAB_PGTBL
    // Walk to the level-1 PTE that holds (or would hold) a 2MB superpage for va,
    // allocating the level-2 table if needed.
    static pte_t *
    superwalk(pagetable_t pagetable, uint64 va, int alloc)
    {
      if(va >= MAXVA)
        panic("superwalk");
      pte_t *pte = &pagetable[PX(2, va)];
      if(*pte & PTE_V){
        pagetable = (pagetable_t)PTE2PA(*pte);
      } else {
        if(!alloc || (pagetable = (pde_t*)kalloc()) == 0)
          return 0;
        memset(pagetable, 0, PGSIZE);
        *pte = PA2PTE(pagetable) | PTE_V;
      }
      return &pagetable[PX(1, va)];
    }

    // Install a 2MB superpage leaf PTE at level 1.
    int
    mapsuperpage(pagetable_t pagetable, uint64 va, uint64 pa, int perm)
    {
      pte_t *pte = superwalk(pagetable, va, 1);
      if(pte == 0)
        return -1;
      if(*pte & PTE_V)
        panic("mapsuperpage: remap");
      *pte = PA2PTE(pa) | perm | PTE_V;
      return 0;
    }

    // Return the leaf PTE for va and set *superp = 1 if it is a 2MB superpage
    // (a leaf found at level 1) or 0 for a regular 4KB page (leaf at level 0).
    static pte_t *
    walkleaf(pagetable_t pagetable, uint64 va, int *superp)
    {
      *superp = 0;
      if(va >= MAXVA)
        return 0;
      for(int level = 2; level > 0; level--){
        pte_t *pte = &pagetable[PX(level, va)];
        if((*pte & PTE_V) == 0)
          return 0;
        if(PTE_LEAF(*pte)){
          *superp = (level == 1);
          return pte;
        }
        pagetable = (pagetable_t)PTE2PA(*pte);
      }
      return &pagetable[PX(0, va)];
    }
    #endif
    ```

??? success "The answer: `walkaddr()` after Step 4 (lines 175 to 211)"

    ```c linenums="175"
    // Look up a virtual address, return the physical address,
    // or 0 if not mapped.
    // Can only be used to look up user pages.
    uint64
    walkaddr(pagetable_t pagetable, uint64 va)
    {
      pte_t *pte;
      uint64 pa;

      if(va >= MAXVA)
        return 0;

    #ifdef LAB_PGTBL
      int super;
      pte = walkleaf(pagetable, va, &super);
      if(pte == 0)
        return 0;
      if((*pte & PTE_V) == 0)
        return 0;
      if((*pte & PTE_U) == 0)
        return 0;
      pa = PTE2PA(*pte);
      if(super)                         // add this 4KB page's offset within the 2MB block
        pa += PGROUNDDOWN(va) - SUPERPGROUNDDOWN(va);
      return pa;
    #else
      pte = walk(pagetable, va, 0);
      if(pte == 0)
        return 0;
      if((*pte & PTE_V) == 0)
        return 0;
      if((*pte & PTE_U) == 0)
        return 0;
      pa = PTE2PA(*pte);
      return pa;
    #endif
    }
    ```

    `uvmunmap`, `uvmalloc` and `uvmcopy` are printed in full above.

!!! question "Think"

    The `pgtbltest` checks pass with or without the `pa +=` line in `walkaddr`.
    So what is that line for, and which kernel operations would go wrong without
    it? (Hint: user programs read and write their own memory directly through the
    page table. Who calls `walkaddr`?)

    Answer it in your own words before you read on. The answer is not printed here.
