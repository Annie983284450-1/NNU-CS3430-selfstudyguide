// Step-through animations for the self-study pages.
// A page holds <div class="anim" data-anim="NAME"></div> (put there by tools/make_anims.py); the scenario NAME is
// registered by its own file in this folder (window.OS_ANIMS[NAME] = {...}; see README.md here for the format).
// The reader steps with the buttons or the arrow keys; Play steps on its own. The static figure stays above it, so
// nothing here is needed to read the page.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};
  var PALETTE = ["#1f6f8b", "#b5651d", "#6b4fa0", "#2a7a6b", "#b23a48", "#5b7a2a"];

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }


  // ---- SVG helpers for scenes: a scene draws the whole state as one connected picture
  function svgEsc(s) { return esc(s); }
  var H = {
    box: function (x, y, w, h, o) { o = o || {};
      return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (o.r === undefined ? 8 : o.r) + '" style="fill:' + (o.fill || "var(--md-default-bg-color)") + ';stroke:' + (o.stroke || "var(--md-default-fg-color--lighter)") + ';stroke-width:' + (o.sw || 1.4) + '"' + (o.dash ? ' stroke-dasharray="5 4"' : '') + (o.cls ? ' class="' + o.cls + '"' : '') + '/>'; },
    text: function (x, y, s, o) { o = o || {};
      return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.anchor || "middle") + '" style="font-size:' + (o.size || 12) + 'px;font-weight:' + (o.weight || 400) + ';fill:' + (o.color || "var(--md-default-fg-color)") + (o.italic ? ';font-style:italic' : '') + (o.mono ? ';font-family:var(--md-code-font-family)' : '') + '"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' + svgEsc(s) + '</text>'; },
    lines: function (x, y, arr, o) { o = o || {}; var lh = o.lh || 14; return arr.map(function (s, i) { return H.text(x, y + i * lh, s, o); }).join(""); },
    chip: function (cx, cy, name, color, o) { o = o || {}; var w = Math.max(24, name.length * 7.5 + 12);
      return '<g' + (o.cls ? ' class="' + o.cls + '"' : '') + '><rect x="' + (cx - w / 2) + '" y="' + (cy - 10) + '" width="' + w + '" height="20" rx="5" style="fill:' + color + '"/>' + H.text(cx, cy + 4.5, name, { size: 11.5, weight: 700, color: "#fff" }) + '</g>'; },
    arrow: function (x1, y1, x2, y2, o) { o = o || {}; var c = o.color || "#555";
      var mx = (x1 + x2) / 2, my = (y1 + y2) / 2, cx = mx + (o.bend ? o.bend[0] : 0), cy = my + (o.bend ? o.bend[1] : 0);
      var d = "M" + x1 + "," + y1 + " Q" + cx + "," + cy + " " + x2 + "," + y2;
      var ang = Math.atan2(y2 - cy, x2 - cx), a = 9, s1 = ang + 2.6, s2 = ang - 2.6;
      var head = (x2 + a * Math.cos(s1)) + "," + (y2 + a * Math.sin(s1)) + " " + x2 + "," + y2 + " " + (x2 + a * Math.cos(s2)) + "," + (y2 + a * Math.sin(s2));
      var lx = o.lpos ? o.lpos[0] : (x1 + 2 * cx + x2) / 4, ly = o.lpos ? o.lpos[1] : (y1 + 2 * cy + y2) / 4;
      var g = '<g class="anim-arrow"><path d="' + d + '" pathLength="100" class="anim-drawn" style="fill:none;stroke:' + c + ';stroke-width:' + (o.sw || 2.2) + '"' + (o.dash ? ' stroke-dasharray="5 4"' : '') + '/>' +
        '<polyline points="' + head + '" class="anim-head" style="fill:none;stroke:' + c + ';stroke-width:' + (o.sw || 2.2) + ';stroke-linejoin:round"/>';
      if (o.label) { var w = o.label.length * 6.3 + 12;
        g += '<rect x="' + (lx - w / 2) + '" y="' + (ly - 10 + (o.ldy || 0)) + '" width="' + w + '" height="19" rx="4" class="anim-head" style="fill:var(--md-default-bg-color);stroke:' + c + ';stroke-width:1"/>' +
             H.text(lx, ly + 4 + (o.ldy || 0), o.label, { size: 11, weight: 600, color: c, mono: o.mono, cls: "anim-head" }); }
      return g + '</g>'; },
    mark: function (x, y, ok) { return ok ? H.text(x, y, "✓", { size: 20, weight: 700, color: "#2a7a6b", cls: "anim-pop" }) : H.text(x, y, "✗", { size: 20, weight: 700, color: "#b23a48", cls: "anim-pop" }); },
    col: function () { return "#555"; }
  };
  window.OS_ANIM_SVG = H;

  function build(root) {
    if (root.dataset.built) return;
    var A = window.OS_ANIMS[root.dataset.anim];
    if (!A) return;
    root.dataset.built = "1";
    var colors = {};
    (A.threads || []).forEach(function (t, i) { colors[t] = (A.colors && A.colors[t]) || PALETTE[i % PALETTE.length]; });
    function col(t) { return colors[t] || "#555e6b"; }
    function chip(t) { return "<span class=\"anim-chip\" style=\"background:" + col(t) + "\">" + esc(t) + "</span>"; }

    var variant = A.variants[0].key, step = 0, timer = null;
    var head = el("div", "anim-head");
    head.appendChild(el("div", "anim-title", esc(A.title)));
    var tabs = el("div", "anim-tabs");
    if (A.variants.length > 1) A.variants.forEach(function (v) {
      var b = el("button", "anim-tab", esc(v.label));
      b.type = "button";
      b.onclick = function () { stop(); variant = v.key; step = 0; draw(); };
      b.dataset.key = v.key;
      tabs.appendChild(b);
    });
    head.appendChild(tabs);
    root.appendChild(head);

    var body = el("div", "anim-body");
    var codeBox = el("div", "anim-code");
    var right = el("div", "anim-right");
    body.appendChild(codeBox);
    body.appendChild(right);
    root.appendChild(body);
    var caption = el("div", "anim-caption");
    root.appendChild(caption);
    var bar = el("div", "anim-bar");
    var prev = el("button", "anim-btn", "◀ Back"); prev.type = "button";
    var play = el("button", "anim-btn anim-play", "▶ Play"); play.type = "button";
    var next = el("button", "anim-btn", "Next ▶"); next.type = "button";
    var reset = el("button", "anim-btn anim-reset", "↺ Start over"); reset.type = "button";
    var dots = el("div", "anim-dots");
    // Playback speed, like a video player: 1x is the scenario's own interval, 2x (the default) half of it.
    var speedBox = el("div", "anim-speed");
    speedBox.setAttribute("role", "group");
    speedBox.setAttribute("aria-label", "Playback speed");
    speedBox.appendChild(el("span", "anim-speed-label", "Speed"));
    SPEEDS.forEach(function (x) {
      var b = el("button", "anim-speed-btn" + (x === speedNow() ? " on" : ""), x + "\u00d7");
      b.type = "button";
      b.dataset.speed = x;
      b.title = "Play at " + x + "\u00d7: about " + Math.round(base() / x / 100) / 10 + " s per step";
      b.setAttribute("aria-pressed", x === speedNow() ? "true" : "false");
      b.onclick = function () { setSpeed(x); };
      speedBox.appendChild(b);
    });
    [prev, play, next, dots, speedBox, reset].forEach(function (x) { bar.appendChild(x); });
    root.appendChild(bar);
    root.appendChild(el("div", "anim-hint", "Use the buttons, or click here and press ← and →. Speed sets how fast Play moves."));
    root.tabIndex = 0;

    function V() { return A.variants.filter(function (v) { return v.key === variant; })[0]; }
    function base() { return A.interval || 4000; }
    function stop() { if (timer) { clearTimeout(timer); timer = null; play.innerHTML = "▶ Play"; root.classList.remove("anim-playing"); } }
    // One step per tick; each tick reads the current speed, so a change of speed takes effect at the next step.
    function tick() {
      timer = setTimeout(function () {
        if (step >= V().steps.length - 1) { stop(); return; }
        go(step + 1);
        if (step >= V().steps.length - 1) { stop(); return; }
        tick();
      }, base() / speedNow());
    }
    function go(n) { step = Math.max(0, Math.min(V().steps.length - 1, n)); draw(); }
    prev.onclick = function () { stop(); go(step - 1); };
    next.onclick = function () { stop(); go(step + 1); };
    reset.onclick = function () { stop(); go(0); };
    play.onclick = function () {
      if (timer) { stop(); return; }
      // Move at once, so the click is answered, then one step per interval until the last step.
      if (step >= V().steps.length - 1) go(0); else go(step + 1);
      play.innerHTML = "❚❚ Pause";
      root.classList.add("anim-playing");
      timer = true;
      if (step >= V().steps.length - 1) stop(); else tick();
    };
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { stop(); go(step + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { stop(); go(step - 1); e.preventDefault(); }
    });

    function shown(val) {
      if (Array.isArray(val)) {
        if (!val.length) return "<span class=\"anim-empty\">empty</span>";
        return val.map(function (x) { return colors[x] ? chip(x) : "<span class=\"anim-item\">" + esc(x) + "</span>"; }).join(" ");
      }
      if (val === null || val === undefined || val === "") return "<span class=\"anim-empty\">—</span>";
      return esc(val);
    }

    function draw() {
      var v = V(), s = v.steps[step], code = v.code || A.code;
      tabs.querySelectorAll(".anim-tab").forEach(function (b) { b.classList.toggle("on", b.dataset.key === variant); });
      body.classList.toggle("anim-nocode", !code);
      codeBox.innerHTML = "";
      if (code) {
        if (v.codeTitle || A.codeTitle) codeBox.appendChild(el("div", "anim-codetitle", esc(v.codeTitle || A.codeTitle)));
        code.forEach(function (ln) {
          var row = el("div", "anim-line" + (ln.added ? " anim-added" : "") + (ln.n === null || ln.n === undefined ? " anim-nonum" : ""));
          var marks = el("span", "anim-marks"), who = [];
          (s.at || []).forEach(function (a) {
            if (ln.n !== null && ln.n !== undefined && a.line === ln.n) {
              var m = el("span", "anim-mark", esc(a.who));
              m.style.background = col(a.who);
              marks.appendChild(m);
              who.push(a.who);
            }
          });
          if (who.length === 1) { row.style.background = rgba(col(who[0]), 0.17); row.style.borderLeftColor = col(who[0]); }
          if (who.length > 1) { row.style.background = "rgba(120,110,100,.2)"; row.style.borderLeftColor = "#777"; }
          row.appendChild(marks);
          row.appendChild(el("span", "anim-ln", ln.added ? "+" : (ln.n === null || ln.n === undefined ? "" : String(ln.n))));
          var t = el("span", "anim-src");
          t.textContent = ln.text;
          row.appendChild(t);
          codeBox.appendChild(row);
        });
      }
      right.innerHTML = "";
      if (A.scene) {
        H.col = col;
        var prevS = step > 0 ? v.steps[step - 1] : null;
        var sc = el("div", "anim-scene", '<svg viewBox="' + (A.sceneBox || "0 0 420 340") + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(s.text) + '">' + A.scene(s, H, { prev: prevS, step: step, variant: variant, col: col }) + '</svg>');
        right.appendChild(sc);
        if (s.event) right.appendChild(el("div", "anim-event anim-ev-" + (s.eventKind || "info"), esc(s.event)));
        caption.innerHTML = "<span class=\"anim-stepno\">" + esc(s.label || ("Step " + step)) + "</span> " + esc(s.text);
        drawDots(v);
        return;
      }
      if (s.cpu) {
        var c = el("div", "anim-cpu");
        if (typeof s.cpu === "string") c.innerHTML = "<span>CPU runs</span> " + chip(s.cpu);
        else c.innerHTML = Object.keys(s.cpu).map(function (k) { return "<span>" + esc(k) + "</span> " + (s.cpu[k] ? chip(s.cpu[k]) : "<span class=\"anim-empty\">idle</span>"); }).join(" &nbsp; ");
        if (s.switching) c.innerHTML += " <i>" + esc(s.switching) + "</i>";
        right.appendChild(c);
      }
      if (A.fields && A.fields.length) {
        var fields = el("div", "anim-fields");
        fields.style.gridTemplateColumns = "repeat(" + (A.fieldCols || Math.min(A.fields.length, 3)) + ", minmax(0, 1fr))";
        A.fields.forEach(function (f) {
          var val = s.state[f.key], before = step > 0 ? v.steps[step - 1].state[f.key] : val;
          var box = el("div", "anim-field" + (JSON.stringify(val) !== JSON.stringify(before) ? " anim-changed" : "") + (f.wide ? " anim-wide" : ""));
          box.appendChild(el("div", "anim-fname", esc(f.label)));
          box.appendChild(el("div", "anim-fval" + (f.text ? " anim-ftext" : ""), shown(val)));
          fields.appendChild(box);
        });
        right.appendChild(fields);
      }
      if (A.threads && s.threads) {
        var threads = el("div", "anim-threads");
        threads.style.gridTemplateColumns = "repeat(" + Math.min(A.threads.length, A.threadCols || 2) + ", minmax(0, 1fr))";
        A.threads.forEach(function (t) {
          var st = s.threads[t];
          if (!st) return;
          var card = el("div", "anim-thread anim-st-" + st.kind);
          card.style.borderColor = col(t);
          var nm = el("div", "anim-tname", esc(t));
          nm.style.color = col(t);
          card.appendChild(nm);
          card.appendChild(el("div", "anim-tstate", esc(st.text)));
          threads.appendChild(card);
        });
        right.appendChild(threads);
      }
      if (s.event) right.appendChild(el("div", "anim-event anim-ev-" + (s.eventKind || "info"), esc(s.event)));
      caption.innerHTML = "<span class=\"anim-stepno\">" + esc(s.label || ("Step " + step)) + "</span> " + esc(s.text);
      drawDots(v);
    }
    function drawDots(v) {
      dots.innerHTML = "";
      v.steps.forEach(function (_, i) {
        var d = el("button", "anim-dot" + (i === step ? " on" : "") + (i < step ? " done" : ""));
        d.type = "button";
        d.title = v.steps[i].label || ("Step " + i);
        d.onclick = function () { stop(); go(i); };
        dots.appendChild(d);
      });
      prev.disabled = step === 0;
      next.disabled = step === v.steps.length - 1;
    }
    draw();
  }

  function init() { document.querySelectorAll("div.anim[data-anim]").forEach(build); }
  // The speed is shared by every animation on the page and remembered in this browser (a convenience only).
  var SPEEDS = [1, 1.5, 2, 3], speed = 2;
  try { var saved = parseFloat(localStorage.getItem("osAnimSpeed")); if (SPEEDS.indexOf(saved) >= 0) speed = saved; } catch (e) {}
  function speedNow() { return speed; }
  function setSpeed(x) {
    speed = x;
    try { localStorage.setItem("osAnimSpeed", String(x)); } catch (e) {}
    Array.prototype.forEach.call(document.querySelectorAll(".anim-speed-btn"), function (b) {
      var on = parseFloat(b.dataset.speed) === x;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  window.OS_ANIM_INIT = init;   // a scenario file loaded after this one calls it, so the order of the files never matters
  if (typeof document$ !== "undefined") document$.subscribe(init);
  else if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
