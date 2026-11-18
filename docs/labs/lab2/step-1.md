# Step 1. `interpose`: one system call, wired end to end

## Why this step

The question: what does it take to add one system call?

You know from Lab 1 that a user program calls `pause(10)` and the kernel's
`sys_pause` runs. Between the two there is a fixed amount of plumbing, and every
piece of it has to be there or the call does not arrive. This step lays all of it
for a new call, `interpose(mask, path)`, and stores its two arguments in the
calling process. It does not yet reject anything; that is [Step 2](step-2.md). So at the end of
this step `sandbox 32768 - cat README` builds, runs, and still prints the whole
README. That is the correct result for Step 1, and gdb will prove the arguments
arrived.

## The picture

```
   user side                                      kernel side
   user/user.h      int interpose(int, const char*);   kernel/syscall.h   #define SYS_interpose 22
   user/usys.pl     entry("interpose");                kernel/syscall.c   extern uint64 sys_interpose(void);
        |  (perl, at build time)                                          [SYS_interpose] sys_interpose,
        v                                             kernel/sysproc.c   uint64 sys_interpose(void) { ... }
   user/usys.S      interpose:                        kernel/proc.h      uint64 sysmask; char syspath[]; int nblocked;
                      li a7, SYS_interpose            kernel/proc.c      allocproc(): all three set to 0
                      ecall
                      ret
   Makefile         $U/_sandbox        (so the program that calls it is on the disk)
```

Seven places. The number (22) is the one thing both sides agree on: the stub puts
it in `a7`, the table uses it as an index. Everything on the left is what a user
program needs to make the call; everything on the right is what the kernel needs to
answer it. The three new fields in `struct proc` are where the call's arguments
live afterwards, one copy per process.

## Do this, part A: the number and the user side

Edit `kernel/syscall.h`. After the last line, `#define SYS_close  21`, add two
lines:

```c
#define SYS_close  21
#define SYS_interpose 22
#define SYS_blocked   23
```

You add the number for `blocked` now as well, so that this file, `user.h`, `usys.pl`
and `struct proc` are each touched once. `blocked` gets its handler in [Step 6](step-6.md).

Edit `user/user.h`. After line 25, `int pause(int);`, add two lines:

```c
int pause(int);
int interpose(int mask, const char *path);
int blocked(void);
int uptime(void);
```

Edit `user/usys.pl`. At the very end, after `entry("uptime");`, add two lines:

```perl
entry("pause");
entry("uptime");
entry("interpose");
entry("blocked");
```

`usys.pl` is a Perl script that `make` runs to generate `user/usys.S`. Each
`entry` line becomes a three-instruction stub. After the next build, open
`user/usys.S` and find yours:

```
interpose:
 li a7, SYS_interpose
 ecall
 ret
```

That is the whole user side of a system call: put the number in `a7`, trap, return.
The arguments are already in `a0` and `a1`, where the C compiler puts function
arguments.

## Do this, part B: the kernel side

Edit `kernel/proc.h`. At the end of `struct proc`, after line 106,
`char name[16];`, add three fields:

```c
  struct inode *cwd;           // Current directory
  char name[16];               // Process name (debugging)
  uint64 sysmask;              // interpose(): bitmask of syscalls to reject (inherited by fork)
  char syspath[MAXPATH];       // interpose(): allowed pathname ("" = none)
  int nblocked;                // count of syscalls rejected for this process
};
```

`MAXPATH` is 128, from `kernel/param.h` line 13. `sysmask` is 64 bits so that
there is one bit for every possible call number. `nblocked` is for [Step 6](step-6.md).

Edit `kernel/proc.c`. In `allocproc()`, right after line 126, `p->state = USED;`,
add:

```c
found:
  p->pid = allocpid();
  p->state = USED;

  // interpose(): a fresh process sandboxes nothing
  p->sysmask = 0;
  p->syspath[0] = '\0';
  p->nblocked = 0;

  // Allocate a trapframe page.
```

