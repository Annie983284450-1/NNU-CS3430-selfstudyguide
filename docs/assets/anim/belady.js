// FIFO replacement and Belady's anomaly, reference by reference (W05 class 2, Sections 5.3 and 5.4).
// The stream 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5 is Figure 5.7's. Section 5.4 says both traces are worked one request at
// a time in the answers section; the rows below are those of that answer (review.md, Answer 4) and of the deck's answer
// drawing (Figure R.2, belady_a.png): hit or miss, the page evicted, and the cache afterwards, oldest on the left.
// Tab 1 is FIFO with 3 frames (3 hits, 9 misses), tab 2 with 4 frames (2 hits, 10 misses).
// The picture: the stream as a row of cells on top with the current reference highlighted; the cache below it as one
// FIFO queue (oldest on the left); one arrow from the current reference to the slot it lands in (green for a hit, red
// for a miss, the new page yellow); the evicted page leaving on the left; the running counts at the bottom.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  var STREAM = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
  // Figure R.2, row by row: [hit?, evicted page or 0, resulting cache state, oldest first]
  var ROWS = {
    3: [[0, 0, [1]], [0, 0, [1, 2]], [0, 0, [1, 2, 3]], [0, 1, [2, 3, 4]], [0, 2, [3, 4, 1]], [0, 3, [4, 1, 2]],
        [0, 4, [1, 2, 5]], [1, 0, [1, 2, 5]], [1, 0, [1, 2, 5]], [0, 1, [2, 5, 3]], [0, 2, [5, 3, 4]], [1, 0, [5, 3, 4]]],
    4: [[0, 0, [1]], [0, 0, [1, 2]], [0, 0, [1, 2, 3]], [0, 0, [1, 2, 3, 4]], [1, 0, [1, 2, 3, 4]], [1, 0, [1, 2, 3, 4]],
        [0, 1, [2, 3, 4, 5]], [0, 2, [3, 4, 5, 1]], [0, 3, [4, 5, 1, 2]], [0, 4, [5, 1, 2, 3]], [0, 5, [1, 2, 3, 4]],
        [0, 1, [2, 3, 4, 5]]]
  };

  var code = [
    { n: null, text: "The stream (Figure 5.7), twelve references:" },
    { n: null, text: "1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5" },
    { n: null, text: "" },
    { n: null, text: "FIFO, first in, first out (Section 5.3):" },
    { n: "in", text: "Pages go into a queue when they arrive;" },
    { n: "out", text: "when a page must go, evict the one that" },
    { n: null, text: "has been in the line longest." },
    { n: "hit", text: "The line only changes on a miss." },
    { n: null, text: "" },
    { n: null, text: "Oldest on the left, evicting the leftmost" },
    { n: null, text: "when the cache is full (Section 5.4)." }
  ];

  // captions, one per reference, from Answer 4 and Section 5.4
  var TEXT = {
    3: [
      "Reference 1, page 1, misses and joins the queue.",
      "Reference 2, page 2, misses and joins the queue behind page 1.",
      "Reference 3, page 3, misses. References 1, 2 and 3 fill the cache: 1, 2, 3.",
      "Reference 4, page 4, misses, and the cache is full: the first miss with a full cache. The oldest page, 1, goes: 2, 3, 4.",
      "Reference 5, page 1, misses, and 2 goes: 3, 4, 1.",
      "Reference 6, page 2, misses, and 3 goes: 4, 1, 2.",
      "Reference 7, page 5, misses, and 4 goes: 1, 2, 5.",
      "Reference 8, page 1, hits. The queue does not change, because the line only changes on a miss.",
      "Reference 9, page 2, hits.",
      "Reference 10, page 3, misses, and 1 goes: 2, 5, 3.",
      "Reference 11, page 4, misses, and 2 goes: 5, 3, 4.",
      "Reference 12, page 5, hits. Total: 3 hits (references 8, 9 and 12) and 9 misses. Check: 3 + 9 = 12."
    ],
    4: [
      "Reference 1, page 1, misses and joins the queue.",
      "Reference 2, page 2, misses.",
      "Reference 3, page 3, misses.",
      "Reference 4, page 4, misses. References 1 to 4 fill the cache: 1, 2, 3, 4.",
      "Reference 5, page 1, hits.",
      "Reference 6, page 2, hits. These are the only two hits of this run.",
      "Reference 7, page 5, misses: the first miss with a full cache. 1 goes: 2, 3, 4, 5. The cache now holds 2, 3, 4, 5 in that order, and the stream asks for 1, 2, 3, 4, 5 in turn.",
      "Reference 8, page 1, misses, and the oldest page, 2, goes: 3, 4, 5, 1. Page 2 is exactly the page the next request asks for.",
      "Reference 9, page 2, misses, and 3 goes: 4, 5, 1, 2. Again the page thrown out is the next one wanted.",
      "Reference 10, page 3, misses, and 4 goes: 5, 1, 2, 3.",
      "Reference 11, page 4, misses, and 5 goes: 1, 2, 3, 4.",
      "Reference 12, page 5, misses, and 1 goes: 2, 3, 4, 5. Total: 2 hits (references 5 and 6) and 10 misses. Check: 2 + 10 = 12."
    ]
  };

  function build(N) {
    var steps = [{
      label: "Start",
      text: "FIFO with a cache of " + N + " frames, on the stream 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5: twelve references, five distinct pages. The cache starts empty.",
      at: [],
      state: { i: -1, N: N, q: [], hit: null, ev: 0, hits: 0, misses: 0, hm: [] }
    }];
    var hits = 0, misses = 0, hm = [], prevQ = [];
    STREAM.forEach(function (p, i) {
      var r = ROWS[N][i], hit = !!r[0];
      if (hit) hits++; else misses++;
      hm = hm.concat([hit ? "H" : "M"]);
      var rule = hit ? "hit" : (r[1] ? "out" : "in");
      var st = {
        label: "Ref " + (i + 1),
        text: TEXT[N][i],
        at: [{ who: "FIFO", line: rule }],
        state: { i: i, N: N, q: r[2], hit: hit, ev: r[1], hits: hits, misses: misses, hm: hm, page: p }
      };
      if (N === 3 && i === 11) { st.event = "FIFO, 3 frames: 3 hits, 9 misses."; st.eventKind = "info"; }
      if (N === 4 && i === 6) { st.event = "Every page from here on is thrown out one step before it is needed."; st.eventKind = "warn"; }
      if (N === 4 && i === 11) { st.event = "4 frames: 10 misses. 3 frames: 9. The bigger cache misses more: Belady's anomaly."; st.eventKind = "bad"; }
      steps.push(st);
      prevQ = r[2];
    });
    return steps;
  }

  // ---- the scene
  var GOOD = "#2a7a6b", BAD = "#b23a48", NEW = "#e8b23a", MUTED = "var(--md-default-fg-color--light)";
  var CW = 26, CG = 3, CX0 = 7, CY = 36, CH = 28;           // the stream cells
  var QX = 84, QW = 268, QY = 122, QH = 68;                 // the queue box
  var SW = 52, SG = 8, SY = 130, SH = 36;                   // the slots inside it

  function scene(s, H, ctx) {
    var st = s.state, out = [];
    // the stream
    out.push(H.text(CX0, 14, "reference stream", { size: 10.5, anchor: "start", color: MUTED }));
    out.push(H.text(352, 14, st.i < 0 ? "no reference yet" : "reference " + (st.i + 1) + " of 12", { size: 10.5, anchor: "end", weight: 700 }));
    STREAM.forEach(function (p, k) {
      var x = CX0 + k * (CW + CG), cur = k === st.i, past = k < st.i;
      var res = k <= st.i ? st.hm[k] : null;
      var fill = cur ? "rgba(64,81,181,.16)" : res === "H" ? "rgba(42,122,107,.13)" : res === "M" ? "rgba(178,58,72,.10)" : "var(--md-code-bg-color)";
      out.push(H.text(x + CW / 2, 30, String(k + 1), { size: 10, color: MUTED }));
      out.push(H.box(x, CY, CW, CH, { r: 4, fill: fill, stroke: cur ? "#4051b5" : "var(--md-default-fg-color--lighter)", sw: cur ? 2.4 : 1 }));
      out.push(H.text(x + CW / 2, CY + 19, String(p), { size: 14, weight: 700, mono: true, color: past ? MUTED : "var(--md-default-fg-color)" }));
      if (res) out.push(H.text(x + CW / 2, CY + CH + 13, res, { size: 10, weight: 700, color: res === "H" ? GOOD : BAD, cls: cur ? "anim-pop" : "" }));
    });
    out.push(H.text(178, 14, "H = hit, M = miss", { size: 10, color: MUTED }));

    // the queue
    var gw = st.N * SW + (st.N - 1) * SG, gx = QX + (QW - gw) / 2;
    function sx(j) { return gx + j * (SW + SG); }
    out.push(H.box(QX, QY, QW, QH, { r: 12, stroke: "var(--md-default-fg-color--light)", sw: 1.8 }));
    out.push(H.text(QX + QW / 2, QY + QH + 15, "the cache: one FIFO queue, " + st.N + " frames", { size: 11, weight: 700 }));
    for (var j = 0; j < st.N; j++) {
      var pg = st.q[j], isNew = pg !== undefined && !st.hit && pg === st.page && j === st.q.length - 1, isHit = st.hit && pg === st.page;
      out.push(H.box(sx(j), SY, SW, SH, { r: 7, fill: isNew ? "rgba(232,178,58,.32)" : isHit ? "rgba(42,122,107,.16)" : "var(--md-code-bg-color)", stroke: isNew ? NEW : isHit ? GOOD : "transparent", sw: 1.8, cls: isNew ? "anim-new" : "" }));
      if (pg !== undefined) out.push(H.text(sx(j) + SW / 2, SY + 24, String(pg), { size: 18, weight: 700, mono: true, cls: isNew ? "anim-pop" : "" }));
      else out.push(H.text(sx(j) + SW / 2, SY + 22, "empty", { size: 10, italic: true, color: MUTED }));
    }
    if (st.q.length) {
      out.push(H.text(sx(0) + SW / 2, SY + SH + 14, "oldest", { size: 10, weight: 700, color: MUTED }));
      if (st.q.length > 1) out.push(H.text(sx(st.q.length - 1) + SW / 2, SY + SH + 14, "newest", { size: 10, color: MUTED }));
    }
    // the evicted page leaves on the left
    if (st.ev) {
      out.push(H.arrow(QX + 2, SY + SH / 2, 54, SY + SH / 2, { color: BAD, sw: 2 }));
      out.push(H.text(30, SY - 6, "evicted", { size: 10.5, weight: 700, color: BAD, cls: "anim-pop" }));
      out.push('<g class="anim-pop">' + H.box(16, SY + 4, 28, 28, { r: 6, fill: "rgba(178,58,72,.14)", stroke: BAD, sw: 1.6 }) +
               H.text(30, SY + 24, String(st.ev), { size: 16, weight: 700, mono: true, color: BAD }) +
               '<line x1="18" y1="' + (SY + 30) + '" x2="42" y2="' + (SY + 6) + '" style="stroke:' + BAD + ';stroke-width:1.6"/></g>');
    }
    // the main arrow: the current reference to the slot it lands in
    if (st.i >= 0) {
      var cx = CX0 + st.i * (CW + CG) + CW / 2, j2 = st.q.indexOf(st.page), tx = sx(j2) + SW / 2;
      var col = st.hit ? GOOD : BAD;
      var lab = "page " + st.page + ": " + (st.hit ? "hit" : (st.ev ? "miss, evict " + st.ev : "miss"));
      var lw = lab.length * 6.3 + 12, lx = Math.max(lw / 2 + 4, Math.min(356 - lw / 2, (cx + tx) / 2));
      out.push(H.arrow(cx, CY + CH + 18, tx, SY - 2, { color: col, sw: 2.4, label: lab, mono: true, lpos: [lx, 104] }));
    }
    // the running counts
    var y0 = 220;
    out.push(H.box(92, y0, 84, 26, { r: 13, fill: "rgba(178,58,72,.10)", stroke: BAD, sw: 1.2 }));
    out.push(H.text(134, y0 + 17, "misses: " + st.misses, { size: 12, weight: 700, color: BAD, cls: ctx.prev && ctx.prev.state.misses !== st.misses ? "anim-pop" : "" }));
    out.push(H.box(184, y0, 84, 26, { r: 13, fill: "rgba(42,122,107,.10)", stroke: GOOD, sw: 1.2 }));
    out.push(H.text(226, y0 + 17, "hits: " + st.hits, { size: 12, weight: 700, color: GOOD, cls: ctx.prev && ctx.prev.state.hits !== st.hits ? "anim-pop" : "" }));
    return out.join("");
  }

  window.OS_ANIMS.belady = {
    title: "FIFO on Belady's stream: 3 frames against 4",
    interval: 3600,
    threads: ["FIFO"],
    colors: { FIFO: "#4051b5" },
    sceneBox: "0 0 360 252",
    scene: scene,
    code: code,
    codeTitle: "No code: the stream of Figure 5.7 and FIFO's rule as Sections 5.3 and 5.4 state it",
    variants: [
      { key: "f3", label: "3 frames", steps: build(3) },
      { key: "f4", label: "4 frames", steps: build(4) }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
