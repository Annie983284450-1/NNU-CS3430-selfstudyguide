// The race on the shared counter, step by step (W08 class 1, Sections 2.3 to 2.5).
// Tab 1 is the one-CPU trace of Section 2.4 (OSTEP Figure 26.7): the textbook's addresses 100, 105 and 108, the counter
// at 8049a1c starting at 50, the PC and eax columns of its three tables, and the interrupts where the tables put them.
// Tab 2 is the two-core table of Section 2.5 (moments 1 to 4), with the Ubuntu listing of Section 2.3 as its code
// (addresses 11dd, 11e3, 11e6, and the counter at 4014).
// The picture: the CPU (or the two cores) on top, thread 1 and thread 2 with their own eax on either side, the counter
// cell in memory in the middle below them; a load is an arrow from the counter to a register, an add happens inside the
// register, a store is an arrow from a register to the counter.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  var code1 = [
    { n: null, text: "counter = counter + 1;" },
    { n: 100, text: "mov 8049a1c,%eax    # load" },
    { n: 105, text: "add $0x1,%eax       # add 1" },
    { n: 108, text: "mov %eax,8049a1c    # store" }
  ];
  var code2 = [
    { n: null, text: "counter = counter + 1;     // the dangerous line" },
    { n: "11dd", text: "mov    0x2e31(%rip),%eax   # 4014 <counter>" },
    { n: "11e3", text: "add    $0x1,%eax" },
    { n: "11e6", text: "mov    %eax,0x2e28(%rip)   # 4014 <counter>" },
    { n: null, text: "for (int i = 0; i < 10000000; i++) {" },
    { n: "11ec", text: "addl   $0x1,-0x4(%rbp)" },
    { n: "11f0", text: "cmpl   $0x98967f,-0x4(%rbp)" },
    { n: "11f7", text: "jle    11dd <mythread+0x34>" }
  ];

  // state: cpu (who runs on the one CPU: T1, T2 or OS), pc, eax {T1, T2}, saved {T1, T2} (registers in the TCB),
  // counter (memory). acts: {who, op: "load" | "add" | "store", label, bad}
  function S(label, text, o) { o.label = label; o.text = text; return o; }
  var one = [
    S("Start", "The counter lives at address 8049a1c and starts at 50. Thread 1 runs on the one CPU. The PC is 100, the address of its next instruction, the load.", {
      at: [{ who: "T1", line: 100 }], cpu: "T1",
      state: { cpu: "T1", pc: 100, eax: { T1: 0, T2: 0 }, saved: { T1: false, T2: true }, counter: 50 }, acts: [] }),
    S("Step 1, load", "Thread 1 runs mov 8049a1c,%eax: it copies the counter from memory into its register. Its eax is 50, and the PC moves on to 105.", {
      at: [{ who: "T1", line: 100 }], cpu: "T1",
      state: { cpu: "T1", pc: 105, eax: { T1: 50, T2: 0 }, saved: { T1: false, T2: true }, counter: 50 },
      acts: [{ who: "T1", op: "load", label: "100: mov 8049a1c,%eax" }] }),
    S("Step 1, add", "Thread 1 adds 1 inside its register: eax is 51. Memory is untouched and still says 50.", {
      at: [{ who: "T1", line: 105 }], cpu: "T1",
      state: { cpu: "T1", pc: 108, eax: { T1: 51, T2: 0 }, saved: { T1: false, T2: true }, counter: 50 },
      acts: [{ who: "T1", op: "add", label: "105: add $0x1,%eax" }] }),
    S("Step 1, interrupt", "The timer fires before the store. The OS saves everything thread 1 has, the 51 in eax included, into thread 1's TCB.", {
      at: [{ who: "T1", line: 108 }], cpu: "OS", switching: "timer interrupt: save T1",
      state: { cpu: "OS", pc: null, eax: { T1: 51, T2: 0 }, saved: { T1: true, T2: true }, counter: 50 }, acts: [],
      event: "A half-finished add is hiding in a saved register: 51 in T1's TCB, 50 in memory.", eventKind: "warn" }),
    S("Step 2, restore T2", "The OS restores thread 2 and gives it the CPU. Its PC is 100 and its eax is 0.", {
      at: [{ who: "T1", line: 108 }, { who: "T2", line: 100 }], cpu: "T2", switching: "restore T2",
      state: { cpu: "T2", pc: 100, eax: { T1: 51, T2: 0 }, saved: { T1: true, T2: false }, counter: 50 }, acts: [] }),
    S("Step 2, load", "Thread 2 loads the counter. It reads memory, because memory is all it can read, and memory says 50.", {
      at: [{ who: "T1", line: 108 }, { who: "T2", line: 100 }], cpu: "T2",
      state: { cpu: "T2", pc: 105, eax: { T1: 51, T2: 50 }, saved: { T1: true, T2: false }, counter: 50 },
      acts: [{ who: "T2", op: "load", label: "100: mov 8049a1c,%eax" }] }),
    S("Step 2, add", "Thread 2 adds 1 and gets 51 in its own eax. Memory still says 50.", {
      at: [{ who: "T1", line: 108 }, { who: "T2", line: 105 }], cpu: "T2",
      state: { cpu: "T2", pc: 108, eax: { T1: 51, T2: 51 }, saved: { T1: true, T2: false }, counter: 50 },
      acts: [{ who: "T2", op: "add", label: "105: add $0x1,%eax" }] }),
    S("Step 2, store", "Thread 2 stores, and now memory says 51. From thread 2's point of view, everything is correct.", {
      at: [{ who: "T1", line: 108 }, { who: "T2", line: 108 }], cpu: "T2",
      state: { cpu: "T2", pc: 113, eax: { T1: 51, T2: 51 }, saved: { T1: true, T2: false }, counter: 51 },
      acts: [{ who: "T2", op: "store", label: "108: mov %eax,8049a1c" }],
      event: "Two threads each believe they have added 1 to 50.", eventKind: "warn" }),
    S("Step 3, interrupt", "Another interrupt. The OS saves thread 2's registers into its TCB.", {
      at: [{ who: "T1", line: 108 }], cpu: "OS", switching: "interrupt: save T2",
      state: { cpu: "OS", pc: null, eax: { T1: 51, T2: 51 }, saved: { T1: true, T2: true }, counter: 51 }, acts: [] }),
    S("Step 3, restore T1", "The OS puts thread 1's saved registers back. Its eax holds the 51 it computed before it was stopped, and its PC is 108, the store.", {
      at: [{ who: "T1", line: 108 }], cpu: "T1", switching: "restore T1",
      state: { cpu: "T1", pc: 108, eax: { T1: 51, T2: 51 }, saved: { T1: false, T2: true }, counter: 51 }, acts: [] }),
    S("Step 3, store", "Thread 1 writes its 51 into memory. Memory already held 51, so nothing moves. 50 + 1 + 1 should be 52, so one add is lost.", {
      at: [{ who: "T1", line: 108 }], cpu: "T1",
      state: { cpu: "T1", pc: 113, eax: { T1: 51, T2: 51 }, saved: { T1: false, T2: true }, counter: 51, lost: true },
      acts: [{ who: "T1", op: "store", label: "108: mov %eax,8049a1c", bad: true }],
      event: "Two adds, and the counter moved by one: 51, not 52.", eventKind: "bad" })
  ];

  var two = [
    S("Start", "Two cores, one thread on each. Both threads are in the loop at the same time, and nobody is switched out. The counter in memory is 50.", {
      at: [{ who: "T1", line: "11dd" }, { who: "T2", line: "11f0" }],
      state: { eax: { T1: null, T2: null }, counter: 50 }, acts: [] }),
    S("Moment 1", "Core 0: thread 1 loads 50 into its eax. Core 1: thread 2 is still in the loop's compare.", {
      at: [{ who: "T1", line: "11dd" }, { who: "T2", line: "11f0" }],
      state: { eax: { T1: 50, T2: null }, counter: 50 },
      acts: [{ who: "T1", op: "load", label: "11dd: mov 0x2e31(%rip),%eax" }] }),
    S("Moment 2", "Thread 1 adds, so its eax is 51. At the same moment thread 2 loads into its own eax. Thread 1's 51 is still in core 0's register, so thread 2 loads 50.", {
      at: [{ who: "T1", line: "11e3" }, { who: "T2", line: "11dd" }],
      state: { eax: { T1: 51, T2: 50 }, counter: 50 },
      acts: [{ who: "T1", op: "add", label: "11e3: add $0x1,%eax" }, { who: "T2", op: "load", label: "11dd: mov 0x2e31(%rip),%eax" }],
      event: "Moment 2 is where it goes wrong: registers are private, and memory still says 50.", eventKind: "warn" }),
    S("Moment 3", "Thread 1 stores 51. Thread 2 adds, and its eax is 51 too.", {
      at: [{ who: "T1", line: "11e6" }, { who: "T2", line: "11e3" }],
      state: { eax: { T1: 51, T2: 51 }, counter: 51 },
      acts: [{ who: "T1", op: "store", label: "11e6: mov %eax,0x2e28(%rip)" }, { who: "T2", op: "add", label: "11e3: add $0x1,%eax" }] }),
    S("Moment 4", "Thread 1 goes on to the next pass of the loop. Thread 2 stores its 51. Two adds should give 50 + 1 + 1 = 52; both stored 51.", {
      at: [{ who: "T1", line: "11ec" }, { who: "T2", line: "11e6" }],
      state: { eax: { T1: 51, T2: 51 }, counter: 51, lost: true },
      acts: [{ who: "T2", op: "store", label: "11e6: mov %eax,0x2e28(%rip)", bad: true }],
      event: "One add is lost, with no interrupt anywhere: 51, not 52.", eventKind: "bad" })
  ];

  // ---- the scene
  var BAD = "#b23a48", WARN = "#a0632a", MUTED = "var(--md-default-fg-color--light)";
  var PAN = { T1: [8, 152], T2: [208, 352] };          // x ranges of the thread panels
  var PY = 74, PH = 98;                                // panel top, height
  var REG = { y: 124, h: 40 };                         // the eax cell inside a panel
  var MEM = { x: 100, y: 254, w: 160, h: 64 };         // the memory box

  function scene(s, H, ctx) {
    var c = ctx.col, st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    var multi = ctx.variant === "two";
    var addr = multi ? "4014" : "8049a1c";

    // the CPU (tab 1) or the two cores (tab 2), on top
    if (!multi) {
      var runs = st.cpu, rc = runs === "OS" ? "#6b6b6b" : c(runs);
      out.push(H.box(100, 6, 160, 50, { r: 10, stroke: "var(--md-default-fg-color--light)", sw: 1.6 }));
      out.push(H.text(112, 26, "one CPU", { size: 12, weight: 700, anchor: "start" }));
      out.push(H.text(112, 46, "runs", { size: 10.5, anchor: "start", color: MUTED }));
      out.push(H.chip(158, 42, runs, rc, { cls: pv.cpu !== st.cpu ? "anim-pop" : "" }));
      out.push(H.text(248, 26, "PC", { size: 10.5, anchor: "end", color: MUTED }));
      out.push(H.text(248, 46, st.pc === null ? "-" : String(st.pc), { size: 15, weight: 700, anchor: "end", mono: true, cls: pv.pc !== st.pc ? "anim-new" : "" }));
      if (runs === "T1" || runs === "T2") {
        var px = runs === "T1" ? 112 : 248;
        out.push('<path d="M' + px + ',56 L' + (runs === "T1" ? 96 : 264) + ',' + PY + '" style="stroke:' + rc + ';stroke-width:2;fill:none" stroke-dasharray="4 3"/>');
      }
    } else {
      [["T1", "core 0"], ["T2", "core 1"]].forEach(function (p) {
        var x0 = PAN[p[0]][0], w = PAN[p[0]][1] - x0;
        out.push(H.box(x0 + 14, 6, w - 28, 40, { r: 10, stroke: "var(--md-default-fg-color--light)", sw: 1.6 }));
        out.push(H.text(x0 + 24, 31, p[1], { size: 12, weight: 700, anchor: "start" }));
        out.push(H.text(x0 + w - 56, 31, "runs", { size: 10.5, anchor: "end", color: MUTED }));
        out.push(H.chip(x0 + w - 38, 26, p[0], c(p[0])));
        out.push('<path d="M' + (x0 + w / 2) + ',46 L' + (x0 + w / 2) + ',' + PY + '" style="stroke:' + c(p[0]) + ';stroke-width:2;fill:none" stroke-dasharray="4 3"/>');
      });
    }

    // the two threads, each with its own eax
    ["T1", "T2"].forEach(function (t) {
      var x0 = PAN[t][0], x1 = PAN[t][1], w = x1 - x0, col = c(t);
      var on = multi || st.cpu === t;
      var saved = !multi && st.saved[t];
      out.push(H.box(x0, PY, w, PH, { r: 10, stroke: col, sw: on ? 2.8 : 1.4, fill: on ? "rgba(42,122,107,.08)" : "var(--md-default-bg-color)" }));
      out.push(H.text(x0 + 10, PY + 20, t === "T1" ? "thread 1" : "thread 2", { size: 13, weight: 700, color: col, anchor: "start" }));
      var tag = multi ? (t === "T1" ? "on core 0" : "on core 1") : (on ? "on the CPU" : "off the CPU");
      out.push(H.text(x1 - 10, PY + 20, tag, { size: 10, weight: on ? 700 : 400, color: on ? col : MUTED, anchor: "end" }));
      // the register
      var v = st.eax[t], pvv = pv.eax[t], changed = v !== pvv;
      out.push(H.box(x0 + 10, REG.y, w - 20, REG.h, { r: 7, fill: changed ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: changed ? "#e8b23a" : (saved ? "var(--md-default-fg-color--lighter)" : "transparent"), sw: 1.4, dash: saved, cls: changed ? "anim-new" : "" }));
      out.push(H.text(x0 + 18, REG.y + 16, "eax", { size: 11, anchor: "start", color: MUTED, mono: true }));
      out.push(H.text(x0 + 18, REG.y + 32, saved ? "saved in its TCB" : (multi ? "core's register" : "in the CPU"), { size: 10, anchor: "start", color: saved ? WARN : MUTED, weight: saved ? 700 : 400 }));
      out.push(H.text(x1 - 20, REG.y + 29, v === null ? "-" : String(v), { size: 20, weight: 700, anchor: "end", mono: true }));
      if (saved && pv.saved && !pv.saved[t]) out.push(H.text(x0 + w / 2, PY + 40, "registers saved", { size: 10, weight: 700, color: WARN, cls: "anim-pop" }));
      else if (!multi && on && pv.saved && pv.saved[t]) out.push(H.text(x0 + w / 2, PY + 40, "registers restored", { size: 10, weight: 700, color: "#2a7a6b", cls: "anim-pop" }));
    });

    // memory, with the one counter cell
    var cch = pv.counter !== st.counter;
    out.push(H.box(MEM.x - 10, MEM.y - 18, MEM.w + 20, MEM.h + 26, { r: 12, stroke: "var(--md-default-fg-color--light)", sw: 1.6 }));
    out.push(H.text(MEM.x, MEM.y - 4, "memory (shared)", { size: 10.5, anchor: "start", color: MUTED }));
    out.push(H.box(MEM.x, MEM.y + 2, MEM.w, MEM.h - 6, { r: 8, fill: st.lost ? "rgba(178,58,72,.14)" : cch ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: st.lost ? BAD : cch ? "#e8b23a" : "transparent", sw: 1.6, cls: cch || (st.lost && !pv.lost) ? "anim-new" : "" }));
    out.push(H.text(MEM.x + 10, MEM.y + 22, "counter", { size: 12, weight: 700, anchor: "start" }));
    out.push(H.text(MEM.x + 10, MEM.y + 40, "at " + addr, { size: 10.5, anchor: "start", color: MUTED, mono: true }));
    out.push(H.text(MEM.x + MEM.w - 12, MEM.y + 40, String(st.counter), { size: 26, weight: 700, anchor: "end", mono: true, color: st.lost ? BAD : "var(--md-default-fg-color)" }));
    if (st.lost) out.push(H.text(180, MEM.y + MEM.h + 24, "two adds: 51, not 52", { size: 12, weight: 700, color: BAD, cls: "anim-pop" }));

    // the switch, if any
    if (s.switching) out.push(H.text(180, 200, "⚡ " + s.switching, { size: 12, weight: 700, color: WARN, cls: "anim-pop" }));

    // the actions of this step
    (s.acts || []).forEach(function (a) {
      var col = a.bad ? BAD : c(a.who), left = a.who === "T1";
      var rx = left ? PAN.T1[1] - 24 : PAN.T2[0] + 24, ry = REG.y + REG.h + 2;     // bottom of the register
      var mx = left ? MEM.x + 22 : MEM.x + MEM.w - 22, my = MEM.y;                 // top of the counter cell
      if (a.op === "load") out.push(H.arrow(mx, my, rx, ry, { color: col, bend: [left ? -14 : 14, 0], label: a.label, mono: true, lpos: [180, 212], sw: 2.4 }));
      if (a.op === "store") {
        out.push(H.arrow(rx, ry, mx, my, { color: col, bend: [left ? 14 : -14, 0], label: a.label, mono: true, lpos: [180, 212], sw: 2.4 }));
        if (a.bad) out.push(H.mark(left ? MEM.x - 24 : MEM.x + MEM.w + 24, MEM.y + 40, false));
      }
      if (a.op === "add") {
        // a short loop on the register, and the instruction under the panel
        var x0 = PAN[a.who][0], x1 = PAN[a.who][1];
        var lx = x1 - 52, ly = REG.y;
        out.push('<g class="anim-arrow"><path d="M' + (lx - 12) + ',' + ly + ' C' + (lx - 12) + ',' + (ly - 18) + ' ' + (lx + 14) + ',' + (ly - 18) + ' ' + (lx + 14) + ',' + (ly - 2) + '" pathLength="100" class="anim-drawn" style="fill:none;stroke:' + col + ';stroke-width:2.2"/>' +
                 '<polyline points="' + (lx + 9) + ',' + (ly - 9) + ' ' + (lx + 14) + ',' + (ly - 1) + ' ' + (lx + 19) + ',' + (ly - 9) + '" class="anim-head" style="fill:none;stroke:' + col + ';stroke-width:2.2"/></g>');
        out.push(H.text(lx - 26, ly - 3, "+1", { size: 11, weight: 700, color: col, cls: "anim-pop" }));
        var w = a.label.length * 6.3 + 12, cxl = (x0 + x1) / 2;
        out.push(H.box(cxl - w / 2, PY + PH + 4, w, 19, { r: 4, stroke: col, sw: 1, cls: "anim-head" }));
        out.push(H.text(cxl, PY + PH + 18, a.label, { size: 11, weight: 600, color: col, mono: true, cls: "anim-head" }));
      }
    });
    return out.join("");
  }

  window.OS_ANIMS.race = {
    title: "counter = counter + 1, instruction by instruction",
    interval: 4200,
    threads: ["T1", "T2"],
    colors: { T1: "#1f6f8b", T2: "#b5651d" },
    sceneBox: "0 0 360 352",
    scene: scene,
    code: code1,
    codeTitle: "The textbook's trace (OSTEP Figure 26.7): instruction addresses on the left",
    variants: [
      { key: "one", label: "One CPU, an interrupt", steps: one },
      { key: "two", label: "Two cores, no interrupt", steps: two, code: code2,
        codeTitle: "The same line on the 2-core Ubuntu machine (objdump, Section 2.3)" }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
