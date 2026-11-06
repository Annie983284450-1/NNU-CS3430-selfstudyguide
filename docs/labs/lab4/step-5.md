# Step 5. `rwshared`: the lock protecting a real record

## 5.1 Why this step

The question: what does a torn read look like, and what stops it?

A lock is only useful protecting something. `kernel/spinlock.c` ends with a
small shared record: a value `val` and a check field `chk` that is always
`val ^ RWSHARED_MAGIC`. A writer must change both together. A reader that
ever sees them disagree has read the record while a writer was halfway
through: a torn read. Two system calls, `rwset(v)` and `rwget()`, are already
plumbed through to user space (numbers 38 and 39, which you saw in [Step 3](step-3.md));
their kernel bodies are stubs. You put your [Step 4](step-4.md) lock around them.

The picture: a scoreboard with two numbers that must always agree (score, and
score written in words). If the operator changes one and someone reads the
board before the second is changed, the reader has seen nonsense.

## 5.2 The picture

```
   sys_rwset(v)                              sys_rwget()
     write_acquire(&rwshared.lock)             read_acquire(&rwshared.lock)
     rwshared.val = v                          v = rwshared.val
     rwshared.chk = v ^ MAGIC                  c = rwshared.chk
     write_release(&rwshared.lock)             read_release(&rwshared.lock)
                                               return c == (v ^ MAGIC) ? v : -1

   Without the lock: a reader can run between the two stores and see val new, chk old.
   With the lock:   the writer is alone for both stores; readers see before or after, never between.
```

## 5.3 Procedure

In `kernel/spinlock.c`, near the end (after [Step 4](step-4.md) the record is defined at
line 545 and the two functions start at lines 562 and 578; use
`grep -n "sys_rwset\|sys_rwget" kernel/spinlock.c` to find them). Each function has a `TODO (NNU)` comment that shows the
lines to write. Replace the body of each with those lines, and delete the
`TODO` comment and the stub `(void)v;` / `return -1;` lines. Fill the two
blanks.

```c
uint64
sys_rwset(void)
{
  int v;
  argint(0, &v);
  ________(&rwshared.lock);
  rwshared.val = v;
  rwshared.chk = v ^ RWSHARED_MAGIC;
  write_release(&rwshared.lock);
  return 0;
}
```

```c
uint64
sys_rwget(void)
{
  int v, c;
  ________(&rwshared.lock);
  v = rwshared.val;
  c = rwshared.chk;
  read_release(&rwshared.lock);
  if(c != (v ^ RWSHARED_MAGIC))
    return -1;
  return v;
}
```

Then rebuild and run.

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ rwsharedtest
```

## 5.4 You should see

```
$ rwsharedtest
rwshared: OK
```

(The same on every group.) `rwsharedtest` first sets five values and reads
each back, then forks three readers that call `rwget()` 20,000 times each
while the parent calls `rwset()` 20,000 times, and fails if any reader ever
gets -1. On the starter it printed `rwshared: FAIL set 5 but read back -1`
([Step 0](step-0.md)) because the stub `sys_rwget` always returned -1.

!!! theory "Connect to theory: a torn read is a race on two fields"

    **What the theory says.** A critical section is a piece of code that touches shared
    data and must run as if it were one step, with nobody else in the middle: that is
    atomicity, and a lock provides it ([Week 8, Section 2.6](../../w08/class-1.md#sec-2-6)).

    **What this run showed.** With `write_acquire` around `sys_rwset` and `read_acquire`
    around `sys_rwget`, three readers made 60,000 calls between them while the parent made
    20,000 writes, and no reader ever got -1: `rwshared: OK`.

    **Why the run confirms the theory.** A write changes `val` and `chk` with two stores.
    A reader that ran between them would see the two fields disagree and return -1. The
    write lock keeps every reader out while the two stores happen, so as far as any
    reader can tell the write is one step.

??? success "5.5a The answer: the two blanks"

    `write_acquire` in `sys_rwset` and `read_acquire` in `sys_rwget`.

??? success "5.5b The answer: `sys_rwset()` and `sys_rwget()`, complete (lines 555 to 582 of `kernel/spinlock.c`)"

    ```c linenums="555"
    // writer: publish a new value.  Both fields must change atomically w.r.t.
    // readers, so do it under the WRITE lock.
    uint64
    sys_rwset(void)
    {
      int v;
      argint(0, &v);
      write_acquire(&rwshared.lock);
      rwshared.val = v;
      rwshared.chk = v ^ RWSHARED_MAGIC;
      write_release(&rwshared.lock);
      return 0;
    }

    // reader: return a consistent snapshot of the value, taken under the READ
    // lock.  Returns -1 if the two fields disagree (which a correct lock prevents).
    uint64
    sys_rwget(void)
    {
      int v, c;
      read_acquire(&rwshared.lock);
      v = rwshared.val;
      c = rwshared.chk;
      read_release(&rwshared.lock);
      if(c != (v ^ RWSHARED_MAGIC))
        return -1;
      return v;
    }
    ```

??? success "5.5c Reading the answer"

    - `sys_rwset`, lines 557 to 567. `argint(0, &v)` fetches the value the
      program passed. `write_acquire` makes this CPU the only one inside the
      record; both stores happen; `write_release` lets readers back in. A reader
      can observe the record before the pair of stores or after it, never in
      the middle.
    - `sys_rwget`, lines 571 to 582. `read_acquire` admits this CPU together
      with any other readers, but keeps a writer out while it copies the two
      fields into locals. The check on line 579 compares the copies, not the
      live fields, so it is a test of what this reader actually saw. With the
      lock correct the check never fails; it is there so that a wrong lock shows
      up as a `-1` and a `FAIL` line instead of silently returning garbage.
    - Both functions return `uint64` because every xv6 system call does; the
      value is placed in the process's `a0` by `syscall()`, and `rwget()` in
      user space sees it as an `int`.

!!! question "Think"

    If `sys_rwset` and `sys_rwget` both used a plain spinlock (one `acquire` /
    `release` around each body) instead of your reader-writer lock,
    `rwsharedtest` would still print `rwshared: OK`. What would be lost, and
    which stage of `rwlktest` is the one that measures exactly that loss?

    Answer it in your own words before you read on. The answer is not printed here.
