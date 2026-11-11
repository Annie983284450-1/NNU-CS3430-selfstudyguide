# Step 1. `sleep`: one system call, seen from both sides

## Why this step

The question: your program is not allowed to touch the clock. So how does it wait?

Your code runs in user mode. There is a wall between it and the hardware: it cannot read
the clock, the disk or the screen. What there is, is a window in the wall. You write what
you want on a form, push it through the window, and wait. The number on the form says
which form it is; 13 means `pause`. That is a system call. In part D you will stop the
kernel in the middle of this one and read the form number, 13, and your argument, 10, out
of the real registers.

## The picture

```
   your program (user mode)                 the kernel (supervisor mode)
   +----------------------------+           +-----------------------------+
   | sleep.c                    |           | syscall.c                   |
   |   pause(10)  ---> usys.S:  |           |   num = trapframe->a7  (13) |
   |     li a7, 13              |   ecall   |   a0 = syscalls[13]()       |
   |     ecall  ----------------+---------> |          |                  |
   |     ret    <---------------+---------  |          v                  |
   |                            |  sret     | sysproc.c: sys_pause()      |
   |   exit(0)                  |           |   n = a0 (10)               |
   +----------------------------+           |   sleep until ticks+10      |
                                            +-----------------------------+
```

`pause` is not a function in your program. Your 10 goes into register `a0` the way
any function argument does; the compiler puts it there. Then a three-line stub
(`user/usys.S`, generated at build time by `user/usys.pl`) puts the number 13 in
register `a7` and executes `ecall`.
The CPU switches to supervisor mode and jumps into the kernel. The kernel reads
`a7`, looks up entry 13 in its table, and calls `sys_pause`. That is the
system call of the theory class, and in a minute you will stop the kernel at exactly that point
and look at the registers.

## Do this, part A: read the model program

Open `user/echo.c` in your editor. It is 19 lines. Find three things:

- where `argc` and `argv` come from (line 6),
- how it writes to the screen (line 11: `write(1, ...)`, file descriptor 1),
- how it ends (line 18: `exit(0)`, never `return`).

Now open `user/user.h` and find line 25:

```c
int pause(int);
```

That is the only declaration you need. `atoi` is in `user/ulib.c`, already
linked.

## Do this, part B: write `user/sleep.c`

Create the file. Fill in the three blanks.

```c
#include "kernel/types.h"
#include "user/user.h"

int
main(int argc, char *argv[])
{
  if(argc != ____){                       // (1) how many words is "sleep 10"?
    fprintf(2, "usage: sleep <ticks>\n");
    exit(1);
  }
  pause(________(argv[1]));               // (2) text -> number
  exit(__);                               // (3) success
}
```

Hints for the three blanks. Try them before you read the answer below.

1. `argc` counts every word on the command line, including the program's own
   name. Count `sleep 10` that way. `echo.c` line 10 starts its loop at `i = 1`
   for a reason: `argv[0]` is the program name.
2. `argv[1]` is the text `"10"`, two characters, not the number ten. `pause`
   takes an `int`. Open `user/ulib.c` and look for a function whose name starts
   with `ato`. Its declaration is in `user/user.h`, under the `// ulib.c`
   comment.
3. `echo.c` line 18.

Four things that bite:

- The call is `pause`, not `sleep`. `user/user.h` line 25 declares
  `int pause(int);`. There is no function called `sleep` in this xv6. If you
  write `sleep(...)` inside `sleep.c`, the compiler says
  `implicit declaration of function 'sleep'` and the build stops. `sleep` is
  only the name of your program.
- Two `#include` lines are enough. `kernel/stat.h` is for programs that call
  `stat` or `fstat` (`ls.c`, and your `find` in [Step 4](step-4.md)). `echo.c` includes it
  and does not need it either. Adding it here does no harm.
- The skeleton does not compile as it is. `____` is not C. If you save it with
  the blanks still in and run `make qemu`, make stops with three errors and xv6
  never boots. Fill the blanks first.
- Create the file inside Ubuntu, in `~/lab1-util-student/user/`, with one of
  the three ways from "Before [Step 0](step-0.md)". `nano user/sleep.c` creates it if it does
  not exist.

Register it. Open the `Makefile`, find the `UPROGS=\` block, and add one line at
the end of the list, with the underscore and the backslash:

```make
	$U/_dorphan\
	$U/_sleep\
```

Before you run, three checks in the same terminal. They take ten seconds and
save ten minutes:

**On Ubuntu (or Mac), in the lab folder:**

```
$ pwd
$ ls user/sleep.c
$ grep -n '_sleep' Makefile
```

You should see your Ubuntu lab folder, the file name echoed back, and one line
like `198:	$U/_sleep\`. If any of the three prints something else, fix that
before `make qemu`.

??? success "The answer: `user/sleep.c`, complete (13 lines)"

    ```c linenums="1"
    #include "kernel/types.h"
    #include "user/user.h"

    int
    main(int argc, char *argv[])
    {
      if(argc != 2){
        fprintf(2, "usage: sleep <ticks>\n");
        exit(1);
      }
      pause(atoi(argv[1]));
      exit(0);
    }
    ```

    (1) `argc` counts the program name too, so `sleep 10` is `argc == 2`.
    (2) `atoi`. `argv[1]` is the string `"10"`, not the number 10.
    (3) `exit(0)`. A user program in xv6 must end with `exit`, not `return`.

    Nothing else. The kernel already has `sys_pause`. Your whole job in this step is
    to check the argument and make one system call.

## Do this, part C: run it

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ sleep
$ sleep 10
$ echo done
```

## You should see

```
$ sleep
usage: sleep <ticks>
$ sleep 10
$ echo done
done
```

