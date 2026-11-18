// The bounded buffer with semaphores, W09 class 2, Sections 6.2 and 6.3 (OSTEP Figures 31.11 and 31.12).
// Tab 1 follows the flow of Section 6.2 (pcsem_deadlock.c lines 29 to 47): the consumer takes mutex, sleeps on full
// holding it, and the producer sleeps on mutex: the circle. Tab 2 runs the same start with Section 6.3's code
// (pcsem.c lines 27 to 45) and its producer's flow. Semaphore values follow Section 5.2 (wait: value - 1, sleep if
// negative; post: value + 1, wake one sleeper). Start values: empty = MAX = 10, full = 0, mutex = 1 (binary).
// The comment column of the listings is moved left so the lines fit; the code and the comments are the page's.
// The picture: the buffer, mutex, empty and full as one structure on top; the producer below on the left, the
// consumer on the right; each step's action is an arrow from the acting thread to the semaphore or the buffer.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  function mk(rows) { return rows.map(function (x) { return { n: x[0], text: x[1] }; }); }
  var codeDead = mk([
    [29, "void *producer(void *arg) {"],
    [30, "    int base = (int)(long)arg * ITEMS;"],
    [31, "    for (int i = 0; i < ITEMS; i++) {"],
    [32, "        sem_wait(&mutex);    // Line P0 (NEW LINE)"],
    [33, "        sem_wait(&empty);    // Line P1"],
    [34, "        put(base + i);       // Line P2"],
    [35, "        sem_post(&full);     // Line P3"],
    [36, "        sem_post(&mutex);    // Line P4 (NEW LINE)"],
    [37, "    }"],
    [38, "    return NULL;"],
    [39, "}"],
    [40, ""],
    [41, "void *consumer(void *arg) {"],
    [42, "    for (int i = 0; i < ITEMS; i++) {"],
    [43, "        sem_wait(&mutex);    // Line C0 (NEW LINE)"],
    [44, "        sem_wait(&full);     // Line C1"],
    [45, "        int tmp = get();     // Line C2"],
    [46, "        sem_post(&empty);    // Line C3"],
    [47, "        sem_post(&mutex);    // Line C4 (NEW LINE)"]
  ]);
  var codeOk = mk([
    [27, "void *producer(void *arg) {"],
    [28, "    int base = (int)(long)arg * ITEMS;"],
    [29, "    for (int i = 0; i < ITEMS; i++) {"],
    [30, "        sem_wait(&empty);    // Line P1"],
    [31, "        sem_wait(&mutex);    // Line P1.5 (MUTEX HERE)"],
    [32, "        put(base + i);       // Line P2"],
    [33, "        sem_post(&mutex);    // Line P2.5 (AND HERE)"],
    [34, "        sem_post(&full);     // Line P3"],
    [35, "    }"],
    [36, "    return NULL;"],
    [37, "}"],
    [38, ""],
    [39, "void *consumer(void *arg) {"],
    [40, "    for (int i = 0; i < ITEMS; i++) {"],
    [41, "        sem_wait(&full);     // Line C1"],
    [42, "        sem_wait(&mutex);    // Line C1.5 (MUTEX HERE)"],
    [43, "        int tmp = get();     // Line C2"],
    [44, "        sem_post(&mutex);    // Line C2.5 (AND HERE)"],
    [45, "        sem_post(&empty);    // Line C3"]
  ]);

  function T(kind, text) { return { kind: kind, text: text }; }
  // state: values of mutex, empty, full; holder of mutex; q: who sleeps on each; items in the buffer
  function st(m, e, f, holder, q, items) { return { mutex: m, empty: e, full: f, holder: holder, q: q, items: items || 0 }; }
  var NOQ = { mutex: [], empty: [], full: [] };

  // ---------------- Tab 1: Section 6.2, lock around everything ----------------
  var A = [{
    label: "Start",
    text: "One producer and one consumer. empty starts at MAX = 10 free slots, full at 0 items, and the binary semaphore mutex at 1. The consumer goes first: main starts the producers 0.1 s after the consumers.",
    at: [], actor: null,
    state: st(1, 10, 0, null, NOQ),
    threads: { prod: T("idle", "not started yet"), cons: T("idle", "about to run") }, acts: []
  }, {
    label: "Step 1",
    text: "The consumer calls sem_wait(&mutex) (C0) and takes it: 1 → 0.",
    at: [{ who: "cons", line: 43 }], actor: "cons",
    state: st(0, 10, 0, "cons", NOQ),
    threads: { prod: T("idle", "not started yet"), cons: T("run", "holds mutex") },
    acts: [{ from: "cons", to: "mutex", label: "C0: sem_wait(&mutex)" }]
  }, {
    label: "Step 2",
    text: "The consumer calls sem_wait(&full) (C1): 0 → −1, so it sleeps. It sleeps holding mutex, and nobody else can get in.",
    at: [{ who: "cons", line: 44 }], actor: "cons",
    state: st(0, 10, -1, "cons", { mutex: [], empty: [], full: ["cons"] }),
    threads: { prod: T("idle", "not started yet"), cons: T("sleep", "asleep on full, holding mutex") },
    acts: [{ from: "cons", to: "full", label: "C1: sem_wait(&full)", kind: "bad" }],
    event: "A sleeper holds the lock.", eventKind: "warn"
  }, {
    label: "Step 3",
    text: "The producer has an item to put. It calls sem_wait(&mutex) (P0): 0 → −1, so it sleeps too.",
    at: [{ who: "prod", line: 32 }, { who: "cons", line: 44 }], actor: "prod",
    state: st(-1, 10, -1, "cons", { mutex: ["prod"], empty: [], full: ["cons"] }),
    threads: { prod: T("sleep", "asleep on mutex"), cons: T("sleep", "asleep on full, holding mutex") },
    acts: [{ from: "prod", to: "mutex", label: "P0: sem_wait(&mutex)", kind: "bad" }]
  }, {
    label: "The circle",
    text: "The consumer holds mutex and waits for an item. The producer, who would make the item, waits for mutex, so nobody can post full. Each waits for the other, forever: a deadlock.",
    at: [{ who: "prod", line: 32 }, { who: "cons", line: 44 }], actor: null,
    state: st(-1, 10, -1, "cons", { mutex: ["prod"], empty: [], full: ["cons"] }),
    threads: { prod: T("dead", "asleep forever"), cons: T("dead", "asleep forever") },
    acts: [], circle: true,
    event: "Deadlock: timeout 5 ./pcsem_deadlock ends with exit status 124.", eventKind: "bad"
  }];

  // ---------------- Tab 2: Section 6.3, lock only put() and get() ----------------
  var B = [{
    label: "Start",
    text: "The same start values: empty = 10, full = 0, mutex = 1. Take the same order, the consumer first. This time each side waits for a slot or an item with no lock held, and locks only put() or get().",
    at: [], actor: null,
    state: st(1, 10, 0, null, NOQ),
    threads: { prod: T("idle", "not started yet"), cons: T("idle", "about to run") }, acts: []
  }, {
    label: "Step 1",
    text: "The consumer calls sem_wait(&full) (C1): 0 → −1, so it sleeps. It holds nothing, so the producer can run.",
    at: [{ who: "cons", line: 41 }], actor: "cons",
    state: st(1, 10, -1, null, { mutex: [], empty: [], full: ["cons"] }),
    threads: { prod: T("idle", "not started yet"), cons: T("sleep", "asleep on full, holding nothing") },
    acts: [{ from: "cons", to: "full", label: "C1: sem_wait(&full)" }],
    event: "A thread sleeps on full holding nothing.", eventKind: "good"
  }, {
    label: "Step 2",
    text: "The producer calls sem_wait(&empty) (P1): 10 → 9. A slot is free, so it goes on, still holding no lock.",
    at: [{ who: "prod", line: 30 }, { who: "cons", line: 41 }], actor: "prod",
    state: st(1, 9, -1, null, { mutex: [], empty: [], full: ["cons"] }),
    threads: { prod: T("run", "has a free slot"), cons: T("sleep", "asleep on full, holding nothing") },
    acts: [{ from: "prod", to: "empty", label: "P1: sem_wait(&empty)" }]
  }, {
    label: "Step 3",
    text: "The producer calls sem_wait(&mutex) (P1.5): 1 → 0. mutex is free, so it takes it.",
    at: [{ who: "prod", line: 31 }, { who: "cons", line: 41 }], actor: "prod",
    state: st(0, 9, -1, "prod", { mutex: [], empty: [], full: ["cons"] }),
    threads: { prod: T("run", "holds mutex"), cons: T("sleep", "asleep on full, holding nothing") },
    acts: [{ from: "prod", to: "mutex", label: "P1.5: sem_wait(&mutex)" }]
  }, {
    label: "Step 4",
    text: "put() (P2): its two lines write buffer[fill] and move fill, one producer at a time.",
    at: [{ who: "prod", line: 32 }, { who: "cons", line: 41 }], actor: "prod",
    state: st(0, 9, -1, "prod", { mutex: [], empty: [], full: ["cons"] }, 1),
    threads: { prod: T("run", "holds mutex"), cons: T("sleep", "asleep on full, holding nothing") },
    acts: [{ from: "prod", to: "buffer", label: "P2: put(base + i)" }]
  }, {
    label: "Step 5",
    text: "The producer calls sem_post(&mutex) (P2.5): 0 → 1.",
    at: [{ who: "prod", line: 33 }, { who: "cons", line: 41 }], actor: "prod",
    state: st(1, 9, -1, null, { mutex: [], empty: [], full: ["cons"] }, 1),
    threads: { prod: T("run", "holds nothing"), cons: T("sleep", "asleep on full, holding nothing") },
    acts: [{ from: "prod", to: "mutex", label: "P2.5: sem_post(&mutex)" }]
  }, {
    label: "Step 6",
    text: "The producer calls sem_post(&full) (P3): −1 → 0, which wakes the consumer. mutex is already free, so the woken consumer does not wait for the producer to unlock.",
    at: [{ who: "prod", line: 34 }, { who: "cons", line: 41 }], actor: "prod",
    state: st(1, 9, 0, null, NOQ, 1),
    threads: { prod: T("run", "holds nothing"), cons: T("ready", "woken, an item is there") },
    acts: [{ from: "prod", to: "full", label: "P3: sem_post(&full)" }, { wake: "full", to: "cons", label: "consumer", kind: "ok" }]
  }, {
    label: "Step 7",
    text: "The consumer calls sem_wait(&mutex) (C1.5): 1 → 0. It finds mutex free.",
    at: [{ who: "cons", line: 42 }], actor: "cons",
    state: st(0, 9, 0, "cons", NOQ, 1),
    threads: { prod: T("idle", "on to its next item"), cons: T("run", "holds mutex") },
    acts: [{ from: "cons", to: "mutex", label: "C1.5: sem_wait(&mutex)" }]
  }, {
    label: "Step 8",
    text: "get() (C2) reads the item out of the ring, one consumer at a time.",
    at: [{ who: "cons", line: 43 }], actor: "cons",
    state: st(0, 9, 0, "cons", NOQ, 0),
    threads: { prod: T("idle", "on to its next item"), cons: T("run", "holds mutex") },
    acts: [{ from: "cons", to: "buffer", label: "C2: int tmp = get()" }]
  }, {
    label: "Step 9",
    text: "The consumer calls sem_post(&mutex) (C2.5): 0 → 1.",
    at: [{ who: "cons", line: 44 }], actor: "cons",
    state: st(1, 9, 0, null, NOQ, 0),
    threads: { prod: T("idle", "on to its next item"), cons: T("run", "holds nothing") },
    acts: [{ from: "cons", to: "mutex", label: "C2.5: sem_post(&mutex)" }]
  }, {
    label: "Step 10",
    text: "The consumer calls sem_post(&empty) (C3): 9 → 10, handing back a free slot. No sleeper ever held mutex.",
    at: [{ who: "cons", line: 45 }], actor: "cons",
    state: st(1, 10, 0, null, NOQ, 0),
    threads: { prod: T("idle", "on to its next item"), cons: T("run", "holds nothing") },
    acts: [{ from: "cons", to: "empty", label: "C3: sem_post(&empty)" }],
    event: "The real run, 2 producers and 2 consumers: 1000000 items: 1000000 consumed once, 0 never, 0 more than once.", eventKind: "good"
  }];

  // ---------------- the scene ----------------
  var KIND = { ok: "#2a7a6b", bad: "#b23a48" };
  var LIGHT = "var(--md-default-fg-color--light)";
  var NAME = { prod: "producer", cons: "consumer" };
  var START = { mutex: 1, empty: 10, full: 0 };
  var P = { prod: [74, 292], cons: [286, 292] }, R = 35;
  var CELL = { mutex: [16, 140], empty: [146, 242], full: [248, 344] }, CY = 36, CH = 112, CB = CY + CH;
  var BUF = { x: 70, y: 158, w: 26, h: 18 }, BOXB = 192;
  function num(v) { return v < 0 ? "−" + (-v) : String(v); }
  function wrap(s, n) {
    var rows = [], r = "";
    s.split(" ").forEach(function (w) { if ((r + " " + w).trim().length > n) { rows.push(r.trim()); r = w; } else r += " " + w; });
    if (r.trim()) rows.push(r.trim());
    return rows;
  }
  function scene(s, H, ctx) {
    var c = ctx.col, S = s.state, pv = ctx.prev ? ctx.prev.state : S, out = [];
    function cx(n) { return (CELL[n][0] + CELL[n][1]) / 2; }
    out.push(H.box(6, 6, 348, BOXB - 6, { r: 12, stroke: LIGHT, sw: 1.8 }));
    out.push(H.text(16, 26, "the bounded buffer", { size: 13.5, weight: 700, anchor: "start" }));
    out.push(H.text(344, 26, "three semaphores and the ring", { size: 10.5, anchor: "end", color: LIGHT }));
    // the three semaphores
    ["mutex", "empty", "full"].forEach(function (n) {
      var x = CELL[n][0], w = CELL[n][1] - x, ch = pv[n] !== S[n] || (n === "mutex" && pv.holder !== S.holder);
      out.push(H.box(x, CY, w, CH, { r: 8, fill: ch ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: ch ? "#e8b23a" : "transparent", sw: 1.6, cls: ch ? "anim-new" : "" }));
      out.push(H.text(x + 8, CY + 16, n, { size: 11.5, weight: 700, anchor: "start", mono: true, color: LIGHT }));
      out.push(H.text(x + 8, CY + 29, "starts at " + START[n], { size: 10, anchor: "start", color: LIGHT }));
      out.push(H.text(x + 10, CY + 58, num(S[n]), { size: 24, weight: 700, anchor: "start", mono: true, color: S[n] < 0 ? "#b23a48" : "var(--md-default-fg-color)" }));
      if (pv[n] !== S[n]) out.push(H.text(x + 52, CY + 55, "was " + num(pv[n]), { size: 10.5, anchor: "start", color: LIGHT, cls: "anim-new" }));
      var q = S.q[n], pq = pv.q[n];
      if (n === "mutex") {
        out.push(H.text(x + 8, CY + 82, "held by", { size: 10, anchor: "start", color: LIGHT }));
        if (S.holder) out.push(H.chip(x + 84, CY + 78, NAME[S.holder], c(S.holder), { cls: pv.holder !== S.holder ? "anim-pop" : "" }));
        else out.push(H.text(x + 84, CY + 82, "nobody", { size: 10.5, italic: true, color: LIGHT }));
        out.push(H.text(x + 8, CY + 104, "asleep", { size: 10, anchor: "start", color: LIGHT }));
        if (q.length) out.push(H.chip(x + 84, CY + 100, NAME[q[0]], c(q[0]), { cls: pq.indexOf(q[0]) < 0 ? "anim-pop" : "" }));
        else out.push(H.text(x + 84, CY + 104, "nobody", { size: 10.5, italic: true, color: LIGHT }));
        return;
      }
      out.push(H.text(x + 8, CY + 82, "asleep on it", { size: 10, anchor: "start", color: LIGHT }));
      if (q.length) out.push(H.chip(x + w / 2, CY + 100, NAME[q[0]], c(q[0]), { cls: pq.indexOf(q[0]) < 0 ? "anim-pop" : "" }));
      else out.push(H.text(x + w / 2, CY + 104, "nobody", { size: 10.5, italic: true, color: LIGHT }));
    });
    // the ring of MAX = 10 slots
    out.push(H.text(16, BUF.y + 13, "buffer", { size: 11.5, weight: 700, anchor: "start", mono: true, color: LIGHT }));
    for (var i = 0; i < 10; i++) {
      var full = i < S.items, was = i < pv.items;
      out.push(H.box(BUF.x + i * (BUF.w + 1), BUF.y, BUF.w, BUF.h, { r: 3, fill: full ? "rgba(31,111,139,.55)" : "var(--md-code-bg-color)", stroke: full !== was ? "#e8b23a" : "var(--md-default-fg-color--lighter)", sw: full !== was ? 2.2 : 1, cls: full !== was ? "anim-pop" : "" }));
    }
    // the two threads
    ["prod", "cons"].forEach(function (t) {
      var p = P[t], th = s.threads[t], k = th.kind, col = c(t), on = s.actor === t;
      var fill = k === "run" ? "rgba(42,122,107,.12)" : k === "sleep" ? "rgba(120,120,140,.16)" : k === "dead" ? "rgba(178,58,72,.18)" : k === "ready" ? "rgba(232,178,58,.20)" : "var(--md-default-bg-color)";
      out.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + R + '" style="fill:' + fill + ';stroke:' + col + ';stroke-width:' + (on ? 3.4 : 1.6) + '"' + (k === "ready" ? ' stroke-dasharray="6 4"' : "") + '/>');
      out.push(H.text(p[0], p[1] + 4, NAME[t], { size: 11.5, weight: 700, color: col }));
      if (k === "sleep" || k === "dead") out.push(H.text(p[0] + (t === "prod" ? -R - 2 : R + 2), p[1] - R + 4, "z z", { size: 12, weight: 700, italic: true, color: k === "dead" ? "#b23a48" : LIGHT, anchor: t === "prod" ? "end" : "start" }));
      out.push(H.lines(p[0], p[1] + R + 15, wrap(th.text, 18), { size: 10.5, lh: 12.5 }));
    });
    // the action of this step
    function labX(x, label) { var h = label.length * 3.15 + 6; return Math.max(4 + h, Math.min(356 - h, x)); }
    var acts = s.acts || [];
    acts.forEach(function (a) {
      var color = KIND[a.kind] || c(a.from || s.actor);
      if (a.wake) {
        var tp = P[a.to], qx = CELL[a.wake][1] - 22, lab = "wakes the " + a.label;
        out.push(H.arrow(qx, CB + 2, tp[0] + 10, tp[1] - R - 2, { color: color, dash: true, sw: 2.2, label: lab, lpos: [labX(qx, lab), 238] }));
        return;
      }
      var p = P[a.from], fx, toY;
      if (a.to === "buffer") { fx = BUF.x + BUF.w / 2; toY = BUF.y + BUF.h + 2; }
      else { fx = cx(a.to); toY = CB + 2; if (acts.some(function (b) { return b.wake === a.to; })) fx = CELL[a.to][0] + 22; }
      var sx = p[0] + (fx > p[0] + 20 ? 16 : fx < p[0] - 20 ? -16 : 0), lx = a.to === "buffer" ? fx + 60 : fx;
      var wk = acts.filter(function (b) { return b.wake === a.to; })[0];
      if (wk) {   // keep the label left of the wake arrow, which runs from the queue down to the woken thread
        var qx0 = CELL[a.to][1] - 22, ex0 = P[wk.to][0] + 10, ey0 = P[wk.to][1] - R - 2;
        lx = qx0 + (ex0 - qx0) * (224 - CB) / (ey0 - CB) - 10 - (a.label.length * 3.15 + 6);
      }
      out.push(H.arrow(sx, p[1] - R - 2, fx, toY, { color: color, label: a.label, mono: true, lpos: [labX(lx, a.label), 214], sw: 2.4 }));
    });
    if (s.circle) {
      var bad = "#b23a48";
      out.push(H.arrow(P.prod[0] + R + 2, P.prod[1] - 12, P.cons[0] - R - 2, P.cons[1] - 12, { color: bad, dash: true, sw: 2.4, bend: [0, -30], label: "waits for mutex", lpos: [180, 262] }));
      out.push(H.arrow(P.cons[0] - R - 2, P.cons[1] + 12, P.prod[0] + R + 2, P.prod[1] + 12, { color: bad, dash: true, sw: 2.4, bend: [0, 30], label: "waits for an item", lpos: [180, 324] }));
    }
    return out.join("");
  }

  window.OS_ANIMS.bbdeadlock = {
    title: "Where the lock goes in the bounded buffer (OSTEP Figures 31.11 and 31.12)",
    interval: 4200,
    threads: ["prod", "cons"],
    colors: { prod: "#1f6f8b", cons: "#b5651d" },
    sceneBox: "0 0 360 362",
    scene: scene,
    code: codeDead,
    variants: [
      { key: "all", label: "Lock around everything (deadlock)", steps: A, code: codeDead, codeTitle: "W09_demos/pcsem_deadlock.c, lines 29 to 47" },
      { key: "inner", label: "Lock only put() and get() (works)", steps: B, code: codeOk, codeTitle: "W09_demos/pcsem.c, lines 27 to 45" }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
