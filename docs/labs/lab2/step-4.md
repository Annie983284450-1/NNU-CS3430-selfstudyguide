# Step 4. The allowed path: one file gets through

## Why this step

The question: how do you let exactly one file through?

Masking `open` is a sledgehammer: the program can open nothing at all, and most
programs need at least one file. The second argument of `interpose` is the
exception list, one entry long. Picture a building where the visitor's badge says
"no doors", with one door name handwritten on the back. At every door the guard
checks the badge; if the door's name matches the handwriting, the visitor may pass.
The guard has to read the name on the door, which for `open` and `exec` is the
first argument of the call: the pathname.

## The picture

```
   interpose_reject(p, num)

     bit num not set in p->sysmask  ------------------------------>  allow (return 0)
     bit set, and num is not open or exec ------------------------>  reject (return 1)
     bit set, num is open or exec, p->syspath is empty ----------->  reject
     bit set, num is open or exec, p->syspath is "README":
          argstr(0, path, MAXPATH)   reads the call's own first argument
          path == "README" ?   yes  ------------------------------>  allow
                               no   ------------------------------>  reject

   sandbox 32768 README grep xv6 README
     grep: open("README")  -> masked, path matches      -> allowed, grep reads it
   sandbox 32768 README grep xv6 x
     grep: open("x")       -> masked, path is "x"       -> rejected, grep: cannot open x
```

`argstr(0, ...)` here is the same function `sys_interpose` used in [Step 1](step-1.md), but now
it is reading argument 0 of a different call: whichever call is being attempted
right now. That works because `syscall()` runs with that call's registers in the
trapframe. `strncmp` compares up to `MAXPATH` characters and returns 0 when the
strings are equal.

## Do this, part A: see the problem

