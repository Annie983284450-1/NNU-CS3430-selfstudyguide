# Q&A: lock ordering, select() and event-based servers

*COMP3430 Operating Systems · questions on OSTEP chapters 32 and 33*

These are the questions you sent after reading OSTEP chapters 32 and 33, quoted exactly as you wrote them, with everything you wrote around each question. The chapters are [Common Concurrency Problems](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf) (chapter 32) and [Event-based Concurrency](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-events.pdf) (chapter 33). Each question is answered inside the book's own argument, in the same three steps every time.

1. **Recap.** What we were studying when the question came up, in case you have forgotten it.
2. **The passage in OSTEP.** The paragraph your question came from, word for word, with the key phrase in bold, and then what that paragraph is arguing, step by step. `[…]` marks words left out.
3. **The answer.** It starts from that argument: which step of it answers you, and then the details.

The questions are Q1 to Q3, in the order of the chapters. F1 is a sentence from one of your summaries that is close but not quite right; it sits in the topic it belongs to.

Two answers, Q1 and Q2, show a program running. Those runs were made for this page on a Linux machine (Ubuntu 24.04, x86-64, gcc 13.3, C library glibc 2.39), not on the course VM. The programs and their saved output are in `W10_demos/`, with names that start with `qa_`.

## 1. Lock ordering by address {#t1}

!!! abstract "Recap"

    A deadlock needs four conditions at once, and the last one is circular wait: a ring of threads in which each one holds a lock the next one asks for. The most practical fix is to break that ring with one order: every thread takes its locks in the same order. A function that gets its two locks from its caller cannot trust the caller's order, so it makes its own, by comparing the two addresses. (W10 [Section 4.2](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-2/#sec-4-2) and [Section 5.2](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-2/#sec-5-2).)

Q1 comes from the tip in the middle of section 32.3, and from a question the chapter itself asks at its end.

**The passage in OSTEP** (§32.3, the tip "Enforce Lock Ordering By Lock Address", and code question 4 at the end of the chapter):

> To avoid this particular issue, the clever programmer can use the address of each lock as a way of ordering lock acquisition. By acquiring locks in either high-to-low or low-to-high address order, do_something() can guarantee that it always acquires locks in the same order, regardless of which order they are passed in. The code would look something like this:
>
> […] // Code assumes that **m1 != m2 (not the same lock)**
>
> By using this simple technique, a programmer can ensure a simple and efficient deadlock-free implementation of multi-lock acquisition.
>
> […] Now examine the code in vector-global-order.c. First, make sure you understand what the code is trying to do; do you understand why the code avoids deadlock? Also, **why is there a special case in this vector_add() routine when the source and destination vectors are the same?**

The code between the first two paragraphs is this. The book prints it without line numbers; the numbers are added here so that the answer can point at lines.

```c linenums="1"
if (m1 > m2) { // grab in high-to-low address order
  pthread_mutex_lock(m1);
  pthread_mutex_lock(m2);
} else {
  pthread_mutex_lock(m2);
  pthread_mutex_lock(m1);
}
// Code assumes that m1 != m2 (not the same lock)
```

**What the passage argues.**

1. The function gets two locks from its caller, in whatever order the caller chose.
2. So it compares the two addresses, and always takes the lock with the higher address first.
3. Two callers with swapped arguments then take the same lock first, so no ring can form.
4. The code has only two branches: one for a higher `m1`, and one for every other case.
5. The comment on line 8 says what the code leaves out: it assumes the two locks are different.
6. The chapter's own program for this technique, `vector-global-order.c`, has a third branch for that case, and the chapter asks you why.

### Q1. "What happens if both arguments are the same lock, so the two addresses are equal? Does the function lock it twice and deadlock with itself, or does the code need a special check for that case?" {#q1 data-toc-label="Q1. The same lock passed twice"}

