// Two locks on one flag, step by step (W08 class 2).
// Tab 1 is the trace of Section 4.3: the flag lock of flaglock.c (lines 1 to 15, OSTEP Figure 28.1), one CPU, the test
// on line 8 and the set on line 10 as two steps, and the two interrupts of the page's table, so both threads go in.
// Tab 2 is the swap-by-swap check of Section 5.2 on the test-and-set lock of Section 5.1 (OSTEP Figure 28.3): T1's swap
// gets 0, T2's swaps get 1, unlock stores 0 (line 16), and T2's next swap gets the 0.
// The picture: the lock's flag cell on top, T1 on the left and T2 on the right, the critical section below. A test is a
// dashed arrow (a read), a set a solid arrow (a write), and TestAndSet one arrow with a head at both ends (read and write
// in one step). A thread inside the critical section has its chip in the region.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  function lines(arr) { return arr.map(function (x) { return { n: x[0], text: x[1] }; }); }

  var codeFlag = lines([
    [1, "#include <stdio.h>"],
    [2, "#include <pthread.h>"],
    [3, ""],
    [4, "static volatile int counter = 0;   // shared by both threads"],
    [5, "static volatile int flag = 0;      // 0: lock is free,"],
    [null, "                                   // 1: lock is held"],
    [6, ""],
    [7, "void lock(void) {"],
    [8, "    while (flag == 1)              // TEST the flag"],
    [9, "        ;                          // spin-wait (do nothing)"],
    [10, "    flag = 1;                      // now SET it"],
    [11, "}"],
    [12, ""],
    [13, "void unlock(void) {"],
    [14, "    flag = 0;"],
    [15, "}"]
  ]);
  var codeTAS = [{ n: null, text: "// what the instruction does (Section 5.1)" }].concat(lines([
    [1, "int TestAndSet(int *old_ptr, int new) {"],
    [2, "    int old = *old_ptr; // fetch old value at old_ptr"],
    [3, "    *old_ptr = new;     // store 'new' into old_ptr"],
    [4, "    return old;         // return the old value"],
    [5, "}"]
  ]), [{ n: null, text: "" }, { n: null, text: "// the lock built on it (OSTEP Figure 28.3)" }], lines([
    [1, "typedef struct __lock_t {"],
    [2, "    int flag;"],
    [3, "} lock_t;"],
    [4, ""],
    [5, "void init(lock_t *lock) {"],
    [6, "    // 0: lock is available, 1: lock is held"],
    [7, "    lock->flag = 0;"],
    [8, "}"],
    [9, ""],
    [10, "void lock(lock_t *lock) {"],
    [11, "    while (TestAndSet(&lock->flag, 1) == 1)"],
    [12, "        ; // spin-wait (do nothing)"],
    [13, "}"],
    [14, ""],
    [15, "void unlock(lock_t *lock) {"],
    [16, "    lock->flag = 0;"],
    [17, "}"]
  ]));

  // thread kinds: out (not in lock() yet), gap (passed the test, has not set), spin (looping), in (inside), bad (inside,
  // together with the other thread). state: flag, cs (threads inside the critical section).
  // acts: {from, op: "test" | "set" | "tas", label, kind: "ok" | "bad"}
  function T(kind, text) { return { kind: kind, text: text }; }

  var flagSteps = [{
    label: "Start",
    text: "The flag starts at 0: the lock is free. One CPU; thread 1 runs and calls lock().",
    cpu: "T1", at: [{ who: "T1", line: 7 }],
    state: { flag: 0, cs: [] },
    threads: { T1: T("out", "calls lock()"), T2: T("out", "waits for the CPU") }, acts: []
  }, {
    label: "Step 1, test",
    text: "Thread 1 tests the flag (line 8). It is 0, so thread 1 falls out of the loop. It has not written the 1 yet.",
    cpu: "T1", at: [{ who: "T1", line: 8 }],
    state: { flag: 0, cs: [] },
    threads: { T1: T("gap", "passed the test"), T2: T("out", "waits for the CPU") },
    acts: [{ from: "T1", op: "test", label: "line 8: test, reads 0" }]
  }, {
    label: "Step 1, interrupt",
    text: "At this instant the flag still says 0, and the scheduler takes the CPU away. Thread 1 is one store short of owning the lock.",
    cpu: "T2", switching: "interrupt: switch to Thread 2", at: [{ who: "T1", line: 10 }],
    state: { flag: 0, cs: [] },
    threads: { T1: T("gap", "passed the test, has not set the flag"), T2: T("out", "about to call lock()") }, acts: [],
    event: "The gap: between the test and the set, the flag still says free.", eventKind: "warn"
  }, {
    label: "Step 2, test",
    text: "Thread 2 calls lock() and tests the flag (line 8). It sees 0, because thread 1 never wrote its 1, so it falls out of the loop.",
    cpu: "T2", at: [{ who: "T1", line: 10 }, { who: "T2", line: 8 }],
    state: { flag: 0, cs: [] },
    threads: { T1: T("gap", "passed the test, has not set the flag"), T2: T("gap", "passed the test") },
    acts: [{ from: "T2", op: "test", label: "line 8: test, reads 0" }]
  }, {
    label: "Step 2, set",
    text: "Thread 2 writes 1 (line 10) and goes in.",
    cpu: "T2", at: [{ who: "T1", line: 10 }, { who: "T2", line: 10 }],
    state: { flag: 1, cs: ["T2"] },
    threads: { T1: T("gap", "passed the test, has not set the flag"), T2: T("in", "inside the critical section") },
    acts: [{ from: "T2", op: "set", label: "line 10: flag = 1" }]
  }, {
    label: "Step 2, interrupt",
    text: "Another interrupt, and the scheduler switches back to thread 1. Thread 1 resumes right after its test.",
    cpu: "T1", switching: "interrupt: switch to Thread 1", at: [{ who: "T1", line: 10 }],
    state: { flag: 1, cs: ["T2"] },
    threads: { T1: T("gap", "resumes after its test"), T2: T("in", "inside the critical section") }, acts: []
  }, {
    label: "Step 2, set again",
    text: "Thread 1 writes its own 1 (line 10) and goes in as well. Two threads are inside the critical section.",
    cpu: "T1", at: [{ who: "T1", line: 10 }],
    state: { flag: 1, cs: ["T2", "T1"] },
    threads: { T1: T("bad", "inside the critical section"), T2: T("bad", "inside the critical section") },
    acts: [{ from: "T1", op: "set", label: "line 10: flag = 1", kind: "bad" }],
    event: "No mutual exclusion. The kept runs of flaglock end at 11935314, 12601011 and 13109611, all short of 20,000,000.", eventKind: "bad"
  }];

  var tasSteps = [{
    label: "Start",
    text: "Two threads call lock() on a free lock at about the same time. The flag is 0, and each pass of their loop is a single swap.",
    at: [{ who: "T1", line: 10 }, { who: "T2", line: 10 }],
    state: { flag: 0, cs: [] },
    threads: { T1: T("out", "calls lock()"), T2: T("out", "calls lock()") }, acts: []
  }, {
    label: "Step 1, T1 swaps",
    text: "Thread 1 swaps first (line 11). It gets back the 0 and leaves a 1 behind, so its loop ends and it goes in.",
    at: [{ who: "T1", line: 11 }, { who: "T2", line: 10 }],
    state: { flag: 1, cs: ["T1"] },
    threads: { T1: T("in", "got 0: inside"), T2: T("out", "about to swap") },
    acts: [{ from: "T1", op: "tas", label: "line 11: gets 0, leaves 1", kind: "ok" }],
    event: "One step reads the 0 and writes the 1: nobody can slip in between.", eventKind: "good"
  }, {
    label: "Step 1, T2 swaps",
    text: "Thread 2 swaps next (line 11). It gets back the 1 that thread 1 left, which means taken, so it loops.",
    at: [{ who: "T1", line: 11 }, { who: "T2", line: 11 }],
    state: { flag: 1, cs: ["T1"] },
    threads: { T1: T("in", "inside the critical section"), T2: T("spin", "got 1: loops") },
    acts: [{ from: "T2", op: "tas", label: "line 11: gets 1, leaves 1" }],
    event: "Only the first swap gets the 0.", eventKind: "good"
  }, {
    label: "Step 1, T2 again",
    text: "Thread 2 swaps again and gets a 1 again. It keeps swapping and getting a 1 for as long as thread 1 is inside.",
    at: [{ who: "T1", line: 11 }, { who: "T2", line: 11 }],
    state: { flag: 1, cs: ["T1"] },
    threads: { T1: T("in", "inside the critical section"), T2: T("spin", "got 1 again: spins") },
    acts: [{ from: "T2", op: "tas", label: "line 11: gets 1, leaves 1" }]
  }, {
    label: "Step 2, unlock",
    text: "Thread 1 leaves its critical section and unlocks (line 16), a plain store of 0. Unlock does not choose the next owner, and it tells nobody.",
    at: [{ who: "T1", line: 16 }, { who: "T2", line: 11 }],
    state: { flag: 0, cs: [] },
    threads: { T1: T("out", "out of the critical section"), T2: T("spin", "still swapping") },
    acts: [{ from: "T1", op: "set", label: "line 16: lock->flag = 0" }]
  }, {
    label: "Step 2, T2 gets in",
    text: "Thread 2's very next swap picks up that 0 and puts a 1 back. Thread 2 is inside, and the flag says held again.",
    at: [{ who: "T1", line: 16 }, { who: "T2", line: 11 }],
    state: { flag: 1, cs: ["T2"] },
    threads: { T1: T("out", "out of the critical section"), T2: T("in", "got 0: inside") },
    acts: [{ from: "T2", op: "tas", label: "line 11: gets 0, leaves 1", kind: "ok" }],
    event: "In every order, exactly one thread gets the 0.", eventKind: "good"
  }];

  // ---- the scene
  var KIND = { ok: "#2a7a6b", bad: "#b23a48" }, MUTED = "var(--md-default-fg-color--light)";
  var P = { T1: [64, 176], T2: [296, 176] };
  var FLAG = { x: 110, y: 38, w: 140, h: 50 };       // the flag cell
  var CS = { x: 122, y: 236, w: 116, h: 66 };        // the critical section region

  function head(x, y, fromx, fromy, color) {         // an arrowhead at (x, y), pointing away from (fromx, fromy)
    var ang = Math.atan2(y - fromy, x - fromx), a = 9;
    return '<polyline points="' + (x + a * Math.cos(ang + 2.6)) + ',' + (y + a * Math.sin(ang + 2.6)) + ' ' + x + ',' + y + ' ' +
      (x + a * Math.cos(ang - 2.6)) + ',' + (y + a * Math.sin(ang - 2.6)) + '" class="anim-head" style="fill:none;stroke:' + color + ';stroke-width:2.4;stroke-linejoin:round"/>';
  }

  function scene(s, H, ctx) {
    var c = ctx.col, st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    var tas = ctx.variant === "tas";
    // the lock with its flag
    var changed = pv.flag !== st.flag;
    out.push(H.box(70, 6, 220, 94, { r: 12, stroke: "var(--md-default-fg-color--light)", sw: 1.8 }));
    out.push(H.text(82, 26, tas ? "lock (lock_t)" : "the lock", { size: 13, weight: 700, anchor: "start" }));
    out.push(H.text(278, 26, "0: free, 1: held", { size: 10.5, anchor: "end", color: MUTED }));
    out.push(H.box(FLAG.x, FLAG.y, FLAG.w, FLAG.h, { r: 8, fill: changed ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: changed ? "#e8b23a" : "transparent", sw: 1.6, cls: changed ? "anim-new" : "" }));
    out.push(H.text(FLAG.x + 10, FLAG.y + 30, tas ? "lock->flag" : "flag", { size: 11.5, anchor: "start", color: MUTED, mono: true }));
    out.push(H.text(FLAG.x + FLAG.w - 14, FLAG.y + 35, String(st.flag), { size: 24, weight: 700, anchor: "end", mono: true }));

    // the critical section
    var bad = st.cs.length > 1;
    out.push(H.box(CS.x, CS.y, CS.w, CS.h, { r: 10, dash: true, sw: 1.6, stroke: bad ? KIND.bad : "var(--md-default-fg-color--light)", fill: bad ? "rgba(178,58,72,.12)" : st.cs.length ? "rgba(42,122,107,.08)" : "var(--md-default-bg-color)" }));
    out.push(H.text(CS.x + CS.w / 2, CS.y + 18, "critical section", { size: 11, weight: 700, color: bad ? KIND.bad : MUTED }));
    st.cs.forEach(function (t, i) {
      var x = st.cs.length === 1 ? CS.x + CS.w / 2 : CS.x + 34 + i * 48;
      out.push(H.chip(x, CS.y + 44, t, c(t), { cls: pv.cs.indexOf(t) < 0 ? "anim-pop" : "" }));
    });
    if (!st.cs.length) out.push(H.text(CS.x + CS.w / 2, CS.y + 48, "empty", { size: 11, italic: true, color: MUTED }));
    if (bad) out.push(H.text(CS.x + CS.w / 2, CS.y + CS.h + 18, "two threads inside", { size: 12, weight: 700, color: KIND.bad, cls: "anim-pop" }));

    // the threads
    ["T1", "T2"].forEach(function (t) {
      var p = P[t], th = s.threads[t], k = th.kind, col = c(t), on = s.cpu === t;
      var fill = k === "in" ? "rgba(42,122,107,.14)" : (k === "gap" || k === "spin") ? "rgba(232,178,58,.24)" : k === "bad" ? "rgba(178,58,72,.18)" : "var(--md-default-bg-color)";
      out.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="30" style="fill:' + fill + ';stroke:' + col + ';stroke-width:' + (on ? 3.2 : 1.8) + '"' + ((k === "gap" || k === "spin") ? ' stroke-dasharray="6 4" class="anim-pulse"' : '') + '/>');
      out.push(H.text(p[0], p[1] + (on ? 2 : 6), t, { size: 17, weight: 700, color: col }));
      if (on) out.push(H.text(p[0], p[1] + 19, "on the CPU", { size: 9, weight: 700, color: col, cls: ctx.prev && ctx.prev.cpu !== s.cpu ? "anim-pop" : "" }));
      var words = th.text.split(" "), rows = [], r = "";
      words.forEach(function (w) { if ((r + " " + w).trim().length > 17) { rows.push(r.trim()); r = w; } else r += " " + w; });
      if (r.trim()) rows.push(r.trim());
      out.push(H.lines(p[0], p[1] + 46, rows, { size: 11, lh: 14 }));
    });

    if (s.switching) out.push(H.text(180, 336, "⚡ " + s.switching, { size: 12, weight: 700, color: "#a0632a", cls: "anim-pop" }));

    // the action of this step
    (s.acts || []).forEach(function (a) {
      var left = a.from === "T1", p = P[a.from];
      var color = KIND[a.kind] || c(a.from);
      var x1 = p[0] + (left ? 20 : -20), y1 = p[1] - 23;
      var x2 = left ? FLAG.x + 22 : FLAG.x + FLAG.w - 22, y2 = FLAG.y + FLAG.h + 2;
      var lpos = [left ? 98 : 262, 128];
      var bend = [left ? -10 : 10, -6];
      if (a.op === "test") {        // a read: the value goes from the flag to the thread
        out.push(H.arrow(x2, y2, x1, y1, { color: color, dash: true, bend: [-bend[0], bend[1]], label: a.label, mono: true, lpos: lpos, sw: 2.2 }));
      } else if (a.op === "set") {  // a write: from the thread to the flag
        out.push(H.arrow(x1, y1, x2, y2, { color: color, bend: bend, label: a.label, mono: true, lpos: lpos, sw: 2.4 }));
      } else {                      // TestAndSet: read and write in one step, one arrow with two heads
        var g = H.arrow(x1, y1, x2, y2, { color: color, bend: bend, label: a.label, mono: true, lpos: lpos, sw: 2.6 });
        var cx = (x1 + x2) / 2 + bend[0], cy = (y1 + y2) / 2 + bend[1];
        out.push(g.replace(/<\/g>$/, head(x1, y1, cx, cy, color) + '</g>'));
      }
      if (a.op === "set" && a.kind === "bad") out.push(H.mark(FLAG.x + FLAG.w + 16, FLAG.y + 34, false));
    });
    return out.join("");
  }

  window.OS_ANIMS.spinlock = {
    title: "Test and set: two steps break, one step works",
    interval: 4200,
    threads: ["T1", "T2"],
    colors: { T1: "#1f6f8b", T2: "#b5651d" },
    sceneBox: "0 0 360 346",
    scene: scene,
    code: codeFlag,
    codeTitle: "flaglock.c, lines 1 to 15 (OSTEP Figure 28.1)",
    variants: [
      { key: "flag", label: "Flag with load and store (breaks)", steps: flagSteps },
      { key: "tas", label: "Test-and-set (works)", steps: tasSteps, code: codeTAS,
        codeTitle: "Test-and-set and the lock built on it (Section 5.1)" }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
