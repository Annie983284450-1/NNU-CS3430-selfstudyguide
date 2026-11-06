# Q&A: locked data structures, condition variables and semaphores

*COMP3430 Operating Systems · questions on OSTEP chapters 29, 30 and 31*

These are the questions from two sets of your reading reflections, quoted exactly as you wrote them: the one on OSTEP chapters 28 and 29, whose chapter 29 questions are here, and the one on chapters 30 and 31. The chapters are [Lock-based Concurrent Data Structures](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks-usage.pdf) (chapter 29), [Condition Variables](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-cv.pdf) (chapter 30) and [Semaphores](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf) (chapter 31). For the second set, everything you wrote around each question is quoted too. Each question is answered inside the book's own argument, in the same three steps every time.

The topics follow the order of this week's two classes. The questions keep their numbers: Q15 to Q19 from the first set (Q1 to Q14, on chapter 28, are on the [Week 8 Q&A page](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w08/qa/)), and Q20 to Q22 from the second. F2, F4 and F5 are sentences from your summaries that are close but not quite right; each sits in the topic it belongs to.

1. **Recap.** What we were studying when the question came up, in case you have forgotten it.
2. **The passage in OSTEP.** The paragraph your question came from, word for word, with the key phrase in bold, and then what that paragraph is arguing, step by step. `[…]` marks words left out.
3. **The answer.** It starts from that argument: which step of it answers you, and then the details.

## 1. The counter {#t1}

