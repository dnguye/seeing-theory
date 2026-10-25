/* Expectation: roll a die whose face probabilities you can drag; the sample mean converges to E[X]. */
(() => {
  const { $, $$, svg, fmt, int, setText, niceCeil, animateSteps, dieFaceSVG, rollDie } = ST;
  const root = $('[data-module="expectation"]');
  if (!root) return;

  let probs = [1, 1, 1, 1, 1, 1].map((v) => v / 6);
  let n = 0, sum = 0, last = null, busy = false;
  const series = [];
  const die = $('#exp-die');
  const barsBox = $('#exp-bars');

  const chart = new ST.LineChart($('#exp-chart'), {
    x: [0, 20], y: [1, 6], yTicks: 5, yFormat: (v) => v.toFixed(1),
    xLabel: 'rolls', yLabel: 'sample mean', label: 'Running sample mean of die rolls against number of rolls',
  });
  chart.addSeries('mean', { color: 'var(--blue)', width: 2.25 });

  /* --- draggable probability bars --- */
  const BW = 300, BH = 170, mL = 8, mB = 26, gap = 10;
  const bw = (BW - 2 * mL - gap * 5) / 6;
  const bsvg = svg('svg', { class: 'prob-bars', viewBox: `0 0 ${BW} ${BH}`, role: 'group', 'aria-label': 'Probability of each face; drag a bar to change it' }, barsBox);
  const bars = [], labels = [], hits = [];
  for (let i = 0; i < 6; i++) {
    const x = mL + i * (bw + gap);
    svg('rect', { class: 'prob-track', x, y: 0, width: bw, height: BH - mB, rx: 4 }, bsvg);
    bars.push(svg('rect', { class: 'prob-bar', x, width: bw, rx: 4 }, bsvg));
    const lab = svg('text', { class: 'prob-label', x: x + bw / 2, y: BH - 8, 'text-anchor': 'middle' }, bsvg);
    lab.textContent = String(i + 1); labels.push(lab);
    hits.push(svg('rect', { class: 'prob-hit', x, y: 0, width: bw, height: BH, fill: 'transparent', style: 'cursor: ns-resize; touch-action: none' }, bsvg));
  }
  const valueLabel = svg('text', { class: 'prob-value', 'text-anchor': 'middle' }, bsvg);
  const maxP = () => Math.max(0.5, ...probs);
  function drawBars() {
    const scale = (BH - mB - 14) / maxP();
    probs.forEach((p, i) => {
      const h = p * scale;
      bars[i].setAttribute('y', BH - mB - h);
      bars[i].setAttribute('height', h);
    });
  }
  function setProb(i, v) {
    v = Math.min(0.98, Math.max(0.01, v));
    const oldRest = 1 - probs[i];
    const rest = 1 - v;
    probs = probs.map((p, j) => (j === i ? v : oldRest > 1e-9 ? (p * rest) / oldRest : rest / 5));
  }
  hits.forEach((h, i) => {
    h.addEventListener('pointerdown', (e) => {
      h.setPointerCapture(e.pointerId);
      const move = (ev) => {
        const r = bsvg.getBoundingClientRect();
        const y = ((ev.clientY - r.top) / r.height) * BH;
        const scale = (BH - mB - 14) / maxP();
        setProb(i, (BH - mB - y) / scale);
        valueLabel.setAttribute('x', +bars[i].getAttribute('x') + bw / 2);
        valueLabel.setAttribute('y', Math.max(12, +bars[i].getAttribute('y') - 6));
        valueLabel.textContent = probs[i].toFixed(2);
        drawBars(); update();
      };
      const up = () => { h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); valueLabel.textContent = ''; };
      h.addEventListener('pointermove', move); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
      move(e);
    });
    // keyboard: arrows nudge the bar
    h.setAttribute('tabindex', '0'); h.setAttribute('role', 'slider'); h.setAttribute('aria-label', `Probability of face ${i + 1}`);
    h.addEventListener('keydown', (e) => {
      if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault(); setProb(i, probs[i] + (e.key === 'ArrowUp' ? 0.02 : -0.02)); drawBars(); update();
    });
  });

  const expectation = () => probs.reduce((s, p, i) => s + (i + 1) * p, 0);
  function update() {
    const E = expectation();
    hits.forEach((h, i) => h.setAttribute('aria-valuenow', probs[i].toFixed(2)));
    setText('exp-E', fmt(E, 3));
    $('#exp-formula-values').innerHTML = probs.map((p, i) => `${i + 1}·${p.toFixed(2)}`).join(' + ') + ` = ${fmt(E, 3)}`;
    chart.setReference('E', E, { color: 'var(--green)', label: `E[X] = ${fmt(E, 2)}` });
    render();
  }
  function sample() {
    let u = Math.random(), x = 6;
    for (let i = 0; i < 6; i++) { u -= probs[i]; if (u < 0) { x = i + 1; break; } }
    last = x; n++; sum += x; series.push([n, sum / n]);
  }
  function render() {
    chart.setX([0, niceCeil(n)]).setData('mean', series).render();
    setText('exp-n', int(n));
    setText('exp-mean', n ? fmt(sum / n, 3) : '–');
    if (last !== null) die.innerHTML = dieFaceSVG(last, 96);
  }

  $('#exp-roll').addEventListener('click', () => {
    if (busy) return; busy = true; sample();
    rollDie(die, last, () => { render(); busy = false; });
  });
  $$('[data-rolls]', root).forEach((b) => b.addEventListener('click', () => {
    if (busy) return; busy = true;
    animateSteps(+b.dataset.rolls, sample, render, () => { busy = false; });
  }));
  $('#exp-reset').addEventListener('click', () => { n = 0; sum = 0; last = null; series.length = 0; die.innerHTML = dieFaceSVG(1, 96); render(); });
  $('#exp-fair').addEventListener('click', () => { probs = probs.map(() => 1 / 6); drawBars(); update(); });

  die.innerHTML = dieFaceSVG(1, 96);
  drawBars(); update();
})();
