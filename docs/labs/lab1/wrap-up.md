# Wrap up: run the grader

**On Ubuntu (or Mac), in the lab folder:**

```
$ echo 2 > time.txt
$ make grade
```

The last lines, when everything passes:

```
== Test exec, recursive find ==
$ make qemu-gdb
exec, recursive find: OK (0.9s)
== Test time ==
time: OK
Score: 131/131
```

Notice the `$ make qemu-gdb` under every test: the grader is running xv6 under
the same debugger you used in [Step 1](step-1.md) and [Step 5](step-5.md). While you
work, run one test at a time:
`./grade-lab-util sleep`, or `make GRADEFLAGS=wf grade`.

## Everything you changed in this lab

- New files: `user/sleep.c` (13 lines), `user/wf.c` (85), `user/find.c` (112).
- One function filled in: `memdump()` in `user/memdump.c`, lines 60 to 104.
- Makefile: three lines added to `UPROGS`, after `$U/_dorphan\`:
  `$U/_sleep\`, `$U/_wf\`, `$U/_find\`.
- No header file changes. Nothing in `kernel/`.

## What you can do now

1. Say what a process is, and why a program is not one.
2. Make a system call, and point at the register that carries its number.
3. Read a file the way the kernel presents it: bytes, with no meaning attached.
4. Look at raw memory and decide what it says, instead of trusting a label.
5. Open a directory and get the file names out of it yourself.
6. Start another program from inside your own, and wait for it to finish.

Every one of those six is something an operating system does for you all day
without being asked. You have now done each one by hand, once.
