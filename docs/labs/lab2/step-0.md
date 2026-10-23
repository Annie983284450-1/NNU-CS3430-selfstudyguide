# Step 0. A system call, stopped in the middle

## Why this step

The question: what happens in the kernel between `ecall` and the handler?

In Lab 1 you stopped inside `sys_pause` and saw your argument 10 arrive. This time
stop one level earlier, in the function that decides which handler to call. Picture
a switchboard operator. Every call to the building rings the same desk; the operator
reads the extension number and connects the line. `syscall()` is that desk. The
number is in register `a7`, the table of extensions is `syscalls[]`, and in [Step 2](step-2.md)
you will give the operator a list of extensions to refuse.

The second half of this step is a crash. You will make the kernel read address 0 on
purpose and watch it die, so that you have seen a kernel panic once, in a case where
you know exactly why. Then you undo it.

## The picture

```
   user program (user mode)                  the kernel (supervisor mode)
   +----------------------------+            +--------------------------------+
   | init.c                     |            | trampoline.S: uservec          |
   |   open("console", O_RDWR)  |            |   save 32 registers into the   |
   |     usys.S: li a7, 15      |   ecall    |   trapframe, switch stacks     |
   |             ecall  --------+----------> |        |                       |
   |             ret    <-------+----------  |        v                       |
   |                            |   sret     | trap.c: usertrap()             |
   +----------------------------+            |   scause == 8 ? -> syscall()   |
                                             |        |                       |
                                             |        v                       |
                                             | syscall.c: syscall()           |
                                             |   num = trapframe->a7   (15)   |
                                             |   a0 = syscalls[num]()         |
                                             |        |                       |
                                             |        v                       |
                                             | sysfile.c: sys_open()          |
                                             +--------------------------------+
```

Three kernel functions, always the same three, for every system call: `uservec`
(assembly, saves the registers), `usertrap` (C, asks why the trap happened; 8
means system call), `syscall` (reads `a7`, calls the handler, puts the result in
`a0`). The first system call the machine ever makes is `open("console", O_RDWR)`
from `user/init.c` line 19, so that is the one gdb will stop on.

## Do this, part A: stop at `syscall()`

Two terminals, both in `lab2-syscall-student`. Terminal 1 first: it creates the
`.gdbinit` file that Terminal 2 reads.

**Terminal 1, on Ubuntu (or Mac), in the lab folder:**

```
$ make clean
$ make CPUS=1 qemu-gdb
```

`make clean` finishes in a second or two. Then `make CPUS=1 qemu-gdb` builds
(10 seconds to a minute, depending on your machine) and prints
`*** Now run 'gdb' in another window.` and stops. Nothing else appears. QEMU is
paused before its first instruction, waiting for a debugger.

**Terminal 2, also on Ubuntu (or Mac), in the lab folder:**

```
$ gdb-multiarch -q -x .gdbinit          # Linux / WSL2
$ riscv64-elf-gdb -q -x .gdbinit        # macOS
```

`-q` means quiet: gdb skips its long welcome text. gdb still prints a warning
about `auto-load safe-path` every time, on every machine, including when
everything works. Ignore it.

If your terminal window is short, gdb may stop before its first `(gdb)` prompt and
print `--Type <RET> for more, q to quit, c to continue without paging--`. Press
`c`, then Enter. Do not type `break syscall` on that line. gdb takes whatever you
type there as the answer to its question and throws the command away, so no
breakpoint is set, and `continue` then boots xv6 without stopping. The line that matters comes
after your first command: `Breakpoint 1 at 0x...: file kernel/syscall.c, line 133.`
If you see that line, gdb is connected. At the `(gdb)` prompt:

```
(gdb) break syscall
(gdb) continue
```

`continue` is required. Without it the kernel never starts and Terminal 1 stays
blank forever. The breakpoint hits at once, during boot, before the shell exists.
Now type these one at a time and read each answer:

```
(gdb) bt
(gdb) next
(gdb) next
(gdb) print p->trapframe->a7
(gdb) print/x $sstatus
(gdb) print p->name
(gdb) print p->pid
```

## You should see

```
(gdb) break syscall
Breakpoint 1 at 0x80001ce8: file kernel/syscall.c, line 133.
(gdb) continue
Continuing.

Breakpoint 1, syscall () at kernel/syscall.c:133
133	{
(gdb) bt
#0  syscall () at kernel/syscall.c:133
#1  0x0000000080001aa6 in usertrap () at kernel/trap.c:68
#2  0x0000003ffffff09c in ?? ()
(gdb) next
135	  struct proc *p = myproc();
(gdb) next
137	  num = p->trapframe->a7;
(gdb) print p->trapframe->a7
$1 = 15
(gdb) print/x $sstatus
$2 = 0x200000022
(gdb) print p->name
$3 = "init", '\000' <repeats 11 times>
(gdb) print p->pid
$4 = 1
```

Addresses can differ on your machine. The line numbers, 15, `init` and 1 will not.

Read it with the picture. `bt` is the call chain: frame #2 with no name is the
trampoline (`uservec`), #1 is `usertrap` at `trap.c` line 68, which is the line
`syscall();`, and #0 is where you are. The two `next` commands step past
`struct proc *p = myproc();` so that `p` has a value; before that, `print p` shows
garbage. `a7` is 15. Open `kernel/syscall.h`: line 16 is `#define SYS_open   15`.
The process is `init`, pid 1, the first user process, and `user/init.c` line 19 is
its first system call, `open("console", O_RDWR)`. `$sstatus` is a CPU register.
Bit 8 (value `0x100`) is called SPP and records the mode the CPU was in before the
trap: 0 for user mode, 1 for supervisor mode. `0x200000022` has bit 8 clear, so
this trap came from user mode, which is what `usertrap` checks on its line 42.

