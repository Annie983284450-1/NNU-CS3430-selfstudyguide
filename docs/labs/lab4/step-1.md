# Step 1. One free list per CPU

## 1.1 Why this step

The question: how do you split one shared structure into four?

The starter keeps every free page on one linked list, `kmem.freelist`, behind
one lock, `kmem.lock`. All four CPUs push to it in `kfree` and pop from it in
`kalloc`. Week 9's answer to a contended counter was to keep one counter per
CPU and merge rarely. Here the "counter" is a list of pages: give each CPU its
own list and its own lock, and a CPU allocating a page normally touches only
its own lock, which nobody else wants.

The picture: four cashiers, four drawers. Each cashier uses only their own
drawer, so nobody waits. (What happens when one drawer is empty is [Step 2](step-2.md).)

## 1.2 The picture

```
   BEFORE (starter)                        AFTER (Step 1)

   CPU0 --+                                CPU0 --> kmem[0]  lock  freelist --> p -> p -> p
   CPU1 --+--> kmem.lock --> freelist      CPU1 --> kmem[1]  lock  freelist --> p -> p
   CPU2 --+        ^                       CPU2 --> kmem[2]  lock  freelist --> p -> p -> p -> p
   CPU3 --+   all four wait here           CPU3 --> kmem[3]  lock  freelist --> p
                                                    kmem[4..7]: filled at boot, no CPU runs there

   kfree(pa):  push pa on the list of the CPU I am running on
   kalloc():   pop from the list of the CPU I am running on
```

`NCPU` is 8 in `kernel/param.h`, so there are eight lists, and `freerange`
deals the boot-time pages round-robin to all eight. QEMU runs four CPUs, so
lists 4 to 7 are filled once and never popped by their "owner". That is on
purpose: it guarantees [Step 2](step-2.md)'s stealing has something to find, and [Step 3](step-3.md)
counts it.

Two details that matter. First, "the CPU I am running on" is `cpuid()`, and
it is only a stable answer while interrupts are off: a timer interrupt (Week
2) can move the process to another CPU between reading the id and using it.
So every use of `cpuid()` sits between `push_off()` and `pop_off()`, which are
xv6's nestable interrupt-off and interrupt-on. Second, the grader looks for
locks whose name starts with `kmem`. Naming all eight `"kmem"` is fine.

## 1.3 Procedure

Open `kernel/kalloc.c`. Lines 1 to 16 (the comment, the six `#include`s, the
`freerange` prototype and `extern char end[]`) stay. Everything from line 17
(`struct run {`) to the end of the file (line 82) is replaced. Three parts.

**Part A: the structure, `kinit`, `freerange` (replaces lines 17 to 40).**
Fill the two blanks.

```c
struct run {
  struct run *next;
};

// One free list per CPU, each guarded by its own lock, to remove the single
// global lock that all CPUs used to contend on.  When a CPU's list is empty it
// "steals" from another CPU's list.
struct {
  struct spinlock lock;
  struct run *freelist;
  int n;                      // how many pages are on freelist right now
} kmem[________];

void
kinit()
{
  for(int i = 0; i < NCPU; i++)
    initlock(&kmem[i].lock, "kmem");   // all lock names start with "kmem"
  freerange(end, (void*)PHYSTOP);
}

void
freerange(void *pa_start, void *pa_end)
{
  // Spread the initial free memory round-robin across the per-CPU lists so no
  // single CPU owns everything at boot -- otherwise every other CPU would have
  // to steal from that one list and contend heavily on its lock.  This runs on
  // one CPU before the others start, so no locking is needed.
  char *p = (char*)PGROUNDUP((uint64)pa_start);
  int cpu = 0;
  for(; p + PGSIZE <= (char*)pa_end; p += PGSIZE){
    memset(p, 1, PGSIZE);              // catch dangling refs, like kfree
    struct run *r = (struct run*)p;
    r->next = kmem[cpu].freelist;
    kmem[cpu].freelist = r;
    kmem[cpu].n++;
    cpu = (cpu + 1) % ________;
  }
}
```

`freerange` no longer calls `kfree`: `kfree` would put every page on the list
of the boot CPU, and then CPUs 1 to 3 would start with nothing. `n` is a count
of pages on the list; [Step 2](step-2.md) needs it. It is kept under the same lock as the
list, so it is always exact.

