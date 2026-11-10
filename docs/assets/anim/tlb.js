// The TLB algorithm (W04 class 2, Sections 6.2 to 6.4): OSTEP Figure 19.1 with its line numbers 1 to 19, as the page
// prints it (Figure 6.6). Tab "Hit" follows the hit path of Section 6.3 (lines 1 to 7), tab "Miss" the miss path
// (lines 10 to 19) and the retry. The page gives no numbers for these two, so the address, the VPN and the PFN are
// symbolic. Tab "Ten array elements" is Exercise 10 of Section 6.4 (OSTEP Figure 19.2), with the answer the page states
// in review.md, Answer 10 (Figure R.3): miss, hit, hit, miss, hit, hit, hit, miss, hit, hit.
// The picture is one scene: the virtual address on top; the MMU inside the CPU, with the TLB (VPN, PFN, protection bits),
// the PTE it reads on a miss, the PTBR and the physical address it builds; memory below, with the page table and the
// program's data. Each step is one arrow from the part that acts to the field it touches; a new value turns yellow.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  var L = [
    [1, "VPN = (VirtualAddress & VPN_MASK) >> SHIFT"],
    [2, "(Success, TlbEntry) = TLB_Lookup(VPN)"],
    [3, "if (Success == True)   // TLB Hit"],
    [4, "    if (CanAccess(TlbEntry.ProtectBits) == True)"],
    [5, "        Offset   = VirtualAddress & OFFSET_MASK"],
    [6, "        PhysAddr = (TlbEntry.PFN << SHIFT) | Offset"],
    [7, "        Register = AccessMemory(PhysAddr)"],
    [8, "    else"],
    [9, "        RaiseException(PROTECTION_FAULT)"],
    [10, "else                  // TLB Miss"],
    [11, "    PTEAddr = PTBR + (VPN * sizeof(PTE))"],
    [12, "    PTE = AccessMemory(PTEAddr)"],
    [13, "    if (PTE.Valid == False)"],
    [14, "        RaiseException(SEGMENTATION_FAULT)"],
    [15, "    else if (CanAccess(PTE.ProtectBits) == False)"],
    [16, "        RaiseException(PROTECTION_FAULT)"],
    [17, "    else"],
    [18, "        TLB_Insert(VPN, PTE.PFN, PTE.ProtectBits)"],
    [19, "        RetryInstruction()"]
  ];
  var code = L.map(function (x) { return { n: x[0], text: x[1] }; });

  var OTHER = { vpn: "…", pfn: "…", prot: "…", other: true };
  var OURS = { vpn: "VPN", pfn: "PFN", prot: "prot" };
  var PT_SYM = [{ vpn: "…", pfn: "…", valid: "…", prot: "…", other: true }, { vpn: "VPN", pfn: "PFN", valid: "1", prot: "prot" },
                { vpn: "…", pfn: "…", valid: "…", prot: "…", other: true }];

  function base(o) {
    var st = { va: { vpn: "VPN", off: "offset", name: "VirtualAddress" }, split: false, tlb: [OTHER, OTHER, null, null],
               hl: -1, hlKind: null, pt: PT_SYM, ptHl: -1, pte: false, ptOk: false, phys: false, refs: 0, strip: null };
    for (var k in o) st[k] = o[k];
    return st;
  }
  function S(label, text, line, st, acts, ev, evk) {
    return { label: label, text: text, at: line ? [{ who: "MMU", line: line }] : [], state: st, acts: acts || [],
             event: ev || null, eventKind: evk || "info" };
  }

  // ---- tab 1: a hit (Section 6.3, circles 1 and 2)
  var hitTLB = [OTHER, OTHER, OURS, null];
  var hit = [
    S("Start", "The CPU core issues a virtual address. The translation of its page is already in the TLB.", null,
      base({ tlb: hitTLB })),
    S("Line 1", "Split the virtual address and take the VPN, as always.", 1,
      base({ tlb: hitTLB, split: true })),
    S("Line 2", "Ask the TLB. It searches all its entries at once, in hardware, in a few clock ticks, and no memory is touched. The VPN is there, so Success is true.", 2,
      base({ tlb: hitTLB, split: true, hl: 2, hlKind: "hit" }), [{ k: "lookup", ok: true, row: 2 }], "TLB hit", "good"),
    S("Lines 3 and 4", "The hit path. Line 4 checks the protection bits, which are stored in the TLB entry too, so the check needs no table.", 4,
      base({ tlb: hitTLB, split: true, hl: 2, hlKind: "hit" }), [{ k: "prot", row: 2 }]),
    S("Lines 5 and 6", "Take the PFN from the entry, shift it up past the offset, and glue in the offset.", 6,
      base({ tlb: hitTLB, split: true, hl: 2, hlKind: "hit", phys: true }), [{ k: "pfn", row: 2 }]),
    S("Line 7", "Access memory at the physical address: one memory reference, the one the program asked for. This is the common case, and it makes paging affordable.", 7,
      base({ tlb: hitTLB, split: true, hl: 2, hlKind: "hit", phys: true, refs: 1 }), [{ k: "mem" }],
      "A hit: one memory reference, and the page table is never read.", "good")
  ];

  // ---- tab 2: a miss (Section 6.3, circles 3, 4 and 5)
  var missTLB = [OTHER, OTHER, null, null];
  var afterTLB = [OTHER, OTHER, OURS, null];
  var miss = [
    S("Start", "The CPU core issues a virtual address. This time the translation of its page is not in the TLB.", null,
      base({ tlb: missTLB })),
    S("Line 1", "Split the virtual address and take the VPN.", 1,
      base({ tlb: missTLB, split: true })),
    S("Line 2", "Ask the TLB. None of its entries holds this VPN, so Success is false.", 2,
      base({ tlb: missTLB, split: true }), [{ k: "lookup", ok: false }], "TLB miss", "warn"),
    S("Lines 10 and 11", "The miss path. Line 11 computes the address of the page-table entry from the PTBR: PTBR + VPN × sizeof(PTE).", 11,
      base({ tlb: missTLB, split: true, ptHl: 1 }), [{ k: "ptbr", row: 1 }]),
    S("Line 12", "Read the entry from memory. This is the expensive line: one extra memory reference.", 12,
      base({ tlb: missTLB, split: true, ptHl: 1, pte: true, refs: 1 }), [{ k: "read", row: 1 }]),
    S("Lines 13 and 15", "Check the entry: line 13 checks the valid bit, and line 15 the protection bits. In this run both checks pass, so the code goes on to line 17.", 13,
      base({ tlb: missTLB, split: true, ptHl: 1, pte: true, ptOk: true, refs: 1 }), [{ k: "check" }]),
    S("Line 18", "TLB_Insert puts the translation into the TLB: the VPN, the PFN and the protection bits.", 18,
      base({ tlb: afterTLB, split: true, ptHl: 1, pte: true, ptOk: true, refs: 1, ins: 2 }), [{ k: "insert", row: 2 }]),
    S("Line 19", "RetryInstruction runs the same instruction again from the start: line 1, then line 2.", 19,
      base({ tlb: afterTLB, split: true, pte: true, ptOk: true, refs: 1 }), [{ k: "retry" }]),
    S("Retry, line 2", "This time line 2 hits: the translation is the one line 18 just put in.", 2,
      base({ tlb: afterTLB, split: true, hl: 2, hlKind: "hit", pte: true, ptOk: true, refs: 1 }), [{ k: "lookup", ok: true, row: 2 }], "TLB hit on the retry", "good"),
    S("Retry, line 7", "The access goes through the fast path, lines 3 to 7. The miss cost one extra memory reference (line 12), and the next access to this page will hit.", 7,
      base({ tlb: afterTLB, split: true, hl: 2, hlKind: "hit", pte: true, ptOk: true, phys: true, refs: 2 }), [{ k: "mem" }],
      "A miss: two memory references, the table read and the program's own.", "warn")
  ];

  // ---- tab 3: Exercise 10 (Section 6.4), answered in review.md (Answer 10, Figure R.3)
  var EL = [   // [VPN, offset] of a[0] .. a[9], from the grid of Figure 6.8 (OSTEP Figure 19.2)
    ["06", "04"], ["06", "08"], ["06", "12"], ["07", "00"], ["07", "04"],
    ["07", "08"], ["07", "12"], ["08", "00"], ["08", "04"], ["08", "08"]
  ];
  var TEXT10 = [
    "a[0] is on page 6, which is not in the TLB: miss, and page 6's translation goes in.",
    "a[1] is also on page 6, at offset 8: hit.",
    "a[2] is on page 6 too, at offset 12: hit.",
    "a[3] is on page 7: miss. The first access to page 7 loads its translation into the TLB.",
    "a[4] is on page 7: hit.",
    "a[5] is on page 7: hit.",
    "a[6] is on page 7: hit.",
    "a[7] is on page 8: miss, and page 8's translation goes in.",
    "a[8] is on page 8: hit.",
    "a[9] is on page 8: hit."
  ];
  var PT10 = [{ vpn: "06", pfn: "PFN", valid: "1", prot: "prot" }, { vpn: "07", pfn: "PFN", valid: "1", prot: "prot" },
              { vpn: "08", pfn: "PFN", valid: "1", prot: "prot" }];
  var ten = [S("Start", "The loop reads a[0] to a[9]. a[0] is at address 100 = VPN 6, offset 4, each integer is 4 bytes, and the TLB starts empty.", null,
    base({ va: { vpn: "VPN 06", off: "offset 04", name: "a[0] at 100" }, split: true, tlb: [null, null, null, null], pt: PT10, strip: [] }))];
  var tlb10 = [null, null, null, null], strip = [], seen = {};
  EL.forEach(function (e, i) {
    var page = e[0], isMiss = !(page in seen), slot;
    if (isMiss) {
      slot = tlb10.indexOf(null);
      tlb10 = tlb10.slice();
      tlb10[slot] = { vpn: page, pfn: "PFN", prot: "prot" };
      seen[page] = slot;
    } else slot = seen[page];
    strip = strip.concat([isMiss ? "M" : "H"]);
    var ptRow = ["06", "07", "08"].indexOf(page);
    ten.push(S("a[" + i + "]", TEXT10[i], isMiss ? 18 : 3,
      base({ va: { vpn: "VPN " + page, off: "offset " + e[1], name: "a[" + i + "]" }, split: true, tlb: tlb10, pt: PT10,
             hl: isMiss ? -1 : slot, hlKind: "hit", ins: isMiss ? slot : -1, ptHl: isMiss ? ptRow : -1, strip: strip }),
      isMiss ? [{ k: "insert10", row: slot, pt: ptRow }] : [{ k: "lookup", ok: true, row: slot }],
      isMiss ? "miss" : "hit", isMiss ? "warn" : "good"));
  });
  ten.push(S("Hit rate", "Three misses, seven hits: a hit rate of 70%. On a second run, pages 6, 7 and 8 are all still in the TLB, so all ten accesses hit.", null,
    base({ va: { vpn: "VPN 08", off: "offset 08", name: "a[9]" }, split: true, tlb: tlb10, pt: PT10, strip: strip, done: true }), [],
    "7 hits out of 10: spatial locality at work.", "good"));

  // ---- the scene
  var GOOD = "#2a7a6b", BAD = "#b23a48", BLUE = "#1f6f8b", WARN = "#a0632a";
  var LIGHT = "var(--md-default-fg-color--light)", LIGHTER = "var(--md-default-fg-color--lighter)", CODEBG = "var(--md-code-bg-color)";
  var YEL = "rgba(232,178,58,.30)", YST = "#e8b23a", GREEN = "rgba(42,122,107,.16)";
  var VA = { x: 34, y: 18, w: 162, h: 26 };                  // the virtual address bar (VPN half, offset half)
  var MMU = { x: 6, y: 56, w: 348, h: 172 };
  var TL = { x: 34, y: 96, cols: [34, 84, 134, 186], rh: 20 };   // TLB: header y 96..112, rows from 112
  var PTE = { x: 216, y: 92, w: 58, h: 100 }, PTBR = { x: 284, y: 92, w: 62, h: 46 };
  var PA = { x: 34, y: 198, w: 162, h: 22 };                 // the physical address bar
  var MEM = { x: 6, y: 238, w: 348, h: 106 };
  var PT = { x: 190, y: 262, cols: [190, 226, 266, 306, 346], rh: 20 };   // page table: header 262..278, rows from 278
  var DATA = { x: 16, y: 262, w: 160, h: 74 };

  function tRow(i) { return TL.y + 16 + i * TL.rh; }
  function pRow(i) { return PT.y + 16 + i * PT.rh; }

  function scene(s, H, ctx) {
    var st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    var ten = ctx.variant === "ten";
    var failed = (s.acts || []).some(function (a) { return a.k === "lookup" && !a.ok; });
    function cellText(x, y, str, o) { out.push(H.text(x, y, str, o)); }

    // the virtual address, on top
    out.push(H.text(VA.x, 12, ten ? "the address of the element read" : "virtual address, from the CPU core", { size: 10.5, color: LIGHT, anchor: "start" }));
    var vch = ten && pv.va && pv.va.name !== st.va.name;
    if (st.split) {
      out.push(H.box(VA.x, VA.y, VA.w / 2, VA.h, { r: 3, fill: vch || !pv.split ? YEL : "rgba(31,111,139,.12)", stroke: vch || !pv.split ? YST : LIGHTER, cls: vch ? "anim-new" : "" }));
      out.push(H.box(VA.x + VA.w / 2, VA.y, VA.w / 2, VA.h, { r: 3, fill: CODEBG, stroke: LIGHTER, cls: vch ? "anim-new" : "" }));
      cellText(VA.x + VA.w / 4, VA.y + 17, st.va.vpn, { size: 12, weight: 700, mono: true });
      cellText(VA.x + 3 * VA.w / 4, VA.y + 17, st.va.off, { size: 12, mono: true });
    } else {
      out.push(H.box(VA.x, VA.y, VA.w, VA.h, { r: 3, fill: CODEBG, stroke: LIGHTER }));
      cellText(VA.x + VA.w / 2, VA.y + 17, st.va.name, { size: 12, weight: 700, mono: true });
    }
    if (ten) cellText(VA.x + VA.w + 12, VA.y + 17, st.va.name, { size: 13, weight: 700, mono: true, anchor: "start", color: BLUE, cls: vch ? "anim-pop" : "" });

    // the MMU inside the CPU, with the TLB, the PTE, the PTBR and the physical address
    out.push(H.box(MMU.x, MMU.y, MMU.w, MMU.h, { r: 12, stroke: LIGHT, sw: 1.8 }));
    out.push(H.text(MMU.x + MMU.w - 10, MMU.y + 16, "CPU: the MMU", { size: 12, weight: 700, anchor: "end" }));
    out.push(H.text(TL.cols[3], TL.y - 6, "TLB", { size: 12, weight: 700, anchor: "end" }));
    out.push(H.box(TL.x, TL.y, TL.cols[3] - TL.x, 16 + 4 * TL.rh, { r: 4, fill: "var(--md-default-bg-color)", stroke: LIGHT, sw: 1.3 }));
    out.push(H.box(TL.x, TL.y, TL.cols[3] - TL.x, 16, { r: 4, fill: CODEBG, stroke: "transparent" }));
    ["VPN", "PFN", "prot"].forEach(function (h, j) { cellText((TL.cols[j] + TL.cols[j + 1]) / 2, TL.y + 12, h, { size: 10, weight: 700, color: LIGHT }); });
    st.tlb.forEach(function (e, i) {
      var y = tRow(i), isIns = st.ins === i, isNew = isIns && (!pv.tlb[i] || pv.tlb[i] !== e), isHl = st.hl === i;
      if (isIns) out.push(H.box(TL.x + 1, y + 1, TL.cols[3] - TL.x - 2, TL.rh - 2, { r: 2, fill: YEL, stroke: YST, sw: 1.2, cls: isNew ? "anim-new" : "" }));
      else if (isHl) out.push(H.box(TL.x + 1, y + 1, TL.cols[3] - TL.x - 2, TL.rh - 2, { r: 2, fill: GREEN, stroke: GOOD, sw: 1.2, cls: "anim-new" }));
      out.push('<line x1="' + TL.x + '" y1="' + y + '" x2="' + TL.cols[3] + '" y2="' + y + '" style="stroke:' + LIGHTER + ';stroke-width:1"/>');
      if (!e) { if (!failed) cellText((TL.cols[0] + TL.cols[3]) / 2, y + 14, "empty", { size: 10, italic: true, color: LIGHT }); return; }
      [e.vpn, e.pfn, e.prot].forEach(function (v, j) {
        cellText((TL.cols[j] + TL.cols[j + 1]) / 2, y + 14, v, { size: 11, mono: true, weight: e.other ? 400 : 700, color: e.other ? LIGHT : "var(--md-default-fg-color)" });
      });
    });
    [1, 2].forEach(function (j) { out.push('<line x1="' + TL.cols[j] + '" y1="' + TL.y + '" x2="' + TL.cols[j] + '" y2="' + (TL.y + 16 + 4 * TL.rh) + '" style="stroke:' + LIGHTER + ';stroke-width:1"/>'); });

    if (!ten) {
      var pch = st.pte && !pv.pte;
      out.push(H.box(PTE.x, PTE.y, PTE.w, PTE.h, { r: 6, fill: pch ? YEL : CODEBG, stroke: pch ? YST : "transparent", sw: 1.4, cls: pch ? "anim-new" : "" }));
      cellText(PTE.x + PTE.w / 2, PTE.y + 15, "PTE", { size: 11, weight: 700, color: LIGHT });
      if (st.pte) {
        cellText(PTE.x + PTE.w / 2, PTE.y + 38, "PFN", { size: 11, mono: true, weight: 700 });
        var okc = st.ptOk ? { size: 10.5, mono: true, weight: 700, color: GOOD, cls: pv.ptOk ? "" : "anim-pop" } : { size: 10.5, mono: true };
        cellText(PTE.x + PTE.w / 2, PTE.y + 58, "Valid 1", okc);
        cellText(PTE.x + PTE.w / 2, PTE.y + 78, "prot", okc);
      } else cellText(PTE.x + PTE.w / 2, PTE.y + 52, "not read", { size: 10, italic: true, color: LIGHT });
      out.push(H.box(PTBR.x, PTBR.y, PTBR.w, PTBR.h, { r: 6, fill: CODEBG, stroke: "transparent" }));
      cellText(PTBR.x + PTBR.w / 2, PTBR.y + 15, "PTBR", { size: 11, weight: 700, color: LIGHT });
      cellText(PTBR.x + PTBR.w / 2, PTBR.y + 34, "table start", { size: 10, color: LIGHT });
    }

    // the physical address
    var phch = st.phys && !pv.phys;
    if (st.phys) {
      out.push(H.box(PA.x, PA.y, PA.w / 2, PA.h, { r: 3, fill: phch ? YEL : CODEBG, stroke: phch ? YST : LIGHTER, cls: phch ? "anim-new" : "" }));
      out.push(H.box(PA.x + PA.w / 2, PA.y, PA.w / 2, PA.h, { r: 3, fill: phch ? YEL : CODEBG, stroke: phch ? YST : LIGHTER, cls: phch ? "anim-new" : "" }));
    } else out.push(H.box(PA.x, PA.y, PA.w, PA.h, { r: 3, fill: CODEBG, stroke: LIGHTER }));
    if (st.phys) { cellText(PA.x + PA.w / 4, PA.y + 15, "PFN", { size: 11, weight: 700, mono: true }); cellText(PA.x + 3 * PA.w / 4, PA.y + 15, "offset", { size: 11, mono: true }); }
    else cellText(PA.x + PA.w / 2, PA.y + 15, "physical address", { size: 10, italic: true, color: LIGHT });

    // memory: the page table and the program's data
    out.push(H.box(MEM.x, MEM.y, MEM.w, MEM.h, { r: 12, stroke: LIGHT, sw: 1.8 }));
    out.push(H.text(MEM.x + 10, MEM.y + 16, "memory", { size: 12, weight: 700, anchor: "start" }));
    out.push(H.text(PT.cols[4], MEM.y + 16, "page table", { size: 11, weight: 700, anchor: "end" }));
    out.push(H.box(PT.x, PT.y, PT.cols[4] - PT.x, 16 + 3 * PT.rh, { r: 4, fill: "var(--md-default-bg-color)", stroke: LIGHT, sw: 1.3 }));
    out.push(H.box(PT.x, PT.y, PT.cols[4] - PT.x, 16, { r: 4, fill: CODEBG, stroke: "transparent" }));
    ["VPN", "PFN", "Valid", "prot"].forEach(function (h, j) { cellText((PT.cols[j] + PT.cols[j + 1]) / 2, PT.y + 12, h, { size: 10, weight: 700, color: LIGHT }); });
    st.pt.forEach(function (r, i) {
      var y = pRow(i);
      if (st.ptHl === i) out.push(H.box(PT.x + 1, y + 1, PT.cols[4] - PT.x - 2, PT.rh - 2, { r: 2, fill: "rgba(178,58,72,.12)", stroke: BAD, sw: 1.1 }));
      out.push('<line x1="' + PT.x + '" y1="' + y + '" x2="' + PT.cols[4] + '" y2="' + y + '" style="stroke:' + LIGHTER + ';stroke-width:1"/>');
      [r.vpn, r.pfn, r.valid, r.prot].forEach(function (v, j) {
        cellText((PT.cols[j] + PT.cols[j + 1]) / 2, y + 14, v, { size: 10.5, mono: true, weight: r.other ? 400 : 700, color: r.other ? LIGHT : "var(--md-default-fg-color)" });
      });
    });
    var memAct = (s.acts || []).some(function (a) { return a.k === "mem"; });
    out.push(H.box(DATA.x, DATA.y, DATA.w, DATA.h, { r: 6, fill: memAct ? GREEN : CODEBG, stroke: memAct ? GOOD : "transparent", sw: 1.4, cls: memAct ? "anim-new" : "" }));
    out.push(H.lines(DATA.x + DATA.w / 2, DATA.y + 34, ["the program's", "data and code"], { size: 11, weight: 700, lh: 15 }));

    // under memory: the memory references so far (tabs 1 and 2), or the hit/miss strip (tab 3)
    if (!ten) {
      out.push(H.text(16, 370, "memory references so far:", { size: 11, anchor: "start", color: LIGHT }));
      out.push(H.text(166, 371, String(st.refs), { size: 15, weight: 700, mono: true, anchor: "start", color: st.refs > 1 ? WARN : "var(--md-default-fg-color)", cls: pv.refs !== st.refs ? "anim-pop" : "" }));
    } else {
      for (var i = 0; i < 10; i++) {
        var x = 8 + i * 29.5, v = st.strip[i], isLast = i === st.strip.length - 1 && !st.done;
        out.push(H.text(x + 13.5, 360, "a[" + i + "]", { size: 10, mono: true, color: LIGHT }));
        out.push(H.box(x, 364, 27, 18, { r: 3, fill: v === "M" ? "rgba(178,58,72,.16)" : v === "H" ? GREEN : "var(--md-default-bg-color)", stroke: isLast ? YST : LIGHTER, sw: isLast ? 2 : 1 }));
        if (v) out.push(H.text(x + 13.5, 377, v, { size: 11, weight: 700, color: v === "M" ? BAD : GOOD, cls: isLast ? "anim-pop" : "" }));
      }
      var hits = st.strip.filter(function (x) { return x === "H"; }).length;
      out.push(H.text(308, 377, hits + "/" + st.strip.length, { size: 13, weight: 700, anchor: "start", color: st.done ? GOOD : "var(--md-default-fg-color)" }));
    }

    // the one arrow of this step
    (s.acts || []).forEach(function (a) {
      var vpnX = VA.x + VA.w / 4, tlbTop = TL.y - 1;
      if (a.k === "lookup") {
        var col = a.ok ? GOOD : BAD;
        var ty = a.ok ? tRow(a.row) + TL.rh / 2 : tRow(2);
        out.push(H.arrow(vpnX - 12, VA.y + VA.h + 1, TL.x - 1, ty, { color: col, bend: [-46, 0], label: "line 2: TLB_Lookup", mono: true, lpos: [100, 68], sw: 2.4 }));
        if (!a.ok) {
          out.push(H.mark(TL.x + 34, tRow(2) + 26, false));
          out.push(H.text(TL.x + 86, tRow(2) + 25, "no match", { size: 12, weight: 700, color: BAD, cls: "anim-pop" }));
        }
      }
      if (a.k === "prot") {
        out.push(H.arrow(250, PA.y + 4, TL.cols[3] + 1, tRow(a.row) + TL.rh / 2, { color: GOOD, bend: [10, 10], label: "line 4: CanAccess", mono: true, lpos: [281, 210], sw: 2.4 }));
      }
      if (a.k === "pfn") out.push(H.arrow((TL.cols[1] + TL.cols[2]) / 2, tRow(a.row) + TL.rh - 2, PA.x + PA.w / 4, PA.y - 1, { color: BLUE, bend: [-10, 0], label: "line 6", mono: true, lpos: [232, 210], sw: 2.4 }));
      if (a.k === "mem") out.push(H.arrow(PA.x + PA.w / 2, PA.y + PA.h + 1, DATA.x + DATA.w / 2, DATA.y - 1, { color: GOOD, label: "line 7: AccessMemory", mono: true, lpos: [140, 250], sw: 2.4 }));
      if (a.k === "ptbr") out.push(H.arrow(PTBR.x + PTBR.w / 2, PTBR.y + PTBR.h + 1, PT.cols[4] + 1, pRow(a.row) + PT.rh / 2, { color: BAD, bend: [24, 0], label: "line 11", mono: true, lpos: [314, 166], sw: 2.4 }));
      if (a.k === "read") out.push(H.arrow(PT.x - 1, pRow(a.row) + PT.rh / 2, PTE.x + PTE.w / 2, PTE.y + PTE.h + 1, { color: BAD, bend: [-30, 6], label: "line 12: AccessMemory", mono: true, lpos: [276, 212], sw: 2.6 }));
      if (a.k === "check") out.push(H.text(272, PTE.y + PTE.h + 21, "lines 13, 15: ok", { size: 10.5, weight: 700, color: GOOD, mono: true, cls: "anim-pop" }));
      if (a.k === "insert") out.push(H.arrow(PTE.x - 1, tRow(a.row) + TL.rh / 2, TL.cols[3] + 1, tRow(a.row) + TL.rh / 2, { color: WARN, label: "line 18: TLB_Insert", mono: true, lpos: [281, 210], sw: 2.6 }));
      if (a.k === "retry") {
        out.push(H.arrow(PTE.x + 4, PTE.y - 2, VA.x + VA.w + 2, VA.y + VA.h / 2, { color: BLUE, bend: [10, -16], label: "line 19: retry", mono: true, lpos: [266, 34], sw: 2.4 }));
      }
      if (a.k === "insert10") out.push(H.arrow(PT.x - 1, pRow(a.pt) + PT.rh / 2, TL.cols[3] + 1, tRow(a.row) + TL.rh / 2, { color: WARN, bend: [-34, 0], label: "miss: TLB_Insert", mono: true, lpos: [268, 150], sw: 2.6 }));
    });
    return out.join("");
  }

  window.OS_ANIMS.tlb = {
    title: "The TLB algorithm: ask the cache first, retry after a miss",
    interval: 4200,
    threads: ["MMU"],
    colors: { MMU: "#1f6f8b" },
    codeTitle: "OSTEP Figure 19.1, TLB control flow algorithm (Figure 6.6)",
    sceneBox: "0 0 360 386",
    scene: scene,
    code: code,
    variants: [
      { key: "hit", label: "Hit", steps: hit },
      { key: "miss", label: "Miss", steps: miss }
    ]
  };
  // The ten accesses of Exercise 10 answer a "Your turn" question, so they sit on the review page next to Answer 10,
  // not in Section 6.4. Same scene and code, one tab.
  window.OS_ANIMS.tlb10 = {
    title: "Answer 10, access by access: ten array elements on sixteen-byte pages",
    interval: 4200,
    threads: ["MMU"],
    colors: { MMU: "#1f6f8b" },
    codeTitle: "OSTEP Figure 19.1, TLB control flow algorithm (class 2, Figure 6.6)",
    sceneBox: "0 0 360 386",
    scene: scene,
    code: code,
    variants: [
      { key: "ten", label: "Ten array elements", steps: ten }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
