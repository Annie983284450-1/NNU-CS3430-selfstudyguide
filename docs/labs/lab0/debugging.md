# Working on the labs (and debugging xv6 when it breaks)

xv6 is a real operating system, just a small one, and it is probably unlike anything you have
worked on before: when your code is wrong the whole machine can hang, reboot in a loop, or
print a `panic` and stop. That is normal, and it is part of the point: you are learning to
work at the level where there is no app to catch your mistakes. This page is the toolkit that
gets you through every lab. Read it once now; come back to it the first time something breaks.

None of this is lab-specific. The same handful of techniques debug all five labs.

## First, set your expectations

These labs are conceptually short but detail-heavy. A task can look small, and still the
wrong pointer or a forgotten `brelse` will cost you an hour. So:

- **Spread the work over several days.** Do not start the night before. The hard part is
  understanding, and understanding needs a night's sleep in the middle.
- **Read the whole step before you type.** Each lab's step pages tell you exactly which file
  and function to change and what output to expect. The difficulty is meant to be in
  understanding *why*, not in guessing what to do.
- **Get one small thing working, then save a copy.** See "Keep checkpoints" below.

## Build, run, quit

```
$ make qemu           # build xv6 and boot it in the emulator
```

You are now at the xv6 shell (`$`). To **quit the emulator**: press `Ctrl-a`, release, then
press `x`. (Hold Ctrl and tap `a`, let go, then tap `x`. You will do this hundreds of times.)

`make qemu` rebuilds from scratch each time. If you only changed the disk contents and not the
kernel, `make qemu-fs` reuses the existing filesystem image, which is faster.

If the xv6 shell answers `exec <name> failed` when you run a program you just wrote, you
forgot to add it to `UPROGS` in the `Makefile`. That is the number-one beginner mistake.

## Keep checkpoints

Every time you get something to work, save a copy of the file you changed (for example
`cp user/sleep.c user/sleep.c.ok`), or copy the whole lab folder to a dated backup. Then a
later mistake can never cost you more than a few minutes: if a change makes everything worse
and you cannot see why, put the good copy back and start again from there.

## Debugging technique 1: print statements

The fastest tool you have is `printf`. Add a line that prints a value you are unsure about,
rebuild, and look. In kernel code use `printf(...)`; in user programs use `printf(...)` too
(xv6's is a small version: it understands `%d`, `%x`, `%c`, `%s`, `%p`, and `%ld`/`%lx`, but
not width like `%08x`).

When there is a lot of output, run xv6 inside `script` so you can search the log afterwards:

```
$ script                 # start logging to a file called 'typescript'
$ make qemu
...                      # do the thing, then quit qemu (Ctrl-a x)
$ exit                   # stop logging
$ grep something typescript
```

## Debugging technique 2: reading a panic

When the kernel hits something it cannot handle, it prints a `panic:` message and stops, or it
prints a trap message like:

```
usertrap(): unexpected scause 0x000000000000000d pid=3
            sepc=0x0000000000001d34 stval=0x0000000004008000
```

Read it carefully. It is telling you a lot:

- `panic: <message>` usually names the function or the check that failed. Search the source for
  that string.
- `scause` is the fault type. The two you will see most: **13 (0xd) = load page fault** (you
  read through a bad pointer) and **15 (0xf) = store page fault** (you wrote through one). A
  fault type of 12 is an instruction fault.
- `stval` is the address that caused the fault. If it is `0` you followed a **null pointer**;
  if it is some wild value you have a **corrupted pointer**. This is the single most useful
  number when a pointer is wrong.
- `sepc` is the instruction that faulted. To find out which line of code that is, look it up
  (next section).

## Debugging technique 3: finding the faulting line (kernel.asm / addr2line)

The build produces `kernel/kernel.asm`, a listing of the whole kernel interleaving C with the
assembly it compiled to, each line tagged with its address. When a kernel panic or gdb gives
you an address, search `kernel/kernel.asm` for that address to see exactly which C line it is.

