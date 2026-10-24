# Before Step 0. What is already in the folder

Open the lab folder, then look before you type. Most of the lab's machinery was written for
you. Knowing where it is saves you from writing it twice.

**On Ubuntu (or Mac), in the lab folder:**

```
$ cd ~/lab3-pgtbl-student
$ ls
$ grep -n "USYSCALL" kernel/memlayout.h
$ grep -n "SUPERPG" kernel/riscv.h
$ grep -n "ugetpid\|ugetnsyscall\|pgpte\|kpgtbl" user/user.h
$ cat answers-pgtbl.txt
```

The first `ls` should show `Makefile`, `user`, `kernel`, `mkfs` and
`grade-lab-pgtbl` side by side. If it also shows another
`lab3-pgtbl-student`, you have a folder inside a folder; work in the one where
`Makefile` and `user/` sit next to each other. On Windows the lab must be in
your Ubuntu home folder, exactly as in [Labs 1](../../labs/lab1/before.md) and [2](../../labs/lab2/before.md): `pwd` must start with
`/home/`, not `/mnt/c/`.

The `grep` lines print the line numbers where each name is defined. Here is
what you are looking at:

| File | What it is | Which step uses it |
|---|---|---|
| `kernel/memlayout.h`, lines 65 to 73 | `USYSCALL`, the fixed virtual address of the shared page (one page below the trapframe), and `struct usyscall`, the two numbers that page holds: `pid` and `nsyscall`. Already written. | 1, 6 |
| `kernel/riscv.h`, lines 364 to 366 | `SUPERPGSIZE` (2 MB), `SUPERPGROUNDUP`, `SUPERPGROUNDDOWN`. Also `PX`, `PXSHIFT`, `PTE2PA`, `PTE_FLAGS`, `PTE_LEAF` further down. Already written. | 2, 3, 4, 5 |
| `kernel/vm.c`, lines 105 to 109 | `walk()` already stops at a level-1 PTE when that PTE is a leaf. So the lookup side of superpages is half done for you. | 4 |
| `kernel/sysproc.c`, lines 92 to 119 | two small system calls, `pgpte(va)` (returns the PTE for an address) and `kpgtbl()` (calls your `vmprint`). Already written. | 0, 2 |
| `user/ulib.c`, lines 166 to 183 | `ugetpid()` and `ugetnsyscall()`: they read the shared page directly. Already written. The kernel side is yours. | 1, 6 |
| `user/pgtbltest.c` | Complete. Runs five checks in order: `print_pgtbl`, `ugetpid_test`, `print_kpgtbl`, `superpg_fork`, `superpg_free`. Stops at the first failure. | 0 to 5 |
| `user/nsystest.c` | Complete. Checks that the system-call counter in the shared page behaves. | 6 |
| `answers-pgtbl.txt` | Three questions with empty `A:` lines. [Step 7](step-7.md) fills them. | 7 |

Both `pgtbltest` and `nsystest` are already in the Makefile's `UPROGS` list
(lines 257 to 260). You do not edit the Makefile in this lab.

Build it once now. The first build of a fresh tree compiles everything; on
most laptops that is under a minute.

**On Ubuntu (or Mac), in the lab folder:**

```
$ make clean
$ make qemu
```
