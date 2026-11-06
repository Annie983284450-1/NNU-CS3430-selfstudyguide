// The dining philosophers of OSTEP 31.6, on the W10 Q&A page (w10/qa.md, Q3). The table is OSTEP Figure 31.14:
// philosopher p sits between fork p (left(p) = p) and fork p + 1 (right(p) = (p + 1) % 5), so fork 0 lies between
// P4 and P0. Tab 1 is Figure 31.15 (left fork first, lines 2 and 3) and the book's own run: P0 to P4 each take fork p,
// then each waits for its right fork, which the next philosopher holds. Tab 2 is Figure 31.16 (P4 takes right then
// left, lines 3 and 4; the others lines 6 and 7) with the same timing, as the page's answer traces it: P4 asks for fork
// 0 first and waits holding nothing, P3 takes fork 4 and eats, and put_forks() (Figure 31.15, lines 6 to 9, unchanged;
// shown without numbers because its numbers clash with Figure 31.16's) hands the forks on: 3 to P2, 2 to P1, 1 to P0,
// 0 to P4, which then takes fork 4 and eats.
// The picture: the round table, forks inside, philosophers around it; a solid line is a fork held, a dashed red arrow
// a fork waited for; each step's action is an arrow from the philosopher to the fork it touches, labeled with the code
// line in the middle of the table.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  function mk(rows) { return rows.map(function (x) { return { n: x[0], text: x[1] }; }); }
  var codeBroken = mk([
    [1, "void get_forks(int p) {"],
    [2, "    sem_wait(&forks[left(p)]);"],
    [3, "    sem_wait(&forks[right(p)]);"],
    [4, "}"],
    [5, ""],
    [6, "void put_forks(int p) {"],
    [7, "    sem_post(&forks[left(p)]);"],
    [8, "    sem_post(&forks[right(p)]);"],
    [9, "}"]
  ]);
  var codeFixed = mk([
    [1, "void get_forks(int p) {"],
    [2, "    if (p == 4) {"],
    [3, "        sem_wait(&forks[right(p)]);"],
    [4, "        sem_wait(&forks[left(p)]);"],
    [5, "    } else {"],
    [6, "        sem_wait(&forks[left(p)]);"],
    [7, "        sem_wait(&forks[right(p)]);"],
    [8, "    }"],
    [9, "}"],
    [null, ""],
    [null, "// put_forks(), Figure 31.15 lines 6 to 9, unchanged:"],
    [null, "void put_forks(int p) {"],
    [null, "    sem_post(&forks[left(p)]);"],
    [null, "    sem_post(&forks[right(p)]);"],
    [null, "}"]
  ]);

  var PS = ["P0", "P1", "P2", "P3", "P4"];
  // a state: holds = {fork: philosopher}, waits = {philosopher: fork}, eat = [philosophers eating]
  function st(holds, waits, eat) { return { holds: holds, waits: waits || {}, eat: eat || [] }; }
  function T(kind, text) { return { kind: kind, text: text }; }
  function ths(o) { var r = {}; PS.forEach(function (p, i) { r[p] = o[i] || T("idle", "thinking"); }); return r; }
  // only the philosopher acting at this step gets a marker on its code line (five would not fit the marker column)
  function at(o) { return Object.keys(o).map(function (p) { return { who: p, line: o[p] }; }); }
  function onlyActor(steps) { steps.forEach(function (x) { x.at = x.at.filter(function (m) { return m.who === x.actor; }); }); return steps; }

  // ---------------- Tab 1: everyone takes the left fork first (Figure 31.15) ----------------
  var A = [{
    label: "Start",
    text: "Five philosophers, P0 to P4, and five forks, each a semaphore started at 1. Philosopher p sits between fork p, its left fork, and fork p + 1, its right; fork 0 lies between P4 and P0.",
    at: [], state: st({}), threads: ths([]), acts: []
  }];
  var holds = {}, lines = {};
  for (var p = 0; p < 5; p++) {
    holds = Object.assign({}, holds); holds[p] = p; lines = Object.assign({}, lines); lines["P" + p] = 2;
    var th = []; for (var q = 0; q <= p; q++) th[q] = T("run", "holds f" + q);
    A.push({
      label: "Step " + (p + 1),
      text: p < 4 ? "P" + p + " calls get_forks(" + p + ") and takes its left fork, fork " + p + " (line 2)."
                  : "P4 takes its left fork, fork 4 (line 2). All five forks are taken, one each.",
      at: at(lines), actor: "P" + p, state: st(holds), threads: ths(th),
      acts: [{ from: p, fork: p, label: "line 2: take f" + p }],
      event: p === 4 ? "All the forks are acquired." : null, eventKind: "warn"
    });
  }
  var waits = {};
  for (p = 0; p < 5; p++) {
    var f = (p + 1) % 5;
    waits = Object.assign({}, waits); waits[p] = f; lines = Object.assign({}, lines); lines["P" + p] = 3;
    th = []; for (q = 0; q < 5; q++) th[q] = q <= p ? T("sleep", "holds f" + q + ", waits for f" + ((q + 1) % 5)) : T("run", "holds f" + q);
    A.push({
      label: "Step " + (p + 6),
      text: p < 4 ? "P" + p + " asks for its right fork, fork " + f + " (line 3). P" + f + " holds it, so P" + p + " waits."
                  : "P4 asks for its right fork: right(4) is (4 + 1) % 5 = 0, fork 0 (line 3). P0 holds it, so P4 waits.",
      at: at(lines), actor: "P" + p, state: st(holds, waits), threads: ths(th),
      acts: [{ from: p, fork: f, label: "line 3: wait f" + f, kind: "bad" }]
    });
  }
  th = []; for (q = 0; q < 5; q++) th[q] = T("dead", "holds f" + q + ", waits for f" + ((q + 1) % 5));
  A.push({
    label: "The ring",
    text: "Each philosopher holds one fork and waits for the fork the next one holds, from P0 round to P4 and back to P0. Nobody can eat, so nobody puts a fork down.",
    at: at(lines), actor: null, state: st(holds, waits), threads: ths(th), acts: [], ring: true,
    event: "Deadlock: each is stuck holding one fork and waiting for another, forever.", eventKind: "bad"
  });

  // ---------------- Tab 2: philosopher 4 reversed (Figure 31.16) ----------------
  var B = [{
    label: "Start",
    text: "The same table and the same timing. This time P4 runs lines 2 to 4 of get_forks(): its right fork, fork 0, first. The others run lines 6 and 7: left, then right.",
    at: [], state: st({}), threads: ths([]), acts: []
  }];
  holds = {}; lines = {};
  for (p = 0; p < 4; p++) {
    holds = Object.assign({}, holds); holds[p] = p; lines = Object.assign({}, lines); lines["P" + p] = 6;
    th = []; for (q = 0; q <= p; q++) th[q] = T("run", "holds f" + q);
    B.push({
      label: "Step " + (p + 1),
      text: "P" + p + " calls get_forks(" + p + ") and takes its left fork, fork " + p + " (line 6).",
      at: at(lines), actor: "P" + p, state: st(holds), threads: ths(th),
      acts: [{ from: p, fork: p, label: "line 6: take f" + p }]
    });
  }
  function base() { return [T("run", "holds f0"), T("run", "holds f1"), T("run", "holds f2"), T("run", "holds f3"), T("sleep", "holds nothing, waits for f0")]; }
  lines = Object.assign({}, lines, { P4: 3 }); waits = { 4: 0 };
  B.push({
    label: "Step 5",
    text: "P4 calls get_forks(4). p is 4 (line 2), so it asks for its right fork first, fork 0 (line 3). P0 holds it, so P4 waits, holding nothing.",
    at: at(lines), actor: "P4", state: st(holds, waits), threads: ths(base()),
    acts: [{ from: 4, fork: 0, label: "line 3: wait f0", kind: "bad" }],
    event: "P0 and P4 both reach first for fork 0.", eventKind: "info"
  });
  for (p = 0; p < 3; p++) {
    f = p + 1;
    waits = Object.assign({}, waits); waits[p] = f; lines = Object.assign({}, lines); lines["P" + p] = 7;
    th = base(); for (q = 0; q <= p; q++) th[q] = T("sleep", "holds f" + q + ", waits for f" + (q + 1));
    B.push({
      label: "Step " + (p + 6),
      text: "P" + p + " asks for its right fork, fork " + f + " (line 7). P" + f + " holds it, so P" + p + " waits.",
      at: at(lines), actor: "P" + p, state: st(holds, waits), threads: ths(th),
      acts: [{ from: p, fork: f, label: "line 7: wait f" + f, kind: "bad" }]
    });
  }
  var W3 = [T("sleep", "holds f0, waits for f1"), T("sleep", "holds f1, waits for f2"), T("sleep", "holds f2, waits for f3")];
  holds = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 3 }; lines = Object.assign({}, lines, { P3: 7 });
  B.push({
    label: "Step 9",
    text: "P3 asks for its right fork, fork 4 (line 7). Nobody holds it, because P4 never took it. P3 takes it: it has forks 3 and 4, and eats.",
    at: at(lines), actor: "P3", state: st(holds, waits, [3]), threads: ths(W3.concat([T("eat", "holds f3 and f4, eats"), base()[4]])),
    acts: [{ from: 3, fork: 4, label: "line 7: take f4", kind: "ok" }],
    event: "Every fork is held, and P3 eats.", eventKind: "good"
  });
  holds = { 0: 0, 1: 1, 2: 2, 3: 2 }; waits = { 0: 1, 1: 2, 4: 0 }; delete lines.P3;
  B.push({
    label: "Step 10",
    text: "P3 puts its forks down with put_forks(): it posts fork 3, then fork 4. Fork 3 goes to P2, which was waiting for it, and P2 eats. Nobody is waiting for fork 4.",
    at: at(lines), actor: "P3", state: st(holds, waits, [2]),
    threads: ths([W3[0], W3[1], T("eat", "holds f2 and f3, eats"), T("idle", "ate, thinking"), base()[4]]),
    acts: [{ from: 3, fork: 3, label: "put_forks(3)", kind: "ok", give: 2 }]
  });
  holds = { 0: 0, 1: 1, 2: 1 }; waits = { 0: 1, 4: 0 }; delete lines.P2;
  B.push({
    label: "Step 11",
    text: "P2 puts its forks down. Fork 2 goes to P1, which was waiting for it, and P1 eats. Fork 3 is free.",
    at: at(lines), actor: "P2", state: st(holds, waits, [1]),
    threads: ths([W3[0], T("eat", "holds f1 and f2, eats"), T("idle", "ate, thinking"), T("idle", "ate, thinking"), base()[4]]),
    acts: [{ from: 2, fork: 2, label: "put_forks(2)", kind: "ok", give: 1 }]
  });
  holds = { 0: 0, 1: 0 }; waits = { 4: 0 }; delete lines.P1;
  B.push({
    label: "Step 12",
    text: "P1 puts its forks down. Fork 1 goes to P0, which was waiting for it, and P0 eats.",
    at: at(lines), actor: "P1", state: st(holds, waits, [0]),
    threads: ths([T("eat", "holds f0 and f1, eats"), T("idle", "ate, thinking"), T("idle", "ate, thinking"), T("idle", "ate, thinking"), base()[4]]),
    acts: [{ from: 1, fork: 1, label: "put_forks(1)", kind: "ok", give: 0 }]
  });
  holds = { 0: 4 }; waits = {}; delete lines.P0; lines.P4 = 3;
  B.push({
    label: "Step 13",
    text: "P0 puts its forks down. Fork 0 goes to P4, which was waiting for it at line 3: P4 now has its first fork.",
    at: at(lines), actor: "P0", state: st(holds, waits),
    threads: ths([T("idle", "ate, thinking"), T("idle", "ate, thinking"), T("idle", "ate, thinking"), T("idle", "ate, thinking"), T("run", "holds f0")]),
    acts: [{ from: 0, fork: 0, label: "put_forks(0)", kind: "ok", give: 4 }]
  });
  holds = { 0: 4, 4: 4 }; lines.P4 = 4;
  B.push({
    label: "Step 14",
    text: "P4 asks for its left fork, fork 4 (line 4). It is free, so P4 takes it and eats. The chain of waits ended at fork 4, which nobody held, and unwound one philosopher at a time.",
    at: at(lines), actor: "P4", state: st(holds, waits, [4]),
    threads: ths([T("idle", "ate, thinking"), T("idle", "ate, thinking"), T("idle", "ate, thinking"), T("idle", "ate, thinking"), T("eat", "holds f0 and f4, eats")]),
    acts: [{ from: 4, fork: 4, label: "line 4: take f4", kind: "ok" }],
    event: "No deadlock: every philosopher got both forks and ate.", eventKind: "good"
  });

  // ---------------- the scene ----------------
  var KIND = { ok: "#2a7a6b", bad: "#b23a48" };
  var LIGHT = "var(--md-default-fg-color--light)";
  var CX = 180, CY = 184, RP = 124, RF = 68, PR = 21;
  function pos(rad, deg) { var a = deg * Math.PI / 180; return [CX + rad * Math.cos(a), CY - rad * Math.sin(a)]; }
  var PP = [0, 1, 2, 3, 4].map(function (p) { return pos(RP, 72 * p); });
  var FP = [0, 1, 2, 3, 4].map(function (f) { return pos(RF, 72 * f - 36); });
  // where each philosopher's status text goes: below for P0, P3, P4; above for P1, P2
  var LAB = [[0, 1], [0, -1], [0, -1], [0, 1], [0, 1]];
  function wrap(s, n) {
    var rows = [], r = "";
    s.split(" ").forEach(function (w) { if ((r + " " + w).trim().length > n) { rows.push(r.trim()); r = w; } else r += " " + w; });
    if (r.trim()) rows.push(r.trim());
    return rows;
  }
  function edge(a, b, ra, rb) {   // the segment from point a to point b, cut short by ra at a and rb at b
    var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy);
    return [a[0] + dx / d * ra, a[1] + dy / d * ra, b[0] - dx / d * rb, b[1] - dy / d * rb];
  }
  function rgba(hex, al) { var n = parseInt(hex.slice(1), 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + al + ")"; }

  function scene(s, H, ctx) {
    var c = ctx.col, S = s.state, pv = ctx.prev ? ctx.prev.state : { holds: {}, waits: {}, eat: [] }, out = [];
    out.push('<circle cx="' + CX + '" cy="' + CY + '" r="92" style="fill:var(--md-code-bg-color);stroke:var(--md-default-fg-color--lightest);stroke-width:1.4"/>');
    // forks held: solid lines from the holder
    Object.keys(S.holds).forEach(function (f) {
      var p = S.holds[f], e = edge(PP[p], FP[f], PR, 14), isnew = pv.holds[f] !== p;
      out.push('<line x1="' + e[0] + '" y1="' + e[1] + '" x2="' + e[2] + '" y2="' + e[3] + '" class="' + (isnew ? "anim-new" : "") + '" style="stroke:' + c(PS[p]) + ';stroke-width:3.4;stroke-linecap:round"/>');
    });
    // forks waited for: dashed red arrows (the step's own arrow is drawn below, with its label)
    var actFork = (s.acts || []).map(function (a) { return a.from + ":" + a.fork; });
    Object.keys(S.waits).forEach(function (p) {
      var f = S.waits[p]; if (actFork.indexOf(p + ":" + f) >= 0) return;
      var e = edge(PP[p], FP[f], PR + 2, 15);
      out.push(H.arrow(e[0], e[1], e[2], e[3], { color: "#b23a48", dash: true, sw: s.ring ? 2.8 : 1.8 }));
    });
    // the forks
    FP.forEach(function (q, f) {
      var h = S.holds[f], ch = pv.holds[f] !== h;
      var fill = h === undefined ? "var(--md-default-bg-color)" : rgba(c(PS[h]).length === 7 ? c(PS[h]) : "#555555", 0.22);
      out.push(H.box(q[0] - 16, q[1] - 12, 32, 24, { r: 5, fill: fill, stroke: ch ? "#e8b23a" : (h === undefined ? "var(--md-default-fg-color--lighter)" : c(PS[h])), sw: ch ? 2.4 : 1.4, dash: h === undefined, cls: ch ? "anim-pop" : "" }));
      out.push(H.text(q[0], q[1] + 4.5, "f" + f, { size: 12, weight: 700, mono: true }));
    });
    // the philosophers
    PS.forEach(function (name, p) {
      var q = PP[p], th = s.threads[name], k = th.kind, col = c(name), on = s.actor === name;
      var fill = k === "eat" ? "rgba(42,122,107,.22)" : k === "run" ? "rgba(42,122,107,.08)" : k === "sleep" ? "rgba(120,120,140,.16)" : k === "dead" ? "rgba(178,58,72,.18)" : "var(--md-default-bg-color)";
      out.push('<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + PR + '" style="fill:' + fill + ';stroke:' + col + ';stroke-width:' + (on ? 3.4 : 1.6) + '"/>');
      out.push(H.text(q[0], q[1] + 4.5, name, { size: 12.5, weight: 700, color: col }));
      var rows = wrap(th.text, 15), dir = LAB[p][1];
      var y0 = dir > 0 ? q[1] + PR + 13 : q[1] - PR - 6 - (rows.length - 1) * 12;
      out.push(H.lines(q[0], y0, rows, { size: 10.5, lh: 12, color: k === "eat" ? "#2a7a6b" : k === "dead" ? "#b23a48" : LIGHT, weight: k === "eat" ? 700 : 400 }));
    });
    // the action of this step: an arrow from the philosopher to the fork, its label in the middle of the table
    (s.acts || []).forEach(function (a) {
      var color = KIND[a.kind] || c(PS[a.from]), e = edge(PP[a.from], FP[a.fork], PR + 2, 15);
      out.push(H.arrow(e[0], e[1], e[2], e[3], { color: color, sw: 2.6, dash: a.kind === "bad", label: a.label, mono: true, lpos: [CX + 14, CY] }));
    });
    return out.join("");
  }

  window.OS_ANIMS.philosophers = {
    title: "The dining philosophers (OSTEP Figures 31.14 to 31.16)",
    interval: 4000,
    threads: PS,
    colors: { P0: "#1f6f8b", P1: "#b5651d", P2: "#6b4fa0", P3: "#5b7a2a", P4: "#4a5a8a" },
    sceneBox: "0 0 360 358",
    scene: scene,
    code: codeBroken,
    variants: [
      { key: "left", label: "Everyone left first", steps: onlyActor(A), code: codeBroken, codeTitle: "OSTEP Figure 31.15" },
      { key: "rev", label: "Philosopher 4 reversed", steps: onlyActor(B), code: codeFixed, codeTitle: "OSTEP Figure 31.16 (get_forks)" }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
