# Watch it happen: `sysdemo` under gdb (optional)

Everything on [the previous page](../../labs/lab0/sysdemo.md) can be watched live with the debugger. You stop the kernel at the moment
`sys_write` starts, and look at the registers your program left behind. This takes ten
minutes and needs nothing new except the debugger itself: on Linux and WSL it is
`gdb-multiarch` (already in the `apt-get` line of [Install the tools](../../labs/lab0/install.md)); on a Mac run
`brew install riscv64-elf-gdb` once; the command is then `riscv64-elf-gdb` (there is no
`gdb-multiarch` on a Mac, and `zsh: command not found: gdb-multiarch` means exactly that).

Everything below is typed at your **own machine's** prompt, not inside xv6. Typing `make` at
xv6's `$` prompt only gets you `exec make failed`.

**First, quit the xv6 you already have running** (Ctrl-a, release, then x). Only one xv6
can run at a time, because each one opens `fs.img` as its disk and QEMU will not share it.
If you skip this, the next command fails with
`Failed to get "write" lock. Is another process using the image [fs.img]?`; the fix is to
find that older window and quit it, or run `pkill qemu-system-riscv64`.

**Terminal 1.** In that same terminal, now back at your own prompt in the `xv6-setup-student` folder,
boot a fresh xv6 with one CPU and tell it to wait for a debugger:

```
$ make CPUS=1 qemu-gdb
```

Nothing appears yet; QEMU is paused, waiting. **Terminal 2.** Open a second terminal window, `cd`
into the same `xv6-setup-student` folder, and start the debugger there:

```
$ gdb-multiarch -x .gdbinit        # Linux / WSL
$ riscv64-elf-gdb -x .gdbinit      # macOS (after: brew install riscv64-elf-gdb)
```

(`make qemu-gdb` writes the `.gdbinit` file into the `xv6-setup-student` folder, and gdb reads
it from the folder you start gdb in. So gdb must be started from that folder: if it says
`.gdbinit: No such file or directory`, you are in the wrong folder; type `quit`, `cd` into
`xv6-setup-student`, and start it again. If gdb instead warns about auto-loading and later
says *"The program is not being run"*, run
`echo "add-auto-load-safe-path $(pwd)/.gdbinit" >> ~/.gdbinit` once and start gdb again.)
Before typing anything else, be clear about what gdb is attached to, because it is not what
most people expect. gdb is **not** debugging `sysdemo`. It is debugging the whole virtual
machine, and the only program it knows by name is the kernel: `.gdbinit` connected it to
QEMU's virtual CPU (`target remote`) and loaded the kernel's symbol table
(`symbol-file kernel/kernel`). That is why the first thing it shows is
`0x0000000000001000 in ?? ()`: the CPU is frozen at its very first instruction, in the boot
ROM, before xv6 exists. From here gdb can stop the CPU at any kernel address, no matter
which process caused the kernel to run. `init`, the shell, and `sysdemo` all call `write`,
so a plain `break sys_write` would stop for all of them. `myproc()` is the kernel function
that answers "which process am I serving right now", and the condition
`myproc()->pid == 3` is how you narrow the stops to the one you care about. Everything you
print below is kernel memory: `trapframe` is the kernel's saved copy of the program's
registers, not the program itself. (Loading `sysdemo`'s own symbols so you can step through
its C lines is possible, `add-symbol-file user/_sysdemo`, but it is not needed here.)

At the `(gdb)` prompt, set two breakpoints and let the kernel run:

```
(gdb) break sys_write if myproc()->pid == 3 && myproc()->trapframe->a0 == 1 && myproc()->trapframe->a2 == 3
(gdb) break sys_write if myproc()->pid == 3 && myproc()->trapframe->a0 == 99
(gdb) continue
```

The conditions matter. `init` and the shell also call `write`, and xv6's `printf` sends
one byte per call, so a plain `break sys_write` would stop dozens of times. These two stop
only for our two 3-byte calls, in process 3 (`sysdemo`, when it is the first command after
boot). Now switch to the first terminal, wait for the `$` prompt, and type `sysdemo`. The
program starts, calls `write(1, "hi\n", 3)`, and freezes inside the kernel. Back in gdb
(this session was captured from a real run; your addresses may differ):