The [Step 3](step-3.md) kernel ignores the path completely. Try it:

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ sandbox 32768 README grep xv6 README
```

## You should see

```
$ sandbox 32768 README grep xv6 README
grep: cannot open README
```

`README` was named as the allowed path and was still refused. Quit xv6.

## Do this, part B: the helper, and one changed line

Edit `kernel/syscall.c`. Above `syscall()`, right after the closing `};` of the
`syscalls[]` table (line 131), add a function. Two blanks:

```c
// Return non-zero if system call `num` must be rejected for process p
// under interpose(): the call is masked, and (for open/exec) its pathname
// argument does not match the allowed path.
static int
interpose_reject(struct proc *p, int num)
{
  if((p->sysmask & (1L << num)) == 0)
    return 0;                 // this call is not masked
  if((num == ________ || num == ________) && p->syspath[0] != '\0'){   // (1) the two calls that take a pathname first
    char path[MAXPATH];
    if(argstr(0, path, MAXPATH) >= 0 && ________(path, p->syspath, MAXPATH) == 0)  // (2) compare
      return 0;               // pathname is on the allow-list
  }
  return 1;                   // reject
}
```

Then, inside `syscall()`, change the [Step 2](step-2.md) condition

```c
    if(p->sysmask & (1L << num)){
```

to

```c
    if(interpose_reject(p, num)){
```

The three lines inside the `if` do not change.

Hints. (1) The constants are in `kernel/syscall.h`; the two calls whose first
argument is a pathname and that the lab exempts. (2) `kernel/string.c` line 61.
`kernel/defs.h` declares it, so no `#include` is needed.

??? success "The answer: the two blanks"

    (1) `SYS_open` and `SYS_exec`. (2) `strncmp`.

??? success "The answer: `kernel/syscall.c` after Step 4, lines 130 to 170"

    ```c linenums="130"
    [SYS_interpose] sys_interpose,
    };

    // Return non-zero if system call `num` must be rejected for process p
    // under interpose(): the call is masked, and (for open/exec) its pathname
    // argument does not match the allowed path.
    static int
    interpose_reject(struct proc *p, int num)
    {
      if((p->sysmask & (1L << num)) == 0)
        return 0;                 // this call is not masked
      if((num == SYS_open || num == SYS_exec) && p->syspath[0] != '\0'){
        char path[MAXPATH];
        if(argstr(0, path, MAXPATH) >= 0 && strncmp(path, p->syspath, MAXPATH) == 0)
          return 0;               // pathname is on the allow-list
      }
      return 1;                   // reject
    }

    void
    syscall(void)
    {
      int num;
      struct proc *p = myproc();

      num = p->trapframe->a7;
      if(num > 0 && num < NELEM(syscalls) && syscalls[num]) {
        if(interpose_reject(p, num)){
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

    What changed since [Step 2](step-2.md): lines 133 to 148 are new (the helper), and line 157 calls
    it instead of testing the bit inline. Lines 158 to 160, the reject itself, are the
    [Step 2](step-2.md) lines. `static` means the helper is visible only inside this file. Read the
    helper top to bottom as three questions: is the bit set at all (no: allow); is
    this one of the two pathname calls, with a path configured (no: reject); does the
    pathname match (yes: allow, no: reject).

## Do this, part C: run it

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ sandbox 32768 README grep xv6 README
$ cat README > x
$ sandbox 32768 README grep xv6 x
$ sandbox 32768 x grep xv6 x
$ sandbox 2147483643 grep grep xv6 README
$ echo hello! > ---
$ sandbox 32768 --- grep hello! ---
$ sandbox 32768 - grep hello! ---
```

## You should see

```
$ sandbox 32768 README grep xv6 README
xv6 is a re-implementation of Dennis Ritchie's and Ken Thompson's Unix
Version 6 (v6).  xv6 loosely follows the structure and style of v6,
xv6 is inspired by John Lions's Commentary on UNIX 6th Edition (Peer
(kaashoek,rtm@mit.edu).  The main purpose of xv6 is as a teaching
$ cat README > x
$ sandbox 32768 README grep xv6 x
grep: cannot open x
$ sandbox 32768 x grep xv6 x
xv6 is a re-implementation of Dennis Ritchie's and Ken Thompson's Unix
Version 6 (v6).  xv6 loosely follows the structure and style of v6,
xv6 is inspired by John Lions's Commentary on UNIX 6th Edition (Peer
(kaashoek,rtm@mit.edu).  The main purpose of xv6 is as a teaching
```

```
$ sandbox 2147483643 grep grep xv6 README
$ echo hello! > ---
$ sandbox 32768 --- grep hello! ---
hello!
$ sandbox 32768 - grep hello! ---
grep: cannot open ---
```

Line by line. With path `README`, `grep` may open `README` and nothing else, so it
reads `README` but not the copy `x`; with path `x` it is the other way round.

`2147483643` is `0x7ffffffb`: every bit from 0 to 30 set except bit 2, which is
`SYS_exit`. So every system call is masked except `exit`, and the path is `grep`,
so the one `exec` that is allowed is `exec("grep", ...)`. `grep` starts, then tries
`open("README")`: masked, and `README` is not `grep`, so rejected. `grep` tries
to print `grep: cannot open README`, and that is a `write`, which is masked too.
Nothing appears. Then `grep` calls `exit`, which is allowed, and the prompt comes
back. That is the whole sandbox in one line: the program ran and could do
nothing but stop.

The last two lines are why `sys_interpose` tests `path[1] == '\0'` and not just
`path[0] == '-'`. A file really can be named `---`. With `---` as the allowed path
`grep` opens it; with `-` (no path) it cannot.

!!! theory "Connect to theory: the dispatcher can read the call's own arguments"

    **What the theory says.** On every trap, the program's registers are saved into the
    trapframe before any C code in the kernel runs
    ([Week 2, Extra 23](../../w02/class-2.md#extra-23)), and a call's arguments are in those
    registers ([Week 2, Section 1.2](../../w02/class-1.md#sec-1-2)).

    **What this run showed.** `interpose_reject` read argument 0 of whichever call was
    being attempted, `open("README")` or `open("x")`, and let through only the name
    stored in `syspath`.

    **Why the run confirms the theory.** When `syscall()` runs, all of the call's
    registers sit in the trapframe. So the checkpoint can see not only which call it is
    (`a7`) but also its arguments: for `open` and `exec`, `a0` holds the address of the
    pathname, and `argstr` copies the string in so it can be compared.

**On Ubuntu (or Mac), in the lab folder:**

```
$ ./grade-lab-syscall sandbox_path
$ ./grade-lab-syscall sandbox_most
$ ./grade-lab-syscall sandbox_minus
```

```
== Test sandbox_path == sandbox_path: OK (2.1s) 
== Test sandbox_most == sandbox_most: OK (1.1s) 
== Test sandbox_minus == sandbox_minus: OK (1.7s)
```

!!! question "Think"

    `interpose_reject` reads the pathname with `argstr(0, ...)` for `open` and for
    `exec`. Both take the pathname as their first argument. `unlink` and `chdir` also
    take a pathname first, and `link` takes two. If you wanted the allowed path to
    apply to `unlink` as well, what one change would you make, and why would the same
    change be wrong for `read` or `write`?

    Answer it in your own words before you read on. The answer is not printed here.
