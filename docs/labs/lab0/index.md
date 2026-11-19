# Lab 0 · setup: build and boot xv6

Every lab runs xv6, the small teaching Unix that the weekly guides read their kernel code
from, on your own computer. xv6 is written for the RISC-V processor, and your computer
almost certainly has a different one (x86, or Apple silicon). So you need three tools:

- a **cross-compiler**, a compiler that runs on your computer but produces RISC-V code;
- **QEMU**, an emulator: a program that pretends to be a RISC-V computer, so xv6 can boot
  inside it;
- **gdb**, the debugger, which can stop the emulated computer and show what the kernel is
  doing.

This lab installs the three tools and checks that xv6 boots. Nothing in it is graded. If
there is time left, it then follows one system call from a small program into the kernel
and back, which is the idea Lab 1 and Lab 2 are built on.

## The pages of this lab

| Page | What you do |
|---|---|
| [Install the tools](../../labs/lab0/install.md) | Install the compiler, the emulator and the debugger on Windows (through WSL2), macOS or Linux |
| [Get the code and boot xv6](../../labs/lab0/boot.md) | Unzip the xv6 source, run `make qemu`, and reach xv6's `$` prompt. Setup is done here |
| [One system call: `sysdemo`](../../labs/lab0/sysdemo.md) | Write a small program that makes three system calls, and follow one `write` through five files of the kernel |
| [Watch it under gdb](../../labs/lab0/gdb.md) | Optional: stop the kernel inside `sys_write` and read the registers your program left behind |
| [Wrap up: two shell facts](../../labs/lab0/wrap-up.md) | Why files you make inside xv6 disappear, and how small xv6 is |

## The toolkit, for every lab

Three more pages are not steps of this lab. They are the reference you come back to in
every lab:

- [Working on the labs, and debugging xv6](../../labs/lab0/debugging.md): building and quitting,
  print debugging, reading a panic, gdb, the QEMU monitor. Read it once now, and come back
  to it the first time something breaks.
- [The C you need](../../labs/lab0/c-guide.md): the narrow slice of C these labs use. Read it
  now if C is new to you.
- [The autograder](../../labs/lab0/grader.md): how to run `make grade`, which starts with Lab 1.

## When setup is done

You are done when three things work on your own computer: `make qemu` boots xv6 to its `$`
prompt, the cross-compiler prints its version, and `qemu-system-riscv64` prints its
version. Have all three working before you start [Lab 1](../../labs/lab1/index.md), so that your
time there goes to the lab and not to installation.
