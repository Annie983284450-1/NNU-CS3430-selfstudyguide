// Every code line of every animation must appear on a page where the animation sits (whitespace and // comments aside).
// node tools/codecheck.js   (run from the site root)
const fs = require('fs'); const { execSync } = require('child_process');
global.window = { OS_ANIMS: {} };
const entries = JSON.parse(execSync(`python3 -c "import json,sys; sys.path.insert(0,'tools'); import make_anims as m; print(json.dumps([(p,n) for p,s,n,w,i in m.ANIMS]))"`).toString());
for (const f of fs.readdirSync('docs/assets/anim').filter(f => f.endsWith('.js') && f !== 'stepper.js')) eval(fs.readFileSync('docs/assets/anim/' + f, 'utf8'));
const pages = {}; for (const [p, n] of entries) (pages[n] = pages[n] || []).push(p);
const norm = s => s.replace(/`/g, '').replace(/\/\/.*$/, '').replace(/\s+/g, ' ').trim();
for (const n of Object.keys(window.OS_ANIMS).sort()) {
  const A = window.OS_ANIMS[n]; if (!pages[n]) { console.log(n.padEnd(11), 'NOT PLACED'); continue; }
  const md = pages[n].map(p => fs.readFileSync('docs/' + p, 'utf8')).join('\n');
  // the page and the week's other pages (an animation on review.md quotes class pages)
  const wk = pages[n][0].split('/')[0]; const all = fs.readdirSync('docs/' + wk).filter(f => f.endsWith('.md')).map(f => fs.readFileSync(`docs/${wk}/${f}`, 'utf8')).join('\n');
  const mdn = (md + '\n' + all).split('\n').map(norm);
  let miss = [];
  for (const c of [A.code || []].concat(A.variants.map(v => v.code || []))) for (const l of c) {
    if (l.added || l.n === null || l.n === undefined) continue; const t = norm(l.text); if (t.length < 4) continue;
    if (!mdn.some(x => x.includes(t))) miss.push(l.n + ': ' + t);
  }
  miss = [...new Set(miss)];
  console.log(n.padEnd(11), pages[n].join(',').padEnd(34), miss.length ? miss.length + ' numbered lines not found as text: ' + miss.slice(0, 4).join(' | ') : 'ok');
}
