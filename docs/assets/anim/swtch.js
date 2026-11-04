// The context switch, step by step (W02 class 2, Sections 6.1 to 6.3).
// Code: kernel/swtch.S as Figure 6.4 prints it (14 stores, 14 loads, ret). The page names one line number, line 26 for
// ld sp, 8(a1); the other numbers follow the file's layout around it (stores on 10 to 23, loads on 25 to 38, ret on 40).
// Steps: the groups the page explains: save ra and sp, save s0 to s11, load ra and sp (line 26 is the point of no
// return), load s0 to s11, ret into B.
// The picture: A's record on top, the CPU's register file in the middle, B's record at the bottom. Each record holds its
// struct context (ra at +0, sp at +8, s0 to s11 at +16 to +104), its kernel stack and its trapframe. An sd is a red
// arrow from a CPU register up into A's context; an ld is a green arrow from B's context up into the CPU (the colors of
// Figure 6.2: 1 save red, 2 load green). Values are symbolic (A's ra, B's sp), since the page gives no numbers.
// The CPU also shows a pc field, so that ret ("jumps to B's saved return address") can be drawn as ra -> pc.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  var L = [
    [8, ".globl swtch"],
    [9, "swtch:"],
    [10, "        sd ra, 0(a0)"],
    [11, "        sd sp, 8(a0)"],
    [12, "        sd s0, 16(a0)"],
    [13, "        sd s1, 24(a0)"],
    [14, "        sd s2, 32(a0)"],
    [15, "        sd s3, 40(a0)"],
    [16, "        sd s4, 48(a0)"],
    [17, "        sd s5, 56(a0)"],
    [18, "        sd s6, 64(a0)"],
    [19, "        sd s7, 72(a0)"],
    [20, "        sd s8, 80(a0)"],
    [21, "        sd s9, 88(a0)"],
    [22, "        sd s10, 96(a0)"],
    [23, "        sd s11, 104(a0)"],
    [24, ""],
    [25, "        ld ra, 0(a1)"],
    [26, "        ld sp, 8(a1)"],
    [27, "        ld s0, 16(a1)"],
    [28, "        ld s1, 24(a1)"],
    [29, "        ld s2, 32(a1)"],
    [30, "        ld s3, 40(a1)"],
    [31, "        ld s4, 48(a1)"],
    [32, "        ld s5, 56(a1)"],
    [33, "        ld s6, 64(a1)"],
    [34, "        ld s7, 72(a1)"],
    [35, "        ld s8, 80(a1)"],
    [36, "        ld s9, 88(a1)"],
    [37, "        ld s10, 96(a1)"],
    [38, "        ld s11, 104(a1)"],
    [39, ""],
    [40, "        ret"]
  ];
  var code = L.map(function (x) { return { n: x[0], text: x[1] }; });
  function at(from, to) { var r = []; for (var i = from; i <= to; i++) r.push({ who: "CPU", line: i }); return r; }

  // state: cpu {ra, sp, s} (whose values the CPU's registers hold), a {ra, sp, s} (A's context; null = not written
  // in this switch yet), b {ra, sp, s} (B's context), stack (whose kernel stack sp points into), runs (whose kernel code)
  // acts: [{ op: "sd" | "ld" | "ret", reg: "ra" | "sp" | "s", label }]
  var A0 = { ra: null, sp: null, s: null }, AF = { ra: "A", sp: "A", s: "A" }, BF = { ra: "B", sp: "B", s: "B" };
  var steps = [{
    label: "Start",
    text: "The tick saved A's user registers in A's trapframe, and the kernel chose B. The CPU still holds A's 14 kernel registers. The kernel calls swtch(&old, &new): a0 holds the address of A's context, a1 the address of B's.",
    at: at(9, 9),
    state: { cpu: { ra: "A", sp: "A", s: "A" }, a: A0, b: BF, stack: "A", runs: "A" },
    acts: []
  }, {
    label: "Save ra and sp",
    text: "sd stores one 8-byte register into memory. sd ra, 0(a0) stores ra at the address in a0 plus 0, and sd sp, 8(a0) stores sp 8 bytes further on.",
    at: at(10, 11),
    state: { cpu: { ra: "A", sp: "A", s: "A" }, a: { ra: "A", sp: "A", s: null }, b: BF, stack: "A", runs: "A" },
    acts: [{ op: "sd", reg: "ra", label: "sd ra, 0(a0)" }, { op: "sd", reg: "sp", label: "sd sp, 8(a0)" }]
  }, {
    label: "Save s0 to s11",
    text: "The other 12 go 8 bytes apart, up to sd s11, 104(a0): s11 is the 14th register, and 13 × 8 = 104. Now everything the kernel needs to continue A later is in memory.",
    at: at(12, 23),
    state: { cpu: { ra: "A", sp: "A", s: "A" }, a: AF, b: BF, stack: "A", runs: "A" },
    acts: [{ op: "sd", reg: "s", label: "sd s0 ... sd s11" }]
  }, {
    label: "Load ra and sp from B",
    text: "ld loads one 8-byte register from memory. ld ra, 0(a1) loads B's saved return address. Line 26, ld sp, 8(a1), loads B's stack pointer: before it the kernel stands on A's kernel stack, after it on B's.",
    at: at(25, 26),
    state: { cpu: { ra: "B", sp: "B", s: "A" }, a: AF, b: BF, stack: "B", runs: "A" },
    acts: [{ op: "ld", reg: "ra", label: "ld ra, 0(a1)" }, { op: "ld", reg: "sp", label: "ld sp, 8(a1)" }],
    event: "Line 26 swaps the stack. This is the point of no return.", eventKind: "warn"
  }, {
    label: "Load s0 to s11",
    text: "The other 12 of B's saved registers come in, up to ld s11, 104(a1). B's caller-saved values are on B's stack, and now that sp points there, they are back within reach.",
    at: at(27, 38),
    state: { cpu: { ra: "B", sp: "B", s: "B" }, a: AF, b: BF, stack: "B", runs: "A" },
    acts: [{ op: "ld", reg: "s", label: "ld s0 ... ld s11" }]
  }, {
    label: "ret into B",
    text: "ret jumps to B's saved return address. swtch was called by A's kernel code, and it returns into B's. B continues from where it was switched out last time, inside this same routine.",
    at: at(40, 40),
    state: { cpu: { ra: "B", sp: "B", s: "B" }, a: AF, b: BF, stack: "B", runs: "B" },
    acts: [{ op: "ret", reg: "ra", label: "ret" }],
    event: "14 stores + 14 loads + 1 ret = 29 instructions. In xv6 the two ends are A and the scheduler, then the scheduler and B (Extra 26).", eventKind: "good"
  }];

  // ---- the scene
  var COLA = "#1f6f8b", COLB = "#b5651d", SAVE = "#b23a48", LOAD = "#2a7a6b", YEL = "#e8b23a";
  var COL = { pc: [12, 72], ra: [80, 150], sp: [158, 228], s: [236, 348] };
  var VAL = { ra: "ra", sp: "sp", s: "s0..s11" };
  var Y = { aBox: 4, aRow: 28, aCtx: 70, cpuBox: 156, cpu: 186, bBox: 298, bCtx: 308, bRow: 352 };
  var FH = 36;                                   // field height
  function cx(r) { return (COL[r][0] + COL[r][1]) / 2; }
  function who(o) { return o === "A" ? COLA : COLB; }

  function scene(s, H, ctx) {
    var st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    var LIGHT = "var(--md-default-fg-color--light)";
    function field(r, y, title, changed) {
      var x0 = COL[r][0], x1 = COL[r][1];
      out.push(H.box(x0, y, x1 - x0, FH, { r: 6, fill: changed ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: changed ? YEL : "transparent", sw: 1.6, cls: changed ? "anim-new" : "" }));
      out.push(H.text(x0 + 5, y + 12, title, { size: 10, anchor: "start", color: LIGHT, mono: true }));
    }
    function value(r, y, owner) {
      if (owner) out.push(H.text(cx(r), y + 29, owner + "'s " + VAL[r], { size: 12, weight: 700, mono: true, color: who(owner) }));
      else out.push(H.text(cx(r), y + 29, "not saved yet", { size: 10, italic: true, color: LIGHT }));
    }
    function record(p, y0, ctxY, rowY) {
      var c = who(p), mine = p === "A" ? st.a : st.b, was = p === "A" ? pv.a : pv.b;
      out.push(H.box(4, y0, 352, 108, { r: 10, stroke: c, sw: 1.6 }));
      var ty = p === "A" ? y0 + 16 : y0 + 101;
      out.push(H.text(14, ty, p + "'s record (struct proc)", { size: 12, weight: 700, anchor: "start", color: c }));
      out.push(H.text(346, ty, (p === "A" ? "a0" : "a1") + " points to its context", { size: 10, anchor: "end", color: LIGHT }));
      out.push(H.lines(cx("pc"), ctxY + 15, ["struct", "context"], { size: 10.5, weight: 700, color: c, lh: 13 }));
      field("ra", ctxY, "ra +0", mine.ra !== was.ra); value("ra", ctxY, mine.ra);
      field("sp", ctxY, "sp +8", mine.sp !== was.sp); value("sp", ctxY, mine.sp);
      field("s", ctxY, "s0..s11 +16..+104", mine.s !== was.s); value("s", ctxY, mine.s);
      // kernel stack and trapframe
      var on = st.stack === p, ch = st.stack !== pv.stack && on;
      out.push(H.box(12, rowY, 164, 28, { r: 6, fill: ch ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: on ? (ch ? YEL : c) : "transparent", sw: 1.6, cls: ch ? "anim-new" : "" }));
      out.push(H.text(on ? 54 : 94, rowY + 18, "kernel stack", { size: 11 }));
      if (on) out.push(H.text(168, rowY + 18, "sp is here", { size: 10, weight: 700, anchor: "end", color: c, cls: ch ? "anim-pop" : "" }));
      out.push(H.box(184, rowY, 164, 28, { r: 6, fill: "var(--md-code-bg-color)", stroke: "transparent" }));
      out.push(H.text(266, rowY + 18, "trapframe: " + p + "'s user regs", { size: 10.5 }));
    }
    record("A", Y.aBox, Y.aCtx, Y.aRow);
    record("B", Y.bBox, Y.bCtx, Y.bRow);

    // the CPU: the pc (where it executes) and the 14 registers swtch moves
    var runB = st.runs === "B";
    out.push(H.box(4, Y.cpuBox, 352, 100, { r: 10, fill: runB ? "rgba(181,101,29,.08)" : "rgba(31,111,139,.06)", stroke: "var(--md-default-fg-color)", sw: 2 }));
    out.push(H.text(14, Y.cpuBox + 92, runB ? "CPU: now running B" : "CPU", { size: 12, weight: 700, anchor: "start", color: runB ? COLB : "var(--md-default-fg-color)", cls: st.runs !== pv.runs ? "anim-new" : "" }));
    var pch = st.runs !== pv.runs;
    field("pc", Y.cpu, "pc", pch);
    if (runB) out.push(H.text(cx("pc"), Y.cpu + 29, "B's ra", { size: 11, weight: 700, mono: true, color: COLB, cls: pch ? "anim-pop" : "" }));
    else out.push(H.text(cx("pc"), Y.cpu + 29, "swtch", { size: 11, weight: 700, mono: true, color: COLA }));
    ["ra", "sp", "s"].forEach(function (r) {
      field(r, Y.cpu, r === "s" ? "s0 .. s11" : r, st.cpu[r] !== pv.cpu[r]);
      value(r, Y.cpu, st.cpu[r]);
    });

    // this step's action
    var sdY = { ra: 124, sp: 146, s: 136 }, ldY = { ra: 268, sp: 288, s: 278 };
    (s.acts || []).forEach(function (a) {
      var x = cx(a.reg);
      if (a.op === "sd") out.push(H.arrow(x, Y.cpu - 2, x, Y.aCtx + FH + 3, { color: SAVE, label: a.label, mono: true, lpos: [x, sdY[a.reg]], sw: 2.4 }));
      if (a.op === "ld") out.push(H.arrow(x, Y.bCtx - 3, x, Y.cpu + FH + 2, { color: LOAD, label: a.label, mono: true, lpos: [x, ldY[a.reg]], sw: 2.4 }));
      if (a.op === "ret") out.push(H.arrow(cx("ra") - 8, Y.cpu - 1, cx("pc") + 4, Y.cpu - 2, { color: COLB, bend: [0, -26], label: a.label, mono: true, lpos: [(cx("ra") + cx("pc")) / 2 - 2, Y.cpu - 14], sw: 2.4 }));
    });
    return out.join("");
  }

  window.OS_ANIMS.swtch = {
    title: "The context switch: save A, load B, return into B (kernel/swtch.S)",
    interval: 4600,
    threads: ["CPU", "A", "B"],
    colors: { CPU: "#555e6b", A: COLA, B: COLB },
    codeTitle: "kernel/swtch.S (Figure 6.4), with the line numbers of xv6-riscv",
    sceneBox: "0 0 360 410",
    scene: scene,
    code: code,
    variants: [{ key: "ab", label: "A to B", steps: steps }]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
