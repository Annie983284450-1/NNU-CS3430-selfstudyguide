// The queue lock of OSTEP Figure 28.9, step by step, as W08 Section 6.3 walks it: T1 holds the lock, T2 arrives, queues
// itself and parks (Step 1, Figure 6.3); T3 does the same; T1 unlocks and hands the lock straight to T2 with the flag left
// at 1 (Step 2, Figure 6.4). The second tab is the page's case of an unlock with nobody waiting (lines 29 and 30).
// The code is lock() and unlock() with the book's line numbers (13 to 35), the same array as setpark.js. The scene is
// setpark.js's: the lock m on top (flag and owner, guard and its holder, the queue), the threads under it, and an arrow
// from the thread that acts to the field it touches.
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

  function T(kind, text) { return { kind: kind, text: text }; }
  // state: flag, owner, guard, guardBy, q (the queue)
  // thread kinds: away (not here yet), run (acting), hold (holds the lock), sleep (parked), wake (woken by unpark)
  var waiters = [{
    label: "Start",
    text: "T1 holds the lock (flag = 1) and is in its critical section. T2 arrives and calls lock().",
    at: [{ who: "T2", line: 13 }],
    state: { flag: 1, owner: "T1", guard: 0, guardBy: null, q: [] },
    threads: { T1: T("hold", "holds the lock, in its section"), T2: T("run", "calls lock()"), T3: T("away", "not here yet") },
    acts: []
  }, {
    label: "Step 1a",
    text: "T2 first takes the guard (line 14). The guard is a mini spin lock that covers nothing but the flag and the queue, for a handful of instructions.",
    at: [{ who: "T2", line: 14 }],
    state: { flag: 1, owner: "T1", guard: 1, guardBy: "T2", q: [] },
    threads: { T1: T("hold", "holds the lock, in its section"), T2: T("run", "holds the guard"), T3: T("away", "not here yet") },
    acts: [{ from: "T2", to: "guard", label: "line 14: TestAndSet" }]
  }, {
    label: "Step 1b",
    text: "T2 looks at the flag (line 16). The flag is 1: taken.",
    at: [{ who: "T2", line: 16 }],
    state: { flag: 1, owner: "T1", guard: 1, guardBy: "T2", q: [] },
    threads: { T1: T("hold", "holds the lock, in its section"), T2: T("run", "sees the lock is taken"), T3: T("away", "not here yet") },
    acts: [{ from: "T2", to: "flag", label: "line 16: flag is 1", kind: "bad" }]
  }, {
    label: "Step 1c",
    text: "So T2 writes its own thread id on the queue (line 20). gettid() is the call that returns the calling thread's id.",
    at: [{ who: "T2", line: 20 }],
    state: { flag: 1, owner: "T1", guard: 1, guardBy: "T2", q: ["T2"] },
    threads: { T1: T("hold", "holds the lock, in its section"), T2: T("run", "on the queue, holds the guard"), T3: T("away", "not here yet") },
    acts: [{ from: "T2", to: "queue", label: "line 20: queue_add" }]
  }, {
    label: "Step 1d",
    text: "T2 lets go of the guard (line 21).",
    at: [{ who: "T2", line: 21 }],
    state: { flag: 1, owner: "T1", guard: 0, guardBy: null, q: ["T2"] },
    threads: { T1: T("hold", "holds the lock, in its section"), T2: T("run", "on the queue"), T3: T("away", "not here yet") },
    acts: [{ from: "T2", to: "guard", label: "line 21: guard = 0" }]
  }, {
    label: "Step 1e",
    text: "T2 calls park() (line 22). The OS marks T2 blocked and runs someone else; T2 uses no CPU until someone unparks it.",
    at: [{ who: "T2", line: 22 }],
    state: { flag: 1, owner: "T1", guard: 0, guardBy: null, q: ["T2"] },
    threads: { T1: T("hold", "holds the lock, in its section"), T2: T("sleep", "asleep on the queue, uses no CPU"), T3: T("away", "not here yet") },
    acts: [{ from: "T2", to: "sleep", label: "line 22: park()" }],
    event: "Figure 6.3: the lock is held by T1, the guard is free, and T2 sleeps on the queue.", eventKind: "info"
  }, {
    label: "Step 2a",
    text: "T3 arrives while T1 still holds the lock and does what T2 did: it takes the guard, sees the flag at 1, adds itself to the queue, lets go of the guard and parks.",
    at: [{ who: "T2", line: 22 }, { who: "T3", line: 22 }],
    state: { flag: 1, owner: "T1", guard: 0, guardBy: null, q: ["T2", "T3"] },
    threads: { T1: T("hold", "holds the lock, in its section"), T2: T("sleep", "asleep on the queue"), T3: T("sleep", "asleep on the queue") },
    acts: [{ from: "T3", to: "queue", label: "line 20: queue_add" }],
    event: "T2 and T3 are both asleep on the queue, T2 first.", eventKind: "info"
  }, {
    label: "Step 2b",
    text: "T1 finishes its section and calls unlock(). It takes the guard (line 27).",
    at: [{ who: "T1", line: 27 }, { who: "T2", line: 22 }, { who: "T3", line: 22 }],
    state: { flag: 1, owner: "T1", guard: 1, guardBy: "T1", q: ["T2", "T3"] },
    threads: { T1: T("run", "in unlock(), holds the guard"), T2: T("sleep", "asleep on the queue"), T3: T("sleep", "asleep on the queue") },
    acts: [{ from: "T1", to: "guard", label: "line 27: TestAndSet" }]
  }, {
    label: "Step 2c",
    text: "T1 looks at the queue (line 29). It is not empty.",
    at: [{ who: "T1", line: 29 }, { who: "T2", line: 22 }, { who: "T3", line: 22 }],
    state: { flag: 1, owner: "T1", guard: 1, guardBy: "T1", q: ["T2", "T3"] },
    threads: { T1: T("run", "in unlock(), holds the guard"), T2: T("sleep", "asleep on the queue"), T3: T("sleep", "asleep on the queue") },
    acts: [{ from: "T1", to: "queue", label: "line 29: not empty" }]
  }, {
    label: "Step 2d",
    text: "So T1 removes the first name, T2, and unparks it (line 32). unlock() does not clear the flag: the flag stays 1, and the lock now belongs to T2.",
    at: [{ who: "T1", line: 32 }, { who: "T2", line: 22 }, { who: "T3", line: 22 }],
    state: { flag: 1, owner: "T2", guard: 1, guardBy: "T1", q: ["T3"] },
    threads: { T1: T("run", "has handed the lock to T2"), T2: T("wake", "woken, owns the lock"), T3: T("sleep", "asleep on the queue") },
    acts: [{ from: "T1", to: "T2", label: "line 32: unpark(T2)", kind: "ok" }],
    event: "The flag stays 1: the lock goes straight from T1 to T2.", eventKind: "good"
  }, {
    label: "Step 2e",
    text: "T1 lets go of the guard (line 34).",
    at: [{ who: "T1", line: 34 }, { who: "T2", line: 22 }, { who: "T3", line: 22 }],
    state: { flag: 1, owner: "T2", guard: 0, guardBy: null, q: ["T3"] },
    threads: { T1: T("run", "done with the lock"), T2: T("wake", "woken, owns the lock"), T3: T("sleep", "asleep on the queue") },
    acts: [{ from: "T1", to: "guard", label: "line 34: guard = 0" }],
    event: "Figure 6.4: the flag is still 1, now held by T2; T3 still sleeps on the queue.", eventKind: "info"
  }, {
    label: "Step 2f",
    text: "When T2 wakes up, it continues from its call to park(), already owning the lock. No third thread could grab the lock in between, and T3 stays asleep until T2 unlocks.",
    at: [{ who: "T2", line: 22 }, { who: "T3", line: 22 }],
    state: { flag: 1, owner: "T2", guard: 0, guardBy: null, q: ["T3"] },
    threads: { T1: T("plain", "done with the lock"), T2: T("hold", "owns the lock, in its section"), T3: T("sleep", "asleep until T2 unlocks") },
    acts: [{ from: "T2", to: "sleep", label: "line 22: park() returns", kind: "ok" }],
    event: "The queue fixes the order, so the lock is fair.", eventKind: "good"
  }];

  var nobody = [{
    label: "Start",
    text: "T1 holds the lock (flag = 1), and nobody is waiting: the queue is empty. T1 finishes its section and calls unlock().",
    at: [{ who: "T1", line: 26 }],
    state: { flag: 1, owner: "T1", guard: 0, guardBy: null, q: [] },
    threads: { T1: T("run", "calls unlock()"), T2: T("away", "not here yet") },
    acts: []
  }, {
    label: "Step 1",
    text: "T1 takes the guard (line 27).",
    at: [{ who: "T1", line: 27 }],
    state: { flag: 1, owner: "T1", guard: 1, guardBy: "T1", q: [] },
    threads: { T1: T("run", "in unlock(), holds the guard"), T2: T("away", "not here yet") },
    acts: [{ from: "T1", to: "guard", label: "line 27: TestAndSet" }]
  }, {
    label: "Step 2",
    text: "T1 looks at the queue (line 29). It is empty.",
    at: [{ who: "T1", line: 29 }],
    state: { flag: 1, owner: "T1", guard: 1, guardBy: "T1", q: [] },
    threads: { T1: T("run", "in unlock(), holds the guard"), T2: T("away", "not here yet") },
    acts: [{ from: "T1", to: "queue", label: "line 29: empty" }]
  }, {
    label: "Step 3",
    text: "So unlock simply stores 0 in the flag (line 30). The lock is free.",
    at: [{ who: "T1", line: 30 }],
    state: { flag: 0, owner: null, guard: 1, guardBy: "T1", q: [] },
    threads: { T1: T("run", "has let go of the lock"), T2: T("away", "not here yet") },
    acts: [{ from: "T1", to: "flag", label: "line 30: flag = 0" }]
  }, {
    label: "Step 4",
    text: "T1 lets go of the guard (line 34).",
    at: [{ who: "T1", line: 34 }],
    state: { flag: 0, owner: null, guard: 0, guardBy: null, q: [] },
    threads: { T1: T("run", "done with the lock"), T2: T("away", "not here yet") },
    acts: [{ from: "T1", to: "guard", label: "line 34: guard = 0" }]
  }, {
    label: "Step 5",
    text: "The next arrival, T2, takes the lock with no sleeping at all. Holding the guard (line 14), it finds the flag at 0 (line 16) and sets it to 1 (line 17).",
    at: [{ who: "T2", line: 17 }],
    state: { flag: 1, owner: "T2", guard: 1, guardBy: "T2", q: [] },
    threads: { T1: T("plain", "done with the lock"), T2: T("run", "has taken the lock") },
    acts: [{ from: "T2", to: "flag", label: "line 17: flag = 1", kind: "ok" }]
  }, {
    label: "Step 6",
    text: "T2 lets go of the guard (line 18) and enters its section. The queue is only used when somebody actually had to wait.",
    at: [{ who: "T2", line: 18 }],
    state: { flag: 1, owner: "T2", guard: 0, guardBy: null, q: [] },
    threads: { T1: T("plain", "done with the lock"), T2: T("hold", "owns the lock, in its section") },
    acts: [{ from: "T2", to: "guard", label: "line 18: guard = 0" }],
    event: "Nobody had to wait, so nobody slept and the queue stayed empty.", eventKind: "good"
  }];

  // ---- the scene: the lock m on top with its three fields; T1, T2 and T3 under it
  var KIND = { ok: "#2a7a6b", bad: "#b23a48" };
  function wrap(str, n) {
    var rows = [], r = "";
    str.split(" ").forEach(function (w) { if ((r + " " + w).trim().length > n) { rows.push(r.trim()); r = w; } else r += " " + w; });
    if (r.trim()) rows.push(r.trim());
    return rows;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function scene(s, H, ctx) {
    var c = ctx.col, st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    var P = { T1: [58, 222], T2: [180, 222], T3: [302, 222] }, R = 28;
    var CELL = { flag: [16, 112], guard: [132, 228], queue: [248, 344] };
    var CY = 44, CH = 62, BOT = CY + CH;
    function cx(n) { return (CELL[n][0] + CELL[n][1]) / 2; }
    var acting = {};
    (s.acts || []).forEach(function (a) { acting[a.from] = true; });
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
    out.push(H.text(CELL.flag[1] - 22, CY + 32, "owner", { size: 10, color: "var(--md-default-fg-color--light)" }));
    if (st.owner) out.push(H.chip(CELL.flag[1] - 22, CY + 46, st.owner, c(st.owner), { cls: pv.owner !== st.owner ? "anim-pop" : "" }));
    else out.push(H.text(CELL.flag[1] - 22, CY + 50, "none", { size: 11, italic: true, color: "var(--md-default-fg-color--light)" }));
    cell("guard", "guard", pv.guard !== st.guard);
    out.push(H.text(CELL.guard[0] + 10, CY + 46, String(st.guard), { size: 22, weight: 700, anchor: "start", mono: true }));
    if (st.guardBy) out.push(H.text(CELL.guard[1] - 22, CY + 32, "held by", { size: 10, color: "var(--md-default-fg-color--light)" }) +
                             H.chip(CELL.guard[1] - 22, CY + 46, st.guardBy, c(st.guardBy), { cls: pv.guardBy !== st.guardBy ? "anim-pop" : "" }));
    else out.push(H.text(CELL.guard[1] - 22, CY + 46, "free", { size: 11, italic: true, color: "var(--md-default-fg-color--light)" }));
    cell("queue", "queue", JSON.stringify(pv.q) !== JSON.stringify(st.q));
    if (st.q.length) {
      st.q.forEach(function (t, i) { out.push(H.chip(CELL.queue[0] + 26 + i * 40, CY + 36, t, c(t), { cls: pv.q.indexOf(t) < 0 ? "anim-pop" : "" })); });
      if (st.q.length > 1) out.push(H.text(CELL.queue[0] + 26, CY + 58, "first", { size: 10, italic: true, color: "var(--md-default-fg-color--light)" }));
    } else out.push(H.text(CELL.queue[0] + 10, CY + 46, "empty", { size: 12, anchor: "start", italic: true, color: "var(--md-default-fg-color--light)" }));
    // the threads
    ["T1", "T2", "T3"].forEach(function (t) {
      var th = s.threads[t];
      if (!th) return;
      var p = P[t], k = th.kind, col = c(t), on = acting[t];
      var fill = k === "run" || k === "hold" || k === "wake" ? "rgba(42,122,107,.12)" : k === "sleep" ? "rgba(120,120,120,.14)" : "var(--md-default-bg-color)";
      var op = k === "away" ? 0.45 : k === "plain" ? 0.7 : 1;
      out.push('<g style="opacity:' + op + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + R + '" style="fill:' + fill + ';stroke:' + col + ';stroke-width:' + (on ? 3.2 : 1.6) + '"' +
               (k === "away" || k === "sleep" ? ' stroke-dasharray="5 4"' : '') + '/>' +
               H.text(p[0], p[1] + (k === "sleep" ? 0 : 6), t, { size: 17, weight: 700, color: col }) + '</g>');
      if (k === "sleep") out.push(H.text(p[0], p[1] + 16, "z z z", { size: 11, weight: 700, italic: true, color: "var(--md-default-fg-color--light)", cls: ctx.prev && ctx.prev.threads[t] && ctx.prev.threads[t].kind !== "sleep" ? "anim-pop" : "" }));
      out.push(H.lines(p[0], p[1] + 48, wrap(th.text, 18), { size: 11, lh: 13.5 }));
    });
    // the action of this step
    (s.acts || []).forEach(function (a) {
      var color = KIND[a.kind] || c(a.from), p = P[a.from];
      if (a.to === "T2") {   // unpark: from T1 to T2, curving over the gap between them
        out.push(H.arrow(p[0] + R + 2, p[1] - 8, P.T2[0] - R - 2, P.T2[1] - 8, { color: color, bend: [0, -40], label: a.label, mono: true, lpos: [(p[0] + P.T2[0]) / 2 + 8, 168], sw: 2.6 }));
        return;
      }
      if (a.to === "sleep") {
        var w = a.label.length * 6.6 + 16, x = clamp(p[0], w / 2 + 4, 356 - w / 2);
        out.push(H.box(x - w / 2, p[1] - 60, w, 20, { r: 5, stroke: color, sw: 1.2, cls: "anim-pop" }));
        out.push(H.text(x, p[1] - 46, a.label, { size: 11, weight: 700, color: color, mono: true, cls: "anim-pop" }));
        if (a.kind === "ok") out.push(H.mark(x + w / 2 - 6, p[1] - 30, true));
        return;
      }
      var x1 = p[0], y1 = p[1] - R - 2;
      var x2 = clamp(p[0], CELL[a.to][0] + 18, CELL[a.to][1] - 18), y2 = BOT + 2;
      var ly = 144, lw = a.label.length * 6.3 + 12;
      var lx = clamp(x1 + (x2 - x1) * (y1 - ly) / (y1 - y2), lw / 2 + 4, 354 - lw / 2);
      out.push(H.arrow(x1, y1, x2, y2, { color: color, label: a.label, mono: true, lpos: [lx, ly], sw: 2.4 }));
    });
    return out.join("");
  }

  window.OS_ANIMS.queuelock = {
    title: "A queue of sleeping waiters, step by step (Figure 28.9)",
    interval: 4200,
    threads: ["T1", "T2", "T3"],
    colors: { T1: "#1f6f8b", T2: "#b5651d", T3: "#6b4fa0" },
    sceneBox: "0 0 360 296",
    scene: scene,
    code: code,
    variants: [
      { key: "waiters", label: "T2 and T3 wait", steps: waiters },
      { key: "nobody", label: "Nobody waiting", steps: nobody }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
