// xv6's free-page list on two CPUs, W08 class 1, Section 2.7 (kernel/kalloc.c lines 68 to 78, Figures 2.7 and 2.8).
// The page gives no line-by-line interleaving. Tab 1 is built from its sentences: with the lock gone, both CPUs read
// the head (line 74) before either writes it, both get page P, and the kernel hands out one page twice (Figure 2.8).
// The order of the two writes on line 76 is this file's choice; each writes r->next of P, which is Q.
// Tab 2 is the page's one sentence on the lock: the second CPU waits inside acquire until the first has moved the
// head, then it takes page Q. The pages P, Q and R and their order are those of Figures 2.7 and 2.8.
// The picture: CPU 0 and CPU 1 on top, each with its local variable r; kmem below as one structure (its lock, the
// head kmem.freelist, and the linked pages); a read of the head is an arrow from the head to r, a write of the head
// an arrow from r to the head.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  var code = [
    [68, "void *"],
    [69, "kalloc(void)"],
    [70, "{"],
    [71, "  struct run *r;"],
    [72, ""],
    [73, "  acquire(&kmem.lock);"],
    [74, "  r = kmem.freelist;"],
    [75, "  if(r)"],
    [76, "    kmem.freelist = r->next;"],
    [77, "  release(&kmem.lock);"],
    [78, ""]
  ].map(function (x) { return { n: x[0], text: x[1] }; });

  var C0 = "CPU 0", C1 = "CPU 1";
  function T(kind, text) { return { kind: kind, text: text }; }
  // state: lock (null = free, a CPU = held, "gone" = removed), head ("P" | "Q" | "R"), r {CPU 0, CPU 1},
  // taken {P: [...], Q: [...]}: the CPUs that took each page off the list
  function st(lock, head, r0, r1, taken) { var r = {}; r[C0] = r0; r[C1] = r1; return { lock: lock, head: head, r: r, taken: taken || {} }; }
  function th(a, b) { var o = {}; o[C0] = a; o[C1] = b; return o; }

  // ---------------- Tab 1: the lock gone ----------------
  var race = [{
    label: "Start",
    text: "Three free pages are on kmem.freelist: P, Q and R. The head points at P. The lock is gone, and CPU 0 and CPU 1 call kalloc() at the same moment.",
    at: [], state: st("gone", "P", null, null),
    threads: th(T("run", "calls kalloc()"), T("run", "calls kalloc()")), acts: []
  }, {
    label: "Step 1",
    text: "CPU 0 reads the head (line 74): its r points at page P. The list has not changed, so it still says P is free.",
    at: [{ who: C0, line: 74 }], state: st("gone", "P", "P", null),
    threads: th(T("run", "r = P, head not written yet"), T("run", "calls kalloc()")),
    acts: [{ cpu: C0, op: "read", label: "line 74: r = kmem.freelist" }]
  }, {
    label: "Step 2",
    text: "In that gap, CPU 1 reads the head too (line 74). CPU 0 has not moved it yet, so CPU 1's r also points at P.",
    at: [{ who: C0, line: 75 }, { who: C1, line: 74 }], state: st("gone", "P", "P", "P"),
    threads: th(T("run", "r = P"), T("run", "r = P as well")),
    acts: [{ cpu: C1, op: "read", label: "line 74: r = kmem.freelist", kind: "bad" }],
    event: "Both CPUs have decided to take page P.", eventKind: "warn"
  }, {
    label: "Step 3",
    text: "CPU 0 finds r not empty (line 75) and writes the head (line 76): kmem.freelist = r->next, which is Q. P is out of the list.",
    at: [{ who: C0, line: 76 }, { who: C1, line: 75 }], state: st("gone", "Q", "P", "P", { P: [C0] }),
    threads: th(T("run", "took P"), T("run", "r = P, about to write the head")),
    acts: [{ cpu: C0, op: "write", label: "line 76: kmem.freelist = r->next" }]
  }, {
    label: "Step 4",
    text: "CPU 1 writes the head from its own r (line 76). Its r is P too, and P's next is Q, so the head stays at Q.",
    at: [{ who: C0, line: 77 }, { who: C1, line: 76 }], state: st("gone", "Q", "P", "P", { P: [C0, C1] }),
    threads: th(T("run", "took P"), T("run", "took P")),
    acts: [{ cpu: C1, op: "write", label: "line 76: kmem.freelist = r->next", kind: "bad" }]
  }, {
    label: "Result",
    text: "Each kalloc() returns its page r to its caller: both return P. Two processes would share one physical page without knowing it, and each would overwrite the other's data.",
    at: [], state: st("gone", "Q", "P", "P", { P: [C0, C1] }), twice: true,
    threads: th(T("dead", "returns P"), T("dead", "returns P")), acts: [],
    event: "One page, given out twice.", eventKind: "bad"
  }];

  // ---------------- Tab 2: with the lock ----------------
  var locked = [{
    label: "Start",
    text: "The same list: P, Q and R, with the head at P. This time kalloc() takes kmem.lock (line 73) before it touches the head. CPU 0 and CPU 1 call kalloc() at the same moment.",
    at: [], state: st(null, "P", null, null),
    threads: th(T("run", "calls kalloc()"), T("run", "calls kalloc()")), acts: []
  }, {
    label: "Step 1",
    text: "CPU 0 takes kmem.lock (line 73).",
    at: [{ who: C0, line: 73 }], state: st(C0, "P", null, null),
    threads: th(T("run", "holds the lock"), T("run", "calls kalloc()")),
    acts: [{ cpu: C0, op: "lock", label: "line 73: acquire" }]
  }, {
    label: "Step 2",
    text: "CPU 1 calls acquire (line 73). The lock is held, so CPU 1 waits inside acquire.",
    at: [{ who: C0, line: 74 }, { who: C1, line: 73 }], state: st(C0, "P", null, null),
    threads: th(T("run", "holds the lock"), T("wait", "waits inside acquire")),
    acts: [{ cpu: C1, op: "lock", label: "line 73: acquire waits", kind: "warn" }]
  }, {
    label: "Step 3",
    text: "CPU 0 reads the head (line 74): its r points at P.",
    at: [{ who: C0, line: 74 }, { who: C1, line: 73 }], state: st(C0, "P", "P", null),
    threads: th(T("run", "r = P"), T("wait", "waits inside acquire")),
    acts: [{ cpu: C0, op: "read", label: "line 74: r = kmem.freelist" }]
  }, {
    label: "Step 4",
    text: "CPU 0 writes the head (line 76): kmem.freelist = r->next, which is Q. No other CPU could read the head in between.",
    at: [{ who: C0, line: 76 }, { who: C1, line: 73 }], state: st(C0, "Q", "P", null, { P: [C0] }),
    threads: th(T("run", "took P"), T("wait", "waits inside acquire")),
    acts: [{ cpu: C0, op: "write", label: "line 76: kmem.freelist = r->next" }]
  }, {
    label: "Step 5",
    text: "CPU 0 releases the lock (line 77). CPU 1's acquire now gets it.",
    at: [{ who: C0, line: 77 }, { who: C1, line: 73 }], state: st(C1, "Q", "P", null, { P: [C0] }),
    threads: th(T("run", "took P"), T("run", "holds the lock")),
    acts: [{ cpu: C0, op: "lock", label: "line 77: release" }]
  }, {
    label: "Step 6",
    text: "CPU 1 reads the head (line 74). The head has moved, so its r points at Q.",
    at: [{ who: C1, line: 74 }], state: st(C1, "Q", "P", "Q", { P: [C0] }),
    threads: th(T("idle", "took P"), T("run", "r = Q")),
    acts: [{ cpu: C1, op: "read", label: "line 74: r = kmem.freelist" }]
  }, {
    label: "Step 7",
    text: "CPU 1 writes the head (line 76): r->next of Q is R. Q is out of the list.",
    at: [{ who: C1, line: 76 }], state: st(C1, "R", "P", "Q", { P: [C0], Q: [C1] }),
    threads: th(T("idle", "took P"), T("run", "took Q")),
    acts: [{ cpu: C1, op: "write", label: "line 76: kmem.freelist = r->next" }]
  }, {
    label: "Step 8",
    text: "CPU 1 releases the lock (line 77). CPU 0 got page P and CPU 1 got page Q.",
    at: [{ who: C1, line: 77 }], state: st(null, "R", "P", "Q", { P: [C0], Q: [C1] }),
    threads: th(T("idle", "returns P"), T("run", "returns Q")),
    acts: [{ cpu: C1, op: "lock", label: "line 77: release" }],
    event: "Each page given out once.", eventKind: "good"
  }];

  // ---------------- the scene ----------------
  var BAD = "#b23a48", WARN = "#a0632a", YEL = "rgba(232,178,58,.30)", LIGHT = "var(--md-default-fg-color--light)";
  var KIND = { bad: BAD, warn: WARN };
  var CPU = {}; CPU[C0] = [6, 172]; CPU[C1] = [188, 354];
  var CY = 6, CH = 92, LBLY = 124;
  var K = { y: 146, b: 330 };
  var LOCK = [16, 118], HEAD = [128, 240], FY = 176, FH = 50;
  var NODE = { P: [26, 106], Q: [140, 220], R: [254, 334] }, NY = 254, NH = 36;
  function ncx(n) { return (NODE[n][0] + NODE[n][1]) / 2; }
  function labX(x, label) { var h = label.length * 3.15 + 6; return Math.max(4 + h, Math.min(356 - h, x)); }

  function scene(s, H, ctx) {
    var c = ctx.col, S = s.state, pv = ctx.prev ? ctx.prev.state : S, out = [];
    // the two CPUs, each with its own r
    [C0, C1].forEach(function (cpu) {
      var x0 = CPU[cpu][0], x1 = CPU[cpu][1], w = x1 - x0, col = c(cpu), t = s.threads[cpu];
      var acting = (s.acts || []).some(function (a) { return a.cpu === cpu; });
      out.push(H.box(x0, CY, w, CH, { r: 10, stroke: col, sw: acting ? 2.8 : 1.4, fill: t.kind === "wait" ? "rgba(232,178,58,.14)" : t.kind === "dead" ? "rgba(178,58,72,.10)" : "var(--md-default-bg-color)" }));
      out.push(H.text(x0 + 10, CY + 19, cpu + ": kalloc()", { size: 12.5, weight: 700, anchor: "start", color: col }));
      var v = S.r[cpu], ch = v !== pv.r[cpu];
      out.push(H.box(x0 + 10, CY + 28, w - 20, 34, { r: 7, fill: ch ? YEL : "var(--md-code-bg-color)", stroke: ch ? "#e8b23a" : "transparent", sw: 1.4, cls: ch ? "anim-new" : "" }));
      out.push(H.text(x0 + 18, CY + 43, "r", { size: 12, weight: 700, anchor: "start", mono: true, color: LIGHT }));
      out.push(H.text(x0 + 18, CY + 56, "local variable", { size: 10, anchor: "start", color: LIGHT }));
      out.push(H.text(x1 - 20, CY + 52, v ? "page " + v : "-", { size: 15, weight: 700, anchor: "end", mono: true, color: s.twice && v === "P" ? BAD : "var(--md-default-fg-color)" }));
      out.push(H.text(x0 + w / 2, CY + 80, t.text, { size: 10.5, weight: t.kind === "dead" || t.kind === "wait" ? 700 : 400, color: t.kind === "dead" ? BAD : t.kind === "wait" ? WARN : "var(--md-default-fg-color)" }));
    });
    // kmem: the lock, the head, and the list
    out.push(H.box(6, K.y, 348, K.b - K.y, { r: 12, stroke: LIGHT, sw: 1.8 }));
    out.push(H.text(16, K.y + 20, "kmem", { size: 13.5, weight: 700, anchor: "start", mono: true }));
    out.push(H.text(344, K.y + 20, "shared by every CPU", { size: 10.5, anchor: "end", color: LIGHT }));
    var gone = S.lock === "gone", lch = !gone && pv.lock !== S.lock;
    out.push(H.box(LOCK[0], FY, LOCK[1] - LOCK[0], FH, { r: 8, fill: gone ? "transparent" : lch ? YEL : "var(--md-code-bg-color)", stroke: gone ? "var(--md-default-fg-color--lighter)" : lch ? "#e8b23a" : "transparent", sw: 1.6, dash: gone, cls: lch ? "anim-new" : "" }));
    out.push(H.text(LOCK[0] + 8, FY + 15, "lock", { size: 11, weight: 700, anchor: "start", mono: true, color: LIGHT }));
    var lx = (LOCK[0] + LOCK[1]) / 2;
    if (gone) out.push(H.text(lx, FY + 36, "gone", { size: 11, italic: true, color: LIGHT }));
    else if (S.lock) { out.push(H.text(LOCK[1] - 8, FY + 15, "held by", { size: 10, anchor: "end", color: LIGHT })); out.push(H.chip(lx, FY + 33, S.lock, c(S.lock), { cls: lch ? "anim-pop" : "" })); }
    else out.push(H.text(lx, FY + 36, "free", { size: 12, italic: true, color: LIGHT }));
    var hch = pv.head !== S.head;
    out.push(H.box(HEAD[0], FY, HEAD[1] - HEAD[0], FH, { r: 8, fill: hch ? YEL : "var(--md-code-bg-color)", stroke: hch ? "#e8b23a" : "transparent", sw: 1.6, cls: hch ? "anim-new" : "" }));
    out.push(H.text(HEAD[0] + 8, FY + 15, "freelist", { size: 11, weight: 700, anchor: "start", mono: true, color: LIGHT }));
    out.push(H.text(HEAD[1] - 8, FY + 15, "head", { size: 10, anchor: "end", color: LIGHT }));
    out.push(H.text(HEAD[0] + 10, FY + 40, "→ page " + S.head, { size: 14, weight: 700, anchor: "start", mono: true }));
    // the head pointer, drawn as part of the structure
    var hx = (HEAD[0] + HEAD[1]) / 2, tx = ncx(S.head);
    out.push('<path d="M' + hx + ',' + (FY + FH) + ' L' + tx + ',' + (NY - 2) + '" style="fill:none;stroke:var(--md-default-fg-color);stroke-width:1.6"/>');
    out.push('<polygon points="' + tx + ',' + (NY - 1) + ' ' + (tx - 5) + ',' + (NY - 9) + ' ' + (tx + 5) + ',' + (NY - 9) + '" style="fill:var(--md-default-fg-color)"/>');
    // the pages
    ["P", "Q", "R"].forEach(function (n, i) {
      var x0 = NODE[n][0], x1 = NODE[n][1], who = S.taken[n] || [], was = (pv.taken[n] || []).length !== who.length;
      var twice = who.length > 1;
      out.push(H.box(x0, NY, x1 - x0, NH, { r: 4, fill: twice ? "rgba(178,58,72,.14)" : who.length ? "transparent" : "rgba(31,111,139,.16)", stroke: twice ? BAD : who.length ? "var(--md-default-fg-color--lighter)" : "#1f6f8b", sw: twice ? 2 : 1.3, dash: who.length > 0, cls: was ? "anim-new" : "" }));
      out.push(H.text((x0 + x1) / 2, NY + 23, who.length ? n + ": taken" : "page " + n, { size: 12, weight: 700, color: twice ? BAD : who.length ? LIGHT : "var(--md-default-fg-color)" }));
      if (who.length) out.push(H.text((x0 + x1) / 2, NY + NH + 14, "by " + who.join(" and "), { size: 10.5, weight: 700, color: twice ? BAD : LIGHT, cls: was ? "anim-pop" : "" }));
      var nx = ["Q", "R"][i];
      if (nx && !who.length) out.push('<path d="M' + x1 + ',' + (NY + NH / 2) + ' L' + (NODE[nx][0] - 2) + ',' + (NY + NH / 2) + '" style="fill:none;stroke:var(--md-default-fg-color--light);stroke-width:1.4"/>' +
        '<polygon points="' + (NODE[nx][0] - 1) + ',' + (NY + NH / 2) + ' ' + (NODE[nx][0] - 8) + ',' + (NY + NH / 2 - 4) + ' ' + (NODE[nx][0] - 8) + ',' + (NY + NH / 2 + 4) + '" style="fill:var(--md-default-fg-color--light)"/>');
    });
    if (S.taken.P && S.taken.P.length > 1) out.push(H.mark(ncx("P"), NY - 8, false));
    // the action of this step
    (s.acts || []).forEach(function (a) {
      var color = KIND[a.kind] || c(a.cpu), left = a.cpu === C0;
      var cx = left ? 120 : 240, cy = CY + CH + 2;
      if (a.op === "read") out.push(H.arrow(hx + (left ? -14 : 14), FY - 2, cx, cy, { color: color, label: a.label, mono: true, lpos: [labX((hx + cx) / 2, a.label), LBLY], sw: 2.4 }));
      if (a.op === "write") out.push(H.arrow(cx, cy, hx + (left ? -14 : 14), FY - 2, { color: color, label: a.label, mono: true, lpos: [labX((hx + cx) / 2, a.label), LBLY], sw: 2.4 }));
      if (a.op === "lock") { var x0 = left ? 70 : 260; out.push(H.arrow(x0, cy, lx + (left ? 0 : 24), FY - 2, { color: color, label: a.label, mono: true, lpos: [labX((x0 + lx) / 2 + (left ? 0 : 30), a.label), LBLY], sw: 2.4 })); }
    });
    return out.join("");
  }

  window.OS_ANIMS.kallocrace = {
    title: "Two CPUs pop xv6's free list (kalloc.c)",
    interval: 4200,
    threads: [C0, C1],
    colors: { "CPU 0": "#1f6f8b", "CPU 1": "#b5651d" },
    sceneBox: "0 0 360 336",
    scene: scene,
    code: code,
    codeTitle: "kernel/kalloc.c lines 68 to 78 (W08_demos/xv6_excerpts/kalloc.c_46-78.c)",
    variants: [
      { key: "nolock", label: "Lock gone", steps: race },
      { key: "lock", label: "With the lock", steps: locked }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
