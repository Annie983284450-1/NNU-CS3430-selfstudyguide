# Step 3. A pool of 2 MB blocks

## Why this step

The question: why does a superpage need its own allocator?

Steps 4 and 5 make one page-table entry cover 2 MB instead of 4 KB. The
hardware allows it on one condition: the 2 MB must be one physically
contiguous, 2 MB-aligned block. `kalloc()` cannot promise that. Its free list is
a pile of 4 KB pages in whatever order they were freed. So before anyone can
map a superpage, the kernel needs a second pile, of 2 MB blocks, each aligned.
This step builds that pile. Nothing uses it yet.

The picture: a lumber yard that stocks planks in two sizes. You cannot glue
512 short planks into a long one; you keep long planks on their own rack.

## The picture

```
   physical memory, 128 MB, from KERNBASE 0x80000000 to PHYSTOP 0x88000000

   0x80000000  +-------------------------------+
               |  kernel code and data         |
   end         +-------------------------------+
               |                               |
               |  4 KB pool: kmem.freelist     |   kalloc() / kfree()
               |  [end, SUPERBASE)             |
               |                               |
   SUPERBASE   +-------------------------------+   = PHYSTOP - 20 * 2 MB = 0x85800000
   0x85800000  |  2 MB pool: superkmem.freelist|   superalloc() / superfree()
               |  20 blocks, each 2 MB aligned |
   PHYSTOP     +-------------------------------+
   0x88000000
```

Twenty blocks is 40 MB. The tests need at least 16 live at once (`superpg_fork`
takes 8 and then forks, and the child needs its own 8). The 4 KB pool keeps
the remaining 88 MB minus the kernel, which `usertests` still needs.

## Do this, part A: `kernel/kalloc.c`

Open `kernel/kalloc.c`. `kinit()` is at lines 26 to 31:

```c
void
kinit()
{
  initlock(&kmem.lock, "kmem");
  freerange(end, (void*)PHYSTOP);
}
```

Replace those six lines with the block below: the pool's definition, a
`kinit()` that splits memory between the two pools, and the three functions
that manage the second pool. They mirror `freerange`, `kfree` and `kalloc`,
which are just below in the same file; read those first. One blank: where the
2 MB pool begins.

```c
// A small pool of 2MB superpages, carved out of the top of physical memory so
// that superalloc() can return 2MB-aligned, physically contiguous blocks.
#define NSUPER   20                                       // number of superpages
#define SUPERBASE (PHYSTOP - (uint64)NSUPER * ________)

struct {
  struct spinlock lock;
  struct run *freelist;
} superkmem;

void superfreerange(void *pa_start, void *pa_end);

void
kinit()
{
  initlock(&kmem.lock, "kmem");
  initlock(&superkmem.lock, "superkmem");
  freerange(end, (void*)SUPERBASE);            // 4KB pool: [end, SUPERBASE)
  superfreerange((void*)SUPERBASE, (void*)PHYSTOP); // 2MB pool: [SUPERBASE, PHYSTOP)
}

// Build the superpage freelist from a range of physical memory.
void
superfreerange(void *pa_start, void *pa_end)
{
  char *p = (char*)SUPERPGROUNDUP((uint64)pa_start);
  for(; p + SUPERPGSIZE <= (char*)pa_end; p += SUPERPGSIZE)
    superfree(p);
}

// Free a 2MB superpage back to the superpage pool.
void
superfree(void *pa)
{
  struct run *r;

  if(((uint64)pa % SUPERPGSIZE) != 0 ||
     (uint64)pa < SUPERBASE || (uint64)pa >= PHYSTOP)
    panic("superfree");

  r = (struct run*)pa;
  acquire(&superkmem.lock);
  r->next = superkmem.freelist;
  superkmem.freelist = r;
  release(&superkmem.lock);
}

// Allocate one 2MB superpage; returns 0 if none are available.
void *
superalloc(void)
{
  struct run *r;

  acquire(&superkmem.lock);
  r = superkmem.freelist;
  if(r)
    superkmem.freelist = r->next;
  release(&superkmem.lock);
  return (void*)r;
}
```

## Do this, part B: `kernel/defs.h`

Other files will call `superalloc` and `superfree`, so they need prototypes.
Open `kernel/defs.h`, find the `// kalloc.c` group (lines 65 to 68), and add
two lines after `void            kinit(void);`:

```c
// kalloc.c
void*           kalloc(void);
void            kfree(void *);
void            kinit(void);
void*           superalloc(void);
void            superfree(void *);
```

