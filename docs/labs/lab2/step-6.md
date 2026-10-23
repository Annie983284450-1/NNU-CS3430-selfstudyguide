# Step 6. `blocked`: a counter from the kernel to the user

## Why this step

The question: how does a number the kernel has been keeping get back to a user
program?

Since [Step 2](step-2.md) the kernel has counted rejected calls in `p->nblocked`. Nothing can
read it yet. `blocked()` is the second system call of the lab, and it is the
smallest possible one: no arguments, one line of body, return an integer. Most of
its plumbing you already laid in [Step 1](step-1.md) (the number 23, the `user.h` prototype, the
`usys.pl` entry, the `nblocked` field). What is left is the handler, the table
entry, and building the helper program.

## The picture

```
   blockcount 5, under sandbox 32768 - :

   blockcount: open("no-such-file")   x5   each is masked (bit 15)
                                            syscall() rejects, p->nblocked++   -> 5
   blockcount: blocked()                    sys_blocked returns myproc()->nblocked = 5
               printf("blocked %d\n", 5)    "blocked 5"

   blockcount 3, no sandbox:
   blockcount: open("no-such-file")   x3   not masked; open runs, returns -1 (file missing)
                                            nblocked stays 0
   blockcount: blocked()  -> 0              "blocked 0"
```

The difference between the two runs is the whole idea of [Step 2](step-2.md) to now: under the
sandbox the `open`s are rejected before they run and counted; outside it they run
and fail on their own, and nothing is counted.

## Do this, part A: see the missing call

`blockcount.c` calls `blocked()`. The number 23 and the prototype exist from
[Step 1](step-1.md), but there is no handler and no table entry, and `$U/_blockcount` is not in
the Makefile. Add just the Makefile line for now, to see what a call with no
handler does. Edit the `Makefile`, and add `$U/_blockcount` after `$U/_sandbox`,
giving `$U/_sandbox` its backslash:

```make
ifeq ($(LAB),syscall)
UPROGS += \
	$U/_attack\
	$U/_secret\
	$U/_sandbox\
	$U/_blockcount
endif
```

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ blockcount 3
$ sandbox 32768 - blockcount 5
```

## You should see

```
$ blockcount 3
3 blockcount: unknown sys call 23
blocked -1
```

and the same `unknown sys call 23` for the sandbox line. The number 23 reached the
kernel (`usys.pl` and `syscall.h` from [Step 1](step-1.md)), and the table had nothing at index
23, so `syscall()` took its `else` branch, printed the message, and returned -1.
`blockcount` printed that -1. Quit xv6.

## Do this, part B: the handler and the table entry

Edit `kernel/sysproc.c`. At the very end of the file, after `sys_interpose`, add:

```c
// blocked(): return how many system calls have been rejected for the calling
// process by interpose().  A fresh (post-fork) process starts at 0.
uint64
sys_blocked(void)
{
  return myproc()->nblocked;
}
```

Edit `kernel/syscall.c`. Add the `extern` after `sys_interpose`'s:

```c
extern uint64 sys_interpose(void);
extern uint64 sys_blocked(void);
```

and the table entry after `sys_interpose`'s:

```c
[SYS_interpose] sys_interpose,
[SYS_blocked]   sys_blocked,
};
```

That is all: the counter, the field and the number were done in Steps 1 and 2.

??? success "The answer"

    The three additions above are the complete Step 6. `sys_blocked` is one line
    because `nblocked` is already maintained: `allocproc` set it to 0 ([Step 1](step-1.md)),
    `sys_interpose` resets it to 0 on each new sandbox ([Step 1](step-1.md)), and `syscall()`
    increments it on every reject ([Step 2](step-2.md)). `blocked()` only has to read it.

## Do this, part C: run it

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ sandbox 32768 - blockcount 5
$ blockcount 3
$ sandbox 32768 - blockcount 0
$ sandbox 128 - blockcount 4
```

## You should see

```
$ sandbox 32768 - blockcount 5
blocked 5
$ blockcount 3
blocked 0
$ sandbox 32768 - blockcount 0
blocked 0
$ sandbox 128 - blockcount 4
sandbox: exec blockcount failed
```

With `open` masked, all five `open`s are rejected and counted: `blocked 5`.
Outside the sandbox the three `open`s run and fail on their own (the file does not
exist), nothing is counted: `blocked 0`. `blockcount 0` makes no calls, so 0.
The last line is a trap: mask 128 is `exec`, so the sandbox blocks the `exec` of
`blockcount` itself, and it never starts.

!!! theory "Connect to theory: a system call's result comes back in a0"

    **What the theory says.** The kernel stores a handler's return value in the saved
    `a0` of the trapframe. On the way back it loads the saved registers into the CPU,
    so the program finds the value in `a0`, where any function result goes
    ([Week 2, Section 2.2](../../w02/class-1.md#sec-2-2) and
    [Section 4.5](../../w02/class-2.md#sec-4-5)). Each process's bookkeeping lives in its own
    `struct proc` ([Week 2, Section 1.4](../../w02/class-1.md#sec-1-4)).

    **What this run showed.** `sys_blocked` is one line, `return myproc()->nblocked;`,
    and `blockcount` printed `blocked 5` under the sandbox and `blocked 0` outside it.

    **Why the run confirms the theory.** The kernel never wrote into `blockcount`'s
    memory. `syscall()` put the handler's return value into `p->trapframe->a0`, and
    the return path loaded it into the real `a0`. The child's 0 after `fork` uses the
    second half of this path: `kfork` writes 0 into the child's saved `a0`, and the
    same return path loads it into the real `a0`.

**On Ubuntu (or Mac), in the lab folder:**

```
$ ./grade-lab-syscall sandbox_count
```

```
== Test sandbox_count (NNU blocked counter) == sandbox_count (NNU blocked counter): OK (0.7s)
```

!!! question "Think"

    `sys_interpose` resets `nblocked` to 0 every time it runs. Suppose it did not, and
    `nblocked` were only ever set to 0 in `allocproc`. `sandbox 32768 - blockcount 5`
    would still print `blocked 5`. Describe a sequence of calls in one process where
    the missing reset would make `blocked()` return a number that is too large.

    Answer it in your own words before you read on. The answer is not printed here.