The `usertrap()` message above is the other case. The fault happened in a user program (the
process with pid 3), so its `sepc` is an address inside that program, not inside the kernel.
Each user program has its own listing, `user/<name>.asm`, so search that file instead. Or
ask the tools directly, giving them the program's file (here, if the program was `find`):

```
$ addr2line -e user/_find 0x0000000000001d34
```

For a kernel address, give `kernel/kernel` instead of `user/_find`. (On macOS the tool is
called `riscv64-unknown-elf-addr2line`.)

## Debugging technique 4: gdb

For anything you cannot see with prints, use the debugger. Open **two terminals** in the same
folder. In the first:

```
$ make qemu-gdb          # boots xv6 and waits for a debugger to attach
```

In the second:

```
$ gdb-multiarch -x .gdbinit        # (on some systems: gdb, or riscv64-linux-gnu-gdb)
```

`-x .gdbinit` matters: `make qemu-gdb` writes a `.gdbinit` file in the lab folder that tells gdb
how to connect to the waiting kernel and where to find its symbols. If gdb prints a warning about
`.gdbinit` and then `c` reports *"The program is not being run,"* gdb refused to auto-load that
file for safety. Run this once, then try again:

```
echo "add-auto-load-safe-path $(pwd)/.gdbinit" >> ~/.gdbinit
```

The most useful gdb commands:

```
(gdb) b syscall          # set a breakpoint at the function 'syscall'
(gdb) c                  # continue running until a breakpoint hits
(gdb) n                  # step to the next line
(gdb) s                  # step into a function call
(gdb) p myvar            # print a variable
(gdb) p/x *p             # print *p in hex
(gdb) bt                 # backtrace: the chain of function calls that got you here
(gdb) layout src         # show the source alongside (q to leave the layout)
```

To find out where a **panic** came from, break at `panic` and print the backtrace:

```
(gdb) b panic
(gdb) c
(gdb) bt
```

The `bt` output is the list of functions that called each other to reach the panic. Read it
top to bottom to see how you got there.

## Debugging technique 5: a hang or a deadlock

If xv6 stops responding (no panic, just frozen), it is probably stuck in a loop or waiting on a
lock it will never get. Attach gdb as above, let it run with `c`, then press **Ctrl-C** in gdb
to interrupt the frozen kernel and type `bt` to see where it is stuck. In a kernel, a hang very
often means a lock-ordering problem.

For a program stuck in an infinite loop (common in `find` if you recurse into `.` and `..`),
just quit qemu with `Ctrl-a x` and re-read your loop.

## Debugging technique 6: the QEMU monitor and CPUS=1

QEMU has a built-in monitor for inspecting the virtual machine. From a running xv6, press
`Ctrl-a` then `c` to switch to the monitor (and again to switch back). Useful commands:

```
(qemu) info mem          # show the current page-table mappings
(qemu) info registers    # show the CPU registers
```

Bugs that involve more than one CPU are much easier to reason about with a
single CPU. Run:

```
$ make CPUS=1 qemu
```

Some labs pin the CPU count themselves (the `fs` lab, for example, runs with one CPU).

## Reading the autograder

Run the tests with `make grade` (or a single test, e.g. `./grade-lab-util sleep`, while you
work). Each test prints `OK` (with how long it took) or `FAIL` with a bit of the output it expected.
Read the expected-vs-actual snippet; it usually points straight at the bug. `make grade`
boots xv6 once per test, so a full run takes a few minutes; the file tests (`bigfile`,
`usertests`) are the slow ones, and that is normal.

## When to ask for help

These labs are meant to be challenging in the understanding, not in leaving you stuck for
hours. Sometimes you have used the techniques above and are still stuck: a fault you cannot
explain, a panic you cannot trace, a test you cannot make pass. Then ask for help, and give
the exact error and what you have already tried. A clear question is a far better use of
your time than staring at the bug alone.
