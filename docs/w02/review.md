# Exercises and answers

## The week in twelve sentences {#the}

1. A process is a running program, and the kernel describes it completely by three things, its memory, its registers and its open files, plus a state: running, ready or blocked.
2. xv6 keeps each process as one `struct proc`, 64 of them in an array, so pausing a program means saving those fields and resuming it means loading them back.
3. A program cannot fill a record in the kernel's array itself, so it asks with a system call, and Unix's way of asking is `fork()`, which copies the caller.
4. `fork()` returns twice because the kernel copies every register and then sets one, `a0`, to 0 in the child, so the child gets 0 and the parent gets the child's pid.
5. After `fork()` two processes are ready and the scheduler picks the order, so a parent that needs its child to finish first calls `wait()`, which also collects the child's exit status and frees its zombie record.
6. `exec()` replaces the program inside the same process, keeping its pid and its open files, so starting a program takes both calls: fork, then exec in the child.
7. The gap between `fork()` and `exec()` lets the child rearrange its open files with ordinary calls, and because `open()` takes the lowest free descriptor, close 1 then open a file is all that redirection is.
8. A program runs directly on the real CPU for speed, and while it runs the kernel is not running at all, unless a device interrupts it.
9. The CPU therefore has two modes: user code is restricted by the hardware itself, and a trap (`ecall`) is the one way up, landing only at an address the kernel installed, with `sret` the way back down.
10. A system call is a six-station round trip through the trampoline, `usertrap`, the table lookup and back, and on the Ubuntu machine it costs about 100 ns, about 85 function calls.
11. A program that never asks for anything is stopped by a hardware timer that interrupts every few milliseconds, and two lines in `usertrap` turn each tick into a chance to switch; without them, one loop froze xv6.
12. The switch itself is 29 instructions that store 14 kernel registers into one process's record and load another's, the load of the stack pointer is the moment of the switch, and it costs about a microsecond.

## Exercises {#exercises}

Try each exercise on paper before looking at the answers, which follow this section. The first six are questions the slides put to the room; the others use the same steps on new numbers, read a real capture, or ask for the idea in your own words. Every method the answers use was taught in the body or in the Extra the exercise names, and each exercise names where.