`sleep 10` takes about one second and prints nothing. If it returns at once,
your `argc` test is wrong. If it prints the usage line for `sleep 10`, the
number in blank (1) is wrong. If it never comes back, you passed `argv[1]`
without converting it; Ctrl-a then x, and fix blank (2).

## Do this, part D: watch the system call from inside the kernel

This is the part you have not done before. Two terminals, both in
`lab1-util-student`.

Terminal 1, on Ubuntu (or Mac), in the lab folder:

```
$ make CPUS=1 qemu-gdb
```

Nothing appears. QEMU is paused, waiting for a debugger.

Terminal 2, also on Ubuntu (or Mac), in the lab folder:

```
$ gdb-multiarch -x .gdbinit          # Linux / WSL2
$ riscv64-elf-gdb -x .gdbinit        # macOS
```

If gdb complains about auto-loading and later says "The program is not being
run", do this once on Ubuntu (or Mac) and start gdb again:

```
$ echo "add-auto-load-safe-path $(pwd)/.gdbinit" >> ~/.gdbinit
```

At the `(gdb)` prompt, type these two commands:

```
(gdb) break sys_pause
(gdb) continue
```

Now go to Terminal 1. xv6 boots. At the xv6 `$` prompt type `sleep 10`. The prompt
freezes: the kernel has stopped inside `sys_pause` and gdb is holding it.

Back in Terminal 2, type each of these and read the answer:

```
(gdb) bt
(gdb) print myproc()->name
(gdb) print myproc()->pid
(gdb) print/d myproc()->trapframe->a7
(gdb) print/d myproc()->trapframe->a0
(gdb) print myproc()->state
(gdb) print ticks
(gdb) next
(gdb) next
(gdb) next
(gdb) print n
(gdb) finish
(gdb) print ticks
(gdb) continue
```

## You should see

```
(gdb) break sys_pause
Breakpoint 1 at 0x80001e1e: file kernel/sysproc.c, line 67.
(gdb) continue

Breakpoint 1, sys_pause () at kernel/sysproc.c:67
67	{
(gdb) bt
#0  sys_pause () at kernel/sysproc.c:67
#1  0x0000000080001d18 in syscall () at kernel/syscall.c:141
#2  0x0000000080001a9c in usertrap () at kernel/trap.c:68
#3  0x0000003ffffff09c in ?? ()
(gdb) print myproc()->name
$1 = "sleep\000\000\000\000\000\000\000\000\000\000"
(gdb) print myproc()->pid
$2 = 3
(gdb) print/d myproc()->trapframe->a7
$3 = 13
(gdb) print/d myproc()->trapframe->a0
$4 = 10
(gdb) print myproc()->state
$5 = RUNNING
(gdb) print ticks
$6 = 19
(gdb) next
71	  argint(0, &n);
(gdb) next
72	  if(n < 0)
(gdb) next
74	  acquire(&tickslock);
(gdb) print n
$7 = 10
(gdb) finish
0x0000000080001d18 in syscall () at kernel/syscall.c:141
141	    p->trapframe->a0 = syscalls[num]();
Value returned is $8 = 0
(gdb) print ticks
$9 = 29
(gdb) continue
```

Your addresses and pids may differ. The numbers 13, 10, and the difference of
10 ticks will not.

Read it bottom-up with the picture. `bt` (backtrace) is the chain of calls that
brought the CPU here: `usertrap` (the trap handler, `trap.c` 68) called
`syscall` (`syscall.c` 141, the table lookup) which called `sys_pause`. Frame
#3 has no name: it is the trampoline (`kernel/trampoline.S`), the page of
assembly the CPU jumped to on `ecall`. It saved your 32 registers into the
trapframe and called `usertrap`. Below it, not shown, is your program.
`a7` holds 13. Open `kernel/syscall.h` line 14: `#define SYS_pause 13`. `a0`
holds 10, your argument. The three `next` commands step through `sys_pause`
one line at a time; after `argint(0, &n)` the local variable `n` is 10. That is
how the argument travels: your `a0` into the kernel's `n`. `ticks` is the
kernel's clock. After `finish` (run until `sys_pause` returns) it has moved from
19 to 29. That is the ten ticks you asked for.

!!! theory "Connect to theory: a system call is a number in a register and a trap"

    **What the theory says.** A program cannot call the kernel like an ordinary
    function. It puts a call number in a register and runs one trap instruction. The
    hardware switches to kernel mode and jumps to the handler address the kernel gave
    it in advance, and the kernel uses the number to pick the service
    ([Week 2, Sections 4.3 to 4.5](../../w02/class-2.md#sec-4-3)). In xv6 that round trip
    runs through six stations in four files
    ([Week 2, Section 4.6](../../w02/class-2.md#sec-4-6)).

    **What this run showed.** `bt` showed the chain: `usertrap` called `syscall`, which
    called `sys_pause`, and below `usertrap` sat the trampoline, the frame with no
    name. `a7` held 13, which is `SYS_pause`. `a0` held 10, and after `argint` the
    kernel's own variable `n` was 10. `ticks` went from 19 to 29.

    **Why the run confirms the theory.** Your program never named `sys_pause`. It only
    put 13 in `a7`, and the kernel found the handler by looking 13 up in its table.
    The argument crossed in a register too. And the clock that your program is not
    allowed to touch did move: `ticks` is the kernel's clock, advanced by the timer
    interrupt ([Week 2, Section 5.2](../../w02/class-2.md#sec-5-2)), and `sys_pause` waited
    for ten of its ticks on your behalf.

!!! question "Think"

    The grader has a test called "sleep, makes syscall". It does not read your
    source code. How can it know whether you called `pause()` or faked the delay
    with a loop?

    Answer it in your own words before you read on. The answer is not printed here.

To finish: in gdb type `quit`. In Terminal 1 press Ctrl-a then x.