> **Location:** OSTEP Section 32.3, “Deadlock Bugs,”
>
> **Quote:** “the code to acquire locks in a fixed order, based on the address of each lock”
>
> **What I think this passage is saying:** When a function takes two locks and the caller chooses the order, the function can compare the two lock addresses and always acquire the lower one first. That way, two threads calling the function with the arguments swapped still reach for the same lock first, so no circular wait can form.
>
> **My question:** What happens if both arguments are the same lock, so the two addresses are equal? Does the function lock it twice and deadlock with itself, or does the code need a special check for that case?
>
> **What I already tried:** I traced two threads calling the function with the locks swapped and saw that the address rule prevents a cycle. I have not worked out the same-lock case on paper.

Where to reread: OSTEP 32.3, the tip box, down to its last comment line; code question 4 at the end of chapter 32; W10 [Section 5.2](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-2/#sec-5-2).

**In the passage.** The words in your Quote field describe the tip box of section 32.3, so that is the passage quoted above. Both halves of your question are right. With the code as the book prints it, the function locks the same lock twice, and the thread deadlocks with itself. And the code does need a special check. Step 5 is the book saying so: line 8 states that the code assumes `m1 != m2`. Step 6 is the book's own program adding the check.

Your reading in "What I think" is right too. You wrote "the lower one first", and the book's code takes the higher one first. The book allows both ("either high-to-low or low-to-high address order"). What matters is that every caller uses the same one.

**The same lock, step by step.** Call the one lock `L`, and suppose a thread calls `do_something(&L, &L)`.

1. `m1` and `m2` now hold the same address.
2. Line 1 tests `m1 > m2`. Two equal addresses are not "greater", so the test is false, and the code goes to the `else` branch.
3. Line 5 locks `m2`. `L` is free, so the thread takes it.
4. Line 6 locks `m1`. That is `L` again, and `L` is held. The thread goes to sleep until `L` is unlocked.
5. The only thread that would unlock `L` is the one that is asleep. It never reaches its unlock, so it sleeps forever.

The four conditions of section 32.3 all hold, with a ring of one thread: the thread holds `L` and asks for `L`. Writing the test the other way round (`m1 < m2`, low-to-high) changes nothing, because equal addresses fail that test too.

**On a real machine.** `qa_samelock.c` holds the book's eight lines inside `do_something()`, with a `printf` after the first lock and another after the second, which prints what the second lock call returned. Its `main` calls `do_something(&L, &L)`. The word after the program's name picks one of three runs. `timeout 3` ends a program that is still running after 3 seconds and leaves exit status 124, as in W10 [Section 3.3](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-1/#sec-3-3).

*`W10_demos/qa_samelock.out`, without the compile line.*

```text
$ timeout 3 ./qa_samelock plain; echo "exit status $?"
first lock taken
exit status 124
$ timeout 3 ./qa_samelock check; echo "exit status $?"
first lock taken
second lock returned 35 (Resource deadlock avoided)
done
exit status 0
$ timeout 3 ./qa_samelock fixed; echo "exit status $?"
same lock: taken once
done
exit status 0
```

- `plain` is the book's code with an ordinary mutex. On this machine it prints after the first lock and then nothing more. Exit status 124 means `timeout` had to stop it: the hang of step 5.
- `check` is the same code with a different kind of mutex, one that checks who holds it (`PTHREAD_MUTEX_ERRORCHECK`). The second lock does not sleep. It returns error 35 (`EDEADLK` in C), and the machine's own name for that error is in the output: "Resource deadlock avoided". The mistake is still in the code; this mutex only reports it.
- `fixed` is the code with the special check, shown next.

**The special check.** This is `vector_add()` in the book's program [`vector-global-order.c`](https://github.com/remzi-arpacidusseau/ostep-homework/blob/master/threads-bugs/vector-global-order.c). The calls with a capital P are the book's wrappers around the lower-case calls.

*OSTEP's `vector-global-order.c`, lines 12 to 30.*

```c linenums="12"
void vector_add(vector_t *v_dst, vector_t *v_src) {
    if (v_dst < v_src) {
        Pthread_mutex_lock(&v_dst->lock);
        Pthread_mutex_lock(&v_src->lock);
    } else if (v_dst > v_src) {
        Pthread_mutex_lock(&v_src->lock);
        Pthread_mutex_lock(&v_dst->lock);
    } else {
        // special case: src and dst are the same
        Pthread_mutex_lock(&v_src->lock);
    }
    int i;
    for (i = 0; i < VECTOR_SIZE; i++) {
        v_dst->values[i] = v_dst->values[i] + v_src->values[i];
    }
    Pthread_mutex_unlock(&v_src->lock);
    if (v_dst != v_src)
        Pthread_mutex_unlock(&v_dst->lock);
}
```

- Lines 13 to 18 are the two branches you traced: lower address first, whichever argument it is. (This program goes low-to-high, the other order the book allows.)
- Lines 19 to 22 are the third branch. If neither address is lower, they are equal, and the lock is taken once.
- Lines 27 to 29 match it on the way out: the lock is released once, and the second unlock runs only when the two vectors are different.

That answers the chapter's question as well. Adding a vector to itself, `vector_add(&v, &v)`, is a reasonable call. Without the third branch it would lock `v`'s lock twice and hang, exactly as in the five steps above.

`qa_samelock.c` has a second function, `do_something_fixed()`, with the same three branches. The `fixed` run in the output above calls it: one lock, `done`, exit status 0.

*`W10_demos/qa_samelock.c`, lines 24 to 36.*

```c linenums="24"
void do_something_fixed(pthread_mutex_t *m1, pthread_mutex_t *m2) {
    if (m1 > m2) {
        pthread_mutex_lock(m1);
        pthread_mutex_lock(m2);
    } else if (m1 < m2) {
        pthread_mutex_lock(m2);
        pthread_mutex_lock(m1);
    } else {
        // special case: m1 and m2 are the same
        pthread_mutex_lock(m1);
        printf("same lock: taken once\n");
    }
}
```

**The animation.** The first tab is the five steps above, on the book's eight lines. The second tab is the same call with the third branch.

<!-- anim:samelock10:start -->
Step through both tabs yourself: the call with the same lock twice on the book's eight lines, and then on the version with the third branch.

<div class="anim" data-anim="samelock10" markdown="0"></div>
<!-- anim:samelock10:end -->


One note on our own program. `vector_order.c` in W10 [Section 5.2](class-2.md#sec-5-2) has two branches, like the book's tip, so it makes the same assumption. Its two threads always pass two different vectors, so it never meets the equal case.

## 2. select() and the cost of one pass {#t2}

!!! abstract "Recap"

    An event-based server is one thread in one loop: wait for events, handle each one to its end, go round again. `select()` is how the loop learns what has arrived. The program hands it a set of descriptors, and `select()` leaves only the ready ones in the set. (W10 [Section 7.2](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-2/#sec-7-2) and [Extra 1](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-2/#extra-1).)

Q2 comes from the manual page text that section 33.2 quotes, and from the loop of Figure 33.1 in section 33.3.

**The passage in OSTEP** (§33.2, An Important API: select() (or poll()), and §33.3, Using select()):

> The first nfds descriptors are checked in each set, i.e., the descriptors from 0 through nfds-1 in the descriptor sets are examined. **On return, select() replaces the given descriptor sets with subsets consisting of those descriptors that are ready for the requested operation.** select() returns the total number of ready descriptors in all the sets.
>
> […] Inside the loop, it uses the FD_ZERO() macro to first clear the set of file descriptors, and then uses FD_SET() to include **all of the file descriptors from minFD to maxFD** […] By then using FD_ISSET() in a loop, the event server can see which of the descriptors have data ready and process the incoming data.
>
> Of course, a real server would be more complicated than this

The loop the second paragraph describes is Figure 33.1. These are its lines 10 to 30, with the book's line numbers. The book declares `fd` twice, on lines 18 and 26; a compiler accepts only one of the two, and `qa_selcost.c` below has one.

```c linenums="10"
while (1) {
  // initialize the fd_set to all zero
  fd_set readFDs;
  FD_ZERO(&readFDs);

  // now set the bits for the descriptors
  // this server is interested in
  // (for simplicity, all of them from min to max)
  int fd;
  for (fd = minFD; fd < maxFD; fd++)
    FD_SET(fd, &readFDs);

  // do the select
  int rc = select(maxFD+1, &readFDs, NULL, NULL, NULL);

  // check which actually have data using FD_ISSET()
  int fd;
  for (fd = minFD; fd < maxFD; fd++)
    if (FD_ISSET(fd, &readFDs))
      processFD(fd);
}
```

**What the passage argues.**

1. `select()` is given a set, and it examines the descriptors from 0 up to nfds-1. `nfds` is its first argument; in Figure 33.1 that is `maxFD+1` (line 23).
2. It answers by overwriting that same set: only the ready descriptors stay in it.
3. So after one call, the set no longer says what the server wants to watch.
4. The loop therefore builds the set again at the top of every pass: `FD_ZERO()` once, then one `FD_SET()` for each descriptor (lines 13, 19 and 20).
5. After `select()` it goes through every descriptor once more, with `FD_ISSET()`, to find the ready ones (lines 27 to 29).
6. The book calls this simple code, says a real server would be more complicated, and does not measure what a pass costs.

### Q2. "Does rebuilding the whole set with FD_ZERO() and FDSET() on every pass of the loop slow a server down when it is watching thousands of connections?" {#q2 data-toc-label="Q2. Whether rebuilding the set slows a server"}

> **Location:** OSTEP Section 33.2 “An Important API: select() (or poll())”, in the select() main page description the book quotes
>
> **Quote:** “On return, select() replaces the given descriptor sets with subsets consisting of those descriptors that are ready for the requested operation.”
>
> **What I think this passage is saying:** When select() returns, the set I passed in gets overwritten so it only holds the file descriptors that are ready. That is why the loop in Section 33.3 has to clear the set with FD_ZERO() and add every descriptor back with FD_SET() on every pass.
>
> **My question:** Does rebuilding the whole set with FD_ZERO() and FDSET() on every pass of the loop slow a server down when it is watching thousands of connections?
>
> **What I already tried:** I asked AI to check my summary of 33.2. I had written that select() gives back one integer saying whether things are ready. AI corrected me: you pass in sets of file descriptors, select() marks which ones are ready, its return value is how many are ready. It also said the set has to be rebuilt each loop because select() overwrites it, which led to my question.

Where to reread: OSTEP 33.2, the manual page text in italics; 33.3 and Figure 33.1; W10 [Extra 1](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-2/#extra-1).

**In the passage.** Yes. The rebuild costs time on every pass, and the cost grows with the number of connections. But the rebuild is one of three trips over the descriptors that every pass makes, and it is a small one. The largest by far is inside `select()` itself, which is step 1. Your reading in "What I think" is right: it is steps 2 to 4. The book stops at step 6 and gives no numbers, so the numbers below are measured.

**One pass, counted.** Take a small example: a server that watches four descriptors, 3, 4, 5 and 6, so `minFD` is 3 and `maxFD` is 7 (the loops on lines 19 and 27 stop before `maxFD`). A message arrives on descriptor 4.

1. Line 13: `FD_ZERO()` empties the set.
2. Lines 19 and 20: four trips round the loop put 3, 4, 5 and 6 into the set.
3. Line 23: `select()` goes through the positions 0 to 7 (its first argument is `maxFD+1`, which is 8) and checks the four descriptors that are in the set. Only descriptor 4 has data. It overwrites the set, so that only 4 is left, and returns 1.
4. Lines 27 to 29: four trips round the loop test 3, 4, 5 and 6. Only 4 is still in the set, so only `processFD(4)` runs.
5. Back at line 10, the set holds descriptor 4 alone. Lines 13, 19 and 20 must run again, or the next `select()` would watch one connection.

For one message, the pass touched every descriptor three times: 4 times in the rebuild, 4 times inside `select()`, and 4 times in the scan. With n descriptors that is about n, n and n, however few of them are ready.

**The animation.** It steps through this pass, with the set drawn as one row of four cells and a count of the descriptors touched so far.

<!-- anim:selectpass10:start -->
Step through one pass yourself, and watch the count of descriptors touched.

<div class="anim" data-anim="selectpass10" markdown="0"></div>
<!-- anim:selectpass10:end -->


**Measured.** `qa_selcost.c` runs the three parts of Figure 33.1's loop on n descriptors, with data waiting on exactly one of them, and times each part. It makes 100,000 passes and prints the average time of each part in nanoseconds (ns; 1,000 ns is one millionth of a second). The descriptors are eventfd objects, small counters inside the kernel that a program can read like a connection. They stand in for connections here.

*`W10_demos/qa_selcost.c`, lines 39 to 47. Lines 42 and 44 read the clock between the three parts.*

```c linenums="39"
        FD_ZERO(&readFDs);
        for (fd = minFD; fd < maxFD; fd++)
            FD_SET(fd, &readFDs);
        t1 = now();
        select(maxFD + 1, &readFDs, NULL, NULL, NULL);
        t2 = now();
        for (fd = minFD; fd < maxFD; fd++)
            if (FD_ISSET(fd, &readFDs))
                ready++;
```

*`W10_demos/qa_selcost.out`, without the compile line.*

```text
$ ./qa_selcost 10
n =   10   rebuild     45 ns   select()    895 ns   FD_ISSET scan     41 ns   one pass    980 ns   | epoll_wait()   216 ns
$ ./qa_selcost 100
n =  100   rebuild    215 ns   select()   7420 ns   FD_ISSET scan    221 ns   one pass   7856 ns   | epoll_wait()   236 ns
$ ./qa_selcost 1000
n = 1000   rebuild   1895 ns   select()  79767 ns   FD_ISSET scan   2088 ns   one pass  83750 ns   | epoll_wait()   292 ns
```

| descriptors watched | rebuild (lines 39 to 41) | `select()` (line 43) | scan (lines 45 to 47) | one pass |
|---:|---:|---:|---:|---:|
| 10 | 45 ns | 895 ns | 41 ns | 980 ns |
| 100 | 215 ns | 7,420 ns | 221 ns | 7,856 ns |
| 1,000 | 1,895 ns | 79,767 ns | 2,088 ns | 83,750 ns |

Three things to read from the table.

1. **The rebuild does grow.** From 10 descriptors to 1,000 it goes from 45 ns to 1,895 ns, about 42 times longer (1,895 / 45 ≈ 42). It is not 100 times, because part of the rebuild does not depend on n: `FD_ZERO()` clears the whole set, which has a fixed size, and reading the clock takes a little time too.
2. **It is the small part.** With 1,000 descriptors the rebuild is 1,895 of the 83,750 ns, about 2% of the pass (1,895 / 83,750 ≈ 0.02). `select()` itself is 79,767 ns, about 95% (79,767 / 83,750 ≈ 0.95). That is step 1 of the passage: the kernel examines every descriptor in the set on every call.
3. **The whole pass grows with n, and the work done does not.** Every one of these passes found exactly one ready descriptor. With 1,000 descriptors the pass took about 85 times longer than with 10 (83,750 / 980 ≈ 85). At 83,750 ns per pass, the loop can go round about 11,900 times a second (1,000,000,000 / 83,750 ≈ 11,940).

So the answer has two parts. Rebuilding the set does slow the loop, a little. The design that forces the rebuild slows it much more, because the same design makes `select()` look at every descriptor on every call.

**Thousands of connections.** The measurement stops at 1,000 for a reason. On Linux with the standard C library, an `fd_set` has room for descriptors 0 to 1023 and no more. The header on the machine says so in one line: `#define __FD_SETSIZE 1024` (`/usr/include/x86_64-linux-gnu/bits/typesizes.h`, line 103). The Linux manual page for [select()](https://man7.org/linux/man-pages/man2/select.2.html) puts it as a warning: "select() can monitor only file descriptors numbers that are less than FD_SETSIZE (1024)". It adds: "All modern applications should instead use poll(2) or epoll(7), which do not suffer this limitation." So a server cannot use `select()` for thousands of connections: it stops at descriptor 1023. (The same page also confirms your reading: "if using select() within a loop, the sets must be reinitialized before each call.")

**What such a server uses instead.** The book names `poll()` as "quite similar" and sends you to its manual page. Linux also has epoll, and it removes the cause of your question. The server tells the kernel once which descriptors it cares about, with `epoll_ctl()`; the manual page for [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html) says this "adds items to the interest list". The kernel keeps that list between calls, so there is no set to rebuild. Each `epoll_wait()` then hands back only the ready descriptors, so there is no scan either. The last column of the output above is one `epoll_wait()` on the same descriptors: 216 ns with 10 descriptors and 292 ns with 1,000. The manual page says epoll "scales well to large numbers of watched file descriptors", and the measurement agrees.

## 3. No locks, and no blocking {#t3}

!!! abstract "Recap"

    Three things followed from the event loop. No locks are needed, because one thread runs one handler at a time. The program, not the OS, picks what runs next. And a handler must never block, because the one thread would stop and every client would wait with it. (W10 [Section 7.2](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-2/#sec-7-2), [Extra 2](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-2/#extra-2) and [Extra 4](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-2/#extra-4).)

F1 puts two of those three things into one sentence. The book gives each its own section, and a third section says what does bring locks back.

**The passage in OSTEP** (§33.4, Why Simpler? No Locks Needed; §33.5, A Problem: Blocking System Calls; §33.8, What Is Still Difficult With Events):

> With a single CPU and an event-based application, the problems found in concurrent programs are no longer present. Specifically, **because only one event is being handled at a time, there is no need to acquire or release locks**; the event-based server cannot be interrupted by another thread because it is decidedly single threaded.
>
> […] And this implies that if an event handler issues a call that blocks, **the entire server will do just that: block until the call completes**. When the event loop blocks, the system sits idle, and thus is a huge potential waste of resources.
>
> […] Specifically, in order to utilize more than one CPU, the event server has to run multiple event handlers in parallel; when doing so, **the usual synchronization problems (e.g., critical sections) arise**, and the usual solutions (e.g., locks) must be employed.

**What the passage argues.**

1. There is one thread, and it handles one event at a time. Nothing else can run in the middle of a handler. That alone is why no locks are needed.
2. If a handler blocks, that one thread stops. No other handler runs while it waits.
3. So blocking does not let two handlers overlap. Its cost is time: the server sits idle and every client waits.
4. Locks come back for a different reason: a second CPU, with handlers running in parallel on shared data.

### F1. "Now I see they skip locks only because no handler ever runs concurrently, which only works if no handler blocks." {#f1 data-toc-label="F1. Why an event server needs no locks"}

> **Part 1, 33.5, “A Problem: Blocking System Calls”:** An event-based server handles one event at a time, so one blocking call like a disk read stalls everything, and asynchronous I/O is the fix. Before, I thought event-based servers were just threads without locking problems. Now I see they skip locks only because no handler ever runs concurrently, which only works if no handler blocks.

Where to reread: OSTEP 33.4 and 33.5, then the first paragraph of 33.8; W10 [Section 7.2](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-2/#sec-7-2) and [Extra 2](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-2/#extra-2).

**In the passage.** Most of this is right. One event at a time is the reason for no locks (step 1). One blocking call does stall everything (step 2). Asynchronous I/O is the fix. The part that is off is the last clause, "which only works if no handler blocks". It ties the first rule to the second, and the passage keeps them apart (step 3).

**What blocking does, and does not do.** Suppose a handler blocks on a disk read. It is still the only handler. The loop is asleep inside it, so no second handler starts, and nothing is touched by two handlers at the same moment. The server is still correct without locks. What it has lost is time. W10 [Extra 2](class-2.md#extra-2) measured it: client A's handler slept 3 seconds. Client B sent its line 0.40 seconds after A, and waited the remaining 2.60 seconds for a reply that takes no time. B got the right answer, late.

Figure Q.1 shows the three cases side by side.

<figure markdown="1">
![Figure Q.1. Three event servers. Left: one thread, one handler at a time, so no locks are needed. Middle: handler A blocks; handler B waits, but the two still never overlap, so the cost is time and no lock is missing. Right: two CPUs run two handlers at once on shared data, and now locks are needed.](qa_figs/f1_three_cases.svg)
<figcaption markdown="1">Figure Q.1. Three event servers. Left: one thread, one handler at a time, so no locks are needed. Middle: handler A blocks; handler B waits, but the two still never overlap, so the cost is time and no lock is missing. Right: two CPUs run two handlers at once on shared data, and now locks are needed.</figcaption>
</figure>

**What does end "no locks".** Step 4: more than one CPU. To use a second CPU, the server has to run handlers in parallel, and then two handlers can touch the same data at the same moment. The book's words for it are "simple event handling without locks is no longer possible".

So there are two rules, each with its own reason and its own price when it is broken.

| rule | reason | if it is broken |
|---|---|---|
| no locks needed | one thread runs one handler at a time (33.4) | with handlers in parallel on several CPUs, data races return (33.8) |
| no blocking calls | the one thread is all there is (33.5) | every client waits; the answers are still right |

The corrected sentence: "They skip locks because one thread runs one handler at a time. Separately, no handler may block, because a blocked handler makes every client wait." The book line that settles it is the one in bold in 33.4: "because only one event is being handled at a time, there is no need to acquire or release locks". It gives one reason, and blocking is not part of it.

## 4. State that a handler must save {#t4}

!!! abstract "Recap"

    A handler must not block on a disk read, so it uses asynchronous I/O: `aio_read()` starts the read and returns at once, and `aio_error()` says later whether it has finished. That leaves a new problem: by the time the read is done, the handler that started it has returned. (W10 [Extra 3](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-2/#extra-3).)

Q3 comes from the example in section 33.7.

**The passage in OSTEP** (§33.7, Another Problem: State Management):

> when an event handler issues an asynchronous I/O, it must package up some program state for the next event handler to use when the I/O finally completes; this additional work is not needed in thread-based programs, as the state the program needs is on the stack of the thread.
>
> […] As you can see, in a multi-threaded program, doing this kind of work is trivial; when the read() finally returns, **the code immediately knows which socket to write to because that information is on the stack of the thread (in the variable sd)**.
>
> […] In this specific case, the solution would be to record the socket descriptor (sd) in some kind of data structure (e.g., a hash table), indexed by the file descriptor (fd). When the disk I/O completes, the event handler would use the file descriptor to look up the continuation, which will return the value of the socket descriptor to the caller.

The code the second paragraph talks about is two lines. The book prints them without numbers; the numbers are added here.

```c linenums="1"
int rc = read(fd, buffer, size);
rc = write(sd, buffer, size);
```

**What the passage argues.**

1. The job has two parts: read from the file `fd`, then write what was read to the socket `sd`.
2. In a thread, the two parts are two lines of one function. `fd` and `sd` are that function's own variables, and they live on the thread's stack.
3. `read()` may have to wait for the disk. The thread then sleeps inside line 1, and its stack stays exactly as it was.
4. When `read()` returns, the thread goes on to line 2, and `sd` is still there. That is all "the code knows" means.
5. An event handler must not sleep inside line 1. It starts the read and returns, and its own variables end when it returns.
6. So before it returns, it has to store `sd` somewhere that lasts, where it can be found again from `fd`. That stored note is a continuation.

### Q3. "What does it mean by the code knows?" {#q3 data-toc-label="Q3. What 'the code knows' means"}

> **Location:** 33.7 Another Problem: State Management
>
> **Quote:** As you can see, in a multi-threaded program, doing this kind of work is trivial; when the read() finally returns, the code immediately knows which socket to write to because that information is on the stack of the thread (in the variable sd). (code knows)
>
> **What I think this passage is saying:** I think the passage is saying that thread-based programs can easily read from a file and then write that data to a socket, because the socket number (sd) is already saved on the thread’s stack when read() returns. I don’t understand what it means that “the code knows” this.
>
> **My question:** What does it mean by the code knows?
>
> **What I already tried:** I re-read the section and the example code. Then I asked AI (Claude). It explained that “knows” means the value is still in a variable: sd is a local variable on the thread’s stack, and when read() blocks, the thread just sleeps with its stack intact, then continues on the next line where sd is still available. In an event-based server, the handler issues an asynchronous read and returns to the event loop right away, so its local variables, including sd, are gone. When the read completes, a new handler runs that has no record of the socket. That is why the program must save sd itself in a data structure such as a hash table indexed by fd (a continuation), which the book calls manual stack management. I also asked how scheduling is decided; it explained that with threads the OS scheduler decides what runs, while in an event-based server the event loop’s choice of which event to handle next is the scheduling, as the chapter says.

Where to reread: OSTEP 33.7, from its first paragraph to the end of the section; 33.6 for the two calls; W10 [Extra 3](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-2/#extra-3); W08 [Section 1.3](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w08/class-1/#sec-1-3) for a thread's own stack.

**In the passage.** "The code knows" means one plain thing: when line 2 runs, the value it needs is still in a variable it can read. That is step 4. Nobody saved the value on purpose, and nothing is looked up. The word is informal: the code still has the value, and that is all. Your reading in "What I think" already says where the value is, on the thread's stack. The explanation you wrote down under "What I already tried" is correct as well, and it follows steps 3 to 6.

**Why the value is still there, in a thread.** Use the numbers of W10 [Extra 3](class-2.md#extra-3): the file is descriptor 7 and the client's socket is descriptor 12. So `fd` is 7 and `sd` is 12.

1. The thread's function has `fd` and `sd` among its own variables. Each thread has its own stack, and these two values sit on it.
2. Line 1 calls `read(fd, ...)`. The data is not in memory yet, so the thread sleeps until the disk answers. A sleeping thread keeps its stack. Other threads run in the meantime, each on its own stack.
3. The disk finishes, and `read()` returns. The thread wakes up in the same function, right after line 1.
4. Line 2 calls `write(sd, ...)`. It reads `sd` from the same place on the stack as before, and finds 12.

Between line 1 and line 2 a long time may pass, and the thread did nothing to remember anything. The stack did it. That is why the book calls the thread version "trivial".

**Why an event handler has to do it by hand.** The same job, with the calls of section 33.6:

1. A handler runs for the client's request. Its own variables hold `fd` = 7 and `sd` = 12.
2. It starts the read with `aio_read()`, which returns at once.
3. Before it returns, it records `sd` in a table, indexed by `fd`: under 7 it stores 12. The book's words: "record the socket descriptor (sd) in some kind of data structure (e.g., a hash table), indexed by the file descriptor (fd)".
4. The handler returns to the loop. Its own variables are gone. The loop handles other events.
5. Later, `aio_error()` reports that the read on descriptor 7 is complete. A handler runs for that event. All it has is the number 7.
6. It looks 7 up in the table and gets 12 back.
7. Now it can write the data to socket 12.

Step 3 is the extra work. Leave it out, and at step 5 there is no way to tell which client the data is for. That is the book's question "how does the event-based server know what to do?", and the table is its answer. The name the book quotes for this work, "manual stack management", says the same thing: the programmer does by hand what the thread's stack did for free.

**The animation.** The first tab is the four steps of the thread. The second tab is the seven steps of the event handler.

<!-- anim:contin10:start -->
Step through both tabs yourself: the thread, whose stack keeps sd, and the event handler, which has to store it.

<div class="anim" data-anim="contin10" markdown="0"></div>
<!-- anim:contin10:end -->


The last point in your notes is right as well. The book says it in section 33.1: "deciding which event to handle next is equivalent to scheduling".

## Five reading habits {#habits}

Most of these questions were answered by a line that is already in the chapter. Five habits help find such lines.

1. **Read the comments in the book's code.** The answer to Q1 is the last line of the tip's code: "Code assumes that m1 != m2 (not the same lock)".
2. **Read the questions at the end of the chapter.** Code question 4 of chapter 32 asks what Q1 asks, and names the program that holds the answer.
3. **When the book calls its code simple, count what one pass of it does.** Figure 33.1 touches every descriptor three times per pass. Counting that is most of the answer to Q2; measuring is the rest.
4. **Keep two rules apart when each has its own reason.** "No locks" comes from one handler at a time. "No blocking" comes from having only one thread. F1 joined them.
5. **When a sentence says that code "knows" something, find where the value is stored.** In Q3 it is a variable on the thread's stack, and that is the whole meaning.
