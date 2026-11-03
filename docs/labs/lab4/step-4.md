# Step 4. A reader-writer lock

## 4.1 Why this step

The question: how can many readers share a lock, and still keep writers safe?

A spinlock lets one CPU in at a time, whether it wants to read or to write.
Some kernel data is read constantly and changed rarely (a routing table, a
mount table, a block of statistics). Readers do not change anything, so any
number of them can be inside at once without harm; only a writer needs to be
alone. A reader-writer lock allows exactly that: many readers, or one writer,
never both.

The picture: a museum room. Any number of visitors may be inside looking. When
the restorer needs to work, the room is closed: visitors already inside finish
and leave, no new visitor enters, and the restorer goes in alone. Once the
restorer leaves, visitors may enter again.

## 4.2 The picture

```
   struct rwspinlock
   +------------------+
   | lk   (spinlock)  |   guards the three counters; held only for a few instructions
   | readers          |   how many readers are inside now
   | writer           |   1 while a writer is inside
   | wwaiters         |   how many writers are waiting (or inside)
   +------------------+

   read_acquire:   wait while (writer || wwaiters > 0);  readers++
   read_release:   readers--
   write_acquire:  wwaiters++;  wait while (writer || readers > 0);  writer = 1
   write_release:  writer = 0;  wwaiters--

   Writer priority on a timeline:

   R1  [=== reading ===]
   R2        [=== reading ===]
   W                W arrives, wwaiters=1, waits for readers to reach 0 ... [= writing =]
   R3                   R3 arrives, sees wwaiters>0, waits ..................... [= reading =]
```

Without the `wwaiters` rule, a steady stream of readers keeps `readers > 0`
forever and the writer never gets in. The rule is: a waiting writer blocks
new readers. Readers therefore wait while `writer || wwaiters > 0`, and the
writer is counted in `wwaiters` from the moment it starts waiting until
`write_release`, so that at no moment is a writer present without one of the
two counters saying so. Every change to the three counters happens with `lk`
held, which is what makes the check and the change one step.

"Wait while" is a loop that drops `lk`, takes it again, and re-checks. It
must drop the inner lock each time round: the CPU that will change the
counters (a reader leaving, a writer finishing) needs `lk` to do it.

## 4.3a Procedure, part A: the fields in `kernel/spinlock.h`

Lines 15 to 19 hold the placeholder structure (one spinlock named `l`).
Replace them so the file reads, from line 14:

```c
#ifdef LAB_LOCK
// Reader-writer lock: many concurrent readers OR one writer, with writer
// priority (a waiting writer blocks new readers so writers cannot starve).
struct rwspinlock {
  struct spinlock lk;   // protects the counters below
  int readers;          // number of readers currently holding the lock
  int writer;           // 1 while a writer holds the lock
  int wwaiters;         // number of writers waiting to acquire
};
#endif
```

## 4.3b Procedure, part B: five functions in `kernel/spinlock.c`

Each has a stub marked `// Replace this with your implementation.`:
`read_acquire_inner` (line 125), `read_release_inner` (132),
`write_acquire_inner` (139), `write_release_inner` (146) and `initrwlock`
(181). The public `read_acquire`, `read_release`, `write_acquire`,
`write_release` between them are already written: they do `push_off` /
`pop_off` and call your `_inner` functions. Leave them alone. Fill the three
blanks.

```c
static void
read_acquire_inner(struct rwspinlock *rwlk)
{
  acquire(&rwlk->lk);
  // Writer priority: wait while a writer holds the lock OR one is waiting.
  while(rwlk->writer || rwlk->________ > 0){
    release(&rwlk->lk);
    acquire(&rwlk->lk);
  }
  rwlk->readers++;
  release(&rwlk->lk);
}

static void
read_release_inner(struct rwspinlock *rwlk)
{
  acquire(&rwlk->lk);
  rwlk->readers--;
  release(&rwlk->lk);
}

static void
write_acquire_inner(struct rwspinlock *rwlk)
{
  acquire(&rwlk->lk);
  rwlk->wwaiters++;                 // count as "present" until we release
  while(rwlk->writer || rwlk->________ > 0){
    release(&rwlk->lk);
    acquire(&rwlk->lk);
  }
  rwlk->writer = 1;
  release(&rwlk->lk);
}

static void
write_release_inner(struct rwspinlock *rwlk)
{
  acquire(&rwlk->lk);
  rwlk->writer = 0;
  rwlk->________--;                 // no longer present; readers may proceed if none left
  release(&rwlk->lk);
}
```

