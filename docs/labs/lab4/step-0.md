# Step 0. Your laptop's cores, and the starter's numbers (no points, but do it first)

## 0.1 Why this step

The question: how much time do four CPUs waste on one lock?

Everything in this lab is measured against the starter, so the first thing to
do is run the starter and write its numbers down. But before that, find out
how many real cores your laptop has, because two of the tests only mean
something on four real cores.

The picture: four cashiers and one cash drawer. If every sale has to go
through the one drawer, three cashiers stand waiting while one uses it. The
drawer is the lock. The time spent standing is the contention. Counting how
many times a cashier reached for the drawer and found it busy is exactly what
`kalloctest` does.

## 0.3a Procedure, part A: which group are you in

**On Ubuntu (or Mac), in the lab folder:**

```
$ cd ~/lab4-lock-student
$ ls
$ lscpu | grep -E '^(CPU\(s\)|Thread\(s\) per core|Core\(s\) per socket|Socket\(s\))'
```

(Mac: `sysctl -n hw.physicalcpu hw.logicalcpu` prints two numbers, real cores
then threads. Use them as "Core(s)" and "CPU(s)" below.)

The first `ls` should show `Makefile`, `user`, `kernel`, `mkfs` and
`grade-lab-lock` side by side. If it also shows another `lab4-lock-student`,
you have a folder inside a folder; work in the one where `Makefile` and
`user/` sit next to each other. On Windows the lab must be in your Ubuntu home
folder, exactly as in Labs 1 to 3: `pwd` must start with `/home/`, not
`/mnt/c/`.

The `lscpu` line prints four numbers. Multiply `Core(s) per socket` by
`Socket(s)` to get your real cores. On a 12-core desktop it looks like this:

```
CPU(s):                                  24
Thread(s) per core:                      2
Core(s) per socket:                      12
Socket(s):                               1
```

Now pick your group and remember it. Every "You should see" below refers to
it.

| Group | Your laptop | What it means for this lab |
|---|---|---|
| **A** | 4 or more real cores | Every test in this lab can pass on your laptop. Expect `Score: 110/110`. |
| **B** | 2 real cores, 2 threads per core (`CPU(s): 4`) | Every test except `rwlktest` passes on your laptop. `rwlktest` needs four CPUs running at the same moment; with two real cores it reports `2/4` or `3/4` and the grader prints `FAIL` for it. Expect `Score: 80/110` on your own laptop. |
| **C** | 2 CPUs, no hyperthreading (`CPU(s): 2`) | As group B. `kalloctest test4` is also close to the line on this hardware: it passed in some of our runs and failed in others. |

Group B and C: this is your hardware, not your code, and the guide tells you
at [Step 4](step-4.md) and [Step 6](step-6.md) exactly which lines will say `FAIL` on your laptop. You
write and run everything on your own laptop like everyone else, and you do
not need a `4/4` line from any other machine. [Step 4](step-4.md) explains what the
failing line means. Laptops with
4 real cores that are busy (a browser with many tabs, a video call, a virtual
machine) can also fail `rwlktest`; close those and run again before you
decide you are in group B.

## 0.3b Procedure, part B: the starter

**On Ubuntu (or Mac), in the lab folder:**

```
$ make clean
$ make qemu
```

`make clean` once at the start of the lab, then never again; a full build
takes about a minute. `make qemu` prints the build, then
`xv6 kernel is booting`, then `hart 1 starting`, `hart 2 starting`,
`hart 3 starting` (the four CPUs; the order varies), then `init: starting sh`
and the `$` prompt.

**At the xv6 `$` prompt:**

```
$ kalloctest
```

This takes two to four minutes. It runs four tests. Wait for `test4` to
finish and the `$` prompt to come back. Then, in the same xv6:

```
$ rwsharedtest
$ steals
```

and finally, in a fresh xv6 (quit with Ctrl-a then x, then `make qemu` again):

```
$ rwlktest
```

## 0.4 You should see

`kalloctest` on the starter, group A (8-core desktop; your numbers will be
different, and that is the point):

```
$ kalloctest
start test1
test1 results:
--- lock kmem stats
lock: kmem: #test-and-set 26512 #acquire() 433058
--- top 5 contended locks:
lock: virtio_disk: #test-and-set 112508 #acquire() 180
lock: proc: #test-and-set 84473 #acquire() 643870
lock: proc: #test-and-set 71136 #acquire() 643858
lock: kmem: #test-and-set 26512 #acquire() 433058
lock: proc: #test-and-set 24325 #acquire() 243730
tot= 26512
test1 FAIL
start test2
total free number of pages: 32463 (out of 32768)
..........
test2 OK
start test3
..........child done 10000

test3 OK
start test4
............................child done 100000
.child done 100000
.child done 100000
--- lock kmem stats
lock: kmem: #test-and-set 361730 #acquire() 2907562
--- top 5 contended locks:
lock: wait_lock: #test-and-set 59187562 #acquire() 40032
lock: proc: #test-and-set 364939 #acquire() 1897715
lock: kmem: #test-and-set 361730 #acquire() 2907562
lock: proc: #test-and-set 342067 #acquire() 2355980
lock: virtio_disk: #test-and-set 112508 #acquire() 180
tot= 361730
test4 FAIL m 84583 n 361730
```

