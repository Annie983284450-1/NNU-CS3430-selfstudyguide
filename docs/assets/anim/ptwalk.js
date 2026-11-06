// The multi-level page table walk of W05 class 1, step by step.
// Tab 1 is the 16 KB example of Sections 2.2 to 2.4 (OSTEP Figures 20.4 and 20.5): the 14-bit address 0x3F80 split
// into a 4-bit page directory index, a 4-bit page table index and a 6-bit offset (Figure 2.4); read 1 picks directory
// entry 15 (PFN 101), read 2 picks entry 14 of the page in frame 101 (PFN 55, rw-), read 3 goes to 0x0DC0 (Figures 2.8
// and 2.9). The formulas beside it are those of Figure 2.4 and Figure 2.9, numbered by the read cards 1 to 3.
// Tab 2 is xv6's walk() of Section 3.3 (kernel/vm.c lines 97 to 115, Figure 3.7) with the PX macro of Section 3.2
// (kernel/riscv.h lines 391 to 394, Figure 3.5). No concrete address: the fields are L2, L1, L0 and offset, as the page
// names the Sv39 slices (Figure 3.4).
// The picture: the virtual address as one bar of colored fields on top; the tables (pages of the tree) below it, left to
// right; at each read, one arrow from the index field to the entry it picks and one from that entry's frame number to
// the next table; the read counter at the top right; the physical address bar at the bottom (tab 1).
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  // ---- code: tab 1, the page's formulas, numbered by read (the cards of Figures 2.8 and 2.9)
  var code1 = [
    { n: 1, text: "PDEAddr = PageDirBase" },
    { n: null, text: "        + (PDIndex * sizeof(PDE))" },
    { n: 2, text: "PTEAddr = (PDE.PFN << SHIFT)" },
    { n: null, text: "        + (PTIndex * sizeof(PTE))" },
    { n: 3, text: "PhysAddr = (PFN << 6) + offset" }
  ];
  // ---- code: tab 2, PX from riscv.h (Figure 3.5) and walk() from vm.c (Figure 3.7)
  var code2 = [
    [391, "// extract the three 9-bit page table indices from a virtual address."],
    [392, "#define PXMASK          0x1FF // 9 bits"],
    [393, "#define PXSHIFT(level)  (PGSHIFT+(9*(level)))"],
    [394, "#define PX(level, va) ((((uint64) (va)) >> PXSHIFT(level)) & PXMASK)"],
    [null, ""],
    [97, "pte_t *"],
    [98, "walk(pagetable_t pagetable, uint64 va, int alloc)"],
    [99, "{"],
    [100, "  if(va >= MAXVA)"],
    [101, "    panic(\"walk\");"],
    [102, ""],
    [103, "  for(int level = 2; level > 0; level--) {"],
    [104, "    pte_t *pte = &pagetable[PX(level, va)];"],
    [105, "    if(*pte & PTE_V) {"],
    [106, "      pagetable = (pagetable_t)PTE2PA(*pte);"],
    [107, "    } else {"],
    [108, "      if(!alloc || (pagetable = (pde_t*)kalloc()) == 0)"],
    [109, "        return 0;"],
    [110, "      memset(pagetable, 0, PGSIZE);"],
    [111, "      *pte = PA2PTE(pagetable) | PTE_V;"],
    [112, "    }"],
    [113, "  }"],
    [114, "  return &pagetable[PX(0, va)];"],
    [115, "}"]
  ].map(function (x) { return { n: x[0], text: x[1] }; });

  function S(label, text, o) { o.label = label; o.text = text; return o; }

  // ---- tab 1 steps. state: split (fields shown), read (0 to 3), done
  var ex = [
    S("Start", "The address is 0x3F80, the first byte of VPN 254. In binary it is 0011 1111 1000 0000, and the address is 14 bits, so the two leading zeros drop: 11 1111 1000 0000.", {
      at: [], state: { split: false, read: 0 },
      note: ["0x3F80 = 0011 1111 1000 0000", "14 bits: 11 1111 1000 0000"] }),
    S("Split", "Cut as Figure 2.4 says: bits 13 to 10 are the page directory index, 1111 = 15; bits 9 to 6 are the page table index, 1110 = 14; bits 5 to 0 are the offset, 0. The top 8 bits, 1111 1110, are VPN 254.", {
      at: [], state: { split: true, read: 0 },
      note: ["PD index 1111 = 15, PT index 1110 = 14, offset 0", "VPN = 1111 1110 = 254"] }),
    S("Read 1", "PDEAddr = PageDirBase + 15 × 4 = PageDirBase + 60. Directory entry 15 comes back valid, with PFN 101: frame 101 holds the next table to read, not the program's data.", {
      at: [{ who: "HW", line: 1 }], state: { split: true, read: 1 },
      note: ["read 1: PDEAddr = PageDirBase + 15 × 4", "= PageDirBase + 60: valid, PFN 101"],
      event: "Frame 100 stays untouched: this translation never goes there.", eventKind: "info" }),
    S("Read 2", "PTEAddr = (101 << 6) + 14 × 4 = 6464 + 56 = 6520, which is 0x1978. The entry comes back valid, PFN 55, rw-, so VPN 254 lives in frame 55.", {
      at: [{ who: "HW", line: 2 }], state: { split: true, read: 2 },
      note: ["read 2: PTEAddr = (101 << 6) + 14 × 4", "= 6464 + 56 = 6520 = 0x1978: valid, PFN 55"],
      event: "Read 2 could not start until read 1 said frame 101.", eventKind: "warn" }),
    S("Read 3", "PhysAddr = (55 << 6) + 0 = 0x0DC0. The offset passes through untouched, and read 3 goes to 0x0DC0 and brings back the program's data.", {
      at: [{ who: "HW", line: 3 }], state: { split: true, read: 3 },
      note: ["read 3: PhysAddr = (55 << 6) + 0", "= 00 1101 1100 0000 = 0x0DC0"] }),
    S("Done", "One load cost three memory reads on a TLB miss: two to find the translation, one for the data. On a TLB hit, the first two disappear.", {
      at: [], state: { split: true, read: 3, done: true },
      note: ["three memory reads on a TLB miss", "on a TLB hit, the first two disappear"],
      event: "Two reads to find the translation, one for the data.", eventKind: "good" })
  ];

  // ---- tab 2 steps. state: cur (the page pagetable points at: 0 root, 1 middle, 2 leaf), level, done (levels read),
  // ret (line 114 reached), caller
  var wk = [
    S("Start", "walk() takes the root of a tree, a virtual address va, and the flag alloc. pagetable starts as the root page, the page that satp points at.", {
      at: [{ who: "walk", line: 98 }], state: { cur: 0, level: null, done: 0 },
      note: ["walk(pagetable, va, alloc)", "pagetable = the root page (satp)"] }),
    S("Line 100", "Line 100 tests va against MAXVA, one beyond the highest address xv6 allows. An address at or above it would stop the kernel with panic(\"walk\") on line 101.", {
      at: [{ who: "walk", line: 100 }], state: { cur: 0, level: null, done: 0 },
      note: ["if(va >= MAXVA) panic(\"walk\")", "MAXVA = 1L << 38"] }),
    S("Line 103", "The loop starts with level = 2. It makes two trips, level 2 then level 1: the root page first, then the middle page.", {
      at: [{ who: "walk", line: 103 }], state: { cur: 0, level: 2, done: 0 },
      note: ["for(int level = 2; level > 0; level--)", "two trips: level 2, then level 1"] }),
    S("Level 2", "PX(2, va) is bits 38 to 30 of va, and it picks one of the root page's 512 entries: memory read 1. The entry is valid, so PTE2PA(*pte) gives the middle page, and pagetable points there.", {
      at: [{ who: "walk", line: 104 }, { who: "walk", line: 106 }], state: { cur: 1, level: 2, done: 1 },
      note: ["PX(2, va) = (va >> 30) & 0x1FF", "line 106: pagetable = PTE2PA(*pte), the middle page"] }),
    S("Level 1", "level-- makes level 1. PX(1, va) is bits 29 to 21 and picks one entry of the middle page: memory read 2. Valid again, so pagetable moves to the leaf page.", {
      at: [{ who: "walk", line: 104 }, { who: "walk", line: 106 }], state: { cur: 2, level: 1, done: 2 },
      note: ["PX(1, va) = (va >> 21) & 0x1FF", "line 106: pagetable = PTE2PA(*pte), the leaf page"] }),
    S("Loop ends", "level-- makes level 0, and 0 > 0 is false, so the loop ends. Level 0 is handled after the loop, because its entry is the answer, not another table.", {
      at: [{ who: "walk", line: 103 }], state: { cur: 2, level: 0, done: 2 },
      note: ["level = 0: the test level > 0 fails", "level 0's entry is the answer"] }),
    S("Line 114", "PX(0, va) is bits 20 to 12 and picks the leaf entry. walk() returns &pagetable[PX(0, va)]: not the frame, but the address of the level-0 entry.", {
      at: [{ who: "walk", line: 114 }], state: { cur: 2, level: 0, done: 2, ret: true },
      note: ["PX(0, va) = (va >> 12) & 0x1FF", "return &pagetable[PX(0, va)]"],
      event: "walk() returns a pointer to the leaf entry, not the frame.", eventKind: "good" }),
    S("The caller", "With that pointer the caller can read the leaf entry, as walkaddr does, or write it, as mappages does. One loop did it, because every level has the same shape.", {
      at: [{ who: "walk", line: 114 }], state: { cur: 2, level: 0, done: 2, ret: true, caller: true },
      note: ["walkaddr reads the leaf entry", "mappages writes it"],
      event: "Every level: 512 entries, 9 bits of index, a valid bit and a frame number.", eventKind: "info" })
  ];

  // ---- drawing helpers
  var MUTED = "var(--md-default-fg-color--light)", CODEBG = "var(--md-code-bg-color)", FG = "var(--md-default-fg-color)";
  var BLUE = "#1f6f8b", ORANGE = "#b5651d", PURPLE = "#6b4fa0", GRAY = "#6b6b6b", YEL = "#e8b23a";
  function tint(hex, a) { var n = parseInt(hex.slice(1), 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }
  // an arrow along a polyline (orthogonal routing keeps it in the gutters between tables)
  function parrow(pts, c, sw) {
    sw = sw || 2.2;
    var d = "M" + pts.map(function (p) { return p[0] + "," + p[1]; }).join(" L");
    var a = pts[pts.length - 2], b = pts[pts.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), h = 8;
    var head = (b[0] + h * Math.cos(ang + 2.6)) + "," + (b[1] + h * Math.sin(ang + 2.6)) + " " + b[0] + "," + b[1] + " " + (b[0] + h * Math.cos(ang - 2.6)) + "," + (b[1] + h * Math.sin(ang - 2.6));
    return '<g class="anim-arrow"><path d="' + d + '" pathLength="100" class="anim-drawn" style="fill:none;stroke:' + c + ';stroke-width:' + sw + ';stroke-linejoin:round"/>' +
      '<polyline points="' + head + '" class="anim-head" style="fill:none;stroke:' + c + ';stroke-width:' + sw + ';stroke-linejoin:round"/></g>';
  }
  function pills(H, out, names, cols, lit, newest) {
    names.forEach(function (nm, i) {
      var x = 214 + i * 48, on = i < lit;
      out.push(H.box(x, 4, 44, 18, { r: 9, fill: on ? cols[i] : "var(--md-default-bg-color)", stroke: on ? cols[i] : "var(--md-default-fg-color--lighter)", sw: 1.2, cls: on && i === newest ? "anim-pop" : "" }));
      out.push(H.text(x + 22, 17, nm, { size: 10.5, weight: 700, color: on ? "#fff" : MUTED, cls: on && i === newest ? "anim-pop" : "" }));
    });
  }
  function noteLines(H, out, s, y) {
    (s.note || []).forEach(function (t, i) { out.push(H.text(180, y + i * 14, t, { size: 10.5, weight: i === 0 ? 700 : 400, color: FG })); });
  }

  // ---- tab 1 scene
  var BITS = "11111110000000";
  var BX = 26, BW = 22, BY = 26, BH = 20;                // the address bar
  var RT = 122, RH = 20;                                // first row top, row height
  function rowY(i) { return RT + i * RH; }
  var PD = { x: 14, cols: [32, 28, 26] };               // page directory: idx, PFN, valid
  var P101 = { x: 114, cols: [32, 22, 26, 28] };        // idx, PFN, valid, prot
  var P100 = { x: 236, cols: [32, 22, 26, 28] };
  // Figure 2.6, with each run of invalid rows collapsed into one row (k: the row a read picks)
  var PDROWS = [["0", "100", "1"], ["1-14", "-", "0"], ["15", "101", "1", 15]];
  var R101 = [["0-13", "-", "0", "-"], ["14", "55", "1", "rw-", 14], ["15", "45", "1", "rw-"]];
  var R100 = [["0", "10", "1", "r-x"], ["1", "23", "1", "r-x"], ["2-3", "-", "0", "-"], ["4", "80", "1", "rw-"], ["5", "59", "1", "rw-"], ["6-15", "-", "0", "-"]];
  function rowOf(rows, k) { for (var i = 0; i < rows.length; i++) if (rows[i][rows[i].length - 1] === k) return i; return -1; }

  function table(H, out, T, title, titleCol, heads, rows, sel, selCol, dim) {
    var w = T.cols.reduce(function (a, b) { return a + b; }, 0), x0 = T.x, nc = T.cols.length;
    var g = [];
    g.push(H.text(x0, 100, title, { size: 10.5, weight: 700, anchor: "start", color: titleCol }));
    g.push(H.box(x0, 106, w, 16, { r: 0, fill: CODEBG, stroke: "var(--md-default-fg-color--lighter)", sw: 0.8 }));
    var cx = x0;
    T.cols.forEach(function (cw, j) { g.push(H.text(cx + cw / 2, 118, heads[j], { size: 10, color: MUTED })); cx += cw; });
    rows.forEach(function (r, i) {
      var y = rowY(i), isSel = sel !== null && r[nc] === sel, valid = r[2] === "1";
      g.push(H.box(x0, y, w, RH, { r: 0, fill: isSel ? "rgba(232,178,58,.32)" : (valid ? "var(--md-default-bg-color)" : CODEBG), stroke: isSel ? YEL : "var(--md-default-fg-color--lighter)", sw: isSel ? 1.4 : 0.6, cls: isSel ? "anim-new" : "" }));
      cx = x0;
      T.cols.forEach(function (cw, j) {
        g.push(H.text(cx + cw / 2, y + 14, r[j], { size: 11, mono: true, weight: isSel ? 700 : 400, color: isSel && j === 1 ? selCol : (valid ? FG : MUTED) }));
        cx += cw;
      });
    });
    out.push('<g style="opacity:' + (dim ? 0.42 : 1) + '">' + g.join("") + '</g>');
  }

  function sceneEx(s, H, ctx) {
    var st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [], rd = st.read;
    // header and the read counter
    out.push(H.text(16, 17, st.split ? "va = 0x3F80, VPN 254" : "va = 0x3F80", { size: 12, weight: 700, anchor: "start" }));
    pills(H, out, ["read 1", "read 2", "read 3"], [BLUE, ORANGE, PURPLE], rd, pv.read !== rd ? rd - 1 : -1);
    // the address bar: 14 bits, colored by field once it is split
    var FCOL = function (i) { return i < 4 ? BLUE : i < 8 ? ORANGE : PURPLE; };
    out.push(H.box(BX - 2, BY - 2, 14 * BW + 4, BH + 4, { r: 4, stroke: "var(--md-default-fg-color--light)", sw: 1.2 }));
    for (var i = 0; i < 14; i++) {
      var x = BX + i * BW, c = FCOL(i);
      var active = (rd === 1 && i < 4) || (rd === 2 && i >= 4 && i < 8) || (rd === 3 && i >= 8);
      out.push(H.box(x, BY, BW, BH, { r: 0, fill: st.split ? tint(c, active ? 0.34 : 0.14) : CODEBG, stroke: st.split ? c : "var(--md-default-fg-color--lighter)", sw: active ? 1.6 : 0.8, cls: st.split && !pv.split ? "anim-new" : "" }));
      out.push(H.text(x + BW / 2, BY + 14.5, BITS[i], { size: 12, weight: 700, mono: true }));
      if (!st.split) out.push(H.text(x + BW / 2, 59, String(13 - i), { size: 10, color: MUTED }));
    }
    if (!st.split) out.push(H.text(BX + 7 * BW, 73, "bit numbers 13 down to 0", { size: 10, color: MUTED, italic: true }));
    else {
      [["PD index", "1111 = 15", 0, 4, BLUE], ["PT index", "1110 = 14", 4, 8, ORANGE], ["offset", "000000 = 0", 8, 14, PURPLE]].forEach(function (f) {
        var cx = BX + (f[2] + f[3]) / 2 * BW, cls = !pv.split ? "anim-pop" : "";
        out.push(H.text(cx, 60, f[0], { size: 10.5, weight: 700, color: f[4], cls: cls }));
        out.push(H.text(cx, 73, f[1], { size: 10.5, mono: true, color: f[4], cls: cls }));
      });
    }
    // the three tables: the page directory, the page in frame 101, the page in frame 100
    table(H, out, PD, "page directory", BLUE, ["idx", "PFN", "valid"], PDROWS, rd >= 1 ? 15 : null, BLUE, false);
    table(H, out, P101, "PT page @PFN 101", ORANGE, ["idx", "PFN", "valid", "prot"], R101, rd >= 2 ? 14 : null, ORANGE, false);
    table(H, out, P100, rd >= 1 ? "@PFN 100: not read" : "PT page @PFN 100", rd >= 1 ? MUTED : FG, ["idx", "PFN", "valid", "prot"], R100, null, FG, rd >= 1);
    // the physical address bar
    var PX0 = 150, PW = 16, PY = 266;
    var pfnBits = "110111", offBits = "000000";
    for (var k = 0; k < 12; k++) {
      var isPfn = k < 6, filled = isPfn ? rd >= 2 : rd >= 3, col = isPfn ? ORANGE : PURPLE;
      var fresh = filled && (isPfn ? pv.read < 2 : pv.read < 3);
      out.push(H.box(PX0 + k * PW, PY, PW, 18, { r: 0, fill: filled ? tint(col, 0.22) : CODEBG, stroke: filled ? col : "var(--md-default-fg-color--lighter)", sw: 0.9, dash: !filled, cls: fresh ? "anim-new" : "" }));
      if (filled) out.push(H.text(PX0 + k * PW + PW / 2, PY + 13, (isPfn ? pfnBits : offBits)[k % 6], { size: 11, weight: 700, mono: true, cls: fresh ? "anim-pop" : "" }));
    }
    out.push(H.text(PX0 + 3 * PW, PY + 30, rd >= 2 ? "PFN 55" : "PFN", { size: 10.5, weight: rd >= 2 ? 700 : 400, color: rd >= 2 ? ORANGE : MUTED }));
    out.push(H.text(PX0 + 9 * PW, PY + 30, rd >= 3 ? "offset 0" : "offset", { size: 10.5, weight: rd >= 3 ? 700 : 400, color: rd >= 3 ? PURPLE : MUTED }));
    if (rd >= 3) {
      out.push(H.box(16, PY - 2, 100, 22, { r: 6, fill: tint(PURPLE, 0.14), stroke: PURPLE, sw: 1.4, cls: pv.read < 3 ? "anim-pop" : "" }));
      out.push(H.text(66, PY + 13, "data @ 0x0DC0", { size: 10.5, weight: 700, mono: true, color: PURPLE, cls: pv.read < 3 ? "anim-pop" : "" }));
    } else {
      out.push(H.text(140, PY + 13, "physical address", { size: 10.5, anchor: "end", color: MUTED }));
    }
    noteLines(H, out, s, 330);
    // this step's arrows: index field to the entry it picks, and the entry's frame number to the next table
    var y15 = rowY(rowOf(PDROWS, 15)) + RH / 2, y14 = rowY(rowOf(R101, 14)) + RH / 2, RY = PY - 12;
    if (rd === 1 && pv.read !== 1) {
      out.push(parrow([[BX + 4, BY + BH + 2], [7, 62], [7, y15], [PD.x - 1, y15]], BLUE));
      out.push(parrow([[PD.x + 86, y15], [107, y15], [107, 96], [P101.x, 96]], BLUE));
    }
    if (rd === 2 && pv.read !== 2) {
      out.push(parrow([[BX + 4 * BW + 6, BY + BH + 2], [107, 62], [107, y14], [P101.x - 1, y14]], ORANGE));
      out.push(parrow([[P101.x + 108, y14], [229, y14], [229, RY], [PX0 + 3 * PW, RY], [PX0 + 3 * PW, PY - 1]], ORANGE));
    }
    if (rd === 3 && pv.read !== 3) {
      out.push(parrow([[BX + 14 * BW + 2, BY + BH / 2], [353, BY + BH / 2], [353, RY], [PX0 + 9 * PW, RY], [PX0 + 9 * PW, PY - 1]], PURPLE));
      out.push(parrow([[PX0 - 2, PY + 9], [118, PY + 9]], PURPLE, 2.6));
    }
    return out.join("");
  }

  // ---- tab 2 scene
  var F2 = [["L2", "38..30", 8, 92, BLUE], ["L1", "29..21", 92, 176, ORANGE], ["L0", "20..12", 176, 260, PURPLE], ["offset", "11..0", 260, 352, GRAY]];
  var PG = [{ x: 24, t: "root page", c: BLUE, g: 12 }, { x: 136, t: "middle page", c: ORANGE, g: 122 }, { x: 248, t: "leaf page", c: PURPLE, g: 234 }];
  var PGW = 84, TCOLS = [26, 38, 20], TR = 124, TRH = 20;
  function sceneWalk(s, H, ctx) {
    var st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    var lit = st.done + (st.ret ? 1 : 0), was = pv.done + (pv.ret ? 1 : 0);
    out.push(H.text(16, 17, "va: 39 bits (Sv39)", { size: 12, weight: 700, anchor: "start" }));
    pills(H, out, ["read 1", "read 2", "leaf"], [BLUE, ORANGE, PURPLE], lit, lit !== was ? lit - 1 : -1);
    // which slice is in use at this step
    var act = s.label === "Level 2" ? 0 : s.label === "Level 1" ? 1 : s.label === "Line 114" ? 2 : -1;
    out.push(H.box(6, 22, 348, 34, { r: 4, stroke: "var(--md-default-fg-color--light)", sw: 1.2 }));
    F2.forEach(function (f, i) {
      var used = i < st.done || (i === 2 && st.ret);
      out.push(H.box(f[2], 24, f[3] - f[2], 30, { r: 0, fill: tint(f[4], i === act ? 0.34 : used ? 0.2 : 0.1), stroke: f[4], sw: i === act ? 1.8 : 0.9, cls: i === act ? "anim-new" : "" }));
      out.push(H.text((f[2] + f[3]) / 2, 37, f[0], { size: 12, weight: 700, color: f[4] }));
      out.push(H.text((f[2] + f[3]) / 2, 50, "bits " + f[1], { size: 10, color: FG }));
    });
    if (act >= 0) out.push(H.text(PG[act].g + 6, 70, "PX(" + (2 - act) + ", va)", { size: 10.5, weight: 700, mono: true, anchor: "start", color: F2[act][4], cls: "anim-pop" }));
    // the three pages of the tree
    PG.forEach(function (p, i) {
      var reached = i <= st.cur, sel = i < st.done || (i === 2 && st.ret), fresh = sel && !(i < pv.done || (i === 2 && pv.ret));
      var g = [];
      g.push(H.text(p.x, 92, p.t, { size: 10.5, weight: 700, anchor: "start", color: p.c }));
      g.push(H.text(p.x, 104, i === 0 ? "satp points here" : "512 entries", { size: 10, anchor: "start", color: MUTED }));
      g.push(H.box(p.x, 110, PGW, 14, { r: 0, fill: CODEBG, stroke: "var(--md-default-fg-color--lighter)", sw: 0.8 }));
      var cx = p.x;
      ["idx", "PPN", "V"].forEach(function (h, j) { g.push(H.text(cx + TCOLS[j] / 2, 120.5, h, { size: 10, color: MUTED })); cx += TCOLS[j]; });
      ["0", "…", F2[i][0], "…", "511"].forEach(function (idx, r) {
        var y = TR + r * TRH, isSel = r === 2 && sel;
        g.push(H.box(p.x, y, PGW, TRH, { r: 0, fill: isSel ? "rgba(232,178,58,.32)" : "var(--md-default-bg-color)", stroke: isSel ? YEL : "var(--md-default-fg-color--lightest)", sw: isSel ? 1.4 : 0.6, cls: fresh && isSel ? "anim-new" : "" }));
        var vals = r === 2 ? (sel ? [idx, "PPN", i === 2 ? "V" : "1"] : [idx, "…", "…"]) :[idx, r === 1 || r === 3 ? "" : "…", r === 1 || r === 3 ? "" : "…"];
        cx = p.x;
        vals.forEach(function (v, j) {
          g.push(H.text(cx + TCOLS[j] / 2, y + 14, v, { size: 10.5, mono: true, weight: isSel ? 700 : 400, color: r === 2 && j === 0 ? p.c : (isSel ? FG : MUTED) }));
          cx += TCOLS[j];
        });
      });
      out.push('<g style="opacity:' + (reached ? 1 : 0.45) + '">' + g.join("") + '</g>');
    });
    // pagetable, the variable: under the page it points at
    var cp = PG[st.cur];
    out.push(H.chip(cp.x + PGW / 2, 236, "pagetable", cp.c, { cls: pv.cur !== st.cur ? "anim-pop" : "" }));
    if (st.ret) out.push(H.text(PG[2].x + PGW / 2, 258, st.caller ? "the caller uses it" : "returned: &entry", { size: 10.5, weight: 700, color: PURPLE, cls: "anim-pop" }));
    // one 64-bit PTE, as the macros read it (Figure 3.6)
    var desc = s.label === "Level 2" || s.label === "Level 1";
    out.push(H.text(16, 274, "one 64-bit PTE", { size: 10.5, weight: 700, anchor: "start" }));
    [[16, 72, "63..54", null], [72, 264, "PPN, bits 53..10", desc ? "#2a7a6b" : null], [264, 344, "flags 9..0", desc ? "#2a7a6b" : null]].forEach(function (f) {
      out.push(H.box(f[0], 280, f[1] - f[0], 20, { r: 0, fill: f[3] ? "rgba(42,122,107,.16)" : CODEBG, stroke: f[3] || "var(--md-default-fg-color--lighter)", sw: f[3] ? 1.4 : 0.8, cls: f[3] ? "anim-new" : "" }));
      out.push(H.text((f[0] + f[1]) / 2, 294, f[2], { size: 10, mono: true, color: f[3] ? f[3] : MUTED, weight: f[3] ? 700 : 400 }));
    });
    out.push(H.text(180, 316, desc ? "V = 1, so PTE2PA(pte) = ((pte) >> 10) << 12" : "bit 0 of the flags is V, the valid bit", { size: 10.5, color: desc ? "#2a7a6b" : MUTED, weight: desc ? 700 : 400 }));
    // level, the loop variable
    out.push(H.box(16, 326, 70, 20, { r: 5, fill: CODEBG, stroke: "transparent" }));
    out.push(H.text(24, 340, "level", { size: 10.5, anchor: "start", color: MUTED, mono: true }));
    out.push(H.text(78, 340, st.level === null ? "-" : String(st.level), { size: 12, weight: 700, anchor: "end", mono: true, cls: pv.level !== st.level ? "anim-pop" : "" }));
    noteLines(H, out, s, 368);
    // this step's arrows: the slice to the entry it picks, and the entry's frame number to the next page
    function sliceArrow(i) {
      var p = PG[i], y = TR + 2 * TRH + TRH / 2, sx = i === 0 ? 14 : p.g;
      out.push(parrow([[sx, 56], [p.g, 62], [p.g, y], [p.x - 1, y]], p.c));
    }
    function downArrow(i) {
      var p = PG[i], n = PG[i + 1], y = TR + 2 * TRH + TRH / 2;
      out.push(parrow([[p.x + PGW, y], [n.g, y], [n.g, 88], [n.x - 2, 88]], p.c));
    }
    if (s.label === "Level 2") { sliceArrow(0); downArrow(0); }
    if (s.label === "Level 1") { sliceArrow(1); downArrow(1); }
    if (s.label === "Line 114") sliceArrow(2);
    return out.join("");
  }

  function scene(s, H, ctx) { return ctx.variant === "walk" ? sceneWalk(s, H, ctx) : sceneEx(s, H, ctx); }

  window.OS_ANIMS.ptwalk = {
    title: "A multi-level page table walk, read by read",
    interval: 4800,
    threads: ["HW", "walk"],
    colors: { HW: "#1f6f8b", walk: "#1f6f8b" },
    sceneBox: "0 0 360 396",
    scene: scene,
    code: code1,
    codeTitle: "The formulas of Figure 2.4 and Figure 2.9, numbered by read (cards 1 to 3 of Figures 2.8 and 2.9)",
    variants: [
      { key: "ex", label: "The 16 KB example (two levels)", steps: ex },
      { key: "walk", label: "xv6's walk() (three levels)", steps: wk, code: code2,
        codeTitle: "kernel/riscv.h lines 391 to 394 (Figure 3.5), then kernel/vm.c lines 97 to 115 (Figure 3.7)" }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
