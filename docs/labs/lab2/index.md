# Lab 2 · syscall: two new system calls, and a sandbox

This is Lab 2, step by step: the two system calls you add to the kernel, one page
per step. Each step has the same shape:

0. Why: the one question this step answers, and an everyday picture of it.
1. A picture: what the kernel does underneath.
2. Do this: commands you type on your own laptop, and the exact edits to make.
3. You should see: the real output, captured on a real run.
4. The answer: the complete standard code for the step, folded in a box. Try the step
   first, then open the box and check yours line by line.
5. Connect to theory: where the run proves something from the theory classes, a box
   links to that section of the self-study guide and says why the output confirms it.
6. Think: one question. Its answer is not printed here. Answer it in your own words.

## The seven steps, and the one idea behind them

Lab 1 was about using system calls. Lab 2 is about the other side of the window:
you add two system calls to the kernel, and you put a checkpoint on the path every
system call takes.

| Step | What you do | The question it answers |
|---|---|---|
| 0 | gdb at `syscall()`, and one deliberate crash | What happens in the kernel between `ecall` and the handler? |
| 1 | wire `interpose()` end to end | What does it take to add one system call? |
| 2 | the reject check in `syscall()` | Where is the one place the kernel can say no? |
| 3 | inherit the mask in `kfork()` | Why does a sandbox have to survive `fork`? |
| 4 | the allowed path | How do you let exactly one file through? |
| 5 | `attack.c` | What is left in memory after a process exits? |
| 6 | `blocked()` | How does a kernel counter get back to a user program? |

Every system call in xv6 goes through one function, `syscall()` in
`kernel/syscall.c`. [Step 0](step-0.md) shows you that function. Steps 1 to 4 and 6 add code
to it and around it. [Step 5](step-5.md) is the odd one: it does not touch the path, it shows
you what a kernel that forgets one line hands out to the next program.

## What you will create

No new user programs. The programs for this lab (`sandbox`, `secret`,
`blockcount`) are already written and sit in `user/`. What you write is kernel
code, plus one user program, `attack.c`, whose file exists with an empty `main`.

| What | Where | Step |
|---|---|---|
| two `#define` lines | `kernel/syscall.h`, after `SYS_close` | 1 |
| two prototypes | `user/user.h`, after `int pause(int);` | 1 |
| two `entry(...)` lines | `user/usys.pl`, at the end | 1 |
| three fields | `kernel/proc.h`, end of `struct proc` | 1 |
| three assignments | `kernel/proc.c`, in `allocproc()` | 1 |
| the function `sys_interpose()` | `kernel/sysproc.c`, at the end of the file | 1 |
| one `extern` line and one table line | `kernel/syscall.c` | 1 |
| `$U/_sandbox` | `Makefile`, in the `ifeq ($(LAB),syscall)` block | 1 |
| the reject check | `kernel/syscall.c`, inside `syscall()` | 2, then rewritten in 4 |
| two lines | `kernel/proc.c`, in `kfork()` | 3 |
| the function `interpose_reject()` | `kernel/syscall.c`, above `syscall()` | 4 |
| the body of `main()` | `user/attack.c`, which exists with an empty `main` | 5 |
| the function `sys_blocked()`, one `extern`, one table line, `$U/_blockcount` | `kernel/sysproc.c`, `kernel/syscall.c`, `Makefile` | 6 |

Nine files in all (`syscall.h`, `user.h`, `usys.pl`, `proc.h`, `proc.c`,
`sysproc.c`, `syscall.c`, `attack.c`, `Makefile`), several of them touched in more
than one step. Nothing else changes. `answers-syscall.txt`, in the top folder, is
where your [Step 0](step-0.md) answers go so that `make grade` can see them.

Everything in this lab runs in `lab2-syscall-student`, the lab folder. It is a fresh copy of xv6. Nothing you wrote in Lab 1 is in it, and
nothing from Lab 1 is needed. Keep two terminals open in that folder: one for xv6
(`make qemu`), one for editing and for gdb.

Two prompts look the same. Your Ubuntu (or Mac) terminal shows a `$`, and so
does xv6 once it has booted. They are different machines. `make`, `nano`,
`gdb-multiarch`, `grep -n` and `pwd` are Ubuntu commands. `ls`, `cat`, `echo`,
`sandbox`, `secret`, `attack` and `blockcount` in the steps below are xv6
commands: they exist only on xv6's disk, and you type them after `make qemu` has
printed `xv6 kernel is booting` and `init: starting sh`, until you quit with
Ctrl-a then x. Every command block in this lab is labeled either **On Ubuntu
(or Mac), in the lab folder** or **At the xv6 `$` prompt**. If you type an
Ubuntu command such as `grep -n interpose user/user.h` at the xv6 prompt, xv6's
own small `grep` answers `grep: cannot open interpose`, because it has no `-n`
option and it treats every word as a file name. If you type `make` in xv6 you get
`exec make failed`.

Where this connects to the theory: the class on limited direct execution
([Week 2, Chapter 4](../../w02/class-2.md#chapter-4)) said that a user program cannot touch the hardware, so it puts a
number in a register and executes a trap instruction, and the kernel takes over
at a fixed entry point, does the work, and returns. In [Lab 1, Step 1](../../labs/lab1/step-1.md), you stopped
the kernel inside `sys_pause` and read that number, 13, out of register `a7`.
This lab lives one function higher up the same call chain, in `syscall()`, the
function that read `a7` and looked 13 up in a table.
