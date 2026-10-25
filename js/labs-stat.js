/* Labs for the statistics course: estimation, intervals, tests, categorical data, ANOVA, regression, Bayesian updating. */
(() => {
  const { $, $$, el, svg, fmt, pct, int, sig, niceMax, randInt, animateSteps, ui, labs, LineChart, curve } = ST;
  const S = ST.stats, D = S.D;
  const C = { blue: 'var(--blue)', green: 'var(--green)', gold: 'var(--gold)', red: 'var(--red)', ink: 'var(--ink)', ink3: 'var(--ink-3)' };

  /* =====================================================================
     estimators — bias and variance as a dartboard
     ===================================================================== */
  labs.estimators = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    let bias = 0.8, sd = 0.5, pts = [];
    const W = 360;
    const board = svg('svg', { class: 'board', viewBox: `0 0 ${W} ${W}`, role: 'img', 'aria-label': 'Dartboard: each dot is one estimate; the bullseye is the true value' }, el('div', { class: 'board-wrap' }, stage));
    [1, 0.75, 0.5, 0.25].forEach((r, i) => svg('circle', { cx: W / 2, cy: W / 2, r: (r * W) / 2 - 4, class: 'board-ring' + (i % 2 ? ' board-ring--alt' : '') }, board));
    svg('circle', { cx: W / 2, cy: W / 2, r: 5, fill: C.green }, board);
    const dotsG = svg('g', { fill: C.blue, opacity: 0.7 }, board);
    const meanDot = svg('circle', { r: 6, fill: 'none', stroke: C.red, 'stroke-width': 2.5 }, board);
    ui.legend(stage, [{ swatch: 'green', label: 'True value θ' }, { swatch: 'blue', label: 'One estimate' }, { swatch: 'red-hollow', label: 'Average of the estimates' }]);
    ui.button(controls, 'Take 100 estimates', { kind: 'primary', onClick: () => { pts = []; for (let i = 0; i < 100; i++) pts.push([S.rnorm(bias, sd), S.rnorm(0, sd)]); render(); } });
    ui.button(controls, 'Clear', { kind: 'quiet', onClick: () => { pts = []; render(); } });
    ui.slider(panel, { label: 'Bias of the estimator:', min: 0, max: 2, step: 0.1, value: bias, format: (v) => v.toFixed(1), onInput: (v) => { bias = v; pts = []; render(); } });
    ui.slider(panel, { label: 'Standard deviation of the estimator:', min: 0.1, max: 1.5, step: 0.1, value: sd, format: (v) => v.toFixed(1), onInput: (v) => { sd = v; pts = []; render(); } });
    const R = ui.readouts(panel, [
      { id: 'b2', label: 'Bias²', green: true }, { id: 'v', label: 'Variance', green: true }, { id: 'mse', label: 'MSE = bias² + variance', span: true, green: true },
      { id: 'ob', label: 'Observed bias' }, { id: 'ov', label: 'Observed variance' },
    ]);
    function render() {
      const sc = W / 2 / 2.4;
      dotsG.innerHTML = pts.map(([x, y]) => `<circle cx="${(W / 2 + x * sc).toFixed(1)}" cy="${(W / 2 - y * sc).toFixed(1)}" r="4"/>`).join('');
      if (pts.length) { const mx = S.mean(pts.map((p) => p[0])), my = S.mean(pts.map((p) => p[1])); meanDot.setAttribute('cx', W / 2 + mx * sc); meanDot.setAttribute('cy', W / 2 - my * sc); meanDot.style.display = ''; R.set('ob', fmt(mx, 3)); R.set('ov', fmt(S.variance(pts.map((p) => p[0])), 3)); }
      else { meanDot.style.display = 'none'; R.set('ob', '–'); R.set('ov', '–'); }
      R.set('b2', fmt(bias * bias, 3)); R.set('v', fmt(sd * sd, 3)); R.set('mse', fmt(bias * bias + sd * sd, 3));
    }
    render();
  };

  /* =====================================================================
     likelihood — L(p) for h heads in n flips
     ===================================================================== */
  labs.likelihood = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    let n = 10, h = 7, ptrue = 0.35, logScale = false;
    const chartBox = el('div', { class: 'chart-box' }, stage);
    const chart = new LineChart(chartBox, { minH: 200, maxH: 300, x: [0, 1], xLabel: 'p, the hypothesised probability of heads', yLabel: 'likelihood (relative to its maximum)' });
    chart.addSeries('L', { color: C.gold, width: 2.5 });
    ui.legend(stage, [{ swatch: 'gold', label: 'Likelihood L(p) = p^h (1 − p)^(n − h)' }, { swatch: 'green-dash', label: 'Maximum likelihood estimate, h/n' }]);
    ui.button(controls, 'Flip 10 more (hidden coin)', { kind: 'primary', onClick: () => { const k = S.rbinom(10, ptrue); n += 10; h += k; sn.set(n); sh.input.max = n; sh.set(h); render(); } });
    ui.button(controls, 'Reset', { kind: 'quiet', onClick: () => { n = 10; h = 7; sn.set(n); sh.input.max = n; sh.set(h); render(); } });
    const sn = ui.slider(panel, { label: 'n, flips =', min: 1, max: 200, value: n, onInput: (v) => { n = v; h = Math.min(h, n); sh.input.max = n; sh.set(h); render(); } });
    const sh = ui.slider(panel, { label: 'h, heads observed =', min: 0, max: n, value: h, onInput: (v) => { h = v; render(); } });
    ui.slider(panel, { label: 'Hidden coin’s true p (for the flip button) =', min: 0.05, max: 0.95, step: 0.05, value: ptrue, format: (v) => v.toFixed(2), onInput: (v) => { ptrue = v; } });
    ui.chips(panel, [{ label: 'Likelihood', value: false }, { label: 'Log-likelihood', value: true }], { value: false, label: 'Scale', onChange: (v) => { logScale = v; render(); } });
    const R = ui.readouts(panel, [{ id: 'mle', label: 'MLE p̂ = h / n', green: true }, { id: 'se', label: 'Approx. SE √(p̂(1 − p̂)/n)' }]);
    function render() {
      const mle = h / n;
      const logL = (p) => h * Math.log(p) + (n - h) * Math.log(1 - p);
      const lmax = logL(Math.min(0.999, Math.max(0.001, mle)));
      const pts = curve((p) => (logScale ? logL(p) - lmax : Math.exp(logL(p) - lmax)), 0.002, 0.998, 300);
      chart.setData('L', pts).setY(logScale ? [Math.max(-30, Math.min(...pts.map((q) => q[1]))), 0] : [0, 1.05]);
      chart.o.yLabel = logScale ? 'log-likelihood minus its maximum' : 'likelihood (relative to its maximum)';
      chart.setVRef('mle', mle, { color: C.green, label: `p̂ = ${fmt(mle, 2)}` }).render();
      R.set('mle', fmt(mle, 3)); R.set('se', fmt(Math.sqrt((mle * (1 - mle)) / n), 3));
    }
    render();
  };

  /* =====================================================================
     coverage — 100 confidence intervals at a time
     ===================================================================== */
  labs.coverage = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    const MU = 50, SIG = 10;
    let n = 15, conf = 95, method = 'z', intervals = [], totalN = 0, totalHit = 0;
    el('p', { class: 'stage-label' }, stage).innerHTML = `Population: Normal(μ = ${MU}, σ = ${SIG}). Each bar is one sample’s interval; red ones miss μ.`;
    const box = el('div', { class: 'ci-wrap' }, stage);
    const W = 640, H = 420;
    const g = svg('svg', { class: 'ci-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '100 confidence intervals' }, box);
    const axisG = svg('g', {}, g), barsG = svg('g', {}, g);
    ui.legend(stage, [{ swatch: 'blue', label: 'Interval contains μ' }, { swatch: 'red', label: 'Interval misses μ' }, { swatch: 'green-dash', label: 'True mean μ' }]);
    ui.button(controls, 'Draw 100 samples', { kind: 'primary', onClick: run });
    ui.button(controls, 'Reset tally', { kind: 'quiet', onClick: () => { totalN = 0; totalHit = 0; render(); } });
    ui.slider(panel, { label: 'n, size of each sample =', min: 2, max: 100, value: n, onInput: (v) => { n = v; run(); } });
    ui.slider(panel, { label: 'Confidence level =', min: 50, max: 99, value: conf, format: (v) => v + '%', onInput: (v) => { conf = v; run(); } });
    ui.chips(panel, [{ label: 'z, σ known', value: 'z' }, { label: 't, σ estimated', value: 't' }, { label: 'z with s (wrong for small n)', value: 'zs' }], { value: method, label: 'Interval', onChange: (v) => { method = v; run(); } });
    const R = ui.readouts(panel, [
      { id: 'hit', label: 'Contained μ, this batch' }, { id: 'w', label: 'Average width' },
      { id: 'all', label: 'Contained μ, all batches', span: true, green: true },
    ]);
    function run() {
      intervals = [];
      const q = (1 + conf / 100) / 2;
      const crit = method === 't' ? D.t(n - 1).quantile(q) : D.normal(0, 1).quantile(q);
      for (let i = 0; i < 100; i++) {
        const s = Array.from({ length: n }, () => S.rnorm(MU, SIG)), m = S.mean(s);
        const se = (method === 'z' ? SIG : S.sd(s)) / Math.sqrt(n);
        intervals.push([m - crit * se, m + crit * se]);
      }
      const hit = intervals.filter(([a, b]) => a <= MU && MU <= b).length;
      totalN += 100; totalHit += hit;
      render(hit);
    }
    function render(hit) {
      const lo = MU - 3.2 * SIG, hi = MU + 3.2 * SIG, xs = (v) => 40 + ((v - lo) / (hi - lo)) * (W - 60);
      axisG.innerHTML = `<line x1="${xs(MU)}" x2="${xs(MU)}" y1="6" y2="${H - 22}" stroke="${C.green}" stroke-dasharray="5 4" stroke-width="1.5"/>` +
        [20, 30, 40, 50, 60, 70, 80].map((v) => `<text x="${xs(v)}" y="${H - 6}" text-anchor="middle" class="ci-tick">${v}</text>`).join('');
      const rowH = (H - 34) / 100;
      barsG.innerHTML = intervals.map(([a, b], i) => {
        const ok = a <= MU && MU <= b, y = 8 + i * rowH;
        return `<line x1="${xs(Math.max(lo, a)).toFixed(1)}" x2="${xs(Math.min(hi, b)).toFixed(1)}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${ok ? C.blue : C.red}" stroke-width="${Math.max(1.2, rowH * 0.6).toFixed(1)}" stroke-linecap="round"/>`;
      }).join('');
      R.set('hit', hit === undefined ? '–' : `${hit} / 100`);
      R.set('w', intervals.length ? fmt(S.mean(intervals.map(([a, b]) => b - a)), 2) : '–');
      R.set('all', totalN ? `${pct(totalHit / totalN, 1)} of ${int(totalN)} (target ${conf}%)` : '–');
    }
    run();
  };

  /* =====================================================================
     bootstrap — resampling one sample to see the variability of its mean
     ===================================================================== */
  labs.bootstrap = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    const n = 30; let sample = [], means = [], lastCounts = null, busy = false;
    el('p', { class: 'stage-label', text: 'The one sample we have (n = 30, skewed). Bigger dots were drawn more than once in the latest resample.' }, stage);
    const stripBox = el('div', { class: 'chart-box' }, stage);
    const strip = new LineChart(stripBox, { minH: 90, maxH: 110, margin: { t: 8, r: 18, b: 30, l: 48 }, yTicks: 1, y: [0, 1], xLabel: 'value' });
    strip.addSeries('orig', { type: 'dots', color: C.ink3, opacity: 0.5, r: 4 });
    strip.addSeries('re', { type: 'dots', color: C.blue, opacity: 0.85, r: 5 });
    const histLabel = el('p', { class: 'stage-label' }, stage);
    const histBox = el('div', { class: 'chart-box' }, stage);
    const hist = new LineChart(histBox, { minH: 180, maxH: 240, xLabel: 'bootstrap mean' });
    hist.addSeries('h', { type: 'bars', color: C.blue, opacity: 0.55 });
    ui.legend(stage, [{ swatch: 'blue', label: 'Bootstrap means' }, { swatch: 'green-dash', label: '2.5th and 97.5th percentiles' }, { swatch: 'ink-dash', label: 'Mean of the original sample' }]);
    ui.button(controls, 'Resample once', { kind: 'primary', onClick: () => go(1) });
    ui.button(controls, 'Resample 1,000 times', { onClick: () => go(1000) });
    ui.button(controls, 'New original sample', { kind: 'quiet', onClick: () => { fresh(); } });
    const R = ui.readouts(panel, [
      { id: 'm', label: 'Mean of the sample' }, { id: 'k', label: 'Resamples' },
      { id: 'se', label: 'Bootstrap SE' }, { id: 'se2', label: 'Formula SE, s/√n' },
      { id: 'ci', label: '95% bootstrap percentile interval', span: true, green: true },
    ]);
    function fresh() { sample = Array.from({ length: n }, () => 10 * S.rexp(1)); means = []; lastCounts = null; render(); }
    function go(k) {
      if (busy) return; busy = true;
      animateSteps(k, () => { const c = new Array(n).fill(0); let s = 0; for (let i = 0; i < n; i++) { const j = randInt(n); c[j]++; s += sample[j]; } means.push(s / n); lastCounts = c; }, render, () => { busy = false; });
    }
    function render() {
      const lo = 0, hi = Math.max(...sample) * 1.05;
      strip.setX([lo, hi]).setData('orig', sample.map((v) => [v, 0.5]));
      strip.setData('re', []);
      strip.render();
      if (lastCounts) strip.series.get('re').node.innerHTML = sample.map((v, i) => (lastCounts[i] ? `<circle cx="${strip.xs(v).toFixed(1)}" cy="${strip.ys(0.5).toFixed(1)}" r="${3 + 2 * lastCounts[i]}"/>` : '')).join('');
      const m = S.mean(sample), s = S.sd(sample);
      R.set('m', fmt(m, 2)); R.set('k', int(means.length)); R.set('se2', fmt(s / Math.sqrt(n), 2));
      histLabel.textContent = `Means of ${int(means.length)} resamples`;
      if (means.length > 1) {
        const a = Math.min(...means), b = Math.max(...means), pad = (b - a) * 0.08 || 1;
        const h = S.histogram(means, { min: a - pad, max: b + pad, bins: Math.min(40, Math.max(10, Math.round(Math.sqrt(means.length) * 1.4))) });
        hist.setStyle('h', { barWidth: h.width, barFrac: 1 }).setData('h', h.bars).setX([a - pad, b + pad]).setY([0, niceMax(Math.max(...h.bars.map((x) => x[1])) * 1.1)]);
        const q1 = S.quantileOf(means, 0.025), q2 = S.quantileOf(means, 0.975);
        hist.setVRef('lo', q1, { color: C.green, label: fmt(q1, 1) }).setVRef('hi', q2, { color: C.green, label: fmt(q2, 1) }).setVRef('m', m, { color: C.ink, label: '' });
        R.set('se', fmt(S.sd(means), 2)); R.set('ci', `${fmt(q1, 2)} to ${fmt(q2, 2)}`);
      } else { hist.setData('h', []).setX([m - 5, m + 5]).setY([0, 1]); hist.setVRef('lo', null, {}).setVRef('hi', null, {}).setVRef('m', null, {}); R.set('se', '–'); R.set('ci', '–'); }
      hist.render();
    }
    fresh();
  };

  /* =====================================================================
     pvalue — null distribution, observed statistic, tail area
     ===================================================================== */
  labs.pvalue = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    let z = 1.8, side = 'two', alpha = 0.05;
    const chartBox = el('div', { class: 'chart-box' }, stage);
    const chart = new LineChart(chartBox, { minH: 220, maxH: 320, x: [-4, 4], y: [0, 0.45], xLabel: 'z, the test statistic', yLabel: 'density under H₀' });
    chart.addSeries('rej', { type: 'area', color: C.red, opacity: 0.18 });
    chart.addSeries('rej2', { type: 'area', color: C.red, opacity: 0.18 });
    chart.addSeries('p', { type: 'area', color: C.blue, opacity: 0.45 });
    chart.addSeries('p2', { type: 'area', color: C.blue, opacity: 0.45 });
    chart.addSeries('pdf', { color: C.green, width: 2 });
    const sentence = el('p', { class: 'fallacy-result' }, stage);
    ui.legend(stage, [{ swatch: 'green', label: 'Distribution of z if H₀ is true' }, { swatch: 'blue', label: 'p-value: area at least as extreme as observed' }, { swatch: 'red', label: 'Rejection region for level α' }]);
    ui.slider(panel, { label: 'Observed statistic z =', min: -4, max: 4, step: 0.05, value: z, format: (v) => v.toFixed(2), onInput: (v) => { z = v; render(); } });
    ui.slider(panel, { label: 'Significance level α =', min: 0.01, max: 0.2, step: 0.01, value: alpha, format: (v) => v.toFixed(2), onInput: (v) => { alpha = v; render(); } });
    ui.chips(panel, [{ label: 'Two-sided', value: 'two' }, { label: 'Right-tailed', value: 'right' }, { label: 'Left-tailed', value: 'left' }], { value: side, label: 'Alternative', onChange: (v) => { side = v; render(); } });
    const R = ui.readouts(panel, [{ id: 'p', label: 'p-value', green: true }, { id: 'crit', label: 'Critical value' }, { id: 'dec', label: 'Decision', span: true, text: true }]);
    function render() {
      const N = D.normal(0, 1), pdf = N.pdf, cdf = N.cdf;
      chart.setData('pdf', curve(pdf, -4, 4, 240));
      let p, crit;
      const area = (a, b) => (b > a ? curve(pdf, a, b, 80) : []);
      if (side === 'two') { const az = Math.abs(z); p = 2 * (1 - cdf(az)); crit = N.quantile(1 - alpha / 2); chart.setData('p', area(az, 4)).setData('p2', area(-4, -az)).setData('rej', area(crit, 4)).setData('rej2', area(-4, -crit)); }
      else if (side === 'right') { p = 1 - cdf(z); crit = N.quantile(1 - alpha); chart.setData('p', area(z, 4)).setData('p2', []).setData('rej', area(crit, 4)).setData('rej2', []); }
      else { p = cdf(z); crit = N.quantile(alpha); chart.setData('p', area(-4, z)).setData('p2', []).setData('rej', area(-4, crit)).setData('rej2', []); }
      chart.setVRef('z', z, { color: C.blue, label: `z = ${z.toFixed(2)}` }).render();
      const reject = p < alpha;
      R.set('p', p < 0.0001 ? '< 0.0001' : fmt(p, 4)); R.set('crit', side === 'two' ? `±${fmt(crit, 3)}` : fmt(crit, 3));
      R.set('dec', reject ? `p = ${fmt(p, 4)} < α = ${alpha.toFixed(2)}: reject H₀.` : `p = ${fmt(p, 4)} ≥ α = ${alpha.toFixed(2)}: do not reject H₀.`);
      sentence.innerHTML = `If H₀ were true, a statistic at least this extreme would occur <strong>${pct(p, 2)}</strong> of the time.`;
    }
    render();
  };

  /* =====================================================================
     power — H0 vs H1 sampling distributions, α, β and power
     ===================================================================== */
  labs.power = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    let delta = 0.8, sigma = 1, n = 10, alpha = 0.05;
    const chartBox = el('div', { class: 'chart-box' }, stage);
    const chart = new LineChart(chartBox, { minH: 220, maxH: 320, xLabel: 'sample mean', yLabel: 'density' });
    chart.addSeries('a', { type: 'area', color: C.red, opacity: 0.25 });
    chart.addSeries('pow', { type: 'area', color: C.blue, opacity: 0.3 });
    chart.addSeries('h0', { color: C.green, width: 2 });
    chart.addSeries('h1', { color: C.blue, width: 2 });
    ui.legend(stage, [{ swatch: 'green', label: 'Sample mean if H₀: μ = 0' }, { swatch: 'blue', label: 'Sample mean if H₁: μ = δ' }, { swatch: 'red', label: 'α: rejecting when H₀ is true' }, { swatch: 'blue', label: 'Power: rejecting when H₁ is true' }]);
    ui.slider(panel, { label: 'δ, true effect size =', min: 0, max: 2, step: 0.05, value: delta, format: (v) => v.toFixed(2), onInput: (v) => { delta = v; render(); } });
    ui.slider(panel, { label: 'σ, population SD =', min: 0.5, max: 2, step: 0.1, value: sigma, format: (v) => v.toFixed(1), onInput: (v) => { sigma = v; render(); } });
    ui.slider(panel, { label: 'n, sample size =', min: 2, max: 100, value: n, onInput: (v) => { n = v; render(); } });
    ui.slider(panel, { label: 'α =', min: 0.01, max: 0.2, step: 0.01, value: alpha, format: (v) => v.toFixed(2), onInput: (v) => { alpha = v; render(); } });
    const R = ui.readouts(panel, [{ id: 'crit', label: 'Reject H₀ when mean >' }, { id: 'beta', label: 'β = P(miss the effect)' }, { id: 'pow', label: 'Power = 1 − β', span: true, green: true }]);
    function render() {
      const se = sigma / Math.sqrt(n), crit = D.normal(0, se).quantile(1 - alpha);
      const lo = -3.5 * se, hi = Math.max(delta + 3.5 * se, 3.5 * se);
      const f0 = (x) => S.normPdf(x, 0, se), f1 = (x) => S.normPdf(x, delta, se);
      chart.setData('h0', curve(f0, lo, hi, 240)).setData('h1', curve(f1, lo, hi, 240));
      chart.setData('a', curve(f0, crit, hi, 100)).setData('pow', curve(f1, crit, hi, 100));
      chart.setX([lo, hi]).setY([0, niceMax(f0(0) * 1.1)]).setVRef('c', crit, { color: C.red, label: 'critical value' }).render();
      const power = 1 - S.normCdf(crit, delta, se);
      R.set('crit', fmt(crit, 3)); R.set('beta', fmt(1 - power, 3)); R.set('pow', pct(power, 1));
    }
    render();
  };

  /* =====================================================================
     ttest — two-sample experiments and the distribution of p-values
     ===================================================================== */
  labs.ttest = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    let delta = 0.5, n = 20, pvals = [], busy = false, last = null;
    const dotLabel = el('p', { class: 'stage-label', text: 'The latest experiment: two groups of n, with their means.' }, stage);
    const dotBox = el('div', { class: 'chart-box' }, stage);
    const dots = new LineChart(dotBox, { minH: 120, maxH: 150, margin: { t: 10, r: 18, b: 30, l: 70 }, y: [0.4, 2.6], yTicks: 3, yFormat: (v) => (v === 1 ? 'Control' : v === 2 ? 'Treatment' : ''), xLabel: 'measurement' });
    dots.addSeries('a', { type: 'dots', color: C.ink3, opacity: 0.6, r: 4 });
    dots.addSeries('b', { type: 'dots', color: C.blue, opacity: 0.6, r: 4 });
    dots.addSeries('ma', { type: 'dots', color: C.ink, opacity: 1, r: 6 });
    dots.addSeries('mb', { type: 'dots', color: C.green, opacity: 1, r: 6 });
    const sentence = el('p', { class: 'fallacy-result' }, stage);
    const histLabel = el('p', { class: 'stage-label', text: 'p-values from every experiment so far' }, stage);
    const histBox = el('div', { class: 'chart-box' }, stage);
    const hist = new LineChart(histBox, { minH: 160, maxH: 220, x: [0, 1], xLabel: 'p-value', yLabel: 'fraction of experiments' });
    hist.addSeries('h', { type: 'bars', color: C.blue, opacity: 0.55, barWidth: 0.05, barFrac: 0.95 });
    hist.setVRef('a', 0.05, { color: C.red, label: 'α = 0.05' });
    ui.button(controls, 'Run one experiment', { kind: 'primary', onClick: () => go(1) });
    ui.button(controls, 'Run 1,000 experiments', { onClick: () => go(1000) });
    ui.button(controls, 'Reset', { kind: 'quiet', onClick: () => { pvals = []; last = null; render(); } });
    ui.slider(panel, { label: 'True difference between groups (in SDs) =', min: 0, max: 1.5, step: 0.05, value: delta, format: (v) => v.toFixed(2), onInput: (v) => { delta = v; pvals = []; last = null; render(); } });
    ui.slider(panel, { label: 'n per group =', min: 3, max: 100, value: n, onInput: (v) => { n = v; pvals = []; last = null; render(); } });
    const R = ui.readouts(panel, [{ id: 't', label: 'Latest t statistic' }, { id: 'p', label: 'Latest p-value' }, { id: 'k', label: 'Experiments' }, { id: 'sig', label: 'Fraction with p < 0.05', green: true }]);
    function experiment() {
      const a = Array.from({ length: n }, () => S.rnorm(0, 1)), b = Array.from({ length: n }, () => S.rnorm(delta, 1));
      const ma = S.mean(a), mb = S.mean(b), sp = Math.sqrt((S.variance(a) + S.variance(b)) / 2);
      const t = (mb - ma) / (sp * Math.sqrt(2 / n)), df = 2 * n - 2, p = 2 * (1 - D.t(df).cdf(Math.abs(t)));
      last = { a, b, ma, mb, t, p }; pvals.push(p);
    }
    function go(k) { if (busy) return; busy = true; animateSteps(k, experiment, render, () => { busy = false; }); }
    function render() {
      if (last) {
        const lo = Math.min(-3, ...last.a, ...last.b), hi = Math.max(3 + delta, ...last.a, ...last.b);
        dots.setX([lo, hi]).setData('a', last.a.map((v) => [v, 1 + (Math.random() - 0.5) * 0.3])).setData('b', last.b.map((v) => [v, 2 + (Math.random() - 0.5) * 0.3])).setData('ma', [[last.ma, 1]]).setData('mb', [[last.mb, 2]]);
        R.set('t', fmt(last.t, 3)); R.set('p', fmt(last.p, 4));
        sentence.innerHTML = `Difference in means ${fmt(last.mb - last.ma, 2)}, t = ${fmt(last.t, 2)}, p = <strong>${fmt(last.p, 4)}</strong>: ${last.p < 0.05 ? 'significant at 0.05.' : 'not significant at 0.05.'}`;
      } else { dots.setData('a', []).setData('b', []).setData('ma', []).setData('mb', []); R.set('t', '–'); R.set('p', '–'); sentence.textContent = ''; }
      dots.render();
      const bars = []; for (let i = 0; i < 20; i++) bars.push([i / 20 + 0.025, pvals.filter((p) => p >= i / 20 && p < (i + 1) / 20).length / (pvals.length || 1)]);
      hist.setData('h', bars).setY([0, niceMax(Math.max(0.1, ...bars.map((b) => b[1])) * 1.1)]).render();
      R.set('k', int(pvals.length)); R.set('sig', pvals.length ? pct(pvals.filter((p) => p < 0.05).length / pvals.length, 1) : '–');
    }
    render();
  };

  /* =====================================================================
     gof — chi-square goodness of fit for a die
     ===================================================================== */
  labs.gof = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    let load = 0, n = 120, obs = null, chis = [], busy = false;
    const probs = () => { const p = new Array(6).fill((1 - load) / 6); p[5] += load; return p; };
    const barBox = el('div', { class: 'chart-box' }, stage);
    const bars = new LineChart(barBox, { minH: 180, maxH: 240, x: [0.4, 6.6], xTicksAt: [1, 2, 3, 4, 5, 6], xLabel: 'face', yLabel: 'count' });
    bars.addSeries('obs', { type: 'bars', color: C.blue, opacity: 0.6, barWidth: 1, barFrac: 0.8 });
    bars.addSeries('exp', { type: 'bars', color: C.green, opacity: 1, barWidth: 1, barFrac: 0.25 });
    ui.legend(stage, [{ swatch: 'blue', label: 'Observed counts' }, { swatch: 'green', label: 'Expected counts if the die is fair (n/6)' }]);
    const sentence = el('p', { class: 'fallacy-result' }, stage);
    const histLabel = el('p', { class: 'stage-label', text: 'χ² statistics from repeated experiments, against the χ²(5) curve' }, stage);
    const histBox = el('div', { class: 'chart-box' }, stage);
    const hist = new LineChart(histBox, { minH: 160, maxH: 220, x: [0, 25], xLabel: 'χ² statistic', yLabel: 'density' });
    hist.addSeries('h', { type: 'bars', color: C.blue, opacity: 0.5 });
    hist.addSeries('pdf', { color: C.green, width: 2 });
    hist.setVRef('crit', D.chisq(5).quantile(0.95), { color: C.red, label: 'critical value, α = 0.05' });
    ui.button(controls, 'Roll the die n times', { kind: 'primary', onClick: () => { one(); render(); } });
    ui.button(controls, 'Repeat 1,000 times', { onClick: () => { if (busy) return; busy = true; animateSteps(1000, one, render, () => { busy = false; }); } });
    ui.button(controls, 'Reset', { kind: 'quiet', onClick: () => { obs = null; chis = []; render(); } });
    ui.slider(panel, { label: 'Extra weight on the 6 =', min: 0, max: 0.4, step: 0.02, value: load, format: (v) => v.toFixed(2), onInput: (v) => { load = v; obs = null; chis = []; render(); } });
    ui.slider(panel, { label: 'n, rolls per experiment =', min: 30, max: 1000, step: 10, value: n, onInput: (v) => { n = v; obs = null; chis = []; render(); } });
    const R = ui.readouts(panel, [{ id: 'chi', label: 'χ² = Σ (O − E)² / E' }, { id: 'p', label: 'p-value (df = 5)', green: true }, { id: 'k', label: 'Experiments' }, { id: 'rej', label: 'Rejected fairness at 0.05' }]);
    function one() {
      const p = probs(), o = new Array(6).fill(0);
      for (let i = 0; i < n; i++) { let u = Math.random(), f = 5; for (let k = 0; k < 6; k++) { u -= p[k]; if (u < 0) { f = k; break; } } o[f]++; }
      const e = n / 6; const chi = o.reduce((s, c) => s + ((c - e) ** 2) / e, 0);
      obs = { o, chi, p: 1 - D.chisq(5).cdf(chi) }; chis.push(chi);
    }
    function render() {
      const e = n / 6;
      bars.setData('exp', [1, 2, 3, 4, 5, 6].map((f) => [f, e])).setData('obs', obs ? obs.o.map((c, i) => [i + 1, c]) : []).setY([0, niceMax(Math.max(e * 1.6, ...(obs ? obs.o : [0])) * 1.1)]).render();
      if (obs) { R.set('chi', fmt(obs.chi, 2)); R.set('p', fmt(obs.p, 4)); sentence.innerHTML = `χ² = ${fmt(obs.chi, 2)} with 5 degrees of freedom, p = <strong>${fmt(obs.p, 4)}</strong>: ${obs.p < 0.05 ? 'the counts are unlikely under a fair die.' : 'consistent with a fair die.'}`; }
      else { R.set('chi', '–'); R.set('p', '–'); sentence.textContent = ''; }
      const h = S.histogram(chis, { min: 0, max: 25, bins: 25 });
      hist.setStyle('h', { barWidth: h.width, barFrac: 1 }).setData('h', h.bars).setData('pdf', curve(D.chisq(5).pdf, 0.01, 25, 200)).setY([0, 0.2]).render();
      R.set('k', int(chis.length)); R.set('rej', chis.length ? pct(chis.filter((c) => c > D.chisq(5).quantile(0.95)).length / chis.length, 1) : '–');
    }
    render();
  };

  /* =====================================================================
     independence — 2×2 table and the chi-square test
     ===================================================================== */
  labs.independence = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    let pr = 0.5, p1 = 0.6, p2 = 0.4, n = 200, tab = null;
    const box = el('div', { class: 'table-scroll' }, stage);
    const sentence = el('p', { class: 'fallacy-result' }, stage);
    ui.button(controls, 'Draw a sample of n', { kind: 'primary', onClick: () => { sample(); render(); } });
    ui.slider(panel, { label: 'P(group A) =', min: 0.1, max: 0.9, step: 0.05, value: pr, format: (v) => v.toFixed(2), onInput: (v) => { pr = v; sample(); render(); } });
    ui.slider(panel, { label: 'P(yes | group A) =', min: 0.05, max: 0.95, step: 0.05, value: p1, format: (v) => v.toFixed(2), onInput: (v) => { p1 = v; sample(); render(); } });
    ui.slider(panel, { label: 'P(yes | group B) =', min: 0.05, max: 0.95, step: 0.05, value: p2, format: (v) => v.toFixed(2), onInput: (v) => { p2 = v; sample(); render(); } });
    ui.slider(panel, { label: 'n =', min: 20, max: 2000, step: 10, value: n, onInput: (v) => { n = v; sample(); render(); } });
    const R = ui.readouts(panel, [{ id: 'chi', label: 'χ² statistic' }, { id: 'p', label: 'p-value (df = 1)', green: true }, { id: 'truth', label: 'In truth, group and answer are', span: true, text: true }]);
    function sample() {
      const t = [[0, 0], [0, 0]];
      for (let i = 0; i < n; i++) { const g = Math.random() < pr ? 0 : 1; const y = Math.random() < (g ? p2 : p1) ? 0 : 1; t[g][y]++; }
      tab = t;
    }
    function render() {
      const t = tab, rows = [t[0][0] + t[0][1], t[1][0] + t[1][1]], cols = [t[0][0] + t[1][0], t[0][1] + t[1][1]];
      const E = [[0, 0], [0, 0]]; let chi = 0;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { E[i][j] = (rows[i] * cols[j]) / n; if (E[i][j] > 0) chi += ((t[i][j] - E[i][j]) ** 2) / E[i][j]; }
      const p = 1 - D.chisq(1).cdf(chi);
      const cell = (i, j) => `<td><strong>${t[i][j]}</strong><span class="exp">expected ${fmt(E[i][j], 1)}</span></td>`;
      box.innerHTML = `<table class="joint joint--wide"><thead><tr><th></th><th>Yes</th><th>No</th><th class="marg">Total</th></tr></thead><tbody>
        <tr><th>Group A</th>${cell(0, 0)}${cell(0, 1)}<td class="marg">${rows[0]}</td></tr>
        <tr><th>Group B</th>${cell(1, 0)}${cell(1, 1)}<td class="marg">${rows[1]}</td></tr>
        <tr class="marg-row"><th>Total</th><td class="marg">${cols[0]}</td><td class="marg">${cols[1]}</td><td class="marg">${n}</td></tr></tbody></table>`;
      R.set('chi', fmt(chi, 2)); R.set('p', fmt(p, 4));
      R.set('truth', Math.abs(p1 - p2) < 1e-9 ? 'independent (the two conditional probabilities are equal)' : `dependent: P(yes | A) = ${p1.toFixed(2)} but P(yes | B) = ${p2.toFixed(2)}`);
      sentence.innerHTML = `Observed ${pct(t[0][0] / rows[0], 1)} yes in A versus ${pct(t[1][0] / rows[1], 1)} in B. χ² = ${fmt(chi, 2)}, p = <strong>${fmt(p, 4)}</strong>: ${p < 0.05 ? 'evidence of an association.' : 'no significant association at 0.05.'}`;
    }
    sample(); render();
  };

  /* =====================================================================
     anova — three groups, between vs within, F
     ===================================================================== */
  labs.anova = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    let mu = [0, 0.5, 1], sigma = 1, n = 10, groups = null, fs = [], busy = false;
    const dotBox = el('div', { class: 'chart-box' }, stage);
    const dots = new LineChart(dotBox, { minH: 200, maxH: 260, x: [0.5, 3.5], xTicksAt: [1, 2, 3], xFormat: (v) => 'Group ' + v, xLabel: '', yLabel: 'measurement' });
    dots.addSeries('pts', { type: 'dots', color: C.blue, opacity: 0.5, r: 4 });
    dots.addSeries('means', { type: 'dots', color: C.ink, opacity: 1, r: 7 });
    ui.legend(stage, [{ swatch: 'blue', label: 'Observations' }, { swatch: 'ink', label: 'Group means' }, { swatch: 'green-dash', label: 'Grand mean' }]);
    const sentence = el('p', { class: 'fallacy-result' }, stage);
    el('p', { class: 'stage-label', text: 'F statistics from repeated experiments, against the F(2, 3n − 3) curve' }, stage);
    const histBox = el('div', { class: 'chart-box' }, stage);
    const hist = new LineChart(histBox, { minH: 150, maxH: 200, x: [0, 8], xLabel: 'F statistic', yLabel: 'density' });
    hist.addSeries('h', { type: 'bars', color: C.blue, opacity: 0.5 });
    hist.addSeries('pdf', { color: C.green, width: 2 });
    ui.button(controls, 'New samples', { kind: 'primary', onClick: () => { one(); render(); } });
    ui.button(controls, 'Repeat 1,000 times', { onClick: () => { if (busy) return; busy = true; animateSteps(1000, one, render, () => { busy = false; }); } });
    ui.button(controls, 'Reset', { kind: 'quiet', onClick: () => { fs = []; render(); } });
    mu.forEach((m, i) => ui.slider(panel, { label: `True mean of group ${i + 1} =`, min: -2, max: 2, step: 0.1, value: m, format: (v) => v.toFixed(1), onInput: (v) => { mu[i] = v; fs = []; one(); render(); } }));
    ui.slider(panel, { label: 'σ within each group =', min: 0.3, max: 3, step: 0.1, value: sigma, format: (v) => v.toFixed(1), onInput: (v) => { sigma = v; fs = []; one(); render(); } });
    ui.slider(panel, { label: 'n per group =', min: 3, max: 50, value: n, onInput: (v) => { n = v; fs = []; one(); render(); } });
    const R = ui.readouts(panel, [{ id: 'ssb', label: 'Between-group SS' }, { id: 'ssw', label: 'Within-group SS' }, { id: 'f', label: 'F = (SSB/2) / (SSW/(3n − 3))' }, { id: 'p', label: 'p-value', green: true }, { id: 'rej', label: 'Rejected H₀ at 0.05, all repeats', span: true }]);
    function one() {
      groups = mu.map((m) => Array.from({ length: n }, () => S.rnorm(m, sigma)));
      const means = groups.map(S.mean), grand = S.mean(groups.flat());
      const ssb = n * means.reduce((s, m) => s + (m - grand) ** 2, 0), ssw = groups.reduce((s, g, i) => s + g.reduce((q, v) => q + (v - means[i]) ** 2, 0), 0);
      const f = (ssb / 2) / (ssw / (3 * n - 3)), p = 1 - D.f(2, 3 * n - 3).cdf(f);
      groups.stats = { means, grand, ssb, ssw, f, p }; fs.push(f);
    }
    function render() {
      const st = groups.stats;
      const all = groups.flat(), lo = Math.min(...all) - 0.3, hi = Math.max(...all) + 0.3;
      dots.setY([lo, hi]).setData('pts', groups.flatMap((g, i) => g.map((v) => [i + 1 + (Math.random() - 0.5) * 0.4, v]))).setData('means', st.means.map((m, i) => [i + 1, m]));
      dots.setReference('grand', st.grand, { color: C.green, label: 'grand mean' }).render();
      R.set('ssb', fmt(st.ssb, 2)); R.set('ssw', fmt(st.ssw, 2)); R.set('f', fmt(st.f, 3)); R.set('p', fmt(st.p, 4));
      sentence.innerHTML = `F = ${fmt(st.f, 2)}, p = <strong>${fmt(st.p, 4)}</strong>: ${st.p < 0.05 ? 'at least one group mean differs.' : 'no significant difference among the means.'}`;
      const h = S.histogram(fs, { min: 0, max: 8, bins: 32 });
      hist.setStyle('h', { barWidth: h.width, barFrac: 1 }).setData('h', h.bars).setData('pdf', curve(D.f(2, 3 * n - 3).pdf, 0.02, 8, 200)).setY([0, 1]).setVRef('crit', D.f(2, 3 * n - 3).quantile(0.95), { color: C.red, label: 'critical value' }).render();
      R.set('rej', fs.length ? `${pct(fs.filter((f) => f > D.f(2, 3 * n - 3).quantile(0.95)).length / fs.length, 1)} of ${int(fs.length)}` : '–');
    }
    one(); render();
  };

  /* =====================================================================
     ols — draggable points, least-squares line, residuals and squares
     ===================================================================== */
  labs.ols = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    let pts = [], show = 'residuals', dragging = null;
    const W = 640, H = 420, m = { l: 40, r: 16, t: 16, b: 32 };
    const wrap = el('div', { class: 'ols-wrap' }, stage);
    const g = svg('svg', { class: 'ols', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Scatter plot with draggable points and the least-squares line' }, wrap);
    const gGrid = svg('g', { class: 'chart-grid' }, g), gSq = svg('g', {}, g), gLine = svg('g', {}, g), gPts = svg('g', {}, g), gAxes = svg('g', { class: 'chart-axes' }, g);
    const xs = (x) => m.l + (x / 10) * (W - m.l - m.r), ys = (y) => H - m.b - (y / 10) * (H - m.t - m.b);
    const ix = (px) => ((px - m.l) / (W - m.l - m.r)) * 10, iy = (py) => ((H - m.b - py) / (H - m.t - m.b)) * 10;
    for (let v = 0; v <= 10; v += 2) { svg('line', { x1: xs(v), x2: xs(v), y1: m.t, y2: H - m.b }, gGrid); svg('line', { x1: m.l, x2: W - m.r, y1: ys(v), y2: ys(v) }, gGrid); const tx = svg('text', { x: xs(v), y: H - m.b + 16, 'text-anchor': 'middle' }, gAxes); tx.textContent = v; const ty = svg('text', { x: m.l - 8, y: ys(v), 'text-anchor': 'end', 'dominant-baseline': 'middle' }, gAxes); ty.textContent = v; }
    ui.legend(stage, [{ swatch: 'blue', label: 'Data points (drag them)' }, { swatch: 'green', label: 'Least-squares line' }, { swatch: 'red', label: 'Residuals, or their squares' }]);
    ui.button(controls, 'Add a point', { kind: 'primary', onClick: () => { pts.push([1 + Math.random() * 8, 1 + Math.random() * 8]); render(); } });
    ui.button(controls, 'Reset points', { kind: 'quiet', onClick: () => { seed(); render(); } });
    ui.chips(panel, [{ label: 'Residuals', value: 'residuals' }, { label: 'Squared residuals', value: 'squares' }, { label: 'Nothing', value: 'none' }], { value: show, label: 'Show', onChange: (v) => { show = v; render(); } });
    const R = ui.readouts(panel, [{ id: 'slope', label: 'Slope b₁', green: true }, { id: 'int', label: 'Intercept b₀', green: true }, { id: 'r', label: 'Correlation r' }, { id: 'r2', label: 'R²' }, { id: 'sse', label: 'Sum of squared residuals', span: true }]);
    function seed() { pts = Array.from({ length: 12 }, (_, i) => { const x = 0.8 + (i * 8.4) / 11; return [x, Math.min(9.8, Math.max(0.2, 1.5 + 0.6 * x + S.rnorm(0, 1.1)))]; }); }
    function render() {
      const c = S.corr(pts.map((p) => p[0]), pts.map((p) => p[1]));
      const fit = (x) => c.intercept + c.slope * x;
      gLine.innerHTML = pts.length > 1 ? `<line x1="${xs(0)}" y1="${ys(fit(0))}" x2="${xs(10)}" y2="${ys(fit(10))}" stroke="${C.green}" stroke-width="2.5"/>` : '';
      let sse = 0;
      gSq.innerHTML = pts.map(([x, y]) => {
        const e = y - fit(x); sse += e * e;
        if (show === 'none' || pts.length < 2) return '';
        if (show === 'residuals') return `<line x1="${xs(x)}" y1="${ys(y)}" x2="${xs(x)}" y2="${ys(fit(x))}" stroke="${C.red}" stroke-width="2"/>`;
        const side = Math.abs(ys(y) - ys(fit(x)));
        return `<rect x="${e > 0 ? xs(x) - side : xs(x)}" y="${Math.min(ys(y), ys(fit(x)))}" width="${side}" height="${side}" fill="${C.red}" opacity="0.18" stroke="${C.red}" stroke-width="1"/>`;
      }).join('');
      gPts.innerHTML = pts.map(([x, y], i) => `<circle data-i="${i}" cx="${xs(x)}" cy="${ys(y)}" r="7" fill="${C.blue}" style="cursor:grab"/>`).join('');
      R.set('slope', pts.length > 1 ? fmt(c.slope, 3) : '–'); R.set('int', pts.length > 1 ? fmt(c.intercept, 3) : '–');
      R.set('r', pts.length > 1 ? fmt(c.r, 3) : '–'); R.set('r2', pts.length > 1 ? fmt(c.r * c.r, 3) : '–'); R.set('sse', pts.length > 1 ? fmt(sse, 2) : '–');
    }
    g.addEventListener('pointerdown', (e) => { const t = e.target.closest('circle[data-i]'); if (!t) return; dragging = +t.dataset.i; g.setPointerCapture(e.pointerId); });
    g.addEventListener('pointermove', (e) => {
      if (dragging === null) return;
      const r = g.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W, py = ((e.clientY - r.top) / r.height) * H;
      pts[dragging] = [Math.min(10, Math.max(0, ix(px))), Math.min(10, Math.max(0, iy(py)))]; render();
    });
    const stop = () => { dragging = null; };
    g.addEventListener('pointerup', stop); g.addEventListener('pointercancel', stop);
    g.addEventListener('dblclick', (e) => { const t = e.target.closest('circle[data-i]'); if (t && pts.length > 2) { pts.splice(+t.dataset.i, 1); render(); } });
    seed(); render();
  };

  /* =====================================================================
     slopes — sampling distribution of the fitted slope
     ===================================================================== */
  labs.slopes = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    const B0 = 1, B1 = 0.5, n = 20; let sigma = 1.5, fits = [], last = null, cover = 0, busy = false;
    const scBox = el('div', { class: 'chart-box' }, stage);
    const sc = new LineChart(scBox, { minH: 200, maxH: 260, x: [0, 10], y: [-2, 10], xLabel: 'x', yLabel: 'y' });
    for (let i = 0; i < 60; i++) sc.addSeries('f' + i, { color: C.blue, width: 1, opacity: 0.18 });
    sc.addSeries('true', { color: C.green, width: 2.5, dash: '6 4' });
    sc.addSeries('pts', { type: 'dots', color: C.blue, opacity: 0.8, r: 3.5 });
    sc.addSeries('fit', { color: C.blue, width: 2.5 });
    ui.legend(stage, [{ swatch: 'green-dash', label: 'True line y = 1 + 0.5x' }, { swatch: 'blue', label: 'Latest sample and its fitted line (earlier fits faint)' }]);
    el('p', { class: 'stage-label', text: 'Fitted slopes from every sample so far' }, stage);
    const hBox = el('div', { class: 'chart-box' }, stage);
    const hist = new LineChart(hBox, { minH: 150, maxH: 200, xLabel: 'fitted slope b₁', yLabel: 'density' });
    hist.addSeries('h', { type: 'bars', color: C.blue, opacity: 0.55 });
    hist.addSeries('pdf', { color: C.green, width: 2, dash: '5 4' });
    ui.button(controls, 'Draw a sample and fit', { kind: 'primary', onClick: () => go(1) });
    ui.button(controls, 'Draw 200 and fit', { onClick: () => go(200) });
    ui.button(controls, 'Reset', { kind: 'quiet', onClick: () => { fits = []; last = null; cover = 0; render(); } });
    ui.slider(panel, { label: 'σ, noise around the line =', min: 0.3, max: 3, step: 0.1, value: sigma, format: (v) => v.toFixed(1), onInput: (v) => { sigma = v; fits = []; last = null; cover = 0; render(); } });
    const R = ui.readouts(panel, [{ id: 'b1', label: 'Latest slope b₁' }, { id: 'se', label: 'Its standard error' }, { id: 'ci', label: 'Latest 95% CI for the slope', span: true }, { id: 'k', label: 'Samples' }, { id: 'cov', label: 'CIs containing 0.5', green: true }]);
    function fit() {
      const x = Array.from({ length: n }, () => Math.random() * 10), y = x.map((v) => B0 + B1 * v + S.rnorm(0, sigma));
      const c = S.corr(x, y); const sse = y.reduce((s, v, i) => s + (v - c.intercept - c.slope * x[i]) ** 2, 0);
      const se = Math.sqrt(sse / (n - 2) / c.sxx), t = D.t(n - 2).quantile(0.975);
      last = { x, y, c, se, lo: c.slope - t * se, hi: c.slope + t * se }; fits.push(c); if (last.lo <= B1 && B1 <= last.hi) cover++;
    }
    function go(k) { if (busy) return; busy = true; animateSteps(k, fit, render, () => { busy = false; }); }
    function render() {
      sc.setData('true', [[0, B0], [10, B0 + 10 * B1]]);
      const recent = fits.slice(-60);
      for (let i = 0; i < 60; i++) sc.setData('f' + i, recent[i] ? [[0, recent[i].intercept], [10, recent[i].intercept + 10 * recent[i].slope]] : []);
      sc.setData('pts', last ? last.x.map((v, i) => [v, last.y[i]]) : []).setData('fit', last ? [[0, last.c.intercept], [10, last.c.intercept + 10 * last.c.slope]] : []).render();
      const slopes = fits.map((c) => c.slope);
      const sdTheory = sigma / Math.sqrt((n * 100) / 12); // x uniform on [0,10] has variance 100/12
      const a = B1 - 4 * sdTheory, b = B1 + 4 * sdTheory;
      const h = S.histogram(slopes, { min: a, max: b, bins: 30 });
      hist.setStyle('h', { barWidth: h.width, barFrac: 1 }).setData('h', h.bars).setData('pdf', curve((v) => S.normPdf(v, B1, sdTheory), a, b, 120)).setX([a, b]).setY([0, niceMax(S.normPdf(B1, B1, sdTheory) * 1.2)]).setVRef('t', B1, { color: C.green, label: 'true slope 0.5' }).render();
      R.set('b1', last ? fmt(last.c.slope, 3) : '–'); R.set('se', last ? fmt(last.se, 3) : '–'); R.set('ci', last ? `${fmt(last.lo, 3)} to ${fmt(last.hi, 3)}` : '–');
      R.set('k', int(fits.length)); R.set('cov', fits.length ? `${pct(cover / fits.length, 1)}` : '–');
    }
    render();
  };

  /* =====================================================================
     posterior — Beta prior, coin flips, Beta posterior
     ===================================================================== */
  labs.posterior = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    let a = 2, b = 2, ptrue = 0.7, h = 0, t = 0;
    const chartBox = el('div', { class: 'chart-box' }, stage);
    const chart = new LineChart(chartBox, { minH: 220, maxH: 320, x: [0, 1], xLabel: 'p, probability of heads', yLabel: 'density' });
    chart.addSeries('ci', { type: 'area', color: C.blue, opacity: 0.18 });
    chart.addSeries('prior', { color: C.ink3, width: 2, dash: '5 4' });
    chart.addSeries('lik', { color: C.gold, width: 2 });
    chart.addSeries('post', { color: C.blue, width: 2.5 });
    ui.legend(stage, [{ swatch: 'grey-dash', label: 'Prior Beta(α, β)' }, { swatch: 'gold', label: 'Likelihood of the flips (scaled)' }, { swatch: 'blue', label: 'Posterior Beta(α + h, β + t)' }, { swatch: 'blue', label: 'Shaded: 95% credible interval' }]);
    const sentence = el('p', { class: 'fallacy-result' }, stage);
    ui.button(controls, 'Flip once', { kind: 'primary', onClick: () => flip(1) });
    ui.button(controls, 'Flip 10', { onClick: () => flip(10) });
    ui.button(controls, 'Flip 100', { onClick: () => flip(100) });
    ui.button(controls, 'Forget the flips', { kind: 'quiet', onClick: () => { h = 0; t = 0; render(); } });
    ui.slider(panel, { label: 'Prior α =', min: 0.5, max: 20, step: 0.5, value: a, format: (v) => v.toFixed(1), onInput: (v) => { a = v; render(); } });
    ui.slider(panel, { label: 'Prior β =', min: 0.5, max: 20, step: 0.5, value: b, format: (v) => v.toFixed(1), onInput: (v) => { b = v; render(); } });
    ui.slider(panel, { label: 'The coin’s true p (hidden from the analysis) =', min: 0.05, max: 0.95, step: 0.05, value: ptrue, format: (v) => v.toFixed(2), onInput: (v) => { ptrue = v; } });
    const R = ui.readouts(panel, [{ id: 'hn', label: 'Heads / flips' }, { id: 'mle', label: 'MLE h/n' }, { id: 'pm', label: 'Posterior mean', green: true }, { id: 'ci', label: '95% credible interval', green: true }, { id: 'prior', label: 'Prior mean' }, { id: 'post', label: 'Posterior' }]);
    function flip(k) { const heads = S.rbinom(k, ptrue); h += heads; t += k - heads; render(); }
    function render() {
      const prior = D.beta(a, b), post = D.beta(a + h, b + t);
      const lik = (p) => (h + t ? Math.exp(h * Math.log(p) + t * Math.log(1 - p) - (h * Math.log(h / (h + t) || 1e-300) + t * Math.log(t / (h + t) || 1e-300))) : 0);
      const pp = curve(prior.pdf, 0.002, 0.998, 300), po = curve(post.pdf, 0.002, 0.998, 300);
      const ymax = Math.min(20, Math.max(...po.map((q) => q[1]), ...pp.map((q) => q[1]).filter((v) => v < 20)) * 1.15);
      const lo = post.quantile(0.025), hi = post.quantile(0.975);
      chart.setData('prior', pp).setData('post', po).setData('lik', h + t ? curve((p) => lik(p) * ymax * 0.8, 0.002, 0.998, 300) : []).setData('ci', curve(post.pdf, lo, hi, 120));
      chart.setY([0, niceMax(ymax)]).setVRef('pm', post.mean, { color: C.blue, label: '' }).render();
      R.set('hn', `${h} / ${h + t}`); R.set('mle', h + t ? fmt(h / (h + t), 3) : '–'); R.set('pm', fmt(post.mean, 3)); R.set('ci', `${fmt(lo, 3)} to ${fmt(hi, 3)}`);
      R.set('prior', fmt(prior.mean, 3)); R.set('post', `Beta(${a + h}, ${b + t})`);
      sentence.innerHTML = h + t ? `After ${h} heads and ${t} tails the posterior is Beta(${a + h}, ${b + t}): there is a 95% probability that p lies between <strong>${fmt(lo, 2)}</strong> and <strong>${fmt(hi, 2)}</strong>.` : 'No data yet: the posterior equals the prior.';
    }
    render();
  };
})();
