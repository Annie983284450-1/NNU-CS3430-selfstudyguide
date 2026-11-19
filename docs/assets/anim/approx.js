// The approximate counter of W09 class 1, sections 2.3 to 2.5, step by step: the page's redrawn OSTEP Figure 29.3
// (S = 5, four CPUs, time 0 to 7, local counts L1 to L4 and the global count G), one step per time row, and a last
// step for get() (Section 2.5: get() returns G = 10 at time 7, while the true total is 16).
// The code beside it is update() of Section 2.4, W09_demos/approx.c lines 27 to 38 (OSTEP Figure 29.4).
// The picture is one scene: the four CPUs on top; the counter c as one struct with its four local counts (each with its
// own lock) and the global count G with its lock; an arrow for each add into a slot, a thick arrow for a transfer
// into G; under the struct, the true total (L1 + L2 + L3 + L4 + G) against G.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  // Time 5 puts three CPUs on line 30: give this animation's code markers room for three (scoped to this one).
  if (typeof document !== "undefined" && !document.getElementById("anim-approx-css")) {
    var css = document.createElement("style");
    css.id = "anim-approx-css";
    css.textContent = '.anim[data-anim="approx"] .anim-marks { width: 5.2em; }';
    document.head.appendChild(css);
  }
  var L = [
    [27, "void update(counter_t *c, int threadID, int amt) {"],
    [28, "    int cpu = threadID % NUMCPUS;"],
    [29, "    pthread_mutex_lock(&c->llock[cpu]);"],
    [30, "    c->local[cpu] += amt;"],
    [31, "    if (c->local[cpu] >= c->threshold) {"],
    [32, "        pthread_mutex_lock(&c->glock);"],
    [33, "        c->global += c->local[cpu];"],
    [34, "        pthread_mutex_unlock(&c->glock);"],
    [35, "        c->local[cpu] = 0;"],
    [36, "    }"],
    [37, "    pthread_mutex_unlock(&c->llock[cpu]);"],
    [38, "}"]
  ];
  var code = L.map(function (x) { return { n: x[0], text: x[1] }; });
  var CPUS = ["C1", "C2", "C3", "C4"];

  // The table of Section 2.3, row by row: [L1, L2, L3, L4, G]. A slot that reaches S at this row is listed in `full`
  // with the value it reached (5), and shows 5 → 0.
  var ROWS = [
    [0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0],
    [1, 0, 2, 1, 0],
    [2, 0, 3, 1, 0],
    [3, 0, 3, 2, 0],
    [4, 1, 3, 3, 0],
    [0, 1, 3, 4, 5],
    [0, 2, 4, 0, 10]
  ];
  var FULL = { 6: 0, 7: 3 };   // time -> the slot (0-based) that reached S = 5 and moved its 5 into G

  var TEXT = [
    "Four CPUs, C1 to C4, each with its own local count, L1 to L4, under its own local lock. All four are 0, and so is the global count G. S, the threshold, is 5.",
    "C3 and C4 each add one to their own local count (line 30). Nobody touches the global lock.",
    "C1 and C3 add one each. Each takes only its own slot's lock, which nobody else wants, so there is no waiting.",
    "C1 and C3 add one each again. G is still 0, while 6 adds sit in the local counts.",
    "C1 and C4 add one each. No local count has reached S yet, so line 31 says no every time and the function skips to line 37.",
    "C1, C2 and C4 add one each. L1 is now 4, one short of S.",
    "L1 reaches 5, which is S. C1 takes the global lock once, pours its 5 into G (line 33), and starts again at 0. C4 adds one to L4.",
    "L4 reaches 5 and does the same, so G reads 10. C2 and C3 add one each. Between time 6 and time 7 nobody touched the global lock at all."
  ];

  function stepFor(t) {
    var r = ROWS[t], p = t ? ROWS[t - 1] : r, full = FULL[t], acts = [], at = [], adds = [];
    for (var i = 0; i < 4; i++) {
      var grew = (full === i) ? true : r[i] > p[i];
      if (t && grew) {
        adds.push(i);
        acts.push({ from: CPUS[i], to: i, kind: "add" });
        at.push({ who: CPUS[i], line: full === i ? 33 : 30 });
      }
    }
    if (full !== undefined) acts.push({ from: full, to: "G", kind: "move", label: "line 33: global += local" });
    return {
      label: "Time " + t,
      text: TEXT[t],
      at: at,
      state: { L: r.slice(0, 4), G: r[4], adds: adds, full: full, glockBy: full !== undefined ? CPUS[full] : null },
      acts: acts,
      event: full !== undefined ? "The shared lock, taken once for 5 adds." : null,
      eventKind: "good"
    };
  }
  var steps = [];
  for (var t = 0; t <= 7; t++) steps.push(stepFor(t));
  steps.push({
    label: "get()",
    text: "get() takes the global lock, copies G and returns it, without looking at the slots. At time 7 it returns 10, while the true total is 0 + 2 + 4 + 0 + 10 = 16: the 6 missing adds are still in L2 and L3. Each slot can hide up to S adds, so with S = 5 and four slots G is at most 4 × 5 = 20 behind.",
    at: [],
    state: { L: [0, 2, 4, 0], G: 10, adds: [], full: undefined, glockBy: "get()", reader: true },
    acts: [{ from: "reader", to: "G", kind: "read", label: "lines 40-45" }],
    event: "get() returns 10; the true total is 16.", eventKind: "warn"
  });

  // ---- the scene
  var SX = function (i) { return 14 + i * 84; }, SW = 76, SY = 72, SH = 68;   // the four slots
  var GX = 92, GW = 176, GY = 182, GH = 56;                                     // the global count
  var YEL = "rgba(232,178,58,.30)";
  function scene(s, H, ctx) {
    var c = ctx.col, st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    var light = "var(--md-default-fg-color--light)";
    // the CPUs on top
    CPUS.forEach(function (n, i) {
      var cx = SX(i) + SW / 2, on = st.adds.indexOf(i) >= 0;
      out.push('<g style="opacity:' + (on ? 1 : 0.4) + '">' + H.chip(cx, 18, n, c(n)) + '</g>');
    });
    // the counter struct
    out.push(H.box(6, 36, 348, 212, { r: 12, stroke: light, sw: 1.8 }));
    out.push(H.text(16, 238, "counter c", { size: 13, weight: 700, anchor: "start" }));
    out.push(H.text(344, 238, "S = 5", { size: 11.5, weight: 700, anchor: "end", color: light }));
    // the four slots
    for (var i = 0; i < 4; i++) {
      var x = SX(i), changed = st.L[i] !== pv.L[i] || st.full === i, n = CPUS[i];
      var acting = st.adds.indexOf(i) >= 0;
      out.push(H.box(x, SY, SW, SH, { r: 8, fill: changed ? YEL : "var(--md-code-bg-color)", stroke: changed ? "#e8b23a" : "transparent", sw: 1.6, cls: changed ? "anim-new" : "" }));
      out.push(H.text(x + 8, SY + 16, "L" + (i + 1), { size: 11.5, weight: 700, anchor: "start", color: light }));
      // the slot's own lock: filled with the CPU's color when that CPU used it at this step
      out.push(H.box(x + SW - 38, SY + 5, 33, 15, { r: 4, fill: acting ? c(n) : "var(--md-default-bg-color)", stroke: acting ? c(n) : "var(--md-default-fg-color--lighter)", sw: 1 }));
      out.push(H.text(x + SW - 21.5, SY + 16, "llock", { size: 10, weight: 600, color: acting ? "#fff" : light }));
      if (st.full === i) {
        out.push(H.text(x + SW / 2, SY + 50, "5 → 0", { size: 18, weight: 700, mono: true, cls: "anim-pop" }));
      } else {
        out.push(H.text(x + SW / 2, SY + 50, String(st.L[i]), { size: 22, weight: 700, mono: true }));
        if (acting) out.push(H.text(x + SW - 10, SY + 48, "+1", { size: 11, weight: 700, color: "#2a7a6b", cls: "anim-pop" }));
      }
    }
    // the global count G with its lock
    var gch = st.G !== pv.G;
    out.push(H.box(GX, GY, GW, GH, { r: 8, fill: gch ? YEL : "var(--md-code-bg-color)", stroke: gch ? "#e8b23a" : "var(--md-default-fg-color--lighter)", sw: 1.6, cls: gch ? "anim-new" : "" }));
    out.push(H.text(GX + 8, GY + 16, "G (global)", { size: 11.5, weight: 700, anchor: "start", color: light }));
    out.push(H.text(GX + 44, GY + 46, String(st.G), { size: 22, weight: 700, mono: true }));
    out.push(H.text(GX + GW - 32, GY + 18, "glock", { size: 10, weight: 600, color: light }));
    if (st.glockBy) out.push(H.chip(GX + GW - 32, GY + 38, st.glockBy, st.reader ? "#5b6470" : c(st.glockBy), { cls: "anim-pop" }));
    else out.push(H.text(GX + GW - 32, GY + 42, "free", { size: 11, italic: true, color: light }));
    // the true total against G
    var total = st.L[0] + st.L[1] + st.L[2] + st.L[3] + st.G, k = 10, bx = 100;
    out.push(H.text(14, 266, "true total = L1+L2+L3+L4+G", { size: 10, anchor: "start", color: light }));
    out.push(H.text(14, 289, "true total " + total, { size: 11.5, weight: 700, anchor: "start" }));
    out.push(H.box(bx, 279, Math.max(total * k, 1), 14, { r: 3, fill: "rgba(42,122,107,.55)", stroke: "transparent" }));
    out.push(H.text(14, 317, "G " + st.G, { size: 11.5, weight: 700, anchor: "start" }));
    out.push(H.box(bx, 307, Math.max(st.G * k, 1), 14, { r: 3, fill: "rgba(232,178,58,.85)", stroke: "transparent" }));
    if (total > st.G) {
      out.push(H.box(bx + st.G * k, 307, (total - st.G) * k, 14, { r: 3, fill: "transparent", stroke: "#b23a48", sw: 1.2, dash: true }));
      out.push(H.text(bx + total * k + 6, 318, (total - st.G) + " behind", { size: 11, weight: 700, anchor: "start", color: "#b23a48" }));
    }
    // the actions
    (s.acts || []).forEach(function (a) {
      if (a.kind === "add") {
        var cx = SX(a.to) + SW / 2;
        out.push(H.arrow(cx, 30, cx, SY - 1, { color: c(a.from), label: "line 30", mono: true, lpos: [cx, 54], sw: 2 }));
      } else if (a.kind === "move") {
        var sx = SX(a.from) + SW / 2, left = a.from < 2;
        out.push(H.arrow(sx, SY + SH + 1, left ? GX + 22 : GX + GW - 22, GY - 1, { color: c(CPUS[a.from]), bend: [left ? -14 : 14, 6], sw: 4.2, label: a.label, mono: true, lpos: [180, 161] }));
      } else if (a.kind === "read") {
        out.push(H.chip(326, 294, "get()", "#5b6470", { cls: "anim-pop" }));
        out.push(H.arrow(326, 283, GX + GW - 8, GY + GH + 1, { color: "#5b6470", bend: [22, 0], label: a.label, mono: true, lpos: [250, 262], sw: 2.4 }));
      }
    });
    return out.join("");
  }

  window.OS_ANIMS.approx = {
    title: "The approximate counter, time 0 to 7 (S = 5, four CPUs)",
    interval: 4200,
    threads: CPUS,
    colors: { C1: "#1f6f8b", C2: "#b5651d", C3: "#6b4fa0", C4: "#2a7a6b" },
    codeTitle: "update(), approx.c lines 27 to 38 (OSTEP Figure 29.4)",
    sceneBox: "0 0 360 334",
    scene: scene,
    code: code,
    variants: [{ key: "run", label: "Figure 29.3, row by row", steps: steps }]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
