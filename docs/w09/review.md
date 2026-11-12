# Exercises and answers

## The week in ten sentences {#the-week}

1. A shared data structure carries its own lock, a field next to the data, and every function that threads call takes it on entry and releases it before returning, readers included; built this way, the counter is thread safe and printed 4,000,000 every run.
2. One lock is exact and slow: with four CPUs doing four times the work, 4 threads took 22.5 times as long as 1 thread; taking turns at the one lock accounts for 4 of the 22.5, and the rest is read as the cost of sharing it.
3. The approximate counter gives each CPU (here each slot, picked by thread number) a count under its own lock and folds it into a global count every S adds, so the shared lock is taken once per S adds and `get()` can be behind by at most 4 × S.
4. The counts must also sit apart in memory: a CPU moves 64-byte cache lines, and four counts in 16 bytes, neighbors in the same lines, bounced those lines between the CPUs on every add (false sharing); one 128-byte block per slot made 4 threads run in about the time of 1.
5. A list with one lock holds it for a walk of up to 10,000 nodes, so 4 threads looked up slower than 1; 101 short lists with a lock each, picked by `key % 101`, made 4 threads about 2.2 times faster, and the rule behind both fixes is: one big lock first, measure, split only when the measurement says so, measure again.
6. A thread that waits for an event, not a lock, must not spin (0.99 s of CPU for 0.49 s of work); it sleeps on a condition variable, a queue that remembers nothing, so the event lives in a variable, the check is made with the lock held, and `wait()` releases the lock and sleeps in one step, while the other thread changes the variable and signals under the same lock.
7. Producers and consumers sharing a buffer need every wait to be a `while` (a signal is only a hint: Mesa semantics, and Tc2 took Tc1's item) on a queue of its own (one queue let a consumer wake a consumer, and all three slept); `MAX` slots then make the sleeps rare: 21.66 s to 2.99 s for 1,000,000 items, a total, not a count of sleeps.
8. xv6's pipe is that buffer in the kernel: 512 bytes, two counters, readers sleeping on `&nread` and writers on `&nwrite`, and a `wakeup()` that wakes every sleeper, so the `while` is mandatory.
9. A semaphore is a count with a queue inside: `wait()` subtracts one and sleeps below zero, `post()` adds one and wakes one; start it at the number of things you can give away right now, 1 for a lock, 0 for a wait for an event (an early `post()` is kept in the count), N for N free slots.
10. With semaphores the buffer needs `empty` at `MAX`, `full` at 0 and a binary `mutex` held only around `put()` and `get()`, inside the waits, or a sleeper holds it and both sides deadlock; and a reader-writer lock, two semaphores and a count, let 4 readers walk the list together, 3.2 times faster than one thread and 5.4 times faster than behind one mutex.

## Exercises {#exercises}
<!-- answers folded under their exercises -->

Try each one on paper before you look at the answers. The method each one needs is in the section named in brackets.

### Exercise 1 {#exercise-1}

A stack holds a small array and a `top` index; `push()` stores an item at `top` and adds 1 to `top`, and `pop()` subtracts 1 from `top` and returns the item there. Add one lock to it: say where the lock lives, which functions take it, and which lines it must cover. ([Section 1.3](class-1.md#sec-1-3) to [Section 1.7](class-1.md#sec-1-7))

<details class="success answer" id="answer-1" markdown="1">
<summary>Answer 1 <span class="hint">click to show</span></summary>

The lock lives inside the stack, as a field of the struct next to the array and `top`, set up once by `init()`. Both `push()` and `pop()` take it on entry and release it just before returning; `init()` does not, because it runs before any sharing. `push()` must hold the lock across both its lines (store at `top`, add 1 to `top`), and `pop()` across both of its (subtract 1, read the item), because each pair is one change that another thread must not see halfway; a `peek()` that only reads the top would take the lock too, for the reason of [Section 1.6](class-1.md#sec-1-6).

</details>

### Exercise 2 {#exercise-2}

Say what the threshold S of the approximate counter trades, in two sentences: one about the shared lock, one about `get()`. ([Section 2.5](class-1.md#sec-2-5))

<details class="success answer" id="answer-2" markdown="1">
<summary>Answer 2 <span class="hint">click to show</span></summary>

A larger S takes the shared lock less often, once per S adds instead of once per add, so adds wait less. A larger S also lets the global count fall further behind the true total, by up to 4 × S with four slots, so `get()` is less exact.

</details>

### Exercise 3 {#exercise-3}

Name the two of the three pieces of OSTEP Figure 30.3 that the shortcuts dropped, and say what happens without each one. ([Section 3.8](class-1.md#sec-3-8) and [Section 3.9](class-1.md#sec-3-9))

<details class="success answer" id="answer-3" markdown="1">
<summary>Answer 3 <span class="hint">click to show</span></summary>

The variable `done`, and the lock held around both the check and the change. Without `done` (shortcut 1), a signal sent before the parent sleeps leaves no trace, and the parent sleeps forever. Without the lock (shortcut 2), the child can set `done` and signal between the parent's check and its `wait()`, and the parent sleeps on news that already came. Either way the wake-up is lost.

</details>

### Exercise 4 {#exercise-4}

With two consumers and one producer, say what goes wrong with an `if` in place of the `while`, and what goes wrong with one condition variable in place of two. ([Section 4.4](class-2.md#sec-4-4) and [Section 4.5](class-2.md#sec-4-5))

<details class="success answer" id="answer-4" markdown="1">
<summary>Answer 4 <span class="hint">click to show</span></summary>

With an `if`: a consumer woken by the producer's signal is only ready, not running; the second consumer runs first, takes the item, and the first consumer, trusting the check it made before it slept, calls `get()` on an empty slot (the `assert` fires). With one condition variable: a consumer's signal can wake the other consumer instead of the producer; that consumer finds the slot empty and sleeps again, the producer stays asleep, and all three sleep forever.

</details>

### Exercise 5 {#exercise-5}

Give the starting value of a semaphore used as a lock and of one used for a join, and say what the value −2 means. ([Section 5.2](class-2.md#sec-5-2) to [Section 5.4](class-2.md#sec-5-4))

<details class="success answer" id="answer-5" markdown="1">
<summary>Answer 5 <span class="hint">click to show</span></summary>

A lock starts at 1 (one thread may pass). A join starts at 0 (nothing has happened yet). The value −2 means two threads are asleep on the semaphore, waiting for a `post()`.

</details>

### Exercise 6 {#exercise-6}

Give the starting values of `empty`, `full` and `mutex` for a 10-slot buffer built with semaphores, and say why `mutex` must sit inside the waits. ([Section 6.1](class-2.md#sec-6-1) to [Section 6.3](class-2.md#sec-6-3))

<details class="success answer" id="answer-6" markdown="1">
<summary>Answer 6 <span class="hint">click to show</span></summary>

`empty` starts at 10 (ten free slots), `full` at 0 (no items), `mutex` at 1 (a lock). If `mutex` is taken before the wait on `empty` or `full`, a thread that must sleep sleeps holding `mutex`; the thread that could wake it (a producer for a waiting consumer, or the reverse) then waits for `mutex`, and each waits for the other: deadlock. Inside the waits, a sleeper holds nothing.

</details>

### Exercise 7 {#exercise-7}

What problems do condition variables solve that locks cannot? ([Section 3.3](class-1.md#sec-3-3))

<details class="success answer" id="answer-7" markdown="1">
<summary>Answer 7 <span class="hint">click to show</span></summary>

Waiting for something to become true, efficiently. A lock only lets a thread wait until nobody else is inside. A thread that waits for an event, such as a child finishing, could only check a flag again and again, burning a CPU (the spinning join used 0.99 s of CPU in a run of 0.49 s). A condition variable lets it sleep until another thread says the condition may have changed.

</details>

### Exercise 8 {#exercise-8}

Why must a thread be holding a lock to wait on a condition variable? ([Section 3.4](class-1.md#sec-3-4) and [Section 3.9](class-1.md#sec-3-9))

<details class="success answer" id="answer-8" markdown="1">
<summary>Answer 8 <span class="hint">click to show</span></summary>

Because it is waiting for a variable to change, and it must be sure of the variable's value at the moment it goes to sleep. Without the lock, the other thread could change the variable and signal right between the check and the sleep; the signal would find nobody asleep and the waiter would sleep forever. Holding the lock, and letting `wait()` release it and sleep in one step, closes that gap.

</details>

### Exercise 9 {#exercise-9}

Why must there be a separate condition variable per desired condition? Illustrate with the producer/consumer problem. ([Section 4.5](class-2.md#sec-4-5) and [Section 4.6](class-2.md#sec-4-6))

<details class="success answer" id="answer-9" markdown="1">
<summary>Answer 9 <span class="hint">click to show</span></summary>

Because a signal wakes one sleeper from one queue, and the signaler cannot choose which. With one queue, a consumer that empties the slot can wake the other consumer instead of the producer; it finds the slot empty and sleeps again, and all three end up asleep. With `empty` and `fill`, a consumer's signal can only reach a producer, and a producer's only a consumer.

</details>

### Exercise 10 {#exercise-10}

Why should a wait always occur in a loop? What does Mesa semantics mean, and what is a spurious wake-up? ([Section 3.5](class-1.md#sec-3-5) and [Section 4.4](class-2.md#sec-4-4))

<details class="success answer" id="answer-10" markdown="1">
<summary>Answer 10 <span class="hint">click to show</span></summary>

Mesa semantics: a signal is a hint that the state changed, not a promise that it is still changed when the woken thread runs; Tc2 took the item between Tp's signal and Tc1's run. A spurious wake-up is a return from `wait()` with no signal meant for the waiter (POSIX allows it; the book's example is two threads woken by one signal). A `while` loop re-checks the condition in both cases, so the thread acts only on what it sees now.

</details>

### Exercise 11 {#exercise-11}

An approximate counter has 4 slots and S = 8. Four threads each add 1 twenty times, so 80 adds in all. What is the largest number of adds that can be missing from the global count at any moment, and what does `get()` return at the end if every slot has made exactly 20 adds? ([Section 2.3](class-1.md#sec-2-3) to [Section 2.5](class-1.md#sec-2-5))

<details class="success answer" id="answer-11" markdown="1">
<summary>Answer 11 <span class="hint">click to show</span></summary>

A slot is emptied in the same `update()` call that brings it to 8, but it holds 8 while that thread waits for the global lock, so each slot can hide up to 8 unreported adds, and four slots at most 4 × 8 = 32. At the end, each slot has made 20 adds: 20 = 2 × 8 + 4, so each slot reported 16 (twice 8) and keeps 4. `get()` returns 4 × 16 = 64, and 4 × 4 = 16 adds are still in the slots; 64 + 16 = 80, the true total.

</details>

### Exercise 12 {#exercise-12}

The second run in `W09_demos/counter_lock.out` is:

```text
$ ./counter_lock 1
1 threads  total 1000000  time 0.0041 s
$ ./counter_lock 2
2 threads  total 2000000  time 0.0282 s
$ ./counter_lock 3
3 threads  total 3000000  time 0.0681 s
$ ./counter_lock 4
4 threads  total 4000000  time 0.0957 s
```

For this run, how many times as long as the 1-thread run did the 2-, 3- and 4-thread runs take, and what would perfect scaling have given at each thread count? ([Section 2.1](class-1.md#sec-2-1))

<details class="success answer" id="answer-12" markdown="1">
<summary>Answer 12 <span class="hint">click to show</span></summary>

2 threads: 0.0282 / 0.0041 = 6.9 times as long. 3 threads: 0.0681 / 0.0041 = 16.6 times. 4 threads: 0.0957 / 0.0041 = 23.3 times. Perfect scaling would have given 0.0041 s at every thread count, because each thread's 1,000,000 adds would run on its own CPU in the time one thread takes. (Check the 4-thread figure the other way: 23 × 0.0041 = 0.0943, close to 0.0957.)

</details>

### Exercise 13 {#exercise-13}

Three threads, A, B and C, use one semaphore started at 1 as a lock. A calls `wait()` and enters; then B calls `wait()`; then C calls `wait()`; then A calls `post()`; then whoever is now inside calls `post()`; then the last one calls `post()`. Write the value of the semaphore after each of the six calls, and say who is asleep after the third. ([Section 5.3](class-2.md#sec-5-3))

<details class="success answer" id="answer-13" markdown="1">
<summary>Answer 13 <span class="hint">click to show</span></summary>

Start at 1. A waits: 0, A inside. B waits: −1, B asleep. C waits: −2, B and C asleep (the value −2 is the number asleep). A posts: −1, one sleeper wakes and goes in (say B). B posts: 0, C wakes and goes in. C posts: 1, nobody inside, nobody asleep.

</details>

### Exercise 14 {#exercise-14}

In the hash table of [Section 2.11](class-1.md#sec-2-11), which bucket does key 1234 go to? If 10,000 keys 0 to 9,999 are inserted, about how many keys does each bucket hold, and why does the number of buckets matter for the lookup time? ([Section 2.11](class-1.md#sec-2-11))

<details class="success answer" id="answer-14" markdown="1">
<summary>Answer 14 <span class="hint">click to show</span></summary>

1234 = 12 × 101 + 22, so `1234 % 101` is 22, and key 1234 goes to bucket 22. With 10,000 keys over 101 buckets, each bucket holds about 10,000 / 101 = 99 keys (the keys 0 to 9,999 spread almost evenly, 99 or 100 each). A lookup walks only its bucket, so the walk is about 99 nodes instead of up to 10,000; more buckets mean shorter walks and, with several threads, fewer threads wanting the same lock.

</details>

### Exercise 15 {#exercise-15}

[Section 4.8](class-2.md#sec-4-8) measured 21.66 s with `MAX = 1` and 2.99 s with `MAX = 10`. Would `MAX = 100` take about 0.3 s? Say why or why not, using what the slots do and do not change. ([Section 4.7](class-2.md#sec-4-7) and [Section 4.8](class-2.md#sec-4-8))

<details class="success answer" id="answer-15" markdown="1">
<summary>Answer 15 <span class="hint">click to show</span></summary>

Probably not. Going from 1 slot to 10 made the sleeps and wake-ups, which each go through the kernel, rare instead of one per item; the 19 seconds saved is the price of that, measured as a total ([Section 4.8](class-2.md#sec-4-8) does not count the sleeps). Once the sleeps are rare, what is left is the work itself (two producers putting and two consumers getting 1,000,000 items under one mutex), which more slots do not shrink. So 100 slots should take about the same as 10, a little less at most. The only way to know is to run it: `./pc 100`.

</details>

### Exercise 16 {#exercise-16}

In your own words, explain to a friend why a signal sent when nobody is waiting is harmless for the join with a condition variable ([Section 3.7](class-1.md#sec-3-7)) but fatal for the join without `done` ([Section 3.8](class-1.md#sec-3-8)), and how a semaphore removes the need for `done` ([Section 5.4](class-2.md#sec-5-4)).

<details class="success answer" id="answer-16" markdown="1">
<summary>Answer 16 <span class="hint">click to show</span></summary>

One possible answer. With the condition variable, the child writes `done = 1` before it signals, and it does both while holding the lock. If the parent has not arrived yet, the signal wakes nobody, but `done` stays 1, so when the parent arrives it reads the 1 and never sleeps; nothing is lost because the event is written down. Without `done`, the signal is the only record, and a signal wakes whoever is asleep right now and then is gone; a parent that arrives later finds nothing and sleeps forever. A semaphore writes the event down by itself: a `post()` with nobody asleep adds 1 to the count, and the parent's later `wait()` subtracts it and goes on. The count is `done` and the signal in one, so the program needs neither a variable nor a lock of its own.

</details>
