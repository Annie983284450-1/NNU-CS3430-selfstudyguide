# Step 6. A live system-call counter in the shared page

## Why this step

The question: how does a kernel counter reach a user program for free?

[Step 1](step-1.md) put a value that never changes (the pid) into the shared page. The same
page can carry a value that changes constantly, as long as the kernel is the
only writer and updates it at one place. The count of system calls a process
has made is a perfect case: every system call passes through one function,
`syscall()` in `kernel/syscall.c`, so one `++` there counts them all. The
process reads the number with a plain load. This is the idea behind
Linux's vDSO: a kernel-maintained number, read without a trap.

The picture: the lobby notice board again, but this time the staff update a
tally on it every time anyone uses the front desk. You can read the tally any
time; you cannot change it.

## The picture

```
   user program                       kernel
   getpid() --ecall-->  usertrap() --> syscall():
                                          num = a7
                                          a0 = syscalls[num]()
                                          p->usyscall->nsyscall++      <-- Step 6, one place
                                       <-- sret
   ugetnsyscall()  = *(int*)(USYSCALL + 4)    plain load, no trap, reads the same page
```

## Do this

Open `kernel/syscall.c`, function `syscall()` at the end of the file. Line
166 is `p->trapframe->a0 = syscalls[num]();`. Add these lines right after it,
inside the `if`:

```c
#ifdef LAB_PGTBL
    // NNU: expose a live system-call count to user space via the read-only
    // USYSCALL page, so a program can read it with no system-call overhead.
    if(p->usyscall)
      p->usyscall->nsyscall++;
#endif
```

(`allocproc()` already seeds `nsyscall = 0` from [Step 1](step-1.md), so the count starts at
zero for every new process.)

First see the test fail, then see it pass. It is worth seeing both.

**At the xv6 `$` prompt, before the edit** (if xv6 is still running from
[Step 5](step-5.md)):

```
$ nsystest
```

```
$ nsystest
nsyscall_test: FAIL made 100 syscalls but counter rose 0
```

Then quit xv6, make the edit, and:

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ nsystest
```

## You should see

```
$ nsystest
nsyscall_test: OK
```

`nsystest` reads the counter twice with nothing in between and checks the two
reads agree (reading is not a system call, so it must not change the count).
Then it makes exactly 100 `getpid()` calls and checks the counter rose by
exactly 100.

!!! theory "Connect to theory: one doorway, so one line counts every call"

    **What the theory says.** Every system call enters the kernel through the same
    trap and the same lookup in a table of handlers
    ([Week 2, Section 4.4](../../w02/class-2.md#sec-4-4)). In xv6 that lookup is in
    `syscall()` ([Week 2, Section 4.6](../../w02/class-2.md#sec-4-6)), the same function for
    every call.

    **What this run showed.** One `++` in `syscall()`, and `nsystest` saw the counter
    rise by exactly 100 for 100 calls to `getpid()`. Two reads of the counter with
    nothing in between gave the same number.

    **Why the run confirms the theory.** The new line does not know which call was
    made or which program made it, and it does not need to: every system call is
    dispatched at the same spot. A load from the shared page is not a system call, so
    it changes nothing. [Lab 2, Step 2](../../labs/lab2/step-2.md) put a decision at the
    same spot; this step puts a counter there.

??? success "The answer: `syscall()` after Step 6 (lines 156 to 178 of `kernel/syscall.c`, the new lines are 167 to 172)"

    ```c linenums="156" hl_lines="12-17"
    void
    syscall(void)
    {
      int num;
      struct proc *p = myproc();

      num = p->trapframe->a7;
      if(num > 0 && num < NELEM(syscalls) && syscalls[num]) {
        // Use num to lookup the system call function for num, call it,
        // and store its return value in p->trapframe->a0
        p->trapframe->a0 = syscalls[num]();
    #ifdef LAB_PGTBL
        // NNU: expose a live system-call count to user space via the read-only
        // USYSCALL page, so a program can read it with no system-call overhead.
        if(p->usyscall)
          p->usyscall->nsyscall++;
    #endif
      } else {
        printf("%d %s: unknown sys call %d\n",
                p->pid, p->name, num);
        p->trapframe->a0 = -1;
      }
    }
    ```

!!! question "Think"

    `nsystest` makes 100 `getpid()` calls and the counter rises by exactly 100,
    even though the program also called `printf` and `exit`. Explain why the
    `printf` at the end is not counted in the 100, and then say why the same trick
    could not keep the current wall-clock time fresh in the shared page.

    Answer it in your own words before you read on. The answer is not printed here.
