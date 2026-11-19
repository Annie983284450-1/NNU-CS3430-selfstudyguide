// Lazy allocation in xv6, one page fault at a time (W05 class 2, Sections 4.3 to 4.7).
// Code: the page-fault branch of usertrap() (kernel/trap.c lines 69 to 78, Figure 4.17) and vmfault() (kernel/vm.c
// lines 448 to 473, Figure 4.19), as the page prints them. The run is Section 4.7's lazy program (Figures 4.21, 4.22):
// sbrklazy(3 * 4096) moved sz from 0x5000 to 0x8000; the rows for the program's own pages stop at 0x4000 (0x3000 at
// paddr 0x87f1a000 rw-u---, 0x4000 at 0x87f19000 rw-u-ad).
// Tab 1 is a touch inside the heap: the write new[0] = 1 at 0x5000 faults, vmfault() installs 0x87f23000, the write runs
// again (Figure 4.22 step 2), and the same path then builds 0x7000 for new[2 * 4096 + 5] = 7 (step 3, 0x87f54000).
// Tab 2 is a touch outside: the read at 0x8064, past sz, so vmfault() returns 0 at line 459 and usertrap() prints the
// message (scause 0xd, sepc 0xd4, stval 0x8064) and kills pid 3 (Figure 4.21's console, Figure 4.22 step 4).
// The picture: the CPU (scause, stval) and the kernel (vmfault's va and mem) on top; below them pid 3's virtual pages
// with p->sz marked, the page table in the middle, and physical frames on the right, one row per page.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  var L = [
    [69, "  } else if((which_dev = devintr()) != 0){"],
    [70, "    // ok"],
    [71, "  } else if((r_scause() == 15 || r_scause() == 13) &&"],
    [72, "            vmfault(p->pagetable, r_stval(), (r_scause() == 13)? 1 : 0) != 0) {"],
    [73, "    // page fault on lazily-allocated page"],
    [74, "  } else {"],
    [75, "    printf(\"usertrap(): unexpected scause 0x%lx pid=%d\\n\", r_scause(), p->pid);"],
    [76, "    printf(\"            sepc=0x%lx stval=0x%lx\\n\", r_sepc(), r_stval());"],
    [77, "    setkilled(p);"],
    [78, "  }"],
    [null, ""],
    [448, "// allocate and map user memory if process is referencing a page"],
    [449, "// that was lazily allocated in sys_sbrk()."],
    [450, "// returns 0 if va is invalid or already mapped, or if"],
    [451, "// out of physical memory, and physical address if successful."],
    [452, "uint64"],
    [453, "vmfault(pagetable_t pagetable, uint64 va, int read)"],
    [454, "{"],
    [455, "  uint64 mem;"],
    [456, "  struct proc *p = myproc();"],
    [457, ""],
    [458, "  if (va >= p->sz)"],
    [459, "    return 0;"],
    [460, "  va = PGROUNDDOWN(va);"],
    [461, "  if(ismapped(pagetable, va)) {"],
    [462, "    return 0;"],
    [463, "  }"],
    [464, "  mem = (uint64) kalloc();"],
    [465, "  if(mem == 0)"],
    [466, "    return 0;"],
    [467, "  memset((void *) mem, 0, PGSIZE);"],
    [468, "  if (mappages(p->pagetable, va, PGSIZE, mem, PTE_W|PTE_U|PTE_R) != 0) {"],
    [469, "    kfree((void *)mem);"],
    [470, "    return 0;"],
    [471, "  }"],
    [472, "  return mem;"],
    [473, "}"]
  ];
  var code = L.map(function (x) { return { n: x[0], text: x[1] }; });

  // rows of the picture, top to bottom: virtual pages, and the physical frame drawn on the same row
  var VA = ["0x8000", "0x7000", "0x6000", "0x5000", "0x4000", "0x3000"];
  var FR = { 1: "0x87f54000", 3: "0x87f23000", 4: "0x87f19000", 5: "0x87f1a000" };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  // state: regs {scause, stval}, kfn (what the kernel runs), va, mem, pte[row] = {pa, fl} or null, fr[pa] = status,
  //        touch (the row the program touches), mode ("user" or "kernel"), instr, killed
  // act:   {t: "access" | "trap" | "sz" | "pte" | "frame" | "ret" | "kill", row, label, kind: "ok" | "bad" | "info" | "new"}
  var base = {
    regs: { scause: null, stval: null }, kfn: null, va: null, mem: null,
    pte: [null, null, null, null, { pa: "0x87f19000", fl: "rw-u-ad" }, { pa: "0x87f1a000", fl: "rw-u---" }],
    fr: { "0x87f54000": "free", "0x87f23000": "free", "0x87f19000": "in use", "0x87f1a000": "in use" },
    touch: null, mode: "user", instr: "spin(), nothing touched", killed: false
  };
  function S(label, text, line, upd, act, ev, evk) {
    return { label: label, text: text, at: line ? [{ who: "pid 3", line: line }] : [], upd: upd, act: act, event: ev, eventKind: evk };
  }
  function chain(steps, start) {
    var cur = clone(start);
    return steps.map(function (s) {
      var u = s.upd || {};
      Object.keys(u).forEach(function (k) { cur[k] = u[k]; });
      s.state = clone(cur);
      delete s.upd;
      return s;
    });
  }

  var inside = chain([
    S("Start", "sbrklazy(3 * 4096) moved p->sz from 0x5000 to 0x8000 and allocated nothing. The rows for the program's own pages stop at 0x4000: pages 0x5000 to 0x7000 are promised, not delivered.", null, {},
      null),
    S("Touch", "The program writes new[0] = 1, at 0x5000. The page table has no entry for 0x5000, so the translation fails and the write faults.", null,
      { touch: 3, instr: "store to 0x5000" },
      { t: "access", row: 3, label: "store 0x5000", kind: "bad" }),
    S("Trap", "The hardware traps into the kernel. scause records why, 15 for a store whose translation failed, and stval holds the address, 0x5000. usertrap() matches line 71 and calls vmfault() on line 72.", 72,
      { regs: { scause: "15", stval: "0x5000" }, kfn: "usertrap()", mode: "kernel" },
      { t: "trap", label: "trap: line 71, 72" }),
    S("Line 458", "vmfault() first checks the address against the size. 0x5000 is below p->sz = 0x8000, so the page was promised and the handler goes on.", 458,
      { kfn: "vmfault()", va: "0x5000" },
      { t: "sz", label: "458: va < p->sz", kind: "ok" }),
    S("Line 461", "Line 460 rounds va down to its page start, 0x5000 already. Line 461 asks whether the page already has a valid entry. It has none, so this is a lazy page.", 461,
      {},
      { t: "pte", row: 3, label: "461: ismapped? no", kind: "ok" }),
    S("Line 464", "kalloc() takes a free frame, 0x87f23000, and vmfault() keeps its address in mem.", 464,
      { mem: "0x87f23000", fr: { "0x87f54000": "free", "0x87f23000": "kalloc'd", "0x87f19000": "in use", "0x87f1a000": "in use" } },
      { t: "frame", row: 3, label: "464: kalloc()", kind: "new" }),
    S("Line 467", "memset fills the new frame with zeros. There is no disk, so this is where Figure 21.3 reads the page in.", 467,
      { fr: { "0x87f54000": "free", "0x87f23000": "zeroed", "0x87f19000": "in use", "0x87f1a000": "in use" } },
      { t: "frame", row: 3, label: "467: memset 0", kind: "new" }),
    S("Line 468", "mappages() writes the entry: page 0x5000 points at 0x87f23000, with write, user and read permission.", 468,
      { pte: [null, null, null, { pa: "0x87f23000", fl: "rw-u---" }, { pa: "0x87f19000", fl: "rw-u-ad" }, { pa: "0x87f1a000", fl: "rw-u---" }],
        fr: { "0x87f54000": "free", "0x87f23000": "mapped", "0x87f19000": "in use", "0x87f1a000": "in use" } },
      { t: "pte", row: 3, label: "468: mappages", kind: "new" }),
    S("Line 472", "vmfault() returns mem, not 0, so usertrap() treats the fault as handled. sepc is unchanged, so prepare_return (trap.c line 87) sends the process back to the same instruction.", 472,
      { kfn: null, mode: "user" },
      { t: "ret", label: "472: return mem", kind: "ok" },
      "The retry is not in vmfault: sepc still points at the store.", "info"),
    S("Retry", "The write runs again and now finds the row. It goes to frame 0x87f23000, and the hardware sets a and d, accessed and dirty. info mem after step 2 shows 0x5000 at 0x87f23000, rw-u-ad.", null,
      { pte: [null, null, null, { pa: "0x87f23000", fl: "rw-u-ad" }, { pa: "0x87f19000", fl: "rw-u-ad" }, { pa: "0x87f1a000", fl: "rw-u---" }],
        fr: { "0x87f54000": "free", "0x87f23000": "in use", "0x87f19000": "in use", "0x87f1a000": "in use" } },
      { t: "access", row: 3, label: "store 0x5000", kind: "ok" },
      "The program never knew: one page fault, one new row.", "good"),
    S("Step 3", "new[2 * 4096 + 5] = 7 writes 0x7005 and faults the same way. Line 460 rounds 0x7005 down to 0x7000, and the row for 0x7000 appears at 0x87f54000, rw-u-ad. 0x6000 still has no row, because nothing used it.", 460,
      { regs: { scause: "15", stval: "0x7005" }, va: "0x7000", mem: "0x87f54000", touch: 1, instr: "store to 0x7005",
        pte: [null, { pa: "0x87f54000", fl: "rw-u-ad" }, null, { pa: "0x87f23000", fl: "rw-u-ad" }, { pa: "0x87f19000", fl: "rw-u-ad" }, { pa: "0x87f1a000", fl: "rw-u---" }],
        fr: { "0x87f54000": "in use", "0x87f23000": "in use", "0x87f19000": "in use", "0x87f1a000": "in use" } },
      { t: "pte", row: 1, label: "460: va = 0x7000", kind: "new" },
      "sz said 3 pages; the table said 0, then 1, then 2.", "good")
  ], base);

  var afterStep3 = clone(base);
  afterStep3.pte = [null, { pa: "0x87f54000", fl: "rw-u-ad" }, null, { pa: "0x87f23000", fl: "rw-u-ad" }, { pa: "0x87f19000", fl: "rw-u-ad" }, { pa: "0x87f1a000", fl: "rw-u---" }];
  afterStep3.fr = { "0x87f54000": "in use", "0x87f23000": "in use", "0x87f19000": "in use", "0x87f1a000": "in use" };
  afterStep3.instr = "after steps 2 and 3";

  var outside = chain([
    S("Start", "After steps 2 and 3, pages 0x5000 and 0x7000 have rows and 0x6000 has none. p->sz is still 0x8000. Now the program reads the byte at sbrk(0) + 100, which is 0x8064.", null, {},
      null),
    S("Touch", "The read at 0x8064 is past sz. There is no entry for its page, so the translation fails and the load faults.", null,
      { touch: 0, instr: "load from 0x8064" },
      { t: "access", row: 0, label: "load 0x8064", kind: "bad" }),
    S("Trap", "The hardware traps. scause is 0xd, 13, the load page fault, and stval is 0x8064. Line 71 matches, so usertrap() calls vmfault() on line 72.", 72,
      { regs: { scause: "0xd", stval: "0x8064" }, kfn: "usertrap()", mode: "kernel" },
      { t: "trap", label: "trap: line 71, 72" }),
    S("Line 459", "0x8064 is at or beyond p->sz = 0x8000, so the address was never promised. vmfault() returns 0 at line 459.", 459,
      { kfn: "vmfault()", va: "0x8064" },
      { t: "sz", label: "458: va >= p->sz", kind: "bad" }),
    S("Kill", "vmfault() returned 0, so the chain falls through to the else. usertrap() prints the cause, the pid, sepc and stval, and setkilled(p) marks pid 3 to be killed. The shell prompt is back.", 77,
      { kfn: "usertrap()", killed: true },
      { t: "kill", label: "77: setkilled(p)", kind: "bad" },
      "usertrap(): unexpected scause 0xd pid=3  sepc=0xd4 stval=0x8064", "bad")
  ], afterStep3);

  // ---- the scene
  var GOOD = "#2a7a6b", BAD = "#b23a48", NEWC = "#e8b23a", INFO = "#4051b5", MUTED = "var(--md-default-fg-color--light)";
  var CPU = { x: 6, y: 4, w: 156, h: 78 }, KER = { x: 198, y: 4, w: 156, h: 78 };
  var VX = [40, 104], PX = [134, 222], FX = [256, 352];     // the three columns
  var RY = 126, RH = 30;                                     // first row top, row height
  function rowY(r) { return RY + r * RH; }
  function rowC(r) { return RY + r * RH + RH / 2; }
  var KC = { ok: GOOD, bad: BAD, info: INFO, "new": "#a0632a" };

  function scene(s, H, ctx) {
    var st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [], a = s.act;
    function cell(x, y, w, h, name, val, changed) {
      out.push(H.box(x, y, w, h, { r: 6, fill: changed ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: changed ? NEWC : "transparent", sw: 1.5, cls: changed ? "anim-new" : "" }));
      out.push(H.text(x + 6, y + 13, name, { size: 10, anchor: "start", color: MUTED, mono: true }));
      out.push(H.text(x + w - 6, y + 31, val === null ? "-" : val, { size: val && val.length > 7 ? 10.5 : 13, weight: 700, anchor: "end", mono: true }));
    }
    // the CPU
    var cpuOn = st.mode === "user" && !st.killed;
    out.push(H.box(CPU.x, CPU.y, CPU.w, CPU.h, { r: 10, stroke: st.killed ? BAD : "var(--md-default-fg-color--light)", sw: cpuOn ? 2.2 : 1.4, fill: st.killed ? "rgba(178,58,72,.10)" : "var(--md-default-bg-color)" }));
    out.push(H.text(CPU.x + 8, CPU.y + 15, "CPU, pid 3", { size: 11, weight: 700, anchor: "start" }));
    out.push(H.text(CPU.x + CPU.w - 8, CPU.y + 15, st.killed ? "marked killed" : st.mode === "user" ? "user mode" : "trapped", { size: 10, anchor: "end", weight: 700, color: st.killed ? BAD : st.mode === "user" ? GOOD : "#a0632a" }));
    out.push(H.text(CPU.x + 8, CPU.y + 29, st.instr, { size: 10, anchor: "start", mono: true, color: MUTED }));
    cell(CPU.x + 6, CPU.y + 36, 70, 36, "scause", st.regs.scause, pv.regs.scause !== st.regs.scause);
    cell(CPU.x + 80, CPU.y + 36, 70, 36, "stval", st.regs.stval, pv.regs.stval !== st.regs.stval);
    // the kernel
    out.push(H.box(KER.x, KER.y, KER.w, KER.h, { r: 10, stroke: st.kfn ? INFO : "var(--md-default-fg-color--lighter)", sw: st.kfn ? 2.2 : 1.2 }));
    out.push(H.text(KER.x + 8, KER.y + 15, "kernel", { size: 11, weight: 700, anchor: "start" }));
    out.push(H.text(KER.x + KER.w - 8, KER.y + 15, st.kfn || "not running", { size: 10, anchor: "end", mono: !!st.kfn, weight: st.kfn ? 700 : 400, color: st.kfn ? INFO : MUTED, italic: !st.kfn }));
    out.push(H.text(KER.x + 8, KER.y + 29, "vmfault()'s variables", { size: 10, anchor: "start", color: MUTED }));
    cell(KER.x + 6, KER.y + 36, 62, 36, "va", st.va, pv.va !== st.va);
    cell(KER.x + 72, KER.y + 36, 78, 36, "mem", st.mem, pv.mem !== st.mem);

    // the three columns
    VA.forEach(function (v, r) {
      var y = rowY(r) + 2, h = RH - 4, beyond = r === 0, own = r >= 4;
      var touched = st.touch === r;
      var status = beyond ? "beyond sz" : own ? "own page" : st.pte[r] ? "in use" : "promised";
      out.push(H.box(VX[0], y, VX[1] - VX[0], h, { r: 5, fill: beyond ? "rgba(120,120,120,.10)" : "var(--md-code-bg-color)", stroke: touched ? (a && a.t === "access" && a.kind === "ok" ? GOOD : NEWC) : (!beyond && !own && !st.pte[r] ? "var(--md-default-fg-color--lighter)" : "transparent"), sw: touched ? 2 : 1, dash: !touched && !beyond && !own && !st.pte[r] }));
      out.push(H.text(VX[0] + 6, y + 11, v, { size: 10.5, weight: 700, anchor: "start", mono: true }));
      out.push(H.text(VX[0] + 6, y + 23, status, { size: 10, anchor: "start", italic: status === "promised" || beyond, color: MUTED }));
      // the page-table entry
      var e = st.pte[r], pe = pv.pte[r], ch = JSON.stringify(e) !== JSON.stringify(pe);
      out.push(H.box(PX[0], y, PX[1] - PX[0], h, { r: 5, fill: ch ? "rgba(232,178,58,.30)" : e ? "var(--md-code-bg-color)" : "var(--md-default-bg-color)", stroke: ch ? NEWC : "var(--md-default-fg-color--lighter)", sw: ch ? 1.8 : 1, cls: ch ? "anim-new" : "" }));
      if (e) {
        out.push(H.text(PX[0] + 6, y + 11, e.pa, { size: 10, anchor: "start", mono: true, weight: 700 }));
        out.push(H.text(PX[0] + 6, y + 23, e.fl, { size: 10, anchor: "start", mono: true, color: MUTED }));
      } else out.push(H.text((PX[0] + PX[1]) / 2, y + 17, "no entry", { size: 10, italic: true, color: MUTED }));
      // the frame on this row, if any
      var f = FR[r];
      if (f) {
        var fs = st.fr[f], fch = pv.fr[f] !== fs, isFree = fs === "free";
        out.push(H.box(FX[0], y, FX[1] - FX[0], h, { r: 5, fill: fch ? "rgba(232,178,58,.30)" : isFree ? "var(--md-default-bg-color)" : "var(--md-code-bg-color)", stroke: fch ? NEWC : "var(--md-default-fg-color--lighter)", sw: fch ? 1.8 : 1, dash: isFree, cls: fch ? "anim-new" : "" }));
        out.push(H.text(FX[0] + 6, y + 11, f, { size: 10, anchor: "start", mono: true, weight: 700 }));
        out.push(H.text(FX[0] + 6, y + 23, fs, { size: 10, anchor: "start", italic: isFree, color: MUTED }));
      }
      // the mapping, entry to frame
      if (e) {
        var hot = a && a.t === "access" && a.kind === "ok" && a.row === r;
        out.push('<line x1="' + PX[1] + '" y1="' + rowC(r) + '" x2="' + FX[0] + '" y2="' + rowC(r) + '" style="stroke:' + (hot ? GOOD : "var(--md-default-fg-color--lighter)") + ';stroke-width:' + (hot ? 2.6 : 1.2) + '"' + (hot ? ' class="anim-new"' : '') + '/>');
      }
    });
    out.push(H.text((VX[0] + VX[1]) / 2, rowY(6) + 10, "...", { size: 11, color: MUTED }));
    // p->sz, between 0x8000 and 0x7000
    var szy = rowY(1);
    out.push('<line x1="4" y1="' + szy + '" x2="' + (PX[0] - 4) + '" y2="' + szy + '" style="stroke:' + INFO + ';stroke-width:2"/>');
    out.push(H.text(19, szy - 4, "p->sz", { size: 10, weight: 700, color: INFO, mono: true }));
    out.push(H.text(19, szy + 12, "0x8000", { size: 10, color: INFO, mono: true }));
    // column names
    var hy = rowY(6) + 26;
    out.push(H.text((VX[0] + VX[1]) / 2, hy, "virtual page", { size: 10.5, weight: 700, color: MUTED }));
    out.push(H.text((PX[0] + PX[1]) / 2, hy, "page-table entry", { size: 10.5, weight: 700, color: MUTED }));
    out.push(H.text((FX[0] + FX[1]) / 2, hy, "physical frame", { size: 10.5, weight: 700, color: MUTED }));

    // the action of this step
    if (a) {
      var col = KC[a.kind] || INFO, LY = 106;
      if (a.t === "access") {
        out.push(H.arrow(119, CPU.y + CPU.h, PX[0] - 1, rowC(a.row), { color: col, bend: [-14, 14], sw: 2.4, label: a.label, mono: true, lpos: [92, LY] }));
        if (a.kind === "bad") out.push(H.mark(PX[1] - 12, rowC(a.row) + 7, false));
      }
      if (a.t === "trap" || a.t === "ret" || a.t === "kill") {
        var fromK = a.t !== "trap", x1 = fromK ? KER.x + 38 : CPU.x + CPU.w - 38, x2 = fromK ? CPU.x + CPU.w - 38 : KER.x + 38;
        out.push(H.arrow(x1, CPU.y + CPU.h, x2, CPU.y + CPU.h, { color: a.t === "trap" ? "#a0632a" : col, bend: [0, 28], sw: 2.4, label: a.label, mono: true, lpos: [180, LY + 6] }));
      }
      if (a.t === "sz") {
        out.push(H.arrow(KER.x + 2, KER.y + KER.h, PX[0] - 10, szy, { color: col, bend: [-38, -30], sw: 2.4, label: a.label, mono: true, lpos: [236, LY] }));
        out.push(H.mark(PX[0] - 22, szy - 6, a.kind === "ok"));
      }
      if (a.t === "pte") {
        out.push(H.arrow(239, KER.y + KER.h, PX[1] + 1, rowC(a.row), { color: col, bend: [10, 14], sw: 2.4, label: a.label, mono: true, lpos: [266, LY] }));
      }
      if (a.t === "frame") {
        out.push(H.arrow(239, KER.y + KER.h, FX[0] - 1, rowC(a.row), { color: col, bend: [-10, 14], sw: 2.4, label: a.label, mono: true, lpos: [266, LY] }));
      }
    }
    return out.join("");
  }

  window.OS_ANIMS.lazyalloc = {
    title: "Lazy allocation: a page fault, vmfault(), and the retry",
    interval: 4600,
    threads: ["pid 3"],
    colors: { "pid 3": "#1f6f8b" },
    sceneBox: "0 0 360 340",
    scene: scene,
    code: code,
    codeTitle: "kernel/trap.c lines 69 to 78, inside usertrap() (Figure 4.17), then kernel/vm.c lines 448 to 473 (Figure 4.19)",
    variants: [
      { key: "inside", label: "A touch inside the heap", steps: inside },
      { key: "outside", label: "A touch beyond sz", steps: outside }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
