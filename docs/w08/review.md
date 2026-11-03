# Exercises and answers

## The week in ten sentences {#the-week}

1. A thread is a second point of execution inside one program: its own program counter, registers and stack, sharing the program's code, heap, globals and page table.
2. Threads give a program parallelism (two parts of one job on two cores at once; the array sum ran 1.9 times faster) and overlap (work while another part waits for a slow device).
3. Which thread runs when is the scheduler's choice, not the program's.
4. One line of C, `counter = counter + 1`, is three instructions, load, add and store, with the new value in a private register between the load and the store.
5. A second thread's load in that gap, after a switch on one CPU or at the same moment on another core, loses an add: a race condition, which left two threads' 20,000,000 adds short by almost half, and short differently every run.
6. The lines that touch shared data are a critical section; they need mutual exclusion, so that they behave atomically, and the plan is to build that from a few small hardware instructions plus help from the OS.
7. `pthread_create` starts a thread with one argument, `pthread_join` waits for it and collects its result (never on the thread's stack), and a mutex around the critical section made the counter right every run, at 23 times the time in one pair of runs (31 in another).
8. A lock must exclude, be fair and be cheap; turning interrupts off works only on one CPU and only for the kernel, and a flag that is tested and then set races against itself.
9. Test-and-set makes the test and the set one instruction, so exactly one thread wins; xv6's `acquire()` is that loop with interrupts off, a fence after the swap and an owner record (and `release()` two fences before its plain store), and the ticket lock adds fairness with fetch-and-add.
10. On one CPU a spinner wastes whole slices, so real locks sleep: a queue with park and unpark (and setpark against the lost wake-up), or on Linux one lock word and a futex, which enters the kernel only when threads collide.

## Exercises {#exercises}

Try each one on paper before you look at the answers. The method each one needs is in the section named in brackets.

1. Name the four things two threads of one program share and the three things each one owns, and say why a switch between them does not change the page table. ([Section 1.3](class-1.md#sec-1-3))
2. Do we need to flush (empty) the TLB, the processor's cache of address translations, when switching between two threads of the same process? Why or why not? (Part 0 for the TLB, [Section 1.3](class-1.md#sec-1-3) for the switch)
3. Why are atomic instructions, by themselves, an impractical way to prevent race conditions? ([Section 2.6](class-1.md#sec-2-6))
4. The counter starts at 50. Write a trace table for one CPU, in the style of [Section 2.4](class-1.md#sec-2-4), in which two threads each run `counter = counter + 1` once and the counter ends at 51. Mark the row where the add is lost. ([Section 2.4](class-1.md#sec-2-4))
5. Three threads share a counter that starts at 7, on one CPU. T1 loads and adds, then is switched out. T2 then completes 3 full adds. T3 then completes 1 full add. Then T1 runs again and stores. What is the counter at the end, what should it have been, and how many adds were lost? ([Section 2.4](class-1.md#sec-2-4))
6. Read the second pair of runs of `counter_time.out`, printed just below the list (as in [Section 3.5](class-1.md#sec-3-5), the capture keeps only main's first and last lines and the `real` time). How many adds did the unlocked run lose? How many times slower was the locked run? Split that slowdown as [Section 6.5](class-2.md#sec-6-5) did, using the one-thread run with the lock (0.42 s). What factor comes from the lock work plus the loss of side-by-side running, and how much of that is the cost per pass and how much the 2 cores no longer working side by side? What factor comes from the two threads getting in each other's way, and how many seconds does that contention cost? What can the 0.33 s of futex time of [Section 6.5](class-2.md#sec-6-5) tell you about those seconds, and what can it not? (Sections [2.2](class-1.md#sec-2-2), [3.5](class-1.md#sec-3-5) and [6.5](class-2.md#sec-6-5))
7. Fill in the five blanks below with these names: `pthread_create`, `pthread_join`, `pthread_mutex_lock`, `pthread_mutex_unlock`, `&job`. The program starts a thread running the function `work` and hands it the address of a variable `job`, waits for the thread, and, inside `work`, protects the line `total = total + 1` with a mutex `m`. Then answer in words: where may `job` live, and why must a result that `work` hands back not be one of `work`'s own local variables? (Sections [3.3](class-1.md#sec-3-3) and [3.5](class-1.md#sec-3-5))

    In main: `____(&p, NULL, work, ____);` then `____(p, NULL);`. Inside `work`: `____(&m);` then `total = total + 1;` then `____(&m);`.
8. Show, with a two-thread trace on one CPU, where the flag lock of [Section 4.3](class-2.md#sec-4-3) lets both threads in. ([Section 4.3](class-2.md#sec-4-3))
9. In two sentences, say why test-and-set succeeds where a plain load and store failed: one sentence for one CPU, one for two CPUs. (Sections [5.1](class-2.md#sec-5-1) and [5.2](class-2.md#sec-5-2))
10. Five threads, A, B, C, D and E, arrive at a free ticket lock in that order. What are `ticket` and `turn` after all five have arrived, and who is inside? Then three unlocks happen. What is `turn` now, who is inside, and how many threads still have to finish with the lock before E gets it? ([Section 5.6](class-2.md#sec-5-6))
11. Why does the code of OSTEP Figure 28.9 (the lock with a queue) use test-and-set on `guard` instead of on `flag`? ([Section 6.3](class-2.md#sec-6-3))
12. What would happen if the lock of OSTEP Figure 28.9 released the guard after calling `park()` instead of before? (Sections [6.3](class-2.md#sec-6-3) and [6.4](class-2.md#sec-6-4))
13. A Linux mutex's lock word is 1: T1 holds it and nobody waits. T2 arrives, then T3 arrives, and both find the lock held. Then T1 unlocks, then the thread that got the lock unlocks, then the last thread unlocks. Following the five moments and the lock word's rules of [Section 6.5](class-2.md#sec-6-5), write the value of the lock word after each step, and count the `futex_wait` and `futex_wake` calls. Assume each `futex_wait` finds the word still 2 and really sleeps. Give each woken thread's own swap a row of its own. Start your table with the rows printed just below the list. ([Section 6.5](class-2.md#sec-6-5))
14. In which of the three cost situations (no contention, contention on one CPU, contention on many CPUs) is a spin lock a fine choice, and why? Use the numbers of [Section 6.6](class-2.md#sec-6-6). ([Section 6.6](class-2.md#sec-6-6))
15. In your own words, in one paragraph for a friend who has not taken this course: why does a lock made of one flag and ordinary loads and stores fail, and what do the hardware and the OS each add? (Chapters 4 to 6)

The capture for [Exercise 6](#exercises), the second pair of runs in `W08_demos/counter_time.out`:

```text
$ time ./counter
main: begin (counter = 0)
main: done with both (counter = 10978208)
real	0m0.052s
$ time ./counter_mutex
main: begin (counter = 0)
main: done with both (counter = 20000000)
real	0m1.607s
```

The start of the table for [Exercise 13](#exercises):

| step | lock word after | calls |
|---|---|---|
| start: T1 holds, nobody waits | 1 | none |
| T2 arrives: compare-and-swap finds 1, leaves it; swaps in 2, the swap hands back 1; sleeps | 2 | `futex_wait` |
| T3 arrives: ... | | |

## Answers {#answers}

**[Answer 1](#answers).** Shared: the code, the heap, the global variables and the page table. Owned: the program counter, the registers (saved in the thread's TCB at a switch) and the stack. The page table does not change because both threads live in the same address space: the same address must mean the same byte to both, so there is nothing to switch.

**[Answer 2](#answers).** No. (To flush the TLB is to empty it, so every translation must be looked up again.) The TLB caches translations made with the current page table. All threads of one process use that same page table, so every cached translation is still right after the switch. Switching to a thread of a different process does change the page table, and then the TLB must be flushed (or its entries tagged with an address-space id, as some hardware does). That is one concrete reason a thread switch is cheaper than a process switch.

**[Answer 3](#answers).** Because a critical section can be anything. One atomic add-to-memory instruction would fix `counter.c`, but the next program might add an item to a linked list, and the one after that might rebalance a tree. No processor can offer an atomic instruction for every operation a program might want to make atomic. So the hardware gives a few small atomic instructions, and software builds general tools (locks) from them that make any critical section behave atomically.

**[Answer 4](#answers).** One possible table (counter starts at 50):

| OS | Thread 1 | Thread 2 | eax of the running thread | counter |
|---|---|---|---|---|
| | load | | 50 | 50 |
| | add | | 51 | 50 |
| interrupt: save T1, restore T2 | | | | |
| | | load | 50 | 50 |
| | | add | 51 | 50 |
| | | store | 51 | 51 |
| interrupt: save T2, restore T1 | | | 51 | 51 |
| | store (the add of T2 is lost here) | | 51 | 51 |

Thread 2 loaded 50 because thread 1's 51 was only in thread 1's saved register. Both stored 51; 50 + 1 + 1 should be 52.

**[Answer 5](#answers).** T1 loads 7 and adds: its register holds 8, memory still 7. T2 does 3 full adds: memory goes 7, 8, 9, 10. T3 does 1 full add: memory 11. T1 then stores its stale 8. The counter ends at 8. It should be 7 + 1 + 3 + 1 = 12. Adds lost: 12 − 8 = 4. Check: the only add that survived is T1's own (7 → 8); all four adds made while T1 was switched out were wiped out by its late store.

**[Answer 6](#answers).** Lost: 20,000,000 − 10,978,208 = 9,021,792 adds (check: 10,978,208 + 9,021,792 = 20,000,000). Slowdown: 1.607 / 0.052 = 30.9, about 31 times (check: 0.052 × 31 = 1.61). The split is a reading of the three wall times; the factors multiply back to 31 by construction, so they divide it rather than test it. The lock work plus the loss of side-by-side running is 0.42 / 0.052 ≈ 8.1 times. Per pass, 21 ns against 0.052 s / 10,000,000 = 5.2 ns for an unlocked add is about 4.04 times, and the factor 2 for the passes no longer running side by side makes 4.04 × 2 ≈ 8.1. The contention is 1.607 / 0.42 ≈ 3.8 times. The contention costs 1.607 − 0.42 ≈ 1.19 s. The 0.33 s of futex time says the kernel did real work for the contention. It cannot be subtracted from the 1.19 s: it is kernel CPU time added up over two threads, not wall time, and it comes from a separate run under strace. So the rest is not measured. Its likely causes, as in [Section 6.5](class-2.md#sec-6-5), are the time a thread lies asleep waiting for the other, the switches around sleeps and wake-ups, and the lock word's cache line moving between the cores.

**[Answer 7](#answers).** In main: `pthread_create(&p, NULL, work, &job);` then `pthread_join(p, NULL);`. Inside `work`: `pthread_mutex_lock(&m);`, then `total = total + 1;`, then `pthread_mutex_unlock(&m);`.

Where `job` may live: anywhere that lasts as long as the thread uses it. Main's own part of the stack is fine, because main waits at join until the thread is done; so are a global variable and the heap. Why a result must not be one of `work`'s locals: `work`'s stack is reclaimed when the thread returns, and main reads the result only after join, so a pointer into that stack would point at nothing. A result must go in memory that outlives the thread: the heap (`malloc`), as in [Section 3.3](class-1.md#sec-3-3), or a global variable, as `psum.c`'s `sum[2]` did.

**[Answer 8](#answers).** Flag starts at 0:

| Thread 1 | Thread 2 |
|---|---|
| calls `lock()`; `while (flag == 1)`: it is 0, falls out | |
| interrupt: switch to Thread 2 | |
| | calls `lock()`; `while (flag == 1)`: still 0, falls out |
| | `flag = 1;` goes in |
| | interrupt: switch to Thread 1 |
| `flag = 1;` goes in, too | |

The test and the set are two steps; thread 2's test landed in the gap between thread 1's test and its set.

**[Answer 9](#answers).** On one CPU: interrupts are taken between instructions, never inside one, and test-and-set reads the old value and writes the 1 in a single instruction, so no switch can land between the test and the set. On two CPUs: the hardware performs two swaps to the same address one after the other, so exactly one of them reads the 0 and every later one reads the 1 it left.

**[Answer 10](#answers).** After five arrivals: A, B, C, D, E took tickets 0, 1, 2, 3, 4, so `ticket` = 5, and `turn` = 0, so A is inside. Each unlock adds 1 to `turn`: after three unlocks `turn` = 3, so D (ticket 3) is inside. E holds ticket 4: one thread, D, which is inside now, has to finish before E gets the lock. Check: tickets handed out (5) minus the sign (3) is 2, the threads not yet finished, D and E itself; leaving out E, 5 − 3 − 1 = 1 thread, D, must finish before E gets the lock.

**[Answer 11](#answers).** `flag` says whether the lock is held; `guard` protects the lock's own bookkeeping, the flag and the queue, for the few instructions that read and change them. Suppose `lock()` tested and set `flag` directly. A thread could find the flag at 1, and before it had joined the queue, the holder could unlock, find the queue empty, and set the flag to 0. The thread would then join the queue and park with nobody coming to wake it: a lost wake-up. With the guard held, checking the flag, joining the queue and releasing the guard happen as one unit, and a thread spins only on the guard, for a few instructions, never for the length of the user's critical section.

**[Answer 12](#answers).** The thread would fall asleep still holding the guard. Every other thread, including the owner trying to unlock, would spin on the guard and never get it. The owner cannot release, so it never reaches `unpark()`, so the sleeper is never woken: the system is stuck. The guard must be released before `park()`, and that is exactly what opens the small gap that `setpark()` closes ([Section 6.4](class-2.md#sec-6-4)).

**[Answer 13](#answers).** Start: 1 (T1 holds, nobody waits).

| step | lock word after | calls |
|---|---|---|
| T2 arrives: compare-and-swap finds 1, leaves it; swaps in 2, the swap hands back 1; sleeps | 2 | `futex_wait` |
| T3 arrives: compare-and-swap finds 2, leaves it; the word already says 2, so it sleeps | 2 | `futex_wait` |
| T1 unlocks: its swap puts 0 in and hands back 2, so it wakes one sleeper | 0 | `futex_wake` |
| the woken thread (say T2) swaps in 2, gets back 0: the lock is T2's | 2 | none |
| T2 unlocks: swap puts 0 in, hands back 2; wakes one sleeper (T3, the only one left) | 0 | `futex_wake` |
| T3 wakes, swaps in 2, gets back 0: the lock is T3's | 2 | none |
| T3 unlocks: swap puts 0 in, hands back 2; wakes; nobody is asleep | 0 | `futex_wake` |

Two waits and three wakes; the last wake finds nobody, the price of "may be asleep". The kernel does not promise which sleeper the first wake picks, so T3 may get the lock first; the values and the counts come out the same. (This assumes each `futex_wait` found the word still 2 and really slept; if an unlock had got in first, that wait would have returned at once, one of the "errors" of [Section 6.5](class-2.md#sec-6-5).)

**[Answer 14](#answers).** No contention: any lock is fine; the uncontended pthreads mutex cost about 21 ns per pass, most of it the lock and unlock, and never entered the kernel. (No uncontended spin-lock run was measured. As an estimate, it would cost about the same or a little less. The mutex's lock and unlock are both atomic instructions, while the spin lock's unlock is a plain store; with nobody else wanting the lock, all of them work on a cache line this CPU already holds.) Contention on many CPUs: a spin lock is fine when the holder keeps running on another CPU, because the spin ends when the section does. On two cores it cost no wall-clock time even with 1 ms sections (0.44 s against 0.45 s), and for short sections the waiting core loses very little. Contention on one CPU: a spin lock is a poor choice, because the spinner sits on the only CPU, the one the holder needs, and burns its slice (0.67 s against 0.45 s; 0.22 s of spinning).

**[Answer 15](#answers).** One possible answer: A simple lock is just a number in memory that says "taken" or "free". To take it, a thread must check that it is free and then mark it taken. With ordinary instructions those are two separate steps. Another thread, switched in by the timer or running on another core, can check in between. Then both see "free" and both walk in: the same race the lock was supposed to prevent. The hardware fixes this with one instruction, test-and-set, that checks and marks in a single step nobody can split, so exactly one thread wins. But the losers would then spin, burning the CPU, and on one CPU they would spin while the winner cannot even run. So the OS adds calls to put a waiting thread to sleep and to wake it when the lock is released. In the textbook's lock ([Section 6.3](class-2.md#sec-6-3)) the sleepers wait in a queue and are served in order. The Linux mutex wakes one sleeper but lets a thread that is already running take the lock first, so it is not strictly in order.