**Part B: `kfree` (replaces lines 42 to 63).** Fill the blank.

```c
// Free the page of physical memory pointed at by pa, which normally should
// have been returned by a call to kalloc().  (The exception is when
// initializing the allocator; see kinit above.)  The page goes onto the
// freelist of the CPU that is running kfree.
void
kfree(void *pa)
{
  struct run *r;

  if(((uint64)pa % PGSIZE) != 0 || (char*)pa < end || (uint64)pa >= PHYSTOP)
    panic("kfree");

  // Fill with junk to catch dangling refs.
  memset(pa, 1, PGSIZE);

  r = (struct run*)pa;

  push_off();                 // cpuid() is only stable with interrupts off
  int c = ________;
  acquire(&kmem[c].lock);
  r->next = kmem[c].freelist;
  kmem[c].freelist = r;
  kmem[c].n++;
  release(&kmem[c].lock);
  pop_off();
}
```

**Part C: `kalloc` (replaces lines 65 to 82).** Only the fast path for now:
pop from my own list, and if it is empty return 0. [Step 2](step-2.md) adds the slow path.

```c
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

  pop_off();

  if(r)
    memset((char*)r, 5, PGSIZE); // fill with junk
  return (void*)r;
}
```

Then rebuild and run.

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ kalloctest
```

## 1.4 You should see

```
$ kalloctest
start test1
test1 results:
--- lock kmem stats
lock: kmem: #test-and-set 0 #acquire() 96341
lock: kmem: #test-and-set 0 #acquire() 91670
lock: kmem: #test-and-set 0 #acquire() 121534
lock: kmem: #test-and-set 0 #acquire() 90785
--- top 5 contended locks:
lock: proc: #test-and-set 10097977 #acquire() 614543
lock: proc: #test-and-set 9523209 #acquire() 614547
lock: proc: #test-and-set 3139747 #acquire() 214179
lock: proc: #test-and-set 2628111 #acquire() 214181
lock: proc: #test-and-set 2227975 #acquire() 214181
tot= 0
test1 OK
start test2
total free number of pages: 12161 (out of 32768)
test2 FAILED: cannot allocate memory
```

(Group C capture. Your `#acquire()` counts differ; what matters is
`#test-and-set 0` on every `kmem` line and `tot= 0`. There are now four
`kmem` lines, one per running CPU; the `proc` lines are other locks the test
happens to touch and are not graded.)

`test1 OK`: the spin count on the `kmem` locks went from the starter's number
to zero, because the three children run on three CPUs and each one pushes
and pops its own list. `test2 FAILED: cannot allocate memory`, and
`kalloctest` stops there (on your screen the next `$` prompt sits at the end
of that line, `memory$ `, because the message has no newline; that is the
prompt, and you can type at it): `test2` asks one process to allocate every free
page in the machine, and that process runs on one CPU, whose list holds
about one eighth of memory. When that list is empty, `kalloc` returns 0 even
though the other lists are full. (`usertests sbrkmuch` fails the same way at
this point, `enough phys mem?`.) That is what [Step 2](step-2.md) fixes. Quit with Ctrl-a
then x.

