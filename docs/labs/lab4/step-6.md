# Step 6. `time.txt` and `make grade`

## 6.3 Procedure

**`time.txt`** does not exist yet. Create it with one line holding a whole
number: the hours you spent on this lab. The grader rejects anything else
(`time.txt does not contain a single integer`), and prints
`Cannot read time.txt` if the file is missing.

**On Ubuntu (or Mac), in the lab folder** (quit xv6 first with Ctrl-a then x):

```
$ echo 8 > time.txt
$ cat time.txt
$ make grade
```

(Put your own number, not 8.)

`make grade` rebuilds what changed and runs `kalloctest`,
`usertests sbrkmuch`, `rwlktest`, the full `usertests -q`, `kalloctest` plus
`steals`, `rwsharedtest`, and checks `time.txt`. It takes about five minutes
on a desktop and ten to fifteen on a 2-core laptop; `kalloctest` and
`usertests` are the slow parts.

## 6.4a You should see, group A (4 or more real cores)

Captured on the 8-core desktop, all CPUs. This is the student tree plus
exactly the code in this lab:

```
== Test running kalloctest == (59.2s)
== Test   kalloctest: test1 ==
  kalloctest: test1: OK
== Test   kalloctest: test2 ==
  kalloctest: test2: OK
== Test   kalloctest: test3 ==
  kalloctest: test3: OK
== Test   kalloctest: test4 ==
  kalloctest: test4: OK
== Test kalloctest: sbrkmuch == kalloctest: sbrkmuch: OK (6.8s)
== Test running rwlktest == (24.5s)
== Test   rwlktest ==
  rwlktest: OK
== Test usertests == usertests: OK (101.0s)
== Test kmemsteals (NNU steal counter) == kmemsteals (NNU steal counter): OK (58.1s)
== Test rwshared (NNU rwlock-protected record) == rwshared (NNU rwlock-protected record): OK (1.2s)
== Test time ==
time: OK
Score: 110/110
```

The times in parentheses will differ. `Score: 110/110` is the line to
look for.

## 6.4b You should see, group B (2 cores with hyperthreading)

The same desktop, pinned to CPUs 0 to 3 (2 real cores, 4 threads), which is
what a group B laptop is:

```
== Test running kalloctest == (55.5s)
== Test   kalloctest: test1 ==
  kalloctest: test1: OK
== Test   kalloctest: test2 ==
  kalloctest: test2: OK
== Test   kalloctest: test3 ==
  kalloctest: test3: OK
== Test   kalloctest: test4 ==
  kalloctest: test4: OK
== Test kalloctest: sbrkmuch == kalloctest: sbrkmuch: OK (6.7s)
== Test running rwlktest == (23.4s)
== Test   rwlktest ==
  rwlktest: FAIL
    ...
         rwspinlock_test(3): -1
         rwspinlock_test(2): -1
         rwspinlock_test(1): 0
         rwlktest: 2/4 CPUs succeeded
         $ qemu-system-riscv64: terminating on signal 15 from pid 10717 (make)
    MISSING '^rwlktest: 4/4 CPUs succeeded$'
== Test usertests == usertests: OK (101.5s)
== Test kmemsteals (NNU steal counter) == kmemsteals (NNU steal counter): OK (56.0s)
== Test rwshared (NNU rwlock-protected record) == rwshared (NNU rwlock-protected record): OK (1.2s)
== Test time ==
time: OK
Score: 80/110
```

One `FAIL`, `rwlktest`, 30 points, for the reason given in [Step 4](step-4.md).
`Score: 80/110` is your expected line. Everything else, including `test4`,
`usertests` and the two NNU tests, says `OK`.

## 6.4c You should see, group C (2 CPUs, no hyperthreading)

A 2-core cloud machine. This is the student tree plus exactly the code in
this lab:

```
== Test running kalloctest == (106.9s)
== Test   kalloctest: test1 ==
  kalloctest: test1: OK
== Test   kalloctest: test2 ==
  kalloctest: test2: OK
== Test   kalloctest: test3 ==
  kalloctest: test3: OK
== Test   kalloctest: test4 ==
  kalloctest: test4: OK
== Test kalloctest: sbrkmuch == kalloctest: sbrkmuch: OK (11.3s)
== Test running rwlktest == (49.3s)
== Test   rwlktest ==
  rwlktest: FAIL
    ...
         rwspinlock_test: step 30: done
         rwspinlock_test(0): 0
         rwspinlock_test(1): 0
         rwlktest: 3/4 CPUs succeeded
         $ qemu-system-riscv64: terminating on signal 15 from pid 9107 (make)
    MISSING '^rwlktest: 4/4 CPUs succeeded$'
== Test usertests == usertests: OK (269.3s)
== Test kmemsteals (NNU steal counter) == kmemsteals (NNU steal counter): OK (105.2s)
== Test rwshared (NNU rwlock-protected record) == rwshared (NNU rwlock-protected record): OK (2.4s)
== Test time ==
time: OK
Score: 80/110
```

`rwlktest` fails as in group B (`3/4` this time; `2/4` in other runs).
`kalloctest: test4` passed in this run and failed in an earlier one on the
same box; on 2 plain cores it is close to the line, and either result is
your hardware.

## If you are in group B or C

Your own laptop's `make grade` shows the `FAIL` line exactly as shown for
your group above, and `Score: 80/110`. Nothing has to be run anywhere else.
What is worth understanding is the `rwlktest` output you got: which message
appeared, which stage it belongs to, and why two real cores can miss a timing
check that four real cores pass.

## Everything you changed in this lab

| File | What |
|---|---|
| `kernel/kalloc.c` | `kmem[NCPU]` with `lock`, `freelist`, `n`, `nsteal`; `kinit` loop; round-robin `freerange`; per-CPU `kfree`; `kalloc` fast path and whole-list steal with two locks; `kmemsteals()` |
| `kernel/defs.h` | `kmemsteals`, `sys_kmemsteals` prototypes |
| `kernel/syscall.h`, `kernel/syscall.c`, `kernel/sysproc.c` | `SYS_kmemsteals 37`, the table entry, `sys_kmemsteals()` |
| `user/user.h`, `user/usys.pl` | `kmemsteals` declaration and stub entry |
| `Makefile` | `$U/_steals\` in `UPROGS` |
| `kernel/spinlock.h` | the four fields of `struct rwspinlock` |
| `kernel/spinlock.c` | the five reader-writer lock functions; `sys_rwset`, `sys_rwget` under the lock |
| `time.txt` | your hours |

The complete standard code for all ten files is in the "The answer"
sections of this lab's pages. Applied to a fresh `lab4-lock-student` folder, it
scores 110/110 on a 4-core machine.

## What you can do now

You can read a lock's contention counter and say what it measures. You can
take one shared structure under one lock and split it per CPU, decide what
happens when one CPU's share runs out, and explain why the length of time a
lock is held matters more than how often it is taken. You can write a
reader-writer lock that readers share and writers cannot be starved by, and
you have seen what a torn read is and what prevents it. And you know, from
your own laptop, that two of these measurements depend on the hardware and
not only on the code.
