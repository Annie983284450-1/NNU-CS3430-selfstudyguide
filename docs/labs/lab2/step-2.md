# Step 2. The reject check: one `if` before the table lookup

## Why this step

The question: where is the one place the kernel can say no?

Every system call from every process passes through `syscall()`, and it passes
through before anything has been done. That makes it the natural checkpoint. The
switchboard operator from [Step 0](step-0.md) now has a list of extensions to refuse: the
operator reads the number, looks at the list, and either connects the call or says
"no" and hangs up. The caller hears a refusal, not silence. In C, the refusal is
the return value -1, the same value `open` returns for a file that does not exist,
so `cat` does not need to know it was sandboxed. It prints its usual error.

## The picture

```
   syscall()                                        p->sysmask (64 bits)
     num = trapframe->a7            15 (open)       bit:  ... 16  15  14 ...  1  0
                                                          ...  0   1   0  ...  0  0
     1L << num  = 0x8000                                            ^
     p->sysmask = 0x8000  (32768)                                   |
     sysmask & (1L << num) = 0x8000, not zero  ->  reject   bit 15 is set: reject open

        reject:  p->nblocked++            (Step 6 will read this)
                 p->trapframe->a0 = -1    (what open() returns to cat)
                 return                   (sys_open never runs)

        allow:   p->trapframe->a0 = syscalls[num]()
```

The mask is an integer read as a row of bits. Bit number `n` stands for system
call number `n`. `1L << 15` is a 1 shifted 15 places left: 32768, or `0x8000`.
`sandbox 32768` therefore means "reject call 15", and call 15 is `open`. The `L`
makes the 1 a 64-bit value, so the shift is safe for any call number up to 63.
`&` keeps only the bits set in both operands, so `sysmask & (1L << num)` is
nonzero exactly when bit `num` is set in the mask.

Two other masks you will use: `128` is `1 << 7`, bit 7, `SYS_exec`. `32896` is
`32768 + 128`, both bits. `kernel/syscall.h` is the table that turns a name into
a bit position.

## Do this

Edit `kernel/syscall.c`. Inside `syscall()`, the dispatch line is line 143,
`p->trapframe->a0 = syscalls[num]();`. Insert the check above it, inside the
`if(num > 0 && ...)` block, so that the whole block reads:

```c
  if(num > 0 && num < NELEM(syscalls) && syscalls[num]) {
    if(p->sysmask & (________)){          // (1) the bit for this call
      p->nblocked++;
      p->trapframe->a0 = ____;            // (2) what the caller gets back
      return;
    }
    // Use num to lookup the system call function for num, call it,
    // and store its return value in p->trapframe->a0
    p->trapframe->a0 = syscalls[num]();
  } else {
```

Hints. (1) The picture above shows it. (2) The `else` branch three lines down, the
one for an unknown call number, already stores the value that means failure.

Rebuild and run the same command as [Step 1](step-1.md), plus three more:

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ sandbox 32768 - cat README
$ sandbox 32768 - echo hello
$ sandbox 128 - grep xv6 README
$ sandbox 32896 - grep xv6 README
$ sandbox 0 - grep xv6 README
```

## You should see

```
$ sandbox 32768 - cat README
cat: cannot open README
$ sandbox 32768 - echo hello
hello
$ sandbox 128 - grep xv6 README
sandbox: exec grep failed
$ sandbox 32896 - grep xv6 README
sandbox: exec grep failed
$ sandbox 0 - grep xv6 README
xv6 is a re-implementation of Dennis Ritchie's and Ken Thompson's Unix
Version 6 (v6).  xv6 loosely follows the structure and style of v6,
xv6 is inspired by John Lions's Commentary on UNIX 6th Edition (Peer
(kaashoek,rtm@mit.edu).  The main purpose of xv6 is as a teaching
```

Read each line against the mask. With `open` masked, `cat`'s `open("README")`
returns -1 and `cat.c` line 36 prints `cat: cannot open README`. `echo hello`
never calls `open`, so it is untouched. With `exec` masked (128), the sandboxed
child cannot even start `grep`: `exec` returns -1 and `sandbox.c` line 49 prints
`sandbox: exec grep failed`. Mask 32896 is both, and `exec` fails first. Mask 0
masks nothing and `grep` runs normally, printing the four lines of README that
contain `xv6`.

!!! theory "Connect to theory: interposition: one place every system call passes through"

    **What the theory says.** Interposition means sitting on a well-defined interface,
    transforming what passes through it, and staying invisible
    (here the transformation is a refusal)
    ([Week 3, Extra 13](../../w03/class-2.md#extra-13)). Every system call enters the kernel
    through the same trap and the same table lookup
    ([Week 2, Section 4.4](../../w02/class-2.md#sec-4-4)), so the kernel has one spot where
    it sees every request.

    **What this run showed.** With `open` masked, `cat` printed its ordinary
    `cannot open README`. `echo`, which never calls `open`, was untouched. With `exec`
    masked, `grep` never started.

    **Why the run confirms the theory.** Five lines in `syscall()` controlled three
    unrelated programs, and none of them was changed. `cat` could not tell it was
    sandboxed: it got -1 from `open`, the same answer it gets for a missing file. One
    dispatcher and one check cover every program.

gdb can show the exact moment of refusal. Two terminals again. The breakpoint
goes on the `p->nblocked++` line, which is line 142 in your file after the edit:

```
(gdb) break kernel/syscall.c:142
(gdb) continue
```

In Terminal 1 type `sandbox 32768 - cat README`. Then in gdb:

```
(gdb) print myproc()->name
(gdb) print myproc()->pid
(gdb) print num
(gdb) print/x myproc()->sysmask
(gdb) print/x 1L << num
(gdb) print/x myproc()->sysmask & (1L << num)
(gdb) next
(gdb) next
(gdb) print myproc()->nblocked
(gdb) print/d myproc()->trapframe->a0
(gdb) continue
```

```
(gdb) break kernel/syscall.c:142
Breakpoint 1 at 0x80001d42: file kernel/syscall.c, line 142.
(gdb) continue
Continuing.

