// Round robin, step by step (W06 class 1, Sections 3.2 to 3.4).
// Tab 1 is xv6's scheduler loop of Section 3.4 (kernel/proc.c lines 437 to 459, yield() lines 490 to 498, and the
// timer branch of usertrap(), kernel/trap.c lines 84 to 85), on the proc array of Figure 3.3: init, sh and rr
// SLEEPING, A RUNNING, B RUNNABLE, the rest UNUSED. The turns strip at the bottom is Figure 3.4 (A tick 2, B tick 3,
// A tick 4), from the console capture of `rr` with two children.
// Tab 2 is the timeline of Section 3.2 (OSTEP Figure 7.7): three 5 s jobs arriving together, a 1 s slice, one step
// per slice, with the response and turnaround times of the page's table.
// The picture of tab 1: the proc array on the left as one structure (slot, name, state), the CPU top right, the
// scheduler loop bottom right with its pointer p (the purple tag on the slot it points at). Each step's action is
// one arrow: the tick into the CPU, yield() writing RUNNABLE into the slot, sched() going back to the loop, the loop
// moving p or picking a slot, swtch from the slot to the CPU.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  function lines(arr) { return arr.map(function (x) { return { n: x[0], text: x[1] }; }); }

  var codeSched = [{ n: null, text: "// kernel/proc.c, the loop inside scheduler()" }].concat(lines([
    [437, "    int found = 0;"],
    [438, "    for(p = proc; p < &proc[NPROC]; p++) {"],
    [439, "      acquire(&p->lock);"],
    [440, "      if(p->state == RUNNABLE) {"],
    [441, "        // Switch to chosen process.  It is the process's job"],
    [442, "        // to release its lock and then reacquire it"],
    [443, "        // before jumping back to us."],
    [444, "        p->state = RUNNING;"],
    [445, "        c->proc = p;"],
    [446, "        swtch(&c->context, &p->context);"],
    [447, ""],
    [448, "        // Process is done running for now."],
    [449, "        // It should have changed its p->state"],
    [null, "        // before coming back."],
    [450, "        c->proc = 0;"],
    [451, "        found = 1;"],
    [452, "      }"],
    [453, "      release(&p->lock);"],
    [454, "    }"],
    [455, "    if(found == 0) {"],
    [456, "      // nothing to run; stop running on this core"],
    [null, "      // until an interrupt."],
    [457, "      asm volatile(\"wfi\");"],
    [458, "    }"],
    [459, "  }"]
  ]), [{ n: null, text: " " }, { n: null, text: "// kernel/proc.c, yield()" }], lines([
    [490, "void"],
    [491, "yield(void)"],
    [492, "{"],
    [493, "  struct proc *p = myproc();"],
    [494, "  acquire(&p->lock);"],
    [495, "  p->state = RUNNABLE;"],
    [496, "  sched();"],
    [497, "  release(&p->lock);"],
    [498, "}"]
  ]), [{ n: null, text: " " }, { n: null, text: "// kernel/trap.c, the timer branch of usertrap()" }], lines([
    [84, "  if(which_dev == 2)"],
    [85, "    yield();"]
  ]));

  var codeRule = [
    { n: null, text: "Round robin (Section 3.2):" },
    { n: null, text: "  run a job for a time slice," },
    { n: null, text: "  then switch to the next job in the queue," },
    { n: null, text: "  and keep going around until the jobs are done." },
    { n: null, text: " " },
    { n: null, text: "OSTEP Figure 7.7:" },
    { n: null, text: "  three jobs A, B, C, 5 s each, all at time 0" },
    { n: null, text: "  time slice: 1 s" },
    { n: null, text: " " },
    { n: null, text: "T_response = T_firstrun − T_arrival" }
  ];

  // ---- tab 1: the scheduler loop
  // state: st (the state of each row of the table, 8 rows: slots 0 to 5, "6 to 62", 63), p (the row p points at),
  // cpu ("A", "B" or "sched"), loop ("frozen" in swtch or "running"), found, tick (a timer interrupt this step),
  // turns (Figure 3.4's strip so far). act: {type: "tick" | "rnbl" | "back" | "move" | "pick" | "swtch", row, label}
  var S0 = ["SLEEPING", "SLEEPING", "SLEEPING", "RUNNING", "RUNNABLE", "UNUSED", "UNUSED", "UNUSED"];
  function st(a, b) { var r = S0.slice(); r[3] = a; r[4] = b; return r; }
  function S(label, text, o) { o.label = label; o.text = text; return o; }
  var loop = [
    S("Start", "The proc array of Figure 3.3: init, sh and rr are SLEEPING, A is RUNNING, B is RUNNABLE, and the rest are UNUSED. A runs on the CPU. The scheduler loop is frozen on line 446, with p on A's slot.", {
      at: [{ who: "A", line: 85 }, { who: "sched", line: 446 }],
      state: { st: st("RUNNING", "RUNNABLE"), p: 3, cpu: "A", loop: "frozen", found: 0, turns: ["A2"] }, act: null }),
    S("Step 1, tick", "The timer interrupt arrives. In usertrap, which_dev == 2 means the timer (line 84), so line 85 calls yield(). A is forced to give up the CPU.", {
      at: [{ who: "A", line: 84 }, { who: "sched", line: 446 }],
      state: { st: st("RUNNING", "RUNNABLE"), p: 3, cpu: "A", loop: "frozen", found: 0, tick: true, turns: ["A2"] },
      act: { type: "tick", label: "line 84: which_dev == 2" } }),
    S("Step 2, yield", "Line 495 marks A RUNNABLE again, so it will get another turn.", {
      at: [{ who: "A", line: 495 }, { who: "sched", line: 446 }],
      state: { st: st("RUNNABLE", "RUNNABLE"), p: 3, cpu: "A", loop: "frozen", found: 0, turns: ["A2"] },
      act: { type: "rnbl", row: 3, label: "line 495: RUNNABLE" } }),
    S("Step 3, back", "Line 496 switches back to the scheduler loop. The loop goes on from line 446, where it was frozen, and line 451 sets found to 1.", {
      at: [{ who: "A", line: 496 }, { who: "sched", line: 451 }],
      state: { st: st("RUNNABLE", "RUNNABLE"), p: 3, cpu: "sched", loop: "running", found: 1, turns: ["A2"] },
      act: { type: "back", label: "line 496: sched()" } }),
    S("Step 4, next slot", "The loop continues from the next slot, not from the top: p++ on line 438 moves p from A's slot to B's.", {
      at: [{ who: "sched", line: 438 }],
      state: { st: st("RUNNABLE", "RUNNABLE"), p: 4, cpu: "sched", loop: "running", found: 1, turns: ["A2"] },
      act: { type: "move", row: 4, label: "line 438: p++" } }),
    S("Step 5, pick", "Line 440 finds B RUNNABLE. Line 444 marks B RUNNING, and line 445 records it as this CPU's current process.", {
      at: [{ who: "sched", line: 444 }],
      state: { st: st("RUNNABLE", "RUNNING"), p: 4, cpu: "sched", loop: "running", found: 1, turns: ["A2"] },
      act: { type: "pick", row: 4, label: "line 444: RUNNING" } }),
    S("Step 6, swtch", "Line 446, swtch, saves the scheduler's registers and loads B's. B runs, and the scheduler is frozen on line 446 until B gives the CPU back. B has tick 3.", {
      at: [{ who: "sched", line: 446 }],
      state: { st: st("RUNNABLE", "RUNNING"), p: 4, cpu: "B", loop: "frozen", found: 1, turns: ["A2", "B3"] },
      act: { type: "swtch", row: 4, label: "line 446: swtch" } }),
    S("Step 7, tick", "The next tick stops B the same way: line 85 calls yield(), line 495 marks B RUNNABLE, and line 496 switches back to the loop.", {
      at: [{ who: "B", line: 496 }, { who: "sched", line: 451 }],
      state: { st: st("RUNNABLE", "RUNNABLE"), p: 4, cpu: "sched", loop: "running", found: 1, turns: ["A2", "B3"] },
      act: { type: "back", label: "line 496: sched()" } }),
    S("Step 8, the rest", "p++ moves on past B. Every slot after B is UNUSED, so the test on line 440 fails for each one, and p reaches &proc[NPROC], the end of the array.", {
      at: [{ who: "sched", line: 440 }],
      state: { st: st("RUNNABLE", "RUNNABLE"), p: 7, cpu: "sched", loop: "running", found: 1, turns: ["A2", "B3"] },
      act: { type: "move", row: 7, label: "line 440: skip" } }),
    S("Step 9, wrap", "Something ran in this pass, so found is 1 and line 457's wfi is skipped. The loop starts its next pass: line 437 sets found to 0, and line 438 puts p back on the first slot.", {
      at: [{ who: "sched", line: 438 }],
      state: { st: st("RUNNABLE", "RUNNABLE"), p: 0, cpu: "sched", loop: "running", found: 0, turns: ["A2", "B3"] },
      act: { type: "move", row: 0, label: "line 438: p = proc" } }),
    S("Step 10, skip", "init, sh and rr are SLEEPING, so line 440 skips them. The next slot is A's, and A is RUNNABLE.", {
      at: [{ who: "sched", line: 440 }],
      state: { st: st("RUNNABLE", "RUNNABLE"), p: 3, cpu: "sched", loop: "running", found: 0, turns: ["A2", "B3"] },
      act: { type: "move", row: 3, label: "line 440: RUNNABLE" } }),
    S("Step 11, A again", "Lines 444 and 445 mark A RUNNING, and line 446 switches to it. A has tick 4: one tick each, in array order, as in Figure 3.4.", {
      at: [{ who: "sched", line: 446 }],
      state: { st: st("RUNNING", "RUNNABLE"), p: 3, cpu: "A", loop: "frozen", found: 0, turns: ["A2", "B3", "A4"] },
      act: { type: "swtch", row: 3, label: "line 446: swtch" },
      event: "No priorities, no job lengths, no memory of the past: a slice of one tick, in array order.", eventKind: "good" })
  ];

  // ---- tab 2: the timeline of OSTEP Figure 7.7
  var ORDER = ["A", "B", "C"];
  var tl = [S("Start", "Three jobs, A, B and C, arrive together at time 0, and each needs 5 s of CPU. Round robin runs each one for a 1 s slice, then switches to the next job in the queue.", {
    state: { t: 0, run: null, left: { A: 5, B: 5, C: 5 }, first: {}, done: {}, gantt: [] } })];
  (function () {
    var left = { A: 5, B: 5, C: 5 }, first = {}, done = {}, gantt = [];
    for (var k = 0; k < 15; k++) {
      var j = ORDER[k % 3], round = Math.floor(k / 3) + 1, t0 = k, t1 = k + 1;
      var newFirst = first[j] === undefined;
      if (newFirst) first[j] = t0;
      left[j] -= 1;
      gantt.push(j);
      var fin = left[j] === 0;
      if (fin) done[j] = t1;
      var text;
      if (k === 0) text = "From 0 to 1: A runs first. It first runs at 0, so its response time is 0.";
      else if (k === 1) text = "From 1 to 2: B runs. It first runs at 1, so its response time is 1.";
      else if (k === 2) text = "From 2 to 3: C runs, with response time 2. Every job has started within 2 s. Average response: (0 + 1 + 2) / 3 = 1 s.";
      else if (k === 3) text = "From 3 to 4: back to A for round 2. A has 3 s of work left after this slice.";
      else if (k === 12) text = "From 12 to 13: A's fifth slice is the thirteenth slice overall, so A ends at 13.";
      else if (k === 13) text = "From 13 to 14: B's fifth slice. B ends at 14.";
      else if (k === 14) text = "From 14 to 15: C ends at 15. Five rounds of three 1 s slices is 15 s. Average turnaround: (13 + 14 + 15) / 3 = 42 / 3 = 14 s.";
      else text = "From " + t0 + " to " + t1 + ": " + j + " runs, round " + round + ". " + j + " has " + left[j] + " s of work left" + (left[j] === 1 ? "." : " after this slice.");
      var o = { state: { t: t1, run: j, left: JSON.parse(JSON.stringify(left)), first: JSON.parse(JSON.stringify(first)), done: JSON.parse(JSON.stringify(done)), gantt: gantt.slice(), newFirst: newFirst, fin: fin } };
      if (k === 2) { o.event = "Response: 0, 1 and 2, average 1 s, instead of 5 under shortest first."; o.eventKind = "good"; }
      if (k === 14) { o.event = "Turnaround: 13, 14 and 15, average 14 s. Shortest first and FIFO give 10."; o.eventKind = "bad"; }
      tl.push(S("Slice " + (k + 1), text, o));
    }
  })();

  // ---- the scene
  var MUTED = "var(--md-default-fg-color--light)", YEL = "rgba(232,178,58,.30)", YELS = "#e8b23a";
  var GREEN = "#2a7a6b", RED = "#b23a48", PURPLE = "#6b4fa0";
  var ROWS = [["[0]", "init"], ["[1]", "sh"], ["[2]", "rr"], ["[3]", "A"], ["[4]", "B"], ["[5]", ""], ["", "..."], ["[63]", ""]];
  var RY = 102, RH = 26;                                    // first row top, row pitch
  function rowY(i) { return RY + i * RH + 11; }              // middle of row i
  var TAG = 166;                                             // x of the p tag, right of the table
  function stateColor(v) { return v === "RUNNING" ? GREEN : v === "RUNNABLE" ? "#1f6f8b" : MUTED; }

  function sceneLoop(s, H, ctx) {
    var c = ctx.col, st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    // the proc array
    out.push(H.box(6, 74, 146, 240, { r: 10, stroke: MUTED, sw: 1.6 }));
    out.push(H.text(14, 93, "proc[]", { size: 13, weight: 700, anchor: "start", mono: true }));
    out.push(H.text(144, 93, "64 slots", { size: 10, anchor: "end", color: MUTED }));
    ROWS.forEach(function (r, i) {
      var y = RY + i * RH, v = st.st[i], changed = pv.st[i] !== v;
      out.push(H.box(12, y, 134, 22, { r: 5, fill: changed ? YEL : "var(--md-code-bg-color)", stroke: changed ? YELS : "transparent", sw: 1.4, cls: changed ? "anim-new" : "" }));
      out.push(H.text(18, y + 15, r[0], { size: 10, anchor: "start", mono: true, color: MUTED }));
      var isJob = r[1] === "A" || r[1] === "B";
      if (r[1]) out.push(H.text(48, y + 15.5, r[1], { size: 12, weight: 700, anchor: "start", color: isJob ? c(r[1]) : "var(--md-default-fg-color)" }));
      if (r[1] !== "...") out.push(H.text(140, y + 15, v, { size: 10, weight: v === "UNUSED" ? 400 : 700, anchor: "end", color: stateColor(v), italic: v === "UNUSED" }));
      else out.push(H.text(140, y + 15, "UNUSED", { size: 10, anchor: "end", color: MUTED, italic: true }));
    });
    // the loop pointer p, a tag on the slot it points at
    var py = rowY(st.p), pmoved = pv.p !== st.p;
    out.push('<g' + (pmoved ? ' class="anim-new"' : '') + '><path d="M154,' + py + ' L160,' + (py - 6) + ' L176,' + (py - 6) + ' L176,' + (py + 6) + ' L160,' + (py + 6) + ' Z" style="fill:' + PURPLE + '"/>' +
             H.text(168, py + 4, "p", { size: 11, weight: 700, color: "#fff", mono: true }) + '</g>');
    // the CPU
    var onCpu = st.cpu, cpuCol = onCpu === "sched" ? PURPLE : c(onCpu);
    out.push(H.box(196, 8, 158, 62, { r: 10, stroke: MUTED, sw: 1.8, fill: st.tick ? "rgba(178,58,72,.08)" : "var(--md-default-bg-color)" }));
    out.push(H.text(206, 28, "CPU", { size: 13, weight: 700, anchor: "start" }));
    out.push(H.text(206, 55, "runs", { size: 10.5, anchor: "start", color: MUTED }));
    out.push(H.chip(onCpu === "sched" ? 278 : 252, 51, onCpu === "sched" ? "scheduler" : onCpu, cpuCol, { cls: pv.cpu !== st.cpu ? "anim-pop" : "" }));
    // the scheduler loop
    out.push(H.box(196, 228, 158, 86, { r: 10, stroke: PURPLE, sw: st.loop === "running" ? 2.6 : 1.4, fill: st.loop === "running" ? "rgba(107,79,160,.08)" : "var(--md-default-bg-color)" }));
    out.push(H.text(206, 246, "scheduler() loop", { size: 12, weight: 700, anchor: "start", color: PURPLE }));
    var pName = st.p === 6 ? "..." : st.p === 7 ? "63" : String(st.p);
    out.push(H.box(204, 254, 142, 20, { r: 4, fill: pmoved ? YEL : "var(--md-code-bg-color)", stroke: pmoved ? YELS : "transparent", sw: 1.2, cls: pmoved ? "anim-new" : "" }));
    out.push(H.text(210, 268, "p = &proc[" + pName + "]", { size: 11.5, anchor: "start", mono: true }));
    var fch = pv.found !== st.found;
    out.push(H.box(204, 277, 142, 20, { r: 4, fill: fch ? YEL : "var(--md-code-bg-color)", stroke: fch ? YELS : "transparent", sw: 1.2, cls: fch ? "anim-new" : "" }));
    out.push(H.text(210, 291, "found = " + st.found, { size: 11.5, anchor: "start", mono: true }));
    out.push(H.text(206, 309, st.loop === "frozen" ? "frozen on line 446" : "running", { size: 10, anchor: "start", italic: st.loop === "frozen", weight: st.loop === "frozen" ? 400 : 700, color: st.loop === "frozen" ? MUTED : PURPLE }));
    // Figure 3.4's turns
    out.push(H.text(8, 344, "turns", { size: 10, anchor: "start", color: MUTED }));
    out.push(H.text(8, 357, "(Fig. 3.4)", { size: 10, anchor: "start", color: MUTED }));
    st.turns.forEach(function (t, i) {
      var who = t.charAt(0), x = 66 + i * 98, isNew = (pv.turns || []).length <= i;
      out.push('<g' + (isNew && ctx.prev ? ' class="anim-new"' : '') + '>' + H.box(x, 334, 90, 28, { r: 5, fill: c(who), stroke: c(who) }) +
               H.text(x + 45, 352, who + " runs, tick " + t.slice(1), { size: 11, weight: 700, color: "#fff" }) + '</g>');
      if (i > 0) out.push('<path d="M' + (x - 7) + ',348 L' + (x - 1) + ',348" style="stroke:' + RED + ';stroke-width:2.4"/>');
    });
    // the action of this step
    var a = s.act;
    if (a) {
      var ay = a.row !== undefined ? rowY(a.row) : 0;
      if (a.type === "tick") {
        out.push(H.text(8, 22, "⚡ timer interrupt", { size: 12, weight: 700, anchor: "start", color: RED, cls: "anim-pop" }));
        out.push(H.arrow(124, 30, 194, 38, { color: RED, sw: 2.6, bend: [0, -6] }));
        var lw = a.label.length * 6.3 + 12;
        out.push(H.box(84 - lw / 2, 42, lw, 19, { r: 4, stroke: RED, sw: 1, cls: "anim-head" }));
        out.push(H.text(84, 56, a.label, { size: 11, weight: 600, color: RED, mono: true, cls: "anim-head" }));
      }
      if (a.type === "rnbl") out.push(H.arrow(200, 70, 178, ay - 2, { color: c(st.cpu === "sched" ? "A" : st.cpu), sw: 2.4, bend: [-6, 0], label: a.label, mono: true, lpos: [272, 120] }));
      if (a.type === "back") out.push(H.arrow(300, 72, 300, 226, { color: PURPLE, sw: 2.6, label: a.label, mono: true, lpos: [282, 150] }));
      if (a.type === "move") out.push(H.arrow(196, 262, 180, ay, { color: PURPLE, sw: 2.2, dash: true, bend: [12, 0], label: a.label, mono: true, lpos: [272, 196] }));
      if (a.type === "pick") out.push(H.arrow(196, 286, 180, ay + 2, { color: GREEN, sw: 2.6, bend: [14, 10], label: a.label, mono: true, lpos: [272, 196] }));
      if (a.type === "swtch") out.push(H.arrow(178, ay - 4, 226, 72, { color: c(st.cpu), sw: 2.6, bend: [16, 0], label: a.label, mono: true, lpos: [272, 120] }));
    }
    return out.join("");
  }

  var GX = 22, GW = 316, GY = 230, GH = 28;          // the Gantt bar: x, width, y, height (15 slices)
  var SL = GW / 15;
  var CELLX = { A: 14, B: 126, C: 238 }, CW = 108, CY = 104;
  function sceneTimeline(s, H, ctx) {
    var c = ctx.col, st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    // the CPU
    out.push(H.box(110, 4, 140, 48, { r: 10, stroke: MUTED, sw: 1.8 }));
    out.push(H.text(120, 22, "CPU", { size: 13, weight: 700, anchor: "start" }));
    if (st.run) {
      out.push(H.chip(226, 18, st.run, c(st.run), { cls: pv.run !== st.run ? "anim-pop" : "" }));
      out.push(H.text(180, 43, "time " + (st.t - 1) + " to " + st.t + " s", { size: 11, mono: true }));
    } else out.push(H.text(180, 42, "nothing yet, time 0", { size: 11, italic: true, color: MUTED }));
    // the job queue
    out.push(H.box(6, 96, 348, 108, { r: 10, stroke: MUTED, sw: 1.6 }));
    out.push(H.text(16, 197, "the job queue", { size: 11, weight: 700, anchor: "start" }));
    out.push(H.text(344, 197, "taken in turn: A, B, C, A, ...", { size: 10, anchor: "end", color: MUTED }));
    ORDER.forEach(function (j) {
      var x = CELLX[j], y = CY, on = st.run === j, lch = pv.left[j] !== st.left[j];
      out.push(H.box(x, y, CW, 78, { r: 7, fill: on ? "rgba(42,122,107,.10)" : "var(--md-code-bg-color)", stroke: on ? c(j) : "transparent", sw: 2 }));
      out.push(H.chip(x + 18, y + 14, j, c(j)));
      out.push(H.text(x + CW - 8, y + 18, st.done[j] !== undefined ? "done" : on ? "running" : "waiting", { size: 10, anchor: "end", weight: on ? 700 : 400, color: st.done[j] !== undefined ? GREEN : on ? c(j) : MUTED }));
      out.push(H.box(x + 4, y + 27, CW - 8, 18, { r: 4, fill: lch ? YEL : "transparent", stroke: lch ? YELS : "transparent", sw: 1.2, cls: lch ? "anim-new" : "" }));
      out.push(H.text(x + 8, y + 40, "work left", { size: 10, anchor: "start", color: MUTED }));
      out.push(H.text(x + CW - 8, y + 40.5, st.left[j] + " s", { size: 12, weight: 700, anchor: "end", mono: true }));
      var f = st.first[j], fnew = pv.first[j] === undefined && f !== undefined;
      out.push(H.text(x + 8, y + 57, "first run", { size: 10, anchor: "start", color: MUTED }));
      out.push(H.text(x + CW - 8, y + 57.5, f === undefined ? "-" : String(f), { size: 12, weight: 700, anchor: "end", mono: true, color: fnew ? GREEN : "var(--md-default-fg-color)", cls: fnew ? "anim-pop" : "" }));
      var d = st.done[j], dnew = pv.done[j] === undefined && d !== undefined;
      out.push(H.text(x + 8, y + 72, "ends at", { size: 10, anchor: "start", color: MUTED }));
      out.push(H.text(x + CW - 8, y + 72.5, d === undefined ? "-" : String(d), { size: 12, weight: 700, anchor: "end", mono: true, color: dnew ? GREEN : "var(--md-default-fg-color)", cls: dnew ? "anim-pop" : "" }));
    });
    // the arrow: the job of this slice goes from the queue to the CPU
    if (st.run) {
      var cx = CELLX[st.run] + CW / 2, tx = st.run === "A" ? 140 : st.run === "B" ? 180 : 220;
      out.push(H.arrow(cx, CY - 2, tx, 54, { color: c(st.run), sw: 2.4, label: "runs 1 s", lpos: [st.run === "A" ? 52 : st.run === "B" ? 228 : 306, 76] }));
    }
    // the Gantt bar
    out.push(H.text(GX, GY - 8, "the CPU, slice by slice (Figure 7.7)", { size: 10.5, anchor: "start", color: MUTED }));
    out.push(H.box(GX, GY, GW, GH, { r: 2, fill: "var(--md-code-bg-color)", stroke: "var(--md-default-fg-color--lighter)", sw: 1 }));
    st.gantt.forEach(function (j, i) {
      var isNew = i === st.gantt.length - 1 && ctx.prev;
      out.push('<g' + (isNew ? ' class="anim-new"' : '') + '>' + H.box(GX + i * SL + 0.5, GY + 1, SL - 1, GH - 2, { r: 1, fill: c(j), stroke: c(j), sw: 0.5 }) +
               H.text(GX + i * SL + SL / 2, GY + 18, j, { size: 11, weight: 700, color: "#fff" }) + '</g>');
    });
    out.push('<path d="M' + GX + ',' + (GY + GH + 6) + ' L' + (GX + GW) + ',' + (GY + GH + 6) + '" style="stroke:' + MUTED + ';stroke-width:1.2"/>');
    [0, 5, 10, 15].forEach(function (t) {
      var x = GX + t * SL;
      out.push('<path d="M' + x + ',' + (GY + GH + 2) + ' L' + x + ',' + (GY + GH + 10) + '" style="stroke:' + MUTED + ';stroke-width:1.2"/>');
      out.push(H.text(x, GY + GH + 22, String(t), { size: 10, color: MUTED }));
    });
    out.push(H.text(GX + GW, GY + GH + 34, "seconds", { size: 10, anchor: "end", color: MUTED }));
    // the two metrics
    var rs = ORDER.filter(function (j) { return st.first[j] !== undefined; });
    var resp = "response: " + (rs.length ? rs.map(function (j) { return j + " " + st.first[j]; }).join(", ") : "-");
    if (rs.length === 3) resp += ";  average (0 + 1 + 2) / 3 = 1";
    out.push(H.text(16, 314, resp, { size: 11, anchor: "start", weight: 600, cls: rs.length === 3 && (pv.first.C === undefined) ? "anim-pop" : "" }));
    var ds = ORDER.filter(function (j) { return st.done[j] !== undefined; });
    var turn = "turnaround: " + (ds.length ? ds.map(function (j) { return j + " " + st.done[j]; }).join(", ") : "-");
    if (ds.length === 3) turn += ";  average (13 + 14 + 15) / 3 = 14";
    out.push(H.text(16, 334, turn, { size: 11, anchor: "start", weight: 600 }));
    out.push(H.text(16, 356, "shortest first, same jobs: response 5, turnaround 10", { size: 10.5, anchor: "start", color: MUTED }));
    return out.join("");
  }

  function scene(s, H, ctx) { return ctx.variant === "timeline" ? sceneTimeline(s, H, ctx) : sceneLoop(s, H, ctx); }

  window.OS_ANIMS.rr = {
    title: "Round robin, step by step: xv6's scheduler loop, and the timeline of Figure 7.7",
    interval: 4200,
    threads: ["A", "B", "C", "sched"],
    colors: { A: "#1f3a68", B: "#0f7c87", C: "#b5520e", sched: PURPLE },
    sceneBox: "0 0 360 368",
    scene: scene,
    code: codeSched,
    codeTitle: "xv6-labs-2025: scheduler() lines 437 to 459, yield() lines 490 to 498, trap.c lines 84 to 85",
    variants: [
      { key: "loop", label: "xv6's scheduler loop", steps: loop },
      { key: "timeline", label: "The timeline", steps: tl, code: codeRule, codeTitle: "Section 3.2, Figure 3.2" }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
