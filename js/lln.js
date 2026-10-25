/* Law of large numbers: twenty gamblers flip the same coin; their running frequencies converge together. */
(() => {
  const { $, fmt, setText, reduced } = ST;
  const root = $('[data-module="lln"]');
  if (!root) return;

  const GAMBLERS = 20, N = 1000;
  let p = 0.5, paths = [], busy = false;
  const slider = $('#lln-p'), out = $('#lln-p-out');

  const chart = new ST.LineChart($('#lln-chart'), {
    x: [1, N], y: [0, 1], xScale: 'log', yTicks: 4, yFormat: (v) => v.toFixed(2),
    xLabel: 'flips (log scale)', yLabel: 'fraction of heads', label: 'Twenty running frequencies of heads on a log scale of flips',
    minH: 220, maxH: 360,
  });
  for (let g = 0; g < GAMBLERS; g++) chart.addSeries('g' + g, { color: 'var(--blue)', width: 1.5, opacity: 0.55 });
  chart.setReference('p', p, { color: 'var(--green)', label: 'P(heads) = 0.50' });

  function simulate() {
    paths = [];
    for (let g = 0; g < GAMBLERS; g++) {
      const path = []; let h = 0;
      for (let i = 1; i <= N; i++) { h += Math.random() < p ? 1 : 0; path.push([i, h / i]); }
      paths.push(path);
    }
  }
  function spreadAt(k) {
    const vals = paths.map((path) => path[k - 1][1]);
    return [Math.min(...vals), Math.max(...vals)];
  }
  function render(upTo = N) {
    paths.forEach((path, g) => chart.setData('g' + g, path.slice(0, upTo)));
    chart.render();
    const [a, b] = spreadAt(10), [c, d] = spreadAt(100), [e, f] = spreadAt(N);
    setText('lln-10', `${fmt(a, 2)} – ${fmt(b, 2)}`);
    setText('lln-100', `${fmt(c, 2)} – ${fmt(d, 2)}`);
    setText('lln-1000', `${fmt(e, 3)} – ${fmt(f, 3)}`);
  }
  function run() {
    if (busy) return;
    simulate();
    if (reduced) { render(); return; }
    busy = true;
    // reveal the paths progressively along the log axis so the early scatter is visible
    let k = 1; const start = performance.now(), dur = 1800;
    function tick(t) {
      const u = Math.min(1, (t - start) / dur);
      k = Math.max(1, Math.round(Math.pow(N, u)));
      render(k);
      if (u < 1) requestAnimationFrame(tick); else busy = false;
    }
    requestAnimationFrame(tick);
  }

  slider.addEventListener('input', () => {
    p = +slider.value / 100; out.textContent = p.toFixed(2);
    chart.setReference('p', p, { color: 'var(--green)', label: `P(heads) = ${p.toFixed(2)}` });
    chart.render();
  });
  $('#lln-run').addEventListener('click', run);
  simulate(); render();
})();
