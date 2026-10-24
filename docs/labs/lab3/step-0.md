# Step 0. Read a real page table (no points, but do it first)

## Why this step

The question: what is actually in a page-table entry?

In the theory class ([Week 4, Section 5.2](../../w04/class-2.md#sec-5-2)) a page-table entry was a box with a frame number and a few flag
bits. Here you will see twenty of them, in hex, from a running process. The
picture to keep: a page table is the building's directory board. Each line says
"floor 3 is at physical address X, and you may read it but not write it".
Before you change the directory in Steps 1 to 5, read it once.

## The picture

```
  virtual address of pgtbltest            what is there           flags you will see
  ----------------------------------      -------------------     ------------------
  0x3FFFFFF000  TRAMPOLINE                kernel trap code        V R X A      (no U)
  0x3FFFFFE000  TRAPFRAME                 saved registers         V R W A D    (no U)
  0x3FFFFFD000  USYSCALL                  (empty until Step 1)    -
      ...                                 nothing mapped          pte 0x0
  0x4000        stack                     V R W U A D
  0x3000        guard page                V R W      (no U)
  0x2000        data                      V R W U
  0x1000        text, page 2              V R X U A
  0x0           text, page 1              V R X U A
```

The flag letters, from bit 0 up: V valid, R read, W write, X execute, U user
may access, G global, A accessed, D dirty. `kernel/riscv.h` defines `PTE_V`,
`PTE_R`, `PTE_W`, `PTE_X`, `PTE_U` as the matching bit masks. A and D are set
by the hardware, not by xv6, the first time the page is read or written.

## Do this

**At the xv6 `$` prompt:**

```
$ pgtbltest
```

## You should see

```
$ pgtbltest
print_pgtbl starting
va 0x0 pte 0x21FC885B pa 0x87F22000 perm 0x5B
va 0x1000 pte 0x21FC7C5B pa 0x87F1F000 perm 0x5B
va 0x2000 pte 0x21FC7817 pa 0x87F1E000 perm 0x17
va 0x3000 pte 0x21FC7407 pa 0x87F1D000 perm 0x7
va 0x4000 pte 0x21FC70D7 pa 0x87F1C000 perm 0xD7
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
va 0x3FFFFFD000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFFE000 pte 0x21FD08C7 pa 0x87F42000 perm 0xC7
va 0x3FFFFFF000 pte 0x2000184B pa 0x80006000 perm 0x4B
print_pgtbl: OK
ugetpid_test starting
usertrap(): unexpected scause 0xd pid=3
            sepc=0x79e stval=0x3fffffd000
```

Three things to read off this (your `pte` and `pa` values will differ; the
`va` and `perm` columns will match):

1. `print_pgtbl` asks for the PTE of the first ten pages and the last ten
   pages of the address space. Pages 0 to 4 are mapped; pages 5 to 9 are not
   (`pte 0x0`). Near the top, only the last two pages are mapped: the
   trapframe at `0x3FFFFFE000` and the trampoline at `0x3FFFFFF000`.
2. `perm` is the low 10 bits of the PTE. Decode `0x5B`: binary `101 1011`,
   so bits 0, 1, 3, 4 and 6 are set: V, R, X, U, A. A page you can read and
   execute as a user, which has been accessed. That is program text. `0x17` is
   V R W U: data. `0x7` is V R W with no U: the stack guard page, mapped,
   but not for the user. `0xD7` is V R W U A D: the stack, read and
   written already. `0xC7` is V R W A D with no U: the trapframe, which only
   the kernel touches. `0x4B` is V R X A, no U: the trampoline.
3. `pa` is the physical page. The trampoline's physical address is
   `0x80006000`, inside the kernel's own code, because the same physical page
   is mapped into every process and into the kernel.

Then `ugetpid_test` starts and the process dies: `usertrap(): unexpected
scause 0xd`, `stval=0x3fffffd000`. `scause 0xd` is a load page fault.
`stval` is the address that faulted: `0x3fffffd000` is `USYSCALL`. `ugetpid()`
read the shared page, and the shared page does not exist yet. That is [Step 1](step-1.md).
The `pid=3` and `sepc` will differ on your machine. Quit xv6 with Ctrl-a then x.

!!! theory "Connect to theory: a page-table entry is a frame number plus permission bits"

    **What the theory says.** One entry holds a frame number and, in its low bits,
    the flags V, R, W, X, U, G, A and D. The hardware sets A when the page is first
    used and D when it is first written
    ([Week 4, Section 5.2](../../w04/class-2.md#sec-5-2)). Week 4 stopped a real xv6
    process and printed its table with QEMU's `info mem`, which shows the same bits as
    letters ([Week 4, Section 5.3](../../w04/class-2.md#sec-5-3)). An access through an
    entry that is not valid traps ([Week 5, Section 4.3](../../w05/class-2.md#sec-4-3)).
    On xv6 the kernel finds the cause in `scause` and the address in `stval`
    ([Week 4, Extra 18](../../w04/class-2.md#extra-18)).

    **What this run showed.** Page 0 had `perm 0x5B`, which decodes to V, R, X, U and
    A. The entry at `0x3FFFFFD000` was `0x0`, and the first read of that address
    ended in `scause 0xd` with `stval=0x3fffffd000`.

    **Why the run confirms the theory.** In Week 4, `info mem` printed the code page
    of a different program as `r-xu-a-`. That is four of the same bits, plus V, which
    `info mem` leaves implied. So `pgtbltest` and `info mem` show the same kind of row:
    a frame number above, permission bits below. The A bit is set, and no line of the
    program wrote it. The fault is the other half of the picture. With no valid entry
    there is no translation, and the hardware reports the exact address it could not
    translate.

!!! question "Think"

    Page 3 (`va 0x3000`) has `perm 0x7`: V, R and W are set, but U is not. The
    process cannot touch it, yet the kernel keeps a physical page mapped there. Why
    does xv6 map a page the process is never allowed to use, instead of leaving
    that slot empty like pages 5 to 9?

    Answer it in your own words before you read on. The answer is not printed here.
