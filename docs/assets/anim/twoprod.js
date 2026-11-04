// Two producers write one slot, W09 class 2, Section 6.1 (OSTEP Figures 31.9 and 31.10, W09_demos/pcsem_race.c).
// The steps are the rows of the page's table: producers A and B, fill and use both at 3, slot 4 holding an old item;
// rows 1, 2 and 5 are split into one step per action. The two lines of put() (F1 and F2, lines 14 and 15 of the file)
// are quoted as the page's prose gives them; lines 27 to 41 are the page's listing.
// The picture follows bbdeadlock.js: the bounded buffer as one structure on top (the semaphores empty and full, the
// ring of MAX = 10 slots with its fill and use pointers), producer A, producer B and the consumer below it, and one
// arrow per step from the thread that acts to the field it touches.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  function mk(rows) { return rows.map(function (x) { return { n: x[0], text: x[1] }; }); }
  var code = mk([
    [14, "buffer[fill] = value"],
    [15, "fill = (fill + 1) % MAX"],
    [null, ""],
    [27, "void *producer(void *arg) {"],
    [28, "    int base = (int)(long)arg * ITEMS;"],
    [29, "    for (int i = 0; i < ITEMS; i++) {"],
    [30, "        sem_wait(&empty);            // Line P1"],
    [31, "        put(base + i);               // Line P2"],
    [32, "        sem_post(&full);             // Line P3"],
    [33, "    }"],
    [34, "    return NULL;"],
    [35, "}"],
    [36, ""],
    [37, "void *consumer(void *arg) {"],
    [38, "    for (int i = 0; i < ITEMS; i++) {"],
    [39, "        sem_wait(&full);             // Line C1"],
    [40, "        int tmp = get();             // Line C2"],
    [41, "        sem_post(&empty);            // Line C3"]
  ]);

  function T(kind, text) { return { kind: kind, text: text }; }
  // state: empty, full, fill, use, s3 / s4 (what slots 3 and 4 hold), lostA (a was overwritten), skip (slot 4 skipped),
  // twice (slot 4 read a second time)
  function st(o) {
    var b = { empty: 10, full: 0, fill: 3, use: 3, s3: null, s4: "old", lostA: false, skip: false, twice: false };
    for (var k in o) b[k] = o[k];
    return b;
  }
  var steps = [{
    label: "Start",
    text: "Two producers, A and B, and a consumer. fill and use are both at 3, and empty is 10. Slot 4 still holds an old item from the last time round the ring, because get() leaves a slot as it was.",
    at: [], actor: null, state: st({}),
    threads: { A: T("idle", "has item a"), B: T("idle", "has item b"), cons: T("idle", "waiting for items") }, acts: []
  }, {
    label: "Step 1, P1",
    text: "A calls sem_wait(&empty) (line 30): 10 → 9. A free slot is there, so A goes on into put().",
    at: [{ who: "A", line: 30 }], actor: "A", state: st({ empty: 9 }),
    threads: { A: T("run", "has a slot"), B: T("idle", "has item b"), cons: T("idle", "waiting for items") },
    acts: [{ from: "A", to: "empty", label: "line 30: sem_wait(&empty)" }]
  }, {
    label: "Step 1, F1",
    text: "A runs the first line of put() (F1): buffer[3] = a. A has not moved fill yet.",
    at: [{ who: "A", line: 14 }, { who: "A", line: 31 }], actor: "A", state: st({ empty: 9, s3: "a" }),
    threads: { A: T("run", "wrote a, fill not moved"), B: T("idle", "has item b"), cons: T("idle", "waiting for items") },
    acts: [{ from: "A", to: 3, label: "F1: buffer[3] = a" }]
  }, {
    label: "Step 2, P1",
    text: "B calls sem_wait(&empty) (line 30): 9 → 8. Nine slots are free, so B passes too.",
    at: [{ who: "A", line: 15 }, { who: "B", line: 30 }], actor: "B", state: st({ empty: 8, s3: "a" }),
    threads: { A: T("ready", "about to move fill"), B: T("run", "has a slot"), cons: T("idle", "waiting for items") },
    acts: [{ from: "B", to: "empty", label: "line 30: sem_wait(&empty)" }]
  }, {
    label: "Step 2, F1",
    text: "B runs F1 with fill still at 3: buffer[3] = b. The a that A wrote is overwritten.",
    at: [{ who: "A", line: 15 }, { who: "B", line: 14 }, { who: "B", line: 31 }], actor: "B", state: st({ empty: 8, s3: "b", lostA: true }),
    threads: { A: T("ready", "about to move fill"), B: T("run", "wrote b, fill not moved"), cons: T("idle", "waiting for items") },
    acts: [{ from: "B", to: 3, label: "F1: buffer[3] = b", kind: "bad" }],
    event: "Item a is gone: overwritten before anyone read it.", eventKind: "bad"
  }, {
    label: "Step 3, F2",
    text: "A runs the second line of put() (F2): fill = 3 + 1, so fill is 4.",
    at: [{ who: "A", line: 15 }, { who: "B", line: 15 }], actor: "A", state: st({ empty: 8, s3: "b", lostA: true, fill: 4 }),
    threads: { A: T("run", "moved fill to 4"), B: T("ready", "about to move fill"), cons: T("idle", "waiting for items") },
    acts: [{ from: "A", to: "fill", label: "F2: fill = 3 + 1" }]
  }, {
    label: "Step 4, F2",
    text: "B runs F2: fill = 4 + 1, so fill is 5. Slot 4 is skipped and never written.",
    at: [{ who: "A", line: 32 }, { who: "B", line: 15 }], actor: "B", state: st({ empty: 8, s3: "b", lostA: true, fill: 5, skip: true }),
    threads: { A: T("ready", "about to post full"), B: T("run", "moved fill to 5"), cons: T("idle", "waiting for items") },
    acts: [{ from: "B", to: "fill", label: "F2: fill = 4 + 1", kind: "bad" }],
    event: "Two slots used up, one slot written.", eventKind: "warn"
  }, {
    label: "Step 5, A",
    text: "A calls sem_post(&full) (line 32): one item promised.",
    at: [{ who: "A", line: 32 }, { who: "B", line: 32 }], actor: "A", state: st({ empty: 8, s3: "b", lostA: true, fill: 5, skip: true, full: 1 }),
    threads: { A: T("run", "posted full"), B: T("ready", "about to post full"), cons: T("idle", "waiting for items") },
    acts: [{ from: "A", to: "full", label: "line 32: sem_post(&full)" }]
  }, {
    label: "Step 5, B",
    text: "B calls sem_post(&full) (line 32) too. Two items are promised, but only one slot holds a new item.",
    at: [{ who: "B", line: 32 }], actor: "B", state: st({ empty: 8, s3: "b", lostA: true, fill: 5, skip: true, full: 2 }),
    threads: { A: T("idle", "on to its next item"), B: T("run", "posted full"), cons: T("idle", "waiting for items") },
    acts: [{ from: "B", to: "full", label: "line 32: sem_post(&full)" }]
  }, {
    label: "Step 6",
    text: "The consumer passes sem_wait(&full) (line 39), and get() (line 40) copies slot 3: b. use moves on to 4.",
    at: [{ who: "cons", line: 39 }, { who: "cons", line: 40 }], actor: "cons", state: st({ empty: 8, s3: "b", lostA: true, fill: 5, skip: true, full: 1, use: 4 }),
    threads: { A: T("idle", "on to its next item"), B: T("idle", "on to its next item"), cons: T("run", "got b") },
    acts: [{ from: 3, to: "cons", label: "line 40: get() copies b" }]
  }, {
    label: "Step 7",
    text: "The consumer passes sem_wait(&full) (line 39) again, and get() copies slot 4: the old item, a second time.",
    at: [{ who: "cons", line: 39 }, { who: "cons", line: 40 }], actor: "cons", state: st({ empty: 8, s3: "b", lostA: true, fill: 5, skip: true, full: 0, use: 5, twice: true }),
    threads: { A: T("idle", "on to its next item"), B: T("idle", "on to its next item"), cons: T("run", "got b, then the old item") },
    acts: [{ from: 4, to: "cons", label: "line 40: get() copies old", kind: "bad" }],
    event: "One write lost (a), one slot read twice (the old item).", eventKind: "bad"
  }, {
    label: "The run",
    text: "The real run, 2 producers and 2 consumers: about 33,000 items never consumed and about 33,000 consumed more than once. Each lost write pairs with a doubled read.",
    at: [], actor: null, state: st({ empty: 8, s3: "b", lostA: true, fill: 5, skip: true, full: 0, use: 5, twice: true }),
    threads: { A: T("idle", "put() not protected"), B: T("idle", "put() not protected"), cons: T("idle", "") },
    acts: [],
    event: "1000000 items: 933038 consumed once, 33487 never, 33475 more than once", eventKind: "bad"
  }];

  // ---------------- the scene ----------------
  var BAD = "#b23a48", YEL = "rgba(232,178,58,.30)", LIGHT = "var(--md-default-fg-color--light)";
  var NAME = { A: "producer A", B: "producer B", cons: "consumer" };
  var START = { empty: "MAX = 10", full: "0" };
  var P = { A: [64, 296], B: [180, 296], cons: [296, 296] }, R = 31;
  var CELL = { empty: [16, 176], full: [184, 344] }, CY = 34, CH = 66, CB = CY + CH;
  var RING = { x: 69, step: 28, w: 26, y: 120, h: 34 }, BOXB = 222, LBLY = 244;
  function sx(i) { return RING.x + i * RING.step; }
  function scx(i) { return sx(i) + RING.w / 2; }
  function wrap(s, n) {
    var rows = [], r = "";
    s.split(" ").forEach(function (w) { if ((r + " " + w).trim().length > n) { rows.push(r.trim()); r = w; } else r += " " + w; });
    if (r.trim()) rows.push(r.trim());
    return rows;
  }
  function labX(x, label) { var h = label.length * 3.15 + 6; return Math.max(4 + h, Math.min(356 - h, x)); }

  function scene(s, H, ctx) {
    var c = ctx.col, S = s.state, pv = ctx.prev ? ctx.prev.state : S, out = [];
    out.push(H.box(6, 6, 348, BOXB - 6, { r: 12, stroke: LIGHT, sw: 1.8 }));
    out.push(H.text(16, 24, "the bounded buffer", { size: 13.5, weight: 700, anchor: "start" }));
    out.push(H.text(344, 24, "two semaphores and the ring", { size: 10.5, anchor: "end", color: LIGHT }));
    // the two semaphores
    ["empty", "full"].forEach(function (n) {
      var x = CELL[n][0], w = CELL[n][1] - x, ch = pv[n] !== S[n];
      out.push(H.box(x, CY, w, CH, { r: 8, fill: ch ? YEL : "var(--md-code-bg-color)", stroke: ch ? "#e8b23a" : "transparent", sw: 1.6, cls: ch ? "anim-new" : "" }));
      out.push(H.text(x + 8, CY + 16, n, { size: 11.5, weight: 700, anchor: "start", mono: true, color: LIGHT }));
      out.push(H.text(x + w - 8, CY + 16, n === "empty" ? "free slots" : "items", { size: 10, anchor: "end", color: LIGHT }));
      out.push(H.text(x + 8, CY + 29, "main starts it at " + START[n], { size: 10, anchor: "start", color: LIGHT }));
      out.push(H.text(x + 10, CY + 58, String(S[n]), { size: 22, weight: 700, anchor: "start", mono: true }));
      if (ch) out.push(H.text(x + 48, CY + 55, "was " + pv[n], { size: 10.5, anchor: "start", color: LIGHT, cls: "anim-new" }));
    });
    // the ring of MAX = 10 slots
    out.push(H.text(16, RING.y + 20, "buffer", { size: 11.5, weight: 700, anchor: "start", mono: true, color: LIGHT }));
    for (var i = 0; i < 10; i++) {
      var v = i === 3 ? S.s3 : i === 4 ? S.s4 : null, pvv = i === 3 ? pv.s3 : i === 4 ? pv.s4 : null;
      var changed = v !== pvv, bad = (i === 3 && S.lostA) || (i === 4 && (S.skip || S.twice));
      out.push(H.text(scx(i), RING.y - 5, String(i), { size: 10, color: LIGHT }));
      out.push(H.box(sx(i), RING.y, RING.w, RING.h, { r: 3, fill: changed ? YEL : v === "old" ? "var(--md-code-bg-color)" : v ? "rgba(31,111,139,.20)" : "var(--md-default-bg-color)", stroke: changed ? "#e8b23a" : bad ? BAD : "var(--md-default-fg-color--lighter)", sw: changed || bad ? 2 : 1, dash: i === 4 && S.skip && !S.twice, cls: changed ? "anim-pop" : "" }));
      if (i === 3 && S.lostA) {
        out.push(H.text(scx(i), RING.y + 12, "a", { size: 10.5, weight: 700, color: BAD, mono: true }));
        out.push('<line x1="' + (scx(i) - 6) + '" y1="' + (RING.y + 8.5) + '" x2="' + (scx(i) + 6) + '" y2="' + (RING.y + 8.5) + '" style="stroke:' + BAD + ';stroke-width:1.6"/>');
        out.push(H.text(scx(i), RING.y + 27, v, { size: 13, weight: 700, mono: true }));
      } else if (v) out.push(H.text(scx(i), RING.y + 21, v, { size: v === "old" ? 10 : 13, weight: 700, mono: true, color: v === "old" ? LIGHT : "var(--md-default-fg-color)" }));
    }
    // fill and use: a mark under the slot each points at, and the value on the left
    [["use", 166], ["fill", 182]].forEach(function (p) {
      var n = p[0], y = p[1], ch = pv[n] !== S[n], x = scx(S[n]), solid = n === "fill";
      var col = solid ? "var(--md-default-fg-color)" : LIGHT, ty = n === "use" ? RING.y + RING.h + 4 : RING.y + RING.h + 15;
      if (ch) out.push(H.box(12, y - 12, 62, 16, { r: 4, fill: YEL, stroke: "#e8b23a", sw: 1.2, cls: "anim-new" }));
      out.push(H.text(16, y, n + " = " + S[n], { size: 10.5, weight: 700, anchor: "start", mono: true, color: col }));
      out.push('<polygon points="' + x + ',' + ty + ' ' + (x - 6) + ',' + (ty + 9) + ' ' + (x + 6) + ',' + (ty + 9) + '" class="' + (ch ? "anim-pop" : "") + '" style="fill:' + (solid ? "var(--md-default-fg-color)" : "var(--md-default-bg-color)") + ';stroke:' + col + ';stroke-width:1.4"/>');
    });
    // what went wrong, kept at a fixed spot under the left end of the ring
    var notes = [];
    if (S.lostA) notes.push("slot 3: a overwritten");
    if (S.twice) notes.push("slot 4: old item read twice");
    else if (S.skip) notes.push("slot 4: skipped");
    var nw = S.lostA !== pv.lostA || S.skip !== pv.skip || S.twice !== pv.twice;
    notes.forEach(function (t, i) { out.push(H.text(16, 201 + i * 13, t, { size: 10.5, weight: 700, anchor: "start", color: BAD, cls: nw && i === notes.length - 1 ? "anim-new" : "" })); });
    // the three threads
    ["A", "B", "cons"].forEach(function (t) {
      var p = P[t], th = s.threads[t], k = th.kind, col = c(t), on = s.actor === t;
      var fill = k === "run" ? "rgba(42,122,107,.12)" : k === "ready" ? "rgba(232,178,58,.20)" : "var(--md-default-bg-color)";
      out.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + R + '" style="fill:' + fill + ';stroke:' + col + ';stroke-width:' + (on ? 3.4 : 1.6) + '"' + (k === "ready" ? ' stroke-dasharray="6 4"' : "") + '/>');
      var nm = NAME[t].split(" ");
      out.push(H.lines(p[0], p[1] + (nm.length > 1 ? -2 : 4), nm, { size: 11, weight: 700, color: col, lh: 13 }));
      if (th.text) out.push(H.lines(p[0], p[1] + R + 15, wrap(th.text, 18), { size: 10.5, lh: 12.5 }));
    });
    // the action of this step. An arrow into the ring leaves the thread sideways and comes up under its slot.
    (s.acts || []).forEach(function (a) {
      var color = a.kind === "bad" ? BAD : c(typeof a.from === "string" ? a.from : a.to);
      if (typeof a.from === "number") {          // get(): from the slot down to the consumer
        var tp = P[a.to], fx0 = scx(a.from), ex = tp[0] - 22, ey = tp[1] - 22;
        out.push(H.arrow(fx0, RING.y + RING.h + 2, ex, ey, { color: color, bend: [fx0 - (fx0 + ex) / 2, ey - (RING.y + RING.h + 2 + ey) / 2], label: a.label, mono: true, lpos: [labX(fx0 + 0.7 * (ex - fx0), a.label), LBLY], sw: 2.4 }));
        return;
      }
      var p = P[a.from], tx, ty, ring = a.to !== "empty" && a.to !== "full";
      if (!ring) { tx = a.to === "empty" ? 120 : 240; ty = CB + 2; }
      else if (a.to === "fill") { tx = scx(S.fill); ty = RING.y + RING.h + 26; }
      else { tx = scx(a.to); ty = RING.y + RING.h + 2; }
      var side = tx > p[0] + 20 ? 1 : tx < p[0] - 20 ? -1 : 0;
      var x0 = p[0] + side * (ring ? 22 : 14), y0 = p[1] - (ring && side ? 22 : R + 2);
      var bend = ring && side ? [tx - (x0 + tx) / 2, y0 - (y0 + ty) / 2] : [0, 0];
      var lx = ring && side ? x0 + 0.7 * (tx - x0) : (x0 + tx) / 2;
      out.push(H.arrow(x0, y0, tx, ty, { color: color, bend: bend, label: a.label, mono: true, lpos: [labX(lx, a.label), LBLY], sw: 2.4 }));
    });
    return out.join("");
  }

  window.OS_ANIMS.twoprod = {
    title: "Two producers, one slot (pcsem_race.c, OSTEP Figures 31.9 and 31.10)",
    interval: 4200,
    threads: ["A", "B", "cons"],
    colors: { A: "#1f6f8b", B: "#2a7a6b", cons: "#b5651d" },
    sceneBox: "0 0 360 376",
    scene: scene,
    code: code,
    codeTitle: "W09_demos/pcsem_race.c: put()'s two lines (14 and 15, F1 and F2) and lines 27 to 41",
    variants: [{ key: "race", label: "Two producers", steps: steps }]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