Breakpoint 1, syscall () at kernel/syscall.c:142
142	      p->nblocked++;
(gdb) print myproc()->name
$1 = "cat\000\000ox\000\000\000\000\000\000\000\000"
(gdb) print myproc()->pid
$2 = 4
(gdb) print num
$3 = 15
(gdb) print/x myproc()->sysmask
$4 = 0x8000
(gdb) print/x 1L << num
$5 = 0x8000
(gdb) print/x myproc()->sysmask & (1L << num)
$6 = 0x8000
(gdb) next
143	      p->trapframe->a0 = -1;
(gdb) next
144	      return;
(gdb) print myproc()->nblocked
$7 = 1
(gdb) print/d myproc()->trapframe->a0
$8 = -1
```

The process is now named `cat`: `exec` has replaced `sandbox`'s memory, but the
same `struct proc` is still in use, and you can even see it, because the name
field still holds the tail `ox` of `sandbox` after the new, shorter name. The mask
came along for the same reason. `num` is 15, the mask has bit 15 set, the `&`
gives `0x8000`, and the kernel takes the reject branch: the counter goes to 1, `a0`
becomes -1, and `sys_open` is never called. After `continue`, Terminal 1 prints
`cat: cannot open README`.

!!! theory "Connect to theory: exec keeps the process record, so the mask stays"

    **What the theory says.** `exec()` replaces a process's memory and keeps its
    identity: the same pid, the same parent, the same open files, the same record in
    the kernel ([Week 2, Extra 17](../../w02/class-1.md#extra-17)).

    **What this run showed.** The process at the breakpoint was named `cat`, yet its
    name field still ended in `ox`, left over from `sandbox`. Its `sysmask` was
    `0x8000`, set while it was still `sandbox`.

    **Why the run confirms the theory.** Both leftovers can only exist if `exec` reused
    the same `struct proc`. The new name was written over the old one, and the field
    `exec` never touches, the mask, came through unchanged.

To finish: the kernel is running again after `continue`, so gdb is not reading
commands. Press Ctrl-C in Terminal 2 to get `(gdb)` back, then type `quit`. Then
press Ctrl-a then x in Terminal 1.

??? success "The answer: the two blanks"

    (1) `1L << num`. (2) `-1`.

??? success "The answer: `syscall()` after Step 2, complete (lines 133 to 154 of `kernel/syscall.c`)"

    ```c linenums="133"
    void
    syscall(void)
    {
      int num;
      struct proc *p = myproc();

      num = p->trapframe->a7;
      if(num > 0 && num < NELEM(syscalls) && syscalls[num]) {
        if(p->sysmask & (1L << num)){
          p->nblocked++;
          p->trapframe->a0 = -1;
          return;
        }
        // Use num to lookup the system call function for num, call it,
        // and store its return value in p->trapframe->a0
        p->trapframe->a0 = syscalls[num]();
      } else {
        printf("%d %s: unknown sys call %d\n",
                p->pid, p->name, num);
        p->trapframe->a0 = -1;
      }
    }
    ```

    Five new lines, 141 to 145. Nothing else in the file changed since [Step 1](step-1.md). [Step 4](step-4.md)
    will replace the condition on line 141 with a call to a helper function; the
    three lines inside stay.

Run the first grader test:

**On Ubuntu (or Mac), in the lab folder:**

```
$ ./grade-lab-syscall sandbox_mask
```

```
== Test sandbox_mask == sandbox_mask: OK (1.5s)
```

The number in parentheses is seconds, not points.

!!! question "Think"

    Suppose the check were placed after the table lookup instead: first
    `p->trapframe->a0 = syscalls[num]();`, then, if the bit is set, overwrite `a0`
    with -1. `cat` would still print `cannot open README`. What has gone wrong
    anyway?

    Answer it in your own words before you read on. The answer is not printed here.
