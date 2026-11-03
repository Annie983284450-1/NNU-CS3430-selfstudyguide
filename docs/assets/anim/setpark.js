// The wakeup/waiting race of OSTEP 28.14, and setpark(), step by step: Figure 28.9's lock() and unlock() with the
// book's line numbers (13 to 35), one CPU, T1 holding the lock and T2 calling lock(). The steps are those of the W09
// Q&A (Q9) and of W08 Section 6.4; the without/with pair follows the book's last paragraphs of 28.14.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  var L = [
    [13, "void lock(lock_t *m) {"],
    [14, "    while (TestAndSet(&m->guard, 1) == 1)"],
    [15, "        ; //acquire guard lock by spinning"],
    [16, "    if (m->flag == 0) {"],
    [17, "        m->flag = 1; // lock is acquired"],
    [18, "        m->guard = 0;"],
    [19, "    } else {"],
    [20, "        queue_add(m->q, gettid());"],
    [21, "        m->guard = 0;"],
    [22, "        park();"],
    [23, "    }"],
    [24, "}"],
    [25, ""],
    [26, "void unlock(lock_t *m) {"],
    [27, "    while (TestAndSet(&m->guard, 1) == 1)"],
    [28, "        ; //acquire guard lock by spinning"],
    [29, "    if (queue_empty(m->q))"],
    [30, "        m->flag = 0; // let go of lock; no one wants it"],
    [31, "    else"],
    [32, "        unpark(queue_remove(m->q)); // hold lock"],
    [33, "                                    // (for next thread!)"],
    [34, "    m->guard = 0;"],
    [35, "}"]
  ];
  var code = L.map(function (x) { return { n: x[0], text: x[1] }; });
  // with setpark(): one new line between 20 and 21 (Solaris), numbered "+" and given n = 20.5
  var code2 = [];
  code.forEach(function (c) {
    code2.push(c);
    if (c.n === 20) code2.push({ n: 20.5, text: "        setpark();   // new: about to park", added: true });
  });

  function T(kind, text) { return { kind: kind, text: text }; }
  var start = {
    label: "Start",
    text: "One CPU. T1 holds the lock (flag = 1) and is inside its critical section. T2 now calls lock() on the same lock.",
    cpu: "T2", at: [{ who: "T2", line: 13 }],
    state: { flag: 1, guard: 0, q: [] },
    threads: { T1: T("ready", "holds the lock; inside its critical section; waiting for the CPU"), T2: T("run", "calls lock()") }
  };
  var s1 = {
    label: "Step 1",
    text: "T2 takes the guard (line 14). The guard is the tiny spin lock that protects the flag and the queue.",
    cpu: "T2", at: [{ who: "T2", line: 14 }],
    state: { flag: 1, guard: 1, q: [] },
    threads: { T1: T("ready", "holds the lock; waiting for the CPU"), T2: T("run", "holds the guard") }
  };
  var s2 = {
    label: "Step 2",
    text: "The flag is 1, so the lock is held (line 16). T2 writes its own id on the queue (line 20).",
    cpu: "T2", at: [{ who: "T2", line: 20 }],
    state: { flag: 1, guard: 1, q: ["T2"] },
    threads: { T1: T("ready", "holds the lock; waiting for the CPU"), T2: T("run", "on the queue; holds the guard") }
  };

  var without = [start, s1, s2, {
    label: "Step 3",
    text: "T2 lets go of the guard (line 21). T2 has decided to sleep, but it is still awake: it has not reached park() on line 22. Right now the timer interrupt arrives, and the OS switches to T1.",
    cpu: "T2", switching: "timer interrupt: switch to T1", at: [{ who: "T2", line: 21 }],
    state: { flag: 1, guard: 0, q: ["T2"] },
    threads: { T1: T("ready", "holds the lock; about to get the CPU"), T2: T("gap", "decided to sleep, still awake: between line 21 and line 22") },
    event: "The gap: T2 is on the queue, but not asleep yet.", eventKind: "warn"
  }, {
    label: "Step 4",
    text: "T1 finishes its critical section and calls unlock(). It takes the guard (line 27).",
    cpu: "T1", at: [{ who: "T1", line: 27 }, { who: "T2", line: 22 }],
    state: { flag: 1, guard: 1, q: ["T2"] },
    threads: { T1: T("run", "in unlock(); holds the guard"), T2: T("gap", "still awake, waiting for the CPU, about to run line 22") }
  }, {
    label: "Step 5",
    text: "The queue is not empty (line 29), so T1 removes T2 and calls unpark(T2) (line 32). T2 is not asleep, so the unpark does nothing and leaves no trace. The flag stays 1, because the lock now belongs to T2.",
    cpu: "T1", at: [{ who: "T1", line: 32 }, { who: "T2", line: 22 }],
    state: { flag: 1, guard: 1, q: [] },
    threads: { T1: T("run", "has handed the lock to T2"), T2: T("gap", "owns the lock now, but is still awake") },
    event: "unpark(T2) knocks, but T2 is not in bed yet: the wake-up is lost.", eventKind: "bad"
  }, {
    label: "Step 6",
    text: "T1 lets go of the guard (line 34) and carries on with other work. Later, the OS switches back to T2.",
    cpu: "T1", switching: "later: switch to T2", at: [{ who: "T1", line: 34 }, { who: "T2", line: 22 }],
    state: { flag: 1, guard: 0, q: [] },
    threads: { T1: T("run", "done with the lock"), T2: T("gap", "owns the lock; about to run line 22") }
  }, {
    label: "Step 7",
    text: "T2 runs line 22, park(), and falls asleep. The lock is held (flag = 1) and its owner is T2, who is asleep. The queue is empty, so no future unlock() will ever wake T2, and every later caller of lock() joins the queue and sleeps too. The wake-up came in step 5, before the sleep in step 7, and was lost: the wakeup/waiting race.",
    cpu: "T2", at: [{ who: "T2", line: 22 }],
    state: { flag: 1, guard: 0, q: [] },
    threads: { T1: T("ready", "runs on, never needs the lock again"), T2: T("dead", "asleep forever, holding the lock") },
    event: "Stuck: the lock's owner sleeps, and nobody is left to wake it.", eventKind: "bad"
  }];

  var withSP = [start, s1, s2, {
    label: "Step 2a",
    text: "New line: T2 calls setpark() before it lets go of the guard. It tells the system “I am about to park”.",
    cpu: "T2", at: [{ who: "T2", line: 20.5 }],
    state: { flag: 1, guard: 1, q: ["T2"] },
    threads: { T1: T("ready", "holds the lock; waiting for the CPU"), T2: T("run", "on the queue; has said it is about to park") },
    event: "setpark(): from now on, an unpark that arrives before park() is remembered.", eventKind: "good"
  }, {
    label: "Step 3",
    text: "T2 lets go of the guard (line 21). The same bad timing as before: the timer interrupt arrives, and the OS switches to T1.",
    cpu: "T2", switching: "timer interrupt: switch to T1", at: [{ who: "T2", line: 21 }],
    state: { flag: 1, guard: 0, q: ["T2"] },
    threads: { T1: T("ready", "about to get the CPU"), T2: T("gap", "still awake, between line 21 and line 22") }
  }, {
    label: "Step 4",
    text: "T1 calls unlock() and takes the guard (line 27).",
    cpu: "T1", at: [{ who: "T1", line: 27 }, { who: "T2", line: 22 }],
    state: { flag: 1, guard: 1, q: ["T2"] },
    threads: { T1: T("run", "in unlock(); holds the guard"), T2: T("gap", "still awake, about to run line 22") }
  }, {
    label: "Step 5",
    text: "T1 removes T2 and calls unpark(T2) (line 32). T2 is still awake, as before, but this time the system records the wake-up, because T2 called setpark().",
    cpu: "T1", at: [{ who: "T1", line: 32 }, { who: "T2", line: 22 }],
    state: { flag: 1, guard: 1, q: [] },
    threads: { T1: T("run", "has handed the lock to T2"), T2: T("gap", "owns the lock; a wake-up is waiting for it") },
    event: "unpark(T2) arrives early, and is remembered.", eventKind: "good"
  }, {
    label: "Step 6",
    text: "T1 lets go of the guard (line 34) and carries on. Later, the OS switches back to T2.",
    cpu: "T1", switching: "later: switch to T2", at: [{ who: "T1", line: 34 }, { who: "T2", line: 22 }],
    state: { flag: 1, guard: 0, q: [] },
    threads: { T1: T("run", "done with the lock"), T2: T("gap", "owns the lock; a wake-up is waiting") }
  }, {
    label: "Step 7",
    text: "T2 runs line 22, park(). The recorded wake-up is there, so park() returns at once instead of sleeping. T2 leaves lock() as the owner and enters its critical section. Nothing was lost.",
    cpu: "T2", at: [{ who: "T2", line: 24 }],
    state: { flag: 1, guard: 0, q: [] },
    threads: { T1: T("ready", "runs on"), T2: T("run", "owns the lock; inside its critical section") },
    event: "park() returns immediately: the race is closed.", eventKind: "good"
  }];
  withSP.forEach(function (s) { s.code = code2; });

  window.OS_ANIMS.setpark = {
    title: "The lost wake-up, step by step (Figure 28.9, one CPU)",
    interval: 4200,
    fields: [
      { key: "flag", label: "flag (the lock)" },
      { key: "guard", label: "guard" },
      { key: "q", label: "queue of sleepers" }
    ],
    threads: ["T1", "T2"],
    code: code,
    variants: [
      { key: "without", label: "Without setpark()", steps: without },
      { key: "with", label: "With setpark()", steps: withSP, code: code2 }
    ]
  };
})();
