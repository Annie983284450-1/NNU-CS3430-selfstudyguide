# Step 3. `kmemsteals()`: count the steals from a program

## 3.1 Why this step

The question: how do you make kernel behaviour visible from a program?

[Step 2](step-2.md)'s steal loop runs inside the kernel, and from a program you cannot see
it happen. Lab 2 taught the route a system call takes into the kernel. Here
you add one more, `kmemsteals(cpu)`, which returns how many pages CPU `cpu`
has stolen so far, and a user program `steals` that adds those up. It is the
same plumbing you did in Lab 2, one line in each of six files, plus one
function.

The picture: a counter on each drawer that ticks every time its owner takes a
tray from someone else's drawer, and a window where the manager can read all
four counters.

## 3.2 The picture

```
   user/steals.c                          kernel
   for c in 0..NCPU-1:                    sys_kmemsteals()   kernel/sysproc.c
       kmemsteals(c)  --- ecall ------>      argint(0, &cpu)
                                             return kmemsteals(cpu)   kernel/kalloc.c
                                                    return kmem[cpu].nsteal

   The route, file by file (same as Lab 2):
     user/user.h      int kmemsteals(int cpu);        what the program compiles against
     user/usys.pl     entry("kmemsteals");            the three-instruction stub (li a7; ecall; ret)
     kernel/syscall.h #define SYS_kmemsteals 37       the number in a7
     kernel/syscall.c [SYS_kmemsteals] sys_kmemsteals, the table entry
     kernel/sysproc.c sys_kmemsteals()                 reads the argument, calls the kernel function
     kernel/defs.h    the two prototypes
     Makefile         $U/_steals\                      builds the program onto xv6's disk
```

## 3.3a Procedure, part A: the function in `kernel/kalloc.c`

Append at the end of the file, after `kalloc`'s closing `}` on line 143
(if yours is on a different line, you have an extra or missing blank line
somewhere in [Step 2](step-2.md); that is harmless, but the line numbers below assume
143) and one blank line:

```c
// Return how many pages the given CPU has stolen from other CPUs' free lists.
// (NNU exercise: an observable window onto the per-CPU stealing behaviour.)
int
kmemsteals(int cpu)
{
  if(cpu < 0 || cpu >= NCPU)
    return -1;
  return kmem[cpu].nsteal;
}
```

## 3.3b Procedure, part B: the plumbing, one line each

Each file already has the neighbouring lines shown; add the one marked. Use
`grep -n` to find the spot.

**`kernel/defs.h`, two lines.** After `void            kfree(void *);`
(line 67) add the kernel prototype, and after
`uint64          sys_rwlktest(void);` (line 130 before the edit) add the
system-call prototype:

```c
void*           kalloc(void);
void            kfree(void *);
int             kmemsteals(int);
void            kinit(void);
```

```c
void            write_acquire(struct rwspinlock*);
void            write_release(struct rwspinlock*);
uint64          sys_rwlktest(void);
uint64          sys_kmemsteals(void);
void            rwsharedinit(void);
uint64          sys_rwset(void);
uint64          sys_rwget(void);
```

**`kernel/syscall.h`.** After `#define SYS_cpupin    36` (line 39). 37 is
the next free number; 38 and 39 are already taken by `rwset` and `rwget`,
which [Step 5](step-5.md) uses:

```c
#define SYS_pgpte     33
#define SYS_kpgtbl    34
#define SYS_rwlktest  35
#define SYS_cpupin    36
#define SYS_kmemsteals 37
#define SYS_rwset     38
#define SYS_rwget     39
```

**`kernel/syscall.c`.** In the table, after `[SYS_rwlktest] sys_rwlktest,`
(line 157):

```c
#endif
#ifdef LAB_LOCK
[SYS_rwlktest] sys_rwlktest,
[SYS_kmemsteals] sys_kmemsteals,
[SYS_cpupin] sys_cpupin,
[SYS_rwset] sys_rwset,
[SYS_rwget] sys_rwget,
#endif
```

**`kernel/sysproc.c`.** At the very end of the file, after the `#endif` that
closes `sys_cpupin` (line 159), one blank line and then a new block:

```c
#ifdef LAB_LOCK
// kmemsteals(cpu): how many pages CPU `cpu` has stolen from other CPUs' lists.
uint64
sys_kmemsteals(void)
{
  int cpu;
  argint(0, &cpu);
  return kmemsteals(cpu);
}
#endif
```

**`user/user.h`.** After `int rwlktest(void);` (line 44):

```c
#ifdef LAB_LOCK
int rwlktest(void);
int kmemsteals(int cpu);
int cpupin(int);
int rwset(int);
int rwget(void);
#endif
```

