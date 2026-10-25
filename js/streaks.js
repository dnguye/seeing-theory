/* Streaks: what 200 real flips look like, and a direct test of the gambler's fallacy. */
(() => {
  const { $, $$, fmt, pct, int, setText } = ST;
  const root = $('[data-module="streaks"]');
  if (!root) return;

  const N = 200, BIG = 100000;
  let k = 4, seq = [];
  const strip = $('#streak-strip');

  function longestRun(arr, value) {
    let best = 0, start = -1, cur = 0, curStart = 0;
    arr.forEach((v, i) => {
      if (v === value) { if (cur === 0) curStart = i; cur++; if (cur > best) { best = cur; start = curStart; } }
      else cur = 0;
    });
    return { length: best, start };
  }
  function renderStrip() {
    const run = longestRun(seq, 1);
    strip.innerHTML = seq.map((v, i) => {
      const inRun = i >= run.start && i < run.start + run.length;
      return `<span class="flip ${v ? 'flip--h' : 'flip--t'}${inRun ? ' flip--run' : ''}" title="${v ? 'heads' : 'tails'}"></span>`;
    }).join('');
    strip.setAttribute('aria-label', `${N} coin flips; longest run of heads is ${run.length}`);
    setText('streak-longest', int(run.length));
    setText('streak-longest-any', int(Math.max(run.length, longestRun(seq, 0).length)));
    setText('streak-heads', int(seq.reduce((a, b) => a + b, 0)));
  }
  /* After every run of exactly k heads (or more), how often was the next flip heads? Uses a large hidden sample. */
  function fallacyTest() {
    let run = 0, after = 0, afterHeads = 0;
    for (let i = 0; i < BIG; i++) {
      const v = Math.random() < 0.5 ? 1 : 0;
      if (run >= k) { after++; afterHeads += v; }
      run = v ? run + 1 : 0;
    }
    setText('streak-k', int(k));
    setText('streak-after', int(after));
    setText('streak-after-heads', int(afterHeads));
    setText('streak-after-pct', after ? pct(afterHeads / after, 1) : '–');
  }
  function newSequence() {
    seq = Array.from({ length: N }, () => (Math.random() < 0.5 ? 1 : 0));
    renderStrip();
  }

  $('#streak-new').addEventListener('click', newSequence);
  $$('[data-k]', root).forEach((b) => b.addEventListener('click', () => {
    k = +b.dataset.k;
    $$('[data-k]', root).forEach((x) => x.setAttribute('aria-pressed', x === b));
    fallacyTest();
  }));
  $('#streak-rerun').addEventListener('click', fallacyTest);
  setText('streak-expected', fmt(Math.log2(N), 1));
  newSequence(); fallacyTest();
})();
