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
