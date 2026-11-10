// One glibc lock word and the futex, step by step, as W08 Section 6.5 walks it: Figure 6.6's five moments (T1 locks a
// free word; T2 finds 1, writes 2 and calls futex_wait; T1 unlocks, finds 2, stores 0 and calls futex_wake; T2 wakes and
// takes the lock by writing 2; T2 unlocks, finds 2, and the wake call finds nobody). The page has no code listing for
// this, so the panel on the left is Figure 6.6 itself, numbered by its moments 1 to 5, under the page's three values.
// The scene: the lock word as one cell in user memory, T1 and T2 on either side of it, the user/kernel boundary, and
// the kernel's wait queue for the word's address below it; an arrow for what the acting thread does at this step.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  var code = [
    { n: null, text: "lock word:  0 = free" },
    { n: null, text: "            1 = held, nobody waiting" },
    { n: null, text: "            2 = held, somebody may be asleep" },
    { n: null, text: "" },
    { n: 1, text: "T1 locks: nobody holds it            0 → 1" },
    { n: null, text: "   one atomic instruction; no kernel" },
    { n: 2, text: "T2 locks: held                       1 → 2" },
    { n: null, text: "   T2 writes 2, then futex_wait(&m, 2)" },
    { n: 3, text: "T1 unlocks: it finds 2               2 → 0" },
    { n: null, text: "   store 0, then futex_wake(&m, 1)" },
    { n: 4, text: "T2 wakes and takes it                0 → 2" },
    { n: null, text: "   T2 writes 2, not 1" },
    { n: 5, text: "T2 unlocks: it finds 2, queue empty  2 → 0" },
    { n: null, text: "   store 0, then futex_wake:" },
    { n: null, text: "   the kernel finds nobody asleep" }
  ];

  function T(kind, text) { return { kind: kind, text: text }; }
  // state: word (the lock word's value), q (the kernel's queue for &m)
  // thread kinds: run (runs, no lock), hold (holds the lock), sleep (asleep in the kernel), woke (just woken)
  var steps = [{
    label: "Start",
    text: "The lock word is 0: free. T1 and T2 run in user space, and the kernel's queue for this address is empty.",
    at: [],
    state: { word: 0, q: [] },
    threads: { T1: T("run", "runs"), T2: T("run", "runs") },
    acts: []
  }, {
    label: "Moment 1",
    text: "T1 locks with one compare-and-swap: if the word is 0, make it 1. The word is 0, so it becomes 1 and T1 holds the lock, with no kernel.",
    at: [{ who: "T1", line: 1 }],
    state: { word: 1, q: [] },
    threads: { T1: T("hold", "holds the lock"), T2: T("run", "runs") },
    acts: [{ from: "T1", to: "word", label: "compare-and-swap 0 → 1", kind: "ok" }],
    event: "The fast path: one atomic instruction, no kernel.", eventKind: "good"
  }, {
    label: "Moment 2a",
    text: "T2 locks. Its compare-and-swap finds a 1, not 0, and leaves the word alone.",
    at: [{ who: "T1", line: 1 }, { who: "T2", line: 2 }],
    state: { word: 1, q: [] },
    threads: { T1: T("hold", "holds the lock"), T2: T("run", "wants the lock") },
    acts: [{ from: "T2", to: "word", label: "compare-and-swap: finds 1", kind: "bad" }]
  }, {
    label: "Moment 2b",
    text: "T2 then swaps a 2 into the word. The swap hands back the old value, still 1, so the lock is held.",
    at: [{ who: "T1", line: 1 }, { who: "T2", line: 2 }],
    state: { word: 2, q: [] },
    threads: { T1: T("hold", "holds the lock"), T2: T("run", "wants the lock") },
    acts: [{ from: "T2", to: "word", label: "swap in 2: old value 1" }],
    event: "The 2 is a note to whoever unlocks: somebody may be asleep.", eventKind: "info"
  }, {
    label: "Moment 2c",
    text: "T2 calls futex_wait(&m, 2). The kernel checks that the word still says 2 and puts T2 to sleep on the queue for this address.",
    at: [{ who: "T1", line: 1 }, { who: "T2", line: 2 }],
    state: { word: 2, q: ["T2"] },
    threads: { T1: T("hold", "holds the lock"), T2: T("sleep", "asleep in the kernel") },
    acts: [{ from: "T2", to: "queue", label: "futex_wait(&m, 2)" }],
    event: "Had an unlock got in first, the word would no longer say 2 and the kernel would return at once. No wake-up is lost.", eventKind: "good"
  }, {
    label: "Moment 3a",
    text: "T1 unlocks with one atomic swap: it puts 0 into the word and gets back the old value, 2, in the same step.",
    at: [{ who: "T1", line: 3 }, { who: "T2", line: 2 }],
    state: { word: 0, q: ["T2"] },
    threads: { T1: T("run", "has unlocked"), T2: T("sleep", "asleep in the kernel") },
    acts: [{ from: "T1", to: "word", label: "swap in 0: old value 2" }],
    event: "The store of 0 and the look at the old value are one swap, so nobody can change the word in between.", eventKind: "info"
  }, {
    label: "Moment 3b",
    text: "The old value is 2, so T1 calls futex_wake(&m, 1): the kernel wakes one sleeper from that queue, T2.",
    at: [{ who: "T1", line: 3 }, { who: "T2", line: 4 }],
    state: { word: 0, q: [] },
    threads: { T1: T("run", "has unlocked"), T2: T("woke", "awake, lock not yet taken") },
    acts: [{ from: "T1", to: "queue", label: "futex_wake(&m, 1)" }, { from: "queue", to: "T2", label: "wakes T2", kind: "ok" }],
    event: "If several threads sleep there, the kernel does not promise which one it wakes.", eventKind: "info"
  }, {
    label: "Moment 4",
    text: "T2 takes the lock by swapping in 2 again. The swap hands back 0, so the lock is T2's.",
    at: [{ who: "T2", line: 4 }],
    state: { word: 2, q: [] },
    threads: { T1: T("run", "runs"), T2: T("hold", "holds the lock") },
    acts: [{ from: "T2", to: "word", label: "swap in 2: old value 0", kind: "ok" }],
    event: "Not 1: another waiter could still be sleeping, and the next unlock has to know that.", eventKind: "info"
  }, {
    label: "Moment 5a",
    text: "T2 unlocks. Its swap puts 0 in and hands back 2.",
    at: [{ who: "T2", line: 5 }],
    state: { word: 0, q: [] },
    threads: { T1: T("run", "runs"), T2: T("run", "has unlocked") },
    acts: [{ from: "T2", to: "word", label: "swap in 0: old value 2" }]
  }, {
    label: "Moment 5b",
    text: "So T2 asks the kernel to wake someone, and nobody is there. T2 wrote that 2 itself in moment 4, in case another waiter was asleep.",
    at: [{ who: "T2", line: 5 }],
    state: { word: 0, q: [] },
    threads: { T1: T("run", "runs"), T2: T("run", "has unlocked") },
    acts: [{ from: "T2", to: "queue", label: "futex_wake(&m, 1)", kind: "bad", mark: false }],
    event: "Now and then a wake call finds nobody: the small price of not knowing for sure.", eventKind: "warn"
  }];

  // ---- the scene
  var KIND = { ok: "#2a7a6b", bad: "#b23a48" };
  var MEAN = { 0: ["free"], 1: ["held, nobody", "waiting"], 2: ["held, somebody", "may be asleep"] };
  function wrap(str, n) {
    var rows = [], r = "";
    str.split(" ").forEach(function (w) { if ((r + " " + w).trim().length > n) { rows.push(r.trim()); r = w; } else r += " " + w; });
    if (r.trim()) rows.push(r.trim());
    return rows;
  }
  // a label like the arrow labels of stepper.js, at a fixed spot
  function tag(H, x, y, label, color) {
    var w = label.length * 6.3 + 12;
    return '<g class="anim-head"><rect x="' + (x - w / 2) + '" y="' + (y - 10) + '" width="' + w + '" height="19" rx="4" style="fill:var(--md-default-bg-color);stroke:' + color + ';stroke-width:1"/>' +
           H.text(x, y + 4, label, { size: 11, weight: 600, color: color, mono: true }) + '</g>';
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function scene(s, H, ctx) {
    var c = ctx.col, st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    var P = { T1: [44, 86], T2: [316, 86] }, R = 26;
    var W = [116, 244, 40, 128];            // the word cell: x0, x1, y0, y1
    var Q = [104, 256, 216, 276];           // the kernel queue box
    var LINE = 192;                         // the user/kernel boundary
    var acting = {};
    (s.acts || []).forEach(function (a) { acting[a.from] = true; });
    // user space and kernel
    out.push(H.box(0, LINE, 360, 96, { r: 0, fill: "var(--md-code-bg-color)", stroke: "transparent" }));
    out.push('<line x1="0" y1="' + LINE + '" x2="360" y2="' + LINE + '" style="stroke:var(--md-default-fg-color--light);stroke-width:1.4" stroke-dasharray="6 4"/>');
    out.push(H.text(180, LINE - 8, "user space", { size: 10.5, weight: 700, color: "var(--md-default-fg-color--light)" }));
    out.push(H.text(180, LINE + 16, "kernel", { size: 10.5, weight: 700, color: "var(--md-default-fg-color--light)" }));
    // the lock word
    var changed = pv.word !== st.word;
    out.push(H.box(W[0], W[2], W[1] - W[0], W[3] - W[2], { r: 10, fill: changed ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: changed ? "#e8b23a" : "var(--md-default-fg-color--light)", sw: 1.6, cls: changed ? "anim-new" : "" }));
    out.push(H.text(W[0] + 8, W[2] + 16, "lock word m", { size: 11.5, weight: 700, anchor: "start" }));
    out.push(H.text(180, W[2] + 54, String(st.word), { size: 30, weight: 700, mono: true, cls: changed ? "anim-pop" : "" }));
    out.push(H.lines(180, W[2] + 72, MEAN[st.word], { size: 10, color: "var(--md-default-fg-color--light)", lh: 12 }));
    // the kernel's queue for &m
    out.push(H.box(Q[0], Q[2], Q[1] - Q[0], Q[3] - Q[2], { r: 8, stroke: "var(--md-default-fg-color--light)", sw: 1.4, fill: JSON.stringify(pv.q) !== JSON.stringify(st.q) ? "rgba(232,178,58,.30)" : "var(--md-default-bg-color)" }));
    out.push(H.text(Q[0] + 8, Q[2] + 16, "wait queue for &m", { size: 10.5, anchor: "start", color: "var(--md-default-fg-color--light)" }));
    if (st.q.length) st.q.forEach(function (t, i) { out.push(H.chip(180 + i * 40, Q[2] + 40, t, c(t), { cls: pv.q.indexOf(t) < 0 ? "anim-pop" : "" })); });
    else out.push(H.text(180, Q[2] + 44, "empty", { size: 12, italic: true, color: "var(--md-default-fg-color--light)" }));
    // the threads, their state written above them
    ["T1", "T2"].forEach(function (t) {
      var p = P[t], th = s.threads[t], k = th.kind, col = c(t), on = acting[t];
      var fill = k === "hold" ? "rgba(42,122,107,.14)" : k === "sleep" ? "rgba(120,120,120,.14)" : k === "woke" ? "rgba(232,178,58,.24)" : "var(--md-default-bg-color)";
      out.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + R + '" style="fill:' + fill + ';stroke:' + col + ';stroke-width:' + (on || k === "hold" ? 3.2 : 1.6) + ';opacity:' + (k === "sleep" ? .6 : 1) + '"' + (k === "sleep" ? ' stroke-dasharray="5 4"' : '') + '/>');
      out.push(H.text(p[0], p[1] + (k === "sleep" ? 0 : 6), t, { size: 16, weight: 700, color: col }));
      if (k === "sleep") out.push(H.text(p[0], p[1] + 15, "z z z", { size: 10, weight: 700, italic: true, color: "var(--md-default-fg-color--light)" }));
      var rows = wrap(th.text, 16);
      out.push(H.lines(p[0] + (t === "T1" ? 2 : -2), p[1] - R - 8 - (rows.length - 1) * 13, rows, { size: 10.5, lh: 13, weight: k === "hold" ? 700 : 400, color: k === "hold" ? "#2a7a6b" : "var(--md-default-fg-color)" }));
    });
    // the actions of this step
    (s.acts || []).forEach(function (a) {
      var color = KIND[a.kind] || c(a.from === "queue" ? a.to : a.from), lw = a.label.length * 6.3 + 12;
      if (a.to === "word") {        // a short arrow into the side of the word; its label at a fixed spot under the word
        var p = P[a.from], left = a.from === "T1";
        out.push(H.arrow(left ? p[0] + R + 2 : p[0] - R - 2, p[1], left ? W[0] - 2 : W[1] + 2, p[1], { color: color, sw: 2.6 }));
        out.push(tag(H, 180, W[3] + 20, a.label, color));
        return;
      }
      if (a.to === "queue") {       // down across the boundary into the kernel
        var p2 = P[a.from], x1 = p2[0], y1 = p2[1] + R + 2, x2 = a.from === "T1" ? Q[0] + 18 : Q[1] - 18, y2 = Q[2] - 2, ly = 166;
        var lx = clamp(x1 + (x2 - x1) * (ly - y1) / (y2 - y1), lw / 2 + 2, 358 - lw / 2);
        out.push(H.arrow(x1, y1, x2, y2, { color: color, label: a.label, mono: true, lpos: [lx, ly], sw: 2.4 }));
        if (a.mark !== undefined) out.push(H.mark(Q[1] + 14, Q[2] + 46, a.mark) + H.text(Q[1] + 14, Q[2] + 62, "nobody", { size: 10, color: "#b23a48", cls: "anim-pop" }));
        return;
      }
      if (a.from === "queue") {     // the kernel wakes the sleeper
        var t = P[a.to];
        out.push(H.arrow(Q[1] - 4, Q[2] + 24, t[0] + 6, t[1] + R + 4, { color: color, dash: true, bend: [26, 10], label: a.label, lpos: [318, 236], sw: 2 }));
      }
    });
    return out.join("");
  }

  window.OS_ANIMS.futex = {
    title: "One lock word and the futex, step by step (Figure 6.6)",
    interval: 4400,
    threads: ["T1", "T2"],
    colors: { T1: "#1f6f8b", T2: "#b5651d" },
    codeTitle: "Figure 6.6: one lock word, two threads, five moments",
    sceneBox: "0 0 360 288",
    scene: scene,
    code: code,
    variants: [
      { key: "walk", label: "Five moments", steps: steps }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
