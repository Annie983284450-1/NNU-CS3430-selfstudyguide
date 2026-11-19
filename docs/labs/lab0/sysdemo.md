# One system call: `sysdemo`

Once your setup works, try the program below. It is not graded. It is complete: type it
in, build it, run it, and compare with
the output printed here (captured from a real run of xv6). What it shows, one system call
crossing from your program into the kernel and back, is the idea Lab 1 and Lab 2 are built on.

**What this program does, in plain words.** `sysdemo` asks the operating system for three
favors and reports what the answer was each time. It cannot do any of the three things
itself; it has to ask. First: "put these three characters, `h`, `i` and a newline, on the
screen." The program has no way to draw on the screen; only the operating system can. The OS
does it and hands back the number 3, "I wrote 3 characters." Second: the same request, but
"write it to thing number 99." The program never opened anything called 99, so the OS looks
in its notebook for this program, finds no such slot, refuses, and hands back -1, the usual
way of saying no. Nothing appears. Third: "what number am I?" Every running program has an
id that only the OS assigns, so the program has to ask; the OS answers 3 right after boot.
Then the program says "I am done, nothing went wrong" and leaves.

So the whole program is: ask, get an answer, print the answer, three times. It does nothing
useful. Its only purpose is that each ask is a trip across the line between *my program*
and *the operating system*, and the numbers that come back (3, -1, 3) are proof that the
trip happened and that the OS, not the program, did the work and made the decisions. The
rest of this section follows just the first of those trips to see what happens on the other
side of the line.

Create the file `user/sysdemo.c` with the code below. Then open the `Makefile`, find the
block that begins `UPROGS=\`, and add one line `$U/_sysdemo\` to it (leading underscore,
trailing backslash, tab-indented like its neighbours). xv6 only knows the programs on that
list; if you skip this step, `make qemu` succeeds but the shell answers `exec sysdemo
failed`. Every program you write in Lab 1 is registered the same way.

```c
#include "kernel/types.h"
#include "user/user.h"

int
main(int argc, char *argv[])
{
  int n;

  n = write(1, "hi\n", 3);                    // (1) fd 1 is the screen; ask the kernel to write 3 bytes
  printf("write to fd 1 returned %d\n", n);

  n = write(99, "hi\n", 3);                   // (2) fd 99 is not open; the kernel refuses
  printf("write to fd 99 returned %d\n", n);

  n = getpid();                               // (3) ask the kernel who I am
  printf("my pid is %d\n", n);
  exit(0);
}
```

Run `make qemu`, and at xv6's `$` prompt type `sysdemo`. This is what it prints (captured from a
real run):

```
$ sysdemo
hi
write to fd 1 returned 3
write to fd 99 returned -1
my pid is 3
```

`write` returned 3 (the number of bytes it wrote) the first time and -1 the second time.
Your program did not print `hi` itself; it *asked the kernel* to, and the kernel checked
the file descriptor before doing anything. That check is why the second call fails. The
program cannot touch the screen directly. This is the user/kernel boundary of the theory classes, and you can follow the `write`
call through it in five files:

<figure markdown="1">
![The road of one `write()` call: from your program in user space, through the three-instruction stub and the `ecall` into the kernel, to the system-call table and `sys_write`, and back with the result in register `a0`. The file names and line numbers are those of the `xv6-setup-student` tree.](figs/write_path.svg){width=100%}
<figcaption markdown="1">The road of one `write()` call: from your program in user space, through the three-instruction stub and the `ecall` into the kernel, to the system-call table and `sys_write`, and back with the result in register `a0`. The file names and line numbers are those of the `xv6-setup-student` tree.</figcaption>
</figure>

Open each of those five files and find the lines. `user/usys.S` does not exist until you
have built once; it is generated from `user/usys.pl`, and if you read that short Perl script
you will see it prints exactly the three-line stub above for every system call. Then look
at `kernel/syscall.c` around line 132: the `syscall()` function reads `a7`, looks the number
up in the table, calls the function, and puts the result in `a0`, which is where your
program's `n` comes from. Lab 2 has you add a new entry to this table, so you will be back.

!!! theory "Connect to theory: the system call"

    **What the theory says.** A program cannot touch the screen, the disk or another
    program. It asks the kernel, through a system call: one trap instruction that raises
    the privilege level and jumps to an entry the kernel chose in advance
    ([Week 1, Section 1.4](../../w01/class-1.md#sec-1-4)). The program names the service by a
    number, never by an address, and the kernel looks the number up in its own table
    ([Week 2, Section 4.4](../../w02/class-2.md#sec-4-4)). In xv6 the round trip runs through
    `usys.S`, the trampoline, `usertrap()` and `syscall()`
    ([Week 2, Section 4.6](../../w02/class-2.md#sec-4-6)).

    **What this run showed.** `write(1, "hi\n", 3)` printed `hi` and returned 3.
    `write(99, "hi\n", 3)` printed nothing and returned -1. And, as the figure shows, the
    stub in `user/usys.S` that `write` compiles to does only two things before `ret`: it
    puts 16 in `a7` and runs `ecall`.

    **Why the run confirms the theory.** Your program handed over a number and three
    arguments, nothing more. The kernel's table turned 16 into `sys_write`, and
    `sys_write` decided that 1 was a real open file of this process and that 99 was not a
    valid file descriptor at all. Both decisions were made on the kernel's side of the
    line, so the program could not skip them.

**Try:** `getpid` follows the same path; find `SYS_getpid` in `kernel/syscall.h` and
`sys_getpid` in `kernel/sysproc.c` (it is three lines). Run `sysdemo` twice and note that the
pid goes up: each command you type is a new process. (Straight after boot it is 3, because
`init` is process 1 and the shell is process 2.)
