// The wakeup/waiting race of OSTEP 28.14, and setpark(), step by step: Figure 28.9's lock() and unlock() with the
// book's line numbers (13 to 35), one CPU, T1 holding the lock and T2 calling lock(). The steps are those of the W09
// Q&A (Q9) and of W08 Section 6.4; the without/with pair follows the last paragraphs of OSTEP 28.14.
// The picture on the right is one scene: the CPU at the top, the lock m in the middle (flag and owner, guard and its
// holder, the queue), T1 on the left and T2 on the right, and an arrow for what the running thread does at this step.
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
  var code2 = [];
  code.forEach(function (c) {
    code2.push(c);
    if (c.n === 20) code2.push({ n: 20.5, text: "        setpark();   // new: about to park", added: true });
  });

  function T(kind, text) { return { kind: kind, text: text }; }
  // state: flag, owner (who the lock belongs to), guard, guardBy, q (the queue), pending (an unpark remembered)
  // acts: what happens at this step, drawn as arrows: {from, to, label, kind: "ok" | "bad" | "info"}
  var start = {
    label: "Start",
    text: "One CPU. T1 holds the lock (flag = 1) and is inside its critical section. T2 now calls lock() on the same lock.",
    cpu: "T2", at: [{ who: "T2", line: 13 }],
    state: { flag: 1, owner: "T1", guard: 0, guardBy: null, q: [], pending: false },
    threads: { T1: T("ready", "inside its critical section, waiting for the CPU"), T2: T("run", "calls lock()") },
    acts: []
  };
  var s1 = {
    label: "Step 1",
    text: "T2 takes the guard (line 14). The guard is the tiny spin lock that protects the flag and the queue.",
    cpu: "T2", at: [{ who: "T2", line: 14 }],
    state: { flag: 1, owner: "T1", guard: 1, guardBy: "T2", q: [], pending: false },
    threads: { T1: T("ready", "inside its critical section"), T2: T("run", "holds the guard") },
    acts: [{ from: "T2", to: "guard", label: "line 14: TestAndSet", kind: "info" }]
  };
  var s2 = {
    label: "Step 2",
    text: "The flag is 1, so the lock is held (line 16). T2 writes its own id on the queue (line 20).",
    cpu: "T2", at: [{ who: "T2", line: 20 }],
    state: { flag: 1, owner: "T1", guard: 1, guardBy: "T2", q: ["T2"], pending: false },
    threads: { T1: T("ready", "inside its critical section"), T2: T("run", "on the queue, holds the guard") },
    acts: [{ from: "T2", to: "queue", label: "line 20: queue_add", kind: "info" }]
  };

  var without = [start, s1, s2, {
    label: "Step 3",
    text: "T2 lets go of the guard (line 21). T2 has decided to sleep, but it is still awake: it has not reached park() on line 22. Right now the timer interrupt arrives, and the OS switches to T1.",
    cpu: "T2", switching: "timer interrupt: switch to T1", at: [{ who: "T2", line: 21 }],
    state: { flag: 1, owner: "T1", guard: 0, guardBy: null, q: ["T2"], pending: false },
    threads: { T1: T("ready", "about to get the CPU"), T2: T("gap", "decided to sleep, still awake") },
    acts: [{ from: "T2", to: "guard", label: "line 21: guard = 0", kind: "info" }],
    event: "The gap: T2 is on the queue, but not asleep yet.", eventKind: "warn"
  }, {
    label: "Step 4",
    text: "T1 finishes its critical section and calls unlock(). It takes the guard (line 27).",
    cpu: "T1", at: [{ who: "T1", line: 27 }, { who: "T2", line: 22 }],
    state: { flag: 1, owner: "T1", guard: 1, guardBy: "T1", q: ["T2"], pending: false },
    threads: { T1: T("run", "in unlock(), holds the guard"), T2: T("gap", "still awake, about to run line 22") },
    acts: [{ from: "T1", to: "guard", label: "line 27: TestAndSet", kind: "info" }]
  }, {
    label: "Step 5",
    text: "The queue is not empty (line 29), so T1 removes T2 and calls unpark(T2) (line 32). T2 is not asleep, so the unpark does nothing and leaves no trace. The flag stays 1, because the lock now belongs to T2.",
    cpu: "T1", at: [{ who: "T1", line: 32 }, { who: "T2", line: 22 }],
    state: { flag: 1, owner: "T2", guard: 1, guardBy: "T1", q: [], pending: false },
    threads: { T1: T("run", "has handed the lock to T2"), T2: T("gap", "owns the lock, still awake") },
    acts: [{ from: "queue", to: "T1", label: "queue_remove", kind: "info" }, { from: "T1", to: "T2", label: "line 32: unpark(T2)", kind: "bad", mark: false }],
    event: "unpark(T2) knocks, but T2 is not in bed yet: the wake-up is lost.", eventKind: "bad"
  }, {
    label: "Step 6",
    text: "T1 lets go of the guard (line 34) and carries on with other work. Later, the OS switches back to T2.",
    cpu: "T1", switching: "later: switch to T2", at: [{ who: "T1", line: 34 }, { who: "T2", line: 22 }],
    state: { flag: 1, owner: "T2", guard: 0, guardBy: null, q: [], pending: false },
    threads: { T1: T("run", "done with the lock"), T2: T("gap", "owns the lock, about to run line 22") },
    acts: [{ from: "T1", to: "guard", label: "line 34: guard = 0", kind: "info" }]
  }, {
    label: "Step 7",
    text: "T2 runs line 22, park(), and falls asleep. The lock is held (flag = 1) and its owner is T2, who is asleep. The queue is empty, so no future unlock() will ever wake T2, and every later caller of lock() joins the queue and sleeps too. The wake-up came in step 5, before the sleep in step 7, and was lost: the wakeup/waiting race.",
    cpu: "T1", switching: "T2 sleeps, so the CPU goes back to T1", at: [{ who: "T2", line: 22 }],
    state: { flag: 1, owner: "T2", guard: 0, guardBy: null, q: [], pending: false },
    threads: { T1: T("ready", "runs on"), T2: T("dead", "asleep forever, holding the lock") },
    acts: [{ from: "T2", to: "sleep", label: "line 22: park()", kind: "bad" }],
    event: "Stuck: the lock's owner sleeps, and nobody is left to wake it.", eventKind: "bad"
  }];

  var withSP = [start, s1, s2, {
    label: "Step 2a",
    text: "New line: T2 calls setpark() before it lets go of the guard. It tells the system “I am about to park”.",
    cpu: "T2", at: [{ who: "T2", line: 20.5 }],
    state: { flag: 1, owner: "T1", guard: 1, guardBy: "T2", q: ["T2"], pending: false, armed: true },
    threads: { T1: T("ready", "inside its critical section"), T2: T("run", "has said it is about to park") },
    acts: [],
    event: "setpark(): from now on, an unpark that arrives before park() is remembered.", eventKind: "good"
  }, {
    label: "Step 3",
    text: "T2 lets go of the guard (line 21). The same bad timing as before: the timer interrupt arrives, and the OS switches to T1.",
    cpu: "T2", switching: "timer interrupt: switch to T1", at: [{ who: "T2", line: 21 }],
    state: { flag: 1, owner: "T1", guard: 0, guardBy: null, q: ["T2"], pending: false, armed: true },
    threads: { T1: T("ready", "about to get the CPU"), T2: T("gap", "still awake, but has called setpark()") },
    acts: [{ from: "T2", to: "guard", label: "line 21: guard = 0", kind: "info" }]
  }, {
    label: "Step 4",
    text: "T1 calls unlock() and takes the guard (line 27).",
    cpu: "T1", at: [{ who: "T1", line: 27 }, { who: "T2", line: 22 }],
    state: { flag: 1, owner: "T1", guard: 1, guardBy: "T1", q: ["T2"], pending: false, armed: true },
    threads: { T1: T("run", "in unlock(), holds the guard"), T2: T("gap", "still awake, about to run line 22") },
    acts: [{ from: "T1", to: "guard", label: "line 27: TestAndSet", kind: "info" }]
  }, {
    label: "Step 5",
    text: "T1 removes T2 and calls unpark(T2) (line 32). T2 is still awake, as before, but this time the system records the wake-up, because T2 called setpark().",
    cpu: "T1", at: [{ who: "T1", line: 32 }, { who: "T2", line: 22 }],
    state: { flag: 1, owner: "T2", guard: 1, guardBy: "T1", q: [], pending: true, armed: true },
    threads: { T1: T("run", "has handed the lock to T2"), T2: T("gap", "owns the lock, still awake") },
    acts: [{ from: "queue", to: "T1", label: "queue_remove", kind: "info" }, { from: "T1", to: "T2", label: "line 32: unpark(T2)", kind: "ok", mark: true }],
    event: "unpark(T2) arrives early, and is remembered.", eventKind: "good"
  }, {
    label: "Step 6",
    text: "T1 lets go of the guard (line 34) and carries on. Later, the OS switches back to T2.",
    cpu: "T1", switching: "later: switch to T2", at: [{ who: "T1", line: 34 }, { who: "T2", line: 22 }],
    state: { flag: 1, owner: "T2", guard: 0, guardBy: null, q: [], pending: true, armed: true },
    threads: { T1: T("run", "done with the lock"), T2: T("gap", "owns the lock; a wake-up is waiting") },
    acts: [{ from: "T1", to: "guard", label: "line 34: guard = 0", kind: "info" }]
  }, {
    label: "Step 7",
    text: "T2 runs line 22, park(). The recorded wake-up is there, so park() returns at once instead of sleeping. T2 leaves lock() as the owner and enters its critical section. Nothing was lost.",
    cpu: "T2", at: [{ who: "T2", line: 24 }],
    state: { flag: 1, owner: "T2", guard: 0, guardBy: null, q: [], pending: false, armed: false },
    threads: { T1: T("ready", "runs on"), T2: T("run", "owns the lock, inside its critical section") },
    acts: [{ from: "T2", to: "sleep", label: "line 22: park() returns", kind: "ok" }],
    event: "park() returns immediately: the race is closed.", eventKind: "good"
  }];

  // ---- the scene: one picture. The lock m on top with its three fields; T1 and T2 under it; each step's action is
  // an arrow from the thread that acts to the field it touches (or to the other thread).
  var KIND = { ok: "#2a7a6b", bad: "#b23a48" };
  function scene(s, H, ctx) {
    var c = ctx.col, st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    var P = { T1: [78, 214], T2: [282, 214] };
    var CELL = { flag: [16, 112], guard: [132, 228], queue: [248, 344] };   // x ranges inside the lock box
    var CY = 44, CH = 62;                                                     // cell top, height
    function cx(n) { return (CELL[n][0] + CELL[n][1]) / 2; }
    // the lock m and its three fields
    out.push(H.box(6, 6, 348, 112, { r: 12, stroke: "var(--md-default-fg-color--light)", sw: 1.8 }));
    out.push(H.text(18, 28, "lock m", { size: 14, weight: 700, anchor: "start" }));
    out.push(H.text(342, 28, "flag + guard + queue, all in one struct", { size: 10.5, anchor: "end", color: "var(--md-default-fg-color--light)" }));
    function cell(n, title, changed) {
      out.push(H.box(CELL[n][0], CY, CELL[n][1] - CELL[n][0], CH, { r: 8, fill: changed ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: changed ? "#e8b23a" : "transparent", sw: 1.6, cls: changed ? "anim-new" : "" }));
      out.push(H.text(CELL[n][0] + 8, CY + 16, title, { size: 11, anchor: "start", color: "var(--md-default-fg-color--light)" }));
    }
    cell("flag", "flag", pv.flag !== st.flag || pv.owner !== st.owner);
    out.push(H.text(CELL.flag[0] + 10, CY + 46, String(st.flag), { size: 22, weight: 700, anchor: "start", mono: true }));
    out.push(H.text(CELL.flag[1] - 22, CY + 32, "owner", { size: 9.5, color: "var(--md-default-fg-color--light)" }));
    out.push(H.chip(CELL.flag[1] - 22, CY + 46, st.owner, c(st.owner), { cls: pv.owner !== st.owner ? "anim-pop" : "" }));
    cell("guard", "guard", pv.guard !== st.guard);
    out.push(H.text(CELL.guard[0] + 10, CY + 46, String(st.guard), { size: 22, weight: 700, anchor: "start", mono: true }));
    if (st.guardBy) out.push(H.text(CELL.guard[1] - 22, CY + 32, "held by", { size: 9.5, color: "var(--md-default-fg-color--light)" }) +
                             H.chip(CELL.guard[1] - 22, CY + 46, st.guardBy, c(st.guardBy), { cls: pv.guardBy !== st.guardBy ? "anim-pop" : "" }));
    else out.push(H.text(CELL.guard[1] - 22, CY + 46, "free", { size: 11, italic: true, color: "var(--md-default-fg-color--light)" }));
    cell("queue", "queue", JSON.stringify(pv.q) !== JSON.stringify(st.q));
    if (st.q.length) st.q.forEach(function (t, i) { out.push(H.chip(CELL.queue[0] + 26 + i * 40, CY + 42, t, c(t), { cls: pv.q.indexOf(t) < 0 ? "anim-pop" : "" })); });
    else out.push(H.text(CELL.queue[0] + 10, CY + 46, "empty", { size: 12, anchor: "start", italic: true, color: "var(--md-default-fg-color--light)" }));
    // the threads, with the CPU on the one that runs
    if (s.switching) out.push(H.text(180, 322, "⚡ " + s.switching, { size: 12, weight: 700, color: "#a0632a", cls: "anim-pop" }));
    ["T1", "T2"].forEach(function (t) {
      var p = P[t], th = s.threads[t], k = th.kind, col = c(t), on = s.cpu === t;
      var fill = k === "run" ? "rgba(42,122,107,.12)" : k === "gap" ? "rgba(232,178,58,.24)" : k === "dead" ? "rgba(178,58,72,.18)" : "var(--md-default-bg-color)";
      out.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="32" style="fill:' + fill + ';stroke:' + col + ';stroke-width:' + (on ? 3.2 : 1.6) + ';opacity:' + (on || k !== "ready" ? 1 : .75) + '"' + (k === "gap" ? ' stroke-dasharray="6 4" class="anim-pulse"' : '') + '/>');
      out.push(H.text(p[0], p[1] + (on ? 2 : 6), t, { size: 17, weight: 700, color: col }));
      if (on) out.push(H.text(p[0], p[1] + 20, "on the CPU", { size: 9, weight: 700, color: col, cls: ctx.prev && ctx.prev.cpu !== s.cpu ? "anim-pop" : "" }));
      if (k === "dead") out.push(H.text(p[0] + 46, p[1] - 14, "z z z", { size: 15, weight: 700, color: "#b23a48", italic: true, cls: "anim-pop" }));
      if (t === "T2" && st.armed) out.push(H.box(p[0] - 48, p[1] - 58, 96, 18, { r: 9, fill: "rgba(42,122,107,.12)", stroke: "#2a7a6b", sw: 1 }) + H.text(p[0], p[1] - 45, "setpark() called", { size: 10, weight: 700, color: "#2a7a6b" }));
      var words = th.text.split(" "), rows = [], r = "";
      words.forEach(function (w) { if ((r + " " + w).trim().length > 20) { rows.push(r.trim()); r = w; } else r += " " + w; });
      if (r.trim()) rows.push(r.trim());
      out.push(H.lines(p[0], p[1] + 50, rows, { size: 11.5, color: "var(--md-default-fg-color)", lh: 14 }));
    });
    if (st.pending) out.push(H.box(P.T2[0] - 52, P.T2[1] + 82, 104, 22, { r: 11, fill: "rgba(42,122,107,.15)", stroke: "#2a7a6b", cls: "anim-pop" }) +
                             H.text(P.T2[0], P.T2[1] + 97, "wake-up waiting", { size: 11, weight: 700, color: "#2a7a6b" }));
    // the action of this step
    (s.acts || []).forEach(function (a) {
      var color = KIND[a.kind] || c(a.from === "queue" ? "T1" : a.from);
      if (a.from === "T1" && a.to === "T2") {
        out.push(H.arrow(P.T1[0] + 36, P.T1[1], P.T2[0] - 36, P.T2[1], { color: color, label: a.label, mono: true, ldy: -16, sw: 2.6 }));
        out.push(H.mark(180, P.T1[1] + 26, a.mark));
        return;
      }
      if (a.to === "sleep") {
        out.push(H.box(P.T2[0] - 70, P.T2[1] - 62, 140, 20, { r: 5, stroke: color, sw: 1.2, cls: "anim-pop" }));
        out.push(H.text(P.T2[0], P.T2[1] - 48, a.label, { size: 11, weight: 700, color: color, mono: true, cls: "anim-pop" }));
        if (a.kind === "ok") out.push(H.mark(P.T2[0] + 48, P.T2[1] - 30, true));
        return;
      }
      if (a.from === "queue") {
        out.push(H.arrow(cx("queue") - 20, CY + CH, P.T1[0] + 24, P.T1[1] - 24, { color: color, bend: [0, 14], label: a.label, mono: true, lpos: [cx("queue") - 10, CY + CH + 22] }));
        return;
      }
      var p = P[a.from];
      out.push(H.arrow(p[0] + (a.from === "T1" ? 10 : -10), p[1] - 34, cx(a.to), CY + CH + 2, { color: color, bend: [0, 10], label: a.label, mono: true, lpos: [cx(a.to), CY + CH + 22] }));
    });
    return out.join("");
  }

  window.OS_ANIMS.setpark = {
    title: "The lost wake-up, step by step (Figure 28.9, one CPU)",
    interval: 4200,
    threads: ["T1", "T2"],
    colors: { T1: "#1f6f8b", T2: "#b5651d" },
    sceneBox: "0 0 360 334",
    scene: scene,
    code: code,
    variants: [
      { key: "without", label: "Without setpark()", steps: without },
      { key: "with", label: "With setpark()", steps: withSP, code: code2 }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
