/* Probability as area: throw darts at a square, count the ones inside the circle, estimate π. */
(() => {
  const { $, $$, fmt, int, setText, niceCeil, animateSteps } = ST;
  const root = $('[data-module="montecarlo"]');
  if (!root) return;

  const canvas = $('#mc-board');
  const ctx = canvas.getContext('2d');
  let n = 0, inside = 0, busy = false, size = 0, dpr = 1;
  const series = [];
  const css = getComputedStyle(document.documentElement);
  const color = (name) => css.getPropertyValue(name).trim();
  const pending = []; // points thrown since the last paint

  const chart = new ST.LineChart($('#mc-chart'), {
    x: [1, 100], y: [2, 4], xScale: 'log', yTicks: 4, yFormat: (v) => v.toFixed(1),
    xLabel: 'darts (log scale)', yLabel: 'estimate of π', label: 'Running estimate of pi against number of darts',
    minH: 160, maxH: 220,
  });
  chart.addSeries('est', { color: 'var(--blue)', width: 2 });
  chart.setReference('pi', Math.PI, { color: 'var(--green)', label: 'π = 3.1416' });

  function board() {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = color('--surface'); ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = color('--rule'); ctx.lineWidth = 1.5;
    ctx.strokeRect(0.75, 0.75, size - 1.5, size - 1.5);
    ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.fillStyle = color('--green-soft'); ctx.fill();
    ctx.strokeStyle = color('--green'); ctx.stroke();
  }
  function paintPoints(pts) {
    const r = Math.max(1.2, size / 260);
    for (const [x, y, hit] of pts) {
      ctx.fillStyle = hit ? color('--blue') : color('--red');
      ctx.beginPath(); ctx.arc(x * size, y * size, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  const all = [];
  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1; size = rect.width;
    canvas.width = Math.round(size * dpr); canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    board(); paintPoints(all);
  }
  new ResizeObserver(resize).observe(canvas);

  function throwDart() {
    const x = Math.random(), y = Math.random();
    const hit = (x - 0.5) ** 2 + (y - 0.5) ** 2 <= 0.25;
    n++; if (hit) inside++;
    const pt = [x, y, hit]; pending.push(pt); if (all.length < 20000) all.push(pt);
    series.push([n, (4 * inside) / n]);
  }
  function render() {
    paintPoints(pending); pending.length = 0;
    chart.setX([1, niceCeil(n, 100)]).setData('est', series).render();
    const est = n ? (4 * inside) / n : NaN;
    setText('mc-n', int(n)); setText('mc-inside', int(inside));
    setText('mc-ratio', n ? fmt(inside / n, 4) : '–');
    setText('mc-pi', n ? fmt(est, 4) : '–');
    setText('mc-err', n ? fmt(Math.abs(est - Math.PI), 4) : '–');
  }
  $$('[data-darts]', root).forEach((b) => b.addEventListener('click', () => {
    if (busy) return; busy = true;
    animateSteps(+b.dataset.darts, throwDart, render, () => { busy = false; });
  }));
  $('#mc-reset').addEventListener('click', () => { n = 0; inside = 0; series.length = 0; all.length = 0; pending.length = 0; board(); render(); });
  resize(); render();
})();
