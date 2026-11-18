# Wrap up: run the grader

**On Ubuntu (or Mac), in the lab folder:**

```
$ echo 3 > time.txt
$ make grade
```

The last lines, when everything passes:

```
== Test sandbox_count (NNU blocked counter) == 
$ make qemu-gdb
sandbox_count (NNU blocked counter): OK (0.4s) 
== Test time == 
time: OK 
Score: 50/50
```

`make grade` runs every test under gdb, the same setup you used in [Step 0](step-0.md) and
[Step 1](step-1.md); that is the `$ make qemu-gdb` line under each test. The number in
parentheses after each `OK` is seconds, not points. While you work, run
one test at a time:
`./grade-lab-syscall sandbox_mask`, or `./grade-lab-syscall attack`.

The 50 points split like this: `answers-syscall.txt` 5; the five sandbox tests
(`sandbox_mask`, `sandbox_fork`, `sandbox_path`, `sandbox_most`, `sandbox_minus`)
5 each, 25; `attack` 14; `sandbox_count` 5; `time` 1.

## Everything you changed in this lab

- `kernel/syscall.h`: two `#define`s (22, 23).
- `user/user.h`: two prototypes.
- `user/usys.pl`: two `entry(...)` lines.
- `kernel/proc.h`: three fields in `struct proc`.
- `kernel/proc.c`: three assignments in `allocproc()`, two in `kfork()`.
- `kernel/sysproc.c`: `sys_interpose()` and `sys_blocked()`.
- `kernel/syscall.c`: two `extern`s, two table entries, `interpose_reject()`, and
  the reject call inside `syscall()`.
- `user/attack.c`: the body of `main()`.
- `Makefile`: `$U/_sandbox` and `$U/_blockcount` in `UPROGS`.
- `answers-syscall.txt`: your five [Step 0](step-0.md) answers.

## What you can do now

1. Add a system call to a kernel end to end, and name every file it touches.
2. Point at the one function every system call passes through, and put a decision
   in it before the call runs.
3. Say why a restriction has to be inherited across `fork`, and make it so.
4. Read a system call's own arguments from inside the dispatcher.
5. Show that memory handed to a program is not blank unless the kernel makes it so,
   and say why clearing it is a correctness requirement.
6. Return a kernel-side count to a user program with a new system call.

Every one of those is something a real kernel does. `interpose` is a small
seccomp; `blocked` is a small piece of the accounting a kernel keeps per process;
the uncleared page is a defect that has real names and real CVEs. You have now
built or seen each one by hand, once.
