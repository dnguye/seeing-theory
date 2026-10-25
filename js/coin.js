/* Chance events: flip a (possibly weighted) coin and watch the frequency of heads settle. */
(() => {
  const { $, $$, fmt, pct, int, setText, niceCeil, animateSteps, reduced } = ST;
  const root = $('[data-module="coin"]');
  if (!root) return;

  let p = 0.5, n = 0, heads = 0, last = null;
  const series = []; // [n, proportion]
  const coin = $('.coin', root);
  const slider = $('#coin-p');
  const sliderOut = $('#coin-p-out');
  const countBars = { h: $('#coin-bar-h'), t: $('#coin-bar-t') };
  let busy = false;

  const chart = new ST.LineChart($('#coin-chart'), {
    x: [0, 20], y: [0, 1], yTicks: 4, yFormat: (v) => v.toFixed(2),
    xLabel: 'flips', yLabel: 'fraction of heads', label: 'Running fraction of heads against number of flips',
  });
  chart.addSeries('freq', { color: 'var(--blue)', width: 2.25 });
  chart.setReference('p', p, { color: 'var(--green)', label: 'P(heads) = 0.50' });
  chart.render();

  function flipOnce() {
    last = Math.random() < p ? 1 : 0;
    n++; heads += last;
    series.push([n, heads / n]);
  }
  function render() {
    chart.setX([0, niceCeil(n)]).setData('freq', series).render();
    setText('coin-n', int(n));
    setText('coin-heads', int(heads));
    setText('coin-tails', int(n - heads));
    setText('coin-freq', n ? fmt(heads / n, 3) : '–');
    const hp = n ? heads / n : 0.5;
    countBars.h.style.width = pct(hp, 0);
    countBars.t.style.width = pct(1 - hp, 0);
    countBars.h.textContent = n ? int(heads) : '';
    countBars.t.textContent = n ? int(n - heads) : '';
    if (last !== null) showFace(last);
  }
  function showFace(v) {
    coin.dataset.face = v ? 'heads' : 'tails';
    coin.setAttribute('aria-label', v ? 'Coin showing heads' : 'Coin showing tails');
  }

  $('#coin-flip').addEventListener('click', () => {
    if (busy) return;
    flipOnce();
    if (reduced) { render(); return; }
    busy = true;
    coin.classList.remove('is-flipping'); void coin.offsetWidth; coin.classList.add('is-flipping');
    setTimeout(() => { coin.classList.remove('is-flipping'); render(); busy = false; }, 560);
  });
  $$('[data-flips]', root).forEach((b) => b.addEventListener('click', () => {
    if (busy) return; busy = true;
    animateSteps(+b.dataset.flips, flipOnce, render, () => { busy = false; });
  }));
  $('#coin-reset').addEventListener('click', () => {
    n = 0; heads = 0; last = null; series.length = 0; busy = false;
    coin.dataset.face = 'heads'; coin.setAttribute('aria-label', 'Coin');
    render();
  });
  slider.addEventListener('input', () => {
    p = +slider.value / 100;
    sliderOut.textContent = p.toFixed(2);
    chart.setReference('p', p, { color: 'var(--green)', label: `P(heads) = ${p.toFixed(2)}` });
    render();
  });

  render();
})();
