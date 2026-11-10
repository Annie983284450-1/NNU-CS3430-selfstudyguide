// uartputc_sync(), polling the UART: W11 class 1, Section 1.5 (kernel/uart.c lines 106 to 124).
// The page states it is a reading of the code, not a capture: the chip's timing is drawn, not measured. The steps
// are the page's numbered list and table (and the deck's UART_STEPS in _buildscripts/w11/anim_w11.py): the kernel
// prints A while the UART sends h and i waits in THR; line 118 reads LSR twice and finds bit 5 at 0; the chip moves
// i onto the wire and sets bit 5 by itself; line 118 reads 1 and the loop ends; line 120 writes A into THR.
// The picture: the UART as one structure (LSR bit 5, THR, the character on the wire), and below it the CPU, with an
// arrow to the register it touches at each step, and the console the wire leads to.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  var code = [
    [106, "void"],
    [107, "uartputc_sync(int c)"],
    [108, "{"],
    [109, "  if(panicking == 0)"],
    [110, "    push_off();"],
    [111, ""],
    [112, "  if(panicked){"],
    [113, "    for(;;)"],
    [114, "      ;"],
    [115, "  }"],
    [116, ""],
    [117, "  // wait for Transmit Holding Empty to be set in LSR."],
    [118, "  while((ReadReg(LSR) & LSR_TX_IDLE) == 0)"],
    [119, "    ;"],
    [120, "  WriteReg(THR, c);"],
    [121, ""],
    [122, "  if(panicking == 0)"],
    [123, "    pop_off();"],
    [124, "}"]
  ].map(function (x) { return { n: x[0], text: x[1] }; });

  // state: idle (LSR bit 5 shown as text), thr, out (on the wire), screen, cpu (what the CPU is doing), asks
  function st(idle, thr, out, screen, cpu, asks) { return { idle: idle, thr: thr, out: out, screen: screen, cpu: cpu, asks: asks }; }

  var steps = [{
    label: "Start",
    text: "The kernel wants to print the letter A, so it calls uartputc_sync('A'). The UART is sending h on the wire, and i still waits in THR, so bit 5 of LSR is 0. Interrupts go off (line 110).",
    at: [{ who: "CPU", line: 110 }], state: st("0: THR full", "i", "h", "(earlier text)", "in uartputc_sync()", 0), acts: []
  }, {
    label: "Step 1",
    text: "Line 118 reads LSR. Bit 5 is 0, because THR still holds i. So the while loop goes round.",
    at: [{ who: "CPU", line: 118 }], state: st("0: THR full", "i", "h", "(earlier text)", "asking", 1),
    acts: [{ to: "idle", label: "line 118: ReadReg(LSR)", kind: "info" }],
    event: "Bit 5 is 0: wait.", eventKind: "warn"
  }, {
    label: "Step 2",
    text: "Line 118 reads LSR again. Still 0. Nothing has changed, and the CPU does nothing but ask.",
    at: [{ who: "CPU", line: 118 }], state: st("0: THR full", "i", "h", "(earlier text)", "asking", 2),
    acts: [{ to: "idle", label: "line 118: ReadReg(LSR)", kind: "info" }],
    event: "Still 0: the CPU is busy asking, and runs nothing else.", eventKind: "warn"
  }, {
    label: "Step 3",
    text: "Meanwhile, inside the UART, h finishes going out, and the chip moves i from THR onto the wire. THR is empty, so the chip sets bit 5 to 1 by itself. The CPU has not looked yet.",
    at: [{ who: "CPU", line: 118 }], state: st("1: THR empty", "(empty)", "i", "...h", "asking", 2),
    acts: [{ to: "chip", kind: "info" }],
    event: "The chip moved i along, by itself.", eventKind: "info"
  }, {
    label: "Step 4",
    text: "Line 118 reads LSR once more. Bit 5 is 1 now, so the loop ends.",
    at: [{ who: "CPU", line: 118 }], state: st("1: THR empty", "(empty)", "i", "...h", "done asking", 3),
    acts: [{ to: "idle", label: "line 118: ReadReg(LSR)", kind: "ok" }],
    event: "Bit 5 is 1: the UART can take a character.", eventKind: "good"
  }, {
    label: "Step 5",
    text: "Line 120 writes A into THR. That one store is the data and the command at once: A will go out after i, and bit 5 goes back to 0.",
    at: [{ who: "CPU", line: 120 }], state: st("0: THR full", "A", "i", "...h", "wrote A", 3),
    acts: [{ to: "thr", label: "line 120: WriteReg(THR, c)", kind: "ok" }],
    event: "Three asks for one character. The next character waits in the same loop.", eventKind: "info"
  }];

  var KIND = { info: "#1f6f8b", ok: "#2a7a6b", bad: "#b23a48" };
  var AMBER = "#a0632a", NAVY = "#1f3864";
  var FY = 40, FH = 66;                                   // the three register fields
  var F = { idle: { x: 18, w: 120 }, thr: { x: 146, w: 94 }, out: { x: 248, w: 94 } };

  function scene(s, H, ctx) {
    var S = s.state, P = ctx.prev ? ctx.prev.state : S, out = [];
    function changed(k) { return ctx.prev && S[k] !== P[k]; }
    function field(k, label, val, big) {
      var f = F[k], hot = changed(k);
      out.push(H.box(f.x, FY, f.w, FH, { r: 6, fill: hot ? "rgba(232,178,58,.28)" : "var(--md-code-bg-color)", stroke: hot ? "#c8901e" : "var(--md-default-fg-color--lighter)", sw: hot ? 2 : 1.2 }));
      out.push(H.text(f.x + f.w / 2, FY + 16, label, { size: 10, color: "var(--md-default-fg-color--light)" }));
      out.push(H.text(f.x + f.w / 2, FY + 46, val, { size: big && val.length < 4 ? 20 : 13, weight: 700, mono: big, cls: hot ? "anim-pop" : "" }));
    }
    // the UART, one structure
    out.push(H.box(8, 8, 344, 108, { r: 9, stroke: AMBER, sw: 1.8 }));
    out.push(H.text(18, 28, "the UART chip", { anchor: "start", size: 12.5, weight: 700, color: AMBER }));
    field("idle", "LSR, bit 5 (TX_IDLE)", S.idle, false);
    field("thr", "THR (register 0)", S.thr, true);
    field("out", "on the wire", S.out, true);
    // the console, beside the CPU
    var hotScreen = changed("screen");
    out.push(H.box(160, 226, 192, 72, { r: 6, fill: hotScreen ? "rgba(232,178,58,.28)" : "var(--md-code-bg-color)", stroke: "var(--md-default-fg-color--lighter)", sw: 1.2 }));
    out.push(H.text(256, 246, "the console (QEMU's terminal)", { size: 10.5, color: "var(--md-default-fg-color--light)" }));
    out.push(H.text(256, 280, S.screen, { size: 15, weight: 700, mono: true }));
    // the CPU
    out.push(H.box(8, 226, 140, 72, { r: 9, fill: "rgba(31,56,100,.10)", stroke: NAVY, sw: 1.8 }));
    out.push(H.text(78, 245, "CPU", { size: 13, weight: 700, color: NAVY }));
    out.push(H.text(78, 264, S.cpu, { size: 11.5, color: NAVY }));
    out.push(H.text(78, 287, "times it asked: " + S.asks, { size: 11.5, weight: 700, color: S.asks >= 2 ? "#b23a48" : NAVY }));
    (s.acts || []).forEach(function (a) {
      var c = KIND[a.kind || "info"];
      if (a.to === "chip") {               // inside the chip: the wire finishes h, i moves on, the console gets h
        out.push(H.arrow(295, FY + FH + 1, 295, 225, { color: AMBER, sw: 2.2 }));
        out.push(H.arrow(F.thr.x + F.thr.w - 4, FY + 34, F.out.x + 4, FY + 34, { color: AMBER, sw: 2.2 }));
        return;
      }
      var f = F[a.to], tx = f.x + f.w / 2;
      out.push(H.arrow(70, 225, tx, FY + FH + 1, { color: c, label: a.label, mono: true, lpos: [150, 172], sw: 2.4 }));
    });
    return out.join("");
  }

  window.OS_ANIMS.w11uart = {
    title: "uartputc_sync(), step by step: ask, ask again, write",
    interval: 4200,
    threads: ["CPU"],
    colors: { CPU: "#1f3864" },
    sceneBox: "0 0 360 302",
    scene: scene,
    code: code,
    codeTitle: "kernel/uart.c, lines 106 to 124",
    variants: [{ key: "poll", label: "Printing one character", steps: steps }]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
