# Step 2. Steal a whole list when yours is empty

## 2.1 Why this step

The question: what does a CPU do when its share runs out?

[Step 1](step-1.md) gave every CPU a private list and broke `test2`: a CPU whose list is
empty gives up while other lists are full. The fix is the same one the
scheduler uses for run queues in Week 7: when my queue is empty, take work
from another CPU's queue. Here, when my list is empty, take pages from
another CPU's list. That is the only time one CPU touches another CPU's lock.

The picture: your drawer is empty, so you take the whole tray out of a
colleague's drawer and put it in yours. One grab, and you are good for a long
time. Taking the coins out one at a time, with your hand in their drawer the
whole time, would keep them waiting far longer.

## 2.2 The picture

```
   CPU 2 calls kalloc(), kmem[2] is empty.
   It looks at kmem[0], kmem[1], kmem[3], ... and takes the first list that is not empty.

      before                                   after (one pointer swap)

   kmem[0].freelist --> a -> b -> c -> d      kmem[0].freelist --> (nothing)      n = 0
   kmem[2].freelist --> (nothing)             kmem[2].freelist --> b -> c -> d    n = 3
                                              r = a   (the page kalloc returns)

   Both locks are held during the swap: kmem[0].lock and kmem[2].lock,
   lower number first.  Nothing walks the list.  Nobody else sees a moment
   where a, b, c, d belong to no list at all.
```

Why "whole list, two locks" and not something gentler. We measured. On a
12-core desktop and on an 8-core desktop, the lab's `test4` counts how many
times CPUs spun on a `kmem` lock while three CPUs allocate one page at a time
and a fourth CPU grabs and releases all of memory in a loop. The spin counter
goes up once per failed attempt, so a CPU that waits a long time for one lock
adds many counts. A version that walked 64 pages under the victim's lock
scored 50,000 to 85,000 spins (the limit is 30,000). Walking 1024 pages
scored 250,000 to 340,000. Walking half the list scored up to 1,000,000. This
version, which holds the victim's lock for a pointer swap, scored 389 on all
cores and 1,111 pinned to 2 cores with hyperthreading. Lock hold time is what
the test punishes, not how often the lock is taken.

Two locks at once needs one rule. If CPU 0 took `kmem[0].lock` and then
wanted `kmem[1].lock`, while CPU 1 took `kmem[1].lock` and then wanted
`kmem[0].lock`, both would wait forever: a deadlock. The rule here: always
take the lower-numbered lock first. Then two CPUs stealing from each other
both reach for the same lock first, and one of them simply waits its turn.
(OSTEP chapter 32 calls this lock ordering. This is your
first use of it.)

## 2.3 Procedure

Two edits in `kernel/kalloc.c`, both in code you wrote in [Step 1](step-1.md).

**Edit 1: one field in the structure.** After `int n;` (line 27 after Step
1), add the steal counter, so the structure reads:

```c
struct {
  struct spinlock lock;
  struct run *freelist;
  int n;                      // how many pages are on freelist right now
  int nsteal;                 // how many pages this CPU has stolen from others
} kmem[NCPU];
```

**Edit 2: the slow path in `kalloc()`.** In `kalloc()`, the fast path ends
with `release(&kmem[c].lock);` (line 103 now, after Edit 1 added a line
above it), then one empty line, then `pop_off();` (line 105). Put the steal
loop between that empty line and `pop_off();`, so the order becomes:
`release`, empty line, the loop, `pop_off()`. Fill the two blanks (which lock
goes first).

```c
  // Slow path: this CPU is out of pages.  Steal another CPU's *whole* list by
  // swapping one pointer.  Two things keep lock contention low:
  //  1. The victim's lock is held for only a few instructions (no walking the
  //     list), so anyone else who wants that lock barely waits.
  //  2. We hold our own lock at the same time, so the pages move from the
  //     victim's list to ours in one step and are never "in flight" where no
  //     list owns them.  Always take the lower-numbered lock first, so two CPUs
  //     stealing from each other at the same moment cannot deadlock.
  if(r == 0){
    for(int i = 0; i < NCPU && r == 0; i++){
      if(i == c)
        continue;
      if(i < c){
        acquire(&kmem[________].lock);
        acquire(&kmem[c].lock);
      } else {
        acquire(&kmem[c].lock);
        acquire(&kmem[________].lock);
      }
      r = kmem[i].freelist;
      if(r){
        // Our list is empty (nothing is added to it while we run with
        // interrupts off), so the victim's list simply becomes ours.
        kmem[c].freelist = r->next;
        kmem[c].n = kmem[i].n - 1;
        kmem[c].nsteal += kmem[i].n;
        kmem[i].freelist = 0;
        kmem[i].n = 0;
      }
      release(&kmem[i].lock);
      release(&kmem[c].lock);
    }
  }
```

Why "our list is empty" is safe to assume: interrupts are off on this CPU
(`push_off` at the top of `kalloc`), so nothing else runs on CPU `c`, and
`kfree` on another CPU only ever pushes to that other CPU's own list. The
only thing anyone else can do to `kmem[c]` is steal from it, which makes it
emptier, not fuller.

