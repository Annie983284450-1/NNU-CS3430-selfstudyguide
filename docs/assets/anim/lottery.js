// The lottery decision, one list node at a time (W07 class 1, Sections 1.2 to 1.4).
// Code: OSTEP Figure 9.1 exactly as Section 1.4 prints it, lines 1 to 16.
// Jobs: Section 1.3's three jobs, A 100 tickets, B 50, C 250 (400 in all), in the list order of Figure 1.6.
// Tab 1 is Section 1.3's table (the draw 300). Tabs 2 to 7 are the six draws of Figure 1.5 that Section 1.3 walks
// one by one (48, 366, 58, 172, 115, 391); their per-node counter values are the block ends the page gives
// (after A 100, after B 150, after C 400).
// The picture: the job list on top (head, A, B, C, NULL) with the current node highlighted; under it the 400 tickets
// as one strip split into the three blocks, the counter as a bar growing under the strip, and the winner as a red line
// through both; the walk's variables at the bottom. Each step's arrow runs from the current node to its block.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  var L = [
    [1, "// counter: used to track if we’ve found the winner yet"],
    [2, "int counter = 0;"],
    [3, ""],
    [4, "// winner: use some call to a random number generator to"],
    [5, "//         get a value >= 0 and <= (totaltickets - 1)"],
    [6, "int winner = getrandom(0, totaltickets);"],
    [7, ""],
    [8, "// current: use this to walk through the list of jobs"],
    [9, "node_t *current = head;"],
    [10, "while (current) {"],
    [11, "    counter = counter + current->tickets;"],
    [12, "    if (counter > winner)"],
    [13, "        break; // found the winner"],
    [14, "    current = current->next;"],
    [15, "}"],
    [16, "// ’current’ is the winner: schedule it..."]
  ];
  var code = L.map(function (x) { return { n: x[0], text: x[1] }; });

  var JOBS = [{ n: "A", t: 100, lo: 0 }, { n: "B", t: 50, lo: 100 }, { n: "C", t: 250, lo: 150 }];
  var ENDS = { A: 100, B: 150, C: 400 };

  // the steps of one walk, for the drawn number w; intro = the first caption sentence
  function walk(w, intro) {
    var steps = [];
    steps.push({
      label: "Draw",
      text: intro + " Line 6 draws " + w + ". The counter starts at 0 (line 2), and current points at the head of the list, A (line 9).",
      at: [{ who: "draw", line: 6 }, { who: "A", line: 9 }],
      state: { w: w, counter: 0, cur: "A", seen: [], done: false, check: null, win: null },
      acts: [{ kind: "draw" }]
    });
    var counter = 0, seen = [];
    for (var i = 0; i < JOBS.length; i++) {
      var j = JOBS[i], before = counter;
      counter += j.t;
      seen = seen.concat([j.n]);
      var past = counter > w;
      var next = JOBS[i + 1] ? JOBS[i + 1].n : null;
      steps.push({
        label: "Node " + j.n,
        text: "Line 11 adds " + j.n + "'s " + j.t + " tickets: counter = " + before + " + " + j.t + " = " + counter + ". " +
          (past ? counter + " is greater than " + w + " (line 12), so line 13 breaks out of the loop with current on " + j.n + "."
                : counter + " is not greater than " + w + " (line 12), so current moves on to " + next + " (line 14)."),
        at: [{ who: j.n, line: 11 }, { who: j.n, line: 12 }, { who: j.n, line: past ? 13 : 14 }],
        state: { w: w, counter: counter, before: before, cur: j.n, seen: seen, done: false, check: past, win: null },
        acts: [{ kind: "add", from: j.n, label: "line 11: +" + j.t }],
        event: past ? "counter " + counter + " > winner " + w + ": stop at " + j.n + "." : "counter " + counter + " is not past " + w + ": keep walking.",
        eventKind: past ? "good" : "info"
      });
      if (past) {
        steps.push({
          label: "Winner",
          text: "current points at " + j.n + ", so " + j.n + " holds ticket " + w + ". " + j.n + " runs for the whole time slice (line 16), and the next slice starts with a fresh draw.",
          at: [{ who: j.n, line: 16 }],
          state: { w: w, counter: counter, before: counter, cur: j.n, seen: seen, done: true, check: true, win: j.n },
          acts: [],
          event: j.n + " holds ticket " + w + " and runs this slice.", eventKind: "good"
        });
        break;
      }
    }
    return steps;
  }

  var six = [48, 366, 58, 172, 115, 391];
  var ord = ["first", "second", "third", "fourth", "fifth", "sixth"];
  var variants = [{ key: "d300", label: "Draw 300", steps: walk(300, "A holds 100 tickets, B 50 and C 250: 400 in all, so a draw is a number from 0 to 399.") }];
  six.forEach(function (w, i) {
    variants.push({ key: "d" + w, label: "Draw " + w, steps: walk(w, "The " + ord[i] + " of the six draws of Figure 1.5 (the simulator, seed 4).") });
  });

  // ---- the scene
  var MUTED = "var(--md-default-fg-color--light)", RED = "#b23a48", YEL = "#e8b23a";
  var NODE = { A: 58, B: 138, C: 218 }, NW = 64, NY = 32, NH = 44;   // node x, width, top, height
  var X0 = 70, X1 = 340, SC = (X1 - X0) / 400;                       // the ticket strip: 0..400 over X0..X1
  var SY = 160, SH = 26;                                             // strip top, height
  var BY = 196, BH = 16;                                             // counter bar top, height
  function tx(v) { return X0 + v * SC; }

  function scene(s, H, ctx) {
    var c = ctx.col, st = s.state, pv = ctx.prev ? ctx.prev.state : null, out = [];
    // the list: head -> A -> B -> C -> NULL
    out.push(H.text(8, 18, "the job list", { size: 10.5, anchor: "start", color: MUTED }));
    out.push(H.text(24, NY + NH / 2 + 4, "head", { size: 11, weight: 700, mono: true }));
    out.push(H.arrow(42, NY + NH / 2, NODE.A - 2, NY + NH / 2, { color: MUTED, sw: 1.6 }));
    JOBS.forEach(function (j, i) {
      var x = NODE[j.n], on = st.cur === j.n, col = c(j.n), won = st.win === j.n;
      out.push(H.box(x, NY, NW, NH, { r: 8, fill: won ? "rgba(42,122,107,.18)" : on ? "rgba(232,178,58,.18)" : "var(--md-code-bg-color)", stroke: on ? col : "var(--md-default-fg-color--lighter)", sw: on ? 3 : 1.4, cls: won ? "anim-pop" : "" }));
      out.push(H.text(x + NW / 2, NY + 18, "job " + j.n, { size: 12, weight: 700, color: col }));
      out.push(H.text(x + NW / 2, NY + 35, j.t + " tickets", { size: 10.5 }));
      var nx = i < 2 ? NODE[JOBS[i + 1].n] - 2 : 296;
      out.push(H.arrow(x + NW + 1, NY + NH / 2, nx, NY + NH / 2, { color: MUTED, sw: 1.6 }));
    });
    out.push(H.text(299, NY + NH / 2 + 4, "NULL", { size: 11, weight: 700, mono: true, anchor: "start", color: MUTED }));
    // the current pointer
    var cxn = NODE[st.cur] + NW / 2;
    out.push(H.text(cxn, 19, "current", { size: 10.5, weight: 700, mono: true, color: c(st.cur), cls: pv && pv.cur !== st.cur ? "anim-pop" : "" }));
    out.push('<path d="M' + cxn + ',22 L' + cxn + ',' + (NY - 2) + '" style="stroke:' + c(st.cur) + ';stroke-width:1.8;fill:none"/>');
    if (st.win) {
      out.push(H.box(cxn - 50, NY + NH + 6, 100, 20, { r: 10, fill: "rgba(42,122,107,.15)", stroke: "#2a7a6b", cls: "anim-pop" }));
      out.push(H.text(cxn, NY + NH + 20, "runs this slice", { size: 11, weight: 700, color: "#2a7a6b", cls: "anim-pop" }));
    }

    // the ticket strip: one block per job
    out.push(H.text(8, SY + SH / 2 + 4, "tickets", { size: 10.5, anchor: "start", color: MUTED }));
    JOBS.forEach(function (j) {
      var x = tx(j.lo), w = j.t * SC, col = c(j.n), lit = st.seen.indexOf(j.n) >= 0;
      out.push('<rect x="' + x + '" y="' + SY + '" width="' + w + '" height="' + SH + '" style="fill:' + col + ';opacity:' + (lit ? 0.95 : 0.4) + ';stroke:var(--md-default-bg-color);stroke-width:1.5"/>');
    });
    // the counter bar under the strip
    out.push(H.text(8, BY + BH / 2 + 4, "counter", { size: 10.5, anchor: "start", color: MUTED }));
    out.push(H.box(X0, BY, X1 - X0, BH, { r: 3, fill: "var(--md-code-bg-color)", stroke: "transparent" }));
    if (st.counter > 0) {
      var b0 = st.before === undefined ? st.counter : st.before;
      if (b0 > 0) out.push(H.box(X0, BY, b0 * SC, BH, { r: 3, fill: "var(--md-default-fg-color--light)", stroke: "transparent" }));
      if (st.counter > b0) out.push(H.box(tx(b0), BY, (st.counter - b0) * SC, BH, { r: 3, fill: "rgba(232,178,58,.85)", stroke: YEL, sw: 1.2, cls: "anim-new" }));

    }
    out.push(H.text(X0, BY + BH + 12, "0", { size: 10, mono: true, anchor: "start", color: MUTED }));
    // the winner: a red line through strip and bar, its label under them
    var wx = tx(st.w + 0.5);
    out.push('<path d="M' + wx + ',' + SY + ' L' + wx + ',' + (BY + BH + 10) + '" style="stroke:' + RED + ';stroke-width:2.4;fill:none"' + (ctx.step === 0 ? ' class="anim-pop"' : '') + '/>');
    out.push('<polygon points="' + (wx - 5) + ',' + (BY + BH + 12) + ' ' + (wx + 5) + ',' + (BY + BH + 12) + ' ' + wx + ',' + (BY + BH + 2) + '" style="fill:' + RED + '"/>');
    // the counter's value at the end of its bar
    var ctX = Math.min(tx(st.counter), X1) - 4, ctW = String(st.counter).length * 7 + 2;
    if (ctX + 3 > wx && ctX - ctW - 3 < wx) ctX = wx - 5;
    if (st.counter > 0) out.push('<text x="' + ctX + '" y="' + (BY + BH - 4) + '" text-anchor="end" style="font-size:10.5px;font-weight:700;font-family:var(--md-code-font-family);fill:#222;paint-order:stroke;stroke:#f3d48a;stroke-width:3">' + st.counter + '</text>');
    // the block labels, drawn over the winner line with a halo in the block's color
    JOBS.forEach(function (j) {
      var x = tx(j.lo), w = j.t * SC, col = c(j.n), lit = st.seen.indexOf(j.n) >= 0;
      var lab = j.n === "B" ? "B" : j.n === "A" ? "A 0-99" : "C 150-399";
      out.push('<text x="' + (x + w / 2) + '" y="' + (SY + SH / 2 + 4) + '" text-anchor="middle" style="font-size:10.5px;font-weight:700;fill:#fff;paint-order:stroke;stroke:' + col + ';stroke-width:4;stroke-opacity:' + (lit ? 1 : 0.6) + '">' + lab + '</text>');
    });
    var wl = "winner = " + st.w, lw = wl.length * 6.6;
    var lx = Math.max(X0 + lw / 2, Math.min(X1 - lw / 2, wx));
    out.push(H.text(lx, BY + BH + 27, wl, { size: 11, weight: 700, color: RED, cls: ctx.step === 0 ? "anim-pop" : "" }));

    // the walk's variables
    var VY = 252, VH = 66;
    out.push(H.box(6, VY, 348, VH + 10, { r: 10, stroke: "var(--md-default-fg-color--light)", sw: 1.4 }));
    var cells = [
      ["winner", "line 6", String(st.w), false],
      ["counter", "line 11", String(st.counter), pv && pv.counter !== st.counter],
      ["counter > winner", "line 12", st.check === null ? "-" : st.check ? "yes" : "no", pv && pv.check !== st.check && st.check !== null]
    ];
    var CX = [[14, 110], [118, 214], [222, 346]];
    cells.forEach(function (cl, i) {
      var x0 = CX[i][0], w = CX[i][1] - x0;
      out.push(H.box(x0, VY + 8, w, VH - 6, { r: 7, fill: cl[3] ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: cl[3] ? YEL : "transparent", sw: 1.6, cls: cl[3] ? "anim-new" : "" }));
      out.push(H.text(x0 + 8, VY + 24, cl[0], { size: 10.5, anchor: "start", color: MUTED, mono: true }));
      out.push(H.text(x0 + w - 8, VY + 50, cl[1], { size: 10, anchor: "end", color: MUTED }));
      var vc = i === 0 ? RED : i === 2 && st.check ? "#2a7a6b" : "var(--md-default-fg-color)";
      out.push(H.text(x0 + 10, VY + 52, cl[2], { size: 20, weight: 700, anchor: "start", mono: true, color: vc }));
    });

    // the action of this step: an arrow from the current node to its block of tickets
    (s.acts || []).forEach(function (a) {
      if (a.kind !== "add") return;
      var j = JOBS.filter(function (q) { return q.n === a.from; })[0];
      var fx = NODE[j.n] + NW / 2, toX = tx(j.lo + j.t / 2);
      out.push(H.arrow(fx, NY + NH + 2, toX, SY - 3, { color: c(j.n), label: a.label, mono: true, lpos: [(fx + toX) / 2, 112], sw: 2.4 }));
    });
    return out.join("");
  }

  window.OS_ANIMS.lottery = {
    title: "The ticket walk: OSTEP Figure 9.1, one list node at a time",
    interval: 4000,
    threads: ["A", "B", "C", "draw"],
    colors: { A: "#1f3a68", B: "#0e7c86", C: "#b5520b", draw: RED },
    sceneBox: "0 0 360 334",
    scene: scene,
    code: code,
    codeTitle: "OSTEP Figure 9.1, the lottery scheduling decision code",
    variants: variants
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