`allocproc` is where every new process is born, including `init` and the shell.
A `struct proc` slot is reused after a process exits, so without these three lines
a new process could inherit a mask left behind by an old one.

Edit `kernel/sysproc.c`. At the very end of the file, after `sys_uptime`, add the
handler, including the four comment lines above it. Two blanks to fill:

```c
// interpose(mask, path): restrict which system calls the calling process may
// make.  A bit set in `mask` (bit 1<<SYS_xxx) rejects that system call.
// If `path` is not "-", a masked open/exec is still allowed when its pathname
// argument equals `path`.  The mask and path are inherited by fork children.
uint64
sys_interpose(void)
{
  int mask;
  char path[MAXPATH];
  struct proc *p = myproc();

  argint(0, &mask);                       // (1) argument 0 -> mask
  if(________(1, path, MAXPATH) < 0)      //     argument 1 -> path (a string)
    return -1;

  p->sysmask = (uint32)mask;
  if(path[0] == '-' && path[1] == '\0')
    p->syspath[0] = '\0';                 // "-" means no allowed path
  else
    safestrcpy(p->syspath, path, MAXPATH);
  p->nblocked = 0;
  return __;                              // (2) success
}
```

Hints. `sys_pause` (lines 65 to 85 of the same file) fetches an `int` argument
with `argint(0, &n)`. Look in `kernel/syscall.c` lines 71 to 80 for the function
that fetches a string argument into a buffer; it has the same shape as `argint`
and returns -1 when the address is bad. For (2), the convention is the same as
`sys_uptime`'s neighbor `sys_kill`: 0 means it worked.

Edit `kernel/syscall.c`. Two lines. After line 103,
`extern uint64 sys_close(void);`, add the declaration:

```c
extern uint64 sys_close(void);
extern uint64 sys_interpose(void);
```

and after `[SYS_close]   sys_close,` in the `syscalls[]` table, add the entry:

```c
[SYS_mkdir]   sys_mkdir,
[SYS_close]   sys_close,
[SYS_interpose] sys_interpose,
};
```

`[SYS_interpose] sys_interpose,` means: element 22 of this array is the function
`sys_interpose`. It is the one line that connects the number to the code. Forget
it and everything compiles, and the call does nothing (see Case D below).

## Do this, part C: register the program and build

Edit the `Makefile`. Find the block that starts `ifeq ($(LAB),syscall)`, around
line 210. Add `$U/_sandbox` after `$U/_secret`, and give `$U/_secret` the
backslash it did not have:

```make
ifeq ($(LAB),syscall)
UPROGS += \
	$U/_attack\
	$U/_secret\
	$U/_sandbox
endif
```

The last line of this list has no backslash, and must not have one: the next line
is `endif`, and a backslash would glue `endif` onto the list. In Lab 1 the list
ended in a blank line, so a trailing backslash was harmless there; here it is not.

Three checks, then build:

**On Ubuntu (or Mac), in the lab folder:**

```
$ grep -n interpose kernel/syscall.h user/user.h user/usys.pl kernel/syscall.c kernel/sysproc.c
$ grep -n '_sandbox' Makefile
$ make qemu
```

The first `grep` should print seven lines (one in `syscall.h`, one in `user.h`,
one in `usys.pl`, two in `syscall.c`, two in `sysproc.c`, counting the comment).
The second prints `214:	$U/_sandbox`.

**At the xv6 `$` prompt:**

```
$ sandbox 32768 - cat README
$ sandbox 32768 - echo hello
```

## You should see

```
$ sandbox 32768 - cat README
xv6 is a re-implementation of Dennis Ritchie's and Ken Thompson's Unix
Version 6 (v6).  xv6 loosely follows the structure and style of v6,
but is implemented for a modern RISC-V multiprocessor using ANSI C.
```

