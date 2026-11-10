// Three animations for the W10 Q&A page (OSTEP chapters 32 and 33). Every step, value and code line is on that page.
// samelock10: Q1. do_something(&L, &L) on the book's eight lines (the five steps of the answer), and with the third branch.
// selectpass10: Q2. One pass of Figure 33.1's loop over four descriptors, with a count of the descriptors touched.
// contin10: Q3. read then write in a thread (four steps), and in an event handler with a continuation (seven steps).
// The picture is one connected scene each time: the shared thing on top (the lock, the set, the stack or the table),
// the actor below, and one arrow per step, labeled with the code line.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  var KIND = { info: "#1f6f8b", ok: "#2a7a6b", bad: "#b23a48" };
  var NAVY = "#1f3864", AMBER = "#a0632a", RED = "#b23a48", GREEN = "#2a7a6b";
  var FG = "var(--md-default-fg-color)", LIGHT = "var(--md-default-fg-color--light)", LINE = "var(--md-default-fg-color--lighter)", CODEBG = "var(--md-code-bg-color)";
  var HOT = "rgba(232,178,58,.28)", HOTLINE = "#c8901e";
  function L(rows) { return rows.map(function (x) { return { n: x[0], text: x[1] }; }); }

  // ------------------------------------------------------------------ samelock10
  var bookCode = L([
    [1, "if (m1 > m2) { // grab in high-to-low address order"],
    [2, "  pthread_mutex_lock(m1);"],
    [3, "  pthread_mutex_lock(m2);"],
    [4, "} else {"],
    [5, "  pthread_mutex_lock(m2);"],
    [6, "  pthread_mutex_lock(m1);"],
    [7, "}"],
    [8, "// Code assumes that m1 != m2 (not the same lock)"]
  ]);
  var fixedCode = L([
    [24, "void do_something_fixed(pthread_mutex_t *m1, pthread_mutex_t *m2) {"],
    [25, "    if (m1 > m2) {"],
    [26, "        pthread_mutex_lock(m1);"],
    [27, "        pthread_mutex_lock(m2);"],
    [28, "    } else if (m1 < m2) {"],
    [29, "        pthread_mutex_lock(m2);"],
    [30, "        pthread_mutex_lock(m1);"],
    [31, "    } else {"],
    [32, "        // special case: m1 and m2 are the same"],
    [33, "        pthread_mutex_lock(m1);"],
    [34, "        printf(\"same lock: taken once\\n\");"],
    [35, "    }"],
    [36, "}"]
  ]);
  function sl(held, wait, status, test) { return { held: held, wait: wait, status: status, test: test || "" }; }
  var sameSteps = [{
    label: "Start", text: "A thread calls do_something(&L, &L). So m1 and m2 hold the same address, the address of the one lock L. L is free.",
    at: [{ who: "T", line: 1 }], state: sl(false, false, "about to test line 1"), acts: []
  }, {
    label: "Step 1", text: "Line 1 tests m1 > m2. Two equal addresses are not greater, so the test is false. The code goes to the else branch.",
    at: [{ who: "T", line: 4 }], state: sl(false, false, "in the else branch", "m1 > m2 is false"), acts: [],
    event: "Equal addresses fall into the else branch.", eventKind: "warn"
  }, {
    label: "Step 2", text: "Line 5 locks m2. L is free, so the thread takes it.",
    at: [{ who: "T", line: 5 }], state: sl(true, false, "holds L"), acts: [{ label: "line 5: lock(m2)", kind: "ok" }]
  }, {
    label: "Step 3", text: "Line 6 locks m1. That is L again, and L is held. The thread goes to sleep until L is unlocked.",
    at: [{ who: "T", line: 6 }], state: sl(true, true, "asleep, waiting for L"), acts: [{ label: "line 6: lock(m1)", kind: "bad" }],
    event: "The thread waits for a lock that it holds itself.", eventKind: "bad"
  }, {
    label: "Step 4", text: "The only thread that would unlock L is the one that is asleep. It never reaches its unlock. In the run on the page, timeout ended the program after 3 seconds: exit status 124.",
    at: [{ who: "T", line: 6 }], state: sl(true, true, "asleep forever"), acts: [{ label: "still waiting", kind: "bad" }],
    event: "A ring of one thread: it holds L and asks for L.", eventKind: "bad"
  }];
  var fixedSteps = [{
    label: "Start", text: "The same call, do_something_fixed(&L, &L), on the version with three branches. L is free.",
    at: [{ who: "T", line: 25 }], state: sl(false, false, "about to test line 25"), acts: []
  }, {
    label: "Step 1", text: "Line 25 tests m1 > m2. The addresses are equal, so it is false.",
    at: [{ who: "T", line: 25 }], state: sl(false, false, "testing", "m1 > m2 is false"), acts: []
  }, {
    label: "Step 2", text: "Line 28 tests m1 < m2. That is false too. Neither address is lower, so they are equal, and the code reaches the third branch.",
    at: [{ who: "T", line: 28 }], state: sl(false, false, "testing", "m1 < m2 is false"), acts: [],
    event: "Both tests false: the two locks are the same lock.", eventKind: "info"
  }, {
    label: "Step 3", text: "Line 33 locks m1, once. L is free, so the thread takes it. There is no second lock call.",
    at: [{ who: "T", line: 33 }], state: sl(true, false, "holds L"), acts: [{ label: "line 33: lock(m1)", kind: "ok" }]
  }, {
    label: "Step 4", text: "The function returns with L held once. The run on the page printed \"same lock: taken once\" and \"done\", with exit status 0.",
    at: [{ who: "T", line: 36 }], state: sl(true, false, "goes on with its work"), acts: [],
    event: "One lock, taken once. No hang.", eventKind: "good"
  }];
  function sameScene(s, H, ctx) {
    var S = s.state, P = ctx.prev ? ctx.prev.state : S, out = [], hot = ctx.prev && S.held !== P.held;
    out.push(H.box(70, 10, 220, 92, { r: 9, stroke: AMBER, sw: 1.8 }));
    out.push(H.text(180, 30, "the lock L (m1 and m2 both point here)", { size: 11, weight: 700, color: AMBER }));
    out.push(H.box(100, 42, 160, 48, { r: 6, fill: hot ? HOT : CODEBG, stroke: hot ? HOTLINE : LINE, sw: hot ? 2 : 1.2 }));
    out.push(H.text(180, 60, "state", { size: 10, color: LIGHT }));
    out.push(H.text(180, 80, S.held ? "held by T" : "free", { size: 14, weight: 700, color: S.held ? RED : GREEN, cls: hot ? "anim-pop" : "" }));
    var dash = S.wait ? "5 4" : null;
    out.push(H.box(90, 214, 180, 74, { r: 9, fill: "rgba(31,56,100,.10)", stroke: NAVY, sw: 1.8, dash: dash }));
    out.push(H.text(180, 236, "thread T", { size: 13, weight: 700, color: NAVY }));
    out.push(H.text(180, 256, S.status, { size: 11.5, color: S.wait ? RED : NAVY }));
    if (S.test) out.push(H.text(180, 276, S.test, { size: 11, mono: true, color: FG }));
    (s.acts || []).forEach(function (a) {
      var c = KIND[a.kind || "info"];
      out.push(H.arrow(180, 213, 180, 104, { color: c, label: a.label, mono: true, lpos: [180, 162], sw: 2.4, dash: a.kind === "bad" ? "6 4" : null }));
    });
    return out.join("");
  }
  window.OS_ANIMS.samelock10 = {
    title: "The same lock passed twice, step by step",
    interval: 4400, threads: ["T"], colors: { T: NAVY },
    sceneBox: "0 0 360 296", scene: sameScene,
    variants: [
      { key: "book", label: "The book's eight lines", steps: sameSteps, code: bookCode, codeTitle: "OSTEP 32.3, the tip's code (line numbers added on the page)" },
      { key: "fixed", label: "With the third branch", steps: fixedSteps, code: fixedCode, codeTitle: "W10_demos/qa_samelock.c, lines 24 to 36" }
    ]
  };

  // ------------------------------------------------------------------ selectpass10
  var selCode = L([
    [10, "while (1) {"],
    [11, "  // initialize the fd_set to all zero"],
    [12, "  fd_set readFDs;"],
    [13, "  FD_ZERO(&readFDs);"],
    [14, ""],
    [15, "  // now set the bits for the descriptors"],
    [16, "  // this server is interested in"],
    [17, "  // (for simplicity, all of them from min to max)"],
    [18, "  int fd;"],
    [19, "  for (fd = minFD; fd < maxFD; fd++)"],
    [20, "    FD_SET(fd, &readFDs);"],
    [21, ""],
    [22, "  // do the select"],
    [23, "  int rc = select(maxFD+1, &readFDs, NULL, NULL, NULL);"],
    [24, ""],
    [25, "  // check which actually have data using FD_ISSET()"],
    [26, "  int fd;"],
    [27, "  for (fd = minFD; fd < maxFD; fd++)"],
    [28, "    if (FD_ISSET(fd, &readFDs))"],
    [29, "      processFD(fd);"],
    [30, "}"]
  ]);
  // bits: descriptors 3, 4, 5, 6; n: descriptors touched so far in this pass; who: "loop" or "kernel"; span: cells the arrow covers
  function sp(bits, n, who, note) { return { bits: bits, n: n, who: who, note: note || "" }; }
  var selSteps = [{
    label: "Start", text: "The server watches four descriptors: 3, 4, 5 and 6. So minFD is 3 and maxFD is 7. The set still holds what the last select() left in it.",
    at: [{ who: "loop", line: 10 }], state: sp([0, 0, 1, 0], 0, "loop", "left over from the last pass"), acts: []
  }, {
    label: "Step 1", text: "Line 13: FD_ZERO() empties the set.",
    at: [{ who: "loop", line: 13 }], state: sp([0, 0, 0, 0], 0, "loop"), acts: [{ from: "loop", label: "line 13: FD_ZERO", kind: "info" }]
  }, {
    label: "Step 2", text: "Lines 19 and 20: four trips round the loop put 3, 4, 5 and 6 into the set. That is 4 descriptors touched.",
    at: [{ who: "loop", line: 20 }], state: sp([1, 1, 1, 1], 4, "loop"), acts: [{ from: "loop", label: "line 20: FD_SET, 4 times", kind: "info" }],
    event: "The rebuild: one FD_SET for every descriptor.", eventKind: "info"
  }, {
    label: "Step 3", text: "Line 23: select() goes through positions 0 to 7 and checks the four descriptors that are in the set. Only descriptor 4 has data. That is 4 more touched, inside the kernel.",
    at: [{ who: "loop", line: 23 }], state: sp([1, 1, 1, 1], 8, "kernel", "data on descriptor 4"), acts: [{ from: "kernel", label: "select() checks all 4", kind: "info" }]
  }, {
    label: "Step 4", text: "On return, select() has overwritten the set. Only descriptor 4 is left in it, and select() returns 1.",
    at: [{ who: "loop", line: 23 }], state: sp([0, 1, 0, 0], 8, "kernel", "rc = 1"), acts: [{ from: "kernel", label: "select() overwrites the set", kind: "ok" }],
    event: "The set no longer says what the server wants to watch.", eventKind: "warn"
  }, {
    label: "Step 5", text: "Lines 27 to 29: four trips round the loop test 3, 4, 5 and 6. Only 4 is in the set, so only processFD(4) runs. That is 4 more touched: 12 in all.",
    at: [{ who: "loop", line: 28 }], state: sp([0, 1, 0, 0], 12, "loop", "processFD(4)"), acts: [{ from: "loop", label: "line 28: FD_ISSET, 4 times", kind: "info" }],
    event: "One message handled; every descriptor touched three times.", eventKind: "warn"
  }, {
    label: "Step 6", text: "Back at line 10, the set holds descriptor 4 alone. Lines 13, 19 and 20 must run again, or the next select() would watch one connection.",
    at: [{ who: "loop", line: 10 }], state: sp([0, 1, 0, 0], 12, "loop", "next pass: rebuild again"), acts: [],
    event: "With n descriptors: about n, n and n, however few are ready.", eventKind: "info"
  }];
  function selScene(s, H, ctx) {
    var S = s.state, P = ctx.prev ? ctx.prev.state : S, out = [];
    out.push(H.box(20, 8, 320, 104, { r: 9, stroke: AMBER, sw: 1.8 }));
    out.push(H.text(180, 27, "readFDs, the set (1 = in the set)", { size: 11.5, weight: 700, color: AMBER }));
    for (var i = 0; i < 4; i++) {
      var x = 38 + i * 73, hot = ctx.prev && S.bits[i] !== P.bits[i];
      out.push(H.box(x, 38, 65, 62, { r: 6, fill: hot ? HOT : CODEBG, stroke: hot ? HOTLINE : LINE, sw: hot ? 2 : 1.2 }));
      out.push(H.text(x + 32.5, 54, "descriptor " + (3 + i), { size: 10, color: LIGHT }));
      out.push(H.text(x + 32.5, 86, String(S.bits[i]), { size: 22, weight: 700, mono: true, color: S.bits[i] ? GREEN : FG, cls: hot ? "anim-pop" : "" }));
    }
    var loopOn = S.who === "loop";
    out.push(H.box(20, 214, 150, 62, { r: 9, fill: "rgba(31,56,100,.10)", stroke: NAVY, sw: loopOn ? 2.4 : 1.2 }));
    out.push(H.text(95, 236, "the server's loop", { size: 12.5, weight: 700, color: NAVY }));
    out.push(H.text(95, 258, loopOn ? S.note : "inside select()", { size: 10.5, color: NAVY }));
    out.push(H.box(190, 214, 150, 62, { r: 9, fill: "rgba(42,122,107,.10)", stroke: GREEN, sw: loopOn ? 1.2 : 2.4 }));
    out.push(H.text(265, 236, "the kernel: select()", { size: 12.5, weight: 700, color: GREEN }));
    out.push(H.text(265, 258, loopOn ? "" : S.note, { size: 10.5, color: GREEN }));
    var hotN = ctx.prev && S.n !== P.n;
    out.push(H.text(180, 300, "descriptors touched in this pass: " + S.n, { size: 12.5, weight: 700, color: S.n >= 12 ? RED : FG, cls: hotN ? "anim-pop" : "" }));
    (s.acts || []).forEach(function (a) {
      var fromX = a.from === "loop" ? 95 : 265, c = a.from === "loop" ? NAVY : GREEN;
      out.push(H.arrow(fromX, 213, 180, 114, { color: c, label: a.label, mono: true, lpos: [180, 166], sw: 2.4 }));
    });
    return out.join("");
  }
  window.OS_ANIMS.selectpass10 = {
    title: "One pass of Figure 33.1's loop, counted",
    interval: 4400, threads: ["loop"], colors: { loop: NAVY },
    sceneBox: "0 0 360 312", scene: selScene, code: selCode,
    codeTitle: "OSTEP Figure 33.1, lines 10 to 30",
    variants: [{ key: "pass", label: "Four descriptors, one message", steps: selSteps }]
  };

  // ------------------------------------------------------------------ contin10
  var thrCode = L([[1, "int rc = read(fd, buffer, size);"], [2, "rc = write(sd, buffer, size);"]]);
  var evCode = [
    { n: null, text: "int aio_read(struct aiocb *aiocbp);" },
    { n: null, text: "int aio_error(const struct aiocb *aiocbp);" }
  ];
  // vars: "live" | "asleep" | "gone"; table: null or "7 -> 12"; disk: "idle" | "reading" | "done"; sock: text or ""; who: label of the actor box
  function cs(mode, vars, table, disk, sock, status) { return { mode: mode, vars: vars, table: table, disk: disk, sock: sock, status: status }; }
  var thrSteps = [{
    label: "Start", text: "The thread's function has fd and sd among its own variables. With the numbers of W10 Extra 3, fd is 7 and sd is 12. Both sit on the thread's stack.",
    at: [{ who: "T", line: 1 }], state: cs("thread", "live", null, "idle", "", "about to run line 1"), acts: []
  }, {
    label: "Step 1", text: "Line 1 calls read(fd, ...). The data is not in memory yet, so the thread sleeps until the disk answers. A sleeping thread keeps its stack.",
    at: [{ who: "T", line: 1 }], state: cs("thread", "asleep", null, "reading", "", "asleep inside read()"), acts: [{ to: "disk", label: "line 1: read(fd)", kind: "info" }],
    event: "The thread sleeps. fd and sd stay where they are.", eventKind: "info"
  }, {
    label: "Step 2", text: "The disk finishes, and read() returns. The thread wakes up in the same function, right after line 1.",
    at: [{ who: "T", line: 2 }], state: cs("thread", "live", null, "done", "", "awake, at line 2"), acts: [{ to: "back", label: "read() returns", kind: "ok" }]
  }, {
    label: "Step 3", text: "Line 2 calls write(sd, ...). It reads sd from the same place on the stack as before, and finds 12.",
    at: [{ who: "T", line: 2 }], state: cs("thread", "live", null, "done", "data sent", "wrote to socket 12"), acts: [{ to: "sock", label: "line 2: write(sd)", kind: "ok" }],
    event: "\"The code knows\": sd is still in its variable.", eventKind: "good"
  }];
  var evSteps = [{
    label: "Step 1", text: "A handler runs for the client's request. Its own variables hold fd = 7 and sd = 12.",
    at: [], state: cs("event", "live", null, "idle", "", "handler for the request"), acts: []
  }, {
    label: "Step 2", text: "It starts the read with aio_read(), which returns at once. The disk works in the background.",
    at: [], state: cs("event", "live", null, "reading", "", "handler for the request"), acts: [{ to: "disk", label: "aio_read()", kind: "info" }]
  }, {
    label: "Step 3", text: "Before it returns, it records sd in a table, indexed by fd: under 7 it stores 12. This stored note is the continuation.",
    at: [], state: cs("event", "live", "7 -> 12", "reading", "", "handler for the request"), acts: [{ to: "table", label: "record sd under fd", kind: "ok" }],
    event: "The extra work a thread never does.", eventKind: "warn"
  }, {
    label: "Step 4", text: "The handler returns to the loop. Its own variables are gone. The loop handles other events.",
    at: [], state: cs("event", "gone", "7 -> 12", "reading", "", "the loop, handling other events"), acts: [],
    event: "fd and sd, the handler's variables, no longer exist.", eventKind: "info"
  }, {
    label: "Step 5", text: "Later, aio_error() reports that the read on descriptor 7 is complete. A handler runs for that event. All it has is the number 7.",
    at: [], state: cs("event", "seven", "7 -> 12", "done", "", "handler for the finished read"), acts: [{ to: "back", label: "aio_error(): complete", kind: "ok" }]
  }, {
    label: "Step 6", text: "It looks 7 up in the table and gets 12 back.",
    at: [], state: cs("event", "both", "7 -> 12", "done", "", "handler for the finished read"), acts: [{ to: "table", label: "look up 7: get 12", kind: "ok" }]
  }, {
    label: "Step 7", text: "Now it can write the data to socket 12.",
    at: [], state: cs("event", "both", "7 -> 12", "done", "data sent", "handler for the finished read"), acts: [{ to: "sock", label: "write to socket 12", kind: "ok" }],
    event: "The table did by hand what the thread's stack did for free.", eventKind: "good"
  }];
  function conScene(s, H, ctx) {
    var S = s.state, P = ctx.prev ? ctx.prev.state : S, out = [], ev = S.mode === "event";
    function ch(k) { return ctx.prev && S[k] !== P[k]; }
    // top left: the disk; top right: the socket
    var hd = ch("disk");
    out.push(H.box(14, 10, 150, 62, { r: 9, fill: hd ? HOT : CODEBG, stroke: hd ? HOTLINE : LINE, sw: hd ? 2 : 1.2 }));
    out.push(H.text(89, 30, "the disk, file 7", { size: 11.5, weight: 700, color: FG }));
    out.push(H.text(89, 54, S.disk === "idle" ? "idle" : (S.disk === "reading" ? "reading..." : "read finished"), { size: 12, color: S.disk === "done" ? GREEN : AMBER, cls: hd ? "anim-pop" : "" }));
    var hs = ch("sock");
    out.push(H.box(196, 10, 150, 62, { r: 9, fill: hs ? HOT : CODEBG, stroke: hs ? HOTLINE : LINE, sw: hs ? 2 : 1.2 }));
    out.push(H.text(271, 30, "the client, socket 12", { size: 11.5, weight: 700, color: FG }));
    out.push(H.text(271, 54, S.sock || "waiting for the file", { size: 12, color: S.sock ? GREEN : LIGHT, cls: hs ? "anim-pop" : "" }));
    // middle (event tab only): the table
    if (ev) {
      var ht = ch("table");
      out.push(H.box(105, 112, 150, 54, { r: 6, fill: ht ? HOT : CODEBG, stroke: AMBER, sw: ht ? 2.2 : 1.6 }));
      out.push(H.text(180, 130, "table, indexed by fd", { size: 10.5, weight: 700, color: AMBER }));
      out.push(H.text(180, 152, S.table || "(empty)", { size: 13, weight: 700, mono: true, color: S.table ? FG : LIGHT, cls: ht ? "anim-pop" : "" }));
    }
    // bottom: the actor with its variables
    var by = ev ? 218 : 196, gone = S.vars === "gone", asleep = S.vars === "asleep", hv = ch("vars");
    out.push(H.box(40, by, 280, 96, { r: 9, fill: "rgba(31,56,100,.10)", stroke: NAVY, sw: 1.8, dash: asleep ? "5 4" : null }));
    out.push(H.text(180, by + 20, ev ? S.status : "thread T: " + S.status, { size: 12, weight: 700, color: asleep ? RED : NAVY }));
    out.push(H.text(180, by + 38, ev ? "the handler's own variables" : "its stack", { size: 10, color: LIGHT }));
    function shows(v, k) { return k === "fd" ? (v === "live" || v === "asleep" || v === "seven" || v === "both") : (v === "live" || v === "asleep" || v === "both"); }
    function cell(x, name, val, show) {
      var hc = hv && P.mode === S.mode && shows(P.vars, name) !== show;
      out.push(H.box(x, by + 46, 110, 38, { r: 6, fill: hc ? HOT : "var(--md-default-bg-color)", stroke: show ? NAVY : LINE, sw: 1.2, dash: show ? null : "4 3" }));
      out.push(H.text(x + 55, by + 70, show ? name + " = " + val : "(gone)", { size: 13, weight: 700, mono: true, color: show ? FG : LIGHT }));
    }
    var showFd = S.vars === "live" || S.vars === "asleep" || S.vars === "seven" || S.vars === "both";
    var showSd = S.vars === "live" || S.vars === "asleep" || S.vars === "both";
    cell(62, "fd", "7", showFd && !gone);
    cell(188, "sd", "12", showSd && !gone);
    (s.acts || []).forEach(function (a) {
      var c = KIND[a.kind || "info"], top = by - 1;
      var dx = ev ? 62 : 89, ax = ev ? 78 : 110, sx = ev ? 298 : 271, bx = ev ? 282 : 250;
      if (a.to === "disk") out.push(H.arrow(ax, top, dx, 74, { color: c, label: a.label, mono: true, lpos: [ev ? 70 : 78, ev ? 192 : 136], sw: 2.4 }));
      if (a.to === "back") out.push(H.arrow(dx, 74, ax, top, { color: c, label: a.label, mono: true, lpos: [ev ? 84 : 84, ev ? 192 : 136], sw: 2.4 }));
      if (a.to === "sock") out.push(H.arrow(bx, top, sx, 74, { color: c, label: a.label, mono: true, lpos: [ev ? 284 : 276, ev ? 192 : 136], sw: 2.4 }));
      if (a.to === "table") out.push(H.arrow(180, top, 180, 168, { color: c, label: a.label, mono: true, lpos: [180, 196], sw: 2.4 }));
    });
    return out.join("");
  }
  window.OS_ANIMS.contin10 = {
    title: "Read, then write: where sd is kept",
    interval: 4400, threads: ["T"], colors: { T: NAVY },
    sceneBox: "0 0 360 322", scene: conScene,
    variants: [
      { key: "thread", label: "In a thread", steps: thrSteps, code: thrCode, codeTitle: "OSTEP 33.7, the two lines (numbers added on the page)" },
      { key: "event", label: "In an event handler", steps: evSteps, code: evCode, codeTitle: "OSTEP 33.6, the two calls. The book prints no code for this version; the steps are its sentences." }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
