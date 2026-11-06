# Exercises and answers

## The first class in ten points {#the-week}

1. Every tool from the last two weeks works as promised, and our own programs still broke, because the bugs are in how the tools are used or left out. A tool can be used in only a few ways, so one would expect the bugs to come in a few patterns; that is an argument, and the study did not test it. Separately, the study sorted its 74 non-deadlock bugs by kind and found that two patterns cover 97% of them.
2. A study of four big open-source programs (MySQL, Apache, Mozilla, OpenOffice) counted the concurrency bugs that were found and fixed: 105 in all. 74 were not deadlocks, and 31 were deadlocks. A non-deadlock bug is any bug that is not a deadlock: the program may run on and be wrong, crash, or even stop with no circle of holds and wants. In a deadlock bug, threads wait for each other forever, in a circle.
3. The first common pattern is a stretch of code meant to run as one piece, left unprotected, so that another thread's access lands inside it: an atomicity violation. In the MySQL example it is a check and a use of a shared pointer, with a gap where another thread's store can land.
4. The MySQL lines, made runnable with both threads looping, crashed in all three runs: the use read a NULL pointer, the OS sent SIGSEGV (signal 11), and the shell reported exit status 128 + 11 = 139.
5. One lock, taken by every thread around every line that touches the shared thing, makes the check and the use one piece again; three runs of 10,000,000 rounds each finished with no crash.
6. The second common pattern is one thread assuming another has already acted, with nothing enforcing the order: an order violation, here a new thread reading a handle before its creator has stored it.
7. As printed, the Mozilla lines never crashed in 1,000 runs, and with one short loop of other work before the store they crashed in 300 of 300; the logic did not change, only the timing, so a passing run is evidence, not proof, that a program is correct.
8. A flag, a lock and a condition variable make the reader wait until the writer has stored, set the flag and signaled, so the order is enforced rather than hoped for; with the slow store kept in, 200 runs had no crash, which is evidence for that argument; what makes the fix right is the argument from the code. The two patterns together cover 97% of the study's 74 non-deadlock bugs.
9. Two threads that take two locks in opposite orders can each hold the lock the other wants; one run hung in round 1 until `timeout` killed it with exit status 124. A second run, looked at with `ps`, showed all three threads asleep in the same futex call at 0.0% CPU. Reading the code, not the rows, says that the two workers wait for a mutex and `main` waits in `pthread_join()`.
10. Drawn as holds and wants, a deadlock is a cycle, and it needs four conditions at once (mutual exclusion, hold-and-wait, no preemption, circular wait), so a fix only has to make one of them fail. Last week's moved line did that for the buffer's ring: the thread that holds the mutex never waits now, so the one hold-and-wait link that closed the ring is gone. A producer still keeps its item while it waits for the mutex, but that wait always ends. The next class takes the conditions one at a time and tries a fix for each.

## Exercises {#exercises}

Try each one on paper before you look at the answers. The method each one needs is in the section named in brackets.

