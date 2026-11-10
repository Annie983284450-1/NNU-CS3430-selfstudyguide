// The join with a condition variable, W09 class 1, sections 3.6 to 3.9, step by step. Four runs:
//   3.6 order 1, the parent waits first (W09_demos/join_cv.c lines 7 to 31, OSTEP Figure 30.3);
//   3.7 order 2, the child finishes first (the same code);
//   3.8 shortcut 1, no done (W09_demos/join_nostate.c lines 11 to 37, OSTEP Figure 30.4);
//   3.9 shortcut 2, no lock (OSTEP Figure 30.5 lines 1 to 9, drawn only).
// The picture is one scene: the shared trio on top as one structure (the variable done, the mutex m, the condition
// variable c with its sleep queue), the parent on the left and the child on the right, and an arrow from the thread
// that acts to the field it touches, labeled with the code line.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  function C(arr) { return arr.map(function (x) { return { n: x[0], text: x[1] }; }); }
  var codeCV = C([
    [7, "int done = 0;"],
    [8, "pthread_mutex_t m = PTHREAD_MUTEX_INITIALIZER;"],
    [9, "pthread_cond_t c = PTHREAD_COND_INITIALIZER;"],
    [10, ""],
    [11, "void thr_exit() {"],
    [12, "    pthread_mutex_lock(&m);"],
    [13, "    done = 1;"],
    [14, "    pthread_cond_signal(&c);"],
    [15, "    pthread_mutex_unlock(&m);"],
    [16, "}"],
    [17, ""],
    [18, "void *child(void *arg) {"],
    [19, "    for (volatile long i = 0; i < WORK; i++)"],
    [20, "        ;                               // the child's real work"],
    [21, "    printf(\"child\\n\");"],
    [22, "    thr_exit();"],
    [23, "    return NULL;"],
    [24, "}"],
    [25, ""],
    [26, "void thr_join() {"],
    [27, "    pthread_mutex_lock(&m);"],
    [28, "    while (done == 0)"],
    [29, "        pthread_cond_wait(&c, &m);"],
    [30, "    pthread_mutex_unlock(&m);"],
    [31, "}"]
  ]);
  var codeNoState = C([
    [11, "void thr_exit() {"],
    [12, "    pthread_mutex_lock(&m);"],
    [13, "    pthread_cond_signal(&c);"],
    [14, "    pthread_mutex_unlock(&m);"],
    [15, "}"],
    [16, ""],
    [17, "void *child(void *arg) {"],
    [18, "    printf(\"child\\n\");"],
    [19, "    thr_exit();"],
    [20, "    return NULL;"],
    [21, "}"],
    [22, ""],
    [23, "void thr_join() {"],
    [24, "    pthread_mutex_lock(&m);"],
    [25, "    pthread_cond_wait(&c, &m);"],
    [26, "    pthread_mutex_unlock(&m);"],
    [27, "}"],
    [28, ""],
    [29, "int main(int argc, char *argv[]) {"],
    [30, "    printf(\"parent: begin\\n\");"],
    [31, "    pthread_t p;"],
    [32, "    pthread_create(&p, NULL, child, NULL);"],
    [33, "    usleep(100000);                     // let the child run first"],
    [34, "    thr_join();"],
    [35, "    printf(\"parent: end\\n\");"],
    [36, "    return 0;"],
    [37, "}"]
  ]);
  var codeNoLock = C([
    [1, "void thr_exit() {"],
    [2, "    done = 1;"],
    [3, "    Pthread_cond_signal(&c);"],
    [4, "}"],
    [5, ""],
    [6, "void thr_join() {"],
    [7, "    if (done == 0)"],
    [8, "        Pthread_cond_wait(&c);"],
    [9, "}"]
  ]);

  function T(kind, text) { return { kind: kind, text: text }; }
  function S(o) { return o; }
  // state: done (0, 1, or null when the variable is dropped), m (who holds it, null = free, "none" = no lock),
  // q (the sleepers on c), mNote (a note on the lock field)

  // ---- 3.6: order 1, the parent arrives first and waits
  var order1 = [
    S({ label: "Start", text: "The three pieces start out empty: done is 0, the lock m is free, and nobody sleeps on c. The child is doing its half second of work, and the parent calls thr_join().",
      at: [{ who: "parent", line: 26 }, { who: "child", line: 19 }],
      state: { done: 0, m: null, q: [] },
      threads: { parent: T("run", "calls thr_join()"), child: T("run", "doing its work") }, acts: [] }),
    S({ label: "Step 1", text: "The parent takes the lock m (line 27).",
      at: [{ who: "parent", line: 27 }, { who: "child", line: 19 }],
      state: { done: 0, m: "parent", q: [] },
      threads: { parent: T("run", "holds m"), child: T("run", "doing its work") },
      acts: [{ from: "parent", to: "m", label: "line 27: lock(&m)" }] }),
    S({ label: "Step 2", text: "The parent checks done with the lock held (line 28), so the child cannot change done in the middle of the check. done is 0.",
      at: [{ who: "parent", line: 28 }, { who: "child", line: 19 }],
      state: { done: 0, m: "parent", q: [] },
      threads: { parent: T("run", "done is 0: must wait"), child: T("run", "doing its work") },
      acts: [{ from: "parent", to: "done", label: "line 28: done == 0" }] }),
    S({ label: "Step 3", text: "The parent calls wait() (line 29). In one step the lock is released and the parent sleeps on c's queue.",
      at: [{ who: "parent", line: 29 }, { who: "child", line: 19 }],
      state: { done: 0, m: null, mNote: "let go by wait()", q: ["parent"] },
      threads: { parent: T("asleep", "asleep on c"), child: T("run", "doing its work") },
      acts: [{ from: "parent", to: "c", label: "line 29: wait(&c, &m)" }],
      event: "The lock is free, so the child can take it, change done, and signal.", eventKind: "info" }),
    S({ label: "Step 4", text: "The child finishes its work, prints child, and calls thr_exit(). It takes m (line 12), the same lock the parent held when it checked done.",
      at: [{ who: "parent", line: 29 }, { who: "child", line: 12 }],
      state: { done: 0, m: "child", q: ["parent"] },
      threads: { parent: T("asleep", "asleep on c"), child: T("run", "in thr_exit(), holds m") },
      acts: [{ from: "child", to: "m", label: "line 12: lock(&m)" }] }),
    S({ label: "Step 5", text: "The child records the event: done = 1 (line 13).",
      at: [{ who: "parent", line: 29 }, { who: "child", line: 13 }],
      state: { done: 1, m: "child", q: ["parent"] },
      threads: { parent: T("asleep", "asleep on c"), child: T("run", "holds m") },
      acts: [{ from: "child", to: "done", label: "line 13: done = 1" }] }),
    S({ label: "Step 6", text: "The child signals c (line 14). The sleeping parent moves from c's queue to ready.",
      at: [{ who: "parent", line: 29 }, { who: "child", line: 14 }],
      state: { done: 1, m: "child", q: [] },
      threads: { parent: T("ready", "ready, still inside wait()"), child: T("run", "holds m") },
      acts: [{ from: "child", to: "c", label: "line 14: signal(&c)", kind: "ok" }],
      event: "The signal finds the parent asleep and wakes it.", eventKind: "good" }),
    S({ label: "Step 7", text: "The child lets go of m (line 15).",
      at: [{ who: "parent", line: 29 }, { who: "child", line: 15 }],
      state: { done: 1, m: null, q: [] },
      threads: { parent: T("ready", "ready, still inside wait()"), child: T("done", "has finished") },
      acts: [{ from: "child", to: "m", label: "line 15: unlock(&m)" }] }),
    S({ label: "Step 8", text: "The parent runs again. Inside wait(), it first takes m back; only then does wait() return (line 29).",
      at: [{ who: "parent", line: 29 }],
      state: { done: 1, m: "parent", mNote: "taken back by wait()", q: [] },
      threads: { parent: T("run", "holds m again"), child: T("done", "has finished") },
      acts: [{ from: "parent", to: "m", label: "line 29: m back" }] }),
    S({ label: "Step 9", text: "Back at the while test (line 28), with the lock held, the parent checks done again. It finds done == 1 and leaves the loop.",
      at: [{ who: "parent", line: 28 }],
      state: { done: 1, m: "parent", q: [] },
      threads: { parent: T("run", "done is 1: leaves the loop"), child: T("done", "has finished") },
      acts: [{ from: "parent", to: "done", label: "line 28: done == 0? no", kind: "ok" }] }),
    S({ label: "Step 10", text: "The parent unlocks m (line 30) and goes on. It slept while the child worked: the run took 0.46 s of CPU, against 0.99 s for the spinning join.",
      at: [{ who: "parent", line: 30 }],
      state: { done: 1, m: null, q: [] },
      threads: { parent: T("run", "past the join"), child: T("done", "has finished") },
      acts: [{ from: "parent", to: "m", label: "line 30: unlock(&m)" }],
      event: "Joined. The parent goes on only after done is 1.", eventKind: "good" })
  ];

  // ---- 3.7: order 2, the child finishes first
  var order2 = [
    S({ label: "Start", text: "The other order: the child finishes before the parent even arrives at the join. done is 0, m is free, and nobody sleeps on c.",
      at: [{ who: "child", line: 22 }],
      state: { done: 0, m: null, q: [] },
      threads: { parent: T("idle", "not at the join yet"), child: T("run", "calls thr_exit()") }, acts: [] }),
    S({ label: "Step 1", text: "The child takes the lock m (line 12).",
      at: [{ who: "child", line: 12 }],
      state: { done: 0, m: "child", q: [] },
      threads: { parent: T("idle", "not at the join yet"), child: T("run", "holds m") },
      acts: [{ from: "child", to: "m", label: "line 12: lock(&m)" }] }),
    S({ label: "Step 2", text: "The child sets done = 1 (line 13). The event is now in memory.",
      at: [{ who: "child", line: 13 }],
      state: { done: 1, m: "child", q: [] },
      threads: { parent: T("idle", "not at the join yet"), child: T("run", "holds m") },
      acts: [{ from: "child", to: "done", label: "line 13: done = 1" }] }),
    S({ label: "Step 3", text: "The child signals c (line 14). Nobody is asleep on c, so nothing happens, and nothing needs to happen: done = 1 is already recorded.",
      at: [{ who: "child", line: 14 }],
      state: { done: 1, m: "child", q: [] },
      threads: { parent: T("idle", "not at the join yet"), child: T("run", "holds m") },
      acts: [{ from: "child", to: "c", label: "line 14: signal(&c)", empty: true }],
      event: "A signal with nobody asleep does nothing. The variable carries the news.", eventKind: "info" }),
    S({ label: "Step 4", text: "The child lets go of m (line 15). The lock was held through both lines, so the parent cannot have been in the middle of its check.",
      at: [{ who: "child", line: 15 }],
      state: { done: 1, m: null, q: [] },
      threads: { parent: T("idle", "not at the join yet"), child: T("done", "has finished") },
      acts: [{ from: "child", to: "m", label: "line 15: unlock(&m)" }] }),
    S({ label: "Step 5", text: "The parent arrives later and takes the lock m (line 27).",
      at: [{ who: "parent", line: 27 }],
      state: { done: 1, m: "parent", q: [] },
      threads: { parent: T("run", "holds m"), child: T("done", "has finished") },
      acts: [{ from: "parent", to: "m", label: "line 27: lock(&m)" }] }),
    S({ label: "Step 6", text: "The parent checks done (line 28). done is 1, so the while test fails at once and the parent never calls wait().",
      at: [{ who: "parent", line: 28 }],
      state: { done: 1, m: "parent", q: [] },
      threads: { parent: T("run", "done is 1: no wait"), child: T("done", "has finished") },
      acts: [{ from: "parent", to: "done", label: "line 28: done == 0? no", kind: "ok" }] }),
    S({ label: "Step 7", text: "The parent unlocks m (line 30) and goes on. It never slept, so there was no wake-up to lose.",
      at: [{ who: "parent", line: 30 }],
      state: { done: 1, m: null, q: [] },
      threads: { parent: T("run", "past the join"), child: T("done", "has finished") },
      acts: [{ from: "parent", to: "m", label: "line 30: unlock(&m)" }],
      event: "Nothing lost: the parent goes on only after done is 1.", eventKind: "good" })
  ];

  // ---- 3.8: shortcut 1, no done
  var noDone = [
    S({ label: "Start", text: "Shortcut 1 drops done: the child just signals and the parent just waits. main prints parent: begin, starts the child (line 32), and sleeps 0.1 s in usleep() (line 33) to force the child first.",
      at: [{ who: "parent", line: 33 }, { who: "child", line: 18 }],
      state: { done: null, m: null, q: [] },
      threads: { parent: T("idle", "in usleep(), 0.1 s"), child: T("run", "prints child") }, acts: [] }),
    S({ label: "Step 1", text: "The child has no work loop, so it calls thr_exit() almost at once and takes the lock m (line 12).",
      at: [{ who: "parent", line: 33 }, { who: "child", line: 12 }],
      state: { done: null, m: "child", q: [] },
      threads: { parent: T("idle", "in usleep(), 0.1 s"), child: T("run", "holds m") },
      acts: [{ from: "child", to: "m", label: "line 12: lock(&m)" }] }),
    S({ label: "Step 2", text: "The child signals c (line 13), with nothing recorded. Nobody is asleep yet, so the signal does nothing, and nothing remembers that it happened.",
      at: [{ who: "parent", line: 33 }, { who: "child", line: 13 }],
      state: { done: null, m: "child", q: [] },
      threads: { parent: T("idle", "in usleep(), 0.1 s"), child: T("run", "holds m") },
      acts: [{ from: "child", to: "c", label: "line 13: signal(&c)", kind: "bad", empty: true }],
      event: "The signal finds nobody, and leaves no trace.", eventKind: "bad" }),
    S({ label: "Step 3", text: "The child lets go of m (line 14) and returns. The child is done and will never signal again.",
      at: [{ who: "parent", line: 33 }, { who: "child", line: 14 }],
      state: { done: null, m: null, q: [] },
      threads: { parent: T("idle", "in usleep(), 0.1 s"), child: T("done", "has finished") },
      acts: [{ from: "child", to: "m", label: "line 14: unlock(&m)" }] }),
    S({ label: "Step 4", text: "0.1 s later the parent calls thr_join() (line 34) and takes the lock m (line 24).",
      at: [{ who: "parent", line: 24 }],
      state: { done: null, m: "parent", q: [] },
      threads: { parent: T("run", "holds m"), child: T("done", "has finished") },
      acts: [{ from: "parent", to: "m", label: "line 24: lock(&m)" }] }),
    S({ label: "Step 5", text: "There is no variable to check, so the parent goes straight to wait() (line 25). It releases m and sleeps on c. The signal already came and went.",
      at: [{ who: "parent", line: 25 }],
      state: { done: null, m: null, mNote: "let go by wait()", q: ["parent"] },
      threads: { parent: T("dead", "asleep on c"), child: T("done", "has finished") },
      acts: [{ from: "parent", to: "c", label: "line 25: wait(&c, &m)", kind: "bad" }] }),
    S({ label: "Forever", text: "Nothing will ever wake the parent. timeout killed the program after 5 seconds with exit status 124, and parent: end never printed.",
      at: [{ who: "parent", line: 25 }],
      state: { done: null, m: null, q: ["parent"] },
      threads: { parent: T("dead", "asleep forever"), child: T("done", "has finished") },
      acts: [],
      event: "The parent sleeps on a signal that has already passed.", eventKind: "bad" })
  ];

  // ---- 3.9: shortcut 2, no lock
  var noLock = [
    S({ label: "Start", text: "Shortcut 2 keeps done and drops the lock. This code is drawn only (OSTEP Figure 30.5), because a real wait() needs a lock. done is 0.",
      at: [{ who: "parent", line: 6 }, { who: "child", line: 1 }],
      state: { done: 0, m: "none", q: [] },
      threads: { parent: T("run", "calls thr_join()"), child: T("ready", "about to call thr_exit()") }, acts: [] }),
    S({ label: "Step 1", text: "The parent checks done with no lock (line 7). It sees 0 and decides to sleep.",
      at: [{ who: "parent", line: 7 }, { who: "child", line: 1 }],
      state: { done: 0, m: "none", q: [] },
      threads: { parent: T("run", "done is 0: will sleep"), child: T("ready", "about to call thr_exit()") },
      acts: [{ from: "parent", to: "done", label: "line 7: done == 0" }] }),
    S({ label: "Step 2", text: "Before the parent reaches line 8, the OS interrupts it and runs the child. The child sets done = 1 (line 2).",
      switching: "interrupt: the OS stops the parent, runs the child",
      at: [{ who: "parent", line: 8 }, { who: "child", line: 2 }],
      state: { done: 1, m: "none", q: [] },
      threads: { parent: T("gap", "decided to sleep, still awake"), child: T("run", "sets done") },
      acts: [{ from: "child", to: "done", label: "line 2: done = 1" }],
      event: "The gap: the parent has checked, but is not asleep yet.", eventKind: "warn" }),
    S({ label: "Step 3", text: "The child signals c (line 3). The parent is between its check and its sleep, so the signal finds nobody asleep.",
      at: [{ who: "parent", line: 8 }, { who: "child", line: 3 }],
      state: { done: 1, m: "none", q: [] },
      threads: { parent: T("gap", "decided to sleep, still awake"), child: T("run", "signals") },
      acts: [{ from: "child", to: "c", label: "line 3: signal(&c)", kind: "bad", empty: true }],
      event: "The signal lands in the gap and hits nobody.", eventKind: "bad" }),
    S({ label: "Step 4", text: "The parent resumes and runs line 8: it sleeps on c, on news that already came. Nobody will ever signal again. This is a lost wake-up.",
      at: [{ who: "parent", line: 8 }],
      state: { done: 1, m: "none", q: ["parent"] },
      threads: { parent: T("dead", "asleep forever"), child: T("done", "has finished") },
      acts: [{ from: "parent", to: "c", label: "line 8: wait(&c)", kind: "bad" }],
      event: "done is 1, yet the parent sleeps forever.", eventKind: "bad" })
  ];

  // ---- the scene
  var KIND = { ok: "#2a7a6b", bad: "#b23a48" };
  var F = { done: [14, 104], m: [112, 222], c: [230, 346] };
  var CY = 40, CH = 64;
  var P = { parent: [78, 222], child: [282, 222] };
  var YEL = "rgba(232,178,58,.30)";
  function cx(n) { return (F[n][0] + F[n][1]) / 2; }
  function scene(s, H, ctx) {
    var c = ctx.col, st = s.state, pv = ctx.prev ? ctx.prev.state : st, out = [];
    var light = "var(--md-default-fg-color--light)";
    out.push(H.box(6, 6, 348, 110, { r: 12, stroke: light, sw: 1.8 }));
    out.push(H.text(18, 27, "shared by parent and child", { size: 13, weight: 700, anchor: "start" }));
    function cell(n, title, changed, dropped) {
      var w = F[n][1] - F[n][0];
      out.push(H.box(F[n][0], CY, w, CH, { r: 8, fill: dropped ? "transparent" : changed ? YEL : "var(--md-code-bg-color)", stroke: dropped ? "var(--md-default-fg-color--lighter)" : changed ? "#e8b23a" : "transparent", sw: 1.6, dash: dropped, cls: changed ? "anim-new" : "" }));
      out.push(H.text(F[n][0] + 8, CY + 16, title, { size: 11, weight: 700, anchor: "start", color: light }));
    }
    // done
    var noDone = st.done === null;
    cell("done", "done", !noDone && pv.done !== st.done, noDone);
    if (noDone) out.push(H.lines(cx("done"), CY + 38, ["dropped:", "no variable"], { size: 10.5, italic: true, color: light, lh: 13 }));
    else out.push(H.text(cx("done"), CY + 50, String(st.done), { size: 24, weight: 700, mono: true }));
    // m
    var noM = st.m === "none";
    cell("m", "mutex m", !noM && pv.m !== st.m, noM);
    if (noM) out.push(H.lines(cx("m"), CY + 38, ["dropped:", "no lock"], { size: 10.5, italic: true, color: light, lh: 13 }));
    else if (st.m) {
      out.push(H.text(F.m[1] - 8, CY + 16, "held by", { size: 10, anchor: "end", color: light }));
      out.push(H.chip(cx("m"), CY + 38, st.m, c(st.m), { cls: pv.m !== st.m ? "anim-pop" : "" }));
    } else {
      out.push(H.text(cx("m"), CY + 42, "free", { size: 13, italic: true, color: light }));
    }
    if (st.mNote && !noM) out.push(H.text(cx("m"), CY + 58, st.mNote, { size: 10, weight: 600, color: "#a0632a", cls: "anim-new" }));
    // c and its queue
    var qch = JSON.stringify(pv.q) !== JSON.stringify(st.q);
    cell("c", "cond c: queue", qch, false);
    if (st.q.length) st.q.forEach(function (t, i) { out.push(H.chip(F.c[0] + 40 + i * 60, CY + 40, t, c(t), { cls: pv.q.indexOf(t) < 0 ? "anim-pop" : "" }) + H.text(F.c[0] + 82 + i * 60, CY + 44, "z z", { size: 11, weight: 700, italic: true, color: light })); });
    else out.push(H.text(cx("c"), CY + 40, "empty", { size: 12, italic: true, color: light }));

    if (s.switching) out.push(H.text(180, 326, "⚡ " + s.switching, { size: 11.5, weight: 700, color: "#a0632a", cls: "anim-pop" }));
    // the two threads
    ["parent", "child"].forEach(function (t) {
      var p = P[t], th = s.threads[t], k = th.kind, col = c(t);
      var fill = k === "run" ? "rgba(42,122,107,.12)" : k === "gap" ? "rgba(232,178,58,.24)" : k === "dead" ? "rgba(178,58,72,.18)" : k === "asleep" ? "rgba(31,111,139,.10)" : "var(--md-default-bg-color)";
      var faded = k === "idle" || k === "done";
      out.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="32" style="fill:' + fill + ';stroke:' + col + ';stroke-width:' + (k === "run" ? 3.2 : 1.6) + ';opacity:' + (faded ? 0.5 : 1) + '"' + (k === "gap" ? ' stroke-dasharray="6 4" class="anim-pulse"' : (faded ? ' stroke-dasharray="4 4"' : '')) + '/>');
      out.push(H.text(p[0], p[1] + 5, t, { size: 15, weight: 700, color: col }));
      if (k === "asleep") out.push(H.text(p[0] + 44, p[1] - 18, "z z", { size: 14, weight: 700, italic: true, color: light }));
      if (k === "dead") out.push(H.text(p[0] + 46, p[1] - 18, "z z z", { size: 15, weight: 700, italic: true, color: "#b23a48", cls: "anim-pop" }));
      var words = th.text.split(" "), rows = [], r = "";
      words.forEach(function (w) { if ((r + " " + w).trim().length > 20) { rows.push(r.trim()); r = w; } else r += " " + w; });
      if (r.trim()) rows.push(r.trim());
      out.push(H.lines(p[0], p[1] + 50, rows, { size: 11.5, color: k === "dead" ? "#b23a48" : "var(--md-default-fg-color)", weight: k === "dead" ? 700 : 400, lh: 14 }));
    });
    // the action of this step
    (s.acts || []).forEach(function (a) {
      var color = KIND[a.kind] || c(a.from), p = P[a.from];
      var tx = cx(a.to), w = a.label.length * 6.3 + 12;
      var lx = Math.max(w / 2 + 4, Math.min(356 - w / 2, tx));
      var x1 = p[0] + (a.from === "parent" ? 12 : -12), y1 = p[1] - 33;
      out.push(H.arrow(x1, y1, tx, CY + CH + 2, { color: color, bend: [0, 8], label: a.label, mono: true, lpos: [lx, 136], sw: 2.4 }));
      if (a.empty) out.push(H.text(cx("c") - 6, CY + 58, "nobody asleep", { size: 10.5, weight: 700, color: a.kind === "bad" ? "#b23a48" : "#a0632a", cls: "anim-pop" }) +
                            (a.kind === "bad" ? H.text(F.c[1] - 4, CY + 60, "✗", { size: 14, weight: 700, color: "#b23a48", anchor: "end", cls: "anim-pop" }) : ""));
    });
    return out.join("");
  }

  window.OS_ANIMS.join = {
    title: "The join with a condition variable, step by step",
    interval: 4200,
    threads: ["parent", "child"],
    colors: { parent: "#1f6f8b", child: "#b5651d" },
    sceneBox: "0 0 360 334",
    scene: scene,
    code: codeCV,
    variants: [
      { key: "order1", label: "Parent waits first", steps: order1, code: codeCV, codeTitle: "join_cv.c lines 7 to 31 (OSTEP Figure 30.3)" },
      { key: "order2", label: "Child finishes first", steps: order2, code: codeCV, codeTitle: "join_cv.c lines 7 to 31 (OSTEP Figure 30.3)" },
      { key: "nodone", label: "Shortcut 1: no done", steps: noDone, code: codeNoState, codeTitle: "join_nostate.c lines 11 to 37 (OSTEP Figure 30.4)" },
      { key: "nolock", label: "Shortcut 2: no lock", steps: noLock, code: codeNoLock, codeTitle: "OSTEP Figure 30.5, drawn only (not real code)" }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
