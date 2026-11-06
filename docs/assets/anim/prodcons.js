// Producers and consumers on a one-slot buffer with condition variables, W09 class 2, Sections 4.3 to 4.6.
// Tab 1 follows the trace table of Section 4.4 (OSTEP Figure 30.9), steps 1 to 12, with pc_if.c lines 26 to 48.
// Tab 2 follows the four moments of Section 4.5 (OSTEP Figures 30.10 and 30.11): pc_onecv.c is pc_if.c with the two
// ifs made whiles, so the line numbers are pc_if.c's. Tab 3 replays the same moments with Section 4.6's code
// (pc.c lines 31 to 51, two condition variables) and MAX = 1, the one-slot size that Section 4.8 runs (./pc 1).
// The picture: the shared buffer on top (mutex, count, the condition variable queues), Tp below on the left, Tc1 and
// Tc2 on the right; each step's action is an arrow from the acting thread to the field it touches, and a signal is an
// arrow from the queue to the thread it wakes.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  function mk(rows) { return rows.map(function (x) { return { n: x[0], text: x[1] }; }); }
  var codeIf = mk([
    [26, "void *producer(void *arg) {"],
    [27, "    for (int i = 0; i < 2 * LOOPS; i++) {"],
    [28, "        pthread_mutex_lock(&mutex);              // p1"],
    [29, "        if (count == 1)                          // p2"],
    [30, "            pthread_cond_wait(&cond, &mutex);    // p3"],
    [31, "        put(i);                                  // p4"],
    [32, "        pthread_cond_signal(&cond);              // p5"],
    [33, "        pthread_mutex_unlock(&mutex);            // p6"],
    [34, "    }"],
    [35, "    return NULL;"],
    [36, "}"],
    [37, ""],
    [38, "void *consumer(void *arg) {"],
    [39, "    for (int i = 0; i < LOOPS; i++) {"],
    [40, "        pthread_mutex_lock(&mutex);              // c1"],
    [41, "        if (count == 0)                          // c2"],
    [42, "            pthread_cond_wait(&cond, &mutex);    // c3"],
    [43, "        get();                                   // c4"],
    [44, "        pthread_cond_signal(&cond);              // c5"],
    [45, "        pthread_mutex_unlock(&mutex);            // c6"],
    [46, "    }"],
    [47, "    return NULL;"],
    [48, "}"]
  ]);
  // pc_onecv.c: the same file with the two ifs made whiles (Section 4.5 shows only the two changed lines)
  var codeWhile = codeIf.map(function (c) {
    if (c.n === 29) return { n: 29, text: "        while (count == 1)                       // p2" };
    if (c.n === 41) return { n: 41, text: "        while (count == 0)                       // c2" };
    return c;
  });
  var codeTwo = mk([
    [31, "void *producer(void *arg) {"],
    [32, "    int base = (int)(long)arg * ITEMS;"],
    [33, "    for (int i = 0; i < ITEMS; i++) {"],
    [34, "        pthread_mutex_lock(&mutex);              // p1"],
    [35, "        while (count == MAX)                     // p2"],
    [36, "            pthread_cond_wait(&empty, &mutex);   // p3"],
    [37, "        put(base + i);                           // p4"],
    [38, "        pthread_cond_signal(&fill);              // p5"],
    [39, "        pthread_mutex_unlock(&mutex);            // p6"],
    [40, "    }"],
    [41, "    return NULL;"],
    [42, "}"],
    [43, ""],
    [44, "void *consumer(void *arg) {"],
    [45, "    for (int i = 0; i < ITEMS; i++) {"],
    [46, "        pthread_mutex_lock(&mutex);              // c1"],
    [47, "        while (count == 0)                       // c2"],
    [48, "            pthread_cond_wait(&fill, &mutex);    // c3"],
    [49, "        int tmp = get();                         // c4"],
    [50, "        pthread_cond_signal(&empty);             // c5"],
    [51, "        pthread_mutex_unlock(&mutex);            // c6"]
  ]);

  function T(kind, text) { return { kind: kind, text: text }; }
  // a step: state = { mutex: holder or null, count, q: { cond: [...] } or { empty: [...], fill: [...] } }
  // thread kinds: run (acting now), ready, sleep, idle (between steps), off (not started), bad
  function S(o) { return o; }

  // ---------------- Tab 1: Section 4.4's trace, steps 1 to 12 ----------------
  var A = [];
  A.push(S({ label: "Start",
    text: "One producer, Tp, and two consumers, Tc1 and Tc2, share the one slot, which starts empty (count = 0). They share one lock, mutex, and one condition variable, cond.",
    at: [], actor: null,
    state: { mutex: null, count: 0, q: { cond: [] } },
    threads: { Tp: T("idle", "about to run"), Tc1: T("idle", "about to run"), Tc2: T("ready", "ready, waiting for the CPU") },
    acts: [] }));
  A.push(S({ label: "Step 1",
    text: "Tc1 locks the mutex (c1). The count is 0, so it must wait (c2).",
    at: [{ who: "Tc1", line: 41 }], actor: "Tc1",
    state: { mutex: "Tc1", count: 0, q: { cond: [] } },
    threads: { Tp: T("idle", "about to run"), Tc1: T("run", "holds the lock, must wait"), Tc2: T("ready", "ready, waiting for the CPU") },
    acts: [{ from: "Tc1", to: "mutex", label: "c1: lock" }, { from: "Tc1", to: "count", label: "c2: count == 0? yes" }] }));
  A.push(S({ label: "Step 2",
    text: "Tc1 calls wait() (c3). The wait releases the lock, and Tc1 sleeps on cond.",
    at: [{ who: "Tc1", line: 42 }], actor: "Tc1",
    state: { mutex: null, count: 0, q: { cond: ["Tc1"] } },
    threads: { Tp: T("idle", "about to run"), Tc1: T("sleep", "asleep on cond"), Tc2: T("ready", "ready, waiting for the CPU") },
    acts: [{ from: "Tc1", to: "cond", label: "c3: wait" }] }));
  A.push(S({ label: "Step 3",
    text: "Tp locks the mutex (p1). The count is 0, so Tp does not wait (p2).",
    at: [{ who: "Tp", line: 29 }, { who: "Tc1", line: 42 }], actor: "Tp",
    state: { mutex: "Tp", count: 0, q: { cond: ["Tc1"] } },
    threads: { Tp: T("run", "holds the lock"), Tc1: T("sleep", "asleep on cond"), Tc2: T("ready", "ready, waiting for the CPU") },
    acts: [{ from: "Tp", to: "mutex", label: "p1: lock" }, { from: "Tp", to: "count", label: "p2: count == 1? no" }] }));
  A.push(S({ label: "Step 4",
    text: "Tp calls put() (p4). The slot is full: count = 1.",
    at: [{ who: "Tp", line: 31 }, { who: "Tc1", line: 42 }], actor: "Tp",
    state: { mutex: "Tp", count: 1, q: { cond: ["Tc1"] } },
    threads: { Tp: T("run", "holds the lock"), Tc1: T("sleep", "asleep on cond"), Tc2: T("ready", "ready, waiting for the CPU") },
    acts: [{ from: "Tp", to: "count", label: "p4: put(i)" }] }));
  A.push(S({ label: "Step 5",
    text: "Tp signals cond (p5), and Tc1 moves to ready. Tc1's wait() must take the lock back before it can go on, and Tp still holds it.",
    at: [{ who: "Tp", line: 32 }, { who: "Tc1", line: 42 }], actor: "Tp",
    state: { mutex: "Tp", count: 1, q: { cond: [] } },
    threads: { Tp: T("run", "holds the lock"), Tc1: T("ready", "ready, needs the lock back"), Tc2: T("ready", "ready, waiting for the CPU") },
    acts: [{ from: "Tp", to: "cond", label: "p5: signal" }, { wake: "cond", to: "Tc1", label: "Tc1 to ready" }] }));
  A.push(S({ label: "Step 6",
    text: "Tp unlocks (p6), loops, and locks again (p1) before Tc1 can, because Tp is already running on its CPU. The count is 1, so Tp must wait (p2).",
    at: [{ who: "Tp", line: 29 }, { who: "Tc1", line: 42 }], actor: "Tp",
    state: { mutex: "Tp", count: 1, q: { cond: [] } },
    threads: { Tp: T("run", "locked again, must wait"), Tc1: T("ready", "ready, needs the lock back"), Tc2: T("ready", "ready, waiting for the CPU") },
    acts: [{ from: "Tp", to: "mutex", label: "p6, p1: unlock, lock" }, { from: "Tp", to: "count", label: "p2: count == 1? yes" }] }));
  A.push(S({ label: "Step 7",
    text: "Tp calls wait() (p3): it releases the lock and sleeps. The slot holds one item, Tc1 is ready and believes there is an item for it, and nobody holds the lock.",
    at: [{ who: "Tp", line: 30 }, { who: "Tc1", line: 42 }], actor: "Tp",
    state: { mutex: null, count: 1, q: { cond: ["Tp"] } },
    threads: { Tp: T("sleep", "asleep on cond"), Tc1: T("ready", "ready, needs the lock back"), Tc2: T("ready", "ready, waiting for the CPU") },
    acts: [{ from: "Tp", to: "cond", label: "p3: wait" }],
    event: "After step 7: Tp asleep on cond, Tc1 ready, the slot full. Who gets the lock next is up to the scheduler.", eventKind: "warn" }));
  A.push(S({ label: "Step 8",
    text: "Tc2 has been ready since the start, and now the scheduler runs it, before Tc1. It locks (c1). The count is 1, so it does not wait (c2).",
    at: [{ who: "Tp", line: 30 }, { who: "Tc1", line: 42 }, { who: "Tc2", line: 41 }], actor: "Tc2",
    state: { mutex: "Tc2", count: 1, q: { cond: ["Tp"] } },
    threads: { Tp: T("sleep", "asleep on cond"), Tc1: T("ready", "ready, needs the lock back"), Tc2: T("run", "holds the lock") },
    acts: [{ from: "Tc2", to: "mutex", label: "c1: lock" }, { from: "Tc2", to: "count", label: "c2: count == 0? no" }] }));
  A.push(S({ label: "Step 9",
    text: "Tc2 calls get() (c4) and takes the item. The slot is empty: count = 0.",
    at: [{ who: "Tp", line: 30 }, { who: "Tc1", line: 42 }, { who: "Tc2", line: 43 }], actor: "Tc2",
    state: { mutex: "Tc2", count: 0, q: { cond: ["Tp"] } },
    threads: { Tp: T("sleep", "asleep on cond"), Tc1: T("ready", "ready, still expects an item"), Tc2: T("run", "took the item") },
    acts: [{ from: "Tc2", to: "count", label: "c4: get()" }],
    event: "Tc2 takes the item between the signal and Tc1 running.", eventKind: "warn" }));
  A.push(S({ label: "Step 10",
    text: "Tc2 signals cond (c5), and Tp moves to ready.",
    at: [{ who: "Tp", line: 30 }, { who: "Tc1", line: 42 }, { who: "Tc2", line: 44 }], actor: "Tc2",
    state: { mutex: "Tc2", count: 0, q: { cond: [] } },
    threads: { Tp: T("ready", "ready, needs the lock back"), Tc1: T("ready", "ready, still expects an item"), Tc2: T("run", "holds the lock") },
    acts: [{ from: "Tc2", to: "cond", label: "c5: signal" }, { wake: "cond", to: "Tp", label: "Tp to ready" }] }));
  A.push(S({ label: "Step 11",
    text: "Tc2 unlocks (c6). Nobody holds the lock, and the slot is empty.",
    at: [{ who: "Tp", line: 30 }, { who: "Tc1", line: 42 }, { who: "Tc2", line: 45 }], actor: "Tc2",
    state: { mutex: null, count: 0, q: { cond: [] } },
    threads: { Tp: T("ready", "ready, needs the lock back"), Tc1: T("ready", "ready, still expects an item"), Tc2: T("idle", "done with its item") },
    acts: [{ from: "Tc2", to: "mutex", label: "c6: unlock" }] }));
  A.push(S({ label: "Step 12",
    text: "Tc1 takes the lock back inside wait() and runs at last: get() (c4) on an empty slot. Tc1 checked count once, before it slept, with an if, and Tc2 took the item in between.",
    at: [{ who: "Tp", line: 30 }, { who: "Tc1", line: 43 }], actor: "Tc1",
    state: { mutex: "Tc1", count: 0, q: { cond: [] }, fail: true },
    threads: { Tp: T("ready", "ready, needs the lock back"), Tc1: T("bad", "get() on an empty slot"), Tc2: T("idle", "done with its item") },
    acts: [{ from: "Tc1", to: "count", label: "c4: get()", kind: "bad", mark: false }],
    event: "assert(count == 1) in get() fails, and the program stops: exit status 134.", eventKind: "bad" }));

  // ---------------- Tab 2: Section 4.5's four moments, while and one queue ----------------
  var B = [];
  B.push(S({ label: "Moment 1",
    text: "Both consumers are asleep: Tc1 and Tc2 found the slot empty and wait on cond. Tp runs and locks the mutex (p1).",
    at: [{ who: "Tp", line: 28 }, { who: "Tc1", line: 42 }, { who: "Tc2", line: 42 }], actor: "Tp",
    state: { mutex: "Tp", count: 0, q: { cond: ["Tc1", "Tc2"] } },
    threads: { Tp: T("run", "holds the lock"), Tc1: T("sleep", "asleep on cond"), Tc2: T("sleep", "asleep on cond") },
    acts: [{ from: "Tp", to: "mutex", label: "p1: lock" }] }));
  B.push(S({ label: "Moment 2, put",
    text: "The slot is empty, so Tp's while lets it through, and Tp fills the slot (p4): count = 1.",
    at: [{ who: "Tp", line: 31 }, { who: "Tc1", line: 42 }, { who: "Tc2", line: 42 }], actor: "Tp",
    state: { mutex: "Tp", count: 1, q: { cond: ["Tc1", "Tc2"] } },
    threads: { Tp: T("run", "holds the lock"), Tc1: T("sleep", "asleep on cond"), Tc2: T("sleep", "asleep on cond") },
    acts: [{ from: "Tp", to: "count", label: "p4: put(i)" }] }));
  B.push(S({ label: "Moment 2, signal",
    text: "Tp signals cond (p5). One sleeper, Tc1, moves to ready.",
    at: [{ who: "Tp", line: 32 }, { who: "Tc1", line: 42 }, { who: "Tc2", line: 42 }], actor: "Tp",
    state: { mutex: "Tp", count: 1, q: { cond: ["Tc2"] } },
    threads: { Tp: T("run", "holds the lock"), Tc1: T("ready", "ready, needs the lock back"), Tc2: T("sleep", "asleep on cond") },
    acts: [{ from: "Tp", to: "cond", label: "p5: signal" }, { wake: "cond", to: "Tc1", label: "Tc1 to ready" }] }));
  B.push(S({ label: "Moment 2, Tp sleeps",
    text: "Tp loops, finds the slot full (p2), and sleeps on cond too (p3). The wait releases the lock.",
    at: [{ who: "Tp", line: 30 }, { who: "Tc1", line: 42 }, { who: "Tc2", line: 42 }], actor: "Tp",
    state: { mutex: null, count: 1, q: { cond: ["Tc2", "Tp"] } },
    threads: { Tp: T("sleep", "asleep on cond"), Tc1: T("ready", "ready, needs the lock back"), Tc2: T("sleep", "asleep on cond") },
    acts: [{ from: "Tp", to: "cond", label: "p3: wait" }] }));
  B.push(S({ label: "Moment 3, get",
    text: "Tc1 takes the lock back. Its while re-checks count with the lock held and finds 1, so Tc1 takes the item (c4): count = 0.",
    at: [{ who: "Tp", line: 30 }, { who: "Tc1", line: 43 }, { who: "Tc2", line: 42 }], actor: "Tc1",
    state: { mutex: "Tc1", count: 0, q: { cond: ["Tc2", "Tp"] } },
    threads: { Tp: T("sleep", "asleep on cond"), Tc1: T("run", "holds the lock, took the item"), Tc2: T("sleep", "asleep on cond") },
    acts: [{ from: "Tc1", to: "count", label: "c4: get()" }] }));
  B.push(S({ label: "Moment 3, signal",
    text: "Tc1 signals cond (c5). Tp and Tc2 are on the queue, and the signal wakes one sleeper. It may be Tc2, not Tp, and OSTEP Figure 30.11 follows that case.",
    at: [{ who: "Tp", line: 30 }, { who: "Tc1", line: 44 }, { who: "Tc2", line: 42 }], actor: "Tc1",
    state: { mutex: "Tc1", count: 0, q: { cond: ["Tp"] } },
    threads: { Tp: T("sleep", "asleep on cond"), Tc1: T("run", "holds the lock"), Tc2: T("ready", "ready, but the slot is empty") },
    acts: [{ from: "Tc1", to: "cond", label: "c5: signal" }, { wake: "cond", to: "Tc2", label: "Tc2 to ready", kind: "bad" }],
    event: "One queue: the consumer's signal wakes the other consumer, and Tp stays asleep.", eventKind: "warn" }));
  B.push(S({ label: "Moment 3, Tc1 sleeps",
    text: "Tc1 unlocks and loops, finds the slot empty (c2), and sleeps on cond (c3).",
    at: [{ who: "Tp", line: 30 }, { who: "Tc1", line: 42 }, { who: "Tc2", line: 42 }], actor: "Tc1",
    state: { mutex: null, count: 0, q: { cond: ["Tp", "Tc1"] } },
    threads: { Tp: T("sleep", "asleep on cond"), Tc1: T("sleep", "asleep on cond"), Tc2: T("ready", "ready, but the slot is empty") },
    acts: [{ from: "Tc1", to: "cond", label: "c3: wait" }] }));
  B.push(S({ label: "Moment 4, check",
    text: "Tc2 wakes and takes the lock back. It checks with its while and finds the slot empty (c2).",
    at: [{ who: "Tp", line: 30 }, { who: "Tc1", line: 42 }, { who: "Tc2", line: 41 }], actor: "Tc2",
    state: { mutex: "Tc2", count: 0, q: { cond: ["Tp", "Tc1"] } },
    threads: { Tp: T("sleep", "asleep on cond"), Tc1: T("sleep", "asleep on cond"), Tc2: T("run", "holds the lock, slot empty") },
    acts: [{ from: "Tc2", to: "count", label: "c2: count == 0? yes" }] }));
  B.push(S({ label: "Moment 4, all asleep",
    text: "Tc2 sleeps on cond (c3). All three are asleep on cond, and nobody is left to put an item. Forever.",
    at: [{ who: "Tp", line: 30 }, { who: "Tc1", line: 42 }, { who: "Tc2", line: 42 }], actor: "Tc2",
    state: { mutex: null, count: 0, q: { cond: ["Tp", "Tc1", "Tc2"] } },
    threads: { Tp: T("dead", "asleep forever"), Tc1: T("dead", "asleep forever"), Tc2: T("dead", "asleep forever") },
    acts: [{ from: "Tc2", to: "cond", label: "c3: wait", kind: "bad" }],
    event: "cond's queue holds Tp, Tc1 and Tc2. That queue is the whole program.", eventKind: "bad" }));

  // ---------------- Tab 3: Section 4.6's code, the same moments, MAX = 1 ----------------
  var C = [];
  C.push(S({ label: "Start",
    text: "The same three threads with Section 4.6's code, and MAX = 1, one slot. Producers sleep on a queue called empty, consumers on one called fill, and the check stays a while.",
    at: [], actor: null,
    state: { mutex: null, count: 0, q: { empty: [], fill: [] } },
    threads: { Tp: T("idle", "about to run"), Tc1: T("idle", "about to run"), Tc2: T("idle", "about to run") },
    acts: [] }));
  C.push(S({ label: "Moment 1",
    text: "Tc1 and Tc2 found the slot empty and sleep on fill (c3). Tp runs and locks the mutex (p1).",
    at: [{ who: "Tp", line: 34 }, { who: "Tc1", line: 48 }, { who: "Tc2", line: 48 }], actor: "Tp",
    state: { mutex: "Tp", count: 0, q: { empty: [], fill: ["Tc1", "Tc2"] } },
    threads: { Tp: T("run", "holds the lock"), Tc1: T("sleep", "asleep on fill"), Tc2: T("sleep", "asleep on fill") },
    acts: [{ from: "Tp", to: "mutex", label: "p1: lock" }] }));
  C.push(S({ label: "Moment 2, put",
    text: "count is 0, not MAX, so Tp's while lets it through, and Tp puts the item (p4): count = 1.",
    at: [{ who: "Tp", line: 37 }, { who: "Tc1", line: 48 }, { who: "Tc2", line: 48 }], actor: "Tp",
    state: { mutex: "Tp", count: 1, q: { empty: [], fill: ["Tc1", "Tc2"] } },
    threads: { Tp: T("run", "holds the lock"), Tc1: T("sleep", "asleep on fill"), Tc2: T("sleep", "asleep on fill") },
    acts: [{ from: "Tp", to: "count", label: "p4: put(base + i)" }] }));
  C.push(S({ label: "Moment 2, signal",
    text: "Tp signals fill (p5), where only consumers sleep. One sleeper, Tc1, moves to ready.",
    at: [{ who: "Tp", line: 38 }, { who: "Tc1", line: 48 }, { who: "Tc2", line: 48 }], actor: "Tp",
    state: { mutex: "Tp", count: 1, q: { empty: [], fill: ["Tc2"] } },
    threads: { Tp: T("run", "holds the lock"), Tc1: T("ready", "ready, needs the lock back"), Tc2: T("sleep", "asleep on fill") },
    acts: [{ from: "Tp", to: "fill", label: "p5: signal(&fill)" }, { wake: "fill", to: "Tc1", label: "Tc1 to ready" }] }));
  C.push(S({ label: "Moment 2, Tp sleeps",
    text: "Tp loops and finds count == MAX (p2). It sleeps on empty (p3), a queue where only producers ever sleep. The wait releases the lock.",
    at: [{ who: "Tp", line: 36 }, { who: "Tc1", line: 48 }, { who: "Tc2", line: 48 }], actor: "Tp",
    state: { mutex: null, count: 1, q: { empty: ["Tp"], fill: ["Tc2"] } },
    threads: { Tp: T("sleep", "asleep on empty"), Tc1: T("ready", "ready, needs the lock back"), Tc2: T("sleep", "asleep on fill") },
    acts: [{ from: "Tp", to: "empty", label: "p3: wait(&empty)" }] }));
  C.push(S({ label: "Moment 3, get",
    text: "Tc1 takes the lock back. Its while re-checks count and finds 1, so Tc1 takes the item (c4): count = 0.",
    at: [{ who: "Tp", line: 36 }, { who: "Tc1", line: 49 }, { who: "Tc2", line: 48 }], actor: "Tc1",
    state: { mutex: "Tc1", count: 0, q: { empty: ["Tp"], fill: ["Tc2"] } },
    threads: { Tp: T("sleep", "asleep on empty"), Tc1: T("run", "holds the lock, took the item"), Tc2: T("sleep", "asleep on fill") },
    acts: [{ from: "Tc1", to: "count", label: "c4: get()" }] }));
  C.push(S({ label: "Moment 3, signal",
    text: "Tc1 signals empty (c5). Only producers sleep there, so the sleeper it wakes is Tp, never Tc2.",
    at: [{ who: "Tp", line: 36 }, { who: "Tc1", line: 50 }, { who: "Tc2", line: 48 }], actor: "Tc1",
    state: { mutex: "Tc1", count: 0, q: { empty: [], fill: ["Tc2"] } },
    threads: { Tp: T("ready", "ready, needs the lock back"), Tc1: T("run", "holds the lock"), Tc2: T("sleep", "asleep on fill") },
    acts: [{ from: "Tc1", to: "empty", label: "c5: signal(&empty)" }, { wake: "empty", to: "Tp", label: "Tp to ready", kind: "ok" }],
    event: "Two queues: no consumer wakes a consumer.", eventKind: "good" }));
  C.push(S({ label: "Moment 3, Tc1 sleeps",
    text: "Tc1 unlocks and loops, finds the slot empty (c2), and sleeps on fill (c3).",
    at: [{ who: "Tp", line: 36 }, { who: "Tc1", line: 48 }, { who: "Tc2", line: 48 }], actor: "Tc1",
    state: { mutex: null, count: 0, q: { empty: [], fill: ["Tc2", "Tc1"] } },
    threads: { Tp: T("ready", "ready, needs the lock back"), Tc1: T("sleep", "asleep on fill"), Tc2: T("sleep", "asleep on fill") },
    acts: [{ from: "Tc1", to: "fill", label: "c3: wait(&fill)" }] }));
  C.push(S({ label: "Moment 4, check",
    text: "Tp takes the lock back and goes back to the test, not straight to put(). count is 0, not MAX (p2).",
    at: [{ who: "Tp", line: 35 }, { who: "Tc1", line: 48 }, { who: "Tc2", line: 48 }], actor: "Tp",
    state: { mutex: "Tp", count: 0, q: { empty: [], fill: ["Tc2", "Tc1"] } },
    threads: { Tp: T("run", "holds the lock"), Tc1: T("sleep", "asleep on fill"), Tc2: T("sleep", "asleep on fill") },
    acts: [{ from: "Tp", to: "count", label: "p2: count == MAX? no" }] }));
  C.push(S({ label: "Moment 4, put",
    text: "Tp puts the next item (p4): count = 1.",
    at: [{ who: "Tp", line: 37 }, { who: "Tc1", line: 48 }, { who: "Tc2", line: 48 }], actor: "Tp",
    state: { mutex: "Tp", count: 1, q: { empty: [], fill: ["Tc2", "Tc1"] } },
    threads: { Tp: T("run", "holds the lock"), Tc1: T("sleep", "asleep on fill"), Tc2: T("sleep", "asleep on fill") },
    acts: [{ from: "Tp", to: "count", label: "p4: put(base + i)" }] }));
  C.push(S({ label: "Moment 4, signal",
    text: "Tp signals fill (p5), and a consumer wakes. Each side rings only the other side's bell, so the signal always reaches the side that can use it.",
    at: [{ who: "Tp", line: 38 }, { who: "Tc1", line: 48 }, { who: "Tc2", line: 48 }], actor: "Tp",
    state: { mutex: "Tp", count: 1, q: { empty: [], fill: ["Tc1"] } },
    threads: { Tp: T("run", "holds the lock"), Tc1: T("sleep", "asleep on fill"), Tc2: T("ready", "ready, an item is there") },
    acts: [{ from: "Tp", to: "fill", label: "p5: signal(&fill)" }, { wake: "fill", to: "Tc2", label: "Tc2 to ready", kind: "ok" }],
    event: "Producers sleep on empty and signal fill; consumers the reverse.", eventKind: "good" }));

  // ---------------- the scene ----------------
  var KIND = { ok: "#2a7a6b", bad: "#b23a48" };
  var LIGHT = "var(--md-default-fg-color--light)";
  var P = { Tp: [62, 238], Tc1: [204, 238], Tc2: [304, 238] };
  var R = 27, CY = 40, CH = 66, CB = CY + CH;   // thread radius; field top, height, bottom
  function layout(q) {
    if (q.cond) return { mutex: [16, 100], count: [108, 188], cond: [196, 344] };
    return { mutex: [16, 82], count: [88, 150], empty: [156, 248], fill: [254, 344] };
  }
  function wrap(s, n) {
    var rows = [], r = "";
    s.split(" ").forEach(function (w) { if ((r + " " + w).trim().length > n) { rows.push(r.trim()); r = w; } else r += " " + w; });
    if (r.trim()) rows.push(r.trim());
    return rows;
  }
  function scene(s, H, ctx) {
    var c = ctx.col, st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    var CELL = layout(st.q), two = !st.q.cond;
    function cx(n) { return (CELL[n][0] + CELL[n][1]) / 2; }
    function cell(n, title, sub, changed) {
      var x = CELL[n][0], w = CELL[n][1] - CELL[n][0];
      out.push(H.box(x, CY, w, CH, { r: 8, fill: changed ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: changed ? "#e8b23a" : "transparent", sw: 1.6, cls: changed ? "anim-new" : "" }));
      out.push(H.text(x + 7, CY + 15, title, { size: 11, weight: 700, anchor: "start", color: LIGHT, mono: true }));
      if (sub) out.push(H.text(x + 7, CY + 27, sub, { size: 10, anchor: "start", color: LIGHT }));
    }
    // the shared buffer: one struct with its fields
    out.push(H.box(6, 6, 348, 110, { r: 12, stroke: LIGHT, sw: 1.8 }));
    out.push(H.text(16, 27, "the shared buffer", { size: 13.5, weight: 700, anchor: "start" }));
    out.push(H.text(344, 27, two ? "one slot (MAX = 1), two queues" : "one slot, one condition variable", { size: 10.5, anchor: "end", color: LIGHT }));
    // mutex
    cell("mutex", "mutex", null, pv.mutex !== st.mutex);
    if (st.mutex) out.push(H.text(cx("mutex"), CY + 34, "held by", { size: 10, color: LIGHT }) +
                           H.chip(cx("mutex"), CY + 50, st.mutex, c(st.mutex), { cls: pv.mutex !== st.mutex ? "anim-pop" : "" }));
    else out.push(H.text(cx("mutex"), CY + 46, "free", { size: 12, italic: true, color: LIGHT }));
    // count (the slot)
    cell("count", "count", null, pv.count !== st.count);
    if (st.fail) out.push(H.box(CELL.count[0], CY, CELL.count[1] - CELL.count[0], CH, { r: 8, fill: "rgba(178,58,72,.16)", stroke: "#b23a48", sw: 2.2, cls: "anim-pop" }));
    out.push(H.text(CELL.count[0] + 7, CY + 28, st.fail ? "empty!" : st.count ? "full" : "empty", { size: 10.5, anchor: "start", italic: !st.count && !st.fail, color: st.fail ? "#b23a48" : st.count ? "#a0632a" : LIGHT, weight: st.count || st.fail ? 700 : 400 }));
    out.push(H.text(CELL.count[0] + 9, CY + 56, String(st.count), { size: 24, weight: 700, anchor: "start", mono: true, color: st.fail ? "#b23a48" : "var(--md-default-fg-color)" }));
    // the queues
    function queue(n, sub) {
      var a = st.q[n], b = pv.q[n] || [];
      cell(n, n, sub, JSON.stringify(a) !== JSON.stringify(b));
      var x0 = CELL[n][0], w = CELL[n][1] - x0;
      if (!a.length) { out.push(H.text(x0 + w / 2, CY + 52, two ? "nobody" : "nobody asleep", { size: 10.5, italic: true, color: LIGHT })); return; }
      var gap = 38, start = x0 + w / 2 - (a.length - 1) * gap / 2;
      a.forEach(function (t, i) { out.push(H.chip(start + i * gap, CY + 50, t, c(t), { cls: b.indexOf(t) < 0 ? "anim-pop" : "" })); });
    }
    if (two) { queue("empty", "producers"); queue("fill", "consumers"); }
    else queue("cond", "asleep on it");
    // the threads
    out.push(H.text(P.Tp[0], 312, "producer", { size: 10.5, color: LIGHT, italic: true }));
    out.push(H.text((P.Tc1[0] + P.Tc2[0]) / 2, 312, "consumers", { size: 10.5, color: LIGHT, italic: true }));
    ["Tp", "Tc1", "Tc2"].forEach(function (t) {
      var p = P[t], th = s.threads[t], k = th.kind, col = c(t), on = s.actor === t;
      var fill = k === "run" ? "rgba(42,122,107,.12)" : k === "sleep" ? "rgba(120,120,140,.16)" : k === "bad" || k === "dead" ? "rgba(178,58,72,.18)" : k === "ready" ? "rgba(232,178,58,.20)" : "var(--md-default-bg-color)";
      var dash = k === "ready" || k === "off" ? ' stroke-dasharray="6 4"' : "";
      out.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + R + '" style="fill:' + fill + ';stroke:' + col + ';stroke-width:' + (on ? 3.4 : 1.6) + ';opacity:' + (k === "off" ? .45 : 1) + '"' + dash + '/>');
      out.push(H.text(p[0], p[1] + 5, t, { size: 15, weight: 700, color: col }));
      if (k === "sleep" || k === "dead") out.push(H.text(p[0] + R + 4, p[1] - R + 6, "z z", { size: 12, weight: 700, italic: true, color: k === "dead" ? "#b23a48" : LIGHT, anchor: "start" }));
      out.push(H.lines(p[0], p[1] + R + 15, wrap(th.text, 15), { size: 10.5, lh: 12.5, color: k === "off" ? LIGHT : "var(--md-default-fg-color)" }));
    });
    // the action of this step: arrows from the acting thread to the field, and from a queue to the thread it wakes
    var nField = 0, acts = s.acts || [];
    function clampX(x, n) { return Math.max(CELL[n][0] + 14, Math.min(CELL[n][1] - 14, x)); }
    function labX(x, label) { var h = label.length * 3.15 + 6; return Math.max(4 + h, Math.min(356 - h, x)); }
    // a signal into a queue and the wake-up out of it: keep the two arrows apart, and the signal's label off the wake arrow
    var wk = acts.filter(function (a) { return a.wake; })[0], sig = null, qx = null;
    if (wk) {
      sig = acts.filter(function (a) { return !a.wake && a.to === wk.wake; })[0];
      qx = clampX(P[wk.to][0], wk.wake);
      if (sig) {
        var sx0 = clampX(P[sig.from][0], wk.wake);
        if (Math.abs(qx - sx0) < 50) {
          var alt = sx0 + (P[wk.to][0] >= sx0 ? 50 : -50);
          if (alt === clampX(alt, wk.wake)) qx = alt; else sx0 = clampX(qx + (qx > sx0 ? -50 : 50), wk.wake);
        }
        sig.sx = sx0;
      }
    }
    acts.forEach(function (a) {
      var color = KIND[a.kind] || c(a.from || s.actor);
      if (a.wake) {
        var tp = P[a.to], ex = tp[0] + (qx > tp[0] + 20 ? 14 : qx < tp[0] - 20 ? -14 : 0), lab = "wakes: " + a.label;
        out.push(H.arrow(qx, CB + 2, ex, tp[1] - R - 2, { color: color, dash: true, sw: 2.2, label: lab, lpos: [labX((qx + ex) / 2, lab), 186] }));
        return;
      }
      var p = P[a.from], isQ = !!st.q[a.to] || !!(pv.q && pv.q[a.to]);
      var fx = a.sx !== undefined ? a.sx : isQ ? clampX(p[0], a.to) : (CELL[a.to][0] + CELL[a.to][1]) / 2;
      var sx = p[0] + (fx > p[0] + 20 ? 12 : fx < p[0] - 20 ? -12 : 0);
      var ly = nField === 0 ? 134 : 158, hw = a.label.length * 3.15 + 6, lx = labX(fx, a.label);
      if (a === sig) lx = labX(qx > fx ? qx - 8 - hw : qx + 8 + hw, a.label);
      nField++;
      out.push(H.arrow(sx, p[1] - R - 2, fx, CB + 2, { color: color, label: a.label, mono: true, lpos: [lx, ly], sw: 2.4 }));
      if (a.mark !== undefined) out.push(H.mark(lx + hw + 12, ly + 6, a.mark));
    });
    return out.join("");
  }

  window.OS_ANIMS.prodcons = {
    title: "One slot, one producer, two consumers (OSTEP Figures 30.8 to 30.14)",
    interval: 4200,
    threads: ["Tp", "Tc1", "Tc2"],
    colors: { Tp: "#1f6f8b", Tc1: "#b5651d", Tc2: "#6b4fa0" },
    sceneBox: "0 0 360 322",
    scene: scene,
    code: codeIf,
    variants: [
      { key: "if", label: "Attempt 1: one CV and an if", steps: A, code: codeIf, codeTitle: "W09_demos/pc_if.c, lines 26 to 48" },
      { key: "while", label: "Attempt 2: while, one CV", steps: B, code: codeWhile, codeTitle: "W09_demos/pc_onecv.c: pc_if.c with the two ifs made whiles" },
      { key: "two", label: "The fix: two CVs", steps: C, code: codeTwo, codeTitle: "W09_demos/pc.c, lines 31 to 51" }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