!!! theory "Connect to theory: two modes, one doorway, and the number in a7"

    **What the theory says.** The CPU has two modes. A program in user mode asks for a
    service by putting its number in a register and running `ecall`. The hardware
    records the cause, switches to kernel mode and jumps to the handler address the
    kernel gave it in advance ([Week 2, Sections 4.3 and 4.4](../../w02/class-2.md#sec-4-3)).
    The hardware saves the program counter and the cause; the trampoline then saves
    the program's registers into the trapframe
    ([Week 2, Extra 23](../../w02/class-2.md#extra-23)).

    **What this run showed.** The first stop was `init`, pid 1, with 15 in `a7`, which
    is `SYS_open`. `bt` showed `usertrap` calling `syscall`, with the unnamed trampoline
    frame below it. `sstatus` was `0x200000022`, with bit 8 clear.

    **Why the run confirms the theory.** Bit 8 of `sstatus` is where the hardware
    wrote down the mode it came from, and it says user mode. The kernel then read the service number from the copy
    of `a7` that the trampoline saved, which is why the code, and gdb, read it as
    `p->trapframe->a7`.

Write your answers to the first three questions in `answers-syscall.txt` now
(which function called `syscall()`; what `a7` holds and which call it is; which
mode the CPU came from). Full sentences. Then in gdb type `quit`, and in Terminal 1
press Ctrl-a then x.

## Do this, part B: crash the kernel on purpose, then undo it

Open `kernel/syscall.c` and find line 137:

```c
  num = p->trapframe->a7;
```

Change it to:

```c
  num = *(int*)0;
```

This reads an `int` from address 0. Save, and boot normally:

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

## You should see

```
xv6 kernel is booting

hart 1 starting
hart 2 starting
scause=0xd sepc=0x80001cf8 stval=0x0
panic: kerneltrap
```

No shell prompt. The kernel is dead; only Ctrl-a then x gets you out. Three
numbers on the line before `panic`: `scause=0xd` is 13, the RISC-V code for a load
page fault, meaning a read from an address that has no mapping. `stval=0x0` is the
address that failed: address 0, which the kernel's page table does not map. `sepc`
is the address of the instruction that did it. Open `kernel/kernel.asm` and search
for `80001cf8` (yours may differ; use your own `sepc`):

```
  num = *(int*)0;
    80001cf8:	00002683          	lw	a3,0(zero) # 0 <_entry-0x80000000>
```

`lw a3, 0(zero)`: load a word into register `a3` from address 0 plus register
`zero`. That is your line of C, one instruction. Because the fault happened in
supervisor mode, `usertrap` is not involved; the trap went to `kerneltrap`
(`kernel/trap.c`), which has no way to recover and calls `panic`. The process
running at that moment was `init`, pid 1, the same one from part A: this is the
very first system call again, and the kernel never got past reading `a7`.

!!! theory "Connect to theory: an address with no translation is refused, and the hardware says why"

    **What the theory says.** When a program uses an address it does not have, the
    hardware refuses the access, records what went wrong, and hands control to the
    operating system ([Week 3, Section 5.5](../../w03/class-2.md#sec-5-5); with page tables,
    [Week 5, Section 4.3](../../w05/class-2.md#sec-4-3)). On RISC-V the record is `scause`
    (why), `sepc` (which instruction) and `stval` (which address), and 0xd means a load
    page fault ([Week 4, Extra 18](../../w04/class-2.md#extra-18) shows one from a user
    program).

    **What this run showed.** `scause=0xd`, `stval=0x0`, and a `sepc` that named the one
    `lw` instruction compiled from your line of C.

    **Why the run confirms the theory.** The hardware did exactly the three things the
    theory lists: it refused, it recorded the cause and the address, and it handed
    control to the kernel. What differs is who faulted. In the theory a user program
    faults, and the kernel kills that program. Here the faulting code was the kernel
    itself, so the trap went to `kerneltrap`, and there is nothing above the kernel to
    clean up. So it panics.

Write the answers to questions 4 and 5 in `answers-syscall.txt`. Then **put line
137 back**:

```c
  num = p->trapframe->a7;
```

Check it before you go on. Every later step boots xv6, and with this line still
changed every boot ends in `panic: kerneltrap` and nothing in the lab can be
tested. If at any point today xv6 stops printing `init: starting sh` and prints
`panic` instead, this line is the first thing to look at.

**On Ubuntu (or Mac), in the lab folder:**

```
$ grep -n 'num = ' kernel/syscall.c
```

You should see one line, `137:  num = p->trapframe->a7;`, and nothing about
`(int*)0`.

!!! question "Think"

    At the breakpoint, the process was `init`, pid 1, and the call was `open`. There
    is no `initcode` process and no `exec` in this tree's boot: `kernel/proc.c` line
    524 calls `kexec("/init", ...)` from inside the kernel, in `forkret`. Why does a
    call made from inside the kernel not show up at your `syscall()` breakpoint, even
    though `exec` is a system call?

    Answer it in your own words before you read on. The answer is not printed here.
