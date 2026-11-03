// The ticket lock of OSTEP Figure 28.7, step by step, as W08 Section 5.6 walks it: three threads A, B and C arrive and
// take numbers (Step 1, Figure 5.5), then each unlock calls the next number (Step 2, Figure 5.6). The code and its line
// numbers are the page's listing of Figure 28.7 (1 to 19); the values of ticket and turn are the page's.
// The picture is one scene: the lock on top with its two integers (ticket, the dispenser; turn, the now-serving sign),
// A, B and C under it, each with its myturn number, and an arrow for what a thread does to the lock at this step.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  var L = [
    [1, "typedef struct __lock_t {"],
    [2, "    int ticket;"],
    [3, "    int turn;"],
    [4, "} lock_t;"],
    [5, ""],
    [6, "void lock_init(lock_t *lock) {"],
    [7, "    lock->ticket = 0;"],
    [8, "    lock->turn   = 0;"],
    [9, "}"],
    [10, ""],
    [11, "void lock(lock_t *lock) {"],
    [12, "    int myturn = FetchAndAdd(&lock->ticket);"],
    [13, "    while (lock->turn != myturn)"],
    [14, "        ; // spin"],
    [15, " }"],
    [16, ""],
    [17, "void unlock(lock_t *lock) {"],
    [18, "    lock->turn = lock->turn + 1;"],
    [19, "}"]
  ];
  var code = L.map(function (x) { return { n: x[0], text: x[1] }; });

  function T(kind, text) { return { kind: kind, text: text }; }
  // state: ticket, turn (the lock's two integers), my: each thread's myturn (undefined before it arrives)
  // thread kinds: away (not here yet), in (holds the lock), spin (waits on line 13), out (has unlocked and left)
  var step1 = [{
    label: "Start",
    text: "lock_init() sets both integers to 0 (lines 7 and 8): ticket = 0 and turn = 0. Three threads, A, B and C, are about to want the lock.",
    at: [],
    state: { ticket: 0, turn: 0, my: {} },
    threads: { A: T("away", "not here yet"), B: T("away", "not here yet"), C: T("away", "not here yet") },
    acts: []
  }, {
    label: "Step 1a",
    text: "A arrives first and takes a ticket with fetch-and-add (line 12). It gets the old value, 0, and the dispenser moves on to 1, in one step.",
    at: [{ who: "A", line: 12 }],
    state: { ticket: 1, turn: 0, my: { A: 0 } },
    threads: { A: T("plain", "has ticket 0"), B: T("away", "not here yet"), C: T("away", "not here yet") },
    acts: [{ from: "A", to: "ticket", label: "line 12: FetchAndAdd → 0" }]
  }, {
    label: "Step 1b",
    text: "The sign, turn, says 0, and A holds ticket 0 (line 13). So A walks in.",
    at: [{ who: "A", line: 13 }],
    state: { ticket: 1, turn: 0, my: { A: 0 } },
    threads: { A: T("in", "in: holds the lock"), B: T("away", "not here yet"), C: T("away", "not here yet") },
    acts: [{ from: "A", to: "turn", label: "line 13: 0 == 0, in", kind: "ok", mark: true }]
  }, {
    label: "Step 1c",
    text: "B arrives and pulls the next number (line 12). Fetch-and-add hands B the 1 and moves the dispenser on to 2.",
    at: [{ who: "A", line: 13 }, { who: "B", line: 12 }],
    state: { ticket: 2, turn: 0, my: { A: 0, B: 1 } },
    threads: { A: T("in", "in: holds the lock"), B: T("plain", "has ticket 1"), C: T("away", "not here yet") },
    acts: [{ from: "B", to: "ticket", label: "line 12: FetchAndAdd → 1" }]
  }, {
    label: "Step 1d",
    text: "C arrives about the same time and pulls 2 (line 12). Three threads have three different numbers, in arrival order.",
    at: [{ who: "A", line: 13 }, { who: "B", line: 12 }, { who: "C", line: 12 }],
    state: { ticket: 3, turn: 0, my: { A: 0, B: 1, C: 2 } },
    threads: { A: T("in", "in: holds the lock"), B: T("plain", "has ticket 1"), C: T("plain", "has ticket 2") },
    acts: [{ from: "C", to: "ticket", label: "line 12: FetchAndAdd → 2" }]
  }, {
    label: "Step 1e",
    text: "The sign still says 0, so B and C both wait on line 13, each watching for its own number. C holds ticket 2, so at most 2 threads can be served before C, whatever the timing.",
    at: [{ who: "A", line: 13 }, { who: "B", line: 13 }, { who: "C", line: 13 }],
    state: { ticket: 3, turn: 0, my: { A: 0, B: 1, C: 2 } },
    threads: { A: T("in", "in: holds the lock"), B: T("spin", "spins: waits for 1"), C: T("spin", "spins: waits for 2") },
    acts: [{ from: "B", to: "turn", label: "line 13: 0 != 1, spin", kind: "bad", mark: false, ly: 146 },
           { from: "C", to: "turn", label: "line 13: 0 != 2, spin", kind: "bad", mark: false, ly: 174 }],
    event: "Figure 5.5: ticket = 3, turn = 0. Three tickets handed out; the sign says 0.", eventKind: "info"
  }];

  var step2 = [{
    label: "Step 2a",
    text: "A unlocks (line 18). Unlock does not set anything free: it moves the sign on by 1, so turn = 1.",
    at: [{ who: "A", line: 18 }, { who: "B", line: 13 }, { who: "C", line: 13 }],
    state: { ticket: 3, turn: 1, my: { A: 0, B: 1, C: 2 } },
    threads: { A: T("out", "unlocked"), B: T("spin", "spins: waits for 1"), C: T("spin", "spins: waits for 2") },
    acts: [{ from: "A", to: "turn", label: "line 18: turn = 0 + 1" }],
    event: "A plain load, add and store, but safe: only the owner of the lock ever writes turn.", eventKind: "info"
  }, {
    label: "Step 2b",
    text: "The sign says 1, B's number, so B goes in (line 13). C keeps waiting.",
    at: [{ who: "B", line: 13 }, { who: "C", line: 13 }],
    state: { ticket: 3, turn: 1, my: { A: 0, B: 1, C: 2 } },
    threads: { A: T("out", "unlocked"), B: T("in", "in: holds the lock"), C: T("spin", "spins: waits for 2") },
    acts: [{ from: "B", to: "turn", label: "line 13: 1 == 1, in", kind: "ok", mark: true, ly: 146 },
           { from: "C", to: "turn", label: "line 13: 1 != 2, spin", kind: "bad", mark: false, ly: 174 }]
  }, {
    label: "Step 2c",
    text: "B unlocks (line 18), and the sign moves on to 2.",
    at: [{ who: "B", line: 18 }, { who: "C", line: 13 }],
    state: { ticket: 3, turn: 2, my: { A: 0, B: 1, C: 2 } },
    threads: { A: T("out", "unlocked"), B: T("out", "unlocked"), C: T("spin", "spins: waits for 2") },
    acts: [{ from: "B", to: "turn", label: "line 18: turn = 1 + 1" }]
  }, {
    label: "Step 2d",
    text: "Now it is C's turn: the sign says 2, and C goes in (line 13). The dispenser has not moved; the sign has moved on twice.",
    at: [{ who: "C", line: 13 }],
    state: { ticket: 3, turn: 2, my: { A: 0, B: 1, C: 2 } },
    threads: { A: T("out", "unlocked"), B: T("out", "unlocked"), C: T("in", "in: holds the lock") },
    acts: [{ from: "C", to: "turn", label: "line 13: 2 == 2, in", kind: "ok", mark: true }],
    event: "Figure 5.6: ticket = 3, turn = 2. Every ticket holder got in, in the order it arrived.", eventKind: "good"
  }];

  // ---- the scene
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
    var P = { A: [60, 222], B: [180, 222], C: [300, 222] }, R = 28;
    var CELL = { ticket: [16, 172], turn: [188, 344] };
    var CY = 42, CH = 68, BOT = CY + CH;
    var acting = {};
    (s.acts || []).forEach(function (a) { acting[a.from] = true; });
    // the lock and its two integers
    out.push(H.box(6, 6, 348, 116, { r: 12, stroke: "var(--md-default-fg-color--light)", sw: 1.8 }));
    out.push(H.text(18, 28, "lock", { size: 14, weight: 700, anchor: "start" }));
    out.push(H.text(342, 28, "two integers in one struct", { size: 10.5, anchor: "end", color: "var(--md-default-fg-color--light)" }));
    function cell(n, title, sub1, sub2) {
      var x0 = CELL[n][0], x1 = CELL[n][1], changed = pv[n] !== st[n];
      out.push(H.box(x0, CY, x1 - x0, CH, { r: 8, fill: changed ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: changed ? "#e8b23a" : "transparent", sw: 1.6, cls: changed ? "anim-new" : "" }));
      out.push(H.text(x0 + 9, CY + 18, title, { size: 12.5, weight: 700, anchor: "start", mono: true }));
      out.push(H.text(x0 + 9, CY + 46, sub1, { size: 10, anchor: "start", color: "var(--md-default-fg-color--light)" }));
      out.push(H.text(x0 + 9, CY + 60, sub2, { size: 10, anchor: "start", italic: true, color: "var(--md-default-fg-color--light)" }));
      out.push(H.text(x1 - 12, CY + 31, String(st[n]), { size: 26, weight: 700, anchor: "end", mono: true, cls: changed ? "anim-pop" : "" }));
    }
    cell("ticket", "ticket", "next number to hand out", "the dispenser");
    cell("turn", "turn", "the number being served", "the now-serving sign");
    // the threads
    ["A", "B", "C"].forEach(function (t) {
      var p = P[t], th = s.threads[t], k = th.kind, col = c(t), on = acting[t];
      var fill = k === "in" ? "rgba(42,122,107,.14)" : k === "spin" ? "rgba(232,178,58,.24)" : "var(--md-default-bg-color)";
      var op = k === "away" ? 0.45 : k === "out" ? 0.6 : 1;
      out.push('<g style="opacity:' + op + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + R + '" style="fill:' + fill + ';stroke:' + col + ';stroke-width:' + (on || k === "in" ? 3.2 : 1.6) + '"' +
               (k === "away" ? ' stroke-dasharray="5 4"' : '') + (k === "spin" ? ' class="anim-pulse"' : '') + '/>' +
               H.text(p[0], p[1] + 6, t, { size: 18, weight: 700, color: col }) + '</g>');
      var my = st.my[t], changed = my !== undefined && pv.my[t] !== my;
      out.push(H.box(p[0] - 44, p[1] + 34, 88, 20, { r: 6, fill: changed ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: changed ? "#e8b23a" : "transparent", sw: 1.4, cls: changed ? "anim-pop" : "" }));
      if (my !== undefined) out.push(H.text(p[0], p[1] + 48, "myturn = " + my, { size: 11, weight: 700, mono: true, cls: changed ? "anim-pop" : "" }));
      else out.push(H.text(p[0], p[1] + 48, "no ticket", { size: 11, italic: true, color: "var(--md-default-fg-color--light)" }));
      out.push(H.lines(p[0], p[1] + 72, wrap(th.text, 19), { size: 11, color: k === "in" ? "#2a7a6b" : "var(--md-default-fg-color)", weight: k === "in" ? 700 : 400, lh: 13 }));
    });
    // the actions of this step: an arrow from the thread to the integer it touches, its label on the arrow
    (s.acts || []).forEach(function (a) {
      var p = P[a.from], color = KIND[a.kind] || c(a.from);
      var x1 = p[0] + (a.to === "turn" ? 8 : -8) * (a.from === "B" ? 1 : 0), y1 = p[1] - R - 2;
      var x2 = clamp(p[0], CELL[a.to][0] + 20, CELL[a.to][1] - 20), y2 = BOT + 2;
      if (a.from === "B" && a.to === "turn") x2 = 214;
      if (a.from === "A" && a.to === "turn") x2 = 206;
      var ly = a.ly || 158, w = a.label.length * 6.3 + 12;
      var lx = x1 + (x2 - x1) * (y1 - ly) / (y1 - y2);
      lx = clamp(lx, w / 2 + 4, 354 - w / 2);
      out.push(H.arrow(x1, y1, x2, y2, { color: color, label: a.label, mono: true, lpos: [lx, ly], sw: 2.4 }));
      if (a.mark !== undefined) out.push(H.mark(p[0] + R + 8, p[1] - R + 8, a.mark));
    });
    return out.join("");
  }

  window.OS_ANIMS.ticket = {
    title: "The ticket lock, step by step (Figure 28.7)",
    interval: 4200,
    threads: ["A", "B", "C"],
    colors: { A: "#1f6f8b", B: "#b5651d", C: "#6b4fa0" },
    sceneBox: "0 0 360 322",
    scene: scene,
    code: code,
    variants: [
      { key: "run", label: "Three arrivals, two releases", steps: step1.concat(step2) }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