**Exercise 1** ([Section 1.1](class-1.md#sec-1-1)). Name one thing the OS must save to stop a program and resume it later. Then name one more from each of the other two parts of a process, so that you have three, one per part.

**Exercise 2** ([Section 2.1](class-1.md#sec-2-1)). If the kernel copies a process exactly, how could the copy ever find out that it is the copy? Say which value differs, and which line of xv6 makes it differ.

**Exercise 3** ([Section 3.3](class-1.md#sec-3-3)). To run `wc p3.c > out.txt`, where would you put `close(1)` and `open("out.txt", ...)`: before `fork()`, between `fork()` and `exec()`, or after `exec()`? Say why each of the other two places fails.

**Exercise 4** ([Extra 9](class-1.md#extra-9)). Which of the four outputs A, B, C and D in Figure E9.3 can `./p1` produce on a terminal? In words: A is the greeting, then the parent's line, then the child's line. B is the greeting, then the child's line, then the parent's line. C is the greeting, the parent's line, the greeting again, then the child's line. D is the greeting and the parent's line only. More than one may be right. For each one you reject, say which wrong idea about `fork()` would produce it.

**Exercise 5** (Sections [5.1](class-2.md#sec-5-1) and [5.2](class-2.md#sec-5-2)). Direct execution means the program runs straight on the CPU. So how does the OS ever get the CPU back to switch to another process, even from a program that runs `while(1);`?

**Exercise 6** (Sections [4.2](class-2.md#sec-4-2) and [4.3](class-2.md#sec-4-3)). Why are some operations, such as talking to a disk, setting the timer or changing where traps land, forbidden in user mode? What does a program do instead when it needs one of them done?

**Exercise 7** (Sections [2.2](class-1.md#sec-2-2) to [2.4](class-1.md#sec-2-4)). A program prints the line `A` (with an end of line), then calls `fork()`. The child prints the line `B` and exits. The parent calls `wait(NULL)` and then prints the line `C`. Output goes to a terminal. List every order in which the three letters can appear. Then remove the `wait(NULL)` and list them again.

**Exercise 8** ([Section 3.4](class-1.md#sec-3-4)). The shell runs `sort < names.txt > sorted.txt`. `sort` is a standard program that prints the lines of its input in order; the `<` sign takes a program's input from a file ([Section 3.3](class-1.md#sec-3-3)), the way `>` sends its output to one. So `sort` must read from `names.txt` (slot 0) and write to `sorted.txt` (slot 1). To open a file for reading only, `open` takes the option `O_RDONLY`. Write the calls the child makes between `fork()` and `exec()`, in order, and draw the child's open-file table (slots 0 to 3) after each call. Start from slots 0, 1 and 2 pointing at the terminal and slot 3 free.

**Exercise 9** (Extras [3](class-1.md#extra-3) and [4](class-1.md#extra-4); [Appendix A](appendix.md#appendix-a)). Use the seven lines of the map in Figure E3.2, which are: `561b3e099000-561b3e09a000 r--p` (hold), `561b3e09a000-561b3e09b000 r-xp` (hold), `561b3e09b000-561b3e09c000 r--p` (hold), `561b3e09c000-561b3e09d000 r--p` (hold), `561b3e09d000-561b3e09e000 rw-p` (hold), `561b77547000-561b77568000 rw-p` ([heap]) and `7ffd5c468000-7ffd5c48c000 rw-p` ([stack]). (a) Which region holds the address `0x561b77550000`, and may the program write there? (b) Which region holds `0x561b3e09a500`, and may the program write there? (c) How many bytes, and how many 4 KB pages, does the region `561b3e09b000-561b3e09c000` cover?

**Exercise 10** (Sections [4.5](class-2.md#sec-4-5) and [4.6](class-2.md#sec-4-6)). A program calls `getpid()` in xv6. Walk the call through the six stations of [Section 4.6](class-2.md#sec-4-6): name the file of each station and say what happens there. The number of `getpid` in xv6 is 11 (a design fact listed in `kernel/syscall.h`). Which of the six steps of [Section 4.5](class-2.md#sec-4-5) does the hardware do on its own, and where between the stations do they happen?

**Exercise 11** ([Section 4.7](class-2.md#sec-4-7)). A program writes 1,000,000 bytes to a file. Version 1 calls `write()` once per byte. Version 2 collects the bytes in a buffer and calls `write()` once per 4,096 bytes. Using 100 ns per system call, how many system calls does each version make, and how much time goes to crossing into the kernel in each? (Count only the crossings, not the work of writing.)

**Exercise 12** ([Section 6.4](class-2.md#sec-6-4)). On another machine, the pinned `cswitch` program reports 100,000 round trips in 0.30 s, and a system call costs 0.15 µs there. How long is one round trip? Estimate the cost of one context switch, showing each step.

**Exercise 13** ([Section 6.3](class-2.md#sec-6-3)). In `swtch.S`, the 9th register saved is `s6`. At what offset from `a0` is it stored? Check your answer against Figure 6.4. Then say why `swtch` saves 14 registers when a trap saves 31.

**Exercise 14** (Sections [4.3](class-2.md#sec-4-3), [5.2](class-2.md#sec-5-2) and [6.2](class-2.md#sec-6-2); in your own words). Explain to a friend who has never taken this course, in five or six sentences, how one CPU can run many programs safely. Use these words, each once: user mode, trap, timer, context switch, struct proc.

## Answers {#answers}

**Answer 1.** Any one item from each part of [Section 1.2](class-1.md#sec-1-2). Memory: the variables of the program, for example the page where A's counter lives, or its stack. Registers: the program counter (where the program is), the stack pointer, or the register holding a loop counter. Open files: the table that says slot 1 goes to the terminal, so the output keeps going to the same place. These are the three parts of the machine state; the kernel keeps them in `struct proc` (memory in `pagetable` and `sz`, registers in `trapframe` and `context`, open files in `ofile`).

**Answer 2.** By the value `fork()` returns. The kernel copies everything, then sets one register in the child's saved registers, `a0`, the result register, to 0. That is line 280 of `kernel/proc.c`, `np->trapframe->a0 = 0;`. So the child sees `fork()` return 0, and the parent sees the child's pid. The copy finds out it is the copy by testing `rc == 0`.

**Answer 3.** Between `fork()` and `exec()`. Before `fork()` fails because the close and the open would happen in the shell itself: the shell's own output would go to `out.txt` from then on, including its next prompt. After `exec()` fails because a successful `exec()` never returns: the code that would do the close and the open is gone, replaced by `wc`, and `wc` does not know it was supposed to redirect anything. Between them, the child is still running the shell's code and is about to become `wc`, so it can rearrange its own table and leave the shell's untouched.

**Answer 4.** A and B are both possible. In A the parent printed first, in B the child; nothing promises the order, because after `fork()` the scheduler picks which ready process runs ([Section 2.3](class-1.md#sec-2-3)). C is wrong on a terminal: it prints the greeting twice, which would happen only if the child restarted at the top of `main()`. It does not; it starts inside `fork()`. (C is, however, exactly what a file receives when the output is redirected, because of the copied `printf` buffer of [Section 2.3](class-1.md#sec-2-3).) D is wrong: it shows only the parent's line, which would happen only if `fork()` returned once. It returns twice, once in each process.

**Answer 5.** With a hardware timer. At boot, in kernel mode, the OS installs a timer handler and starts the timer, which interrupts the CPU every few milliseconds; both steps are privileged, so no program can turn the timer off. Each interrupt saves the running program's state and enters the kernel, exactly like a trap, whatever the program is doing, even `while(1);`. In the handler the OS can decide to switch to another process. The cooperative alternative, waiting for the program to make a system call or yield, fails on one loop that never does.

**Answer 6.** Because a process cannot be trusted with them. Direct disk access could read another user's files, changing the timer could let a program keep the CPU forever, and changing where traps land could let a program run its own code in kernel mode and own the machine. So the CPU runs programs in user mode, where those instructions are refused by the hardware. When a program needs one of them done, it makes a system call: it puts the call's number in a register and traps into kernel mode, where the kernel checks the request and does the work on its behalf. Two modes plus one guarded doorway is limited direct execution.

**Answer 7.** With `wait`: `A` is printed once, before the fork, by the only process that exists. Then the child prints `B` and exits; the parent, if it runs first, blocks in `wait()` until the child has exited, and only then prints `C`. So the only order is A B C. Without `wait`: `A` is still printed once, first. After that, either process may run first, so both A B C and A C B are possible. (On a terminal the buffer is flushed at each end of line, so `A` cannot be printed twice; if the letters had no end of line and the output went to a file, `A` could appear twice, as in [Section 2.3](class-1.md#sec-2-3).)

**Answer 8.** In the child: `close(0);` then `open("names.txt", O_RDONLY);` (O_RDONLY means "open for reading only"), then `close(1);` then `open("sorted.txt", O_CREAT|O_WRONLY|O_TRUNC, 0644);`, then `execvp("sort", args);`. The table after each call:

| after | slot 0 | slot 1 | slot 2 | slot 3 |
|---|---|---|---|---|
| fork | terminal | terminal | terminal | free |
| close(0) | free | terminal | terminal | free |
| open names.txt | names.txt | terminal | terminal | free |
| close(1) | names.txt | free | terminal | free |
| open sorted.txt | names.txt | sorted.txt | terminal | free |
| exec sort | names.txt | sorted.txt | terminal | free |

Each `open` lands in the lowest free slot: 0 the first time (slots 0 and 3 were free), 1 the second time (slots 1 and 3 were free). `exec` keeps the table, so `sort` reads from 0 and writes to 1 without knowing either is a file.

**Answer 9.** (a) Compare digit by digit, as in [Extra 3](class-1.md#extra-3). `0x561b77550000` starts `561b775`, like both ends of the heap line `561b77547000-561b77568000`; its next digits, `50000`, lie between `47000` and `68000`. So it is in the heap, whose letters are `rw-p`: the program may read and write there. (b) `0x561b3e09a500` starts `561b3e09a`, like the start of the line `561b3e09a000-561b3e09b000`, and is below `561b3e09b000`. So it is in the code region, `r-xp`: the program may read it and run it as instructions, but not write there. (c) The two ends share `561b3e09`, so subtract the rest: 0xc000 − 0xb000 = 0x1000. In decimal, 0x1000 is 1 × 16^3 = 4,096 bytes, which is exactly one 4 KB page.

**Answer 10.** Station 1, `user/usys.S`: the stub puts 11 in `a7` (`li a7, SYS_getpid`) and runs `ecall`. Station 2, `kernel/trampoline.S` (`uservec`): saves the 31 user registers into the process's trapframe and switches to the kernel page table. Station 3, `kernel/trap.c` (`usertrap`): reads `scause`, sees 8 (a system call), adds 4 to the saved program counter so the return lands after the `ecall`, and calls `syscall()`. Station 4, `kernel/syscall.c`: reads 11 from the saved `a7`, calls the handler at position 11 of the table (`sys_getpid`), and stores the result, the pid, in the saved `a0`. Station 5, `kernel/trap.c` (`prepare_return`): sets `sstatus` so that `sret` returns to user mode, and `sepc` to the instruction after the `ecall`. Station 6, `kernel/trampoline.S` (`userret`): switches back to the user page table, restores the 31 registers (so `a0` now holds the pid), and runs `sret`. The hardware does two steps on its own ([Section 4.5](class-2.md#sec-4-5)), one between stations 1 and 2 and one at the end of station 6. At the `ecall`, it saves the program counter, records the cause, switches to kernel mode and jumps to the handler. At the `sret`, it drops to user mode and jumps to the saved program counter.

**Answer 11.** Version 1 makes one call per byte: 1,000,000 calls. At 100 ns each, that is 1,000,000 × 100 ns = 100,000,000 ns = 0.1 s spent only on crossing into the kernel. Version 2 makes one call per 4,096 bytes: 1,000,000 / 4,096 = 244.1, so 245 calls (the last one carries the leftover bytes). At 100 ns each, that is 245 × 100 ns = 24,500 ns = 24.5 µs. Check the ratio a second way: 0.1 s / 24.5 µs = 100,000 µs / 24.5 µs ≈ 4,000, close to the 4,096 bytes per call. This is why `printf` buffers.

**Answer 12.** One round trip: 0.30 s / 100,000 = 0.000003 s = 3.0 µs. Each round trip holds four system calls (two writes, two reads) and two switches. The system calls take 4 × 0.15 µs = 0.6 µs. That leaves 3.0 − 0.6 = 2.4 µs for two switches, so one switch costs about 2.4 / 2 = 1.2 µs.

**Answer 13.** The registers are stored 8 bytes apart, starting at offset 0 for `ra`. The 9th register sits 8 places after the 1st, so its offset is 8 × 8 = 64; the slide's line is `sd s6, 64(a0)`. (Check by counting: `ra` 0, `sp` 8, `s0` 16, `s1` 24, `s2` 32, `s3` 40, `s4` 48, `s5` 56, `s6` 64.) `swtch` saves only 14 because it is called like an ordinary C function: the caller-saved registers are already on the stack by C's rules, so only the callee-saved ones (`ra`, `sp`, `s0` to `s11`) need saving. A trap can land between any two instructions of a program that prepared nothing, so it must save all 31.

**Answer 14.** One possible answer: "Each program runs straight on the CPU, but in user mode, where the hardware refuses anything dangerous, like talking to the disk. When a program needs the OS, it makes a trap, which raises the CPU into the kernel at one entrance the OS chose at start-up. A program that never asks would keep the CPU forever, so the OS also starts a timer that interrupts every few milliseconds and brings the kernel back no matter what. When the kernel decides another program should run, it does a context switch: it saves the current program's registers and loads the next one's. Everything the kernel needs to pause and resume a program is kept in its struct proc, one record per process."
