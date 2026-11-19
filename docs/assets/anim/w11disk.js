// One disk read in xv6, the request side and the interrupt side run in order: W11 class 1, Section 2.5
// (kernel/virtio_disk.c lines 268 to 286 and 319 to 321). The page says it is a reading of the code, not a capture;
// Section 2.6 counts real runs. The steps are the page's numbered list and table (and the deck's DISK_STEPS in
// _buildscripts/w11/anim_w11.py): b->disk = 1 (268); the request onto the avail ring (272, 277); one store to the
// notify register (281); sleep(b) because b->disk is still 1 (285), and B runs; the disk copies the block into b->data
// itself, posts it on the used ring and interrupts; the handler sets b->disk = 0 (320) and calls wakeup(b) (321); A
// runs again, finds b->disk == 0 at line 284 and returns.
// The picture: memory as one structure (b->disk, b->data, the two rings), the disk with its notify register, and the
// CPU with processes A and B below; an arrow from whoever acts to the field it changes, up the gap between memory
// and the disk; process A asleep is drawn dashed.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  var code = [
    [268, "  b->disk = 1;"],
    [269, "  disk.info[idx[0]].b = b;"],
    [270, ""],
    [271, "  // tell the device the first index in our chain of descriptors."],
    [272, "  disk.avail->ring[disk.avail->idx % NUM] = idx[0];"],
    [273, ""],
    [274, "  __sync_synchronize();"],
    [275, ""],
    [276, "  // tell the device another avail ring entry is available."],
    [277, "  disk.avail->idx += 1; // not % NUM ..."],
    [278, ""],
    [279, "  __sync_synchronize();"],
    [280, ""],
    [281, "  *R(VIRTIO_MMIO_QUEUE_NOTIFY) = 0; // value is queue number"],
    [282, ""],
    [283, "  // Wait for virtio_disk_intr() to say request has finished."],
    [284, "  while(b->disk == 1) {"],
    [285, "    sleep(b, &disk.vdisk_lock);"],
    [286, "  }"],
    [null, "..."],
    [319, "    struct buf *b = disk.info[id].b;"],
    [320, "    b->disk = 0;   // disk is done with buf"],
    [321, "    wakeup(b);"]
  ].map(function (x) { return { n: x[0], text: x[1] }; });

  function st(flag, data, avail, used, notify, disk, cpu, a, b, waits) {
    return { flag: flag, data: data, avail: avail, used: used, notify: notify, disk: disk, cpu: cpu, A: a, B: b, waits: !!waits };
  }

  var steps = [{
    label: "Start",
    text: "Process A needs one block of a file that is not in memory, so the file system's block read, bread(), called virtio_disk_rw() for it. Process B is ready to run and waiting for the CPU.",
    at: [], state: st("0", "(old bytes)", "(empty)", "(empty)", "(nothing written)", "idle", "process A", "running", "ready, waiting"), acts: []
  }, {
    label: "Step 1",
    text: "Line 268 sets b->disk to 1: this buffer is now with the disk, until the handler hands it back.",
    at: [{ who: "A", line: 268 }], state: st("1", "(old bytes)", "(empty)", "(empty)", "(nothing written)", "idle", "process A", "running", "ready, waiting"),
    acts: [{ from: "A", to: "flag", label: "line 268: b->disk = 1" }]
  }, {
    label: "Step 2",
    text: "Lines 272 and 277 put the request on the avail ring, in plain memory, and add 1 to the ring's count. The disk has not been told anything yet.",
    at: [{ who: "A", line: 277 }], state: st("1", "(old bytes)", "1 request: read into b", "(empty)", "(nothing written)", "idle", "process A", "running", "ready, waiting"),
    acts: [{ from: "A", to: "avail", label: "lines 272 and 277" }]
  }, {
    label: "Step 3",
    text: "Line 281 writes once to the notify register. That single store tells the disk to look at the avail ring, and the disk starts on the request.",
    at: [{ who: "A", line: 281 }], state: st("1", "(old bytes)", "1 request: read into b", "(empty)", "written: 0", "working", "process A", "running", "ready, waiting"),
    acts: [{ from: "A", to: "notify", label: "line 281: notify", kind: "ok" }]
  }, {
    label: "Step 4",
    text: "b->disk is still 1, so line 285 calls sleep(b). Process A gives up the CPU, and the scheduler runs process B.",
    at: [{ who: "A", line: 285 }], state: st("1", "(old bytes)", "1 request: read into b", "(empty)", "written: 0", "working", "process B", "asleep on b", "running", true),
    acts: [], event: "The CPU is not idle and not asking: B gets it.", eventKind: "good"
  }, {
    label: "Step 5",
    text: "The disk copies the 1,024 bytes of the block into b->data by itself, notes the request on the used ring, and raises an interrupt. The CPU is still running B.",
    at: [{ who: "A", line: 285 }], state: st("1", "the block, 1,024 bytes", "1 request: read into b", "1 request done", "written: 0", "done: interrupt!", "process B", "asleep on b", "running", true),
    acts: [{ from: "disk", to: "data" }, { from: "disk", to: "used" }], event: "No CPU instruction touched the 1,024 bytes.", eventKind: "warn"
  }, {
    label: "Step 6",
    text: "The interrupt pauses B for a moment, and the CPU runs devintr(), which calls virtio_disk_intr(). Line 320 sets b->disk to 0: the buffer is A's again.",
    at: [{ who: "A", line: 285 }, { who: "intr", line: 320 }], state: st("0", "the block, 1,024 bytes", "1 request: read into b", "1 request done", "written: 0", "done: interrupt!", "the handler", "asleep on b", "paused", true),
    acts: [{ from: "CPU", to: "flag", label: "line 320: b->disk = 0", kind: "ok" }]
  }, {
    label: "Step 7",
    text: "Line 321 calls wakeup(b): process A, asleep on b, becomes ready to run again. It waits for its turn on the CPU like any other ready process.",
    at: [{ who: "A", line: 285 }, { who: "intr", line: 321 }], state: st("0", "the block, 1,024 bytes", "1 request: read into b", "1 request done", "written: 0", "done: interrupt!", "the handler", "ready (woken)", "paused"),
    acts: [{ from: "CPU", to: "A", label: "line 321: wakeup(b)", kind: "ok" }], event: "One interrupt, one wake-up. Nobody polled.", eventKind: "good"
  }, {
    label: "Step 8",
    text: "Later the scheduler runs process A again. Back in the loop at line 284, b->disk is 0, so A leaves the loop and returns with the block in b->data.",
    at: [{ who: "A", line: 284 }], state: st("0", "the block, 1,024 bytes", "1 request: read into b", "1 request done", "written: 0", "done: interrupt!", "process A", "running", "ready, waiting"),
    acts: [], event: "One request: one notify, one sleep, one interrupt, one wake-up.", eventKind: "good"
  }];

  var KIND = { info: "#1f6f8b", ok: "#2a7a6b", bad: "#b23a48" };
  var NAVY = "#1f3864", AMBER = "#a0632a", A_COL = "#1f6f8b", B_COL = "#2a7a3a";
  // memory fields in one column (their right edges face the gap between memory and the disk), disk fields beside
  var F = { flag: [16, 32, 184, 34], data: [16, 70, 184, 34], avail: [16, 108, 184, 32], used: [16, 144, 184, 32],
            notify: [244, 32, 100, 44], disk: [244, 84, 100, 44] };
  var PY = 260, PH = 70;                                  // the row of CPU, A and B
  var PX = { CPU: [8, 112], A: [128, 108], B: [244, 108] };
  var GAP_X = 226, LANE_Y = 236;                          // every arrow into a field runs up the gap at GAP_X

  function scene(s, H, ctx) {
    var S = s.state, P = ctx.prev ? ctx.prev.state : S, out = [];
    function changed(k) { return ctx.prev && S[k] !== P[k]; }
    function field(k, label) {
      var f = F[k], hot = changed(k);
      out.push(H.box(f[0], f[1], f[2], f[3], { r: 5, fill: hot ? "rgba(232,178,58,.28)" : "var(--md-code-bg-color)", stroke: hot ? "#c8901e" : "var(--md-default-fg-color--lighter)", sw: hot ? 2 : 1.1 }));
      out.push(H.text(f[0] + 6, f[1] + 13, label, { anchor: "start", size: 10, color: "var(--md-default-fg-color--light)", mono: label.indexOf("->") >= 0 }));
      out.push(H.text(f[0] + f[2] - 6, f[1] + f[3] - 6, S[k], { anchor: "end", size: S[k].length > 6 ? 11.5 : 15, weight: 700, cls: hot ? "anim-pop" : "" }));
    }
    out.push(H.box(8, 8, 208, 176, { r: 9, stroke: NAVY, sw: 1.8 }));
    out.push(H.text(16, 25, "memory (RAM)", { anchor: "start", size: 12, weight: 700, color: NAVY }));
    field("flag", "b->disk"); field("data", "b->data (1,024 bytes)"); field("avail", "avail ring: requests for the disk"); field("used", "used ring: requests done");
    out.push(H.box(236, 8, 116, 176, { r: 9, stroke: AMBER, sw: 1.8 }));
    out.push(H.text(244, 25, "the disk", { anchor: "start", size: 12, weight: 700, color: AMBER }));
    field("notify", "notify register"); field("disk", "the disk is");
    // the CPU and the two processes
    function proc(key, title, line2, color, asleep, line3) {
      var p = PX[key], hot = ctx.prev && ((key === "CPU" && S.cpu !== P.cpu) || (key !== "CPU" && S[key] !== P[key]));
      out.push(H.box(p[0], PY, p[1], PH, { r: 9, fill: asleep ? "var(--md-default-bg-color)" : (key === "CPU" ? "rgba(31,56,100,.10)" : "rgba(31,111,139,.08)"), stroke: color, sw: 1.8, dash: asleep }));
      out.push(H.text(p[0] + p[1] / 2, PY + 22, title, { size: 12, weight: 700, color: color }));
      out.push(H.text(p[0] + p[1] / 2, PY + 42, line2, { size: 11, weight: hot ? 700 : 400, color: color, cls: hot ? "anim-pop" : "" }));
      if (line3) out.push(H.text(p[0] + p[1] / 2, PY + 60, line3, { size: 10, italic: true, color: "#b23a48" }));
    }
    var asleep = S.A.indexOf("asleep") === 0;
    proc("CPU", "CPU runs", S.cpu, NAVY, false);
    proc("A", "process A", S.A, A_COL, asleep, asleep ? "until b->disk = 0" : "");
    proc("B", "process B", S.B, B_COL, false);
    function lane(sx, sy, ex, ey, c, label, mono) {     // up from (sx, sy) to the lane, along it to the gap, then into the field
      out.push('<path d="M' + sx + "," + sy + " L" + sx + "," + LANE_Y + " L" + GAP_X + "," + LANE_Y + '" class="anim-drawn" pathLength="100" style="fill:none;stroke:' + c + ';stroke-width:2.4"/>');
      out.push(H.arrow(GAP_X, LANE_Y, ex, ey, { color: c, bend: [GAP_X - (GAP_X + ex) / 2, ey - (LANE_Y + ey) / 2], label: label, mono: mono, lpos: [110, 214], sw: 2.4 }));
    }
    function right(k) { var f = F[k]; return [f[0] + f[2] + 1, f[1] + f[3] / 2]; }
    function left(k) { var f = F[k]; return [f[0] - 1, f[1] + f[3] / 2]; }
    (s.acts || []).forEach(function (a) {
      var c = KIND[a.kind || "info"];
      if (a.from === "disk") {                         // the disk writes memory itself: straight across the gap
        var t = right(a.to);
        out.push(H.arrow(236, t[1], t[0], t[1], { color: AMBER, sw: 2.4 }));
        return;
      }
      if (a.to === "A") {                              // the handler's wakeup(b): from the CPU over to process A
        out.push(H.arrow(PX.CPU[0] + 80, PY - 1, PX.A[0] + 30, PY - 1, { color: c, bend: [0, -34], label: a.label, mono: true, lpos: [110, 214], sw: 2.4 }));
        return;
      }
      var sx = a.from === "A" ? PX.A[0] + 70 : PX.CPU[0] + 90;
      var t2 = a.to === "notify" ? left("notify") : right(a.to);
      lane(sx, PY - 1, t2[0], t2[1], c, a.label, true);
    });
    return out.join("");
  }

  window.OS_ANIMS.w11disk = {
    title: "One disk read in xv6, step by step",
    interval: 4600,
    threads: ["A", "intr"],
    colors: { A: "#1f6f8b", intr: "#a0632a" },
    sceneBox: "0 0 360 338",
    scene: scene,
    code: code,
    codeTitle: "kernel/virtio_disk.c, lines 268 to 286 and 319 to 321",
    variants: [{ key: "read", label: "One read", steps: steps }]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