**`user/usys.pl`.** After `entry("rwlktest");` (line 51):

```perl
entry("pgpte");
entry("kpgtbl");
entry("rwlktest");
entry("kmemsteals");
entry("cpupin");
entry("rwset");
entry("rwget");
```

**`Makefile`.** In the `ifeq ($(LAB),lock)` block of `UPROGS` (line 255),
after `$U/_rwlktest\` (line 259), add `$U/_steals\` with a tab in front and a
backslash after. `_rwsharedtest` stays last, with no backslash:

```make
ifeq ($(LAB),lock)
UPROGS += \
	$U/_kalloctest\
	$U/_stats\
	$U/_rwlktest\
	$U/_steals\
	$U/_rwsharedtest
endif
```

`user/steals.c` already exists; it is the program that calls `kmemsteals`
for every CPU and prints the total. Open it and read it, it is 23 lines.

Then rebuild and run.

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ steals
$ kalloctest
$ steals
```

## 3.4 You should see

`steals` right after boot:

```
$ steals
no steals
```

Booting, `init` and the shell take a few dozen pages, all from CPU 0's own
share, so nothing has been stolen yet. Then `kalloctest` runs all four tests
(two to four minutes) and `steals` again:

```
test4 OK

$ steals
steals detected: 6153155
```

Your number will differ; any number above zero is right. The steals come
from `test2` and `test4`, which take every free page in the machine: the
process doing that empties its own list and then takes lists 4 to 7 (which
no running CPU ever refills) and the other three CPUs' lists.

!!! theory "Connect to theory: a system call is a number in a register"

    **What the theory says.** A program names a kernel service by a number, never by an
    address. The stub puts the number in `a7` and runs `ecall`, and the kernel's
    `syscall()` looks the number up in its table of handlers
    ([Week 2, Sections 4.4 to 4.6](../../w02/class-2.md#sec-4-4)).

    **What this run showed.** Before `kalloctest`, `steals` printed `no steals`; after it,
    `steals detected: 6153155`, a counter that lives in the kernel's `kmem` array.

    **Why the run confirms the theory.** `steals` cannot read kernel memory. The only way
    that number reached it is the route of the theory: the new stub loads 37 into `a7`, the
    table entry turns 37 into `sys_kmemsteals`, and the result comes back in `a0`. Without
    the table line the number has no handler, and without the `UPROGS` line there is no
    program at all.

The grader has a test for this step: `./grade-lab-lock kmemsteals` (quit xv6
first). It runs `kalloctest` and then `steals` and looks for
`steals detected:`.

??? success "3.5 The answer: `kmemsteals()` and all seven plumbing lines"

    They are the listings above; Part A is the whole function and every listing
    in Part B shows the added line with its neighbours.

??? success "3.5b Reading the answer"

    The seven edits are one system call seen from both sides, and reading them in
    the order a call travels makes them easy to remember.

    - `user/steals.c` calls `kmemsteals(c)`. The compiler needs a declaration,
      which is the `user/user.h` line.
    - The body of that function does not exist in C. `user/usys.pl` writes it in
      assembly for every `entry(...)` line: load 37 into `a7`, `ecall`, return.
      `make` runs the script and compiles the result as `user/usys.S`.
    - `ecall` traps into the kernel. `syscall()` in `kernel/syscall.c` reads
      `a7` and calls `syscalls[37]`, which the table line makes `sys_kmemsteals`.
      The `kernel/syscall.h` line is where 37 gets its name.
    - `sys_kmemsteals` in `kernel/sysproc.c` fetches the first argument with
      `argint` (it is in the saved `a0` of the trap frame, the same place Lab 2
      looked) and calls the real function. The second `kernel/defs.h` line is
      its declaration; the first is the declaration of `kmemsteals` itself, which
      `sysproc.c` needs because the function lives in another file.
    - `kmemsteals` in `kernel/kalloc.c` range-checks the CPU number (so a bad
      argument gives -1, not a read past the end of the array) and returns the
      counter. The value goes back in `a0` and becomes the return value of the C
      call in `steals.c`.
    - The `Makefile` line is what puts a program named `steals` on xv6's disk.
      `$U/_steals` is the linked binary; `mkfs` strips the underscore when it
      builds `fs.img`. Without that line everything compiles and the shell still
      says `exec steals failed`.

!!! question "Think"

    Right after boot, `steals` prints `no steals`. During `kalloctest` the total
    becomes large. `NCPU` is 8 and QEMU runs 4 CPUs. Where do the first stolen
    pages come from, and why does the count keep growing through `test4` even
    though `test4` allocates and frees the same pages over and over?

    Answer it in your own words before you read on. The answer is not printed here.