1. Say which class each of our own two failures belongs to: the counter with no lock, and last week's buffer with the mutex taken before the wait. Say why, in one sentence each. ([Section 1.2](class-1.md#sec-1-2) and [Section 1.3](class-1.md#sec-1-3))
2. Here are two pieces of code from two different programs. For each, name the pattern and the tool that fixes it. (a) Thread 1 runs `if (q->head != NULL) print(q->head->name);` while thread 2 runs `q->head = NULL;`. (b) `main` creates a worker thread and then sets `log = open_log();`; the worker's first line is `write_line(log, "started");`. These are made-up lines. `q` points to a queue, and its field `head` points to the queue's first entry, so `q->head->name` follows two arrows: first to that entry, then to its field `name`. `print()`, `open_log()` and `write_line()` are made-up functions that print a text, open a log file and write a line into it. ([Section 2.1](class-1.md#sec-2-1) to [Section 2.9](class-1.md#sec-2-9))
3. Name the four conditions for deadlock, and for each one point at the line or lines of `deadlock.c` where it shows. ([Section 3.5](class-1.md#sec-3-5) and [Section 3.6](class-1.md#sec-3-6))
4. In the programs of this class, what was the main difference between what caused the non-deadlock bugs and what caused the deadlock bugs? ([Section 1.1](class-1.md#sec-1-1), [Section 1.2](class-1.md#sec-1-2), [Section 2.11](class-1.md#sec-2-11) and [Section 3.7](class-1.md#sec-3-7))
5. What are the four conditions that must hold for deadlock to occur? Explain each in your own words, and say why a deadlock could not form without it. [Exercise 3](#exercises) asked where each condition shows in `deadlock.c`. This one asks why a deadlock needs it. ([Section 3.6](class-1.md#sec-3-6))
6. Using the table of [Section 1.2](class-1.md#sec-1-2): what share of the study's 31 deadlock bugs came from Mozilla, and what share of MySQL's own 23 bugs were deadlocks? Give each as a fraction and as a rounded percent, and check each the other way, by multiplying back as [Section 1.2](class-1.md#sec-1-2) does. ([Section 1.2](class-1.md#sec-1-2) and [Appendix A](appendix.md#appendix-a))
7. A program is run as `./prog; echo $?`. What does it print last if the program was killed by signal number 6? If the last line is 137, which signal number killed it? And what does exit status 124 tell you after `timeout 5 ./prog; echo $?`? ([Section 2.3](class-1.md#sec-2-3) and [Section 3.3](class-1.md#sec-3-3))
8. The second run in `W10_demos/atomicity_fixed.out` is:

    ```text
    $ ./atomicity_fixed > /dev/null; echo $?
    10000000 rounds, pointer in use 4361073 times, no crash
    0
    ```

    In how many rounds did thread 1 find NULL, and what fraction of the rounds is that? Why is a NULL at the check not a crash? ([Section 2.5](class-1.md#sec-2-5))

9. A bank account holds 80 dollars, kept in one shared variable, `balance`. Two threads each run `if (balance >= 50) balance = balance - 50;` once, with no lock. Write a step table (as in [Section 2.1](class-1.md#sec-2-1)) in which both withdrawals happen and the account ends at −20. Name the pattern, and give the fix. ([Section 2.1](class-1.md#sec-2-1) to [Section 2.4](class-1.md#sec-2-4))
10. Three threads and three locks. Thread A holds L1 and waits for L2. Thread B holds L2 and waits for L3. Thread C holds L3 and waits for L1. Write the walk of [Section 3.4](class-1.md#sec-3-4) as a line of arrows, as in [Section 3.6](class-1.md#sec-3-6), starting at thread A, and say whether this is a deadlock. Then say what changes if thread C holds L3 and waits for nothing. ([Section 3.4](class-1.md#sec-3-4))
11. A programmer simplifies `ordering_fixed.c`: thread 2 keeps the lock but drops the flag and the `while`, so its lines 16 to 19 become `lock; pthread_cond_wait(&mtCond, &mtLock); unlock`, and thread 1 keeps only `lock; pthread_cond_signal(&mtCond); unlock` after its store. Everything else stays, including the slow loop of line 28 before the store. The simplified lines, written out:

    ```text
    thread 2:  pthread_mutex_lock(&mtLock);
               pthread_cond_wait(&mtCond, &mtLock);
               pthread_mutex_unlock(&mtLock);
               mState = mThread->State;
    thread 1:  for (volatile int k = 0; k < 100000; k++) ;   // line 28, the slow loop, kept
               mThread = t;
               pthread_mutex_lock(&mtLock);
               pthread_cond_signal(&mtCond);
               pthread_mutex_unlock(&mtLock);
    ```

    Write one order of steps in which thread 2 sleeps forever, and say what the flag would have changed. The order you write only has to be possible, not likely: a program that can hang in even one possible order has a bug, however rarely that order comes up. ([Section 2.9](class-1.md#sec-2-9))

12. In your own words, explain to a friend why 1,000 passing runs of `ordering.c` did not show that the program was correct, and what makes `ordering_fixed.c` correct whatever the timing. ([Section 2.8](class-1.md#sec-2-8) to [Section 2.10](class-1.md#sec-2-10))

## Answers {#answers}

**[Answer 1](#answers).** The counter with no lock is a non-deadlock bug: the program ran to the end and printed a wrong total (1,037,269 to 1,071,121 instead of 4,000,000). The buffer with the mutex taken before the wait is a deadlock bug. The consumer slept holding the mutex and waiting for an item. The producer slept waiting for the mutex, with its item still in hand. So each waited for the other, and the program stopped until `timeout` killed it.

**[Answer 2](#answers).** (a) An atomicity violation: a check (`q->head != NULL`) and a use (`q->head->name`) with a gap between them, where thread 2's store of NULL can land. Fix: one lock, taken by both threads around every line that touches `q->head`. (b) An order violation: the worker assumes `main` has already set `log`, and nothing enforces that order; if the worker runs first, it uses a `log` that is not set yet. Fix: make the worker wait for a flag that `main` sets after `open_log()`, with a lock and a condition variable, or with a semaphore started at 0 that `main` posts and the worker waits on.

**[Answer 3](#answers).** Mutual exclusion: line 12 (and line 24), `pthread_mutex_lock(&L1)`, because only one thread can own L1. Hold-and-wait: line 14, `pthread_mutex_lock(&L2)`, where thread 1 waits for L2, if it is held, while L1 is still in hand (line 26 is the same for thread 2). No preemption: no line creates it; it is a property of the lock library, which has no call that takes a lock from its holder. In the program it shows in lines 16 and 17 (and 28 and 29), the only releases, where each holder unlocks by its own choice. Circular wait: the opposite order, L1 then L2 in thread 1 (lines 12 and 14) against L2 then L1 in thread 2 (lines 24 and 26), which lets the waits close into the ring of the walk, thread 1 → L2 → thread 2 → L1 → thread 1.

**[Answer 4](#answers).** [Section 1.1](class-1.md#sec-1-1) already named the two kinds with our own programs: the counter used no tool, and the buffer used a tool in the wrong place. In the programs of this class, a non-deadlock bug came from not enough control: a check and a use with no lock around them, or a read with nothing that makes it wait for the store. A deadlock came from using the control wrong: every lock did its job, and the way they were used formed a circle. In `deadlock.c` it was the order the two locks were taken in; in last week's buffer, the mutex taken before the wait. In our examples the first kind let the program run on and be wrong, or crash; the second stopped it, with each thread waiting for something the next one had, in a circle. A non-deadlock bug can also stop a program, as [Exercise 11](#exercises) shows, but no thread there is stuck because another has something it wants ([Answer 11](#answers)). This is what our examples show, not a rule proved for every bug.

**[Answer 5](#answers).** A lock can belong to one thread at a time (mutual exclusion). Without it, a thread that wants a held lock would simply get it too, and its wait would end. A thread keeps the lock it has while it waits for another (hold-and-wait). Without it, a waiting thread would hold nothing the next one needs, so nobody would be stuck behind it. Nobody can take a held lock away; only the holder gives it back (no preemption). Without it, a waiter could take the lock it wants, and its wait would end. The waits form a circle: each thread waits for the next, and the last waits for the first (circular wait). Without it, there is no ring at all. All four held in `deadlock.c`; if any one is not met, a deadlock cannot form.

**[Answer 6](#answers).** Mozilla had 16 of the 31 deadlock bugs: 16 / 31 = 0.516, about 52%. Check: 0.516 × 31 = 16.0. MySQL had 9 deadlock bugs among its 14 + 9 = 23: 9 / 23 = 0.391, about 39%. Check: 0.391 × 23 = 9.0. (So MySQL's share of deadlocks, 39%, was higher than the whole study's 30%.)

**[Answer 7](#answers).** Killed by signal 6: the shell prints 128 + 6 = 134. Exit status 137, from a run that was killed by a signal: 137 − 128 = 9, so signal number 9 killed it. The rule applies here only because the question says the run was killed; a program can also end on its own with 137. Exit status 124 after `timeout 5`: the program was still running after 5 seconds and `timeout` had to kill it; the program itself never finished, which for a program that should end quickly suggests a hang such as a deadlock.

**[Answer 8](#answers).** Thread 1 ran 10,000,000 rounds and used the pointer 4,361,073 times, so it found NULL in 10,000,000 − 4,361,073 = 5,638,927 rounds. As a fraction: 5,638,927 / 10,000,000 = 0.564, a little more than half. Check: 4,361,073 + 5,638,927 = 10,000,000. A NULL at the check is not a crash because the `if` then skips the use; the dangerous case is only a yes at the check followed by a NULL at the use, and the lock rules that out.

**[Answer 9](#answers).** One step table that ends at −20 (each thread's line is a check, then a load, a subtract and a store):

| step | thread 1 | thread 2 | `balance` |
|---|---|---|---|
| 1 | check: 80 ≥ 50, yes | | 80 |
| 2 | (switched out, or slower) | check: 80 ≥ 50, yes | 80 |
| 3 | `balance = 80 − 50`: store 30 | | 30 |
| 4 | | `balance = 30 − 50`: store −20 | −20 |

Thread 2's check saw 80, but by the time of its use the balance was 30. This is an atomicity violation: a check and a use that should be one piece, with another thread's store in the gap. Fix: one lock, taken by both threads around the check and the subtraction together; then the second thread's check sees 30, finds 30 < 50, and skips the withdrawal.

**[Answer 10](#answers).** The walk from thread A: thread A → L2 → thread B → L3 → thread C → L1 → thread A. Read: A wants L2, held by B; B wants L3, held by C; C wants L1, held by A. The walk comes back to A, so there is a cycle, and it is a deadlock: all three wait forever. If C holds L3 and waits for nothing, the dashed arrow from L1 to C is gone. The walk from A: A wants L2, held by B; B wants L3, held by C; C waits for nobody. The walk ends at C, so there is no cycle: C runs and unlocks L3, then B gets L3, runs and unlocks L2, then A gets L2 and runs.

**[Answer 11](#answers).** One order that hangs. It only has to be possible, and it is: nothing in the simplified program stops thread 1 from reaching its signal before thread 2 reaches its wait.

1. thread 1 stores `mThread`, takes the lock, signals and unlocks; nobody is asleep on `mtCond`, so the signal wakes nobody and is gone;
2. thread 2 takes the lock and calls `pthread_cond_wait()`, which gives the lock back and puts it to sleep;
3. nothing will ever signal `mtCond` again, so thread 2 sleeps forever.

This is the lost wake-up: a condition variable remembers nothing, so a signal sent before the sleeper is on the queue is lost. With the flag, thread 2 would have checked `mtInit` under the lock in step 2, found it at 1, and never slept. The program never ends. To see whether it is a deadlock, apply the test of [Section 1.2](class-1.md#sec-1-2) and [Section 3.4](class-1.md#sec-3-4), a circle of holds and wants. Thread 2 sleeps in `pthread_cond_wait()`, waiting for a signal that was already sent in step 1. Thread 1 holds nothing that thread 2 wants: it gave `mtLock` back in step 1, and the signal it sent is gone. So there is no circle of holds and wants, and the hang is not a deadlock. Counting the join gives only a looser circle of waiting. Thread 1 goes on to the `pthread_join()` at the end of `init()` (line 34 of `ordering_fixed.c`) and waits there for thread 2 to finish, while thread 2 waits for a signal from thread 1. But that wait is not what keeps thread 2 asleep: even outside the join, thread 1 would have no second signal to send. The cause is an order the program needed and did nothing to enforce (the wait before the signal, or a record that the signal came): an order violation, the pattern of [Section 2.6](class-1.md#sec-2-6), a non-deadlock bug. Which order happens is timing again. The exercise keeps the slow loop before the store, and with that loop the read came before the store in all 300 runs of `ordering_slow` ([Section 2.8](class-1.md#sec-2-8)). So here thread 2 would probably reach its wait first, and the simplified program would usually work. Without the slow loop, the store came first in all 1,000 runs of `ordering`, so the losing order would be the likely one. How likely the order is does not change the answer. The order is possible, so the simplified program has a bug, and a program that is right for one order only is the bug of [Section 2.8](class-1.md#sec-2-8) again.

**[Answer 12](#answers).** One possible answer. Nothing in `ordering.c` says that the store must happen before the read; the program just hopes it does. Which one comes first depends on timing: how quickly the new thread starts on another CPU against how quickly the creating thread reaches its next line. On that machine, as printed, the store always won, so 1,000 runs passed; adding one short loop before the store, with no change to the logic, made the read win and every run crash. So the passing runs only showed that the timing had been kind. `ordering_fixed.c` does not depend on timing: the reader checks a flag under a lock and sleeps until the writer has stored, set the flag and signaled. If the reader is early, it waits; if it is late, it finds the flag already set. Either way the read comes after the store, and 200 runs with the slow store had no crash.
