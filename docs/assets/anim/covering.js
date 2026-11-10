// The covering condition of OSTEP 30.3, on the W10 Q&A page (w10/qa.md, Q2). The code is OSTEP Figure 30.15, lines 8
// to 24, with the book's line numbers, as the page prints it; the second tab uses the fix the text proposes, line 22
// with Pthread_cond_broadcast(&c), which the page prints as a one-line listing.
// The run is the book's own scenario, as the page's answer traces it: zero bytes free; Ta calls allocate(100), Tb calls
// allocate(10), both sleep on c; Tc calls free(50). Tab 1: the signal wakes Ta (the page: "say it is Ta"), Ta checks
// line 11 again and sleeps, Tb sleeps on. Tab 2: the broadcast wakes both; Ta gets m first (the page: "say Ta gets m
// first"), sleeps again; Tb's loop ends, it takes 10 bytes and bytesLeft is 40.
// The picture: the allocator's shared state on top (the lock m, bytesLeft, the condition variable c with its sleepers);
// Ta, Tb and Tc below; each step's action is an arrow from the acting thread to the field it touches, labeled with the
// code line, and a wake-up is a dashed arrow from c to the thread it wakes.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  function mk(rows) { return rows.map(function (x) { return { n: x[0], text: x[1] }; }); }
  var codeSig = mk([
    [8, "void *"],
    [9, "allocate(int size) {"],
    [10, "    Pthread_mutex_lock(&m);"],
    [11, "    while (bytesLeft < size)"],
    [12, "        Pthread_cond_wait(&c, &m);"],
    [13, "    void *ptr = ...; // get mem from heap"],
    [14, "    bytesLeft -= size;"],
    [15, "    Pthread_mutex_unlock(&m);"],
    [16, "    return ptr;"],
    [17, "}"],
    [18, ""],
    [19, "void free(void *ptr, int size) {"],
    [20, "    Pthread_mutex_lock(&m);"],
    [21, "    bytesLeft += size;"],
    [22, "    Pthread_cond_signal(&c); // whom to signal??"],
    [23, "    Pthread_mutex_unlock(&m);"],
    [24, "}"]
  ]);
  var codeBc = codeSig.map(function (c) {
    return c.n === 22 ? { n: 22, text: "    Pthread_cond_broadcast(&c);" } : c;
  });

  function T(kind, text) { return { kind: kind, text: text }; }
  function st(m, bytes, q) { return { m: m, bytes: bytes, q: q }; }

  // ---------------- the steps both tabs share: Ta and Tb go to sleep, Tc frees 50 ----------------
  var common = [{
    label: "Start",
    text: "Zero bytes are free: bytesLeft is 0. Ta will call allocate(100), Tb allocate(10), and Tc free(50). They share the lock m and the condition variable c.",
    at: [], actor: null, state: st(null, 0, []),
    threads: { Ta: T("idle", "about to run"), Tb: T("idle", "about to run"), Tc: T("idle", "about to run") }, acts: []
  }, {
    label: "Step 1",
    text: "Ta calls allocate(100) and locks m (line 10). bytesLeft is 0, which is less than 100 (line 11), so Ta must wait.",
    at: [{ who: "Ta", line: 11 }], actor: "Ta", state: st("Ta", 0, []),
    threads: { Ta: T("run", "holds m, must wait"), Tb: T("idle", "about to run"), Tc: T("idle", "about to run") },
    acts: [{ from: "Ta", to: "bytes", label: "line 11: 0 < 100" }]
  }, {
    label: "Step 2",
    text: "Ta calls wait() (line 12). The wait releases m, and Ta sleeps on c.",
    at: [{ who: "Ta", line: 12 }], actor: "Ta", state: st(null, 0, ["Ta"]),
    threads: { Ta: T("sleep", "asleep on c"), Tb: T("idle", "about to run"), Tc: T("idle", "about to run") },
    acts: [{ from: "Ta", to: "c", label: "line 12: wait" }]
  }, {
    label: "Step 3",
    text: "Tb calls allocate(10) and locks m (line 10). 0 is less than 10 (line 11), so Tb must wait too.",
    at: [{ who: "Ta", line: 12 }, { who: "Tb", line: 11 }], actor: "Tb", state: st("Tb", 0, ["Ta"]),
    threads: { Ta: T("sleep", "asleep on c"), Tb: T("run", "holds m, must wait"), Tc: T("idle", "about to run") },
    acts: [{ from: "Tb", to: "bytes", label: "line 11: 0 < 10" }]
  }, {
    label: "Step 4",
    text: "Tb calls wait() (line 12) and sleeps on c. Both requests are waiting: there aren't enough free bytes for either.",
    at: [{ who: "Ta", line: 12 }, { who: "Tb", line: 12 }], actor: "Tb", state: st(null, 0, ["Ta", "Tb"]),
    threads: { Ta: T("sleep", "asleep on c"), Tb: T("sleep", "asleep on c"), Tc: T("idle", "about to run") },
    acts: [{ from: "Tb", to: "c", label: "line 12: wait" }]
  }, {
    label: "Step 5",
    text: "Tc calls free(50). It locks m (line 20) and adds 50 (line 21): bytesLeft is 50. Tb could now go on; Ta could not.",
    at: [{ who: "Ta", line: 12 }, { who: "Tb", line: 12 }, { who: "Tc", line: 21 }], actor: "Tc", state: st("Tc", 50, ["Ta", "Tb"]),
    threads: { Ta: T("sleep", "asleep on c"), Tb: T("sleep", "asleep on c"), Tc: T("run", "holds m") },
    acts: [{ from: "Tc", to: "bytes", label: "line 21: += 50" }]
  }];

  // ---------------- Tab 1: signal ----------------
  var A = common.concat([{
    label: "Step 6",
    text: "Tc signals c (line 22). A signal wakes one sleeper, and nothing makes it the right one. Say it wakes Ta, which moves to ready.",
    at: [{ who: "Ta", line: 12 }, { who: "Tb", line: 12 }, { who: "Tc", line: 22 }], actor: "Tc", state: st("Tc", 50, ["Tb"]),
    threads: { Ta: T("ready", "woken, needs m back"), Tb: T("sleep", "asleep on c"), Tc: T("run", "holds m") },
    acts: [{ from: "Tc", to: "c", label: "line 22: signal" }, { wake: "Ta", label: "wakes Ta" }],
    event: "free() does not know which thread to wake.", eventKind: "warn"
  }, {
    label: "Step 7",
    text: "Tc unlocks m (line 23) and returns.",
    at: [{ who: "Ta", line: 12 }, { who: "Tb", line: 12 }, { who: "Tc", line: 23 }], actor: "Tc", state: st(null, 50, ["Tb"]),
    threads: { Ta: T("ready", "woken, needs m back"), Tb: T("sleep", "asleep on c"), Tc: T("idle", "done") },
    acts: [{ from: "Tc", to: "m", label: "line 23: unlock" }]
  }, {
    label: "Step 8",
    text: "Ta takes m back inside wait() and checks line 11 again: 50 is less than 100, so its loop goes round.",
    at: [{ who: "Ta", line: 11 }, { who: "Tb", line: 12 }], actor: "Ta", state: st("Ta", 50, ["Tb"]),
    threads: { Ta: T("run", "holds m, must wait"), Tb: T("sleep", "asleep on c"), Tc: T("idle", "done") },
    acts: [{ from: "Ta", to: "bytes", label: "line 11: 50 < 100" }]
  }, {
    label: "Step 9",
    text: "Ta waits again (line 12) and sleeps. Both sleep with 50 bytes free. Tb could go on, but only free() signals c, so Tb sleeps until some later free().",
    at: [{ who: "Ta", line: 12 }, { who: "Tb", line: 12 }], actor: "Ta", state: st(null, 50, ["Tb", "Ta"]),
    threads: { Ta: T("sleep", "asleep on c"), Tb: T("dead", "asleep, though it could go on"), Tc: T("idle", "done") },
    acts: [{ from: "Ta", to: "c", label: "line 12: wait", kind: "bad" }],
    event: "50 bytes free, and the thread that could use them sleeps.", eventKind: "bad"
  }]);

  // ---------------- Tab 2: broadcast ----------------
  var B = common.concat([{
    label: "Step 6",
    text: "Tc broadcasts on c (line 22). Every sleeper wakes: Ta and Tb both move to ready.",
    at: [{ who: "Ta", line: 12 }, { who: "Tb", line: 12 }, { who: "Tc", line: 22 }], actor: "Tc", state: st("Tc", 50, []),
    threads: { Ta: T("ready", "woken, needs m back"), Tb: T("ready", "woken, needs m back"), Tc: T("run", "holds m") },
    acts: [{ from: "Tc", to: "c", label: "line 22: broadcast" }, { wake: "Ta", label: "wakes Ta" }, { wake: "Tb", label: "wakes Tb" }]
  }, {
    label: "Step 7",
    text: "Tc unlocks m (line 23) and returns.",
    at: [{ who: "Ta", line: 12 }, { who: "Tb", line: 12 }, { who: "Tc", line: 23 }], actor: "Tc", state: st(null, 50, []),
    threads: { Ta: T("ready", "woken, needs m back"), Tb: T("ready", "woken, needs m back"), Tc: T("idle", "done") },
    acts: [{ from: "Tc", to: "m", label: "line 23: unlock" }]
  }, {
    label: "Step 8",
    text: "Say Ta gets m first, inside wait(). Line 11: 50 is less than 100, so its loop goes round.",
    at: [{ who: "Ta", line: 11 }, { who: "Tb", line: 12 }], actor: "Ta", state: st("Ta", 50, []),
    threads: { Ta: T("run", "holds m, must wait"), Tb: T("ready", "woken, needs m back"), Tc: T("idle", "done") },
    acts: [{ from: "Ta", to: "bytes", label: "line 11: 50 < 100" }]
  }, {
    label: "Step 9",
    text: "Ta waits again (line 12): the wait releases m, and Ta sleeps on c.",
    at: [{ who: "Ta", line: 12 }, { who: "Tb", line: 12 }], actor: "Ta", state: st(null, 50, ["Ta"]),
    threads: { Ta: T("sleep", "asleep on c"), Tb: T("ready", "woken, needs m back"), Tc: T("idle", "done") },
    acts: [{ from: "Ta", to: "c", label: "line 12: wait" }]
  }, {
    label: "Step 10",
    text: "Tb gets m back inside wait(). Line 11: 50 is not less than 10, so its loop ends.",
    at: [{ who: "Ta", line: 12 }, { who: "Tb", line: 11 }], actor: "Tb", state: st("Tb", 50, ["Ta"]),
    threads: { Ta: T("sleep", "asleep on c"), Tb: T("run", "holds m, can go on"), Tc: T("idle", "done") },
    acts: [{ from: "Tb", to: "bytes", label: "line 11: 50 < 10 is false", kind: "ok" }]
  }, {
    label: "Step 11",
    text: "Tb takes its memory (line 13) and subtracts 10 (line 14): bytesLeft is 40.",
    at: [{ who: "Ta", line: 12 }, { who: "Tb", line: 14 }], actor: "Tb", state: st("Tb", 40, ["Ta"]),
    threads: { Ta: T("sleep", "asleep on c"), Tb: T("run", "holds m, has 10 bytes"), Tc: T("idle", "done") },
    acts: [{ from: "Tb", to: "bytes", label: "line 14: -= 10" }]
  }, {
    label: "Step 12",
    text: "Tb unlocks m (line 15) and returns ptr (line 16). Ta woke for nothing and sleeps again, which is the price of broadcast.",
    at: [{ who: "Ta", line: 12 }, { who: "Tb", line: 15 }], actor: "Tb", state: st(null, 40, ["Ta"]),
    threads: { Ta: T("sleep", "asleep on c"), Tb: T("idle", "done, has 10 bytes"), Tc: T("idle", "done") },
    acts: [{ from: "Tb", to: "m", label: "line 15: unlock" }],
    event: "Tb has its 10 bytes. Ta checked again and went back to sleep.", eventKind: "good"
  }]);

  // ---------------- the scene ----------------
  var KIND = { ok: "#2a7a6b", bad: "#b23a48" };
  var LIGHT = "var(--md-default-fg-color--light)";
  var REQ = { Ta: "allocate(100)", Tb: "allocate(10)", Tc: "free(50)" };
  var P = { Ta: [62, 262], Tb: [180, 262], Tc: [298, 262] }, R = 28;
  var CELL = { m: [16, 108], bytes: [114, 222], c: [228, 344] }, CY = 38, CH = 104, CB = CY + CH;
  function wrap(s, n) {
    var rows = [], r = "";
    s.split(" ").forEach(function (w) { if ((r + " " + w).trim().length > n) { rows.push(r.trim()); r = w; } else r += " " + w; });
    if (r.trim()) rows.push(r.trim());
    return rows;
  }
  function labX(x, label) { var h = label.length * 3.15 + 6; return Math.max(4 + h, Math.min(356 - h, x)); }

  function scene(s, H, ctx) {
    var c = ctx.col, S = s.state, pv = ctx.prev ? ctx.prev.state : S, out = [];
    out.push(H.box(6, 6, 348, CB + 8, { r: 12, stroke: LIGHT, sw: 1.8 }));
    out.push(H.text(16, 27, "the allocator", { size: 13.5, weight: 700, anchor: "start" }));
    out.push(H.text(344, 27, "shared by all three threads", { size: 10.5, anchor: "end", color: LIGHT }));
    // the lock m
    var x = CELL.m[0], w = CELL.m[1] - x, ch = pv.m !== S.m;
    out.push(H.box(x, CY, w, CH, { r: 8, fill: ch ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: ch ? "#e8b23a" : "transparent", sw: 1.6, cls: ch ? "anim-new" : "" }));
    out.push(H.text(x + 8, CY + 17, "m", { size: 12, weight: 700, anchor: "start", mono: true, color: LIGHT }));
    out.push(H.text(x + 8, CY + 31, "the lock", { size: 10, anchor: "start", color: LIGHT }));
    out.push(H.text(x + 8, CY + 60, "held by", { size: 10, anchor: "start", color: LIGHT }));
    if (S.m) out.push(H.chip(x + w / 2, CY + 80, S.m, c(S.m), { cls: ch ? "anim-pop" : "" }));
    else out.push(H.text(x + w / 2, CY + 84, "nobody", { size: 10.5, italic: true, color: LIGHT }));
    // bytesLeft
    x = CELL.bytes[0]; w = CELL.bytes[1] - x; ch = pv.bytes !== S.bytes;
    out.push(H.box(x, CY, w, CH, { r: 8, fill: ch ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: ch ? "#e8b23a" : "transparent", sw: 1.6, cls: ch ? "anim-new" : "" }));
    out.push(H.text(x + 8, CY + 17, "bytesLeft", { size: 12, weight: 700, anchor: "start", mono: true, color: LIGHT }));
    out.push(H.text(x + 8, CY + 31, "bytes free", { size: 10, anchor: "start", color: LIGHT }));
    out.push(H.text(x + w / 2, CY + 72, String(S.bytes), { size: 28, weight: 700, mono: true }));
    if (ch) out.push(H.text(x + w / 2, CY + 94, "was " + pv.bytes, { size: 10.5, color: LIGHT, cls: "anim-new" }));
    // the condition variable c and its sleepers
    x = CELL.c[0]; w = CELL.c[1] - x; ch = JSON.stringify(pv.q) !== JSON.stringify(S.q);
    out.push(H.box(x, CY, w, CH, { r: 8, fill: ch ? "rgba(232,178,58,.30)" : "var(--md-code-bg-color)", stroke: ch ? "#e8b23a" : "transparent", sw: 1.6, cls: ch ? "anim-new" : "" }));
    out.push(H.text(x + 8, CY + 17, "c", { size: 12, weight: 700, anchor: "start", mono: true, color: LIGHT }));
    out.push(H.text(x + 8, CY + 31, "the condition variable", { size: 10, anchor: "start", color: LIGHT }));
    out.push(H.text(x + 8, CY + 60, "asleep on it", { size: 10, anchor: "start", color: LIGHT }));
    if (S.q.length) S.q.forEach(function (t, i) {
      out.push(H.chip(x + 30 + i * 48, CY + 80, t, c(t), { cls: pv.q.indexOf(t) < 0 ? "anim-pop" : "" }));
    });
    else out.push(H.text(x + w / 2, CY + 84, "nobody", { size: 10.5, italic: true, color: LIGHT }));
    // the threads
    ["Ta", "Tb", "Tc"].forEach(function (t) {
      var p = P[t], th = s.threads[t], k = th.kind, col = c(t), on = s.actor === t;
      var fill = k === "run" ? "rgba(42,122,107,.12)" : k === "sleep" ? "rgba(120,120,140,.16)" : k === "dead" ? "rgba(178,58,72,.18)" : k === "ready" ? "rgba(232,178,58,.20)" : "var(--md-default-bg-color)";
      out.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + R + '" style="fill:' + fill + ';stroke:' + col + ';stroke-width:' + (on ? 3.4 : 1.6) + '"' + (k === "ready" ? ' stroke-dasharray="6 4"' : "") + '/>');
      out.push(H.text(p[0], p[1] + 5, t, { size: 13, weight: 700, color: col }));
      if (k === "sleep" || k === "dead") out.push(H.text(p[0] + R - 2, p[1] - R + 4, "z z", { size: 11.5, weight: 700, italic: true, color: k === "dead" ? "#b23a48" : LIGHT, anchor: "start" }));
      out.push(H.text(p[0], p[1] + R + 15, REQ[t], { size: 10.5, mono: true, weight: 600 }));
      out.push(H.lines(p[0], p[1] + R + 30, wrap(th.text, 17), { size: 10.5, lh: 12.5, color: LIGHT }));
    });
    // the action of this step
    var acts = s.acts || [], wakes = acts.filter(function (a) { return a.wake; });
    var WY = { Ta: 202, Tb: 222 };
    acts.forEach(function (a) {
      var color = KIND[a.kind] || c(a.from || s.actor);
      if (a.wake) {
        var tp = P[a.wake], qx = CELL.c[0] + (a.wake === "Ta" ? 14 : 30), y0 = CB + 2, y1 = tp[1] - R - 2, x1 = tp[0] + 12;
        var ly = wakes.length > 1 ? WY[a.wake] : 214, lx = qx + (x1 - qx) * (ly - y0) / (y1 - y0);
        out.push(H.arrow(qx, y0, x1, y1, { color: c("Tc"), dash: true, sw: 2.2, label: a.label, lpos: [labX(lx, a.label), ly] }));
        return;
      }
      var p = P[a.from], fx = (CELL[a.to][0] + CELL[a.to][1]) / 2;
      if (a.to === "c" && wakes.length) fx = CELL.c[1] - 22;
      var sx = p[0] + (fx > p[0] + 20 ? 14 : fx < p[0] - 20 ? -14 : 0);
      var lx = (sx + fx) / 2, ly = wakes.length ? 170 : 196;
      out.push(H.arrow(sx, p[1] - R - 2, fx, CB + 2, { color: color, label: a.label, mono: true, lpos: [labX(lx, a.label), ly], sw: 2.4 }));
    });
    return out.join("");
  }

  window.OS_ANIMS.covering = {
    title: "A covering condition: the allocator of OSTEP Figure 30.15",
    interval: 4200,
    threads: ["Ta", "Tb", "Tc"],
    colors: { Ta: "#1f6f8b", Tb: "#b5651d", Tc: "#6b4fa0" },
    sceneBox: "0 0 360 352",
    scene: scene,
    code: codeSig,
    variants: [
      { key: "signal", label: "signal (line 22 as printed)", steps: A, code: codeSig, codeTitle: "OSTEP Figure 30.15, lines 8 to 24" },
      { key: "broadcast", label: "broadcast (the fix)", steps: B, code: codeBc, codeTitle: "OSTEP Figure 30.15 with line 22 changed to broadcast" }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
