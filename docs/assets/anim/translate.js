// Translating virtual address 21 (W04 class 2, Section 4.3, with the setup of Sections 4.1 and 4.2): the 64-byte
// address space of four 16-byte pages, the page table 0 -> 3, 1 -> 7, 2 -> 5, 3 -> 2 (Figure 4.6), physical memory of
// eight 16-byte frames (Figure 4.5, OSTEP Figures 18.1 and 18.2), and the four steps of Section 4.3 (Figure 4.7).
// The panel on the left is not code: it lists the page's four numbered steps, in the words of the page and its figure.
// The picture is one scene: the virtual address as a bit bar on top, split into VPN and offset; the page table below
// it; physical memory as eight frames on the right; the physical address bar at the bottom. Each step is one arrow:
// VPN -> its row, the row's PFN -> the physical address, the offset straight down, and the row's PFN -> its frame.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  var code = [
    { n: null, text: "movl 21, %eax" },
    { n: 1, text: "21 = 16 + 4 + 1, so it is 010101" },
    { n: 2, text: "VPN = 01 = 1" },
    { n: null, text: "offset = 0101 = 5" },
    { n: 3, text: "page table[1] = 7 = 111" },
    { n: 4, text: "111 followed by 0101 gives 1110101" },
    { n: null, text: "1110101 = 117 = 7 × 16 + 5" }
  ];

  // state: bits (the binary is written), split (VPN and offset marked), look (row 1 read), pfn (the PFN glued in),
  // off (the offset copied), check (frame 7 checked). act: the one arrow of this step.
  function S(label, text, line, st, act, ev, evk) {
    return { label: label, text: text, at: line ? [{ who: "HW", line: line }] : [], state: st, act: act,
             event: ev || null, eventKind: evk || "info" };
  }
  var steps = [
    S("Start", "The program runs movl 21, %eax: load the value at virtual address 21. The page table says page 0 is in frame 3, page 1 in frame 7, page 2 in frame 5, and page 3 in frame 2.", null,
      { bits: false, split: false, look: false, pfn: false, off: false, check: false }, null),
    S("Step 1", "Write the address in binary with six bits, because the address space has 64 = 2^6 bytes. 21 = 16 + 4 + 1, so it is 010101.", 1,
      { bits: true, split: false, look: false, pfn: false, off: false, check: false }, null),
    S("Step 2", "Split it. Four pages need two bits and sixteen bytes need four, so the top two bits are the VPN, 01 = 1, and the bottom four are the offset, 0101 = 5. Address 21 is byte 5 of page 1, and 16 + 5 = 21.", 2,
      { bits: true, split: true, look: false, pfn: false, off: false, check: false }, null),
    S("Step 3", "Look up the VPN in the page table. Row 1 says frame 7, which is 111 in three bits, because there are eight frames (2^3 = 8).", 3,
      { bits: true, split: true, look: true, pfn: false, off: false, check: false }, "look"),
    S("Step 4, frame", "Glue: put the frame number where the page number was. The PFN is one bit wider than the VPN, because physical memory (128 bytes) is twice the size of the address space (64 bytes).", 4,
      { bits: true, split: true, look: true, pfn: true, off: false, check: false }, "pfn"),
    S("Step 4, offset", "Keep the offset exactly as it is: 0101 is copied straight across, because a page and a frame are the same size. 111 followed by 0101 gives 1110101, which is 117.", 4,
      { bits: true, split: true, look: true, pfn: true, off: true, check: false }, "off",
      "Split, look up, glue: no subtraction and no add.", "info"),
    S("Check", "Check it another way: frame 7 starts at byte 7 × 16 = 112, and byte 5 of that frame is 112 + 5 = 117. The program said 21; the memory chips see 117.", 4,
      { bits: true, split: true, look: true, pfn: true, off: true, check: true }, "frame",
      "Virtual address 21 is physical address 117.", "good")
  ];

  // ---- the scene
  var RED = "#a3262a", BLUE = "#1f4f8b", GOOD = "#2a7a6b";
  var LIGHT = "var(--md-default-fg-color--light)", CODEBG = "var(--md-code-bg-color)";
  var YEL = "rgba(232,178,58,.30)", YST = "#e8b23a";
  var CW = 28;                                   // one bit cell
  var VX = 70, VY = 26;                          // virtual bar: 6 cells, x 70..238 (VPN 70..126, offset 126..238)
  var PX = 42, PY = 292;                         // physical bar: 7 cells, x 42..238 (PFN 42..126, offset 126..238)
  var TX = 48, TW = 112, TY = 106, RH = 24;      // page table: header TY..TY+18, rows below
  var MX = 252, MW = 102, MY = 26, FH = 24;      // physical memory: 8 frames
  var TABLE = [3, 7, 5, 2];
  var FRAMES = ["reserved for OS", "unused", "page 3 of AS", "page 0 of AS", "unused", "page 2 of AS", "unused", "page 1 of AS"];

  function rowY(i) { return TY + 18 + i * RH; }
  function frameY(f) { return MY + f * FH; }

  function scene(s, H, ctx) {
    var st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    function bitCell(x, y, b, kind, changed) {
      var fill = kind === "vpn" ? "rgba(163,38,42,.10)" : kind === "off" ? "rgba(31,79,139,.12)" : CODEBG;
      out.push(H.box(x, y, CW, CW, { r: 3, fill: changed ? YEL : fill, stroke: changed ? YST : "var(--md-default-fg-color--lighter)", sw: 1.2, cls: changed ? "anim-new" : "" }));
      if (b !== null) out.push(H.text(x + CW / 2, y + 19, b, { size: 14, weight: 700, mono: true }));
    }

    // the virtual address, on top
    out.push(H.text(VX, 18, "virtual address 21", { size: 11, weight: 700, anchor: "start" }));
    var vb = "010101".split("");
    if (st.bits) vb.forEach(function (b, i) {
      var kind = st.split ? (i < 2 ? "vpn" : "off") : null;
      bitCell(VX + i * CW, VY, b, kind, !pv.bits);
    });
    else {
      out.push(H.box(VX, VY, 6 * CW, CW, { r: 3, fill: CODEBG, stroke: "var(--md-default-fg-color--lighter)", sw: 1.2 }));
      out.push(H.text(VX + 3 * CW, VY + 19, "21 (decimal)", { size: 13, weight: 700, mono: true }));
    }
    if (st.split) {
      var cls = pv.split ? "" : "anim-new";
      out.push('<rect x="' + VX + '" y="' + (VY + CW + 5) + '" width="' + (2 * CW - 2) + '" height="3" style="fill:' + RED + '" class="' + cls + '"/>');
      out.push('<rect x="' + (VX + 2 * CW) + '" y="' + (VY + CW + 5) + '" width="' + (4 * CW) + '" height="3" style="fill:' + BLUE + '" class="' + cls + '"/>');
      out.push(H.text(VX + CW, VY + CW + 22, "VPN = 01 = 1", { size: 10.5, weight: 700, color: RED, cls: cls }));
      out.push(H.text(VX + 4 * CW + 8, VY + CW + 22, "offset = 0101 = 5", { size: 10.5, weight: 700, color: BLUE, cls: cls }));
    }

    // the page table, one structure with its four rows
    out.push(H.box(TX, TY, TW, 18 + 4 * RH, { r: 4, fill: "var(--md-default-bg-color)", stroke: LIGHT, sw: 1.4 }));
    out.push(H.box(TX, TY, TW, 18, { r: 4, fill: CODEBG, stroke: "transparent" }));
    out.push(H.text(TX + 28, TY + 13, "VPN", { size: 10.5, weight: 700, color: LIGHT }));
    out.push(H.text(TX + 84, TY + 13, "PFN", { size: 10.5, weight: 700, color: LIGHT }));
    TABLE.forEach(function (f, i) {
      var y = rowY(i), hit = st.look && i === 1, ch = hit && !pv.look;
      if (hit) out.push(H.box(TX + 1, y + 1, TW - 2, RH - 2, { r: 2, fill: YEL, stroke: YST, sw: 1.2, cls: ch ? "anim-new" : "" }));
      out.push('<line x1="' + TX + '" y1="' + y + '" x2="' + (TX + TW) + '" y2="' + y + '" style="stroke:var(--md-default-fg-color--lighter);stroke-width:1"/>');
      out.push(H.text(TX + 28, y + 16, String(i), { size: 12, mono: true, weight: hit ? 700 : 400 }));
      out.push(H.text(TX + 84, y + 16, hit ? "7 = 111" : String(f), { size: 12, mono: true, weight: hit ? 700 : 400, color: hit ? RED : "var(--md-default-fg-color)" }));
    });
    out.push('<line x1="' + (TX + 56) + '" y1="' + TY + '" x2="' + (TX + 56) + '" y2="' + (TY + 18 + 4 * RH) + '" style="stroke:var(--md-default-fg-color--lighter);stroke-width:1"/>');
    out.push(H.text(TX + TW / 2, TY + 18 + 4 * RH + 16, "page table", { size: 11, weight: 700 }));

    // physical memory: eight frames
    out.push(H.text(MX + MW / 2, 18, "physical memory", { size: 11, weight: 700 }));
    FRAMES.forEach(function (lab, f) {
      var y = frameY(f), on = st.check && f === 7, ch = on && !pv.check;
      var used = lab.indexOf("page") === 0, os = f === 0;
      out.push(H.box(MX, y, MW, FH, { r: 0, fill: on ? YEL : (used ? CODEBG : "var(--md-default-bg-color)"), stroke: on ? YST : "var(--md-default-fg-color--lighter)", sw: on ? 1.6 : 1, cls: ch ? "anim-new" : "" }));
      out.push(H.text(MX + 6, y + 16, String(f), { size: 11, weight: 700, mono: true, anchor: "start", color: LIGHT }));
      out.push(H.text(MX + MW / 2 + 6, y + 16, lab, { size: 10, weight: used ? 700 : 400, italic: !used && !os, color: used ? "var(--md-default-fg-color)" : LIGHT }));
    });
    if (!st.check) out.push(H.text(MX + MW / 2, frameY(8) + 12, "frame number on the left", { size: 10, color: LIGHT }));
    else {
      // byte 5 of frame 7 (one sixteenth of the frame's width per byte), marked by a small triangle under the frame
      var bx = MX + 5.5 * MW / 16, by = frameY(8) + 1;
      out.push('<polygon points="' + bx + ',' + by + ' ' + (bx - 5) + ',' + (by + 8) + ' ' + (bx + 5) + ',' + (by + 8) + '" style="fill:' + RED + '" class="anim-pop"/>');
      out.push(H.text(bx + 9, by + 9, "byte 5", { size: 10, weight: 700, anchor: "start", color: RED, cls: "anim-new" }));
      out.push(H.lines(MX + MW / 2, frameY(8) + 26, ["frame 7 starts at", "7 × 16 = 112;", "byte 5 is 117"], { size: 10.5, weight: 700, color: GOOD, lh: 13, cls: "anim-new" }));
    }

    // the physical address, at the bottom
    var pb = "1110101".split("");
    pb.forEach(function (b, i) {
      var isP = i < 3, shown = isP ? st.pfn : st.off;
      var changed = isP ? (st.pfn && !pv.pfn) : (st.off && !pv.off);
      bitCell(PX + i * CW, PY, shown ? b : null, shown ? (isP ? "vpn" : "off") : null, changed);
    });
    out.push('<rect x="' + PX + '" y="' + (PY + CW + 5) + '" width="' + (3 * CW - 2) + '" height="3" style="fill:' + (st.pfn ? RED : "var(--md-default-fg-color--lighter)") + '"/>');
    out.push('<rect x="' + (PX + 3 * CW) + '" y="' + (PY + CW + 5) + '" width="' + (4 * CW) + '" height="3" style="fill:' + (st.off ? BLUE : "var(--md-default-fg-color--lighter)") + '"/>');
    out.push(H.text(PX + 1.5 * CW, PY + CW + 22, st.pfn ? "PFN = 111 = 7" : "PFN", { size: 10.5, weight: 700, color: st.pfn ? RED : LIGHT }));
    out.push(H.text(PX + 5 * CW, PY + CW + 22, st.off ? "offset = 0101 = 5" : "offset", { size: 10.5, weight: 700, color: st.off ? BLUE : LIGHT }));
    out.push(H.text(PX + 7 * CW + 8, PY + 6, "physical", { size: 11, weight: 700, anchor: "start" }));
    out.push(H.text(PX + 7 * CW + 8, PY + 19, "address", { size: 11, weight: 700, anchor: "start" }));
    if (st.off) out.push(H.text(PX + 7 * CW + 8, PY + 38, "= 117", { size: 15, weight: 700, anchor: "start", mono: true, color: GOOD, cls: pv.off ? "" : "anim-pop" }));

    // the one arrow of this step
    var r1 = rowY(1) + RH / 2;
    if (s.act === "look") out.push(H.arrow(VX, VY + 14, TX - 1, r1, { color: RED, bend: [-46, -14], label: "look up row 1", lpos: [96, 94], sw: 2.4 }));
    if (s.act === "pfn") out.push(H.arrow(TX + TW + 1, r1, PX + 1.5 * CW, PY - 2, { color: RED, bend: [76, 8], label: "PFN 111", mono: true, lpos: [206, 246], sw: 2.4 }));
    if (s.act === "off") out.push(H.arrow(VX + 4 * CW, VY + CW + 28, VX + 4 * CW, PY - 2, { color: BLUE, label: "copy offset", lpos: [208, 186], sw: 2.4 }));
    if (s.act === "frame") out.push(H.arrow(TX + TW + 1, r1, MX - 1, frameY(7) + FH / 2, { color: GOOD, bend: [0, 10], label: "frame 7", lpos: [206, 168], sw: 2.4 }));
    return out.join("");
  }

  window.OS_ANIMS.translate = {
    title: "Translating virtual address 21: split, look up, glue",
    interval: 4200,
    threads: ["HW"],
    colors: { HW: "#1f6f8b" },
    codeTitle: "Section 4.3's four steps (Figure 4.7), not code",
    sceneBox: "0 0 360 360",
    scene: scene,
    code: code,
    variants: [{ key: "a21", label: "Address 21", steps: steps }]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
