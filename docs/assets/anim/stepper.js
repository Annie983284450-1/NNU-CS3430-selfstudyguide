// Step-through animations for the self-study pages.
// A page holds <div class="anim" data-anim="NAME"></div> (put there by tools/make_anims.py); the scenario NAME is
// registered by its own file in this folder (window.OS_ANIMS[NAME] = {...}). The reader steps with the buttons or the
// arrow keys; Play steps on its own. Nothing here is needed to read the page: the static figure stays above it.
(function () {
  window.OS_ANIMS = window.OS_ANIMS || {};

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function build(root) {
    if (root.dataset.built) return;
    var A = window.OS_ANIMS[root.dataset.anim];
    if (!A) return;
    root.dataset.built = "1";
    var variant = A.variants[0].key, step = 0, timer = null;

    var head = el("div", "anim-head");
    head.appendChild(el("div", "anim-title", A.title));
    var tabs = el("div", "anim-tabs");
    A.variants.forEach(function (v) {
      var b = el("button", "anim-tab", v.label);
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
    bar.appendChild(prev); bar.appendChild(play); bar.appendChild(next); bar.appendChild(dots); bar.appendChild(reset);
    root.appendChild(bar);
    root.appendChild(el("div", "anim-hint", "Use the buttons, or click here and press ← and →."));
    root.tabIndex = 0;

    function V() { return A.variants.filter(function (v) { return v.key === variant; })[0]; }
    function stop() { if (timer) { clearInterval(timer); timer = null; play.innerHTML = "▶ Play"; } }
    function go(n) { var s = V().steps; step = Math.max(0, Math.min(s.length - 1, n)); draw(); }
    prev.onclick = function () { stop(); go(step - 1); };
    next.onclick = function () { stop(); go(step + 1); };
    reset.onclick = function () { stop(); go(0); };
    play.onclick = function () {
      if (timer) { stop(); return; }
      if (step >= V().steps.length - 1) go(0);
      play.innerHTML = "❚❚ Pause";
      timer = setInterval(function () {
        if (step >= V().steps.length - 1) { stop(); return; }
        go(step + 1);
      }, A.interval || 3200);
    };
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { stop(); go(step + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { stop(); go(step - 1); e.preventDefault(); }
    });

    function draw() {
      var v = V(), s = v.steps[step];
      tabs.querySelectorAll(".anim-tab").forEach(function (b) { b.classList.toggle("on", b.dataset.key === variant); });
      // code, with a marker for each thread on the line it is at
      codeBox.innerHTML = "";
      var code = v.code || A.code;
      code.forEach(function (ln) {
        var row = el("div", "anim-line" + (ln.added ? " anim-added" : ""));
        var marks = el("span", "anim-marks");
        (s.at || []).forEach(function (a) {
          if (a.line === ln.n) {
            var m = el("span", "anim-mark anim-" + a.who.toLowerCase(), a.who);
            marks.appendChild(m);
            row.classList.add("anim-hit", "anim-hit-" + a.who.toLowerCase());
          }
        });
        row.appendChild(marks);
        row.appendChild(el("span", "anim-ln", ln.added ? "+" : String(ln.n)));
        var t = el("span", "anim-src");
        t.textContent = ln.text;
        row.appendChild(t);
        codeBox.appendChild(row);
      });
      // state: the lock's three fields, then the threads, then the event of this step
      right.innerHTML = "";
      var cpu = el("div", "anim-cpu", "<span>CPU runs</span> <b class=\"anim-" + s.cpu.toLowerCase() + "\">" + s.cpu + "</b>" +
                    (s.switching ? " <i>" + s.switching + "</i>" : ""));
      right.appendChild(cpu);
      var fields = el("div", "anim-fields");
      A.fields.forEach(function (f) {
        var val = s.state[f.key], prevS = step > 0 ? v.steps[step - 1].state[f.key] : val;
        var box = el("div", "anim-field" + (JSON.stringify(val) !== JSON.stringify(prevS) ? " anim-changed" : ""));
        box.appendChild(el("div", "anim-fname", f.label));
        var shown = Array.isArray(val) ? (val.length ? val.map(function (x) { return "<span class=\"anim-q anim-" + x.toLowerCase() + "\">" + x + "</span>"; }).join(" ") : "<span class=\"anim-empty\">empty</span>") : String(val);
        box.appendChild(el("div", "anim-fval", shown));
        if (f.note && s.notes && s.notes[f.key]) box.appendChild(el("div", "anim-fnote", s.notes[f.key]));
        fields.appendChild(box);
      });
      right.appendChild(fields);
      var threads = el("div", "anim-threads");
      A.threads.forEach(function (t) {
        var st = s.threads[t];
        var card = el("div", "anim-thread anim-" + t.toLowerCase() + " anim-st-" + st.kind);
        card.appendChild(el("div", "anim-tname", t));
        card.appendChild(el("div", "anim-tstate", st.text));
        threads.appendChild(card);
      });
      right.appendChild(threads);
      if (s.event) right.appendChild(el("div", "anim-event anim-ev-" + (s.eventKind || "info"), s.event));
      caption.innerHTML = "<span class=\"anim-stepno\">" + (s.label || ("Step " + step)) + "</span> " + s.text;
      // dots
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
  if (typeof document$ !== "undefined") document$.subscribe(init);
  else if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
