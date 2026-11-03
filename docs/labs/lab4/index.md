# Lab 4 · lock: per-CPU memory, and a reader-writer lock

This is Lab 4, step by step: the kernel code you add, one page per step.
Each step has the same shape:

0. Why: the one question this step answers, and an everyday picture of it.
1. A picture: what the kernel does underneath.
2. Procedure: the commands you type on your own laptop, and the exact edits to make.
3. You should see: the real output, captured on a real run.
4. The answer: the complete standard code for the step, folded in a box. Try the step
   first, then open the box and check yours line by line.
5. Connect to theory: where the run proves something from the theory classes, a box
   links to that section of the self-study guide and says why the output confirms it.
6. Think: one question. Its answer is not printed here. Answer it in your own words.

## The seven steps, and the one idea behind them

Lab 3 was about the page table, the structure that turns a virtual address
into a physical one. Lab 4 is about what happens when four CPUs want the same
kernel data at the same time. The kernel protects shared data with locks, and
a lock makes CPUs take turns. When many CPUs keep asking for the same lock,
they spend their time waiting in line instead of working. That waiting is
called lock contention, and this lab is about measuring it and then designing
it away.

| Step | What you do | The question it answers |
|---|---|---|
| 0 | check your laptop's cores; run the tests on the starter | How much time do four CPUs waste on one lock? |
| 1 | one free list per CPU in `kalloc.c` | How do you split one shared structure into four? |
| 2 | steal from another CPU when yours is empty | What does a CPU do when its share runs out? |
| 3 | `kmemsteals()`: a system call that counts the steals | How do you make kernel behaviour visible from a program? |
| 4 | a reader-writer lock in `spinlock.c` | How can many readers share a lock, and still keep writers safe? |
| 5 | `rwshared`: the new lock protecting a real record | What does a torn read look like, and what stops it? |
| 6 | `time.txt` and `make grade` | Did it all hold together? |

Within a step the numbering is always the same: `.1` why, `.2` the picture, `.3` the
procedure (`.3a`, `.3b` for its parts), `.4` you should see, `.5` the answer (`.5a`,
`.5b`, ... and a "reading the answer" section), `.6` think. So "2.3" always means
[Step 2](step-2.md)'s procedure.

Two things are measured in this lab, and they are measured differently from
every other lab you have done. `kalloctest` counts how many times a CPU spun
on a `kmem` lock and failed to get it. `rwlktest` checks that four kernel
threads, one per CPU, really ran at the same time. Both numbers depend on how
many real CPU cores your laptop has. [Step 0](step-0.md) sorts you into a group, A, B or
C, and from then on every "You should see" block in this lab says what each
group sees. Everything else in the lab (the code, the correctness tests,
`usertests`) is the same for everyone.

## What you will create

No new files until [Step 6](step-6.md) (`time.txt`). The test programs (`kalloctest`,
`rwlktest`, `steals`, `rwsharedtest`) are already written. What you write is
kernel code in two files, plus the plumbing for one new system call.

| What | Where | Step |
|---|---|---|
| `kmem` becomes an array of per-CPU lists; `kinit`, `freerange`, `kfree`, `kalloc` rewritten | `kernel/kalloc.c` | 1 |
| the steal loop at the end of `kalloc()`, and the `nsteal` counter | `kernel/kalloc.c` | 2 |
| `kmemsteals()` | `kernel/kalloc.c` | 3 |
| the `kmemsteals` system call: one line each | `kernel/defs.h` (two lines), `kernel/syscall.h`, `kernel/syscall.c`, `kernel/sysproc.c` (a function), `user/user.h`, `user/usys.pl` | 3 |
| `$U/_steals\` in `UPROGS` | `Makefile` | 3 |
| the fields of `struct rwspinlock` | `kernel/spinlock.h` | 4 |
| `read_acquire_inner`, `read_release_inner`, `write_acquire_inner`, `write_release_inner`, `initrwlock` | `kernel/spinlock.c` | 4 |
| the bodies of `sys_rwset` and `sys_rwget` | `kernel/spinlock.c` | 5 |
| the hours you spent | `time.txt` (new) | 6 |

Ten files in all (`kalloc.c`, `defs.h`, `syscall.h`, `syscall.c`,
`sysproc.c`, `user.h`, `usys.pl`, `Makefile`, `spinlock.h`, `spinlock.c`) plus
`time.txt`. `kalloc.c` is edited in three steps and `spinlock.c` in two.

Everything in this lab runs in `lab4-lock-student`, the lab folder. It is a fresh copy of xv6. Nothing you wrote in Labs 1 to 3 is in
it, and nothing from those labs is needed. Keep two terminals open in that
folder: one for xv6 (`make qemu`), one for editing.

Two prompts look the same. Your Ubuntu (or Mac) terminal shows a `$`, and so
does xv6 once it has booted. They are different machines. `make`, `nano`,
`grep -n`, `lscpu` and `pwd` are Ubuntu commands. `kalloctest`, `steals`,
`rwlktest` and `rwsharedtest` in the steps below are xv6 commands: they exist
only on xv6's disk, and you type them after `make qemu` has printed
`xv6 kernel is booting` and `init: starting sh`, until you quit with Ctrl-a
then x. Every command block in this lab is labeled either **On Ubuntu (or
Mac), in the lab folder** or **At the xv6 `$` prompt**. If you type `make` at
the xv6 prompt you get `exec make failed`. If you type `kalloctest` at the
Ubuntu prompt you get `kalloctest: command not found`.

One thing about this lab's xv6: it boots with four CPUs. `make qemu` here
means `-smp 4` (the Makefile sets `CPUS := 4` for the lock lab), so the
`kalloc` and `kfree` you edit really do run on four CPUs at once. Lab 3's
`CPUS=1` is not used anywhere in this lab, and `make qemu-gdb` is not needed.

Where this connects to the theory: [Week 8](../../w08/index.md) showed the `kalloc` pop race
on two CPUs ([Section 2.7](../../w08/class-1.md#sec-2-7)), the test-and-set instruction and
xv6's `acquire()` / `release()` built on it ([Section 5.3](../../w08/class-2.md#sec-5-3)), and
what waiting for a lock costs ([Section 6.6](../../w08/class-2.md#sec-6-6)).
[Week 9](../../w09/index.md) gave the fix for a contended counter, keep a copy per CPU and only
occasionally touch the shared one (the approximate counter,
[Section 2.3](../../w09/class-1.md#sec-2-3), and "split what is shared",
[Section 2.13](../../w09/class-1.md#sec-2-13)), and the reader-writer lock
([Section 6.5](../../w09/class-2.md#sec-6-5)). [Week 7](../../w07/index.md) showed per-CPU run queues
with migration ([Section 3.6](../../w07/class-1.md#sec-3-6)), which is the same idea as stealing
pages. Week 2's timer interrupt ([Section 5.2](../../w02/class-2.md#sec-5-2)) is why `cpuid()`
needs interrupts off.