```
Breakpoint 1, sys_write () at kernel/sysfile.c:84
(gdb) bt 3
#0  sys_write () at kernel/sysfile.c:84
#1  0x0000000080001d18 in syscall () at kernel/syscall.c:141
#2  0x0000000080001a9c in usertrap () at kernel/trap.c:68
(gdb) print myproc()->name
$1 = "sysdemo\000\000\000\000\000\000\000\000"
(gdb) print myproc()->pid
$2 = 3
(gdb) print/d myproc()->trapframe->a7
$3 = 16
(gdb) print/d myproc()->trapframe->a0
$4 = 1
(gdb) print/d myproc()->trapframe->a2
$5 = 3
(gdb) finish
0x0000000080001d18 in syscall () at kernel/syscall.c:141
141	    p->trapframe->a0 = syscalls[num]();
Value returned is $6 = 3
```

Read it against the figure on [the previous page](../../labs/lab0/sysdemo.md). `bt` is the kernel half of the road, bottom to top:
`usertrap` (trap.c line 68) called `syscall` (line 141) called `sys_write`. `myproc()` is
the kernel's record of the process that made the call, and `trapframe` is where the trap
handler saved that process's registers: `a7` holds 16, the number the stub loaded, and
`a0`, `a2` hold the arguments 1 and 3 exactly as your C code passed them. `finish` runs
`sys_write` to its end and stops on line 141, the line that stores the result, reporting
`3`. That 3 is on its way to your variable `n`.

!!! theory "Connect to theory: the trapframe holds the program's registers"

    **What the theory says.** At the trap, before any C code of the kernel runs, the
    kernel saves the program's registers into the process's trapframe. `syscall()` then
    reads the call number from that saved copy (`p->trapframe->a7`), calls the handler,
    and puts the result back in the saved `a0`, so the program finds it there when it
    resumes ([Week 2, Sections 4.5 and 4.6](../../w02/class-2.md#sec-4-5)).

    **What this run showed.** `bt` showed the chain `usertrap()`, then `syscall()`, then
    `sys_write()`. In `myproc()->trapframe`, `a7` was 16 and `a0`, `a2` were 1 and 3, the
    values your C code passed. `finish` stopped on line 141 of `kernel/syscall.c`, the
    line that writes the handler's result into `p->trapframe->a0`, with the value 3.

    **Why the run confirms the theory.** The breakpoint stopped the kernel inside
    `sys_write`, long after your program's registers had been overwritten by kernel
    code. Yet 16, 1 and 3 were still there, in the trapframe: the call number and the
    two arguments, all in the saved copy the theory describes. Line 141 is where the
    answer travels back.

Continue to the second call:

```
(gdb) continue
Breakpoint 2, sys_write () at kernel/sysfile.c:84
(gdb) print/d myproc()->trapframe->a0
$8 = 99
(gdb) print myproc()->ofile[1]
$10 = (struct file *) 0x800179b0 <ftable+24>
(gdb) print myproc()->ofile[3]
$11 = (struct file *) 0x0
(gdb) finish
Value returned is $12 = 18446744073709551615
```

Slot 1 of the open-file table points at a real `struct file`; slot 3 is a null pointer, and
slot 99 does not exist. The return value looks strange: `sys_write` is declared to return
`uint64`, so gdb shows -1 as the unsigned 64-bit number 18446744073709551615. Your program
declared `n` as an `int`, so it printed the same bits as -1. Same value, two ways of reading
the bytes.

!!! theory "Connect to theory: a file descriptor is a slot in the process's table"

    **What the theory says.** A process is its memory, its registers and its open files.
    The open files are a small table with one slot per open file, and the slot's number
    is the file descriptor; slot 1 is standard output
    ([Week 2, Section 1.2](../../w02/class-1.md#sec-1-2)). In xv6 that table is the `ofile`
    field of `struct proc` ([Week 2, Section 1.4](../../w02/class-1.md#sec-1-4)).

    **What this run showed.** `ofile[1]` held the address of a real `struct file`.
    `ofile[3]` held 0, a null pointer. There is no slot 99 at all, and `write(99, ...)`
    came back as -1.

    **Why the run confirms the theory.** A file descriptor is not a name for a file; it
    is only a position in this one process's table. xv6's table has 16 slots (`NOFILE`),
    so before it looks at any slot the kernel checks that the number is between 0 and 15
    (`argfd()` in `kernel/sysfile.c`, line 28). 99 fails that check: it is not a slot at
    all. A number inside the table whose slot holds 0, like 3, is refused by the same line.
    Both answers come from the per-process table the theory describes, not from anything
    the program said.

To finish: `detach`, then `quit` in gdb, and Ctrl-a x in the QEMU terminal. If gdb cannot
connect, the most common cause is a second QEMU still running from earlier; quit it first.
Lab 1 uses gdb again, step by step; this is just a first look.
