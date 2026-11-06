# Lab 1 · util: programs, processes and bytes

This is Lab 1, step by step: the five programs you write, one page per step.
Each step has the same shape:

0. Why: the one question this step answers, and an everyday picture of it.
1. A picture: what the kernel does underneath.
2. Do this: commands you type on your own laptop, and a code skeleton with blanks.
3. You should see: the real output, captured on a real run.
4. The answer: the complete standard code for the step, folded in a box. Try the step
   first, then open the box and check yours line by line.
5. Connect to theory: where the run proves something from the theory classes, a box
   links to that section of the self-study guide and says why the output confirms it.
6. Think: one question. Its answer is not printed here. Answer it in your own words.

## The five programs, and the one idea behind them

Each step answers one question, and each question comes out of the answer before it:

| Step | Program | The question it answers |
|---|---|---|
| 0 | boot, `ls`, `exec sleep failed` | What is the difference between a program and a process? |
| 1 | `sleep` | Your program is not allowed to touch the clock. So how does it wait? |
| 2 | `wf` | The kernel gave you bytes. Who decides where a word ends? |
| 3 | `memdump` | If memory is only bytes, what is a type? |
| 4 | `find` | Where does the operating system keep the names of your files? |
| 5 | `find -exec` | How do you build new behavior out of programs you already have? |

An operating system hands you two things: bytes, and processes. Steps 0, 1 and 5 are
about processes; steps 2, 3 and 4 are about bytes. Everything else in this lab is an
agreement about how to read the bytes and how to combine the processes.

## What you will create

Three new files, one function, three Makefile lines. Nothing else.

| What | Where | Step |
|---|---|---|
| `user/sleep.c` | new file, 13 lines | 1 |
| `user/wf.c` | new file, 85 lines | 2 |
| the function `memdump()` | at the bottom of `user/memdump.c`, which is already in your folder with `main()` written | 3 |
| `user/find.c` | new file, 75 lines after [Step 4](step-4.md), 112 lines after [Step 5](step-5.md) | 4 and 5 |
| `$U/_sleep\`, `$U/_wf\`, `$U/_find\` | three lines added to `UPROGS` in the `Makefile` | 1, 2, 4 |

No header file changes. Nothing in `kernel/`. `memdump` is already in `UPROGS`.

Everything in this lab runs in `lab1-util-student`, the lab folder. Keep two terminals open in that folder: one for xv6 (`make qemu`),
one for editing and for gdb.

Two prompts look the same. Your Ubuntu (or Mac) terminal shows a `$`, and so
does xv6 once it has booted. They are different machines. `make`, `nano`,
`gdb`, `grep` and `pwd` are Ubuntu commands. `ls`, `echo`, `cat`, `sleep`,
`wf`, `memdump` and `find` in the steps below are xv6 commands: they exist only
on xv6's disk, and you type them after `make qemu` has printed
`xv6 kernel is booting` and `init: starting sh`, until you quit with Ctrl-a
then x. To make this unmistakable, every command block in this lab is
labeled either **On Ubuntu (or Mac), in the lab folder** or **At the xv6 `$`
prompt**. Typing an xv6 command on Ubuntu gives `command not found` or
`No such file or directory`; typing `make` in xv6 gives `exec make failed`.

Where this connects to the theory: the first class of the processes week defined a
process (memory, registers, open files, one `struct proc`;
[Week 2, Sections 1.2 to 1.4](../../w02/class-1.md#sec-1-2)) and the three calls `fork`,
`exec` and `wait` ([Week 2, Chapters 2 and 3](../../w02/class-1.md#chapter-2)). The second
class showed how a system call crosses from your program into the kernel (number in
`a7`, `ecall`, the table in `syscall.c`, result back in `a0`;
[Week 2, Chapter 4](../../w02/class-2.md#chapter-4)). Every step below is one of those
ideas, made visible with a command. Where a step proves one of them, a
"Connect to theory" box says which, and why.