Then rebuild and run both tests.

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ kalloctest
$ usertests sbrkmuch
```

## 2.4 You should see

`kalloctest`, group A (8-core desktop, all CPUs):

```
$ kalloctest
start test1
test1 results:
--- lock kmem stats
lock: kmem: #test-and-set 0 #acquire() 5427
lock: kmem: #test-and-set 0 #acquire() 118350
lock: kmem: #test-and-set 0 #acquire() 142395
lock: kmem: #test-and-set 0 #acquire() 134158
--- top 5 contended locks:
lock: virtio_disk: #test-and-set 111051 #acquire() 180
lock: proc: #test-and-set 98947 #acquire() 674238
lock: proc: #test-and-set 94040 #acquire() 674240
lock: proc: #test-and-set 21904 #acquire() 274104
lock: proc: #test-and-set 21417 #acquire() 274104
tot= 0
test1 OK
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
lock: kmem: #test-and-set 208 #acquire() 457897
lock: kmem: #test-and-set 2176 #acquire() 658942
lock: kmem: #test-and-set 26 #acquire() 746354
lock: kmem: #test-and-set 0 #acquire() 1025725
lock: kmem: #test-and-set 0 #acquire() 1019
lock: kmem: #test-and-set 0 #acquire() 1018
lock: kmem: #test-and-set 0 #acquire() 1017
lock: kmem: #test-and-set 0 #acquire() 1016
--- top 5 contended locks:
lock: wait_lock: #test-and-set 57955083 #acquire() 40028
lock: proc: #test-and-set 455990 #acquire() 2043180
lock: proc: #test-and-set 332342 #acquire() 2501244
lock: virtio_disk: #test-and-set 111051 #acquire() 180
lock: proc: #test-and-set 85859 #acquire() 1173020
tot= 2410

test4 OK
```

All four `OK`. In the `test4` block, the four `kmem` lines with large
`#acquire()` counts are the four running CPUs; the four with about 1,000
are lists 4 to 7, touched only when they were stolen from. `tot= 2410`
against a limit of 30,000; the starter's `test4` on the same machine spent
277,147 (`n - m` in the [Step 0](step-0.md) capture). Your spin counts will differ.

