# Step 5. Demote a superpage when part of it is freed

## Why this step

The question: what happens when a 2 MB page is only half wanted?

A program that grew its heap into a superpage can shrink it again with
`sbrk(-4096)`. Now the kernel has a problem: one PTE says "2 MB", but only
2 MB minus 4 KB is still wanted. It cannot free the block (the rest is in use)
and it cannot leave the PTE (the freed page would still be reachable). The
answer is to take the superpage apart: replace the one level-1 leaf with a
level-0 table of 512 ordinary entries mapping the same physical bytes, then
free only the entries above the new boundary. The fast mapping is traded for
the ability to free part of it. This is called demotion.

The picture: the apartment block from [Step 4](step-4.md) is sold off one unit at a time.
The route book's single "whole block" entry has to be rewritten as 512 unit
entries first; only then can one unit be crossed out.

## The picture

```
   before                                   after superdemote(), then uvmunmap of the top page

   level-1 [i] = LEAF -> 2 MB block         level-1 [i] -> level-0 table (new page, kalloc)
                                                            [0]   -> block + 0
                                                            [1]   -> block + 4 KB
                                                             ...
                                                            [510] -> block + 2 MB - 8 KB
                                                            [511] -> (cleared, page kfree'd)

   uvmdealloc(oldsz, newsz):
     nb = PGROUNDUP(newsz)
     nb inside a superpage?  -> superdemote(nb)      (only when nb % 2 MB != 0)
     uvmunmap(nb, (oldsz - nb) / PGSIZE, 1)          (now frees 4 KB pages with kfree)
```

Note what happens to the freed pages: they go to the 4 KB pool through
`kfree`, not back to the 2 MB pool. And the part that is kept is now 512
ordinary pages, no longer a superpage. That is the price of a partial free.

## Do this, part A: `superdemote()`

In `kernel/vm.c`, part A of [Step 4](step-4.md) ended with `walkleaf()` and then `#endif`
(line 173). Insert `superdemote()` between the closing `}` of `walkleaf` and
that `#endif`. One blank: what the superpage's PTE is set to once its 512
replacements are in place.

```c
// Split the 2MB superpage covering va into 512 regular 4KB PTEs that map the
// same physical memory, so a sub-range can be freed without losing the rest.
static void
superdemote(pagetable_t pagetable, uint64 va)
{
  uint64 base = SUPERPGROUNDDOWN(va);
  pte_t *spte = superwalk(pagetable, base, 0);
  if(spte == 0 || (*spte & PTE_V) == 0 || !PTE_LEAF(*spte))
    return;                          // not currently a superpage
  uint64 pa = PTE2PA(*spte);
  int flags = PTE_FLAGS(*spte);
  *spte = ________;                         // drop the superpage mapping
  for(uint64 off = 0; off < SUPERPGSIZE; off += PGSIZE){
    if(mappages(pagetable, base + off, PGSIZE, pa + off, flags) != 0)
      panic("superdemote");
  }
}
```

`mappages` builds down to level 0, so once the level-1 slot is cleared, the
first `mappages` call allocates the new level-0 table under it and the other
511 reuse it.

## Do this, part B: `uvmdealloc`, replaced whole

`uvmdealloc` is now at lines 413 to 425 of your file (part A added 18 lines).
Replace the whole function with:

```c
uint64
uvmdealloc(pagetable_t pagetable, uint64 oldsz, uint64 newsz)
{
  if(newsz >= oldsz)
    return oldsz;

  if(PGROUNDUP(newsz) < PGROUNDUP(oldsz)){
    uint64 nb = PGROUNDUP(newsz);
#ifdef LAB_PGTBL
    // If the new boundary falls inside a superpage, split that superpage so we
    // free only the pages above newsz and keep the lower part intact.
    if(nb % SUPERPGSIZE != 0){
      int super;
      pte_t *pte = walkleaf(pagetable, nb, &super);
      if(pte && (*pte & PTE_V) && super)
        superdemote(pagetable, nb);
    }
#endif
    int npages = (PGROUNDUP(oldsz) - nb) / PGSIZE;
    uvmunmap(pagetable, nb, npages, 1);
  }

  return newsz;
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
superpg_fork: OK
superpg_free starting
usertrap(): unexpected scause 0xd pid=70
            sepc=0x40a stval=0xfff001
superpg_free: OK
pgtbltest: all tests succeeded
```

`superpg_free: OK`, then `pgtbltest: all tests succeeded`. The test grew the
heap, shrank it to a 2 MB boundary, checked the last two pages shared one PTE
(a superpage), wrote `'8'` and `'9'` into them, freed just the last 4 KB, and
checked the `'9'` was still there. Then it forked a child that reads the freed
page; the child dies with `scause 0xd` (load page fault, `stval=0xfff001`,
one byte past the new end), which is the `OK`. Finally it freed the rest a
page at a time and checked each PTE went to 0.

