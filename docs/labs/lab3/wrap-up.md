# Wrap up: run the grader

**On Ubuntu (or Mac), in the lab folder:**

```
$ make grade
```

It rebuilds everything from clean, runs `pgtbltest`, `nsystest` and the full
`usertests -q`, and checks the two text files. The `usertests` run is the
slow part, about 80 to 90 seconds; the whole thing takes about two minutes.
`usertests` is worth no points by itself, but it is the proof that the
superpage code did not break ordinary processes.

## You should see

```
== Test pgtbltest == 
$ make qemu-gdb
(6.0s) 
== Test   pgtbltest: ugetpid == 
  pgtbltest: ugetpid: OK 
== Test   pgtbltest: print_kpgtbl == 
  pgtbltest: print_kpgtbl: OK 
== Test   pgtbltest: superpg == 
  pgtbltest: superpg: OK 
== Test nsyscall (NNU syscall-counter page) == 
$ make qemu-gdb
nsyscall (NNU syscall-counter page): OK (0.7s) 
== Test answers-pgtbl.txt == 
answers-pgtbl.txt: OK 
== Test usertests == 
$ make qemu-gdb
(85.4s) 
== Test time == 
time: OK 
Score: 46/46
```

The times in parentheses will differ. `Score: 46/46` is the line to
look for. (This capture is from a fresh lab folder plus exactly the code in this lab.)

## Everything you changed in this lab

| File | What |
|---|---|
| `kernel/proc.h` | `struct usyscall *usyscall;` at the end of `struct proc` |
| `kernel/proc.c` | allocate, free, map and unmap the `USYSCALL` page (four blocks) |
| `kernel/vm.c` | `vmprint_walk`, `vmprint`; `superwalk`, `mapsuperpage`, `walkleaf`, `superdemote`; new `walkaddr`, `uvmunmap`, `uvmalloc`, `uvmdealloc`, `uvmcopy` |
| `kernel/kalloc.c` | the 2 MB pool: `superkmem`, `kinit` split, `superfreerange`, `superfree`, `superalloc` |
| `kernel/defs.h` | two prototypes |
| `kernel/syscall.c` | `nsyscall++` in `syscall()` |
| `answers-pgtbl.txt`, `time.txt` | your answers; your hours |

## What you can do now

You can read a page-table entry and say what page it maps and who may touch
it. You can print a process's whole page table and count how much of the tree
is really there. You know why a 2 MB mapping needs an aligned block, what it
costs to free part of it, and how a kernel hands a live number to user space
without a trap. The lock lab stays in `kalloc.c` and
asks what happens when several CPUs want pages at once.
