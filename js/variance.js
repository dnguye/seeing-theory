/* Variance: draw from a deck of 1–10; the running mean of squared deviations converges to Var(X). */
(() => {
  const { $, $$, fmt, int, setText, niceCeil, animateSteps } = ST;
  const root = $('[data-module="variance"]');
  if (!root) return;

  const deck = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  let n = 0, sqSum = 0, last = null, busy = false;
  const series = [], dots = [];
  const cardsBox = $('#var-cards');
  const drawn = $('#var-drawn');

  cardsBox.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) =>
    `<button type="button" class="card" data-value="${v}" aria-pressed="true" aria-label="Card ${v}, in deck"><span>${v}</span></button>`).join('');
  const cards = $$('.card', cardsBox);

  const chart = new ST.LineChart($('#var-chart'), {
    x: [0, 20], y: [0, 25], yTicks: 5, yFormat: (v) => String(v),
    xLabel: 'draws', yLabel: 'squared deviation (x − μ)²', label: 'Running average of squared deviations against number of draws',
  });
  chart.addSeries('dots', { type: 'dots', color: 'var(--ink-3)', opacity: 0.45 });
  chart.addSeries('avg', { color: 'var(--blue)', width: 2.25 });

  const stats = () => {
    const xs = [...deck];
    const mu = xs.reduce((a, b) => a + b, 0) / xs.length;
    const v = xs.reduce((a, x) => a + (x - mu) ** 2, 0) / xs.length;
    return { mu, v };
  };
  function updateDeck() {
    const { mu, v } = stats();
    setText('var-mu', fmt(mu, 2));
    setText('var-true', fmt(v, 3));
    setText('var-sd', fmt(Math.sqrt(v), 3));
    setText('var-size', int(deck.size));
    cards.forEach((c) => {
      const inDeck = deck.has(+c.dataset.value);
      c.setAttribute('aria-pressed', inDeck);
      c.setAttribute('aria-label', `Card ${c.dataset.value}, ${inDeck ? 'in deck' : 'removed'}`);
    });
    const maxDev = Math.max(...[...deck].map((x) => (x - mu) ** 2), 1);
    chart.setY([0, Math.ceil(maxDev / 5) * 5 || 5]);
    chart.setReference('var', v, { color: 'var(--green)', label: `Var(X) = ${fmt(v, 2)}` });
    render();
  }
  function draw() {
    const xs = [...deck];
    last = xs[ST.randInt(xs.length)];
    const { mu } = stats();
    const d2 = (last - mu) ** 2;
    n++; sqSum += d2;
    series.push([n, sqSum / n]); dots.push([n, d2]);
  }
  function render() {
    chart.setX([0, niceCeil(n)]).setData('avg', series).setData('dots', dots).render();
    setText('var-n', int(n));
    setText('var-avg', n ? fmt(sqSum / n, 3) : '–');
    cards.forEach((c) => c.classList.toggle('is-hit', last !== null && +c.dataset.value === last));
    if (last !== null) {
      const { mu } = stats();
      drawn.innerHTML = `<span class="card card--big"><span>${last}</span></span><span class="drawn-math">(${last} − ${fmt(mu, 2)})² = <strong>${fmt((last - mu) ** 2, 2)}</strong></span>`;
    } else drawn.innerHTML = `<span class="card card--big card--empty"><span>?</span></span><span class="drawn-math">Draw a card to see its squared deviation</span>`;
  }

  cards.forEach((c) => c.addEventListener('click', () => {
    const v = +c.dataset.value;
    if (deck.has(v)) { if (deck.size === 1) return; deck.delete(v); } else deck.add(v);
    // the target changed, so start the running average over
    n = 0; sqSum = 0; last = null; series.length = 0; dots.length = 0;
    updateDeck();
  }));
  $('#var-draw').addEventListener('click', () => { if (busy) return; draw(); render(); });
  $$('[data-draws]', root).forEach((b) => b.addEventListener('click', () => {
    if (busy) return; busy = true;
    animateSteps(+b.dataset.draws, draw, render, () => { busy = false; });
  }));
  $('#var-reset').addEventListener('click', () => { n = 0; sqSum = 0; last = null; series.length = 0; dots.length = 0; render(); });

  updateDeck();
})();