!!! theory "Connect to theory: demotion grows the tree by one piece"

    **What the theory says.** A multi-level table builds a lower piece only where it
    is needed. An entry one level up either points to that piece or is invalid
    ([Week 5, Sections 1.3](../../w05/class-1.md#sec-1-3) and
    [1.4](../../w05/class-1.md#sec-1-4)). In Sv39 a level-1 entry has a third choice: it
    can be a leaf ([Step 4](step-4.md)). And the end of a process's memory is simply its last valid
    entry. Past it there is no translation, and a touch there traps
    ([Week 4, Extra 18](../../w04/class-2.md#extra-18)).

    **What this run showed.** After `superdemote`, the `'9'` in the part that was kept
    survived the 4 KB free. The child that read the freed page died with
    `scause 0xd`. Freeing the rest one page at a time left every PTE at 0.

    **Why the run confirms the theory.** Demotion is the tree growing one piece. The
    level-1 entry that was a leaf becomes a pointer to a new level-0 table. That table
    is built only now, when it is needed, and its 512 entries map the same physical
    bytes as before. The price is one more page of table and, on real hardware, the
    one-slot TLB coverage. After that the region behaves like any memory in Week 4:
    valid entries up to the new end, and a fault past it.

Run the grader on the program once more. All three `pgtbltest` lines should
now be `OK`:

**On Ubuntu (or Mac), in the lab folder** (quit xv6 first):

```
$ ./grade-lab-pgtbl pgtbltest
```

```
== Test pgtbltest == (6.0s) 
== Test   pgtbltest: ugetpid == 
  pgtbltest: ugetpid: OK 
== Test   pgtbltest: print_kpgtbl == 
  pgtbltest: print_kpgtbl: OK 
== Test   pgtbltest: superpg == 
  pgtbltest: superpg: OK 
```

??? success "The answer: the blank"

    `*spte = 0;`. The slot must be empty before `mappages` can put a pointer to
    the new level-0 table in it; `mappages` panics with `remap` on a valid entry.

??? success "The answer: `superdemote()`, complete (lines 174 to 190 of `kernel/vm.c` after Step 5)"

    ```c linenums="174"
    // Split the 2MB superpage covering va into 512 regular 4KB PTEs that map the
    // same physical memory, so a sub-range can be freed without losing the rest.
    static void
    superdemote(pagetable_t pagetable, uint64 va)
    {
      uint64 base = SUPERPGROUNDDOWN(va);
      pte_t *spte = superwalk(pagetable, base, 0);
      if(spte == 0 || (*spte & PTE_V) == 0 || !PTE_LEAF(*spte))
        return;                          // not currently a superpage
      uint64 pa = PTE2PA(*spte);
      int flags = PTE_FLAGS(*spte);
      *spte = 0;                         // drop the superpage mapping
      for(uint64 off = 0; off < SUPERPGSIZE; off += PGSIZE){
        if(mappages(pagetable, base + off, PGSIZE, pa + off, flags) != 0)
          panic("superdemote");
      }
    }
    ```

??? success "The answer: `uvmdealloc()` after Step 5 (lines 409 to 436)"

    ```c linenums="409"
    // Deallocate user pages to bring the process size from oldsz to
    // newsz.  oldsz and newsz need not be page-aligned, nor does newsz
    // need to be less than oldsz.  oldsz can be larger than the actual
    // process size.  Returns the new process size.
    uint64
    uvmdealloc(pagetable_t pagetable, uint64 oldsz, uint64 newsz)
    {
      if(newsz >= oldsz)
        return oldsz;

      if(PGROUNDUP(newsz) < PGROUNDUP(oldsz)){
        uint64 nb = PGROUNDUP(newsz);
    #ifdef LAB_PGTBL
        // If the new boundary falls inside a superpage, split that superpage so we
        // free only the pages above newsz and keep the lower part intact.
        if(nb % SUPERPGSIZE != 0){
          int super;
          pte_t *pte = walkleaf(pagetable, nb, &super);
          if(pte && (*pte & PTE_V) && super)
            superdemote(pagetable, nb);
        }
    #endif
        int npages = (PGROUNDUP(oldsz) - nb) / PGSIZE;
        uvmunmap(pagetable, nb, npages, 1);
      }

      return newsz;
    }
    ```

!!! question "Think"

    Before Step 5, `superpg_free` failed with `lost content after freeing part of
    super page`. Walk through what the Step 4 kernel did on `sbrk(-PGSIZE)` to
    make the `'9'` disappear: which function freed what, and why did a 4 KB
    request take 2 MB away?

    Answer it in your own words before you read on. The answer is not printed here.