!!! theory "Connect to theory: split what is shared, lock each part"

    **What the theory says.** When every CPU wants one lock, the fix is to cut the shared
    thing into parts, give each part its own lock, and pick the part by something the
    thread already has, such as its CPU number
    ([Week 9, Sections 2.3](../../w09/class-1.md#sec-2-3) and
    [2.13](../../w09/class-1.md#sec-2-13)).

    **What this run showed.** After Step 1, every `kmem` line says `#test-and-set 0`,
    `tot= 0`, and `test1 OK`.

    **Why the run confirms the theory.** `cpuid()` picks the part, so three children on
    three CPUs each take only their own lock, and nobody waits: zero failed swaps, where
    the starter had thousands or millions.

??? success "1.5a The answer: the three blanks"

    `kmem[NCPU]`, `cpu = (cpu + 1) % NCPU`, and `int c = cpuid();`.

??? success "1.5b The answer: `kernel/kalloc.c` after Step 1, from `struct run` to the end (lines 17 to 109)"

    ```c linenums="17"
    struct run {
      struct run *next;
    };

    // One free list per CPU, each guarded by its own lock, to remove the single
    // global lock that all CPUs used to contend on.  When a CPU's list is empty it
    // "steals" from another CPU's list.
    struct {
      struct spinlock lock;
      struct run *freelist;
      int n;                      // how many pages are on freelist right now
    } kmem[NCPU];

    void
    kinit()
    {
      for(int i = 0; i < NCPU; i++)
        initlock(&kmem[i].lock, "kmem");   // all lock names start with "kmem"
      freerange(end, (void*)PHYSTOP);
    }

    void
    freerange(void *pa_start, void *pa_end)
    {
      // Spread the initial free memory round-robin across the per-CPU lists so no
      // single CPU owns everything at boot -- otherwise every other CPU would have
      // to steal from that one list and contend heavily on its lock.  This runs on
      // one CPU before the others start, so no locking is needed.
      char *p = (char*)PGROUNDUP((uint64)pa_start);
      int cpu = 0;
      for(; p + PGSIZE <= (char*)pa_end; p += PGSIZE){
        memset(p, 1, PGSIZE);              // catch dangling refs, like kfree
        struct run *r = (struct run*)p;
        r->next = kmem[cpu].freelist;
        kmem[cpu].freelist = r;
        kmem[cpu].n++;
        cpu = (cpu + 1) % NCPU;
      }
    }

    // Free the page of physical memory pointed at by pa, which normally should
    // have been returned by a call to kalloc().  (The exception is when
    // initializing the allocator; see kinit above.)  The page goes onto the
    // freelist of the CPU that is running kfree.
    void
    kfree(void *pa)
    {
      struct run *r;

      if(((uint64)pa % PGSIZE) != 0 || (char*)pa < end || (uint64)pa >= PHYSTOP)
        panic("kfree");

      // Fill with junk to catch dangling refs.
      memset(pa, 1, PGSIZE);

      r = (struct run*)pa;

      push_off();                 // cpuid() is only stable with interrupts off
      int c = cpuid();
      acquire(&kmem[c].lock);
      r->next = kmem[c].freelist;
      kmem[c].freelist = r;
      kmem[c].n++;
      release(&kmem[c].lock);
      pop_off();
    }

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

      pop_off();

      if(r)
        memset((char*)r, 5, PGSIZE); // fill with junk
      return (void*)r;
    }
    ```

??? success "1.5c Reading the answer"

    - Lines 24 to 28, the structure. Three fields per CPU: the lock, the list
      head, and `n`. It is one anonymous `struct` type with `NCPU` copies, so
      `kmem[3].lock` is CPU 3's lock and nothing else. `n` is only ever read or
      written with that CPU's lock held, so it never disagrees with the list.
    - Lines 31 to 36, `kinit`. A loop initializes all eight locks before any
      page is touched. The locks all get the name `"kmem"` because the grader
      adds up the spins of every lock whose name starts with those four letters.
      `freerange` runs after the locks exist, even though it does not take them.
    - Lines 39 to 55, `freerange`. `PGROUNDUP` moves the start up to the first
      page boundary after the kernel. Each page is filled with the byte 1 (so a
      use-after-free shows up as garbage, the same trick `kfree` uses), turned
      into a `struct run` by casting its own first bytes, and pushed on list
      `cpu`; then `cpu` moves on, wrapping at `NCPU`. No lock is taken because
      `main()` calls `kinit` on CPU 0 before it starts the other CPUs, so nobody
      else can be running.
    - Lines 62 to 82, `kfree`. The first `if` rejects a pointer that is not page
      aligned, is inside the kernel's own image, or is past the end of RAM.
      `push_off()` comes before `cpuid()`, never after: between the two a timer
      interrupt could move this process to another CPU and `c` would name the
      wrong list. Then take my lock, push, count, release, and `pop_off()` last.
    - Lines 88 to 109, `kalloc`. The mirror image: pop from my list under my
      lock. The `memset` that fills the page with 5s happens after `release`,
      on purpose: filling 4096 bytes is slow, and nothing about it needs the
      lock, so holding the lock across it would make every other CPU that wants
      this list wait for no reason. [Step 2](step-2.md) is built on exactly that idea.

!!! question "Think"

    After Step 1, `test1` passes and `test2` fails. Explain, from the code, why a
    CPU can run out of pages while most of memory is free. Then explain why
    `kfree` still puts a page on the list of the CPU that is running, and not back
    on the list the page originally came from.

    Answer it in your own words before you read on. The answer is not printed here.