!!! abstract "Recap"

    Chapter 29 puts locks inside data structures, and its method has two steps. First make the structure correct with one lock, taken by every function that touches it. Then, only if a measurement shows that the lock is the bottleneck, split what is shared, so that threads take different locks. The first structure is a counter. Without a lock it loses adds. With one lock it is exact, but four threads take far longer than one. The **approximate counter** gives each CPU its own local count and moves it into a global count every S adds: fast, and a little behind. (W09 [Section 1.2](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-1/#sec-1-2), [Section 2.3](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-1/#sec-2-3), [Section 2.5](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-1/#sec-2-5) and [Extra 1](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-1/#extra-1).)

**The passage in OSTEP** (§29.1, Concurrent Counters: Simple But Not Scalable):

> As you can see, the non-synchronized counter is a trivial data structure, requiring a tiny amount of code to implement. We now have our next challenge: how can we make this code thread safe? **Figure 29.2 shows how we do so.**
>
> *Figure 29.1: A Counter Without Locks* *(the caption is printed here, at the end of the code; this note is not the book's text)*
>
> This concurrent counter is simple and works correctly. In fact, it follows a design pattern common to the simplest and most basic concurrent data structures: **it simply adds a single lock**, which is acquired when calling a routine that manipulates the data structure, and is released when returning from the call.

**What the passage argues.**

1. Figure 29.1 is the counter without locks: “non-synchronized”.
2. The text asks how to make it thread safe, and points at Figure 29.2.
3. Figure 29.1's caption is printed in between, right above the next sentence.
4. That sentence goes on: it “simply adds a single lock”: it describes Figure 29.2.

### F2. "Concurrent counters without locks: simple, works correctly, easy." {#f2 data-toc-label="F2. The counter without locks"}

Where to reread: OSTEP 29.1, Figures 29.1 and 29.2; W09 [Section 1.2](class-1.md#sec-1-2).

**The answer.** Read with the sentence before it, "this concurrent counter" is the one Figure 29.2 builds: the paragraph before ends "Figure 29.2 shows how we do so", and the sentence itself goes on, "it simply adds a single lock". So the simple counter that works correctly is the one **with** one lock.

Without a lock, `counter++` is three instructions (load, add, store), a second thread can run in the gap, and adds are lost. In W09 [Section 1.2](class-1.md#sec-1-2), four threads without a lock lost most of their adds.

The mix-up is easy to make, because of how the PDF is laid out (Figure Q.1). The sentence "This concurrent counter is simple and works correctly" sits right under the caption "Figure 29.1: A Counter Without Locks". But it describes Figure 29.2, "A Counter With Locks", which is printed on the next page.

<figure markdown="1">
![Figure Q.1. How the page reads: the sentence about the simple, correct counter sits under the caption of Figure 29.1, but it describes Figure 29.2, printed on the next page.](qa_figs/f2_layout.svg)
<figcaption markdown="1">Figure Q.1. How the page reads: the sentence about the simple, correct counter sits under the caption of Figure 29.1, but it describes Figure 29.2, printed on the next page.</figcaption>
</figure>

**The passage in OSTEP** (§29.1, Concurrent Counters: Scalable Counting, and Figure 29.6):

> How often this local-to-global transfer occurs is determined by a threshold S. **The smaller S is, the more the counter behaves like the non-scalable counter above; the bigger S is, the more scalable the counter, but the further off the global value might be from the actual count**. One could simply acquire all the local locks and the global lock (in a specified order, to avoid deadlock) to get an exact value, but that is not scalable.
>
> […] Figure 29.6 shows the importance of the threshold value S, with four threads each incrementing the counter 1 million times on four CPUs. If S is low, performance is poor (but the global count is always quite accurate); if S is high, performance is excellent, but the global count lags **(by at most the number of CPUs multiplied by S)**. This accuracy/performance tradeoff is what approximate counters enable.

**What the passage argues.**

1. Each CPU adds to its own count; every S adds it moves them into the global count.
2. Small S: many trips to the global lock: slow, but the global is nearly exact.
3. Large S: few trips: fast, but the global lags.
4. The lag is at most (number of CPUs) × S.
5. OSTEP gives the trade-off and a measurement, not a value for S.

### Q15. "Then in Chapter 29, I’d like more detail on how the approximate counter’s threshold S affects accuracy versus speed," {#q15 data-toc-label="Q15. How the threshold S trades accuracy for speed"}

Where to reread: OSTEP 29.1, Figure 29.6; W09 [Section 2.5](class-1.md#sec-2-5) and [Extra 1](class-1.md#extra-1).

**The answer.** The passage states the trade-off in one sentence ("the smaller S is, the more the counter behaves like the non-scalable counter above; the bigger S is, the more scalable the counter, but the further off the global value might be from the actual count") and gives the bound on the lag. Both effects come from one fact: S is how many adds a local count holds back before it reports them to the global count. Holding back more adds means fewer trips to the shared lock, which is the speed. It also means more adds the global count has not seen yet, which is the inaccuracy. One knob, two consequences that always move together.

**Speed.** Every add takes its own local lock, which no other thread wants, so it never waits there. Only one add in S also takes the global lock, the one all threads share. With 4 threads making 1,000,000 adds each, there are 4,000,000 adds, so about 4,000,000 / S trips to the global lock (each thread makes one trip per full batch of S; leftovers stay local). With S = 1, every add takes the global lock: 4,000,000 trips, and the run was even slower than the plain one-lock counter (0.157 s against 0.0944 s). With S = 32: 4,000,000 / 32 = 125,000 trips. With S = 1024: each thread makes 976 trips (see the end of this answer), 4 × 976 = 3,904.

**Accuracy.** Each local count can be holding up to S adds that the global count has not received. With 4 local counts, `get()`, which reads only the global count, can be behind the truth by up to 4 × S. That is the passage's bound: the global count lags "by at most the number of CPUs multiplied by S". (The passage also mentions the exact alternative: "acquire all the local locks and the global lock ... to get an exact value, but that is not scalable". Q16 shows how Linux uses it only when it must.)

Figure Q.2 puts both on one chart, from the sweep in W09 [Extra 1](class-1.md#extra-1) (4 threads, 1,000,000 adds each, on the 4-CPU Linux VM, with each thread's local count on its own cache line).

<figure markdown="1">
![Figure Q.2. The S sweep measured in W09 Extra 1. The time falls fast up to S = 32 and then barely moves, while the worst lag, 4 × S, keeps growing. Below each bar: the trips to the global lock, and the worst lag.](qa_figs/q15_s_tradeoff.svg)
<figcaption markdown="1">Figure Q.2. The S sweep measured in W09 [Extra 1](class-1.md#extra-1). The time falls fast up to S = 32 and then barely moves, while the worst lag, 4 × S, keeps growing. Below each bar: the trips to the global lock, and the worst lag.</figcaption>
</figure>

<!-- anim:approx:start -->
Step through the table yourself with S = 5, and watch how far G falls behind the true total.

<div class="anim" data-anim="approx" markdown="0"></div>
<!-- anim:approx:end -->


Read the two rows under the bars together. From S = 1 to S = 32, the time falls from 0.157 s to 0.0065 s, about 24 times faster (0.157 / 0.0065 ≈ 24), while the worst lag grows only from 4 to 128. From S = 32 to S = 1024, the time hardly moves (0.0065 s to 0.0055 s), while the worst lag grows 32 times, from 128 to 4,096. Past the knee, raising S buys almost no speed and keeps costing accuracy.

One detail in the measured output shows the lag directly. At the end of each run, `main` prints what is `still local`: adds sitting in local counts that never reached S. Each thread made 1,000,000 adds, and with S = 1024, 1,000,000 = 976 × 1024 + 576, so each thread ends with 576 adds unreported: 4 × 576 = 2,304, exactly the `still local 2304` in the run. With S = 32, 1,000,000 divides evenly by 32, so nothing is left over (`still local 0`).

### Q16. "or how to choose a good threshold S for the sloppy counter." {#q16 data-toc-label="Q16. How to choose a good S"}

Where to reread: OSTEP 29.1; W09 [Section 2.5](class-1.md#sec-2-5) and [Extra 1](class-1.md#extra-1).

**The answer.** The book stops at the trade-off and a measurement, Figure 29.6; it gives no value for S. That is because "good" depends on two things the counter cannot know: how far behind the readers of the count can afford to be, and how fast the particular machine is. So choosing S is a short recipe, not a formula: decide the accuracy you need, then measure for speed.

1. **Ask what the reading is used for.** A statistics counter (packets received, pages mapped) is read rarely and only shown to people; being thousands behind is fine. A count that decides something, such as "is this user over the disk quota?", may need the exact value.
2. **Turn the tolerable lag into a largest S.** The lag is at most CPUs × S, so S can be at most the tolerable lag divided by the number of CPUs.
3. **Measure, and take the smallest S at the knee.** Run a sweep like Figure 29.6, or W09 [Extra 1](class-1.md#extra-1), on the real machine. On the 4-CPU VM the knee was about S = 32: almost all of the speed, with a lag of at most 128.

Real kernels follow the same recipe. Linux has an approximate counter, `struct percpu_counter` in `lib/percpu_counter.c`, and calls S the **batch**. It sets the batch from the number of CPUs online: `percpu_counter_batch = max(32, nr*2);`, where `nr` is the number of CPUs. So the batch is at least 32, the same knee the VM sweep found, and grows on bigger machines.

Linux also shows how to get both speed and exactness. It has two ways to read the counter. `percpu_counter_read()` returns just the global count: fast, and possibly behind. `percpu_counter_sum()` adds every CPU's local count to it; its comment calls it "a more accurate but much slower version". And when the kernel compares the counter against a limit, it uses the cheap reading whenever that is safe (Figure Q.3). The rough reading is off by at most batch × CPUs. If the limit is farther away than that, the rough answer to "above or below?" cannot be wrong, and no sum is needed. Only when the rough reading is close to the limit does the kernel pay for the exact sum. The code's own comments say "Check to see if rough count will be sufficient for comparison" and "Need to use precise count".

<figure markdown="1">
![Figure Q.3. Linux's approximate counter. Case 1: the rough reading is far from the limit, so the true total, which lies within batch × CPUs of it, is safely on one side. Case 2: the band crosses the limit, so the kernel adds up every CPU's count. Bottom: the recipe for choosing S.](qa_figs/q16_choose_s.svg)
<figcaption markdown="1">Figure Q.3. Linux's approximate counter. Case 1: the rough reading is far from the limit, so the true total, which lies within batch × CPUs of it, is safely on one side. Case 2: the band crosses the limit, so the kernel adds up every CPU's count. Bottom: the recipe for choosing S.</figcaption>
</figure>

So step 4 of the recipe: if only one use of the counter needs the exact value, sum the local counts for that use alone, and keep S large for everything else.

## 2. The list {#t2}

!!! abstract "Recap"

    The list of section 29.2 first takes its lock at the top of insert, before `malloc()` makes the new node. The book then moves the lock so that it covers only the two lines that link the node into the shared list, and `malloc()` ends up outside it. (W09 [Section 2.9](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-1/#sec-2-9) and [Extra 2](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-1/#extra-2).)

**The passage in OSTEP** (§29.2, Concurrent Linked Lists):

> As you can see in the code, the code simply acquires a lock in the insert routine upon entry, and releases it upon exit. One small tricky issue arises if malloc() happens to fail (a rare case); in this case, **the code must also release the lock before failing the insert**.
>
> […] Specifically, we can rearrange the code a bit so that the lock and release only surround the actual critical section in the insert code, and that a common exit path is used in the lookup code. The former works because part of the lookup actually need not be locked; assuming that malloc() itself is thread-safe, each thread can call into it without worry of race conditions or other concurrency bugs. **Only when updating the shared list does a lock need to be held**.

**What the passage argues.**

1. Reason 1: with the lock taken first, a failed malloc() must unlock too: a rare path, easy to get wrong.
2. Reason 2: malloc() touches nothing the list shares, and OSTEP assumes it is thread-safe (the C library on Linux makes it so).
3. So lock only the lines that update the shared list.
4. (The sentence says “lookup”, but the code it describes is the insert.)

### F5. "29.2 (malloc in the linked list): at first I didn’t see why it mattered where malloc was placed. It reserves space, not items, so it doesn’t need the lock." {#f5 data-toc-label="F5. Why malloc() needs no list lock"}

Where to reread: OSTEP 29.2, Figures 29.7 and 29.8; W09 [Extra 2](class-1.md#extra-2).

**The answer.** "Reserves space" is right about what `malloc()` does, but the book's reasons are different, and there are two of them. The rule: "Only when updating the shared list does a lock need to be held". And the rare path: with the lock taken first, a failed `malloc()` means "the code must also release the lock before failing the insert". (One small thing to know when you reread it: the sentence says "part of the lookup actually need not be locked", but the code it describes, with `malloc()` in it, is the insert.)

A lock is for **shared data**, and nothing `malloc()` touches is shared with the list's other threads (Figure Q.4). The new node is private: only the inserting thread knows its address, until the two lines that link it into the list (`new->next = L->head; L->head = new;`). Those two lines are the critical section. And `malloc()` itself must be safe to call from many threads at once; the book says "assuming that malloc() itself is thread-safe", and on Linux that holds, because the C library protects its own heap data with its own lock. That lock belongs to the library, not to the list.

<figure markdown="1">
![Figure Q.4. While the node is being made, only one thread knows its address, so no lock is needed. The two lines that link it in make it shared, so those two lines take the lock.](qa_figs/f5_malloc.svg)
<figcaption markdown="1">Figure Q.4. While the node is being made, only one thread knows its address, so no lock is needed. The two lines that link it in make it shared, so those two lines take the lock.</figcaption>
</figure>

Moving `malloc()` out of the lock also fixes the rare path: if `malloc()` fails, the function returns before it has taken the lock, so there is no lock to forget to release. Section 29.2 cites a study of Linux kernel patches in which nearly 40% of the bugs were on rarely taken code paths like this one.

## 3. The queue {#t3}

!!! abstract "Recap"

    Section 29.3's queue has two locks: one at the head, where items leave, and one at the tail, where items arrive, so an enqueue and a dequeue can run at the same time. A **dummy node**, an empty node made when the queue is set up, lets the two ends work separately. Michael and Scott designed it. (W09 [Extra 4](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-1/#extra-4).)

**The passage in OSTEP** (§29.3, Concurrent Queues):

> Instead, we’ll take a look at a slightly more concurrent queue **designed by Michael and Scott [MS98]**. The data structures and code used for this queue are found in Figure 29.9 on the following page.
>
> If you study this code carefully, you’ll notice that there are two locks, one for the head of the queue, and one for the tail. The goal of these two locks is to enable concurrency of enqueue and dequeue operations. In the common case, **the enqueue routine will only access the tail lock, and dequeue only the head lock**.
>
> One trick used by Michael and Scott is to add a dummy node (allocated in the queue initialization code); **this dummy enables the separation of head and tail operations**.

**What the passage argues.**

1. Two locks: the tail lock for enqueue, the head lock for dequeue.
2. Goal: an enqueue and a dequeue at the same time.
3. The dummy is a node made by Queue_Init(), with no value in it.
4. “Separation of head and tail operations”: enqueue never touches head, dequeue never touches tail.
5. The name: the two people who designed it.

### Q17. "and on why the Michael and Scott queue needs a dummy node." {#q17 data-toc-label="Q17. Why the Michael and Scott queue needs a dummy node"}

Where to reread: OSTEP 29.3, Figure 29.9; W09 [Extra 4](class-1.md#extra-4).

**The answer.** The book says the dummy "enables the separation of head and tail operations", and leaves the reason to you. The reason shows when you take the dummy away. Without it, the empty queue is a special case: both `head` and `tail` are NULL, and the first enqueue and the last dequeue must each change *both* pointers. Changing both means holding both locks, and that brings back the waiting the two locks were meant to remove, plus a risk of deadlock.

Start with the queue that has no dummy (Figure Q.5, top).

- **Empty:** `head = NULL`, `tail = NULL`.
- **Enqueue into the empty queue:** the new node is both the first and the last, so the enqueuer must set `tail` and also `head`. It needs the head lock as well as the tail lock.
- **Dequeue the last item:** the queue becomes empty, so the dequeuer must set `head` to NULL and also `tail`. It needs the tail lock as well as the head lock.

Now the enqueuer takes the tail lock and then the head lock, while the dequeuer takes the head lock and then the tail lock. If each grabs its first lock at the same moment, each waits forever for the other's: a **deadlock**. Taking the two locks in one fixed order would avoid the deadlock, but the empty-queue cases would still need both locks, and the code would need special cases to tell when. The dummy removes those cases altogether.

<figure markdown="1">
![Figure Q.5. Top: without a dummy, an enqueue into an empty queue and a dequeue of the last item must both change head and tail, so each needs both locks. Bottom: with the dummy, enqueue only touches the tail side and dequeue only the head side. Below: the authors' own sentence.](qa_figs/q17_dummy.svg)
<figcaption markdown="1">Figure Q.5. Top: without a dummy, an enqueue into an empty queue and a dequeue of the last item must both change head and tail, so each needs both locks. Bottom: with the dummy, enqueue only touches the tail side and dequeue only the head side. Below: the authors' own sentence.</figcaption>
</figure>

With the dummy (Figure Q.5, bottom), `Queue_Init()` makes one empty node and points both `head` and `tail` at it. The list never has zero nodes again, so the special case is gone.

- **Enqueue** links the new node after the current last node and moves `tail`. It writes `tail->next` and `tail`, and never `head`.
- **Dequeue** reads the value from the node *after* the dummy, `head->next`, moves `head` to that node, and frees the old dummy. The node it just read becomes the new dummy; its value is now ignored. It writes only `head`, and never `tail`.
- **Empty** is now `head->next == NULL`, which the dequeuer can see from the head side alone (Figure 29.9, the `new_head == NULL` check).

So in this code the passage's "common case" is in fact every case: an enqueue never takes the head lock, and a dequeue never takes the tail lock.

One honest caveat, the same one W09 [Extra 4](class-1.md#extra-4) makes. When the queue is empty, `head` and `tail` both point at the dummy, so an enqueue writing `dummy->next` and a dequeue reading it touch the same field at the same moment, under different locks. By the strict rule of W09 [Section 1.6](class-1.md#sec-1-6) that is a race. The book's code lives with it, and the original paper relies on the machine reading and writing a pointer in one step; a stricter version would take both locks when the queue is empty.

The authors say it in one sentence in their 1996 paper: "Because of the dummy node, enqueuers never have to access Head, and dequeuers never have to access Tail, thus avoiding potential deadlock problems that arise from processes trying to acquire the locks in different orders."

### F4. "The Michael and Scott queue uses one lock on the head and one on the tail, plus a dummy node that keeps them from pointing at the same node." {#f4 data-toc-label="F4. What the dummy node guarantees"}

Where to reread: OSTEP 29.3, Figure 29.9; W09 [Extra 4](class-1.md#extra-4).

**The answer.** "Separation of head and tail operations" is about which pointer each side changes, not about where the pointers point. When the queue is empty, `head` and `tail` *do* point at the same node: the dummy. `Queue_Init()` even says so: `q->head = q->tail = tmp;`. What the dummy guarantees is something else: an enqueue never has to change `head`, and a dequeue never has to change `tail`, so each side takes only its own lock. Figure Q.5 in Q17 shows both cases, and the end of Q17 notes the one field both sides can touch when the queue is empty.

### Q18. "(Also, why is it called Michael and Scott anyways? Could they not get any more creative?)" {#q18 data-toc-label="Q18. Why it is called Michael and Scott"}

Where to reread: OSTEP 29.3 and its reference [MS98].

**The answer.** The first sentence already answers it: the queue was "designed by Michael and Scott [MS98]". In this field, an algorithm is usually named after the people who published it.

The queue is named after its two authors, Maged M. Michael and Michael L. Scott, of the University of Rochester. They published it in 1996 in "Simple, Fast, and Practical Non-Blocking and Blocking Concurrent Queue Algorithms", at the PODC conference. OSTEP cites their 1998 journal paper, [MS98]. And yes, one author's last name and the other's first name are both Michael.

The creativity went into the paper instead (Figure Q.6). The two-lock queue of Figure 29.9 is the *second* algorithm in it. The first is a queue that uses no locks at all, built on compare-and-swap (the lock-free pattern of [Q4 on the Week 8 Q&A page](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w08/qa/#q4)). That one is in wide use today: Java's `ConcurrentLinkedQueue` is based on it, and its documentation cites the paper by name.

<figure markdown="1">
![Figure Q.6. The 1996 paper and its two algorithms: a lock-free queue, behind Java's ConcurrentLinkedQueue, and the two-lock queue of OSTEP Figure 29.9. Michael L. Scott is also the S in the MCS lock.](qa_figs/q18_names.svg)
<figcaption markdown="1">Figure Q.6. The 1996 paper and its two algorithms: a lock-free queue, behind Java's ConcurrentLinkedQueue, and the two-lock queue of OSTEP Figure 29.9. Michael L. Scott is also the S in the MCS lock.</figcaption>
</figure>

The same habit gives you Dekker's and Peterson's algorithms (W08 [Extra 5](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w08/class-2/#extra-5)) and Lamport's bakery algorithm. And Michael Scott shows up once more: the **MCS lock** is named for Mellor-Crummey and Scott, the same Michael L. Scott. The Linux kernel's mutex uses an MCS-style lock to line up the threads that are spinning on it (the optimistic spinning of [Q12 on the Week 8 Q&A page](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w08/qa/#q12)), so that only one spinner at a time competes for the mutex.

## 4. The hash table {#t4}

!!! abstract "Recap"

    Section 29.4 builds a hash table out of the lists of section 29.2: many short lists, each with its own lock, and the key decides which list to use. The book assumes you already know what a hash table is. (W09 Section 2.9, Section 2.11 and [Section 2.12](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-1/#sec-2-12).)

**The passage in OSTEP** (§29.4, Concurrent Hash Table):

> We end our discussion with a simple and widely applicable concurrent data structure, the hash table. We’ll focus on a simple hash table that does not resize; […]
>
> This concurrent hash table (Figure 29.10) is straightforward, is **built using the concurrent lists we developed earlier**, and works incredibly well. The reason for its good performance is that instead of having a single lock for the entire structure, **it uses a lock per hash bucket (each of which is represented by a list)**. Doing so enables many concurrent operations to take place.

Figure 29.10 (Hash_Init left out):

```c
#define BUCKETS (101)
typedef struct __hash_t {
  list_t lists[BUCKETS];
} hash_t;
int Hash_Insert(hash_t *H, int key) {
  return List_Insert(&H->lists[key % BUCKETS], key);
}
int Hash_Lookup(hash_t *H, int key) {
  return List_Lookup(&H->lists[key % BUCKETS], key);
}
```

**What the passage argues.**

1. OSTEP does not explain what a hash table is; it assumes you know.
2. Here it is a fixed array of 101 buckets, and each bucket is one list of section 29.2.
3. key % BUCKETS picks the bucket.
4. One lock per bucket instead of one for the table: many operations at once.

### Q19. "29.3 and 29.4 (queue and hash table): I mixed the dummy node up with the linked list, and I didn’t know what a hash table did." {#q19 data-toc-label="Q19. What a hash table does"}

Where to reread: OSTEP 29.4; W09 [Section 2.9](class-1.md#sec-2-9), [Section 2.11](class-1.md#sec-2-11) and [Section 2.12](class-1.md#sec-2-12).

**The answer.** Section 29.4 takes the hash table for granted. It says only that it builds "a simple hash table that does not resize", "built using the concurrent lists we developed earlier", and goes straight to its locks, as if you had met hash tables in a data structures course. Until the structure itself is clear, the point about its locks cannot land. (The dummy node belongs to the queue of 29.3, not to the list or the hash table; Q17 explains what it is for.)

**The problem a hash table solves.** You keep many keys, and you want to find one fast. In one linked list of 10,000 keys, a lookup starts at the front and compares key after key, up to 10,000 steps (W09 [Section 2.9](class-1.md#sec-2-9)).

**The idea.** Keep many short lists instead of one long one, in an array. Each short list is a **bucket**. Then use a rule, the **hash function**, that computes from the key which bucket the key belongs in. OSTEP's table has 101 buckets, and the rule is `key % 101`, the remainder after dividing the key by 101. To insert 103: 103 % 101 = 2, so 103 goes into bucket 2. To look up 103 later, compute 2 again, and walk only bucket 2. With 10,000 keys spread over 101 buckets, each bucket holds about 10,000 / 101 ≈ 99 keys, so a lookup walks about 99 keys instead of 10,000 (Figure Q.7). A library does the same with author names: you go straight to the shelf for "M" and never look at the rest.

<figure markdown="1">
![Figure Q.7. Left: one list, walked from the front. Right: 101 short lists, each with its own lock; the key's remainder after dividing by 101 picks the one list to walk.](qa_figs/q19_hash.svg)
<figcaption markdown="1">Figure Q.7. Left: one list, walked from the front. Right: 101 short lists, each with its own lock; the key's remainder after dividing by 101 picks the one list to walk.</figcaption>
</figure>

**Why chapter 29 cares.** Give each bucket its own lock: "a lock per hash bucket (each of which is represented by a list)". A thread looking up 57 locks bucket 57; a thread looking up 103 locks bucket 2. Different keys usually land in different buckets, so the threads take different locks, and their walks run at the same time. That is the whole of Figure 29.10: one lock per bucket instead of one lock for the table. On the 4-CPU VM, 4 threads did their lookups about 2 times faster than 1 (W09 [Section 2.12](class-1.md#sec-2-12)).

The mix-up with the dummy is understandable, because the queue is itself a linked list. What makes it different is one extra empty node at the front, the dummy. The plain list and the lists inside the hash table start straight with real nodes.

Hash tables are everywhere: Python's `dict` and Java's `HashMap` are hash tables too, though they arrange their buckets differently from OSTEP's lists.

## 5. Signals are hints {#t5}

!!! abstract "Recap"

    A condition variable is a queue that threads sleep on until some state changes. `wait(&c, &m)` is called with the lock `m` held. It releases the lock and puts the caller to sleep in one step, and it takes the lock back before it returns. `signal(&c)` wakes a thread that sleeps on `c`. Section 30.2 of the book uses them on the bounded buffer: producers put items into a shared buffer, and consumers take them out. Its first try has one slot, one condition variable and an `if`, and the book's Figure 30.9 traces how it breaks with one producer, Tp, and two consumers, Tc1 and Tc2. (W09 [Section 3.4](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-1/#sec-3-4), [Section 4.3](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-2/#sec-4-3) and [Section 4.4](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-2/#sec-4-4).)

Q20 comes from the paragraph right after Figure 30.9.

For reference, the producer and consumer of the first try, OSTEP Figure 30.8, with the book's line numbers and its labels p1 to p6 and c1 to c6:

```{.c .numberLines startFrom="5"}
void *producer(void *arg) {
    int i;
    for (i = 0; i < loops; i++) {
        Pthread_mutex_lock(&mutex);           // p1
        if (count == 1)                       // p2
            Pthread_cond_wait(&cond, &mutex); // p3
        put(i);                               // p4
        Pthread_cond_signal(&cond);           // p5
        Pthread_mutex_unlock(&mutex);         // p6
    }
}

void *consumer(void *arg) {
    int i;
    for (i = 0; i < loops; i++) {
        Pthread_mutex_lock(&mutex);           // c1
        if (count == 0)                       // c2
            Pthread_cond_wait(&cond, &mutex); // c3
        int tmp = get();                      // c4
        Pthread_cond_signal(&cond);           // c5
        Pthread_mutex_unlock(&mutex);         // c6
        printf("%d\n", tmp);
    }
}
```

Two things to know before you read it. `count` says how full the one-slot buffer is: 0 when it is empty and 1 when it holds an item. The book's rule is to "only put data into the buffer when count is zero (i.e., when the buffer is empty), and only get data from the buffer when count is one (i.e., when the buffer is full)." And the calls with a capital P, such as `Pthread_mutex_lock`, are the book's wrappers. OSTEP chapter 27 (§27.3) explains them: they "just call their similarly-named lower-case versions", and they "assert that the routine succeeded". So `Pthread_cond_wait` is `pthread_cond_wait` with an error check added.

**The passage in OSTEP** (§30.2, The Producer/Consumer (Bounded Buffer) Problem, after Figure 30.9):

> […] The producer then signals that a buffer has been filled (p5). Critically, this moves the first consumer (Tc1) from sleeping on a condition variable to the ready queue; **Tc1 is now able to run (but not yet running)**. The producer then continues until realizing the buffer is full, at which point it sleeps (p6, p1–p3).
>
> Here is where the problem occurs: another consumer (Tc2) **sneaks in** and consumes the one existing value in the buffer (c1, c2, c4, c5, c6, skipping the wait at c3 because the buffer is full). Now assume Tc1 runs; just before returning from the wait, it re-acquires the lock and then returns. […]
>
> The problem arises for a simple reason: after the producer woke Tc1, but before Tc1 ever ran, the state of the bounded buffer changed (thanks to Tc2). Signaling a thread only wakes them up; it is thus a hint that the state of the world has changed (in this case, that a value has been placed in the buffer), but **there is no guarantee that when the woken thread runs, the state will still be as desired**. This interpretation of what a signal means is often referred to as Mesa semantics, after the first research that built a condition variable in such a manner [LR80]; the contrast, referred to as Hoare semantics, is harder to build but provides a stronger guarantee that **the woken thread will run immediately upon being woken** [H74]. Virtually every system ever built employs Mesa semantics.

**What the passage argues.**

1. The signal at p5 only moves Tc1 to the ready queue. Tc1 can run, but it is not running.
2. The producer, the thread that signaled, keeps going. It unlocks, loops, finds the buffer full and sleeps.
3. Before Tc1 runs, another consumer, Tc2, gets in and takes the item.
4. Then Tc1 runs. It takes the lock back inside wait() and returns, but the item is gone.
5. So a signal is a hint, not a promise. That is Mesa semantics. Only Hoare semantics would run the woken thread at once.

### Q20. "If there’s only one CPU and the signal() thread keeps running, can the state still change after the signal but before the thread returns from wait()?" {#q20 data-toc-label="Q20. Whether the state can change on one CPU"}

> **Location:** 30.2 The Producer/Consumer (Bounded Buffer) Problem
>
> **Quote:** “Signaling a thread only wakes them up; it is thus a hint that the state of the world has changed (in this case, that a value has been placed in the buffer), but there is no guarantee that when the woken thread runs, the state will still be as desired.”
>
> **What I think this passage is saying:** I think it’s saying that when a thread calls signal(), the thread it woke up isn’t necessarily going to run immediately. It just gets ready, and by the time it gets the lock back, another thread might have changed the state. That’s why the waiting thread checks itself again with a while loop.
>
> **My question:** If there’s only one CPU and the signal() thread keeps running, can the state still change after the signal but before the thread returns from wait()?
>
> **What I already tried:** I read through the section again but was not able to answer my own question.

Where to reread: OSTEP 30.2, Figure 30.9 and the three paragraphs after it; W09 [Section 4.4](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-2/#sec-4-4) and [Section 3.4](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-1/#sec-3-4).

**The answer.** Yes, it can. Figure 30.9 is a run you could see on one CPU: in every row of the trace at most one thread is running. Your reading in "What I think" is right, and steps 1 to 3 of the passage are the one-CPU answer. The signal only makes Tc1 ready ("able to run (but not yet running)"). The thread that signaled keeps the CPU. When it finally gives the CPU up, the scheduler picks the next thread to run, and it picks Tc2, which "sneaks in" and takes the item. Tc1 returns from wait() only after that.

So one CPU does not protect the state. Before wait() can return, Tc1 needs two things: the CPU, and the lock back. On one CPU, Tc1 gets the CPU only when the scheduler chooses it, and a signal does not make the scheduler choose it next. That promise is Hoare semantics, "the woken thread will run immediately upon being woken", and the book says virtually every system uses Mesa semantics instead.

**One CPU, step by step.** These are the rows of Figure 30.9, grouped. In the first row, Tc2 and Tp are already Ready, waiting for the CPU, and the scheduler runs Tc1 first.

1. Tc1 locks (c1), finds `count` 0 (c2), and waits (c3): it releases the lock and sleeps.
2. Tp locks (p1), finds `count` 0 (p2), and puts an item (p4): `count` is 1.
3. Tp signals (p5). Tc1 moves to the ready queue. Tp still has the CPU, and it still holds the lock.
4. Tp unlocks (p6), loops, and locks again (p1). It is the thread that is running, so it gets the lock before Tc1 can ask. It finds `count` 1 (p2) and waits (p3), which releases the lock. Now two threads are ready: Tc1, just woken, and Tc2, which has been ready since the first row.
5. The scheduler picks Tc2. It locks (c1), finds `count` 1 (c2), skips the wait, and takes the item (c4): `count` is 0. It signals (c5), which wakes Tp, and unlocks (c6).
6. The scheduler picks Tc1. Inside wait() it takes the lock back, wait() returns, and Tc1 calls get() (c4) on an empty buffer.

Only one thread ran at any moment, and still the state changed between the signal (step 3) and the return from wait() (step 6). The thread that changed it was a third thread, Tc2. The CPU count never mattered. What mattered is that two threads were ready at step 4, and the scheduler, not the signal, chose between them.

**Why the while loop is needed on one CPU too.** This is the reason the book gives for its rule: "Thanks to Mesa semantics, a simple rule to remember with condition variables is to always use while loops." With the `while` of Figure 30.10, Tc1 in step 6 checks `count` again with the lock held, finds 0, and goes back to sleep instead of calling get().

**The animation.** It uses the course's `pc_if.c` (W09 [Section 4.3](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-2/#sec-4-3)), which follows Figure 30.8, with the same labels. Its line numbers are the file's, so p1 to p6 sit on lines 28 to 33 and c1 to c6 on lines 40 to 45, not on the book's lines 8 to 13 and 20 to 25. Go by the labels.

<!-- anim:prodcons:start -->
Step through the first tab yourself: OSTEP Figure 30.9, one row at a time, with at most one thread running at each step. Tc1 is woken at step 5 and runs only at step 12. The other two tabs are the while version and the two-queue version of W09 Sections 4.5 and 4.6.

<div class="anim" data-anim="prodcons" markdown="0"></div>
<!-- anim:prodcons:end -->


## 6. Covering conditions {#t6}

!!! abstract "Recap"

    The one-slot buffer was fixed with two condition variables: producers wait on `empty` and consumers on `fill`, so a signal always reaches a thread of the right kind. `pthread_cond_broadcast()` wakes every thread asleep on a condition variable, not just one. Section 30.3 of the book then turns to a memory allocator whose sleepers each need a different number of bytes. (W09 [Section 4.5](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-2/#sec-4-5), [Section 4.6](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-2/#sec-4-6) and [Extra 6](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-2/#extra-6).)

Q21 comes from section 30.3, which first shows the allocator's problem and then, in its last paragraph, says when broadcast is the right fix. Here is the allocator, OSTEP Figure 30.15, with the book's line numbers. Its `free()` takes two arguments, the pointer and the size, unlike the C library's `free(ptr)`. It is the book's own small allocator, which keeps count of the free bytes itself. When the text writes `free(50)`, it means a call that gives back 50 bytes.

```{.c .numberLines startFrom="1"}
// how many bytes of the heap are free?
int bytesLeft = MAX_HEAP_SIZE;

// need lock and condition too
cond_t c;
mutex_t m;

void *
allocate(int size) {
    Pthread_mutex_lock(&m);
    while (bytesLeft < size)
        Pthread_cond_wait(&c, &m);
    void *ptr = ...; // get mem from heap
    bytesLeft -= size;
    Pthread_mutex_unlock(&m);
    return ptr;
}

void free(void *ptr, int size) {
    Pthread_mutex_lock(&m);
    bytesLeft += size;
    Pthread_cond_signal(&c); // whom to signal??
    Pthread_mutex_unlock(&m);
}
```

With the fix the text proposes, line 22 becomes:

```{.c .numberLines startFrom="22"}
    Pthread_cond_broadcast(&c);
```

**The passage in OSTEP** (§30.3, Covering Conditions):

> Consider the following scenario. Assume there are zero bytes free; thread Ta calls allocate(100), followed by thread Tb which asks for less memory by calling allocate(10). Both Ta and Tb thus wait on the condition and go to sleep; there aren’t enough free bytes to satisfy either of these requests.
>
> At that point, assume a third thread, Tc, calls free(50). Unfortunately, when it calls signal to wake a waiting thread, it might not wake the correct waiting thread, Tb, which is waiting for only 10 bytes to be freed; Ta should remain waiting, as not enough memory is yet free. Thus, the code in the figure does not work, as **the thread waking other threads does not know which thread (or threads) to wake up**.
>
> The solution suggested by Lampson and Redell is straightforward: replace the pthread_cond_signal() call in the code above with a call to pthread_cond_broadcast(), which wakes up all waiting threads. By doing so, we guarantee that any threads that should be woken are. The downside, of course, can be a negative performance impact, as we might needlessly wake up many other waiting threads that shouldn’t (yet) be awake. Those threads will simply wake up, re-check the condition, and then go immediately back to sleep.
>
> Lampson and Redell call such a condition a covering condition, as it covers all the cases where a thread needs to wake up (conservatively); the cost, as we’ve discussed, is that too many threads might be woken.
>
> The astute reader might also have noticed we could have used this approach earlier (see the producer/consumer problem with only a single condition variable). However, in that case, **a better solution was available to us**, and thus we used it. In general, if you find that your program only works when you change your signals to broadcasts (**but you don’t think it should need to**), you probably have a bug; fix it! But in cases like the memory allocator above, broadcast may be the most straightforward solution available.

**What the passage argues.**

1. Zero bytes are free. Ta waits for 100 bytes and Tb for 10, and both sleep on the same condition variable, `c`.
2. Tc frees 50. Now Tb could go on, and Ta could not.
3. A signal wakes one sleeper, and nothing makes it Tb: free() "does not know which thread (or threads) to wake up".
4. The fix is broadcast. Every sleeper wakes and checks again, and the ones that still cannot go on sleep again. The price is wake-ups that lead nowhere.
5. The one-queue buffer could have used broadcast too, but "a better solution was available": a second queue. For the allocator, broadcast "may be the most straightforward solution available".

### Q21. "so how do I tell when broadcast is the right design, like in the allocator, and when it is just hiding a bug?" {#q21 data-toc-label="Q21. When broadcast is the right design"}

> **Location:** 30.3 Covering Conditions
>
> **Quote:** “the thread waking other threads does not know which thread (or threads) to wake up”
>
> **What I think this passage is saying:** When memory is freed, the thread calling free() only knows how much memory came back. It doesn’t know how much each sleeping thread needs. So signal might wake a thread that still cannot run (one waiting for 100 bytes when 50 are free) while a thread that could run (one waiting for 10 bytes) stays asleep. That is why the book uses broadcast here.
>
> **My question:** The book also says that if a program only works after changing signal to broadcast, there is probably a bug, so how do I tell when broadcast is the right design, like in the allocator, and when it is just hiding a bug?
>
> **What I already tried:** I asked AI to explain what the allocate() and free() code was doing. It traced thread A waiting for 100 bytes and thread B waiting for 10, then 50 being freed. With signal, only one of them wakes and it might be A, which goes back to sleep while B never wakes. With broadcast, both wake, each rechecks its while condition, B takes its memory and A sleeps again. That made the example clear, but I still do not understand the book’s warning about broadcast hiding bugs.

Where to reread: OSTEP 30.3, Figure 30.15 and the last paragraph of the section; OSTEP 30.2, Figures 30.10 to 30.12; W09 [Extra 6](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-2/#extra-6), [Section 4.5](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-2/#sec-4-5) and [Section 4.6](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-2/#sec-4-6).

**The answer.** The test is in the last paragraph, in two phrases: "a better solution was available to us" and "but you don't think it should need to". Look at each place that signals, and at what the threads asleep on that condition variable are waiting for. The question is never whether you, reading a trace, can see who should wake. It is whether the signaling code can tell, from what it knows at that line, that one sleeper can now go on and which one. Your reading of the allocator in "What I think" is right: free() knows only how much came back, so its code cannot tell. That gives three cases, and they do not overlap (Figure Q.8).

**Case 1. Every sleeper waits for the same thing, and the signaling code can tell that one of them can now go on: a signal is enough.** The working buffer of Figure 30.12 is this case. Only consumers sleep on `fill`, and they all wait for an item. After `put()`, the producer knows one item is there and that any one consumer can take it, so it signals `fill`, and whichever consumer wakes can go on.

**Case 2. Sleepers that wait for different kinds of thing share one queue: give each kind its own queue.** This is the book's producer and consumer with one condition variable (Figures 30.10 and 30.11), and it is the case the warning is about. Producers wait for an empty slot and consumers wait for an item, but they all sleep on `cond`. After a consumer empties the slot, the right sleeper is a producer, but a signal on `cond` may wake the other consumer. Then, as Figure 30.11 traces, the woken consumer finds nothing and sleeps, and all three threads end up asleep: the program hangs. Change that signal to a broadcast and the program works, because the producer is woken too. But every signal now also wakes threads that cannot go on, and the reason it hung, two kinds of sleeper on one queue, is still in the design. That is the bug that broadcast hides. The book's fix is two condition variables, one per kind, so that a consumer signals only producers (Figure 30.12). That is the "better solution" of the passage.

**Case 3. The signaling code cannot tell which sleeper the change helps: broadcast.** This is the allocator. After `free(50)`, who can go on depends on how much each sleeper asked for, and that is the `size` of its own call to allocate(), which free() never sees. One free() may help no sleeper, one, or several: a `free(110)` would cover both Ta's 100 and Tb's 10. Broadcast wakes them all and lets each one check its own `while` loop. That is the covering condition, and the book's verdict is hedged: here broadcast "may be the most straightforward solution available". Its price is the wake-ups that lead nowhere.

<figure markdown="1">
![Figure Q.8. The three cases at each signal. Case 1: one kind of sleeper, and the signaling code knows one can go on: signal. Case 2: two kinds on one queue: give each kind a queue; broadcast would hide that flaw. Case 3: the signaling code cannot tell which sleeper the change helps: broadcast, and let each one check again.](qa_figs/q2_three_cases.svg)
<figcaption markdown="1">Figure Q.8. The three cases at each signal. Case 1: one kind of sleeper, and the signaling code knows one can go on: signal. Case 2: two kinds on one queue: give each kind a queue; broadcast would hide that flaw. Case 3: the signaling code cannot tell which sleeper the change helps: broadcast, and let each one check again.</figcaption>
</figure>

So, for your own code. If a program fails with signal and works with broadcast, first ask which case you are in. If it is case 1 or case 2, the broadcast is covering a mistake: a wrong queue, or two kinds of sleeper sharing one. Fix that, and signal again. Broadcast is the design only in case 3. In every case keep the `while`: with broadcast, most of the woken threads "re-check the condition, and then go immediately back to sleep".

An aside on xv6, the kernel you use in the labs. It has no signal-one call. A process sleeps on an address, called its channel, and `wakeup()` on that address wakes every process asleep there; each one checks its condition again in a loop (W09 [Section 4.11](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-2/#sec-4-11)). The kernel pays the cost of case 3's broadcast everywhere, in exchange for simpler code.

**Your trace, line by line.** Your AI's trace is the book's scenario. Here it is with Figure 30.15's line numbers, first with signal:

1. Ta calls allocate(100). It locks `m` (line 10), finds `bytesLeft` 0, which is less than 100 (line 11), and waits (line 12): it releases `m` and sleeps on `c`.
2. Tb calls allocate(10). Lines 10 to 12 again: 0 is less than 10, so it sleeps on `c` too.
3. Tc calls free(50). It locks `m` (line 20) and adds 50 (line 21): `bytesLeft` is 50.
4. Tc signals `c` (line 22). One sleeper wakes; say it is Ta. Tc unlocks (line 23).
5. Ta takes `m` back inside wait() and checks line 11 again: 50 is less than 100, so it waits again (line 12).
6. Both sleep, with 50 bytes free. Tb could go on, but only free() signals `c`, so Tb sleeps until some later free().

Then with broadcast on line 22:

1. Ta and Tb go to sleep and Tc frees 50, as in steps 1 to 3 above.
2. Tc broadcasts (line 22), and both Ta and Tb wake. Tc unlocks (line 23).
3. Say Ta gets `m` first. Line 11: 50 is less than 100, so it waits again.
4. Tb gets `m`. Line 11: 50 is not less than 10, so its loop ends. It takes the memory (line 13), `bytesLeft` drops to 40 (line 14), it unlocks (line 15) and returns `ptr` (line 16).
5. Tb has its 10 bytes. Ta woke for nothing and sleeps again, which is the price the book names.

The animation below steps through both runs, one tab each, with the code beside the picture.

<!-- anim:covering:start -->
Step through both tabs yourself: the same three threads, first with signal() on line 22, then with broadcast().

<div class="anim" data-anim="covering" markdown="0"></div>
<!-- anim:covering:end -->


## 7. The dining philosophers {#t7}

!!! abstract "Recap"

    A semaphore is an integer with two calls. `sem_wait()` lowers it by one and sleeps if it goes negative; `sem_post()` raises it by one and wakes one sleeper, if there is one. A semaphore started at 1 is a lock. Section 31.6 of the book seats five philosophers at a round table, with one fork between each pair. Each fork is a semaphore started at 1, and a philosopher needs both of its forks to eat. A **deadlock** is a ring of waits: each thread waits for something the next one holds, all the way round. (W09 [Section 5.2](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-2/#sec-5-2), [Section 5.3](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-2/#sec-5-3) and [Extra 8](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-2/#extra-8); W10 [Section 3.4](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-1/#sec-3-4).)

Q22 comes from the paragraph that fixes the deadlock. The table is the book's Figure 31.14: philosopher p sits between fork p and fork p + 1, with fork 0 between philosopher 4 and philosopher 0. The book's helpers name the two forks:

```c
int left(int p) { return p; }
int right(int p) { return (p + 1) % 5; }
```

The broken version, OSTEP Figure 31.15, and the fix, OSTEP Figure 31.16 (put_forks() stays the same), with the book's line numbers:

```{.c .numberLines startFrom="1"}
void get_forks(int p) {
    sem_wait(&forks[left(p)]);
    sem_wait(&forks[right(p)]);
}

void put_forks(int p) {
    sem_post(&forks[left(p)]);
    sem_post(&forks[right(p)]);
}
```

```{.c .numberLines startFrom="1"}
void get_forks(int p) {
    if (p == 4) {
        sem_wait(&forks[right(p)]);
        sem_wait(&forks[left(p)]);
    } else {
        sem_wait(&forks[left(p)]);
        sem_wait(&forks[right(p)]);
    }
}
```

**The passage in OSTEP** (§31.6, The Dining Philosophers):

> The problem is deadlock. If each philosopher happens to grab the fork on their left before any philosopher can grab the fork on their right, **each will be stuck holding one fork and waiting for another, forever**. Specifically, philosopher 0 grabs fork 0, philosopher 1 grabs fork 1, philosopher 2 grabs fork 2, philosopher 3 grabs fork 3, and philosopher 4 grabs fork 4; all the forks are acquired, and all the philosophers are stuck waiting for a fork that another philosopher possesses. […]
>
> The simplest way to attack this problem is to change how forks are acquired by at least one of the philosophers; indeed, this is how Dijkstra himself solved the problem. Specifically, let’s assume that philosopher 4 (the highest numbered one) gets the forks in a different order than the others (Figure 31.16); the put_forks() code remains the same.
>
> Because the last philosopher tries to grab right before left, **there is no situation where each philosopher grabs one fork and is stuck waiting for another; the cycle of waiting is broken**. Think through the ramifications of this solution, and convince yourself that it works.

**What the passage argues.**

1. Each philosopher p takes fork left(p) = p, then fork right(p) = (p + 1) % 5.
2. If all five take their first fork before anyone takes a second, all five forks are held, one each. Each philosopher waits for the fork the next one holds: a ring, forever.
3. The fix changes the order for one philosopher. Philosopher 4 takes its right fork, fork 0, first.
4. Then the state of step 2, everyone holding one fork and waiting for another, cannot happen. The cycle of waiting is broken.
5. The book leaves the "why" to you: "convince yourself that it works".

### Q22. "How does reversing the fork grab order of at least one philosopher break the cycle?" {#q22 data-toc-label="Q22. How one reversed philosopher breaks the cycle"}

> **Location:** 31.6 The Dining Philosophers
>
> **Quote:** “Because the last philosopher tries to grab right before left, there is no situation where each philosopher grabs one fork and is stuck waiting for another; the cycle of waiting is broken.”
>
> **What I think this passage is saying:** I’m pretty sure The passage is saying that by reversing the order that at least one philosopher grabs the forks, the cycle is broken.
>
> **My question:** How does reversing the fork grab order of at least one philosopher break the cycle?
>
> **What I already tried:** I’ve tried visualising it.

Where to reread: OSTEP 31.6, Figures 31.14 to 31.16, and the part headed "A Solution: Breaking The Dependency"; W09 [Extra 8](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w09/class-2/#extra-8); W10 [Section 3.4](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-1/#sec-3-4), [Section 3.5](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-1/#sec-3-5) and [Section 3.6](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-1/#sec-3-6).

**The answer.** Your reading is right, and the passage's step 4 says why in one line: the deadlock needs a state where "each philosopher grabs one fork and is stuck waiting for another". The reversed order makes that state impossible. Philosopher 4's first fork is now fork 0, which is also philosopher 0's first fork, and only one of them can hold it. So at any moment at least one of the two holds no fork at all. Count it the other way and you get the same result: five philosophers holding one fork each would need philosopher 4 to hold exactly one, and philosopher 4 cannot hold fork 4 without fork 0, so its one fork would be fork 0, which philosopher 0 needs as its one fork too. One each is impossible. The forks can still all be in use at once, as right after step 4 of the trace below, but then some philosopher holds two and is eating.

**The ring, link by link.** In the broken version the ring has five links. Philosopher 0 waits for fork 1, which philosopher 1 holds; philosopher 1 waits for fork 2, held by philosopher 2; philosopher 2 waits for fork 3, held by philosopher 3; philosopher 3 waits for fork 4, held by philosopher 4; and philosopher 4 waits for fork 0, held by philosopher 0. That last wait brings you back to the start. Every link is the same: a philosopher holds its first fork and waits for its second, which the next philosopher holds as its first. Why five links and not three: a philosopher only ever waits for a fork it shares with a neighbor, so each link is a step to the next seat, and in the broken version every step goes the same way round the table. A ring of such steps can only close by going all the way round, through all five philosophers. Remove one link for good and no ring can form.

**What the reversal changes.** Look at the link from philosopher 3 to philosopher 4. Philosopher 3 waits for fork 4. In the reversed order, philosopher 4 takes fork 4 last, after fork 0. So whenever philosopher 4 holds fork 4, it already holds fork 0 too: it has both forks, it is eating, and it will put them down. Philosopher 3's wait for fork 4 therefore always ends, and that link can never be part of a ring that lasts forever. This is the same gap as above, seen from the other side. Both come from one change: philosopher 4 asks for fork 0 before fork 4. That is why the loser of fork 0 holds nothing, and why philosopher 4 never sits on fork 4 while it waits.

**The book's timing, replayed with the fix.** The book's broken run has everyone reach for a first fork at the same time. Here is that timing again with the fix in place. The line numbers are Figure 31.16's.

1. Philosophers 0, 1, 2 and 3 take their left forks, forks 0, 1, 2 and 3 (line 6).
2. Philosopher 4 asks for its right fork first, fork 0 (line 3). Philosopher 0 holds it, so philosopher 4 waits, holding nothing.
3. Philosopher 0 asks for fork 1 (line 7) and waits, because philosopher 1 holds it. Philosophers 1 and 2 wait for forks 2 and 3 the same way.
4. Philosopher 3 asks for fork 4 (line 7). Nobody holds it, because philosopher 4 never took it. Philosopher 3 takes it and eats.
5. Philosopher 3 puts its forks down (put_forks(), lines 7 and 8 of Figure 31.15). Fork 3 goes to philosopher 2, who now has forks 2 and 3 and eats. Nobody is waiting for fork 4.
6. Philosopher 2 puts its forks down, and fork 2 goes to philosopher 1, who eats. Then philosopher 1's fork 1 goes to philosopher 0, who eats.
7. Philosopher 0 puts its forks down. Fork 0 goes to philosopher 4, its first fork. Philosopher 4 then asks for fork 4 (line 4), which is free, and eats.

<!-- anim:philosophers:start -->
Step through both tabs yourself: the same timing, first with everyone taking the left fork first, then with philosopher 4 taking fork 0 first.

<div class="anim" data-anim="philosophers" markdown="0"></div>
<!-- anim:philosophers:end -->


In the first tab of the animation, the chain of waits goes from philosopher 0 round to philosopher 4 and back to philosopher 0, and nobody can move. In the second tab the same chain, 0 to 1 to 2 to 3, ends at fork 4, which nobody holds. A chain that ends at a free fork unwinds from that end, one philosopher at a time. That is the rule of W10 [Section 3.4](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-1/#sec-3-4) for locks: with no cycle, the walk of waits stops at a lock nobody holds, and the thread there goes on.

**The name for it.** The first W10 class lists four conditions that a deadlock needs, all at once (W10 [Section 3.5](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-1/#sec-3-5) and [Section 3.6](https://annie983284450-1.github.io/NNU-CS3430-selfstudyguide/w10/class-1/#sec-3-6)): mutual exclusion (one owner per fork), hold-and-wait (a philosopher keeps its first fork while it waits for the second), no preemption (nobody takes a fork away), and circular wait (the ring). The reversed order removes only the last one; the other three still hold.

**A simpler way to see the fix.** With it, every philosopher takes its lower-numbered fork first: philosophers 0 to 3 take fork p before fork p + 1, and philosopher 4 takes fork 0 before fork 4. A fixed order rules out a ring. A waiting philosopher holds a lower-numbered fork and waits for a higher-numbered one, so going round a ring of waits the fork numbers would have to keep rising and still come back to where they started, and they cannot. OSTEP section 32.3 makes this a rule for locks. Its most straightforward form is "a total ordering on lock acquisition": every lock in one order. In bigger systems, it says, "total lock ordering may be difficult to achieve (and perhaps is unnecessary anyhow)", and "a partial ordering can be a useful way to structure lock acquisition": an order is fixed for each group of locks that are taken together, not one order for every lock. The book's real example of partial ordering is Linux's memory mapping code, whose comment at the top lists "ten different groups of lock acquisition orders", such as "i_mutex before i_mmap_rwsem".

## Five reading habits {#habits}

Most of these questions were cleared up by reading the book's own example closely. Five habits help with the rest of the book.

1. **Read a sentence with the one before it and the one after it.** "This concurrent counter is simple and works correctly" points back to Figure 29.2 (F2).
2. **Read a trace table row by row, and notice who is running.** Figure 30.9 has at most one running thread per row, so it can be read as the one-CPU case (Q20).
3. **Keep track of which version of an example a sentence is about.** Section 30.2 starts with one slot and ends with MAX slots, and its checks change with it: `count == 1` becomes `count == MAX`. Q20's trace is about the one-slot version.
4. **Read a warning together with its exceptions.** The warning "you probably have a bug" comes with "(but you don't think it should need to)" and "in cases like the memory allocator above" (Q21).
5. **When the book says "convince yourself", trace the bad case.** Set up the state the fix is supposed to prevent, here every philosopher holding one fork, and find the step that can no longer happen (Q22).
