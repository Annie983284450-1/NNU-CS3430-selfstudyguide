// Turn "[Problem]" etc. in the right-hand contents into the same colored badges the headings use.
(function () {
  var kinds = {problem:'problem', concept:'concept', 'worked example':'example', 'real kernel':'kernel',
               'real machine':'machine', 'check yourself':'check', 'your turn':'check',
               roadmap:'roadmap', summary:'summary', deeper:'deeper'};
  function badge() {
    document.querySelectorAll('.md-nav--secondary a.md-nav__link').forEach(function (a) {
      if (a.dataset.badged) return;
      var m = a.textContent.trim().match(/^([\d.]*)\s*\[([^\]]+)\]\s*([\s\S]*)$/);
      if (!m) return;
      var key = m[2].toLowerCase().replace(/,.*$/, '').trim();
      var cls = kinds[key] || 'deeper';
      a.innerHTML = (m[1] ? '<span class="toc-num">' + m[1] + '</span> ' : '') +
                    '<span class="lbl lbl-' + cls + '">' + m[2].replace(/,.*$/, '') + '</span>' + m[3];
      a.dataset.badged = '1';
    });
  }
  badge();
  if (typeof document$ !== 'undefined') document$.subscribe(badge);
})();

// Exercises and answers: every answer is folded under its exercise in a <details id="answer-N">.
// A link to #answer-N opens that fold before scrolling to it, and a page with folded answers gets
// one "Show all answers / Hide all answers" button under the Exercises heading.
(function () {
  function openFromHash() {
    var m = (location.hash || '').match(/^#(answer-\d+)$/);
    if (!m) return;
    var d = document.getElementById(m[1]);
    if (d && d.tagName === 'DETAILS') { d.open = true; d.scrollIntoView(); }
  }
  function addToggle() {
    var folds = document.querySelectorAll('.md-typeset details.answer');
    if (!folds.length || document.querySelector('.answers-toggle')) return;
    var h = document.getElementById('exercises');
    if (!h) return;
    var p = document.createElement('p');
    p.className = 'answers-toggle';
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'md-button';
    function label() {
      var allOpen = Array.prototype.every.call(folds, function (d) { return d.open; });
      b.textContent = allOpen ? 'Hide all answers' : 'Show all answers';
      return allOpen;
    }
    b.addEventListener('click', function () {
      var allOpen = label();
      folds.forEach(function (d) { d.open = !allOpen; });
      label();
    });
    folds.forEach(function (d) { d.addEventListener('toggle', label); });
    label();
    p.appendChild(b);
    h.parentNode.insertBefore(p, h.nextSibling);
  }
  function run() { addToggle(); openFromHash(); }
  run();
  window.addEventListener('hashchange', openFromHash);
  if (typeof document$ !== 'undefined') document$.subscribe(run);
})();
