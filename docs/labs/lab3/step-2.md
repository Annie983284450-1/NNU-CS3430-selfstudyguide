# Step 2. `vmprint()`: print the whole tree

## Why this step

The question: what does a three-level page table look like?

[Step 0](step-0.md) showed single entries. Now print the whole structure. The kernel keeps
one root table of 512 entries; each valid entry points to a second table; each
of those points to a third; the third holds the leaves. `vmprint` walks it and
prints one line per valid entry, indented by depth, so the tree shape is
visible on the screen.

The picture: a table of contents with three levels. Chapter, section,
paragraph. Most chapters are empty, so the printed contents is short even
though the book could hold 512 x 512 x 512 pages.

## The picture

```
   root (level 2)              level 1                  level 0 (leaves)
   pagetable[0]   ---------->  [0]  ----------------->  [0] -> pa of text page 1
   pagetable[1]   (invalid)                             [1] -> pa of text page 2
       ...                                              [2] -> data
   pagetable[255] ---------->  [511] -------------->    [3] -> guard
       ...                                              [4] -> stack
                                                        ...
                                                        [509] -> USYSCALL
                                                        [510] -> TRAPFRAME
                                                        [511] -> TRAMPOLINE

   va = index2 << 30  |  index1 << 21  |  index0 << 12  |  offset
   PXSHIFT(2) = 30     PXSHIFT(1) = 21   PXSHIFT(0) = 12
```

An entry is a leaf if any of R, W, X is set. An entry with only V set is a
pointer to the next table. `freewalk()` lower in `kernel/vm.c` already walks
all 512 entries of a table and recurses into the non-leaf ones; the printer has
the same shape with a `printf` added.

## Do this

Open `kernel/vm.c`. Lines 144 to 149 are the stub:

```c
#if defined(LAB_PGTBL) || defined(SOL_MMAP) || defined(SOL_COW)
void
vmprint(pagetable_t pagetable) {
  // your code here
}
#endif
```

Replace those six lines with the helper and the function below. Two blanks:
how many `|- ` markers a line at `level` gets (the root's entries get one, the
leaves get three), and how a child's virtual address is built from its index.

```c
#if defined(LAB_PGTBL) || defined(SOL_MMAP) || defined(SOL_COW)
// Recursively print the valid entries of a page table.  `level` is the RISC-V
// page-table level (2 = root, 0 = leaf); `va` is the base virtual address the
// current table covers.  Each level of depth is marked with the NNU course
// indent "|- " (MIT's reference uses " ..").
static void
vmprint_walk(pagetable_t pagetable, int level, uint64 va)
{
  for(int i = 0; i < 512; i++){
    pte_t pte = pagetable[i];
    if((pte & PTE_V) == 0)
      continue;
    uint64 cva = va + ((uint64)i << ________);
    for(int d = 0; d < ________; d++)
      printf("|- ");
    printf("%p pte %p pa %p\n", (void*)cva, (void*)pte, (void*)PTE2PA(pte));
    // Recurse into interior nodes only (a leaf has R/W/X set).
    if(level > 0 && (pte & (PTE_R|PTE_W|PTE_X)) == 0)
      vmprint_walk((pagetable_t)PTE2PA(pte), level - 1, cva);
  }
}

void
vmprint(pagetable_t pagetable) {
  printf("page table %p\n", (void*)pagetable);
  vmprint_walk(pagetable, 2, 0);
}
#endif
```