!!! theory "Connect to theory: per-CPU queues need work stealing"

    **What the theory says.** With one queue per CPU, one queue can run dry while another
    is still full: load imbalance. The fix is migration, and work stealing decides when:
    a queue that is low takes work from a fuller one. Looking at other queues too often
    brings back the very contention the split removed
    ([Week 7, Section 3.6](../../w07/class-1.md#sec-3-6)).

    **What this run showed.** After Step 2, `test2` allocated all 32,463 free pages and said
    `OK`. After `test4`, `tot=` was 2,410, and that total counts every failed swap since
    boot. The starter's `test4` alone, on the same machine, had 277,147.

    **Why the run confirms the theory.** A free list per CPU is a run queue per CPU, with
    pages in place of jobs. An empty list is an idle queue, and the steal is the migration.
    Because a CPU steals only when its own list is empty, and then holds the other CPU's
    lock just long enough to swap a pointer, the lists rarely meet: correctness came back
    without bringing the contention back.

The same on a group C machine (a 2-core cloud machine):

```
$ kalloctest
start test1
test1 results:
--- lock kmem stats
lock: kmem: #test-and-set 0 #acquire() 94648
lock: kmem: #test-and-set 0 #acquire() 117659
lock: kmem: #test-and-set 0 #acquire() 97802
lock: kmem: #test-and-set 0 #acquire() 90221
--- top 5 contended locks:
lock: proc: #test-and-set 12165479 #acquire() 599806
lock: proc: #test-and-set 11830439 #acquire() 599828
lock: proc: #test-and-set 3857141 #acquire() 199438
lock: proc: #test-and-set 3626392 #acquire() 199437
lock: proc: #test-and-set 3069932 #acquire() 199438
tot= 0
test1 OK
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
lock: kmem: #test-and-set 449780 #acquire() 710516
lock: kmem: #test-and-set 4852 #acquire() 700968
lock: kmem: #test-and-set 116973 #acquire() 728510
lock: kmem: #test-and-set 0 #acquire() 1111110
lock: kmem: #test-and-set 0 #acquire() 1023
lock: kmem: #test-and-set 0 #acquire() 1022
lock: kmem: #test-and-set 0 #acquire() 1021
lock: kmem: #test-and-set 0 #acquire() 1020
--- top 5 contended locks:
lock: proc: #test-and-set 48640713 #acquire() 2357085
lock: proc: #test-and-set 32711994 #acquire() 1665082
lock: proc: #test-and-set 21185866 #acquire() 1329862
lock: proc: #test-and-set 17872870 #acquire() 794740
lock: proc: #test-and-set 17328458 #acquire() 794740
tot= 571605
test4 FAIL m 455050 n 571605
```

`test1` to `test3` pass everywhere. `test4` on 2 plain cores can land on
either side of the 30,000 limit: this run failed with `n - m` = 116,555, and
another run of the same code on the same box passed ([Step 3](step-3.md)'s capture). Four
virtual CPUs on two real cores take turns, and a CPU that is paused by the
host while holding a `kmem` lock makes the others spin for the whole pause.
Group B (2 cores + hyperthreading) passed `test4` in every run we made.

Then `usertests sbrkmuch`:

```
$ usertests sbrkmuch
usertests starting
test sbrkmuch: OK
ALL TESTS PASSED
```

`sbrkmuch` grows one process by a large amount and shrinks it again, which is
thousands of `kalloc` and `kfree` calls across the steal path. `ALL TESTS
PASSED` is the line you want. Quit with Ctrl-a then x.

??? success "2.5a The answer: the two blanks"

    Both are `i`: `acquire(&kmem[i].lock)` in the `i < c` branch comes first, and
    in the `else` branch (where `c < i`) it comes second.

??? success "2.5b The answer: the structure after Step 2 (lines 21 to 29 of `kernel/kalloc.c`)"

    ```c linenums="21"
    // One free list per CPU, each guarded by its own lock, to remove the single
    // global lock that all CPUs used to contend on.  When a CPU's list is empty it
    // "steals" from another CPU's list.
    struct {
      struct spinlock lock;
      struct run *freelist;
      int n;                      // how many pages are on freelist right now
      int nsteal;                 // how many pages this CPU has stolen from others
    } kmem[NCPU];
    ```

??? success "2.5c The answer: `kalloc()` after Step 2 (lines 85 to 143; the new lines are 105 to 137)"

    ```c linenums="85" hl_lines="21-53"
    // Allocate one 4096-byte page of physical memory.
    // Returns a pointer that the kernel can use.
    // Returns 0 if the memory cannot be allocated.
    void *
    kalloc(void)
    {
      struct run *r;

      push_off();
      int c = cpuid();

      // Fast path: take a page from this CPU's own free list.
      acquire(&kmem[c].lock);
      r = kmem[c].freelist;
      if(r){
        kmem[c].freelist = r->next;
        kmem[c].n--;
      }
      release(&kmem[c].lock);

      // Slow path: this CPU is out of pages.  Steal another CPU's *whole* list by
      // swapping one pointer.  Two things keep lock contention low:
      //  1. The victim's lock is held for only a few instructions (no walking the
      //     list), so anyone else who wants that lock barely waits.
      //  2. We hold our own lock at the same time, so the pages move from the
      //     victim's list to ours in one step and are never "in flight" where no
      //     list owns them.  Always take the lower-numbered lock first, so two CPUs
      //     stealing from each other at the same moment cannot deadlock.
      if(r == 0){
        for(int i = 0; i < NCPU && r == 0; i++){
          if(i == c)
            continue;
          if(i < c){
            acquire(&kmem[i].lock);
            acquire(&kmem[c].lock);
          } else {
            acquire(&kmem[c].lock);
            acquire(&kmem[i].lock);
          }
          r = kmem[i].freelist;
          if(r){
            // Our list is empty (nothing is added to it while we run with
            // interrupts off), so the victim's list simply becomes ours.
            kmem[c].freelist = r->next;
            kmem[c].n = kmem[i].n - 1;
            kmem[c].nsteal += kmem[i].n;
            kmem[i].freelist = 0;
            kmem[i].n = 0;
          }
          release(&kmem[i].lock);
          release(&kmem[c].lock);
        }
      }
      pop_off();

      if(r)
        memset((char*)r, 5, PGSIZE); // fill with junk
      return (void*)r;
    }
    ```

??? success "2.5d Reading the answer"

    - Line 113. We only get here when the fast path found nothing. `r` is 0.
    - Line 114. Visit every list, mine excepted, and stop as soon as `r` is set.
      The loop runs over `NCPU` (8), not 4: lists 4 to 7 hold half of memory.
    - Lines 117 to 123. Take both locks, the lower-numbered one first. In the
      `i < c` branch the victim's lock is the lower one; in the `else` branch
      mine is. Every CPU follows the same rule, so no two CPUs can ever hold one
      lock each and wait for the other's.
    - Line 124. The victim's head pointer. If it is 0 the list is empty and we
      release and move on (lines 134 and 135 still run).
    - Lines 128 to 132, the swap. My head becomes the victim's second page (the
      first one, `r`, is the page I am about to return), my count becomes theirs
      minus one, my steal counter grows by every page that moved, and the victim
      is left with nothing. Five stores, no loop, no walk down the list. That is
      the whole trick.
    - Lines 134 and 135. Both locks go back. The order of two releases does not
      matter for deadlock; only the order of acquires does.
    - Line 138 onwards is unchanged from [Step 1](step-1.md): interrupts back on, fill the
      page, return it. If every list was empty, `r` is still 0 and `kalloc`
      returns 0, exactly as the starter did when it ran out.

!!! question "Think"

    Suppose the two `acquire` lines in the `i < c` branch were swapped, so every
    CPU took its own lock first and the victim's second. Describe, CPU by CPU, a
    sequence of events in which two CPUs wait forever. Then say which test on this
    page would show it, and how it would show it.

    Answer it in your own words before you read on. The answer is not printed here.