The spacing is cosmetic; the file aligns the names in a column.

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ pgtbltest
```

## You should see

The same output as [Step 2](step-2.md), down to `superpg_fork failed: pte different`.
Nothing calls the new pool yet, so nothing visible should change. One thing
does, and it proves the split happened: look at the `pa` column.

```
page table 0x0000000085722000
|- 0x0000000000000000 pte 0x00000000215c7801 pa 0x000000008571e000
|- |- 0x0000000000000000 pte 0x00000000215c7401 pa 0x000000008571d000
|- |- |- 0x0000000000000000 pte 0x00000000215c7c5b pa 0x000000008571f000
|- |- |- 0x0000000000001000 pte 0x00000000215c705b pa 0x000000008571c000
|- |- |- 0x0000000000002000 pte 0x00000000215c6cd7 pa 0x000000008571b000
|- |- |- 0x0000000000003000 pte 0x00000000215c6807 pa 0x000000008571a000
|- |- |- 0x0000000000004000 pte 0x00000000215c64d7 pa 0x0000000085719000
```

In [Step 2](step-2.md) the same pages were at `0x87f1xxxx`, just under `PHYSTOP`. Now
they are at `0x8571xxxx`, just under `SUPERBASE` (`0x85800000`). `kalloc()`
hands out pages from the top of its list down, and the top of its list moved
40 MB lower. (Your exact numbers will differ. The first hex digits moving from
`87f` to `857` is what to look for.)

!!! theory "Connect to theory: a fixed-size free list cannot hand out a bigger block"

    **What the theory says.** When every unit has the same size, the allocator needs no
    header, no search and no coalescing: a list of free units, take from the front,
    push onto the front. That is `kalloc.c`
    ([Week 4, Section 3.3](../../w04/class-1.md#sec-3-3), drawn in
    [Week 4, Extra 12](../../w04/class-1.md#extra-12)). Merging two free neighbors gains
    nothing when every request is one page, so `kfree` never does it.

    **What this run showed.** After the new `kinit`, the pages `kalloc` handed out
    moved from `0x87f...` down to `0x857...`.

    **Why the run confirms the theory.** The list is a stack in the order pages were
    freed. It keeps no record of which pages sit next to each other. So it can answer
    only one request: "give me one page". It has no way to find 512 pages in a row.
    The 2 MB blocks therefore get a list of their own, with the same push and pop and
    a bigger unit. The moved addresses show how plain `kalloc` is. It hands out the
    first entry of its list. That entry is now the top page under `SUPERBASE`, not the
    top page under `PHYSTOP`.

??? success "The answer: the blank"

    `SUPERPGSIZE`. `SUPERBASE` is `PHYSTOP - 20 * 2 MB` = `0x88000000 -
    0x2800000` = `0x85800000`.

??? success "The answer: the top of `kernel/kalloc.c` after Step 3 (lines 17 to 85)"

    ```c linenums="17"
    struct run {
      struct run *next;
    };

    struct {
      struct spinlock lock;
      struct run *freelist;
    } kmem;

    // A small pool of 2MB superpages, carved out of the top of physical memory so
    // that superalloc() can return 2MB-aligned, physically contiguous blocks.
    #define NSUPER   20                                       // number of superpages
    #define SUPERBASE (PHYSTOP - (uint64)NSUPER * SUPERPGSIZE)

    struct {
      struct spinlock lock;
      struct run *freelist;
    } superkmem;

    void superfreerange(void *pa_start, void *pa_end);

    void
    kinit()
    {
      initlock(&kmem.lock, "kmem");
      initlock(&superkmem.lock, "superkmem");
      freerange(end, (void*)SUPERBASE);            // 4KB pool: [end, SUPERBASE)
      superfreerange((void*)SUPERBASE, (void*)PHYSTOP); // 2MB pool: [SUPERBASE, PHYSTOP)
    }

    // Build the superpage freelist from a range of physical memory.
    void
    superfreerange(void *pa_start, void *pa_end)
    {
      char *p = (char*)SUPERPGROUNDUP((uint64)pa_start);
      for(; p + SUPERPGSIZE <= (char*)pa_end; p += SUPERPGSIZE)
        superfree(p);
    }

    // Free a 2MB superpage back to the superpage pool.
    void
    superfree(void *pa)
    {
      struct run *r;

      if(((uint64)pa % SUPERPGSIZE) != 0 ||
         (uint64)pa < SUPERBASE || (uint64)pa >= PHYSTOP)
        panic("superfree");

      r = (struct run*)pa;
      acquire(&superkmem.lock);
      r->next = superkmem.freelist;
      superkmem.freelist = r;
      release(&superkmem.lock);
    }

    // Allocate one 2MB superpage; returns 0 if none are available.
    void *
    superalloc(void)
    {
      struct run *r;

      acquire(&superkmem.lock);
      r = superkmem.freelist;
      if(r)
        superkmem.freelist = r->next;
      release(&superkmem.lock);
      return (void*)r;
    }
    ```

    `freerange`, `kfree` and `kalloc` follow, unchanged.

!!! question "Think"

    `superfree()` panics if the address is not a multiple of `SUPERPGSIZE`, and
    `superfreerange()` rounds its start up with `SUPERPGROUNDUP`. `kfree()` has the
    same checks for 4 KB. Why does the hardware care about alignment at all? Put
    differently: a level-1 PTE holds a physical page number, not a byte address;
    what would go wrong if a superpage started at `0x85801000`?

    Answer it in your own words before you read on. The answer is not printed here.