The marker is a vertical bar, a hyphen and a space: `|- `. The grader checks
it exactly. The MIT version of this lab prints ` ..`; code copied from the web
fails our grader.

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
$ pgtbltest
print_pgtbl starting
va 0x0 pte 0x21FC7C5B pa 0x87F1F000 perm 0x5B
va 0x1000 pte 0x21FC705B pa 0x87F1C000 perm 0x5B
va 0x2000 pte 0x21FC6C17 pa 0x87F1B000 perm 0x17
va 0x3000 pte 0x21FC6807 pa 0x87F1A000 perm 0x7
va 0x4000 pte 0x21FC64D7 pa 0x87F19000 perm 0xD7
va 0x5000 pte 0x0 pa 0x0 perm 0x0
va 0x6000 pte 0x0 pa 0x0 perm 0x0
va 0x7000 pte 0x0 pa 0x0 perm 0x0
va 0x8000 pte 0x0 pa 0x0 perm 0x0
va 0x9000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFF6000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFF7000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFF8000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFF9000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFFA000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFFB000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFFC000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFFD000 pte 0x21FD4813 pa 0x87F52000 perm 0x13
va 0x3FFFFFE000 pte 0x21FD00C7 pa 0x87F40000 perm 0xC7
va 0x3FFFFFF000 pte 0x2000184B pa 0x80006000 perm 0x4B
print_pgtbl: OK
ugetpid_test starting
ugetpid_test: OK
print_kpgtbl starting
page table 0x0000000087f22000
|- 0x0000000000000000 pte 0x0000000021fc7801 pa 0x0000000087f1e000
|- |- 0x0000000000000000 pte 0x0000000021fc7401 pa 0x0000000087f1d000
|- |- |- 0x0000000000000000 pte 0x0000000021fc7c5b pa 0x0000000087f1f000
|- |- |- 0x0000000000001000 pte 0x0000000021fc705b pa 0x0000000087f1c000
|- |- |- 0x0000000000002000 pte 0x0000000021fc6cd7 pa 0x0000000087f1b000
|- |- |- 0x0000000000003000 pte 0x0000000021fc6807 pa 0x0000000087f1a000
|- |- |- 0x0000000000004000 pte 0x0000000021fc64d7 pa 0x0000000087f19000
|- 0x0000003fc0000000 pte 0x0000000021fc8401 pa 0x0000000087f21000
|- |- 0x0000003fffe00000 pte 0x0000000021fc8001 pa 0x0000000087f20000
|- |- |- 0x0000003fffffd000 pte 0x0000000021fd4853 pa 0x0000000087f52000
|- |- |- 0x0000003fffffe000 pte 0x0000000021fd00c7 pa 0x0000000087f40000
|- |- |- 0x0000003ffffff000 pte 0x000000002000184b pa 0x0000000080006000
print_kpgtbl: OK
superpg_fork starting
pgtbltest: superpg_fork failed: pte different, pid=3
```

Read the tree against the `print_pgtbl` lines above it in the same run. Count
the tree's lines: one root, then two top-level entries (`|- `). The first covers
virtual addresses from `0x0`; under it one level-1 table, under that five
leaves: pages 0 to 4, the same five pages `print_pgtbl` printed. The second
top-level entry covers `0x3fc0000000` and up; under it one level-1 table
(`0x3fffe00000`) and three leaves: `USYSCALL`, the trapframe, the trampoline.
Eight leaves need five page-table pages: one root, two at level 1, two at
level 0.

Compare the leaf for `0x2000` with the `va 0x2000` line printed earlier in the
same run. In the run above the PTE was `0x21FC6C17` the first time and
`0x21fc6cd7` the second. Same page, two more bits set. The data page was read
and written between the two prints, and the hardware set A and D. Your values
will differ, but the pattern repeats on every run.

!!! theory "Connect to theory: a three-level tree that is only as big as what the program uses"

    **What the theory says.** With 39-bit addresses and 4 KB pages there are 27 bits
    of page number. Every level of the tree must be exactly one page of 512 entries,
    so the 27 bits are cut into three slices of 9
    ([Week 5, Section 3.1](../../w05/class-1.md#sec-3-1)), and the kernel walks the levels
    with one loop ([Week 5, Section 3.3](../../w05/class-1.md#sec-3-3)). A piece of the tree
    that would hold only invalid entries is never built, so the table costs space in
    proportion to what the program uses
    ([Week 5, Section 1.4](../../w05/class-1.md#sec-1-4)). The A and D bits are written by
    the hardware. An OS that evicts pages reads them to choose a victim
    ([Week 5, Sections 5.6](../../w05/class-2.md#sec-5-6) and
    [5.7](../../w05/class-2.md#sec-5-7)); xv6 has no eviction, so it never does.

    **What this run showed.** Two valid entries in the root, two tables at level 1, two
    at level 0, and eight leaves. The deepest lines carry three `|- ` markers. The
    data page's entry ended in `0x17` in the first print and in `0xd7` in the second.

    **Why the run confirms the theory.** Three markers deep is three levels, as the
    arithmetic predicted. Eight pages of memory cost five page-table pages, 20 KB, and
    nothing at all was built for the huge empty middle of the address space. The two
    extra bits in `0xd7` are bit 6 (A) and bit 7 (D). xv6 did not set them; the
    processor did, when the program read and wrote its data page between the prints.

The `pte` and `pa` values on your machine will differ. The `va` column and
the shape will match. `superpg_fork` still fails; that is [Step 4](step-4.md).

??? success "The answer: the two blanks"

    `PXSHIFT(level)` and `3 - level`. `PXSHIFT(2)` is 30, so entry `i` of the
    root covers `i << 30`; `PXSHIFT(1)` is 21; `PXSHIFT(0)` is 12, the page size.
    At level 2 a line gets one marker, at level 1 two, at level 0 three.

??? success "The answer: `vmprint_walk()` and `vmprint()`, complete (lines 144 to 171 of `kernel/vm.c`)"

    ```c linenums="144"
    #if defined(LAB_PGTBL) || defined(SOL_MMAP) || defined(SOL_COW)
    // Recursively print the valid entries of a page table.  `level` is the RISC-V
    // page-table level (2 = root, 0 = leaf); `va` is the base virtual address the
    // current table covers.  Each level of depth is marked with the NNU course
    // indent "|- " (MIT's reference uses " ..").
    static void
    vmprint_walk(pagetable_t pagetable, int level, uint64 va)
    {
      for(int i = 0; i < 512; i++){
        pte_t pte = pagetable[i];
        if((pte & PTE_V) == 0)
          continue;
        uint64 cva = va + ((uint64)i << PXSHIFT(level));
        for(int d = 0; d < 3 - level; d++)
          printf("|- ");
        printf("%p pte %p pa %p\n", (void*)cva, (void*)pte, (void*)PTE2PA(pte));
        // Recurse into interior nodes only (a leaf has R/W/X set).
        if(level > 0 && (pte & (PTE_R|PTE_W|PTE_X)) == 0)
          vmprint_walk((pagetable_t)PTE2PA(pte), level - 1, cva);
      }
    }

    void
    vmprint(pagetable_t pagetable) {
      printf("page table %p\n", (void*)pagetable);
      vmprint_walk(pagetable, 2, 0);
    }
    #endif
    ```

!!! question "Think"

    The root table has 512 entries and only two of them are valid, yet the
    process can use addresses from `0x0` to `0x3fffffffff`. Each of the 512 root
    entries covers how many bytes of virtual address space? (Use `PXSHIFT(2)`.) And
    how many page-table pages would this process need if the table were flat, one
    PTE per 4 KB page, instead of a tree?

    Answer it in your own words before you read on. The answer is not printed here.