followed by the rest of README, and then `hello`. Nothing is rejected yet, so
`cat` reads the file as usual. What has changed is invisible from the shell: the
child process now carries `sysmask = 32768`. gdb can show it. Quit xv6 (Ctrl-a
then x) and open the two terminals again:

**Terminal 1, on Ubuntu (or Mac), in the lab folder:** `make CPUS=1 qemu-gdb`.
**Terminal 2, same place:** `gdb-multiarch -q -x .gdbinit` (or `riscv64-elf-gdb -q -x .gdbinit`).

```
(gdb) break sys_interpose
(gdb) continue
```

In Terminal 1, at the xv6 `$` prompt, type `sandbox 32768 - cat README`. The
prompt freezes. Back in Terminal 2:

```
(gdb) bt
(gdb) print myproc()->name
(gdb) print myproc()->pid
(gdb) print/d myproc()->trapframe->a7
(gdb) print/d myproc()->trapframe->a0
(gdb) print/x myproc()->trapframe->a1
(gdb) next
(gdb) next
(gdb) next
(gdb) next
(gdb) next
(gdb) print mask
(gdb) x/s path
(gdb) finish
(gdb) print myproc()->sysmask
(gdb) x/s myproc()->syspath
(gdb) print myproc()->nblocked
(gdb) continue
```

```
(gdb) break sys_interpose
Breakpoint 1 at 0x80001f30: file kernel/sysproc.c, line 115.
(gdb) continue
Continuing.

Breakpoint 1, sys_interpose () at kernel/sysproc.c:115
115	{
(gdb) bt
#0  sys_interpose () at kernel/sysproc.c:115
#1  0x0000000080001d2e in syscall () at kernel/syscall.c:143
#2  0x0000000080001ab2 in usertrap () at kernel/trap.c:68
#3  0x0000003ffffff09c in ?? ()
(gdb) print myproc()->name
$1 = "sandbox\000\000\000\000\000\000\000\000"
(gdb) print myproc()->pid
$2 = 4
(gdb) print/d myproc()->trapframe->a7
$3 = 22
(gdb) print/d myproc()->trapframe->a0
$4 = 32768
(gdb) print/x myproc()->trapframe->a1
$5 = 0x3fd0
(gdb) next
118	  struct proc *p = myproc();
(gdb) next
120	  argint(0, &mask);
(gdb) next
121	  if(argstr(1, path, MAXPATH) < 0)
(gdb) next
124	  p->sysmask = (uint32)mask;
(gdb) next
125	  if(path[0] == '-' && path[1] == '\0')
(gdb) print mask
$6 = 32768
(gdb) x/s path
0x3fffff7f18:	"-"
(gdb) finish
Run till exit from #0  sys_interpose () at kernel/sysproc.c:125
0x0000000080001d2e in syscall () at kernel/syscall.c:143
143	    p->trapframe->a0 = syscalls[num]();
Value returned is $7 = 0
(gdb) print myproc()->sysmask
$8 = 32768
(gdb) x/s myproc()->syspath
0x8000adc8 <proc+1880>:	""
(gdb) print myproc()->nblocked
$9 = 0
```

The `$n` numbers and the addresses can differ. The story is the same as Lab 1's
`sys_pause`, one level deeper: `a7` is 22, your new number; `a0` is 32768, the
mask, straight from `sandbox`'s first argument; `a1` is `0x3fd0`, an address in
`sandbox`'s memory where the string `"-"` sits (the kernel cannot read it directly,
which is why `argstr` copies it into the kernel buffer `path`). After `argint` and
`argstr`, the kernel variables `mask` and `path` hold 32768 and `"-"`. After the
function returns (`finish`, value 0), the process itself, `myproc()`, carries
`sysmask = 32768` and an empty `syspath`, because `"-"` was turned into the empty
string. The name is still `sandbox`: the child has not called `exec` yet.