The same on a group C machine (a 2-core cloud machine):

```
$ kalloctest
start test1
test1 results:
--- lock kmem stats
lock: kmem: #test-and-set 33405938 #acquire() 433058
--- top 5 contended locks:
lock: kmem: #test-and-set 33405938 #acquire() 433058
lock: proc: #test-and-set 20678139 #acquire() 570196
lock: proc: #test-and-set 19323061 #acquire() 570180
lock: proc: #test-and-set 4194500 #acquire() 169800
lock: proc: #test-and-set 4036114 #acquire() 169798
tot= 33405938
test1 FAIL
start test2
total free number of pages: 32463 (out of 32768)
..........
test2 OK
start test3
..........child done 10000

test3 OK
start test4
............................child done 100000
.child done 100000
.child done 100000
--- lock kmem stats
lock: kmem: #test-and-set 82802460 #acquire() 3522640
--- top 5 contended locks:
lock: kmem: #test-and-set 82802460 #acquire() 3522640
lock: proc: #test-and-set 45518677 #acquire() 1682495
lock: proc: #test-and-set 40412489 #acquire() 2089254
lock: proc: #test-and-set 34756649 #acquire() 812428
lock: proc: #test-and-set 22144099 #acquire() 1347032
tot= 82802460
test4 FAIL m 58326466 n 82802460
```

Read the first block. `test1` forks three children that each allocate and
free a page 100,000 times. `lock: kmem: #test-and-set N #acquire() M` says the
one `kmem` lock was taken M times and that CPUs spun on it, failed to get it,
N times. `tot=` adds up the spins on every lock whose name starts with
`kmem`, and `test1 FAIL` means that total was too high. `test2` and `test3`
say `OK` even on the starter: they check that memory can be allocated and
freed correctly, and the starter is correct, only slow. `test4` is the same
kind of measurement as `test1` under a harder load, so it fails too. The spin
counts (`#test-and-set`, `tot=`, `m` and `n`) change on every run and on
every machine.

!!! theory "Connect to theory: a correct lock can still be a slow one"

    **What the theory says.** `kalloc()` pops a page off one shared free list and
    `kfree()` pushes one on. Each is a read of the head and a write of the head, a
    critical section, so xv6 puts one lock, `kmem.lock`, around both
    ([Week 8, Section 2.7](../../w08/class-1.md#sec-2-7)). xv6's `acquire()` takes a lock by
    repeating an atomic swap until it gets a 0; a CPU that keeps getting a 1 is spinning,
    doing no work ([Week 8, Section 5.3](../../w08/class-2.md#sec-5-3)).

    **What this run showed.** On the starter, `test1` said `FAIL`: the one `kmem` lock was
    taken 433,058 times, and CPUs failed to get it 26,512 times on the 8-core desktop and
    33,405,938 times on the 2-core machine.

    **Why the run confirms the theory.** Each of those failed swaps is a CPU standing at
    the one lock, doing no work, while another CPU pops or pushes a page. One lock around
    one list makes all four CPUs take turns for every page. That waiting is the cost this
    lab sets out to remove.

`rwsharedtest` on the starter:

```
$ rwsharedtest
rwshared: FAIL set 5 but read back -1
```

`steals` on the starter:

```
$ steals
exec steals failed
```

`exec steals failed` is the shell saying there is no such program on the
disk. `user/steals.c` is in the folder, but it is not in the Makefile's
`UPROGS` list yet. [Step 3](step-3.md) adds it.

`rwlktest` on the starter:

```
$ rwlktest
rwspinlock_test: step 1: initrwlock
rwspinlock_test: step 2: cpanic: acquire
```

A kernel panic, and xv6 stops. The starter's reader-writer lock is a
placeholder, one plain spinlock, and the test takes it as a reader a million
times in a row on one CPU. A plain spinlock taken twice by the same CPU is a
bug, and xv6's `acquire()` checks for exactly that (`panic: acquire`). This is
the starter; your [Step 4](step-4.md) lock replaces it. Quit with Ctrl-a then x.

Write down your starter `tot=` for `test1`. You compare against it in [Step 1](step-1.md).

!!! question "Think"

    The starter's `test2` and `test3` say `OK` on every machine, and `test1`
    prints a different spin count on every run and on every machine. What is the
    difference between what `test1` measures and what `test2` measures, and why
    is one of them stable and the other not?

    Answer it in your own words before you read on. The answer is not printed here.
