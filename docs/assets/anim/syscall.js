// One system call, fork(), as a round trip through xv6 (W02 class 2, Sections 4.3 to 4.6).
// The page prints no numbered code listing for this, so the panel on the left is Figure 4.13 itself: the six stations,
// each file's line as the figure prints it, numbered by station. The steps follow Section 4.6's stations in order, with
// Section 4.5's step numbers in the labels (the hardware's two steps sit at the ecall and at the sret, as 4.6 says).
// The scene: user space on top (the program and the fork stub of station 1), the mode boundary, the kernel below with
// stations 2 to 6 around p->trapframe, and the CPU's registers that the page names as one block at the bottom.
// Each step's arrow is the move to the current stop, labeled with the instruction or function the page names.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  var code = [
    { n: null, text: "xv6-setup-student/user/usys.S" },
    { n: 1, text: "  fork:  li a7, SYS_fork;  ecall" },
    { n: null, text: "xv6-setup-student/kernel/trampoline.S" },
    { n: 2, text: "  uservec: save 31 regs → trapframe;" },
    { n: null, text: "  switch to the kernel page table" },
    { n: null, text: "xv6-setup-student/kernel/trap.c" },
    { n: 3, text: "  usertrap(): scause==8?  epc+=4;  syscall()" },
    { n: null, text: "xv6-setup-student/kernel/syscall.c" },
    { n: 4, text: "  num = trapframe->a7;" },
    { n: null, text: "  trapframe->a0 = syscalls[num]()" },
    { n: null, text: "xv6-setup-student/kernel/trap.c" },
    { n: 5, text: "  prepare_return(): set sstatus, sepc" },
    { n: null, text: "xv6-setup-student/kernel/trampoline.S" },
    { n: 6, text: "  userret: user page table;" },
    { n: null, text: "  restore 31 regs;  sret" }
  ];

  // state: cpu {priv, a7, a0, sp, pt, scause, sepc, spp, stvec}, tf {a7, a0, epc, regs} (p->trapframe),
  //   cur (the current stop: "prog" or 1..6), who (prog | hw | kern), ins (the stub's instruction: li | ecall | ret),
  //   rc (the program's variable), fork (station 4 shows sys_fork)
  // move: the arrow of this step {from, to, label}
  function merge(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
  var cpu0 = { priv: "user", a7: "-", a0: "-", sp: "user stack", pt: "user", scause: "-", sepc: "-", spp: "-", stvec: "user-trap handler" };
  var tf0 = { a7: "-", a0: "-", epc: "-", regs: "-" };
  var cpu = cpu0, tf = tf0;
  function S(label, text, o, cpuCh, tfCh) {
    if (cpuCh) cpu = merge(cpu, cpuCh);
    if (tfCh) tf = merge(tf, tfCh);
    o.label = label; o.text = text;
    o.state = merge({ cpu: cpu, tf: tf, rc: null, fork: tf.a0 === "fork's result" }, o.state || {});
    return o;
  }

  var steps = [
    S("Start", "Your program runs in user mode and calls fork(). The C function fork() is a three-line stub in user/usys.S.", {
      at: [{ who: "prog", line: 1 }], state: { cur: 1, who: "prog", ins: null },
      move: { from: "prog", to: 1, label: "fork()" },
      event: "stvec already points at the user-trap handler, in the trampoline.", eventKind: "info" }),
    S("Station 1 · step 1", "li a7, SYS_fork puts the call number in register a7. For fork that number is 1.", {
      at: [{ who: "prog", line: 1 }], state: { cur: 1, who: "prog", ins: "li" } },
      { a7: "1" }),
    S("ecall · step 2", "ecall traps. In this one instruction the hardware saves the user PC in sepc, writes the cause into scause, records the old level in sstatus.SPP, switches to kernel mode and jumps to stvec.", {
      at: [{ who: "hw", line: 1 }], state: { cur: 2, who: "hw", ins: "ecall" },
      move: { from: 1, to: 2, label: "ecall" },
      event: "The program chose only the number in a7. Only the kernel can set stvec.", eventKind: "info" },
      { priv: "kernel", sepc: "ecall's addr", scause: "8 (system call)", spp: "0: came from user" }),
    S("Station 2 · step 3", "uservec parks a0 in sscratch, loads the trapframe's address into a0, and saves the 31 registers into p->trapframe. Then it loads sp with the kernel stack, switches to the kernel page table and jumps to usertrap.", {
      at: [{ who: "kern", line: 2 }], state: { cur: 2, who: "kern", ins: null },
      move: { from: 2, to: "tf", label: "save 31 regs" },
      event: "Assembly, because C needs a stack and free registers, and neither is set up yet.", eventKind: "info" },
      { a0: "trapframe addr", sp: "kernel stack", pt: "kernel" }, { a7: "1", a0: "user's a0", regs: "31 saved" }),
    S("Station 3 · step 4", "usertrap() in C reads scause: 8 means a system call from user mode. It keeps the saved PC as epc, adds 4 so the return lands after the ecall, and calls syscall().", {
      at: [{ who: "kern", line: 3 }], state: { cur: 3, who: "kern", ins: null },
      move: { from: 2, to: 3, label: "usertrap()" },
      event: "Just after entering the kernel, xv6 points stvec at its kernel-trap handler (trap.c line 47).", eventKind: "info" },
      { stvec: "kernel-trap handler" }, { epc: "ecall + 4" }),
    S("Station 4 · step 4", "syscall() runs num = p->trapframe->a7, which is 1, and calls syscalls[1](), that is sys_fork(). The result goes into the saved a0.", {
      at: [{ who: "kern", line: 4 }], state: { cur: 4, who: "kern", ins: null },
      move: { from: 3, to: 4, label: "syscall()" } },
      null, { a0: "fork's result" }),
    S("Station 5", "prepare_return() sets the two registers that sret will use. It clears sstatus.SPP, which means user, and puts the saved epc, the instruction after the ecall, into sepc.", {
      at: [{ who: "kern", line: 5 }], state: { cur: 5, who: "kern", ins: null },
      move: { from: 4, to: 5, label: "prepare_return" },
      event: "Just before the return to user code, stvec points back at the user-trap handler (trap.c line 111).", eventKind: "info" },
      { spp: "0: return to user", sepc: "ecall + 4", stvec: "user-trap handler" }),
    S("Station 6 · step 5", "userret switches back to the user page table first, because the trapframe sits at a user address. Then it restores the 31 registers, so a0 now holds fork's result.", {
      at: [{ who: "kern", line: 6 }], state: { cur: 6, who: "kern", ins: null },
      move: { from: 5, to: 6, label: "userret" } },
      { pt: "user", sp: "user stack", a0: "fork's result", a7: "1" }, { regs: "read back" }),
    S("sret · step 6", "sret drops to user mode, because SPP names user, and jumps to the address in sepc: the instruction after the ecall.", {
      at: [{ who: "hw", line: 6 }], state: { cur: 1, who: "hw", ins: "ret" },
      move: { from: 6, to: 1, label: "sret" },
      event: "The program resumes exactly where it trapped, back in the restricted world.", eventKind: "good" },
      { priv: "user" }),
    S("Back in the program", "The stub's ret returns to the caller. The result of fork appears in the program's variable rc.", {
      at: [{ who: "prog", line: 1 }], state: { cur: "prog", who: "prog", ins: "ret", rc: "fork's result" },
      move: { from: 1, to: "prog", label: "ret" },
      event: "Round trip: user, ecall, kernel does the work, sret, user.", eventKind: "good" })
  ];

  // ---- the scene
  var COL = { prog: "#2e7d32", hw: "#b5651d", kern: "#1f4e8b" };
  var MUTED = "var(--md-default-fg-color--light)", YEL = "rgba(232,178,58,.30)", YELS = "#e8b23a";
  var PROG = { x: 180, y: 8, w: 120, h: 34 };
  var ST = {
    1: { x: 10, y: 48, w: 340, h: 42, file: "user/usys.S", fn: "fork stub" },
    2: { x: 10, y: 116, w: 104, h: 44, file: "trampoline.S", fn: "uservec" },
    3: { x: 10, y: 184, w: 104, h: 44, file: "trap.c", fn: "usertrap()" },
    4: { x: 106, y: 256, w: 148, h: 44, file: "syscall.c", fn: "syscall()" },
    5: { x: 244, y: 184, w: 108, h: 44, file: "trap.c", fn: "prepare_return()" },
    6: { x: 244, y: 116, w: 108, h: 44, file: "trampoline.S", fn: "userret" }
  };
  var TF = { x: 128, y: 116, w: 102, h: 112 };
  var INS = { li: [18, 120], ecall: [138, 178], ret: [296, 324] };     // x ranges of the stub's instructions
  var CPU = { x: 4, y: 316 };
  var CCOL = [[10, 96], [110, 96], [210, 140]];                       // x, width of the three register columns
  var CELLS = [["priv", "privilege level"], ["a7", "a7"], ["a0", "a0"],
               ["sp", "sp"], ["pt", "page table"], ["spp", "sstatus.SPP"],
               ["sepc", "sepc"], ["scause", "scause"], ["stvec", "stvec"]];

  function scene(s, H, ctx) {
    var st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [], who = COL[st.who];
    function hot(n) { return st.cur === n; }
    function stopBox(b, on) {
      return H.box(b.x, b.y, b.w, b.h, { r: 8, fill: on ? "rgba(" + (st.who === "hw" ? "181,101,29" : st.who === "prog" ? "46,125,50" : "31,78,139") + ",.13)" : "var(--md-default-bg-color)",
        stroke: on ? who : "var(--md-default-fg-color--lighter)", sw: on ? 2.8 : 1.2 });
    }
    function badge(x, y, n, on) {
      return '<circle cx="' + x + '" cy="' + y + '" r="7.5" style="fill:' + (on ? who : "var(--md-default-fg-color--light)") + '"/>' + H.text(x, y + 3.8, String(n), { size: 10.5, weight: 700, color: "#fff" });
    }

    // the two worlds and the boundary between them
    out.push(H.box(4, 4, 352, 92, { r: 10, fill: "rgba(46,125,50,.07)", stroke: "rgba(46,125,50,.45)", sw: 1.2 }));
    out.push(H.text(12, 19, "user space", { size: 10.5, weight: 700, anchor: "start", color: COL.prog }));
    out.push(H.text(12, 32, "user mode", { size: 10, anchor: "start", color: COL.prog }));
    out.push(H.box(4, 106, 352, 202, { r: 10, fill: "rgba(31,78,139,.06)", stroke: "rgba(31,78,139,.45)", sw: 1.2 }));
    out.push(H.text(12, 287, "kernel space", { size: 10.5, weight: 700, anchor: "start", color: COL.kern }));
    out.push(H.text(12, 300, "kernel mode", { size: 10, anchor: "start", color: COL.kern }));
    out.push('<line x1="4" y1="101" x2="356" y2="101" style="stroke:var(--md-default-fg-color--light);stroke-width:1.4" stroke-dasharray="6 4"/>');
    out.push(H.box(196, 95, 76, 12, { r: 3, fill: "var(--md-default-bg-color)", stroke: "transparent" }));
    out.push(H.text(234, 104.5, "mode boundary", { size: 10, weight: 700, color: MUTED }));

    // the program
    var rcCh = st.rc && !pv.rc;
    out.push(H.box(PROG.x, PROG.y, PROG.w, PROG.h, { r: 8, fill: rcCh ? YEL : (hot("prog") ? "rgba(46,125,50,.13)" : "var(--md-default-bg-color)"), stroke: hot("prog") ? COL.prog : "var(--md-default-fg-color--lighter)", sw: hot("prog") ? 2.8 : 1.2 }));
    out.push(H.text(PROG.x + PROG.w / 2, PROG.y + 14, st.rc ? "rc = " + st.rc : "your program", { size: 10, weight: st.rc ? 700 : 400, color: st.rc ? COL.prog : MUTED, cls: rcCh ? "anim-pop" : "" }));
    out.push(H.text(PROG.x + PROG.w / 2, PROG.y + 28, "rc = fork();", { size: 11, mono: true }));

    // station 1, the stub, with its three instructions
    var b1 = ST[1];
    out.push(stopBox(b1, hot(1)));
    out.push(badge(b1.x + 12, b1.y + 13, 1, hot(1)));
    out.push(H.text(b1.x + 24, b1.y + 17, "user/usys.S", { size: 10.5, weight: 700, anchor: "start", mono: true }));
    out.push(H.text(b1.x + 116, b1.y + 17, "the fork stub", { size: 10, anchor: "start", color: MUTED }));
    [["li", "li a7, SYS_fork"], ["ecall", "ecall"], ["ret", "ret"]].forEach(function (p) {
      var r = INS[p[0]], on = st.ins === p[0];
      if (on) out.push(H.box(r[0] - 4, b1.y + 23, r[1] - r[0] + 8, 16, { r: 4, fill: YEL, stroke: YELS, sw: 1.2, cls: "anim-new" }));
      out.push(H.text(r[0], b1.y + 35, p[1], { size: 11, mono: true, anchor: "start", weight: on ? 700 : 400 }));
    });

    // stations 2 to 6
    [2, 3, 4, 5, 6].forEach(function (n) {
      var b = ST[n], on = hot(n);
      out.push(stopBox(b, on));
      out.push(badge(b.x + 12, b.y + 13, n, on));
      out.push(H.text(b.x + 24, b.y + 17, b.file, { size: 10.5, weight: 700, anchor: "start", mono: true }));
      var fn = n === 4 && st.fork ? "syscall() → sys_fork()" : b.fn;
      out.push(H.text(b.x + 8, b.y + 35, fn, { size: 10, anchor: "start", mono: true, color: on ? who : "var(--md-default-fg-color)", weight: on ? 700 : 400, cls: n === 4 && st.fork && !pv.fork ? "anim-new" : "" }));
    });

    // p->trapframe, in the middle of the loop
    out.push(H.box(TF.x, TF.y, TF.w, TF.h, { r: 8, fill: "var(--md-default-bg-color)", stroke: "var(--md-default-fg-color--light)", sw: 1.6 }));
    out.push(H.text(TF.x + TF.w / 2, TF.y + 15, "p->trapframe", { size: 10.5, weight: 700, mono: true }));
    [["a7", "a7"], ["a0", "a0"], ["epc", "epc"], ["regs", "regs"]].forEach(function (f, i) {
      var y = TF.y + 22 + i * 22, ch = pv.tf[f[0]] !== st.tf[f[0]];
      out.push(H.box(TF.x + 5, y, TF.w - 10, 19, { r: 4, fill: ch ? YEL : "var(--md-code-bg-color)", stroke: ch ? YELS : "transparent", sw: 1.2, cls: ch ? "anim-new" : "" }));
      out.push(H.text(TF.x + 10, y + 13.5, f[1], { size: 10, anchor: "start", mono: true, color: MUTED }));
      out.push(H.text(TF.x + TF.w - 9, y + 13.5, st.tf[f[0]], { size: 10, anchor: "end", weight: 700 }));
    });

    // the CPU's registers, one block
    out.push(H.box(CPU.x, CPU.y, 352, 122, { r: 10, stroke: "var(--md-default-fg-color--light)", sw: 1.6 }));
    out.push(H.text(12, CPU.y + 15, "CPU", { size: 11, weight: 700, anchor: "start" }));
    out.push(H.text(40, CPU.y + 15, "the registers the page names", { size: 10, anchor: "start", color: MUTED }));
    CELLS.forEach(function (f, i) {
      var cc = CCOL[i % 3], y = CPU.y + 22 + Math.floor(i / 3) * 33, v = st.cpu[f[0]], ch = pv.cpu[f[0]] !== v;
      out.push(H.box(cc[0], y, cc[1], 30, { r: 6, fill: ch ? YEL : "var(--md-code-bg-color)", stroke: ch ? YELS : "transparent", sw: 1.4, cls: ch ? "anim-new" : "" }));
      out.push(H.text(cc[0] + 6, y + 11, f[1], { size: 10, anchor: "start", color: MUTED, mono: f[0] !== "priv" && f[0] !== "pt" }));
      var col = f[0] === "priv" ? (v === "kernel" ? COL.kern : COL.prog) : "var(--md-default-fg-color)";
      out.push(H.text(cc[0] + 6, y + 25, v, { size: 11, anchor: "start", weight: 700, color: col }));
    });

    // the move of this step
    var m = s.move;
    if (m) {
      var mc = st.who === "hw" ? COL.hw : who, o = { color: mc, label: m.label, mono: true, sw: 2.4 };
      if (m.from === "prog") { o.bend = [0, -12]; o.lpos = [122, 26]; out.push(H.arrow(PROG.x - 2, PROG.y + 17, 70, b1.y - 1, o)); }
      if (m.from === 1 && m.to === 2) { o.lpos = [96, 103]; out.push(H.arrow(156, b1.y + b1.h + 1, 62, ST[2].y - 2, o)); }
      if (m.to === "tf") { o.bend = [14, 4]; o.lpos = [62, 172]; out.push(H.arrow(ST[2].x + ST[2].w - 10, ST[2].y + ST[2].h + 1, TF.x - 2, TF.y + 98, o)); }
      if (m.from === 2 && m.to === 3) { o.lpos = [62, 172]; out.push(H.arrow(62, ST[2].y + ST[2].h + 1, 62, ST[3].y - 2, o)); }
      if (m.from === 3) { o.bend = [-14, 10]; o.lpos = [62, 242]; out.push(H.arrow(62, ST[3].y + ST[3].h + 1, ST[4].x - 2, ST[4].y + 22, o)); }
      if (m.from === 4) { o.bend = [14, 10]; o.lpos = [298, 244]; out.push(H.arrow(ST[4].x + ST[4].w + 1, ST[4].y + 22, 298, ST[5].y + ST[5].h + 2, o)); }
      if (m.from === 5) { o.lpos = [298, 172]; out.push(H.arrow(298, ST[5].y - 1, 298, ST[6].y + ST[6].h + 2, o)); }
      if (m.from === 6) { o.lpos = [334, 103]; out.push(H.arrow(298, ST[6].y - 1, 310, b1.y + b1.h + 2, o)); }
      if (m.to === "prog") { o.bend = [16, -6]; o.lpos = [334, 26]; out.push(H.arrow(318, b1.y + 22, PROG.x + PROG.w + 2, PROG.y + 17, o)); }
    }
    return out.join("");
  }

  window.OS_ANIMS.syscall = {
    title: "One system call, fork(), through six stations of xv6",
    interval: 5200,
    threads: ["prog", "hw", "kern"],
    colors: COL,
    codeTitle: "Figure 4.13: one system call as six stations in four files of xv6",
    sceneBox: "0 0 360 442",
    scene: scene,
    code: code,
    variants: [
      { key: "trip", label: "fork(), round trip", steps: steps }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
