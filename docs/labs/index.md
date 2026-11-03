# Labs: the theory, run on a real kernel

The weekly guides explain how an operating system works. The labs make you watch it
happen. Each lab is a set of follow-along steps on xv6, the small teaching Unix that the
guides read their kernel code from ([Week 1, Extra 1](../w01/class-1.md#extra-1)). In each
step you build one small piece, run it, and compare what you see with a real captured run.
Several steps stop the kernel in the debugger, in the middle of the very mechanism a
theory class described.

## The labs, and the theory each one stands on

| Lab | What you build | Read first |
|---|---|---|
| [Lab 0 · setup](lab0/index.md) | Nothing graded: install the compiler, the emulator and the debugger, boot xv6, and follow one `write()` call into the kernel and back | [Week 1, first class](../w01/class-1.md) (user mode, kernel mode and the system call) |
| [Lab 1 · util](lab1/index.md) | Five small xv6 programs: `sleep`, `wf`, `memdump`, `find` and `find -exec` | [Week 2, first class](../w02/class-1.md) (the process, `fork`, `exec`, `wait`) and [second class](../w02/class-2.md) (the system call) |
| [Lab 2 · syscall](lab2/index.md) | Two new system calls, a sandbox inside the kernel's system-call dispatcher, and a program that reads memory another process left behind | [Week 2, second class](../w02/class-2.md) (traps and system calls), [Week 3](../w03/index.md) (address spaces), [Week 4, Section 3.3](../w04/class-1.md#sec-3-3) (the page allocator) |
| [Lab 3 · pgtbl](lab3/index.md) | A page shared read-only with the kernel, a printer for the whole three-level page table, 2 MB superpages with their own allocator, and a system-call counter read without a trap | [Week 4, second class](../w04/class-2.md) (pages, page-table entries, the TLB), [Week 5, first class](../w05/class-1.md) (multi-level page tables, xv6's `walk`) |
| [Lab 4 · lock](lab4/index.md) | One free-page list per CPU with stealing between them, a system call that counts the steals, and a reader-writer lock that protects a shared record | [Week 8](../w08/index.md) (the race, test-and-set, xv6's spin lock), [Week 9](../w09/index.md) (splitting what is shared, the reader-writer lock), [Week 7, Section 3.6](../w07/class-1.md#sec-3-6) (per-CPU queues and work stealing) |

Do the labs in order, starting with Lab 0, which sets up your computer. Lab 2 assumes the debugger skills from Lab 1, and Lab 3, though it starts from a fresh folder, reads `syscall()` the way Lab 2 taught.

## How a lab page is laid out

Lab 0 is setup, so it has its own shape: install, boot, one system call followed into the
kernel, and three toolkit pages that every later lab leans on. Labs 1 to 4 each have an
overview page (Labs 1 to 3 also a "Before you start" page), then one page per step. Every
step has the same parts, in the same order:

- **Why this step**: the one question the step answers, with an everyday picture of it.
- **The picture**: what the kernel does underneath, as a drawing.
- **Do this** (in Lab 4, **Procedure**): the commands to type and the code to write. Every command block says
  where to type it: on your own computer (Ubuntu, WSL or macOS), or at the xv6 prompt.
- **You should see**: the real output, captured on a real run.
- **The answer**: the complete standard code, folded. Try the step first, then click the
  box open and check your code line by line.
- **Connect to theory**: where the run proves something from a theory class, a box with
  a book icon links to that section of the weekly guide. It says what the theory claims,
  what the run showed, and why the output confirms the theory.
- **Think**: one question to answer in your own words. Its answer is not printed.

## What you need

A computer running Ubuntu, Windows with WSL2 (Ubuntu inside Windows), or macOS, with the
RISC-V cross compiler, `qemu-system-riscv64` to run xv6, and `gdb-multiarch` on Linux or
`riscv64-elf-gdb` on macOS for the debugger steps. [Lab 0](lab0/install.md) installs all
of them, step by step. Each lab starts from its own folder
(`lab1-util-student`, `lab2-syscall-student`, `lab3-pgtbl-student`, `lab4-lock-student`): a fresh copy of the xv6 source with that
lab's starter files.

## Where the labs come from

The labs are adapted from the lab assignments of MIT's course 6.1810, Operating System
Engineering, and run on MIT's xv6 for RISC-V (the 2025 lab tree). The step-by-step
guides, the drawings and the captured runs were written for this course.
