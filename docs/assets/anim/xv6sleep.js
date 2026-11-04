// xv6's pipe with sleep() and wakeup(), W09 class 2, Sections 4.10 and 4.11 (kernel/pipe.c, kernel/proc.c).
// The page traces no run with numbers, so this one is built from its sentences: a reader sleeps on &pi->nread while
// the pipe is empty (lines 113 and 118); sleep() takes p->lock, releases the pipe's lock, records the channel and
// sleeps (lines 551 to 558); the writer copies a byte in (line 95) and wakes the readers (line 99); wakeup() wakes
// every process asleep on that address (lines 575 to 579), so of several sleepers only one may find the condition
// true and the rest check and sleep again (Section 4.11). Two readers, one byte and the order the two readers run in
// are this file's choices. The page gives no counter values, so nread and nwrite are shown as k and k + 1.
// The picture: struct pipe on top as one structure (data[], the lock, nread, nwrite), the two readers and the writer
// below it, and under them the two sleep addresses drawn as two groups of sleepers.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  var code = [
    [77, "pipewrite(struct pipe *pi, uint64 addr, int n)"],
    [82, "  acquire(&pi->lock);"],
    [88, "    if(pi->nwrite == pi->nread + PIPESIZE){"],
    [null, "                                  //DOC: pipewrite-full"],
    [89, "      wakeup(&pi->nread);"],
    [90, "      sleep(&pi->nwrite, &pi->lock);"],
    [91, "    } else {"],
    [95, "      pi->data[pi->nwrite++ % PIPESIZE] = ch;"],
    [99, "  wakeup(&pi->nread);"],
    [100, "  release(&pi->lock);"],
    [null, ""],
    [106, "piperead(struct pipe *pi, uint64 addr, int n)"],
    [112, "  acquire(&pi->lock);"],
    [113, "  while(pi->nread == pi->nwrite && pi->writeopen){"],
    [null, "                                  //DOC: pipe-empty"],
    [118, "    sleep(&pi->nread, &pi->lock); //DOC: piperead-sleep"],
    [119, "  }"],
    [123, "    ch = pi->data[pi->nread++ % PIPESIZE];"],
    [127, "  wakeup(&pi->nwrite);  //DOC: piperead-wakeup"],
    [128, "  release(&pi->lock);"],
    [null, ""],
    [540, "sleep(void *chan, struct spinlock *lk)"],
    [551, "  acquire(&p->lock);  //DOC: sleeplock1"],
    [552, "  release(lk);"],
    [555, "  p->chan = chan;"],
    [556, "  p->state = SLEEPING;"],
    [558, "  sched();"],
    [565, "  acquire(lk);"],
    [null, ""],
    [571, "wakeup(void *chan)"],
    [575, "  for(p = proc; p < &proc[NPROC]; p++) {"],
    [578, "    if(p->state == SLEEPING && p->chan == chan) {"],
    [579, "      p->state = RUNNABLE;"]
  ].map(function (x) { return { n: x[0], text: x[1] }; });

  function T(kind, text) { return { kind: kind, text: text }; }
  // state: lock (who holds the pipe's lock), nread, nwrite, byte (null | "new" | "read"), qr / qw: sleepers on
  // &pi->nread and &pi->nwrite
  function st(lock, nr, nw, byte, qr) { return { lock: lock, nread: nr, nwrite: nw, byte: byte, qr: qr || [], qw: [] }; }
  function th(r1, r2, w) { return { R1: r1, R2: r2, W: w }; }
  var RUN = T("run", "RUNNING"), IDLE = T("idle", "not in pipe"), SLP = T("sleep", "SLEEPING"), RDY = T("ready", "RUNNABLE");

  var steps = [{
    label: "Start",
    text: "The pipe is empty: nread == nwrite (say both are k). Two readers will call piperead() and one writer pipewrite(). Nobody holds the pipe's lock.",
    at: [], state: st(null, "k", "k", null),
    threads: th(IDLE, IDLE, IDLE), acts: []
  }, {
    label: "Step 1",
    text: "Reader 1 takes the pipe's lock (line 112) and tests line 113 with it held: nread == nwrite, so the pipe is empty.",
    at: [{ who: "R1", line: 113 }], state: st("R1", "k", "k", null),
    threads: th(RUN, IDLE, IDLE),
    acts: [{ from: "R1", to: "test", label: "line 113: nread == nwrite" }]
  }, {
    label: "Step 2",
    text: "Reader 1 calls sleep(&pi->nread, &pi->lock) (line 118). sleep() takes p->lock (551), releases the pipe's lock (552), records the address and marks the process SLEEPING (555, 556).",
    at: [{ who: "R1", line: 118 }, { who: "R1", line: 556 }], state: st(null, "k", "k", null, ["R1"]),
    threads: th(SLP, IDLE, IDLE),
    acts: [{ from: "R1", to: "qr", label: "line 118: sleep(&pi->nread)" }],
    event: "Asleep, and the pipe's lock is free for the writer.", eventKind: "info"
  }, {
    label: "Step 3",
    text: "Reader 2 runs piperead() the same way: it takes the lock (line 112), and line 113 finds the pipe still empty.",
    at: [{ who: "R1", line: 558 }, { who: "R2", line: 113 }], state: st("R2", "k", "k", null, ["R1"]),
    threads: th(SLP, RUN, IDLE),
    acts: [{ from: "R2", to: "test", label: "line 113: nread == nwrite" }]
  }, {
    label: "Step 4",
    text: "Reader 2 sleeps on the same address, &pi->nread (line 118), and its sleep() releases the pipe's lock. Two processes now sleep on one address.",
    at: [{ who: "R1", line: 558 }, { who: "R2", line: 118 }], state: st(null, "k", "k", null, ["R1", "R2"]),
    threads: th(SLP, SLP, IDLE),
    acts: [{ from: "R2", to: "qr", label: "line 118: sleep(&pi->nread)" }]
  }, {
    label: "Step 5",
    text: "The writer calls pipewrite() and takes the pipe's lock (line 82).",
    at: [{ who: "R1", line: 558 }, { who: "R2", line: 558 }, { who: "W", line: 82 }], state: st("W", "k", "k", null, ["R1", "R2"]),
    threads: th(SLP, SLP, RUN),
    acts: [{ from: "W", to: "lock", label: "line 82: acquire(&pi->lock)" }]
  }, {
    label: "Step 6",
    text: "The pipe is not full (line 88), so line 95 copies one byte into slot nwrite % 512, and nwrite moves on to k + 1.",
    at: [{ who: "R1", line: 558 }, { who: "R2", line: 558 }, { who: "W", line: 95 }], state: st("W", "k", "k + 1", "new", ["R1", "R2"]),
    threads: th(SLP, SLP, RUN),
    acts: [{ from: "W", to: "data", label: "line 95: data[nwrite++ % 512]" }]
  }, {
    label: "Step 7",
    text: "The writer calls wakeup(&pi->nread) (line 99). wakeup() walks the whole process table (575) and marks every process SLEEPING on that address RUNNABLE (578, 579): both readers.",
    at: [{ who: "R1", line: 558 }, { who: "R2", line: 558 }, { who: "W", line: 99 }, { who: "W", line: 579 }], state: st("W", "k", "k + 1", "new", []),
    threads: th(RDY, RDY, RUN),
    acts: [{ from: "W", to: "qr", label: "line 99: wakeup(&pi->nread)" }, { wake: "qr", to: ["R1", "R2"] }],
    event: "One byte arrived, and two readers woke.", eventKind: "warn"
  }, {
    label: "Step 8",
    text: "The writer releases the pipe's lock (line 100).",
    at: [{ who: "W", line: 100 }], state: st(null, "k", "k + 1", "new", []),
    threads: th(RDY, RDY, T("idle", "done writing")),
    acts: [{ from: "W", to: "lock", label: "line 100: release(&pi->lock)" }]
  }, {
    label: "Step 9",
    text: "Reader 1 runs first. Its sleep() takes the pipe's lock back (line 565) and returns. Back at the while (line 113) it tests again: nread ≠ nwrite, so the loop ends.",
    at: [{ who: "R1", line: 113 }], state: st("R1", "k", "k + 1", "new", []),
    threads: th(RUN, RDY, T("idle", "done writing")),
    acts: [{ from: "R1", to: "test", label: "line 113: test again", kind: "ok" }]
  }, {
    label: "Step 10",
    text: "Reader 1 copies the byte out of the ring (line 123), and nread moves on to k + 1. The pipe is empty again.",
    at: [{ who: "R1", line: 123 }], state: st("R1", "k + 1", "k + 1", "read", []),
    threads: th(RUN, RDY, T("idle", "done writing")),
    acts: [{ from: "data", to: "R1", label: "line 123: data[nread++ % 512]" }]
  }, {
    label: "Step 11",
    text: "Reader 1 wakes the writers' address, wakeup(&pi->nwrite) (line 127). Nobody sleeps there, so nothing changes. It releases the lock (line 128).",
    at: [{ who: "R1", line: 127 }, { who: "R1", line: 128 }], state: st(null, "k + 1", "k + 1", "read", []),
    threads: th(T("idle", "has its byte"), RDY, T("idle", "done writing")),
    acts: [{ from: "R1", to: "qw", label: "line 127: wakeup(&pi->nwrite)" }]
  }, {
    label: "Step 12",
    text: "Reader 2 runs. Its sleep() takes the lock back (line 565), and line 113 tests again: nread == nwrite. Reader 1 took the byte, so the pipe is empty.",
    at: [{ who: "R2", line: 113 }], state: st("R2", "k + 1", "k + 1", "read", []),
    threads: th(T("idle", "has its byte"), RUN, T("idle", "done writing")),
    acts: [{ from: "R2", to: "test", label: "line 113: test again", kind: "bad" }]
  }, {
    label: "Step 13",
    text: "Reader 2 goes back to sleep on &pi->nread (line 118). Every sleeper on the address woke, only one found the condition true, and the other checked and slept again.",
    at: [{ who: "R2", line: 118 }], state: st(null, "k + 1", "k + 1", "read", ["R2"]),
    threads: th(T("idle", "has its byte"), SLP, T("idle", "done writing")),
    acts: [{ from: "R2", to: "qr", label: "line 118: sleep again" }],
    event: "In xv6 the while loop is not a style choice.", eventKind: "good"
  }];

  // ---------------- the scene ----------------
  var BAD = "#b23a48", GOOD = "#2a7a6b", YEL = "rgba(232,178,58,.30)", LIGHT = "var(--md-default-fg-color--light)";
  var KIND = { ok: GOOD, bad: BAD };
  var NAME = { R1: "reader 1", R2: "reader 2", W: "writer" };
  var P = { R1: [56, 238], R2: [150, 238], W: [300, 238] }, R = 34;
  var F = { lock: [16, 112], nread: [120, 224], nwrite: [240, 344] }, FY = 72, FH = 68;
  var DATA = { x: 98, step: 30, w: 28, y: 32, h: 26 }, BYTE = 4, GAP = 232;
  var Q = { qr: [6, 200], qw: [208, 354] }, QY = 302, QH = 52, LBL1 = 176, LBL2 = 287;
  function labX(x, label) { var h = label.length * 3.15 + 6; return Math.max(4 + h, Math.min(356 - h, x)); }

  function scene(s, H, ctx) {
    var c = ctx.col, S = s.state, pv = ctx.prev ? ctx.prev.state : S, out = [];
    // struct pipe
    out.push(H.box(6, 6, 348, 146, { r: 12, stroke: LIGHT, sw: 1.8 }));
    out.push(H.text(16, 22, "struct pipe", { size: 13.5, weight: 700, anchor: "start", mono: true }));
    var empty = S.nread === S.nwrite;
    out.push(H.text(344, 22, empty ? "empty: nread == nwrite" : "1 byte: nwrite − nread = 1", { size: 10.5, weight: 700, anchor: "end", color: empty ? LIGHT : GOOD, cls: empty !== (pv.nread === pv.nwrite) ? "anim-new" : "" }));
    out.push(H.text(16, DATA.y + 17, "data[512]", { size: 11, weight: 700, anchor: "start", mono: true, color: LIGHT }));
    for (var i = 0; i < 8; i++) {
      var x = DATA.x + i * DATA.step, has = i === BYTE && S.byte, ch = i === BYTE && S.byte !== pv.byte;
      out.push(H.box(x, DATA.y, DATA.w, DATA.h, { r: 3, fill: ch ? YEL : has === "new" ? "rgba(31,111,139,.25)" : "var(--md-code-bg-color)", stroke: ch ? "#e8b23a" : "var(--md-default-fg-color--lighter)", sw: ch ? 2 : 1, cls: ch ? "anim-pop" : "" }));
      if (has) out.push(H.text(x + DATA.w / 2, DATA.y + 17, "ch", { size: 10.5, weight: 700, mono: true, color: has === "read" ? LIGHT : "var(--md-default-fg-color)" }));
    }
    out.push(H.text(DATA.x + 8 * DATA.step - 2, DATA.y + 17, "…", { size: 12, anchor: "start", color: LIGHT }));
    // the lock and the two counters
    var lch = pv.lock !== S.lock;
    out.push(H.box(F.lock[0], FY, F.lock[1] - F.lock[0], FH, { r: 8, fill: lch ? YEL : "var(--md-code-bg-color)", stroke: lch ? "#e8b23a" : "transparent", sw: 1.6, cls: lch ? "anim-new" : "" }));
    out.push(H.text(F.lock[0] + 8, FY + 15, "lock", { size: 11, weight: 700, anchor: "start", mono: true, color: LIGHT }));
    out.push(H.text(F.lock[0] + 8, FY + 28, "struct spinlock", { size: 10, anchor: "start", color: LIGHT }));
    var lx = (F.lock[0] + F.lock[1]) / 2;
    if (S.lock) { out.push(H.text(lx, FY + 44, "held by", { size: 10, color: LIGHT })); out.push(H.chip(lx, FY + 56, NAME[S.lock], c(S.lock), { cls: lch ? "anim-pop" : "" })); }
    else out.push(H.text(lx, FY + 52, "free", { size: 12, italic: true, color: LIGHT }));
    [["nread", "bytes ever read"], ["nwrite", "bytes ever written"]].forEach(function (f) {
      var n = f[0], x0 = F[n][0], w = F[n][1] - x0, chg = pv[n] !== S[n];
      out.push(H.box(x0, FY, w, FH, { r: 8, fill: chg ? YEL : "var(--md-code-bg-color)", stroke: chg ? "#e8b23a" : "transparent", sw: 1.6, cls: chg ? "anim-new" : "" }));
      out.push(H.text(x0 + 8, FY + 15, n, { size: 11, weight: 700, anchor: "start", mono: true, color: LIGHT }));
      out.push(H.text(x0 + 8, FY + 28, f[1], { size: 10, anchor: "start", color: LIGHT }));
      out.push(H.text(x0 + 10, FY + 56, S[n], { size: 19, weight: 700, anchor: "start", mono: true }));
    });
    // the threads
    ["R1", "R2", "W"].forEach(function (t) {
      var p = P[t], k = s.threads[t].kind, col = c(t), acting = (s.acts || []).some(function (a) { return a.from === t; });
      var fill = k === "run" ? "rgba(42,122,107,.12)" : k === "ready" ? "rgba(232,178,58,.20)" : k === "sleep" ? "rgba(120,120,140,.16)" : "var(--md-default-bg-color)";
      out.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + R + '" style="fill:' + fill + ';stroke:' + col + ';stroke-width:' + (acting ? 3.2 : 1.6) + '"' + (k === "ready" ? ' stroke-dasharray="6 4"' : "") + '/>');
      out.push(H.text(p[0], p[1] - 2, NAME[t], { size: 11.5, weight: 700, color: col }));
      out.push(H.text(p[0], p[1] + 13, s.threads[t].text, { size: 10, weight: k === "idle" ? 400 : 700, color: k === "sleep" ? LIGHT : k === "ready" ? "#a0632a" : k === "run" ? GOOD : LIGHT }));
      if (k === "sleep") out.push(H.text(p[0] + R + 2, p[1] - R + 6, "z z", { size: 12, weight: 700, italic: true, color: LIGHT, anchor: "start" }));
    });
    // the two sleep addresses
    [["qr", "&pi->nread"], ["qw", "&pi->nwrite"]].forEach(function (q) {
      var k = q[0], x0 = Q[k][0], w = Q[k][1] - x0, qq = S[k], pq = pv[k], chg = JSON.stringify(qq) !== JSON.stringify(pq);
      out.push(H.box(x0, QY, w, QH, { r: 8, fill: chg ? YEL : "var(--md-code-bg-color)", stroke: chg ? "#e8b23a" : "var(--md-default-fg-color--lighter)", sw: 1.2, cls: chg ? "anim-new" : "" }));
      out.push(H.text(x0 + 8, QY + 15, "asleep on " + q[1], { size: 10, weight: 700, anchor: "start", mono: true, color: LIGHT }));
      if (qq.length) qq.forEach(function (t) { out.push(H.chip(P[t][0], QY + 35, NAME[t], c(t), { cls: pq.indexOf(t) < 0 ? "anim-pop" : "" })); });
      else out.push(H.text(x0 + w / 2, QY + 39, "nobody", { size: 11, italic: true, color: LIGHT }));
    });
    out.push(H.text(180, 372, "No real queue: wakeup() scans every process for p->chan.", { size: 10, italic: true, color: LIGHT }));
    // the action of this step
    (s.acts || []).forEach(function (a) {
      if (a.wake) {
        a.to.forEach(function (t) { out.push(H.arrow(P[t][0] + 14, QY - 1, P[t][0] + 14, P[t][1] + R + 1, { color: GOOD, dash: true, sw: 2.2 })); });
        return;
      }
      var color = KIND[a.kind] || c(a.from === "data" ? a.to : a.from);
      function seg(d) { return '<path d="' + d + '" pathLength="100" class="anim-drawn" style="fill:none;stroke:' + color + ';stroke-width:2.4"/>'; }
      var TURN = 158;                             // arrows into the gap between nread and nwrite turn at this height
      if (a.from === "data") {                    // the byte goes down through the gap, then to the reader
        var tp = P[a.to], sy = DATA.y + DATA.h + 2;
        out.push(seg("M" + GAP + "," + sy + " L" + GAP + "," + TURN));
        out.push(H.arrow(GAP, TURN, tp[0], tp[1] - R - 1, { color: color, bend: [tp[0] - (GAP + tp[0]) / 2, TURN - (TURN + tp[1] - R - 1) / 2], label: a.label, mono: true, lpos: [labX(150, a.label), LBL1], sw: 2.4 }));
        return;
      }
      var p = P[a.from];
      if (a.to === "qr" || a.to === "qw") {      // down to a sleep address
        var qx = a.to === "qr" ? (a.from === "W" ? Q.qr[1] - 30 : p[0] - 8) : Q.qw[0] + 40;
        var qx0 = a.from === "W" ? p[0] - 22 : a.to === "qw" ? p[0] + 10 : p[0] - 8, qy0 = a.from === "W" ? p[1] + 22 : p[1] + R + 1;
        var qlx = a.from === "W" ? 250 : a.to === "qw" ? 196 : p[0];
        out.push(H.arrow(qx0, qy0, qx, QY - 1, { color: color, label: a.label, mono: true, lpos: [labX(qlx, a.label), LBL2], sw: 2.4 }));
        return;
      }
      if (a.to === "lock") {
        var kx = lx + (a.from === "W" ? 20 : 0), ky = FY + FH + 2;
        out.push(H.arrow(p[0] + (a.from === "W" ? -12 : 0), p[1] - R - 1, kx, ky, { color: color, label: a.label, mono: true, lpos: [labX((p[0] + kx) / 2, a.label), LBL1], sw: 2.4 }));
        return;
      }
      // the test reads both counters and the write goes into data[]: up from the thread, across, then up the gap
      var ty = a.to === "test" ? FY + FH + 2 : DATA.y + DATA.h + 2, x0 = p[0] + (p[0] < GAP ? 8 : -8), y0 = p[1] - R - 1;
      out.push(seg("M" + x0 + "," + y0 + " Q" + x0 + "," + TURN + " " + GAP + "," + TURN));
      out.push(H.arrow(GAP, TURN, GAP, ty, { color: color, label: a.label, mono: true, lpos: [labX((x0 + GAP) / 2, a.label), LBL1], sw: 2.4 }));
    });
    return out.join("");
  }

  window.OS_ANIMS.xv6sleep = {
    title: "xv6's pipe: two readers sleep, one byte arrives, both wake",
    interval: 4400,
    threads: ["R1", "R2", "W"],
    colors: { R1: "#b5651d", R2: "#6b4fa0", W: "#1f6f8b" },
    sceneBox: "0 0 360 380",
    scene: scene,
    code: code,
    codeTitle: "Selected lines: kernel/pipe.c pipewrite() and piperead(); kernel/proc.c sleep() and wakeup()",
    variants: [{ key: "pipe", label: "Two readers, one byte", steps: steps }]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
