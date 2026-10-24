# Lab 3 · pgtbl: read, print and reshape a page table

This is Lab 3, step by step: the kernel code you add, one page per step. Each step
has the same shape:

0. Why: the one question this step answers, and an everyday picture of it.
1. A picture: what the kernel does underneath.
2. Do this: commands you type on your own laptop, and the exact edits to make.
3. You should see: the real output, captured on a real run.
4. The answer: the complete standard code for the step, folded in a box. Try the step
   first, then open the box and check yours line by line.
5. Connect to theory: where the run proves something from the theory classes, a box
   links to that section of the self-study guide and says why the output confirms it.
6. Think: one question. Its answer is not printed here. Answer it in your own words.

## The eight steps, and the one idea behind them

[Lab 2](../../labs/lab2/index.md) was about the path a system call takes into the kernel. Lab 3 is about
the other big table the kernel keeps for every process: the page table, the
structure that turns every address your program uses into a real address in
memory.

| Step | What you do | The question it answers |
|---|---|---|
| 0 | read a real page table, line by line | What is actually in a page-table entry? |
| 1 | the `USYSCALL` page: `ugetpid()` | How can a program read kernel data without a system call? |
| 2 | `vmprint()`: print the whole tree | What does a three-level page table look like? |
| 3 | a pool of 2 MB blocks in `kalloc.c` | Why does a superpage need its own allocator? |
| 4 | map superpages in `uvmalloc`, and teach `fork` about them | How does one PTE cover 2 MB? |
| 5 | demote a superpage when part of it is freed | What happens when a 2 MB page is only half wanted? |
| 6 | a live system-call counter in the shared page | How does a kernel counter reach a user program for free? |
| 7 | `answers-pgtbl.txt` and `time.txt` | What did you see, in your own words? |

Everything in this lab happens in two files you already met in the theory classes,
`kernel/vm.c` (the page-table code) and `kernel/kalloc.c` (the physical page
allocator), plus `kernel/proc.c`, where each process gets its pages. One user
program, `pgtbltest`, drives Steps 0 to 5. It runs its checks in order and stops
at the first one that fails, so as you finish each step one more line of its
output turns to `OK`.

## What you will create

No new files and no new user programs. The test programs (`pgtbltest`,
`nsystest`) are already written and already in the Makefile. What you write is
kernel code, in six existing files, plus two text files.

| What | Where | Step |
|---|---|---|
| one field at the end of `struct proc` | `kernel/proc.h` | 1 |
| four blocks: allocate, free, map, unmap the `USYSCALL` page | `kernel/proc.c` | 1 |
| `vmprint_walk()` and the body of `vmprint()` | `kernel/vm.c`, replacing the stub | 2 |
| the superpage pool: `superkmem`, `superfreerange()`, `superfree()`, `superalloc()`, and two lines in `kinit()` | `kernel/kalloc.c` | 3 |
| two prototypes | `kernel/defs.h`, after `kinit` | 3 |
| `superwalk()`, `mapsuperpage()`, `walkleaf()`, and new versions of `walkaddr`, `uvmunmap`, `uvmalloc`, `uvmcopy` | `kernel/vm.c` | 4 |
| `superdemote()` and a new version of `uvmdealloc` | `kernel/vm.c` | 5 |
| four lines in `syscall()` | `kernel/syscall.c` | 6 |
| your written answers; the hours you spent | `answers-pgtbl.txt`, `time.txt` (new) | 7 |

Eight files in all (`proc.h`, `proc.c`, `vm.c`, `kalloc.c`, `defs.h`,
`syscall.c`, `answers-pgtbl.txt`, `time.txt`). `vm.c` is edited in three
steps. The Makefile is not touched in this lab.

Everything in this lab runs in `lab3-pgtbl-student`, the lab folder. It is a fresh copy of xv6. Nothing you wrote in Lab 1 or Lab 2 is
in it, and nothing from those labs is needed. Keep two terminals open in that
folder: one for xv6 (`make qemu`), one for editing.

Two prompts look the same. Your Ubuntu (or Mac) terminal shows a `$`, and so
does xv6 once it has booted. They are different machines. `make`, `nano`,
`grep -n` and `pwd` are Ubuntu commands. `pgtbltest` and `nsystest` in the
steps below are xv6 commands: they exist only on xv6's disk, and you type them
after `make qemu` has printed `xv6 kernel is booting` and `init: starting sh`,
until you quit with Ctrl-a then x. Every command block in this lab is labeled
either **On Ubuntu (or Mac), in the lab folder** or **At the xv6 `$` prompt**.
If you type `make` at the xv6 prompt you get `exec make failed`. If you type
`pgtbltest` at the Ubuntu prompt you get `pgtbltest: command not found`.

One more thing about the code you will add. Most of it sits between
`#ifdef LAB_PGTBL` and `#endif`. This xv6 tree is shared by several labs, and
`conf/lab.mk` says `LAB=pgtbl`, so in your folder those lines are always
compiled. The guards are there so the same file still builds for a different
lab. Type them as shown; they are part of the standard answer.

Where this connects to the theory: [Weeks 3](../../w03/index.md), [4](../../w04/index.md) and
[5](../../w05/index.md) said that every address a program uses is a virtual address, that the hardware translates it through a
page table the kernel built, and that a flat table would be far too big, so
the table is a tree (OSTEP chapters 18 and 20, xv6 book chapter 3 and its
Figure 3.2). In this lab you hold that tree in your hands: you print it, you add
a page to it, and you change what one of its entries means.
