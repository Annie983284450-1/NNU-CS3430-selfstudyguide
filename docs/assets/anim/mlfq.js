// The multi-level feedback queue, step by step (W06 class 2, Sections 5.2 to 5.4).
// Left: the MLFQ rules as Sections 5.2 and 5.3 state them (Rules 1, 2, 3, 4a, 4b), numbered as the page numbers them;
// the marker sits on the rule in force at each step, labeled with the job it acts on.
// Tab 1 is Figure 5.5 (OSTEP Figure 8.3 left): A (180 ms) sinks Q2, Q1, Q0 in 10 ms slices (as the long job of
// Section 5.3 does); B (20 ms) arrives at 100, runs on Q2 and Q1, and is done at 120; A resumes on Q0.
// Tab 2 is Figure 5.6 (OSTEP Figure 8.3 right): A (175 ms) sinks to Q0; B arrives at 50 and computes 1 ms, then waits
// 5 ms, over and over (25 ms of work), and stays on Q2 by Rule 4b. The strip's B marks are at 50, 56, ..., 194, as
// drawn in Figure 5.6.
// The picture: the three queues Q2 (top) to Q0 as one structure, each job a chip on the queue it is on; the CPU on
// the right with the running job and its allotment; the arrivals on top; the strip of Figures 5.5 and 5.6 below,
// filling in. Each step's action is one arrow: a job entering Q2 (Rule 3), a chip going to the CPU (runs), a chip
// moving down (Rule 4a), or the CPU handing the job back to the same queue (Rule 4b).
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  var code = [
    { n: null, text: "// Rules 1 and 2 (Section 5.2)" },
    { n: 1, text: "if Priority(A) > Priority(B)," },
    { n: null, text: "  A runs and B does not." },
    { n: 2, text: "if Priority(A) = Priority(B)," },
    { n: null, text: "  A and B run in round robin." },
    { n: null, text: " " },
    { n: null, text: "// Rules 3 and 4 (Section 5.3)" },
    { n: 3, text: "a job that enters the system" },
    { n: null, text: "  goes on the topmost queue." },
    { n: "4a", text: "a job that uses up its allotment" },
    { n: null, text: "  while running moves down one queue." },
    { n: "4b", text: "a job that gives up the CPU before its" },
    { n: null, text: "  allotment is up stays where it is," },
    { n: null, text: "  and its allotment is reset; this is" },
    { n: null, text: "  for jobs that stop to wait for a person," },
    { n: null, text: "  which must not be punished for waiting." },
    { n: null, text: " " },
    { n: null, text: "// the allotment: one time slice, 10 ms" }
  ];

  // state: time (shown top left), q {2: [jobs], 1: [...], 0: [...]} (where each job is), wait (a job waiting for I/O,
  // still on its queue), cpu (the running job or null), cpuQ, allot (allotment used by the running job, a string),
  // arrived {A: true, B: true}, done {B: "text"}, g (the strip so far: [job, queue, from ms, to ms]).
  // act: {type: "enter" | "run" | "down" | "stay" | "done", job, from, to, label}
  function S(label, text, o) { o.label = label; o.text = text; return o; }
  function Q(a2, a1, a0) { return { 2: a2, 1: a1, 0: a0 }; }

  // ---- tab 1: a short job arrives (Figure 5.5)
  var g1 = [["A", 2, 0, 10]], g2 = g1.concat([["A", 1, 10, 20]]), g3 = g2.concat([["A", 0, 20, 100]]);
  var g4 = g3.concat([["B", 2, 100, 110]]), g5 = g4.concat([["B", 1, 110, 120]]), g6 = g5.concat([["A", 0, 120, 200]]);
  var JOBS1 = { A: "180 ms, arrives at 0", B: "20 ms, arrives at 100" };
  var shortJob = [
    S("Time 0", "A, a 180 ms job, enters the system. Rule 3 puts it on the topmost queue, Q2.", {
      at: [{ who: "A", line: 3 }],
      state: { time: "0 ms", q: Q(["A"], [], []), cpu: null, arrived: { A: true }, done: {}, g: [] },
      act: { type: "enter", job: "A", label: "Rule 3" } }),
    S("0 to 10", "A is the only job, on the highest queue, so it runs (Rule 1). It runs one 10 ms slice, which is its whole allotment.", {
      at: [{ who: "A", line: 1 }],
      state: { time: "0 to 10 ms", q: Q(["A"], [], []), cpu: "A", cpuQ: 2, allot: "10 of 10 ms", arrived: { A: true }, done: {}, g: g1 },
      act: { type: "run", job: "A", from: 2, label: "runs" } }),
    S("Time 10", "A has used up its allotment while running, so Rule 4a moves it down one queue, to Q1.", {
      at: [{ who: "A", line: "4a" }],
      state: { time: "10 ms", q: Q([], ["A"], []), cpu: "A", cpuQ: 1, allot: "0 of 10 ms", arrived: { A: true }, done: {}, g: g1 },
      act: { type: "down", job: "A", from: 2, to: 1, label: "Rule 4a: down" } }),
    S("10 to 20", "A runs one more 10 ms slice, now on Q1, and uses that allotment too.", {
      at: [{ who: "A", line: 1 }],
      state: { time: "10 to 20 ms", q: Q([], ["A"], []), cpu: "A", cpuQ: 1, allot: "10 of 10 ms", arrived: { A: true }, done: {}, g: g2 },
      act: { type: "run", job: "A", from: 1, label: "runs" } }),
    S("Time 20", "Rule 4a moves A down again, to Q0, the bottom queue.", {
      at: [{ who: "A", line: "4a" }],
      state: { time: "20 ms", q: Q([], [], ["A"]), cpu: "A", cpuQ: 0, allot: "bottom queue", arrived: { A: true }, done: {}, g: g2 },
      act: { type: "down", job: "A", from: 1, to: 0, label: "Rule 4a: down" } }),
    S("20 to 100", "A runs on Q0. By time 100 it has sunk to Q0, as the long job of Section 5.3 did.", {
      at: [{ who: "A", line: 1 }],
      state: { time: "20 to 100 ms", q: Q([], [], ["A"]), cpu: "A", cpuQ: 0, allot: "bottom queue", arrived: { A: true }, done: {}, g: g3 },
      act: { type: "run", job: "A", from: 0, label: "runs" } }),
    S("Time 100", "B arrives: a 20 ms job. Rule 3 puts it on Q2.", {
      at: [{ who: "B", line: 3 }],
      state: { time: "100 ms", q: Q(["B"], [], ["A"]), cpu: "A", cpuQ: 0, allot: "bottom queue", arrived: { A: true, B: true }, done: {}, g: g3 },
      act: { type: "enter", job: "B", label: "Rule 3" } }),
    S("100 to 110", "Rule 1 says Q2 beats Q0, so B runs at once and A waits. B's response time is 0. B uses one slice.", {
      at: [{ who: "B", line: 1 }],
      state: { time: "100 to 110 ms", q: Q(["B"], [], ["A"]), cpu: "B", cpuQ: 2, allot: "10 of 10 ms", arrived: { A: true, B: true }, done: {}, g: g4, resp: true },
      act: { type: "run", job: "B", from: 2, label: "runs" } }),
    S("Time 110", "B has used its allotment, so Rule 4a drops it to Q1.", {
      at: [{ who: "B", line: "4a" }],
      state: { time: "110 ms", q: Q([], ["B"], ["A"]), cpu: "B", cpuQ: 1, allot: "0 of 10 ms", arrived: { A: true, B: true }, done: {}, g: g4, resp: true },
      act: { type: "down", job: "B", from: 2, to: 1, label: "Rule 4a: down" } }),
    S("110 to 120", "Q1 still beats Q0 (Rule 1), so B uses one more slice.", {
      at: [{ who: "B", line: 1 }],
      state: { time: "110 to 120 ms", q: Q([], ["B"], ["A"]), cpu: "B", cpuQ: 1, allot: "10 of 10 ms", arrived: { A: true, B: true }, done: {}, g: g5, resp: true },
      act: { type: "run", job: "B", from: 1, label: "runs" } }),
    S("Time 120", "B is done at 120, before it can reach the bottom. Its turnaround is 20, exactly what shortest-job-first would have done for B.", {
      at: [],
      state: { time: "120 ms", q: Q([], [], ["A"]), cpu: null, arrived: { A: true, B: true }, done: { B: "done at 120" }, g: g5, resp: true, turn: true },
      act: { type: "done", job: "B", from: 1, label: "done" },
      event: "The scheduler never knew B was short; it assumed so, and B proved it right by finishing.", eventKind: "good" }),
    S("120 to 200", "A waited those 20 ms and then resumes on Q0. Its 180 ms are done at 200: 10 on Q2, 10 on Q1, and 160 on Q0.", {
      at: [{ who: "A", line: 1 }],
      state: { time: "120 to 200 ms", q: Q([], [], ["A"]), cpu: "A", cpuQ: 0, allot: "bottom queue", arrived: { A: true, B: true }, done: { B: "done at 120" }, g: g6, resp: true, turn: true },
      act: { type: "run", job: "A", from: 0, label: "runs" } })
  ];

  // ---- tab 2: an I/O-bound job (Figure 5.6)
  var h1 = [["A", 2, 0, 10]], h2 = h1.concat([["A", 1, 10, 20]]), h3 = h2.concat([["A", 0, 20, 50]]);
  var h4 = h3.concat([["B", 2, 50, 51]]), h5 = h4.concat([["A", 0, 51, 56]]), h6 = h5.concat([["B", 2, 56, 57]]);
  var hAll = h3.slice();
  for (var k = 0; k < 25; k++) { hAll.push(["B", 2, 50 + 6 * k, 51 + 6 * k]); hAll.push(["A", 0, 51 + 6 * k, k === 24 ? 200 : 56 + 6 * k]); }
  var JOBS2 = { A: "175 ms, arrives at 0", B: "25 ms, 1 ms at a time; arrives at 50" };
  var ioJob = [
    S("Time 0", "A, with 175 ms of work, enters the system. Rule 3 puts it on Q2.", {
      at: [{ who: "A", line: 3 }],
      state: { time: "0 ms", q: Q(["A"], [], []), cpu: null, arrived: { A: true }, done: {}, g: [] },
      act: { type: "enter", job: "A", label: "Rule 3" } }),
    S("Time 10", "As in the first tab, A runs one 10 ms slice on Q2 and uses its allotment, so Rule 4a moves it to Q1.", {
      at: [{ who: "A", line: "4a" }],
      state: { time: "10 ms", q: Q([], ["A"], []), cpu: "A", cpuQ: 1, allot: "0 of 10 ms", arrived: { A: true }, done: {}, g: h1 },
      act: { type: "down", job: "A", from: 2, to: 1, label: "Rule 4a: down" } }),
    S("Time 20", "A uses its allotment on Q1 as well, from 10 to 20, and Rule 4a moves it to Q0.", {
      at: [{ who: "A", line: "4a" }],
      state: { time: "20 ms", q: Q([], [], ["A"]), cpu: "A", cpuQ: 0, allot: "bottom queue", arrived: { A: true }, done: {}, g: h2 },
      act: { type: "down", job: "A", from: 1, to: 0, label: "Rule 4a: down" } }),
    S("20 to 50", "A runs on Q0, the only job in the system.", {
      at: [{ who: "A", line: 1 }],
      state: { time: "20 to 50 ms", q: Q([], [], ["A"]), cpu: "A", cpuQ: 0, allot: "bottom queue", arrived: { A: true }, done: {}, g: h3 },
      act: { type: "run", job: "A", from: 0, label: "runs" } }),
    S("Time 50", "B arrives with 25 ms of work that it does 1 ms at a time, waiting 5 ms for some device after each, like a program waiting for keys. Rule 3 puts it on Q2.", {
      at: [{ who: "B", line: 3 }],
      state: { time: "50 ms", q: Q(["B"], [], ["A"]), cpu: "A", cpuQ: 0, allot: "bottom queue", arrived: { A: true, B: true }, done: {}, g: h3 },
      act: { type: "enter", job: "B", label: "Rule 3" } }),
    S("50 to 51", "Q2 beats Q0 (Rule 1), so B runs at once. Its response time is 0. It computes for 1 ms.", {
      at: [{ who: "B", line: 1 }],
      state: { time: "50 to 51 ms", q: Q(["B"], [], ["A"]), cpu: "B", cpuQ: 2, allot: "1 of 10 ms", arrived: { A: true, B: true }, done: {}, g: h4, resp: true },
      act: { type: "run", job: "B", from: 2, label: "runs" } }),
    S("Time 51", "B gives up the CPU after 1 ms to wait 5 ms, long before its 10 ms allotment. Rule 4b keeps it on Q2 and resets its allotment.", {
      at: [{ who: "B", line: "4b" }],
      state: { time: "51 ms", q: Q(["B"], [], ["A"]), wait: "B", cpu: null, cpuQ: 2, allot: "0 of 10 ms", arrived: { A: true, B: true }, done: {}, g: h4, resp: true },
      act: { type: "stay", job: "B", label: "Rule 4b: stays" } }),
    S("51 to 56", "While B waits, A fills the gap on Q0.", {
      at: [{ who: "A", line: 1 }],
      state: { time: "51 to 56 ms", q: Q(["B"], [], ["A"]), wait: "B", cpu: "A", cpuQ: 0, allot: "bottom queue", arrived: { A: true, B: true }, done: {}, g: h5, resp: true },
      act: { type: "run", job: "A", from: 0, label: "runs" } }),
    S("56 to 57", "B's wait ends, and it runs immediately, ahead of A on Q0 (Rule 1). Another 1 ms.", {
      at: [{ who: "B", line: 1 }],
      state: { time: "56 to 57 ms", q: Q(["B"], [], ["A"]), cpu: "B", cpuQ: 2, allot: "1 of 10 ms", arrived: { A: true, B: true }, done: {}, g: h6, resp: true },
      act: { type: "run", job: "B", from: 2, label: "runs" } }),
    S("Over and over", "The same thing, over and over: B computes 1 ms and gives up the CPU, Rule 4b keeps it on Q2 for good, and A fills the gaps on Q0. The strip shows B as a comb of thin marks along the top row.", {
      at: [{ who: "B", line: "4b" }],
      state: { time: "57 to 200 ms", q: Q(["B"], [], ["A"]), cpu: null, cpuNote: ["B: 1 ms,", "A: the gaps,", "over and over"], arrived: { A: true, B: true }, done: {}, g: hAll, resp: true },
      act: { type: "stay", job: "B", label: "Rule 4b: stays" },
      event: "Whenever B has something to do, it goes first: what an interactive job needs.", eventKind: "good" })
  ];

  // ---- the scene
  var MUTED = "var(--md-default-fg-color--light)", YEL = "rgba(232,178,58,.30)", YELS = "#e8b23a";
  var GREEN = "#2a7a6b", WARN = "#a0632a";
  var QB = { x: 6, y: 70, w: 236, h: 138 };                       // the queues structure
  var ROWY = { 2: 94, 1: 132, 0: 170 }, ROWH = 30;               // row tops
  var LANE = 44;                                                 // lane left edge
  var CHIPX = { A: 74, B: 122 };
  var CPU = { x: 252, y: 70, w: 102, h: 138 };
  var GX = 34, GW = 312, GY = 230, GR = 24;                      // the strip: left, width, top, row pitch
  function gx(ms) { return GX + ms * GW / 200; }
  function rowMid(q) { return ROWY[q] + ROWH / 2; }

  function scene(s, H, ctx) {
    var c = ctx.col, st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    var jobs = ctx.variant === "io" ? JOBS2 : JOBS1;
    var a = s.act || {};
    // the clock and the arrivals
    out.push(H.box(6, 6, 108, 52, { r: 8, stroke: MUTED, sw: 1.2, fill: "var(--md-code-bg-color)" }));
    out.push(H.text(14, 23, "time", { size: 10, anchor: "start", color: MUTED }));
    out.push(H.text(14, 45, st.time, { size: st.time.length > 9 ? 11.5 : 14, weight: 700, anchor: "start", mono: true }));
    ["A", "B"].forEach(function (j, i) {
      var y = 20 + i * 26, here = st.arrived[j], x = 132;
      out.push('<g style="opacity:' + (here ? 1 : 0.45) + '">' + H.chip(x, y, j, c(j)) +
               H.text(x + 18, y + 4, jobs[j], { size: 10.5, anchor: "start", color: here ? "var(--md-default-fg-color)" : MUTED }) + '</g>');
      if (st.done[j]) out.push(H.text(352, y + 4, "✓ " + st.done[j], { size: 10.5, weight: 700, anchor: "end", color: GREEN, cls: pv.done[j] ? "" : "anim-pop" }));
    });
    // the queues
    out.push(H.box(QB.x, QB.y, QB.w, QB.h, { r: 10, stroke: MUTED, sw: 1.8 }));
    out.push(H.text(14, 86, "MLFQ, 10 ms slices", { size: 11.5, weight: 700, anchor: "start" }));
    [2, 1, 0].forEach(function (q) {
      var y = ROWY[q];
      out.push(H.text(14, y + 20, "Q" + q, { size: 12.5, weight: 700, anchor: "start" }));
      out.push(H.box(LANE, y, 190, ROWH, { r: 5, fill: "var(--md-code-bg-color)", stroke: "transparent" }));
      st.q[q].forEach(function (j) {
        var moved = !pv.q[q] || pv.q[q].indexOf(j) < 0, waiting = st.wait === j, x = CHIPX[j];
        if (waiting) {
          out.push(H.box(x - 12, y + 5, 24, 20, { r: 5, fill: "var(--md-default-bg-color)", stroke: c(j), sw: 1.6, dash: true }));
          out.push(H.text(x, y + 19.5, j, { size: 11.5, weight: 700, color: c(j) }));
          out.push(H.text(x + 18, y + 19.5, "waits 5 ms", { size: 10, anchor: "start", italic: true, color: MUTED }));
        } else {
          out.push(H.chip(x, y + 15, j, c(j), { cls: moved && ctx.prev ? "anim-pop" : "" }));
          if (st.cpu === j) out.push(H.box(x - 15, y + 2, 30, 26, { r: 6, fill: "transparent", stroke: c(j), sw: 1.6 }));
        }
      });
    });
    // the CPU
    out.push(H.box(CPU.x, CPU.y, CPU.w, CPU.h, { r: 10, stroke: MUTED, sw: 1.8 }));
    out.push(H.text(CPU.x + 10, CPU.y + 18, "CPU", { size: 13, weight: 700, anchor: "start" }));
    var cx = CPU.x + CPU.w / 2;
    if (st.cpu) {
      out.push(H.chip(cx, CPU.y + 44, st.cpu, c(st.cpu), { cls: pv.cpu !== st.cpu ? "anim-pop" : "" }));
      out.push(H.text(cx, CPU.y + 70, "on Q" + st.cpuQ, { size: 11, weight: 700 }));
    } else if (st.cpuNote) out.push(H.lines(cx, CPU.y + 44, st.cpuNote, { size: 10.5, italic: true, color: MUTED, lh: 14 }));
    else out.push(H.text(cx, CPU.y + 50, st.wait ? "B left it" : "idle", { size: 11, italic: true, color: MUTED }));
    if (st.allot) {
      var ach = pv.allot !== st.allot || pv.cpu !== st.cpu;
      out.push(H.text(cx, CPU.y + 96, st.allot === "bottom queue" ? "lowest queue" : "allotment used", { size: 10, color: MUTED }));
      out.push(H.box(CPU.x + 6, CPU.y + 103, CPU.w - 12, 22, { r: 5, fill: ach ? YEL : "var(--md-code-bg-color)", stroke: ach ? YELS : "transparent", sw: 1.2, cls: ach ? "anim-new" : "" }));
      out.push(H.text(cx, CPU.y + 118, st.allot === "bottom queue" ? "no lower one" : st.allot, { size: 11, weight: 700, mono: st.allot !== "bottom queue" }));
    }
    // the strip (Figures 5.5 and 5.6)
    out.push(H.text(6, GY - 8, ctx.variant === "io" ? "the strip (Figure 5.6)" : "the strip (Figure 5.5)", { size: 10.5, anchor: "start", color: MUTED }));
    [2, 1, 0].forEach(function (q, i) {
      var y = GY + i * GR;
      out.push(H.text(8, y + 15, "Q" + q, { size: 10.5, weight: 700, anchor: "start" }));
      out.push(H.box(GX, y, GW, GR - 4, { r: 2, fill: "var(--md-code-bg-color)", stroke: "var(--md-default-fg-color--lightest)", sw: 1 }));
    });
    var pn = (pv.g || []).length;
    st.g.forEach(function (seg, i) {
      var y = GY + (2 - seg[1]) * GR, x0 = gx(seg[2]), w = Math.max(gx(seg[3]) - x0, 1.6);
      var isNew = ctx.prev && i >= pn;
      out.push('<g' + (isNew ? ' class="anim-new"' : '') + '>' + H.box(x0, y + 1, w - (w > 4 ? 0.6 : 0), GR - 6, { r: 1, fill: c(seg[0]), stroke: c(seg[0]), sw: 0.4 }) +
               (w > 16 ? H.text(x0 + w / 2, y + 15, seg[0], { size: 10.5, weight: 700, color: "#fff" }) : "") + '</g>');
    });
    var ay = GY + 3 * GR;
    out.push('<path d="M' + GX + ',' + ay + ' L' + (GX + GW) + ',' + ay + '" style="stroke:' + MUTED + ';stroke-width:1.2"/>');
    [0, 50, 100, 150, 200].forEach(function (t) {
      out.push('<path d="M' + gx(t) + ',' + (ay - 3) + ' L' + gx(t) + ',' + (ay + 4) + '" style="stroke:' + MUTED + ';stroke-width:1.2"/>');
      out.push(H.text(gx(t), ay + 16, String(t), { size: 10, color: MUTED }));
    });
    out.push(H.text(GX + GW, ay + 28, "ms", { size: 10, anchor: "end", color: MUTED }));
    // the results the page gives
    var res = [];
    if (st.resp) res.push("B: response 0");
    if (st.turn) res.push("turnaround 20");
    if (res.length) out.push(H.text(6, ay + 28, res.join(", "), { size: 11, weight: 700, anchor: "start", color: GREEN }));

    // the action of this step
    var col = c(a.job || "A");
    if (a.type === "enter") {
      var ex = CHIPX[a.job], ey = a.job === "A" ? 20 : 46;
      out.push(H.arrow(a.job === "A" ? 122 : 132, ey + 10, ex + (a.job === "A" ? 8 : 0), ROWY[2] + 3, { color: col, sw: 2.4, bend: [a.job === "A" ? -8 : 0, 0], label: a.label, lpos: [190, 84] }));
    }
    if (a.type === "run") {
      var sx = CHIPX[a.job] + 14, sy = rowMid(a.from), tx = CPU.x - 2, ty = CPU.y + 44;
      var lx = 196, ly = sy + (ty - sy) * (lx - sx) / (tx - sx);
      out.push(H.arrow(sx, sy, tx, ty, { color: col, sw: 2.6, label: a.label, lpos: [lx, ly] }));
    }
    if (a.type === "down") {
      var dx = CHIPX[a.job];
      out.push(H.arrow(dx - 16, rowMid(a.from), dx - 16, rowMid(a.to) - 4, { color: WARN, sw: 2.6, bend: [-14, 0], label: a.label, lpos: [174, (rowMid(a.from) + rowMid(a.to)) / 2] }));
    }
    if (a.type === "stay") {
      out.push(H.arrow(CPU.x - 2, CPU.y + 40, CHIPX[a.job] + 4, ROWY[2] + 3, { color: GREEN, sw: 2.6, bend: [0, -22], label: a.label, lpos: [190, 84] }));
    }
    if (a.type === "done") {
      var bx = CHIPX[a.job], by = ROWY[a.from];
      out.push(H.box(bx - 12, by + 5, 24, 20, { r: 5, fill: "var(--md-default-bg-color)", stroke: col, sw: 1.4, dash: true }));
      out.push(H.text(bx, by + 19.5, a.job, { size: 11.5, weight: 700, color: col }));
      out.push(H.arrow(bx + 4, by + 4, 132, 58, { color: GREEN, sw: 2.4, label: a.label, lpos: [176, by - 22] }));
    }
    return out.join("");
  }

  window.OS_ANIMS.mlfq = {
    title: "MLFQ, step by step: a short job, and an I/O-bound job (Figure 8.3)",
    interval: 4200,
    threads: ["A", "B"],
    colors: { A: "#1f3a68", B: "#0f7c87" },
    sceneBox: "0 0 360 352",
    scene: scene,
    code: code,
    codeTitle: "The MLFQ rules, as Sections 5.2 and 5.3 state them",
    variants: [
      { key: "short", label: "A short job arrives", steps: shortJob },
      { key: "io", label: "An I/O-bound job", steps: ioJob }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
