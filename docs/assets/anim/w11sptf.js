// Sector 16 or sector 8 first, with a slow arm and with a fast arm: W11 class 2, Section 6.7 (Figures 6.6 to 6.10).
// Two tabs, because the section compares two runs. Slow arm (40 units a track): seek 40 to the middle track, wait
// 270 - 40 = 230, read 16 (300); seek 40 to the outer track, wait 90 - 40 = 50, read 8 (120); both 420. Fast arm
// (10 units a track): seek 20 to the outer track, wait 30 - 20 = 10, read 8 (60); seek 10 back, wait 210 - 10 = 200,
// read 16 (240); both 300. The left panel is the capture the section prints for that run.
// The platter angle is true to scale: state.p is the place of the head on the platter in degrees (sector slot j is
// j x 30 to j x 30 + 30; outer k, middle k + 12 and inner k + 24 share slot k), and it grows by 1 per time unit.
// At the start p = 210: the end of sector 30, where sector 19 (middle) and sector 7 (outer) begin. Sector 8 begins
// at 240 (and again at 600), sector 16 at 480.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  var codeSlow = [
    { n: 1, text: "$ python3 disk.py -a 30,16,8 -c" },
    { n: 2, text: "Block:  16  Seek: 40  Rotate:230  Transfer: 30  Total: 300" },
    { n: 3, text: "Block:   8  Seek: 40  Rotate: 50  Transfer: 30  Total: 120" }
  ];
  var codeFast = [
    { n: 1, text: "$ python3 disk.py -a 30,8,16 -S 4 -c" },
    { n: 2, text: "Block:   8  Seek: 20  Rotate: 10  Transfer: 30  Total:  60" },
    { n: 3, text: "Block:  16  Seek: 10  Rotate:200  Transfer: 30  Total: 240" }
  ];
  var N = null, E = [N, N, N, N];
  function rows(l1, a, l2, b, both) { return [[l1].concat(a), [l2].concat(b), ["both"].concat([N, N, N, both])]; }
  function rs(a, b, both) { return rows("sector 16", a, "sector 8", b, both); }
  function rf(a, b, both) { return rows("sector 8", a, "sector 16", b, both); }
  var W = "wait", D = "done";
  var slow = [{
    label: "Start",
    text: "The head is at the end of sector 30, on the inner track. Sector 8 arrives in 30 units, but this arm needs 2 × 40 = 80 units to reach its track, so the drive goes first to sector 16, which comes around in 270 units.",
    at: [{ who: "now", line: 1 }],
    state: { p: 210, track: 2, marks: { 30: D, 16: W, 8: W }, rows: rs(E, E, N) }
  }, {
    label: "Sector 16: seek 40",
    text: "Sector 16 is one track away, on the middle track. The seek takes 40 units.",
    at: [{ who: "now", line: 2 }],
    state: { p: 250, track: 1, marks: { 30: D, 16: W, 8: W }, rows: rs([40, N, N, N], E, N) },
    act: { kind: "seek", arc: true, from: 210, label: "seek to the middle track: 40 units" }
  }, {
    label: "Sector 16: wait 230",
    text: "Sector 16 arrives after 270 units, and 40 of them were spent seeking. The wait is 270 − 40 = 230 units.",
    at: [{ who: "now", line: 2 }],
    state: { p: 480, track: 1, marks: { 30: D, 16: W, 8: W }, rows: rs([40, 230, N, N], E, N) },
    act: { kind: "wait", arc: true, from: 250, label: "wait for sector 16: 270 − 40 = 230 units" }
  }, {
    label: "Sector 16: read",
    text: "With the transfer of 30 units, sector 16 costs 40 + 230 + 30 = 300 units.",
    at: [{ who: "now", line: 2 }],
    state: { p: 510, track: 1, marks: { 30: D, 16: D, 8: W }, rows: rs([40, 230, 30, 300], E, N) },
    act: { kind: "read", arc: true, from: 480, label: "transfer: 30 units" }
  }, {
    label: "Sector 8: seek 40",
    text: "The head is at the end of sector 16, which is where sector 5 begins on the outer track. Sector 8 is 3 × 30 = 90 units away, and the seek to the outer track takes 40 of them.",
    at: [{ who: "now", line: 3 }],
    state: { p: 550, track: 0, marks: { 30: D, 16: D, 8: W }, rows: rs([40, 230, 30, 300], [40, N, N, N], N) },
    act: { kind: "seek", arc: true, from: 510, label: "seek to the outer track: 40 units" }
  }, {
    label: "Sector 8: wait 50",
    text: "Sector 8 was 90 units away and the seek took 40 of them, so the wait is 90 − 40 = 50 units.",
    at: [{ who: "now", line: 3 }],
    state: { p: 600, track: 0, marks: { 30: D, 16: D, 8: W }, rows: rs([40, 230, 30, 300], [40, 50, N, N], N) },
    act: { kind: "wait", arc: true, from: 550, label: "wait for sector 8: 90 − 40 = 50 units" }
  }, {
    label: "Sector 8: read",
    text: "With the transfer of 30 units, sector 8 costs 40 + 50 + 30 = 120 units.",
    at: [{ who: "now", line: 3 }],
    state: { p: 630, track: 0, marks: { 30: D, 16: D, 8: D }, rows: rs([40, 230, 30, 300], [40, 50, 30, 120], N) },
    act: { kind: "read", arc: true, from: 600, label: "transfer: 30 units" }
  }, {
    label: "Both requests",
    text: "Both: 300 + 120 = 420 units. If the slow arm had gone to sector 8 first, that order would total 420 + 240 = 660.",
    at: [],
    state: { p: 630, track: 0, marks: { 30: D, 16: D, 8: D }, rows: rs([40, 230, 30, 300], [40, 50, 30, 120], 420) }
  }];
  var fast = [{
    label: "Start",
    text: "The same disk and the same two requests, but the arm now crosses a track in 10 units. Two tracks take 2 × 10 = 20 units and sector 8 arrives in 30, so the drive goes to sector 8 first.",
    at: [{ who: "now", line: 1 }],
    state: { p: 210, track: 2, marks: { 30: D, 16: W, 8: W }, rows: rf(E, E, N) }
  }, {
    label: "Sector 8: seek 20",
    text: "The seek takes 20 units. The arm is on the outer track, and sector 8 is still 10 units away.",
    at: [{ who: "now", line: 2 }],
    state: { p: 230, track: 0, marks: { 30: D, 16: W, 8: W }, rows: rf([20, N, N, N], E, N) },
    act: { kind: "seek", arc: true, from: 210, label: "seek to the outer track: 20 units" }
  }, {
    label: "Sector 8: wait 10",
    text: "Sector 8 arrives after 30 units, so the head waits 30 − 20 = 10 units.",
    at: [{ who: "now", line: 2 }],
    state: { p: 240, track: 0, marks: { 30: D, 16: W, 8: W }, rows: rf([20, 10, N, N], E, N) },
    act: { kind: "wait", arc: true, from: 230, label: "wait for sector 8: 30 − 20 = 10 units" }
  }, {
    label: "Sector 8: read",
    text: "With the transfer of 30 units, sector 8 costs 20 + 10 + 30 = 60 units.",
    at: [{ who: "now", line: 2 }],
    state: { p: 270, track: 0, marks: { 30: D, 16: W, 8: D }, rows: rf([20, 10, 30, 60], E, N) },
    act: { kind: "read", arc: true, from: 240, label: "transfer: 30 units" }
  }, {
    label: "Sector 16: seek 10",
    text: "The head is at the end of sector 8, which is where sector 21 begins on the middle track. Sector 16 is 7 × 30 = 210 units away, and the seek back takes 10 of them.",
    at: [{ who: "now", line: 3 }],
    state: { p: 280, track: 1, marks: { 30: D, 16: W, 8: D }, rows: rf([20, 10, 30, 60], [10, N, N, N], N) },
    act: { kind: "seek", arc: true, from: 270, label: "seek back to the middle track: 10 units" }
  }, {
    label: "Sector 16: wait 200",
    text: "Sector 16 was 210 units away and the seek took 10 of them, so the wait is 210 − 10 = 200 units.",
    at: [{ who: "now", line: 3 }],
    state: { p: 480, track: 1, marks: { 30: D, 16: W, 8: D }, rows: rf([20, 10, 30, 60], [10, 200, N, N], N) },
    act: { kind: "wait", arc: true, from: 280, label: "wait for sector 16: 210 − 10 = 200 units" }
  }, {
    label: "Sector 16: read",
    text: "With the transfer of 30 units, sector 16 costs 10 + 200 + 30 = 240 units.",
    at: [{ who: "now", line: 3 }],
    state: { p: 510, track: 1, marks: { 30: D, 16: D, 8: D }, rows: rf([20, 10, 30, 60], [10, 200, 30, 240], N) },
    act: { kind: "read", arc: true, from: 480, label: "transfer: 30 units" }
  }, {
    label: "Both requests",
    text: "Both: 60 + 240 = 300 units. With this fast arm the other order, 16 first, costs 300 + 120 = 420.",
    at: [],
    state: { p: 510, track: 1, marks: { 30: D, 16: D, 8: D }, rows: rf([20, 10, 30, 60], [10, 200, 30, 240], 300) }
  }];

  // ---- the scene: one picture. The three-track disk from above (outer 0 to 11, middle 12 to 23, inner 24 to 35,
  // 30 degrees a sector, the tracks lined up). The platter group is rotated by the time that has passed, 1 degree
  // per unit, counter-clockwise; the head stays at 9 o'clock and only moves between tracks. The action of the step
  // is an arc outside the rim that turns with the platter (so it ends up over the sectors that passed the head),
  // or the blue arrow of the seek. The table at the bottom fills in as the output lines are explained.
  var CX = 206, CY = 166, RIM = 116, RT = [101.5, 72.5, 44], RB = [116, 87, 58, 30], RARC = 124;
  var RED = "#c0392b", ORANGE = "#b5651d", GREEN = "#2a7a3a", BLUE = "#1f3864", MUTED = "var(--md-default-fg-color--light)";
  var ACOL = { wait: ORANGE, read: GREEN, seek: BLUE };
  function rad(a) { return a * Math.PI / 180; }
  function pt(r, a) { return [Math.round((CX + r * Math.cos(rad(a))) * 100) / 100, Math.round((CY + r * Math.sin(rad(a))) * 100) / 100]; }
  function ring(r1, r2, a1, a2) {                       // one sector cell, platter angles a1 to a2
    var A = pt(r1, a1), B = pt(r1, a2), C = pt(r2, a2), D = pt(r2, a1);
    return "M" + A + " A" + r1 + "," + r1 + " 0 0 1 " + B + " L" + C + " A" + r2 + "," + r2 + " 0 0 0 " + D + " Z";
  }
  function scene(s, H, ctx) {
    var S = s.state, P = ctx.prev ? ctx.prev.state : S, out = [], g = [];
    var rot0 = 180 - P.p, rot1 = 180 - S.p, spin = ctx.prev && rot0 !== rot1;
    out.push("<style>@keyframes w11spin{from{transform:rotate(var(--a0))}to{transform:rotate(var(--a1))}}" +
      "@keyframes w11unspin{from{transform:rotate(calc(-1*var(--a0)))}to{transform:rotate(calc(-1*var(--a1)))}}" +
      ".w11p{transform-box:view-box;transform-origin:" + CX + "px " + CY + "px;transform:rotate(var(--a1))}" +
      ".w11n{transform-box:view-box;transform:rotate(calc(-1*var(--a1)))}" +
      ".w11go{animation:w11spin .6s ease-in-out both}.w11go .w11n{animation:w11unspin .6s ease-in-out both}" +
      "@media (prefers-reduced-motion:reduce){.w11go,.w11go .w11n{animation:none}}</style>");
    // the platter: rim, cells of the marked sectors, track circles, sector borders, numbers
    g.push('<circle cx="' + CX + '" cy="' + CY + '" r="' + RIM + '" style="fill:var(--md-code-bg-color);stroke:var(--md-default-fg-color--light);stroke-width:1.8"/>');
    var k, t, j, m;
    for (k = 0; k < 36; k++) {
      m = S.marks[k]; if (!m) continue;
      t = Math.floor(k / 12); j = k % 12;
      g.push('<path d="' + ring(RB[t], RB[t + 1], j * 30, j * 30 + 30) + '" style="fill:' + (m === "done" ? "rgba(42,122,58,.42)" : "rgba(240,190,60,.62)") + '"' + (ctx.prev && P.marks[k] !== m ? ' class="anim-new"' : "") + "/>");
    }
    [RB[1], RB[2]].forEach(function (r) { g.push('<circle cx="' + CX + '" cy="' + CY + '" r="' + r + '" style="fill:none;stroke:var(--md-default-fg-color--lighter);stroke-width:1"/>'); });
    for (j = 0; j < 12; j++) { var a = pt(RB[3], j * 30), b = pt(RIM, j * 30);
      g.push('<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" style="stroke:var(--md-default-fg-color--lighter);stroke-width:.8"/>'); }
    for (k = 0; k < 36; k++) {
      t = Math.floor(k / 12); j = k % 12; m = S.marks[k];
      var c = pt(RT[t], j * 30 + 15);
      g.push('<g class="w11n" style="transform-origin:' + c[0] + "px " + c[1] + 'px">' + H.text(c[0], c[1] + 3.8, String(k), { size: t === 0 ? 11 : 10, weight: m ? 700 : 400, color: m === "done" ? "#17502a" : (m ? "#3a2a00" : "var(--md-default-fg-color)") }) + "</g>");
    }
    // the action arc: from where the head was (platter angle act.from) to where it is now (S.p)
    var act = s.act;
    if (act && act.arc) {
      var col = ACOL[act.kind], A1 = pt(RARC, S.p), A0 = pt(RARC, act.from), n = S.p - act.from;
      g.push('<path d="M' + A1 + " A" + RARC + "," + RARC + " 0 " + (n > 180 ? 1 : 0) + " 0 " + A0 + '" style="fill:none;stroke:' + col + ";stroke-width:" + (act.kind === "seek" ? 2.4 : 3.2) + '"' + (act.kind === "seek" ? ' stroke-dasharray="6 4"' : "") + "/>");
      var e1 = pt(RARC - 5, act.from), e2 = pt(RARC + 5, act.from), f1 = pt(RARC - 5, S.p), f2 = pt(RARC + 5, S.p);
      g.push('<line x1="' + e1[0] + '" y1="' + e1[1] + '" x2="' + e2[0] + '" y2="' + e2[1] + '" style="stroke:' + col + ';stroke-width:2.2"/>');
      g.push('<line x1="' + f1[0] + '" y1="' + f1[1] + '" x2="' + f2[0] + '" y2="' + f2[1] + '" style="stroke:' + col + ';stroke-width:2.2"/>');
    }
    out.push('<g class="w11p' + (spin ? " w11go" : "") + '" style="--a0:' + rot0 + "deg;--a1:" + rot1 + 'deg">' + g.join("") + "</g>");
    out.push('<circle cx="' + CX + '" cy="' + CY + '" r="' + RB[3] + '" style="fill:var(--md-default-bg-color);stroke:var(--md-default-fg-color--light);stroke-width:1.6"/>');
    out.push(H.text(CX, CY + 3.5, "turns", { size: 10, color: MUTED }));
    // which way the platter turns: a small arrow around the spindle (fixed)
    var d0 = pt(22, 50), d1 = pt(22, 130), d2 = pt(22, -50), d3 = pt(22, -130), TURN = "var(--md-default-fg-color--light)";
    out.push('<path d="M' + d1 + " A22,22 0 0 0 " + d0 + '" style="fill:none;stroke:' + TURN + ';stroke-width:1.3"/>');
    out.push('<path d="M' + d2 + " A22,22 0 0 0 " + d3 + '" style="fill:none;stroke:' + TURN + ';stroke-width:1.3"/>');
    var h1 = pt(17.5, 62), h2 = pt(27.5, 59), h3 = pt(17.5, -118), h4 = pt(27.5, -121);
    out.push('<polyline points="' + h1 + " " + d0 + " " + h2 + '" style="fill:none;stroke:' + TURN + ';stroke-width:1.3"/>');
    out.push('<polyline points="' + h3 + " " + d3 + " " + h4 + '" style="fill:none;stroke:' + TURN + ';stroke-width:1.3"/>');
    // the arm and the head: fixed at 9 o'clock, on track S.track
    var hx = CX - RT[S.track], PIV = [50, 322];
    out.push('<line x1="' + PIV[0] + '" y1="' + PIV[1] + '" x2="' + hx + '" y2="' + CY + '" style="stroke:' + RED + ';stroke-width:2.6;opacity:.85"/>');
    out.push('<circle cx="' + PIV[0] + '" cy="' + PIV[1] + '" r="7" style="fill:' + RED + '"/>');
    out.push(H.text(PIV[0], PIV[1] + 22, "arm", { size: 11, weight: 700, color: RED }));
    out.push('<line x1="62" y1="' + CY + '" x2="' + (hx - 13) + '" y2="' + CY + '" style="stroke:' + RED + ';stroke-width:1" stroke-dasharray="2 2"/>');
    out.push('<g' + (ctx.prev && P.track !== S.track ? ' class="anim-pop"' : "") + '><line x1="' + (hx - 12) + '" y1="' + CY + '" x2="' + (hx - 3) + '" y2="' + CY + '" style="stroke:' + RED + ';stroke-width:4.5"/>' +
      '<line x1="' + (hx + 3) + '" y1="' + CY + '" x2="' + (hx + 12) + '" y2="' + CY + '" style="stroke:' + RED + ';stroke-width:4.5"/></g>');
    out.push(H.text(58, CY + 4, "head", { size: 11.5, weight: 700, color: RED, anchor: "end" }));
    // the seek: a blue arrow from the old track to the new one, just under the head
    if (act && act.kind === "seek") out.push(H.arrow(CX - RT[P.track], CY + 13, hx, CY + 13, { color: BLUE, sw: 2.6 }));
    // the label of the action, at a fixed spot above the disk
    if (act) {
      var w = act.label.length * 6.1 + 30;
      out.push(H.box(6, 6, w, 22, { r: 5, stroke: ACOL[act.kind], sw: 1.4, cls: "anim-new" }));
      out.push('<line x1="14" y1="17" x2="30" y2="17" style="stroke:' + ACOL[act.kind] + ';stroke-width:3.2"' + (act.kind === "seek" ? ' stroke-dasharray="5 3"' : "") + "/>");
      out.push(H.text(36, 21, act.label, { size: 11.5, weight: 700, color: ACOL[act.kind], anchor: "start" }));
    }
    // the running table
    var TX = 104, TY = 300, LW = 70, CW = 45, RH = 17, heads = ["seek", "rotate", "transfer", "total"];
    out.push(H.box(TX, TY, LW + 4 * CW, 15 + RH * S.rows.length + 2, { r: 5, stroke: "var(--md-default-fg-color--lighter)", sw: 1.1 }));
    heads.forEach(function (h, i) { out.push(H.text(TX + LW + CW * i + CW / 2, TY + 11.5, h, { size: 10, color: MUTED })); });
    S.rows.forEach(function (r, ri) {
      var y = TY + 15 + RH * ri, pr = P.rows[ri];
      out.push('<line x1="' + TX + '" y1="' + y + '" x2="' + (TX + LW + 4 * CW) + '" y2="' + y + '" style="stroke:var(--md-default-fg-color--lighter);stroke-width:.7"/>');
      out.push(H.text(TX + 7, y + 12.5, r[0], { size: 10.5, anchor: "start", weight: 600 }));
      for (var i = 1; i <= 4; i++) {
        if (r[i] === null) continue;
        var hot = ctx.prev && pr[i] !== r[i];
        if (hot) out.push(H.box(TX + LW + CW * (i - 1) + 3, y + 1.5, CW - 6, RH - 3, { r: 3, fill: "rgba(232,178,58,.4)", stroke: "#c8901e", sw: 1, cls: "anim-new" }));
        out.push(H.text(TX + LW + CW * (i - 1) + CW / 2, y + 12.5, String(r[i]), { size: 11, weight: 700, mono: true }));
      }
    });
    return out.join("");
  }

  window.OS_ANIMS.w11sptf = {
    title: "Sector 16 or sector 8 first: the slow arm and the fast arm",
    interval: 4600,
    threads: ["now"],
    colors: { now: "#a0632a" },
    sceneBox: "0 0 360 372",
    scene: scene,
    code: codeSlow,
    codeTitle: "the simulator's output (the two requests that count)",
    variants: [
      { key: "slow", label: "Slow arm: 40 units a track", steps: slow, code: codeSlow },
      { key: "fast", label: "Fast arm: 10 units a track", steps: fast, code: codeFast }
    ]
  };
  if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();
})();
