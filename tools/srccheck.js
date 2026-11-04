// For animations quoting xv6 code shown as figure images: compare each numbered line with xv6-labs-2025 at that line number.
const fs = require('fs'); global.window = { OS_ANIMS: {} };
const SRC = process.argv[2];
for (const f of fs.readdirSync('docs/assets/anim').filter(f => f.endsWith('.js') && f !== 'stepper.js')) eval(fs.readFileSync('docs/assets/anim/' + f, 'utf8'));
const norm = s => s.replace(/\/\/.*$/, '').replace(/#.*$/, '').replace(/\s+/g, ' ').trim();
const want = { swtch: ['swtch.S'], lazyalloc: ['trap.c', 'vm.c'], ptwalk: ['riscv.h', 'vm.c'], rr: ['proc.c', 'trap.c'], kallocrace: ['kalloc.c'], xv6sleep: ['pipe.c', 'proc.c'] };
for (const [n, files] of Object.entries(want)) {
  const A = window.OS_ANIMS[n]; const src = files.map(f => fs.readFileSync(SRC + '/' + f, 'utf8').split('\n'));
  let bad = [], ok = 0;
  for (const c of [A.code || []].concat(A.variants.map(v => v.code || []))) for (const l of c) {
    if (typeof l.n !== 'number') continue; const t = norm(l.text); if (!t) { ok++; continue; }
    const hit = src.some(s => s[l.n - 1] !== undefined && (norm(s[l.n - 1]) === t || norm(s[l.n - 1]).startsWith(t.replace(/ \.\.\.$/, ''))));
    hit ? ok++ : bad.push(l.n + ': ' + t);
  }
  console.log(n.padEnd(10), ok + ' lines match', bad.length ? '; MISMATCH: ' + [...new Set(bad)].join(' | ') : '');
}