and, further down, `initrwlock`:

```c
void
initrwlock(struct rwspinlock *rwlk)
{
  initlock(&rwlk->lk, "rwlk");
  rwlk->readers = 0;
  rwlk->writer = 0;
  rwlk->wwaiters = 0;
}
```

Then rebuild and run.

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ rwlktest
```

## 4.4 You should see

Group A (8-core desktop):

```
$ rwlktest
rwspinlock_test: step 1: initrwlock
rwspinlock_test: step 2: concurrent read_acquire
rwspinlock_test: step 3: concurrent read_release
rwspinlock_test: step 4: prepare read_acquire for writer priority test
rwspinlock_test: step 5: writer priority test
rwspinlock_test: step 6: checking for concurrent readers/writers
rwspinlock_test: step 7: checking for concurrent writers
rwspinlock_test: step 8: acquiring multiple locks
rwspinlock_test: step 9: releasing multiple locks
rwspinlock_test: step 10: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 11: multiple writer priority test
rwspinlock_test: step 12: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 13: multiple writer priority test
rwspinlock_test: step 14: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 15: multiple writer priority test
rwspinlock_test: step 16: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 17: multiple writer priority test
rwspinlock_test: step 18: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 19: multiple writer priority test
rwspinlock_test: step 20: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 21: multiple writer priority test
rwspinlock_test: step 22: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 23: multiple writer priority test
rwspinlock_test: step 24: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 25: multiple writer priority test
rwspinlock_test: step 26: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 27: multiple writer priority test
rwspinlock_test: step 28: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 29: multiple writer priority test
rwspinlock_test: step 30: done
rwspinlock_test(0): 0
rwspinlock_test(3): 0
rwspinlock_test(1): 0
rwspinlock_test(2): 0
rwlktest: 4/4 CPUs succeeded
```

Groups B and C (this capture is from a 2-core cloud machine):

```
$ rwlktest
rwspinlock_test: step 1: initrwlock
rwspinlock_test: step 2: concurrent read_acquire
rwspinlock_test: step 3: concurrent read_release
rwspinlock_test: step 4: prepare read_acquire for writer priority test
rwspinlock_test: step 5: writer priority test
rwspinlock_test: reader sneaked ahead of waiting writer
rwspinlock_test: step 6: checking for concurrent readers/writers
rwspinlock_test: step 7: checking for concurrent writers
rwspinlock_test: step 8: acquiring multiple locks
rwspinlock_test: step 9: releasing multiple locks
rwspinlock_test: step 10: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 11: multiple writer priority test
rwspinlock_test: step 12: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 13: multiple writer priority test
rwspinlock_test: step 14: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 15: multiple writer priority test
rwspinlock_test: step 16: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 17: multiple writer priority test
rwspinlock_test: step 18: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 19: multiple writer priority test
rwspinlock_test: step 20: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 21: multiple writer priority test
rwspinlock_test: step 22: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 23: multiple writer priority test
rwspinlock_test: step 24: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 25: multiple writer priority test
rwspinlock_test: step 26: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 27: multiple writer priority test
rwspinlock_test: reader sneaked ahead of second waiting writer
rwspinlock_test: step 28: prepare read_acquire for multiple writer priority test
rwspinlock_test: step 29: multiple writer priority test
rwspinlock_test: step 30: done
rwspinlock_test(3): -1
rwspinlock_test(0): 0
rwspinlock_test(2): -1
rwspinlock_test(1): 0
rwlktest: 2/4 CPUs succeeded
```

`rwlktest` forks four processes, pins one to each CPU, and each one calls the
`rwlktest` system call, which runs a 30-stage test inside the kernel
(`sys_rwlktest` in `kernel/spinlock.c`, if you want to read it). The four
kernel threads meet at a barrier before every stage, which is why it needs
four CPUs that are all really running. Stages 2 and 3 are a million
concurrent `read_acquire` and `read_release`; stage 5 is the writer-priority
check (one CPU holds 30 read locks, a writer arrives and waits, a reader
arrives after a short delay and must be held out); stages 6 and 7 check that
readers never overlap a writer and that writers never overlap each other;
stages 8 and 9 hold two different rwlocks at once; stages 10 to 29 repeat a
two-writer priority check ten times. Each thread prints its own verdict
(`rwspinlock_test(id): 0` is a pass, `-1` a fail), and the last line counts
the passes.

Group A sees `4/4` and no message between the `step` lines. Groups B and C
see `2/4` or `3/4`, and the failing threads print a line such as
`reader sneaked ahead of waiting writer`,
`reader sneaked ahead of second waiting writer` or
`never saw concurrent reads`. All of those are timing checks: the priority
stages rely on a short delay loop giving the writer time to register before
the reader arrives, and the concurrency stage needs two readers to be inside
at the same instant. With four virtual CPUs sharing two real cores, the host
runs them in turns, and the checks can miss. The code is the same; the
machine is not. Group B and C: the line that failed is a timing effect of the
hardware, not a bug in your lock.

!!! theory "Connect to theory: the reader-writer lock, and a writer that cannot be starved"

    **What the theory says.** Reading does not change the data, so readers need not wait
    for each other. A reader-writer lock has two modes: any number of readers together, or
    one writer alone ([Week 9, Sections 6.4](../../w09/class-2.md#sec-6-4) and
    [6.5](../../w09/class-2.md#sec-6-5)). The simple version has a catch: a stream of readers can
    keep the reader count above zero forever, and the writer starves. A fair version counts
    waiting writers and holds new readers back for them
    ([Week 9, Section 6.6](../../w09/class-2.md#sec-6-6)).

    **What this run showed.** On four real cores `rwlktest` printed `4/4`: stages 2 and 3
    took a million read locks concurrently; stage 5 checked that a reader arriving after a
    waiting writer was held out, and stages 10 to 29 repeated that check with two writers;
    stages 6 and 7 found no reader inside with a writer and no two writers together.

    **Why the run confirms the theory.** The stages test the two modes one by one: readers
    inside together, a writer alone. The `wwaiters` count in your lock is the fair
    version's bookkeeping, and the priority stages pass because a waiting writer makes
    new readers wait. Without it, stage 5 would report `reader sneaked ahead of waiting
    writer`: the first step of the starvation the theory warns about, caught in the act.

`usertests -q` still passes after this step; [Step 6](step-6.md)'s `make grade` runs it.

??? success "4.5a The answer: the three blanks"

    `wwaiters` in `read_acquire_inner`, `readers` in `write_acquire_inner`, and
    `wwaiters` in `write_release_inner`.

??? success "4.5b The answer: `kernel/spinlock.h`, the structure (lines 14 to 23)"

    ```c linenums="14"
    #ifdef LAB_LOCK
    // Reader-writer lock: many concurrent readers OR one writer, with writer
    // priority (a waiting writer blocks new readers so writers cannot starve).
    struct rwspinlock {
      struct spinlock lk;   // protects the counters below
      int readers;          // number of readers currently holding the lock
      int writer;           // 1 while a writer holds the lock
      int wwaiters;         // number of writers waiting to acquire
    };
    #endif
    ```

??? success "4.5c The answer: the reader-writer lock, complete (lines 123 to 202 of `kernel/spinlock.c`; the public four functions in the middle were already there)"

    ```c linenums="123"
    #ifdef LAB_LOCK
    static void
    read_acquire_inner(struct rwspinlock *rwlk)
    {
      acquire(&rwlk->lk);
      // Writer priority: wait while a writer holds the lock OR one is waiting.
      while(rwlk->writer || rwlk->wwaiters > 0){
        release(&rwlk->lk);
        acquire(&rwlk->lk);
      }
      rwlk->readers++;
      release(&rwlk->lk);
    }

    static void
    read_release_inner(struct rwspinlock *rwlk)
    {
      acquire(&rwlk->lk);
      rwlk->readers--;
      release(&rwlk->lk);
    }

    static void
    write_acquire_inner(struct rwspinlock *rwlk)
    {
      acquire(&rwlk->lk);
      rwlk->wwaiters++;                 // count as "present" until we release
      while(rwlk->writer || rwlk->readers > 0){
        release(&rwlk->lk);
        acquire(&rwlk->lk);
      }
      rwlk->writer = 1;
      release(&rwlk->lk);
    }

    static void
    write_release_inner(struct rwspinlock *rwlk)
    {
      acquire(&rwlk->lk);
      rwlk->writer = 0;
      rwlk->wwaiters--;                 // no longer present; readers may proceed if none left
      release(&rwlk->lk);
    }

    void
    read_acquire(struct rwspinlock *rwlk)
    {
      push_off(); // disable interrupts to avoid deadlock.
      read_acquire_inner(rwlk);
    }

    void
    read_release(struct rwspinlock *rwlk)
    {
      read_release_inner(rwlk);
      pop_off();
    }

    void
    write_acquire(struct rwspinlock *rwlk)
    {
      push_off(); // disable interrupts to avoid deadlock.
      write_acquire_inner(rwlk);
    }

    void
    write_release(struct rwspinlock *rwlk)
    {
      write_release_inner(rwlk);
      pop_off();
    }

    void
    initrwlock(struct rwspinlock *rwlk)
    {
      initlock(&rwlk->lk, "rwlk");
      rwlk->readers = 0;
      rwlk->writer = 0;
      rwlk->wwaiters = 0;
    }
    ```

??? success "4.5d Reading the answer"

    - Every one of the four `_inner` functions begins with `acquire(&rwlk->lk)`
      and ends with `release(&rwlk->lk)`. The three counters are only ever read
      or changed in between. `lk` is held for a handful of instructions each
      time, which is what keeps a reader-writer lock cheap.
    - `read_acquire_inner`, lines 127 to 134. A reader may enter only when no
      writer is inside and none is waiting. While that is not so, the loop gives
      `lk` back and takes it again. Giving it back is what lets the writer that
      is finishing run its own `release` path. When the condition is false the
      reader counts itself in and leaves with `lk` released; it now holds the
      rwlock as one of possibly many readers, and `readers` is the only record
      of that.
    - `read_release_inner`, lines 140 to 142. Count out. The last reader to leave
      is what a waiting writer is spinning for.
    - `write_acquire_inner`, lines 148 to 155. `wwaiters++` comes first, before
      the wait. From this instant new readers are turned away, so the writer
      cannot be starved by a stream of readers; the readers already inside drain
      out. Then wait for both `writer == 0` (no other writer) and `readers == 0`,
      and claim the lock with `writer = 1`.
    - `write_release_inner`, lines 161 to 164. Clear the writer flag and leave
      the waiting count. After this a waiting reader's next look at the
      counters finds nothing in its way.
    - The four public functions, lines 167 to 193, add `push_off` before
      acquiring and `pop_off` after releasing. Interrupts stay off for as long
      as the rwlock is held, for the same reason xv6's `acquire` turns them off:
      if an interrupt handler on this CPU tried to take the same lock while this
      CPU already holds it, the CPU would wait for itself forever.
    - `initrwlock`, lines 195 to 202. The inner spinlock gets a name (`"rwlk"`)
      and the three counters start at zero, which is the "nobody inside, nobody
      waiting" state.

!!! question "Think"

    The wait loop in `read_acquire_inner` is `release(&rwlk->lk); acquire(&rwlk->lk);`
    inside the `while`. Suppose a student writes the loop without those two
    lines, so the reader keeps `lk` while it spins waiting for `writer` to become
    0. Describe, step by step, what happens with one reader on CPU 2 waiting and
    one writer on CPU 0 inside the lock, and say what `rwlktest` would show.

    Answer it in your own words before you read on. The answer is not printed here.
