// Stride scheduling, one turn at a time (W07 class 1, Sections 1.6 and 1.7).
// Jobs, tickets and steps as Section 1.6 computes them: A 100 tickets, step 10000 / 100 = 100; B 50, step 200;
// C 250, step 40. One step per row of the table of Section 1.7 (OSTEP Figure 9.3 in full; rows 1 to 4 are the table of
// Section 1.6): the counters before the turn, and who runs. Ties go as the page says (turn 1: A; turn 2: B).
// The last step is Section 1.7's count for one cycle: A 2, B 1, C 5, all counters level at 200.
// The page prints no stride code, so the code panel holds the page's four rule sentences, numbered as the page numbers
// them.
// The picture: the CPU on top; the three jobs as one structure, each a column with its counter as a bar (the step a turn
// adds in yellow), the lowest marked, a run-count row; the slices of the lap in order along the bottom.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  var code = [
    { n: null, text: "every turn the scheduler does the same four things:" },
    { n: 1, text: "Find the job with the lowest counter." },
    { n: 2, text: "Run it for one time slice." },
    { n: 3, text: "Add its step to its counter." },
    { n: 4, text: "Put it back and decide again." }
  ];

  var STEP = { A: 100, B: 200, C: 40 }, TIX = { A: 100, B: 50, C: 250 };
  // the table: counters before the turn, and who runs
  var ROWS = [
    [1, 0, 0, 0, "A"], [2, 100, 0, 0, "B"], [3, 100, 200, 0, "C"], [4, 100, 200, 40, "C"],
    [5, 100, 200, 80, "C"], [6, 100, 200, 120, "A"], [7, 200, 200, 120, "C"], [8, 200, 200, 160, "C"]
  ];
  var TEXT = {
    1: "All three counters are 0, a tie. A tie can go to any of them; say A. A runs one slice, and A's counter becomes 0 + 100 = 100.",
    2: "The lowest counter is 0, and B and C share it: another tie, and this time B goes. B's counter jumps by its step: 0 + 200 = 200, a big jump, because B holds few tickets.",
    3: "C is the only job still at 0, so C is the lowest, no tie. C's counter grows by only 40, the smallest step, because C holds the most tickets: 0 + 40 = 40.",
    4: "C is at 40, which is below A at 100 and below B at 200, so C goes again: 40 + 40 = 80.",
    5: "C at 80 is still the lowest, so C runs and climbs to 120.",
    6: "Now A at 100 is the lowest, so A runs and climbs to 200.",
    7: "C at 120 is the lowest, so C runs and climbs to 160.",
    8: "C at 160 is still below 200, so C runs and climbs to 200."
  };

  var steps = [{
    label: "Start",
    text: "Three jobs: A with 100 tickets, B with 50, C with 250. Each step is 10000 divided by the tickets: A 100, B 200, C 40. All counters start at 0.",
    at: [],
    state: { before: { A: 0, B: 0, C: 0 }, after: { A: 0, B: 0, C: 0 }, run: null, ran: { A: 0, B: 0, C: 0 }, slices: [] },
    acts: []
  }];
  var ran = { A: 0, B: 0, C: 0 }, slices = [];
  ROWS.forEach(function (r) {
    var before = { A: r[1], B: r[2], C: r[3] }, who = r[4];
    var after = { A: r[1], B: r[2], C: r[3] };
    after[who] += STEP[who];
    ran = Object.assign({}, ran); ran[who] += 1;
    slices = slices.concat([who]);
    var low = Math.min(r[1], r[2], r[3]);
    var tie = ["A", "B", "C"].filter(function (j) { return before[j] === low; });
    steps.push({
      label: "Turn " + r[0],
      text: TEXT[r[0]],
      at: [{ who: who, line: 1 }, { who: who, line: 3 }],
      cpu: who,
      state: { before: before, after: after, run: who, low: tie, ran: ran, slices: slices, turn: r[0] },
      acts: [{ from: "cpu", to: who, label: "+" + STEP[who] }],
      event: tie.length > 1 ? "Tie at " + low + ": " + tie.join(" and ") + ". " + who + " goes." : null,
      eventKind: "info"
    });
  });
  steps.push({
    label: "One cycle",
    text: "All three counters sit at 200, so one cycle is over and the pattern repeats. A ran 2 turns, B 1 and C 5: the tickets 100, 50 and 250 divided by 50 read 2, 1 and 5.",
    at: [{ who: "lap", line: 4 }],
    state: { before: { A: 200, B: 200, C: 200 }, after: { A: 200, B: 200, C: 200 }, run: null, ran: ran, slices: slices, level: true },
    acts: [],
    event: "Turns 2 : 1 : 5, exactly the ticket ratio, every lap.", eventKind: "good"
  });

  // ---- the scene
  var MUTED = "var(--md-default-fg-color--light)", YEL = "#e8b23a", GREEN = "#2a7a6b";
  var COLX = { A: 70, B: 180, C: 290 }, BW = 46;        // column centers, bar width
  var BASE = 252, SC = 0.5;                             // bar baseline, px per counter unit (200 -> 100 px)
  var QY = 78;                                          // top of the jobs box

  function scene(s, H, ctx) {
    var c = ctx.col, st = s.state, pv = ctx.prev ? ctx.prev.state : null, out = [];
    // the CPU
    out.push(H.box(110, 6, 140, 44, { r: 10, stroke: "var(--md-default-fg-color--light)", sw: 1.6 }));
    out.push(H.text(122, 25, "CPU", { size: 12, weight: 700, anchor: "start" }));
    out.push(H.text(122, 41, "one time slice", { size: 10, anchor: "start", color: MUTED }));
    if (st.run) out.push(H.chip(222, 28, st.run, c(st.run), { cls: "anim-pop" }));
    else out.push(H.text(222, 32, "-", { size: 13, color: MUTED }));

    // the three jobs, one structure
    out.push(H.box(6, QY, 348, 228, { r: 12, stroke: "var(--md-default-fg-color--light)", sw: 1.6 }));
    if (st.level) {
      var ly = BASE - 200 * SC;
      out.push('<path d="M20,' + ly + ' L340,' + ly + '" style="stroke:' + GREEN + ';stroke-width:1.6;fill:none" stroke-dasharray="5 4" class="anim-new"/>');
    }
    ["A", "B", "C"].forEach(function (j) {
      var x = COLX[j], col = c(j), runs = st.run === j;
      var b = st.before[j], a = st.after[j];
      out.push(H.text(x, QY + 30, "job " + j, { size: 12.5, weight: 700, color: col }));
      out.push(H.text(x, QY + 45, TIX[j] + " tickets, step " + STEP[j], { size: 10, color: MUTED }));
      // the bar: the counter before the turn, and the step this turn adds
      out.push(H.box(x - BW / 2, BASE - 200 * SC, BW, 200 * SC, { r: 3, fill: "var(--md-code-bg-color)", stroke: "transparent" }));
      if (b > 0) out.push(H.box(x - BW / 2, BASE - b * SC, BW, b * SC, { r: 3, fill: col, stroke: "transparent" }));
      if (a > b) out.push(H.box(x - BW / 2, BASE - a * SC, BW, (a - b) * SC, { r: 3, fill: "rgba(232,178,58,.85)", stroke: YEL, sw: 1.4, cls: "anim-new" }));
      if (runs) out.push(H.box(x - BW / 2 - 3, BASE - Math.max(a, 4) * SC - 3, BW + 6, Math.max(a, 4) * SC + 3, { r: 4, fill: "none", stroke: col, sw: 2.4 }));
      // the counter's value
      var vy = BASE - Math.max(a, b) * SC - 6;
      out.push(H.text(x, vy, a > b ? b + " → " + a : String(a), { size: 12, weight: 700, mono: true, cls: a > b ? "anim-pop" : "" }));
      // lowest mark, under the bar
      if (st.low && st.low.indexOf(j) >= 0) {
        var tieTxt = st.low.length > 1 ? "lowest (tie)" : "lowest";
        out.push(H.box(x - 40, BASE + 6, 80, 18, { r: 9, fill: runs ? "rgba(42,122,107,.16)" : "var(--md-default-bg-color)", stroke: runs ? GREEN : MUTED, sw: 1.2 }));
        out.push(H.text(x, BASE + 19, tieTxt, { size: 10.5, weight: 700, color: runs ? GREEN : MUTED }));
      }
      // run count
      var rc = st.ran[j], rch = pv && pv.ran[j] !== rc;
      out.push(H.box(x - 40, BASE + 30, 80, 20, { r: 5, fill: rch ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: rch ? YEL : "transparent", sw: 1.4, cls: rch ? "anim-new" : "" }));
      out.push(H.text(x, BASE + 44, "ran " + rc + (rc === 1 ? " turn" : " turns"), { size: 11, weight: 700 }));
    });

    // the slices of the lap, in order
    out.push(H.text(8, 328, "slices", { size: 10.5, anchor: "start", color: MUTED }));
    for (var i = 0; i < 8; i++) {
      var w = st.slices[i], x0 = 50 + i * 38;
      var isNew = pv && w && !pv.slices[i];
      out.push(H.box(x0, 314, 34, 20, { r: 4, fill: w ? c(w) : "var(--md-code-bg-color)", stroke: "transparent", cls: isNew ? "anim-pop" : "" }));
      if (w) out.push(H.text(x0 + 17, 328, w, { size: 11, weight: 700, color: "#fff", cls: isNew ? "anim-pop" : "" }));
    }

    // the action: the CPU runs the lowest job, and its counter grows by its step
    (s.acts || []).forEach(function (a) {
      var x = COLX[a.to], col = c(a.to);
      var fx = x < 180 ? 140 : x > 180 ? 220 : 180;
      out.push(H.arrow(fx, 52, x, QY + 16, { color: col, sw: 2.4, label: "runs, " + a.label, mono: true, lpos: [x < 180 ? 70 : x > 180 ? 290 : 180, 64] }));
    });
    return out.join("");
  }

  window.OS_ANIMS.stride = {
    title: "Stride scheduling: one cycle, turn by turn",
    interval: 3800,
    threads: ["A", "B", "C", "lap"],
    colors: { A: "#1f3a68", B: "#0e7c86", C: "#b5520b", lap: GREEN },
    sceneBox: "0 0 360 340",
    scene: scene,
    code: code,
    codeTitle: "The rule of stride, in words (Section 1.6; the page prints no code)",
    variants: [{ key: "lap", label: "One cycle", steps: steps }]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