!!! theory "Connect to theory: arguments travel in registers, and a string travels as an address"

    **What the theory says.** The registers `a0` to `a7` carry a call's arguments
    ([Week 2, Section 1.2](../../w02/class-1.md#sec-1-2)). For a system call the number goes
    in `a7`, and on the way in the kernel saves all the registers into the trapframe
    ([Week 2, Section 4.5](../../w02/class-2.md#sec-4-5)), so that is where it finds them. When an argument is an address in
    the program's memory, the kernel must check it before reading through it
    ([Week 3, Section 6.2](../../w03/class-2.md#sec-6-2) reads `fetchaddr`, which does this
    for an 8-byte value). Everything the kernel knows about one process lives in that
    process's `struct proc` ([Week 2, Section 1.4](../../w02/class-1.md#sec-1-4)).

    **What this run showed.** `a7` was 22, your new number. `a0` was 32768, the mask,
    a plain integer. `a1` was `0x3fd0`: not the string, but an address in `sandbox`'s
    memory. `argstr` copied the string `"-"` from there into the kernel's buffer
    `path`. Afterwards `myproc()->sysmask` held 32768.

    **Why the run confirms the theory.** The integer arrived ready to use. The string
    did not, because it never left the program's memory: only its address crossed in
    a register. `argstr` is the check-then-copy step, and it returns -1 if the address
    is not valid in that process. The mask then landed in this process's own
    `struct proc`.

To finish: after that last `continue` the kernel is running, and gdb does not read
commands while it runs, so `quit` typed now does nothing. First press Ctrl-C in
Terminal 2. gdb stops the kernel, prints `Program received signal SIGINT` (that is
normal) and gives you `(gdb)` back. Then type `quit`. Then press Ctrl-a then x in
Terminal 1.

??? success "The answer: the two blanks"

    (1) `argstr(1, path, MAXPATH)`. Argument 1 is the string; `argstr` copies it from
    the user program's memory into `path`, at most `MAXPATH` bytes, and returns -1 if
    the address is bad. (2) `return 0;`.

??? success "The answer: `sys_interpose()`, complete (lines 109 to 131 of `kernel/sysproc.c`)"

    ```c linenums="109"
    // interpose(mask, path): restrict which system calls the calling process may
    // make.  A bit set in `mask` (bit 1<<SYS_xxx) rejects that system call.
    // If `path` is not "-", a masked open/exec is still allowed when its pathname
    // argument equals `path`.  The mask and path are inherited by fork children.
    uint64
    sys_interpose(void)
    {
      int mask;
      char path[MAXPATH];
      struct proc *p = myproc();

      argint(0, &mask);
      if(argstr(1, path, MAXPATH) < 0)
        return -1;

      p->sysmask = (uint32)mask;
      if(path[0] == '-' && path[1] == '\0')
        p->syspath[0] = '\0';               // "-" means no allowed path
      else
        safestrcpy(p->syspath, path, MAXPATH);
      p->nblocked = 0;
      return 0;
    }
    ```

    Line by line. `argint(0, &mask)` reads `a0` into `mask`. `argstr(1, path, MAXPATH)`
    copies the string whose address is in `a1` into `path`. `(uint32)mask` stores the
    mask; the cast keeps a negative-looking `int` from being sign-extended into the top
    32 bits of the 64-bit field. The `"-"` test looks at two characters, `path[0] == '-'`
    and `path[1] == '\0'`, so that only the exact string `-` means "no path"; [Step 4](step-4.md)
    has a file named `---` that must not be mistaken for it. `safestrcpy` is the
    kernel's bounded string copy (`kernel/string.c`). `p->nblocked = 0` starts the
    [Step 6](step-6.md) counter over every time a new sandbox is installed.

    The seven other edits are the ones printed above under parts A, B and C. Together
    with this function, they are the complete Step 1.

!!! question "Think"

    `sandbox.c` (lines 38 to 53) calls `fork()` first, and only the child calls
    `interpose()` and then `exec()`. Why does `sandbox` not simply call
    `interpose()` on itself and then `exec()`, with no `fork`?

    Answer it in your own words before you read on. The answer is not printed here.
