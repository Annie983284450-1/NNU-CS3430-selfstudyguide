// The semaphore of W09 class 2, sections 5.2 to 5.4, step by step: a counter that sem_wait() lowers (sleeping if the
// result is negative) and sem_post() raises (waking one sleeper if there is one). Two runs:
//   5.3 start at 1, a lock: W09_demos/sem_lock.c lines 8 to 21 (OSTEP Figure 31.3), traced as in OSTEP Figure 31.5;
//   5.4 start at 0, a wait for another thread: W09_demos/join_sem.c lines 9 to 26 (OSTEP Figure 31.6), the forced
//       order (child first) and then the other order (parent first), as the section's step list gives them.
// The picture is one scene: the semaphore as one structure (its value, read as in Figure 5.2, and its queue of
// sleepers), the two threads under it, and an arrow for each sem_wait() or sem_post(), labeled with the code line.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  function C(arr) { return arr.map(function (x) { return { n: x[0], text: x[1] }; }); }
  var codeLock = C([
    [8, "sem_t m;"],
    [9, "int counter = 0;"],
    [10, ""],
    [11, "void *worker(void *arg) {"],
    [12, "    for (int i = 0; i < LOOPS; i++) {"],
    [13, "        sem_wait(&m);"],
    [14, "        counter++;                      // critical section here"],
    [15, "        sem_post(&m);"],
    [16, "    }"],
    [17, "    return NULL;"],
    [18, "}"],
    [19, ""],
    [20, "int main(int argc, char *argv[]) {"],
    [21, "    sem_init(&m, 0, 1);                 // X = 1"]
  ]);
  var codeJoin = C([
    [9, "sem_t s;"],
    [10, ""],
    [11, "void *child(void *arg) {"],
    [12, "    printf(\"child\\n\");"],
    [13, "    sem_post(&s);                       // signal here: child is done"],
    [14, "    return NULL;"],
    [15, "}"],
    [16, ""],
    [17, "int main(int argc, char *argv[]) {"],
    [18, "    sem_init(&s, 0, 0);                 // X = 0"],
    [19, "    printf(\"parent: begin\\n\");"],
    [20, "    pthread_t c;"],
    [21, "    pthread_create(&c, NULL, child, NULL);"],
    [22, "    usleep(100000);                     // let the child run first"],
    [23, "    sem_wait(&s);                       // wait here for child"],
    [24, "    printf(\"parent: end\\n\");"],
    [25, "    return 0;"],
    [26, "}"]
  ]);
  function T(kind, text) { return { kind: kind, text: text }; }
  var M = "−";   // the minus sign the page uses

  // ---- 5.3: start at 1, a lock
  var asLock = [
    { label: "Start", text: "main starts m at 1 (line 21, X = 1), and that is what makes it a lock. Four threads add to counter; the trace follows two of them, T0 and T1.",
      at: [], state: { v: 1, q: [], name: "m", x: 1 },
      threads: { T0: T("ready", "about to call sem_wait()"), T1: T("ready", "about to call sem_wait()") }, acts: [] },
    { label: "Step 1", text: "T0 calls sem_wait() (line 13). The value goes from 1 to 0, which is not negative, so T0 goes on into the critical section (line 14).",
      at: [{ who: "T0", line: 14 }], state: { v: 0, q: [], name: "m", x: 1 },
      threads: { T0: T("inside", "inside: counter++"), T1: T("ready", "about to call sem_wait()") },
      acts: [{ from: "T0", to: "v", label: "line 13: sem_wait  1 → 0" }],
      event: "T0: wait() passed.", eventKind: "good" },
    { label: "Step 2", text: "T1 calls sem_wait() (line 13). The value goes from 0 to " + M + "1, which is negative, so T1 sleeps on the semaphore's queue.",
      at: [{ who: "T0", line: 14 }, { who: "T1", line: 13 }], state: { v: -1, q: ["T1"], name: "m", x: 1 },
      threads: { T0: T("inside", "inside: counter++"), T1: T("asleep", "asleep on m") },
      acts: [{ from: "T1", to: "v", label: "line 13: sem_wait  0 → " + M + "1" }, { from: "T1", to: "q", sleep: true }],
      event: "T1: wait() slept. A negative value is how many are asleep.", eventKind: "warn" },
    { label: "Step 3", text: "T0 leaves the critical section and calls sem_post() (line 15). The value goes from " + M + "1 to 0, and the sleeper, T1, wakes and goes in.",
      at: [{ who: "T0", line: 15 }, { who: "T1", line: 14 }], state: { v: 0, q: [], name: "m", x: 1 },
      threads: { T0: T("ready", "out of the critical section"), T1: T("inside", "inside: counter++") },
      acts: [{ from: "T0", to: "v", label: "line 15: sem_post  " + M + "1 → 0" }, { from: "T0", to: "T1", wake: true, label: "wakes T1" }],
      event: "T0: post() woke T1. Still one inside at a time.", eventKind: "good" },
    { label: "Step 4", text: "T1 calls sem_post() (line 15), and the value goes from 0 back to 1. The value went 1, 0, " + M + "1, 0, 1, with one thread inside at a time.",
      at: [{ who: "T1", line: 15 }], state: { v: 1, q: [], name: "m", x: 1 },
      threads: { T0: T("ready", "out of the critical section"), T1: T("ready", "out of the critical section") },
      acts: [{ from: "T1", to: "v", label: "line 15: sem_post  0 → 1" }],
      event: "The run: 4 threads, total 4000000, every run.", eventKind: "good" }
  ];

  // ---- 5.4: start at 0, wait for another thread
  var asJoin = [
    { label: "Start", text: "main starts s at 0 (line 18, X = 0), which means nothing has happened yet. That is what makes it a wait for an event.",
      at: [{ who: "parent", line: 18 }], state: { v: 0, q: [], name: "s", x: 0 },
      threads: { parent: T("run", "in main()"), child: T("idle", "not started yet") }, acts: [] },
    { label: "Child first: 1", text: "main prints parent: begin, starts the child (line 21), and sleeps 0.1 s (line 22) to force the child first, the order that killed shortcut 1.",
      at: [{ who: "parent", line: 22 }, { who: "child", line: 12 }], state: { v: 0, q: [], name: "s", x: 0 },
      threads: { parent: T("idle", "in usleep(), 0.1 s"), child: T("run", "prints child") }, acts: [] },
    { label: "Child first: 2", text: "The child finishes and posts (line 13). Nobody is asleep, so the value becomes 1 and waits there: the event, recorded in the value.",
      at: [{ who: "parent", line: 22 }, { who: "child", line: 13 }], state: { v: 1, q: [], name: "s", x: 0 },
      threads: { parent: T("idle", "in usleep(), 0.1 s"), child: T("done", "has posted") },
      acts: [{ from: "child", to: "v", label: "line 13: sem_post  0 → 1" }],
      event: "A post to nobody is remembered in the count.", eventKind: "good" },
    { label: "Child first: 3", text: "The parent calls sem_wait() (line 23). The value is 1, so it takes it (1 → 0) and goes on. The run printed parent: begin, child, parent: end, where join_nostate hung in the same forced order.",
      at: [{ who: "parent", line: 24 }], state: { v: 0, q: [], name: "s", x: 0 },
      threads: { parent: T("run", "past its wait()"), child: T("done", "has posted") },
      acts: [{ from: "parent", to: "v", label: "line 23: sem_wait  1 → 0" }],
      event: "parent: end printed. Nothing was lost.", eventKind: "good" },
    { label: "Parent first: 0", text: "The other order, as the notes on lines 13 and 23 describe it (the run shows only the forced one): the parent reaches its wait() first. The value starts at 0 again.",
      at: [{ who: "parent", line: 23 }], state: { v: 0, q: [], name: "s", x: 0 },
      threads: { parent: T("run", "about to call sem_wait()"), child: T("run", "has not posted yet") }, acts: [] },
    { label: "Parent first: 1", text: "The parent calls sem_wait() (line 23). The value goes from 0 to " + M + "1, so the parent sleeps on the queue until the post.",
      at: [{ who: "parent", line: 23 }], state: { v: -1, q: ["parent"], name: "s", x: 0 },
      threads: { parent: T("asleep", "asleep on s"), child: T("run", "has not posted yet") },
      acts: [{ from: "parent", to: "v", label: "line 23: sem_wait  0 → " + M + "1" }, { from: "parent", to: "q", sleep: true }],
      event: "The parent sleeps at " + M + "1.", eventKind: "warn" },
    { label: "Parent first: 2", text: "The child posts (line 13). The value goes from " + M + "1 to 0, and the post wakes the parent.",
      at: [{ who: "parent", line: 23 }, { who: "child", line: 13 }], state: { v: 0, q: [], name: "s", x: 0 },
      threads: { parent: T("ready", "woken"), child: T("done", "has posted") },
      acts: [{ from: "child", to: "v", label: "line 13: sem_post  " + M + "1 → 0" }, { from: "child", to: "parent", wake: true, label: "wakes parent" }] },
    { label: "Parent first: 3", text: "The parent is past its wait() (line 24). Either way the order no longer matters: both orders end at 0, with the parent past its wait().",
      at: [{ who: "parent", line: 24 }], state: { v: 0, q: [], name: "s", x: 0 },
      threads: { parent: T("run", "past its wait()"), child: T("done", "has posted") }, acts: [],
      event: "Post first: the value holds the event. Wait first: sleep at " + M + "1 until the post.", eventKind: "good" }
  ];

  // ---- the scene
  var VF = [14, 164], QF = [172, 346], CY = 40, CH = 86;
  var YEL = "rgba(232,178,58,.30)";
  function reading(v) {   // Figure 5.2
    if (v >= 2) return v + " may pass";
    if (v === 1) return "1 may pass";
    if (v === 0) return "the next one sleeps";
    if (v === -1) return "1 thread asleep";
    return (-v) + " threads asleep";
  }
  function scene(s, H, ctx) {
    var c = ctx.col, st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    var light = "var(--md-default-fg-color--light)";
    var names = st.name === "m" ? ["T0", "T1"] : ["parent", "child"];
    var P = {}; P[names[0]] = [78, 238]; P[names[1]] = [282, 238];
    out.push(H.box(6, 6, 348, 130, { r: 12, stroke: light, sw: 1.8 }));
    out.push(H.text(18, 27, "semaphore " + st.name + " (sem_t)", { size: 13, weight: 700, anchor: "start" }));
    out.push(H.text(342, 27, "started at X = " + st.x, { size: 11, anchor: "end", color: light }));
    // the value
    var vch = pv.v !== st.v, vcol = st.v > 0 ? "#2a7a6b" : st.v === 0 ? "#a0632a" : "#b23a48";
    out.push(H.box(VF[0], CY, VF[1] - VF[0], CH, { r: 8, fill: vch ? YEL : "var(--md-code-bg-color)", stroke: vch ? "#e8b23a" : "transparent", sw: 1.6, cls: vch ? "anim-new" : "" }));
    out.push(H.text(VF[0] + 8, CY + 16, "value", { size: 11, weight: 700, anchor: "start", color: light }));
    out.push(H.text((VF[0] + VF[1]) / 2, CY + 54, (st.v < 0 ? M : "") + Math.abs(st.v), { size: 30, weight: 700, mono: true, color: vcol, cls: vch ? "anim-pop" : "" }));
    out.push(H.text((VF[0] + VF[1]) / 2, CY + 76, reading(st.v), { size: 11, weight: 700, color: vcol }));
    // the queue
    var qch = JSON.stringify(pv.q) !== JSON.stringify(st.q);
    out.push(H.box(QF[0], CY, QF[1] - QF[0], CH, { r: 8, fill: qch ? YEL : "var(--md-code-bg-color)", stroke: qch ? "#e8b23a" : "transparent", sw: 1.6, cls: qch ? "anim-new" : "" }));
    out.push(H.text(QF[0] + 8, CY + 16, "queue of sleepers", { size: 11, weight: 700, anchor: "start", color: light }));
    if (st.q.length) st.q.forEach(function (t, i) { out.push(H.chip(QF[0] + 50 + i * 70, CY + 48, t, c(t), { cls: pv.q.indexOf(t) < 0 ? "anim-pop" : "" }) + H.text(QF[0] + 98 + i * 70, CY + 52, "z z", { size: 11, weight: 700, italic: true, color: light })); });
    else out.push(H.text((QF[0] + QF[1]) / 2, CY + 52, "empty", { size: 12, italic: true, color: light }));
    // the threads
    names.forEach(function (t) {
      var p = P[t], th = s.threads[t], k = th.kind, col = c(t);
      var fill = k === "inside" || k === "run" ? "rgba(42,122,107,.12)" : k === "asleep" ? "rgba(178,58,72,.12)" : "var(--md-default-bg-color)";
      var faded = k === "idle" || k === "done";
      out.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="32" style="fill:' + fill + ';stroke:' + col + ';stroke-width:' + (k === "inside" || k === "run" ? 3.2 : 1.6) + ';opacity:' + (faded ? 0.5 : 1) + '"' + (faded ? ' stroke-dasharray="4 4"' : '') + '/>');
      out.push(H.text(p[0], p[1] + 5, t, { size: t.length > 2 ? 15 : 17, weight: 700, color: col }));
      if (k === "asleep") out.push(H.text(p[0] + 44, p[1] - 18, "z z", { size: 14, weight: 700, italic: true, color: "#b23a48" }));
      var words = th.text.split(" "), rows = [], r = "";
      words.forEach(function (w) { if ((r + " " + w).trim().length > 20) { rows.push(r.trim()); r = w; } else r += " " + w; });
      if (r.trim()) rows.push(r.trim());
      out.push(H.lines(p[0], p[1] + 50, rows, { size: 11.5, lh: 14 }));
    });
    // the actions
    (s.acts || []).forEach(function (a) {
      if (a.sleep) return;   // shown by the chip in the queue
      if (a.wake) {   // post() wakes the sleeper: an arrow from the poster to the thread it wakes
        var fp = P[a.from], tp = P[a.to], dir = tp[0] > fp[0] ? 1 : -1;
        out.push(H.arrow(fp[0] + dir * 36, fp[1] + 6, tp[0] - dir * 36, tp[1] + 6, { color: "#2a7a6b", dash: true, label: a.label, lpos: [180, 228], sw: 2.2 }));
        return;
      }
      var p = P[a.from], tx = (VF[0] + VF[1]) / 2, w = a.label.length * 6.3 + 12;
      var lx = Math.max(w / 2 + 4, Math.min(356 - w / 2, tx));
      out.push(H.arrow(p[0] + (p[0] < 180 ? 0 : -14), p[1] - 33, tx + (p[0] < 180 ? 0 : 30), CY + CH + 2, { color: c(a.from), bend: [0, 6], label: a.label, mono: true, lpos: [lx, 156], sw: 2.4 }));
    });
    return out.join("");
  }

  window.OS_ANIMS.sema = {
    title: "A semaphore: wait() lowers the value, post() raises it",
    interval: 4200,
    threads: ["T0", "T1", "parent", "child"],
    colors: { T0: "#1f6f8b", T1: "#b5651d", parent: "#1f6f8b", child: "#b5651d" },
    sceneBox: "0 0 360 334",
    scene: scene,
    code: codeLock,
    variants: [
      { key: "one", label: "Start at 1: a lock", steps: asLock, code: codeLock, codeTitle: "sem_lock.c lines 8 to 21 (OSTEP Figure 31.3)" },
      { key: "zero", label: "Start at 0: wait for another thread", steps: asJoin, code: codeJoin, codeTitle: "join_sem.c lines 9 to 26 (OSTEP Figure 31.6)" }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
