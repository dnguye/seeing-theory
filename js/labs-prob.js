/* Labs for the probability course: distributions, sets, counting, conditional probability, Bayes, joint, correlation, LLN, CLT. */
(() => {
  const { $, $$, el, svg, fmt, pct, int, sig, niceMax, randInt, animateSteps, ui, labs, LineChart, curve, dieFaceSVG } = ST;
  const S = ST.stats, D = S.D;
  const C = { blue: 'var(--blue)', green: 'var(--green)', gold: 'var(--gold)', red: 'var(--red)', ink: 'var(--ink)', ink3: 'var(--ink-3)' };

  /* =====================================================================
     dist — parametric distribution explorer (PMF/PDF + samples, CDF view)
     ===================================================================== */
  const SPECS = {
    binomial: { params: [{ k: 'n', label: 'n, number of trials', min: 1, max: 60, value: 10 }, { k: 'p', label: 'p, success probability', min: 0.01, max: 0.99, step: 0.01, value: 0.5, d: 2 }],
      make: (v) => D.binomial(v.n, v.p), xLabel: 'k, number of successes', formula: 'P(X = k) = C(n, k) p<sup>k</sup> (1 − p)<sup>n − k</sup>' },
    geometric: { params: [{ k: 'p', label: 'p, success probability', min: 0.02, max: 0.95, step: 0.01, value: 0.3, d: 2 }],
      make: (v) => D.geometric(v.p), xLabel: 'k, trial on which the first success occurs', formula: 'P(X = k) = (1 − p)<sup>k − 1</sup> p' },
    negbinomial: { params: [{ k: 'r', label: 'r, successes wanted', min: 1, max: 10, value: 3 }, { k: 'p', label: 'p, success probability', min: 0.05, max: 0.95, step: 0.01, value: 0.4, d: 2 }],
      make: (v) => D.negbinomial(v.r, v.p), xLabel: 'k, trial on which the r-th success occurs', formula: 'P(X = k) = C(k − 1, r − 1) p<sup>r</sup> (1 − p)<sup>k − r</sup>' },
    poisson: { params: [{ k: 'l', label: 'λ, average rate', min: 0.1, max: 30, step: 0.1, value: 4, d: 1 }],
      make: (v) => D.poisson(v.l), xLabel: 'k, number of events', formula: 'P(X = k) = e<sup>−λ</sup> λ<sup>k</sup> / k!' },
    hypergeometric: { params: [{ k: 'N', label: 'N, population size', min: 5, max: 80, value: 40 }, { k: 'K', label: 'K, successes in population', min: 0, max: 80, value: 15 }, { k: 'n', label: 'n, draws without replacement', min: 1, max: 80, value: 10 }],
      make: (v) => D.hypergeometric(v.N, Math.min(v.K, v.N), Math.min(v.n, v.N)), xLabel: 'k, successes among the draws', formula: 'P(X = k) = C(K, k) C(N − K, n − k) / C(N, n)' },
    dicesum: { params: [{ k: 'k', label: 'number of dice', min: 1, max: 10, value: 2 }],
      make: (v) => D.dicesum(v.k), xLabel: 'sum of the dice', formula: 'P(S = s) found by convolution: add one die at a time' },
    uniform: { params: [{ k: 'a', label: 'a, lower end', min: -5, max: 5, step: 0.5, value: 0, d: 1 }, { k: 'b', label: 'b, upper end', min: -4, max: 10, step: 0.5, value: 1, d: 1 }],
      make: (v) => D.uniform(v.a, Math.max(v.a + 0.5, v.b)), xLabel: 'x', formula: 'f(x) = 1 / (b − a) for a ≤ x ≤ b' },
    exponential: { params: [{ k: 'l', label: 'λ, rate', min: 0.1, max: 5, step: 0.1, value: 1, d: 1 }],
      make: (v) => D.exponential(v.l), xLabel: 'x, waiting time', formula: 'f(x) = λ e<sup>−λx</sup> for x ≥ 0' },
    normal: { params: [{ k: 'mu', label: 'μ, mean', min: -5, max: 5, step: 0.1, value: 0, d: 1 }, { k: 'sd', label: 'σ, standard deviation', min: 0.2, max: 3, step: 0.1, value: 1, d: 1 }],
      make: (v) => D.normal(v.mu, v.sd), xLabel: 'x', formula: 'f(x) = (1 / σ√2π) exp(−(x − μ)² / 2σ²)', fixedX: [-8, 8] },
    gamma: { params: [{ k: 'k', label: 'k, shape', min: 0.5, max: 10, step: 0.5, value: 2, d: 1 }, { k: 'th', label: 'θ, scale', min: 0.5, max: 3, step: 0.5, value: 1, d: 1 }],
      make: (v) => D.gamma(v.k, v.th), xLabel: 'x', formula: 'f(x) = x<sup>k − 1</sup> e<sup>−x/θ</sup> / (Γ(k) θ<sup>k</sup>)' },
    beta: { params: [{ k: 'a', label: 'α', min: 0.5, max: 10, step: 0.5, value: 2, d: 1 }, { k: 'b', label: 'β', min: 0.5, max: 10, step: 0.5, value: 5, d: 1 }],
      make: (v) => D.beta(v.a, v.b), xLabel: 'x', formula: 'f(x) = x<sup>α − 1</sup> (1 − x)<sup>β − 1</sup> / B(α, β)' },
    t: { params: [{ k: 'df', label: 'degrees of freedom', min: 1, max: 30, value: 3 }],
      make: (v) => D.t(v.df), xLabel: 't', formula: 'heavier tails than the normal; approaches it as df grows', fixedX: [-5, 5] },
    chisq: { params: [{ k: 'df', label: 'degrees of freedom', min: 1, max: 20, value: 3 }],
      make: (v) => D.chisq(v.df), xLabel: 'x', formula: 'the distribution of a sum of df squared standard normals' },
    f: { params: [{ k: 'd1', label: 'numerator df', min: 1, max: 30, value: 5 }, { k: 'd2', label: 'denominator df', min: 1, max: 30, value: 10 }],
      make: (v) => D.f(v.d1, v.d2), xLabel: 'x', formula: 'the ratio of two scaled χ² variables' },
  };

  labs.dist = (root, cfg) => {
    const spec = SPECS[cfg.dist];
    if (!spec) return;
    const { stage, panel, controls } = ui.lab(root);
    const title = el('p', { class: 'stage-label' }, stage);
    const chartBox = el('div', { class: 'chart-box' }, stage);
    const legendBox = el('div', {}, stage);
    const formula = el('p', { class: 'formula-live' }, stage, spec.formula);

    let dist, samples = [], last = null, view = 'density', busy = false;
    const vals = {};
    const overlay = cfg.overlay === 'normal';
    const chart = new LineChart(chartBox, { minH: 200, maxH: 300, xLabel: spec.xLabel, yLabel: '' });
    chart.addSeries('sample', { type: 'bars', color: C.blue, opacity: 0.5 });
    chart.addSeries('theoryBars', { type: 'bars', color: C.green, barFrac: 0.28, opacity: 1 });
    chart.addSeries('theory', { color: C.green, width: 2.25 });
    chart.addSeries('ecdf', { color: C.blue, width: 2 });
    if (overlay) chart.addSeries('overlay', { color: C.ink, width: 1.5, dash: '4 4', opacity: 0.7 });

    ui.button(controls, 'Sample once', { kind: 'primary', onClick: () => go(1) });
    ui.button(controls, 'Sample 100', { onClick: () => go(100) });
    ui.button(controls, 'Sample 1,000', { onClick: () => go(1000) });
    ui.button(controls, 'Reset', { kind: 'quiet', onClick: () => { samples = []; last = null; render(); } });
    const sliders = spec.params.map((p) => {
      vals[p.k] = p.value;
      return ui.slider(panel, { label: p.label + ' =', min: p.min, max: p.max, step: p.step || 1, value: p.value, format: (v) => v.toFixed(p.d || 0), onInput: (v) => { vals[p.k] = v; rebuild(); } });
    });
    ui.chips(panel, [{ label: 'Distribution', value: 'density' }, { label: 'Cumulative (CDF)', value: 'cdf' }], { value: 'density', label: 'View', onChange: (v) => { view = v; render(); } });
    const R = ui.readouts(panel, [
      { id: 'n', label: 'Samples' }, { id: 'last', label: 'Last value' },
      { id: 'mean', label: 'Sample mean' }, { id: 'var', label: 'Sample variance' },
      { id: 'tmean', label: 'E[X]', green: true }, { id: 'tvar', label: 'Var(X)', green: true },
    ]);

    function rebuild() { dist = spec.make(vals); samples = []; last = null; title.textContent = dist.name; render(); }
    function go(k) {
      if (busy) return; busy = true;
      animateSteps(k, () => { last = dist.sample(); samples.push(last); }, render, () => { busy = false; });
    }
    function render() {
      const disc = dist.kind === 'discrete';
      const [lo, hi] = spec.fixedX || dist.support;
      legendBox.innerHTML = '';
      if (view === 'density') {
        if (disc) {
          const theory = []; for (let k = lo; k <= hi; k++) theory.push([k, dist.pmf(k)]);
          chart.setData('theoryBars', theory).setData('theory', []).setData('ecdf', []);
          chart.setData('sample', S.countsOver(samples, lo, hi));
          chart.setStyle('sample', { barWidth: 1 }); chart.setStyle('theoryBars', { barWidth: 1 });
          chart.setX([lo - 0.6, hi + 0.6]).setY([0, niceMax(Math.max(...theory.map((t) => t[1])) * 1.15)]);
          chart.o.xTicksAt = hi - lo <= 12 ? theory.map((t) => t[0]) : undefined;
          if (overlay) chart.setData('overlay', curve((x) => S.normPdf(x, dist.mean, Math.sqrt(dist.variance)), lo - 0.5, hi + 0.5, 240));
          ui.legend(legendBox, [{ swatch: 'green', label: 'Theory, P(X = k)' }, { swatch: 'blue', label: 'Proportion of samples' }, ...(overlay ? [{ swatch: 'ink-dash', label: 'Normal with the same mean and variance' }] : [])]);
        } else {
          const pts = curve((x) => dist.pdf(x), lo + (hi - lo) / 600, hi, 300);
          const ys = pts.map((p) => p[1]).filter(Number.isFinite).sort((a, b) => a - b);
          const cap = Math.min(ys[ys.length - 1], 3.5 * ys[Math.floor(ys.length * 0.9)] + 1e-9);
          const h = S.histogram(samples, { min: lo, max: hi, bins: 40 });
          chart.setData('theory', pts).setData('theoryBars', []).setData('ecdf', []);
          chart.setData('sample', h.bars); chart.setStyle('sample', { barWidth: h.width, barFrac: 1 });
          chart.o.xTicksAt = undefined;
          chart.setX([lo, hi]).setY([0, niceMax(Math.max(cap, ...h.bars.map((b) => Math.min(b[1], cap * 1.4))) * 1.1)]);
          if (overlay) chart.setData('overlay', curve((x) => S.normPdf(x, 0, 1), lo, hi, 240));
          ui.legend(legendBox, [{ swatch: 'green', label: 'Density f(x)' }, { swatch: 'blue', label: 'Histogram of samples' }, ...(overlay ? [{ swatch: 'ink-dash', label: 'Standard normal' }] : [])]);
        }
        chart.setVRef('mean', Number.isFinite(dist.mean) ? dist.mean : null, { color: C.green, label: 'E[X]' });
      } else {
        const pts = [];
        if (disc) { for (let k = lo; k <= hi; k++) { pts.push([k - 1 + 1e-9, dist.cdf(k - 1)], [k, dist.cdf(k)]); } pts.unshift([lo - 0.6, 0]); pts.push([hi + 0.6, 1]); }
        else pts.push(...curve((x) => dist.cdf(x), lo, hi, 300));
        const sorted = [...samples].sort((a, b) => a - b), ecdf = [];
        sorted.forEach((v, i) => { ecdf.push([v, i / sorted.length], [v, (i + 1) / sorted.length]); });
        if (sorted.length) { ecdf.unshift([disc ? lo - 0.6 : lo, 0]); ecdf.push([disc ? hi + 0.6 : hi, 1]); }
        chart.setData('theory', pts).setData('theoryBars', []).setData('sample', []).setData('ecdf', ecdf);
        if (overlay) chart.setData('overlay', []);
        chart.o.xTicksAt = disc && hi - lo <= 12 ? Array.from({ length: hi - lo + 1 }, (_, i) => lo + i) : undefined;
        chart.setX(disc ? [lo - 0.6, hi + 0.6] : [lo, hi]).setY([0, 1]);
        chart.setVRef('mean', null, {});
        ui.legend(legendBox, [{ swatch: 'green', label: 'Theory, F(x) = P(X ≤ x)' }, { swatch: 'blue', label: 'Empirical CDF of samples' }]);
      }
      chart.render();
      R.set('n', int(samples.length)); R.set('last', last === null ? '–' : sig(last, 4));
      R.set('mean', samples.length ? sig(S.mean(samples), 4) : '–'); R.set('var', samples.length > 1 ? sig(S.variance(samples), 4) : '–');
      R.set('tmean', Number.isFinite(dist.mean) ? sig(dist.mean, 4) : 'undefined'); R.set('tvar', Number.isFinite(dist.variance) ? sig(dist.variance, 4) : 'undefined');
    }
    rebuild();
  };


  /* =====================================================================
     area — probability as area under a density: P(a ≤ X ≤ b) = F(b) − F(a)
     ===================================================================== */
  labs.area = (root, cfg) => {
    const { stage, panel, controls } = ui.lab(root);
    const OPTS = {
      normal: { label: 'Normal(0, 1)', make: () => D.normal(0, 1), range: [-4, 4], a: -1, b: 1, step: 0.05 },
      exp: { label: 'Exponential(1)', make: () => D.exponential(1), range: [0, 6], a: 0.5, b: 2, step: 0.05 },
      unif: { label: 'Uniform(0, 1)', make: () => D.uniform(0, 1), range: [0, 1], a: 0.2, b: 0.7, step: 0.01 },
    };
    const keys = (cfg.dists || 'normal,exp,unif').split(',');
    let which = keys[0], a = OPTS[which].a, b = OPTS[which].b;
    const pdfBox = el('div', { class: 'chart-box' }, stage);
    const pdf = new LineChart(pdfBox, { minH: 190, maxH: 260, xLabel: 'x', yLabel: 'density f(x)' });
    pdf.addSeries('area', { type: 'area', color: C.blue, opacity: 0.35 });
    pdf.addSeries('f', { color: C.green, width: 2.25 });
    const cdfLabel = el('p', { class: 'stage-label', text: 'The same probability on the cumulative distribution function: the rise of F between a and b.' }, stage);
    const cdfBox = el('div', { class: 'chart-box' }, stage);
    const cdf = new LineChart(cdfBox, { minH: 160, maxH: 220, y: [0, 1], xLabel: 'x', yLabel: 'F(x) = P(X ≤ x)' });
    cdf.addSeries('F', { color: C.green, width: 2.25 });
    cdf.addSeries('rise', { color: C.blue, width: 3 });
    ui.legend(stage, [{ swatch: 'green', label: 'Density / CDF' }, { swatch: 'blue', label: 'P(a ≤ X ≤ b)' }]);
    if (keys.length > 1) ui.chips(panel, keys.map((k) => ({ label: OPTS[k].label, value: k })), { value: which, label: 'Distribution', onChange: (v) => { which = v; a = OPTS[v].a; b = OPTS[v].b; resetSliders(); render(); } });
    const sa = ui.slider(panel, { label: 'a =', min: OPTS[which].range[0], max: OPTS[which].range[1], step: OPTS[which].step, value: a, format: (v) => v.toFixed(2), onInput: (v) => { a = v; if (b < a) { b = a; sb.set(b); } render(); } });
    const sb = ui.slider(panel, { label: 'b =', min: OPTS[which].range[0], max: OPTS[which].range[1], step: OPTS[which].step, value: b, format: (v) => v.toFixed(2), onInput: (v) => { b = v; if (a > b) { a = b; sa.set(a); } render(); } });
    const quick = el('div', {}, panel);
    const R = ui.readouts(panel, [{ id: 'fa', label: 'F(a)' }, { id: 'fb', label: 'F(b)' }, { id: 'p', label: 'P(a ≤ X ≤ b) = F(b) − F(a)', span: true, green: true }, { id: 'pt', label: 'P(X = a) exactly', span: true, text: true }]);
    function resetSliders() { for (const s of [sa, sb]) { s.input.min = OPTS[which].range[0]; s.input.max = OPTS[which].range[1]; s.input.step = OPTS[which].step; } sa.set(a); sb.set(b); quick.innerHTML = ''; if (which === 'normal') ui.chips(quick, [{ label: 'μ ± σ', value: 1 }, { label: 'μ ± 2σ', value: 2 }, { label: 'μ ± 3σ', value: 3 }], { label: 'Empirical rule', onChange: (k) => { a = -k; b = k; sa.set(a); sb.set(b); render(); } }); }
    function render() {
      const d = OPTS[which].make(), [lo, hi] = OPTS[which].range;
      const pts = curve(d.pdf, lo + 1e-6, hi, 300);
      pdf.setData('f', pts).setData('area', b > a ? curve(d.pdf, a + 1e-9, b, 120) : []).setX([lo, hi]).setY([0, niceMax(Math.max(...pts.map((q) => q[1])) * 1.15)]);
      pdf.setVRef('a', a, { color: C.blue, label: `a = ${a.toFixed(2)}` }).setVRef('b', b, { color: C.blue, label: `b = ${b.toFixed(2)}` }).render();
      cdf.setData('F', curve(d.cdf, lo, hi, 300)).setData('rise', [[a, d.cdf(a)], [b, d.cdf(a)], [b, d.cdf(b)]]).setX([lo, hi]);
      cdf.setReference('fa', d.cdf(a), { color: C.blue, label: '' }).setReference('fb', d.cdf(b), { color: C.blue, label: '' }).render();
      R.set('fa', fmt(d.cdf(a), 4)); R.set('fb', fmt(d.cdf(b), 4)); R.set('p', fmt(d.cdf(b) - d.cdf(a), 4)); R.set('pt', '0. A single point has no width, so no area.');
    }
    resetSliders(); render();
  };

  /* =====================================================================
     sets — a 10×10 sample space with events A and B
     ===================================================================== */
  labs.sets = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    el('p', { class: 'stage-label', text: 'A sample space of 100 equally likely outcomes. Tap a region name to highlight it.' }, stage);
    const grid = el('div', { class: 'cell-grid', role: 'img' }, stage);
    const cells = Array.from({ length: 100 }, () => el('span', { class: 'cell' }, grid));
    const legend = ui.legend(stage, [{ swatch: 'blue', label: 'A only' }, { swatch: 'gold', label: 'B only' }, { swatch: 'green', label: 'A ∩ B' }, { swatch: 'grey', label: 'neither' }]);
    let a = 40, b = 30, ab = 12, region = 'union', picks = 0, hits = 0, lastPick = null;
    const REG = {
      A: { label: 'A', test: (i) => inA(i), formula: 'P(A)' },
      B: { label: 'B', test: (i) => inB(i), formula: 'P(B)' },
      inter: { label: 'A ∩ B', test: (i) => inA(i) && inB(i), formula: 'P(A ∩ B)' },
      union: { label: 'A ∪ B', test: (i) => inA(i) || inB(i), formula: 'P(A) + P(B) − P(A ∩ B)' },
      Ac: { label: 'Aᶜ', test: (i) => !inA(i), formula: '1 − P(A)' },
      AnotB: { label: 'A ∩ Bᶜ', test: (i) => inA(i) && !inB(i), formula: 'P(A) − P(A ∩ B)' },
    };
    const inA = (i) => i < a;
    const inB = (i) => i >= a - ab && i < a - ab + b;
    ui.button(controls, 'Pick a random outcome', { kind: 'primary', onClick: () => pick(1) });
    ui.button(controls, 'Pick 100', { onClick: () => pick(100) });
    ui.button(controls, 'Pick 1,000', { onClick: () => pick(1000) });
    ui.button(controls, 'Reset picks', { kind: 'quiet', onClick: () => { picks = 0; hits = 0; lastPick = null; render(); } });
    const sA = ui.slider(panel, { label: 'Size of A:', min: 0, max: 100, value: a, format: (v) => v + ' outcomes', onInput: (v) => { a = v; clamp(); } });
    const sB = ui.slider(panel, { label: 'Size of B:', min: 0, max: 100, value: b, format: (v) => v + ' outcomes', onInput: (v) => { b = v; clamp(); } });
    const sAB = ui.slider(panel, { label: 'Overlap A ∩ B:', min: 0, max: 100, value: ab, format: (v) => v + ' outcomes', onInput: (v) => { ab = v; clamp(); } });
    const chips = ui.chips(panel, Object.entries(REG).map(([k, r]) => ({ label: r.label, value: k })), { value: region, label: 'Region', onChange: (v) => { region = v; picks = 0; hits = 0; lastPick = null; render(); } });
    const R = ui.readouts(panel, [
      { id: 'pa', label: 'P(A)' }, { id: 'pb', label: 'P(B)' }, { id: 'pab', label: 'P(A ∩ B)' }, { id: 'pu', label: 'P(A ∪ B)' },
      { id: 'sel', label: 'Selected region', span: true, text: true, green: true },
      { id: 'picks', label: 'Picks' }, { id: 'hits', label: 'Landed in region' }, { id: 'obs', label: 'Observed fraction', span: true },
    ]);
    function clamp() {
      const lo = Math.max(0, a + b - 100), hi = Math.min(a, b);
      ab = Math.min(hi, Math.max(lo, ab));
      sAB.set(ab); sAB.input.min = lo; sAB.input.max = hi;
      picks = 0; hits = 0; lastPick = null; render();
    }
    function pick(k) {
      animateSteps(k, () => { lastPick = randInt(100); picks++; if (REG[region].test(lastPick)) hits++; }, render);
    }
    function render() {
      const test = REG[region].test;
      cells.forEach((c, i) => {
        c.className = 'cell ' + (inA(i) && inB(i) ? 'cell--both' : inA(i) ? 'cell--a' : inB(i) ? 'cell--b' : 'cell--none') + (test(i) ? ' cell--sel' : '') + (i === lastPick ? ' cell--hit' : '');
      });
      const sel = cells.filter((_, i) => test(i)).length;
      R.set('pa', fmt(a / 100, 2)); R.set('pb', fmt(b / 100, 2)); R.set('pab', fmt(ab / 100, 2)); R.set('pu', `${fmt((a + b - ab) / 100, 2)}`);
      R.set('sel', `${REG[region].label} = ${REG[region].formula} = ${fmt(sel / 100, 2)}`);
      R.set('picks', int(picks)); R.set('hits', int(hits)); R.set('obs', picks ? fmt(hits / picks, 3) : '–');
    }
    clamp();
  };

  /* =====================================================================
     counting — permutations and combinations, enumerated
     ===================================================================== */
  labs.counting = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    let n = 5, k = 3, ordered = false, highlight = 0;
    const tokensBox = el('div', { class: 'tokens' }, stage);
    const listLabel = el('p', { class: 'stage-label' }, stage);
    const list = el('div', { class: 'enum-list' }, stage);
    ui.button(controls, 'Highlight another', { kind: 'primary', onClick: () => { highlight = randInt(total()); render(); } });
    ui.slider(panel, { label: 'n, items to choose from:', min: 1, max: 8, value: n, onInput: (v) => { n = v; k = Math.min(k, n); sk.input.max = n; sk.set(k); highlight = 0; render(); } });
    const sk = ui.slider(panel, { label: 'k, items chosen:', min: 0, max: n, value: k, onInput: (v) => { k = v; highlight = 0; render(); } });
    ui.chips(panel, [{ label: 'Order matters (permutations)', value: true }, { label: 'Order ignored (combinations)', value: false }], { value: ordered, onChange: (v) => { ordered = v; highlight = 0; render(); } });
    const R = ui.readouts(panel, [
      { id: 'fact', label: 'n! = arrangements of all n' }, { id: 'perm', label: 'n!/(n − k)!, ordered' },
      { id: 'comb', label: 'n!/(k!(n − k)!), unordered', span: true, green: true },
    ]);
    const total = () => (ordered ? S.permutations(n, k) : S.choose(n, k));
    function enumerate(limit) {
      const out = []; const items = Array.from({ length: n }, (_, i) => i + 1);
      const rec = (chosen, avail) => {
        if (out.length >= limit) return;
        if (chosen.length === k) { out.push(chosen); return; }
        for (let i = 0; i < avail.length; i++) {
          const next = ordered ? [...avail.slice(0, i), ...avail.slice(i + 1)] : avail.slice(i + 1);
          rec([...chosen, avail[i]], next);
        }
      };
      rec([], items); return out;
    }
    function render() {
      const tot = total(), shown = enumerate(Math.min(tot, 120));
      const chosen = shown[highlight] || [];
      tokensBox.innerHTML = Array.from({ length: n }, (_, i) => `<span class="token${chosen.includes(i + 1) ? ' token--on' : ''}">${i + 1}</span>`).join('');
      listLabel.textContent = tot <= 120 ? `All ${int(tot)} ${ordered ? 'ordered arrangements' : 'selections'} of ${k} from ${n}:` : `The first 120 of ${int(tot)} ${ordered ? 'ordered arrangements' : 'selections'}:`;
      list.innerHTML = shown.map((s, i) => `<span class="enum${i === highlight ? ' enum--on' : ''}">${s.join(ordered ? ' ' : ' ')}</span>`).join('') + (tot > 120 ? `<span class="enum enum--more">… and ${int(tot - 120)} more</span>` : '');
      R.set('fact', int(S.factorial(n))); R.set('perm', int(S.permutations(n, k))); R.set('comb', int(S.choose(n, k)));
    }
    render();
  };

  /* =====================================================================
     conditional — two dice, P(A | B) on a 6×6 grid
     ===================================================================== */
  labs.conditional = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    const EV = {
      sum7: { label: 'sum is 7', test: (x, y) => x + y === 7 }, sum10: { label: 'sum ≥ 10', test: (x, y) => x + y >= 10 },
      dbl: { label: 'doubles', test: (x, y) => x === y }, first6: { label: 'first die is 6', test: (x) => x === 6 },
      any6: { label: 'at least one 6', test: (x, y) => x === 6 || y === 6 }, even: { label: 'sum is even', test: (x, y) => (x + y) % 2 === 0 },
      firstlow: { label: 'first die ≤ 2', test: (x) => x <= 2 }, all: { label: 'anything', test: () => true },
    };
    let A = 'sum7', B = 'first6', rolls = 0, nB = 0, nAB = 0, last = null;
    el('p', { class: 'stage-label', text: 'All 36 outcomes (first die down, second die across). Faded cells are ruled out by the condition B.' }, stage);
    const grid = el('div', { class: 'dice-grid', role: 'img' }, stage);
    const cells = [];
    for (let x = 1; x <= 6; x++) for (let y = 1; y <= 6; y++) cells.push(el('span', { class: 'dcell', text: `${x},${y}` }, grid));
    ui.legend(stage, [{ swatch: 'green', label: 'A and B both happen' }, { swatch: 'gold', label: 'B happens, A does not' }, { swatch: 'grey', label: 'B does not happen (ignored)' }]);
    ui.button(controls, 'Roll both dice', { kind: 'primary', onClick: () => roll(1) });
    ui.button(controls, 'Roll 100 times', { onClick: () => roll(100) });
    ui.button(controls, 'Roll 1,000 times', { onClick: () => roll(1000) });
    ui.button(controls, 'Reset rolls', { kind: 'quiet', onClick: () => { rolls = 0; nB = 0; nAB = 0; last = null; render(); } });
    const opts = Object.entries(EV).map(([k, v]) => ({ label: v.label, value: k }));
    ui.chips(panel, opts, { value: A, label: 'Event A:', onChange: (v) => { A = v; reset(); } });
    ui.chips(panel, opts, { value: B, label: 'Given B:', onChange: (v) => { B = v; reset(); } });
    const R = ui.readouts(panel, [
      { id: 'pa', label: 'P(A)' }, { id: 'pb', label: 'P(B)' }, { id: 'pab', label: 'P(A ∩ B)' }, { id: 'pagb', label: 'P(A | B) = P(A ∩ B) / P(B)', green: true },
      { id: 'ind', label: 'Are A and B independent?', span: true, text: true },
      { id: 'rolls', label: 'Rolls' }, { id: 'nb', label: 'Rolls where B happened' }, { id: 'obs', label: 'Of those, fraction with A', span: true },
    ]);
    const reset = () => { rolls = 0; nB = 0; nAB = 0; last = null; render(); };
    function roll(k) {
      animateSteps(k, () => { const x = 1 + randInt(6), y = 1 + randInt(6); last = [x, y]; rolls++; if (EV[B].test(x, y)) { nB++; if (EV[A].test(x, y)) nAB++; } }, render);
    }
    function render() {
      let cA = 0, cB = 0, cAB = 0;
      cells.forEach((c, i) => {
        const x = Math.floor(i / 6) + 1, y = (i % 6) + 1;
        const a = EV[A].test(x, y), b = EV[B].test(x, y);
        cA += a; cB += b; cAB += a && b;
        c.className = 'dcell ' + (b ? (a ? 'dcell--ab' : 'dcell--b') : 'dcell--out') + (last && last[0] === x && last[1] === y ? ' dcell--hit' : '');
      });
      R.set('pa', `${cA}/36 = ${fmt(cA / 36, 3)}`); R.set('pb', `${cB}/36 = ${fmt(cB / 36, 3)}`); R.set('pab', `${cAB}/36 = ${fmt(cAB / 36, 3)}`);
      R.set('pagb', cB ? `${cAB}/${cB} = ${fmt(cAB / cB, 3)}` : 'undefined');
      const ind = cB && Math.abs(cAB / cB - cA / 36) < 1e-9;
      R.set('ind', cB ? (ind ? `Yes: P(A | B) = P(A). Knowing B tells you nothing about A.` : `No: P(A | B) = ${fmt(cAB / cB, 3)} but P(A) = ${fmt(cA / 36, 3)}.`) : '–');
      R.set('rolls', int(rolls)); R.set('nb', int(nB)); R.set('obs', nB ? fmt(nAB / nB, 3) : '–');
    }
    render();
  };

  /* =====================================================================
     bayes — natural frequencies: 1,000 people, a test, and P(sick | positive)
     ===================================================================== */
  labs.bayes = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    let prev = 1, sens = 90, spec = 90, onlyPos = false;
    el('p', { class: 'stage-label', text: 'Expected outcomes among 1,000 people who take the test.' }, stage);
    const grid = el('div', { class: 'people', role: 'img' }, stage);
    const dots = Array.from({ length: 1000 }, () => el('span', { class: 'person' }, grid));
    ui.legend(stage, [{ swatch: 'red', label: 'Sick, tests positive' }, { swatch: 'red-hollow', label: 'Sick, tests negative (missed)' }, { swatch: 'gold', label: 'Healthy, tests positive (false alarm)' }, { swatch: 'grey', label: 'Healthy, tests negative' }]);
    const sentence = el('p', { class: 'fallacy-result' }, stage);
    ui.button(controls, 'Show only the positives', { kind: 'primary', onClick: (e) => { onlyPos = !onlyPos; e.target.textContent = onlyPos ? 'Show everyone' : 'Show only the positives'; render(); } });
    ui.slider(panel, { label: 'Prevalence, P(sick) =', min: 0.5, max: 50, step: 0.5, value: prev, format: (v) => v + '%', onInput: (v) => { prev = v; render(); } });
    ui.slider(panel, { label: 'Sensitivity, P(positive | sick) =', min: 50, max: 100, value: sens, format: (v) => v + '%', onInput: (v) => { sens = v; render(); } });
    ui.slider(panel, { label: 'Specificity, P(negative | healthy) =', min: 50, max: 100, value: spec, format: (v) => v + '%', onInput: (v) => { spec = v; render(); } });
    const R = ui.readouts(panel, [
      { id: 'tp', label: 'Sick and positive' }, { id: 'fp', label: 'Healthy and positive' }, { id: 'fn', label: 'Sick and negative' }, { id: 'tn', label: 'Healthy and negative' },
      { id: 'ppv', label: 'P(sick | positive)', span: true, green: true },
    ]);
    function render() {
      const sick = Math.round(10 * prev), healthy = 1000 - sick;
      const tp = Math.round((sick * sens) / 100), fn = sick - tp, tn = Math.round((healthy * spec) / 100), fp = healthy - tn;
      dots.forEach((d, i) => {
        const cls = i < tp ? 'person--tp' : i < sick ? 'person--fn' : i < sick + fp ? 'person--fp' : 'person--tn';
        d.className = 'person ' + cls + (onlyPos && (cls === 'person--fn' || cls === 'person--tn') ? ' person--dim' : '');
      });
      const ppv = tp + fp ? tp / (tp + fp) : NaN;
      R.set('tp', int(tp)); R.set('fp', int(fp)); R.set('fn', int(fn)); R.set('tn', int(tn)); R.set('ppv', pct(ppv, 1));
      sentence.innerHTML = `Of the <strong>${int(tp + fp)}</strong> people who test positive, <strong>${int(tp)}</strong> are actually sick. So P(sick | positive) = ${int(tp)} / ${int(tp + fp)} = <strong class="dd-green">${pct(ppv, 1)}</strong>. By Bayes: (${(sens / 100).toFixed(2)} × ${(prev / 100).toFixed(3)}) / (${(sens / 100).toFixed(2)} × ${(prev / 100).toFixed(3)} + ${(1 - spec / 100).toFixed(2)} × ${(1 - prev / 100).toFixed(3)}).`;
    }
    render();
  };

  /* =====================================================================
     joint — X = first die, Y = sum of both: joint table, marginals, conditionals
     ===================================================================== */
  labs.joint = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    let mode = 'joint', selRow = null, rolls = 0;
    const counts = Array.from({ length: 6 }, () => new Array(11).fill(0));
    el('p', { class: 'stage-label', text: 'X = first die (rows), Y = sum of both dice (columns). Tap a row to see the conditional distribution of Y given X.' }, stage);
    const tableBox = el('div', { class: 'table-scroll' }, stage);
    ui.button(controls, 'Roll 100 pairs', { kind: 'primary', onClick: () => roll(100) });
    ui.button(controls, 'Roll 1,000 pairs', { onClick: () => roll(1000) });
    ui.button(controls, 'Reset rolls', { kind: 'quiet', onClick: () => { counts.forEach((r) => r.fill(0)); rolls = 0; render(); } });
    ui.chips(panel, [{ label: 'Theory', value: 'joint' }, { label: 'Observed', value: 'obs' }], { value: mode, label: 'Show', onChange: (v) => { mode = v; render(); } });
    const R = ui.readouts(panel, [
      { id: 'ex', label: 'E[X]' }, { id: 'ey', label: 'E[Y]' }, { id: 'cov', label: 'Cov(X, Y)', green: true }, { id: 'rho', label: 'Correlation ρ', green: true },
      { id: 'cond', label: 'Conditional distribution', span: true, text: true },
      { id: 'rolls', label: 'Pairs rolled' },
    ]);
    const joint = (x, y) => (y - x >= 1 && y - x <= 6 ? 1 / 36 : 0);
    function roll(k) { animateSteps(k, () => { const x = 1 + randInt(6), y = x + 1 + randInt(6); counts[x - 1][y - 2]++; rolls++; }, render); }
    function render() {
      let ex = 0, ey = 0, exy = 0, ex2 = 0, ey2 = 0;
      for (let x = 1; x <= 6; x++) for (let y = 2; y <= 12; y++) { const p = joint(x, y); ex += x * p; ey += y * p; exy += x * y * p; ex2 += x * x * p; ey2 += y * y * p; }
      const cov = exy - ex * ey, rho = cov / Math.sqrt((ex2 - ex * ex) * (ey2 - ey * ey));
      R.set('ex', fmt(ex, 2)); R.set('ey', fmt(ey, 2)); R.set('cov', fmt(cov, 3)); R.set('rho', fmt(rho, 3)); R.set('rolls', int(rolls));
      const val = (x, y) => (mode === 'joint' ? joint(x, y) : rolls ? counts[x - 1][y - 2] / rolls : 0);
      const show = (v) => (mode === 'joint' ? (v ? `${Math.round(v * 36)}/36` : '·') : v ? fmt(v, 3) : '·');
      let h = '<table class="joint"><thead><tr><th>X \\ Y</th>' + Array.from({ length: 11 }, (_, i) => `<th>${i + 2}</th>`).join('') + '<th class="marg">P(X = x)</th></tr></thead><tbody>';
      const colSum = new Array(11).fill(0);
      for (let x = 1; x <= 6; x++) {
        let rowSum = 0; let cellsHtml = '';
        for (let y = 2; y <= 12; y++) {
          const v = val(x, y); rowSum += v; colSum[y - 2] += v;
          const shade = Math.min(1, v * 12);
          cellsHtml += `<td style="--shade:${shade.toFixed(2)}">${show(v)}</td>`;
        }
        h += `<tr data-x="${x}" class="${selRow === x ? 'is-sel' : ''}"><th>${x}</th>${cellsHtml}<td class="marg">${mode === 'joint' ? '1/6' : fmt(rowSum, 3)}</td></tr>`;
      }
      h += '<tr class="marg-row"><th>P(Y = y)</th>' + colSum.map((v) => `<td class="marg">${mode === 'joint' ? `${Math.round(v * 36)}/36` : fmt(v, 3)}</td>`).join('') + '<td class="marg">1</td></tr></tbody></table>';
      tableBox.innerHTML = h;
      $$('tbody tr[data-x]', tableBox).forEach((tr) => tr.addEventListener('click', () => { selRow = selRow === +tr.dataset.x ? null : +tr.dataset.x; render(); }));
      if (selRow) {
        const parts = []; for (let y = selRow + 1; y <= selRow + 6; y++) parts.push(`P(Y = ${y} | X = ${selRow}) = 1/6`);
        R.set('cond', `Given X = ${selRow}, Y is uniform on ${selRow + 1}…${selRow + 6}. Each of the six values has probability (1/36) / (1/6) = 1/6.`);
      } else R.set('cond', 'Tap a row of the table.');
    }
    render();
  };

  /* =====================================================================
     correlation — bivariate normal scatter with a ρ slider and a guessing game
     ===================================================================== */
  labs.correlation = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    let rho = 0.6, n = 200, pts = [], quiz = null;
    const chartBox = el('div', { class: 'chart-box chart-box--square' }, stage);
    const chart = new LineChart(chartBox, { aspect: 0.75, minH: 260, maxH: 380, x: [-3.5, 3.5], y: [-3.5, 3.5], xLabel: 'x', yLabel: 'y' });
    chart.addSeries('pts', { type: 'dots', color: C.blue, opacity: 0.6, r: 3 });
    chart.addSeries('line', { color: C.green, width: 2, dash: '5 4' });
    const legend = ui.legend(stage, [{ swatch: 'blue', label: 'Sample of 200 pairs' }, { swatch: 'green-dash', label: 'Least-squares line' }]);
    ui.button(controls, 'New sample', { kind: 'primary', onClick: () => sample() });
    const quizBtn = ui.button(controls, 'Quiz me: hide ρ', { onClick: () => { if (quiz) reveal(); else startQuiz(); } });
    const sl = ui.slider(panel, { label: 'ρ, population correlation =', min: -1, max: 1, step: 0.05, value: rho, format: (v) => v.toFixed(2), onInput: (v) => { if (quiz) { quiz.guess = v; R.set('guess', v.toFixed(2)); return; } rho = v; sample(); } });
    const R = ui.readouts(panel, [
      { id: 'r', label: 'Sample correlation r' }, { id: 'cov', label: 'Sample covariance' }, { id: 'guess', label: 'Your guess' }, { id: 'truth', label: 'True ρ', green: true },
    ]);
    function sample() {
      pts = []; for (let i = 0; i < n; i++) { const z1 = S.rnorm(), z2 = S.rnorm(); pts.push([z1, rho * z1 + Math.sqrt(1 - rho * rho) * z2]); }
      render();
    }
    function startQuiz() {
      quiz = { truth: Math.round((Math.random() * 1.9 - 0.95) * 20) / 20, guess: 0 };
      rho = quiz.truth; sl.set(0);
      pts = []; for (let i = 0; i < n; i++) { const z1 = S.rnorm(), z2 = S.rnorm(); pts.push([z1, rho * z1 + Math.sqrt(1 - rho * rho) * z2]); }
      quizBtn.textContent = 'Reveal ρ'; render();
    }
    function reveal() { const guess = quiz.guess; sl.set(quiz.truth); quiz = null; quizBtn.textContent = 'Quiz me: hide ρ'; render(); R.set('guess', guess.toFixed(2)); }
    function render() {
      const c = S.corr(pts.map((p) => p[0]), pts.map((p) => p[1]));
      chart.setData('pts', pts).setData('line', [[-3.5, c.intercept - 3.5 * c.slope], [3.5, c.intercept + 3.5 * c.slope]]).render();
      if (quiz) { R.set('r', 'hidden'); R.set('cov', 'hidden'); R.set('truth', 'hidden'); R.set('guess', quiz.guess.toFixed(2)); }
      else { R.set('r', fmt(c.r, 3)); R.set('cov', fmt(c.cov, 3)); R.set('truth', rho.toFixed(2)); R.set('guess', '–'); }
    }
    sample();
  };

  /* =====================================================================
     lln — running means for several distributions, including one with no mean
     ===================================================================== */
  labs.lln = (root) => {
    const { stage, panel, controls } = ui.lab(root);
    const PAR = {
      die: { label: 'Fair die', make: () => D.dicesum(1), y: [1, 6] },
      exp: { label: 'Exponential(1)', make: () => D.exponential(1), y: [0, 3] },
      unif: { label: 'Uniform(0, 1)', make: () => D.uniform(0, 1), y: [0, 1] },
      cauchy: { label: 'Cauchy', make: () => D.cauchy(), y: [-6, 6] },
    };
    let which = 'die', paths = [];
    const N = 2000, K = 6;
    const chartBox = el('div', { class: 'chart-box' }, stage);
    const chart = new LineChart(chartBox, { minH: 220, maxH: 340, x: [1, N], xScale: 'log', xLabel: 'sample size n (log scale)', yLabel: 'running mean' });
    for (let g = 0; g < K; g++) chart.addSeries('p' + g, { color: C.blue, width: 1.5, opacity: 0.6 });
    ui.legend(stage, [{ swatch: 'blue', label: 'Six independent running means' }, { swatch: 'green-dash', label: 'The distribution’s mean, if it has one' }]);
    ui.button(controls, 'Run again', { kind: 'primary', onClick: run });
    ui.chips(panel, Object.entries(PAR).map(([k, v]) => ({ label: v.label, value: k })), { value: which, label: 'Draw from', onChange: (v) => { which = v; run(); } });
    const R = ui.readouts(panel, [{ id: 'mean', label: 'True mean', green: true }, { id: 'spread', label: 'Spread of the six at n = 2,000', text: true, span: true }]);
    function run() {
      const dist = PAR[which].make(); paths = [];
      for (let g = 0; g < K; g++) { const p = []; let s = 0; for (let i = 1; i <= N; i++) { s += dist.sample(); p.push([i, s / i]); } paths.push(p); }
      paths.forEach((p, g) => chart.setData('p' + g, p));
      chart.setY(PAR[which].y);
      chart.setReference('mean', Number.isFinite(dist.mean) ? dist.mean : null, { color: C.green, label: Number.isFinite(dist.mean) ? `mean = ${sig(dist.mean)}` : '' });
      chart.render();
      const finals = paths.map((p) => p[N - 1][1]);
      R.set('mean', Number.isFinite(dist.mean) ? sig(dist.mean, 4) : 'none (undefined)');
      R.set('spread', `${sig(Math.min(...finals), 3)} to ${sig(Math.max(...finals), 3)}`);
    }
    run();
  };

  /* =====================================================================
     clt — sampling distribution of a statistic for any parent
     ===================================================================== */
  const PARENTS = {
    uniform: { label: 'Uniform(0, 1)', make: () => D.uniform(0, 1) },
    exp: { label: 'Exponential(1)', make: () => D.exponential(1) },
    bimodal: { label: 'Bimodal', make: () => D.bimodal() },
    die: { label: 'Fair die', make: () => D.dicesum(1) },
    beta: { label: 'Beta(0.5, 0.5)', make: () => D.beta(0.5, 0.5) },
    cauchy: { label: 'Cauchy', make: () => D.cauchy() },
    normal: { label: 'Normal(0, 1)', make: () => D.normal(0, 1) },
    heights: { label: 'Heights, Normal(170, 8²)', make: () => D.normal(170, 8) },
  };
  const STATS = {
    mean: { label: 'Sample mean', f: S.mean, theory: (d, n) => ({ center: d.mean, sd: Math.sqrt(d.variance / n) }) },
    median: { label: 'Sample median', f: S.median, theory: (d) => ({ center: d.quantile(0.5) }) },
    sd: { label: 'Sample SD (n − 1)', f: (a) => S.sd(a), theory: (d) => ({ center: Math.sqrt(d.variance) }) },
    var: { label: 'Sample variance, ÷ (n − 1)', f: (a) => S.variance(a, 1), theory: (d) => ({ center: d.variance }) },
    var_n: { label: 'Sample variance, ÷ n', f: (a) => S.variance(a, 0), theory: (d, n) => ({ center: (d.variance * (n - 1)) / n }) },
    max: { label: 'Sample maximum', f: (a) => Math.max(...a), theory: () => ({}) },
  };
  labs.clt = (root, cfg) => {
    const { stage, panel, controls } = ui.lab(root);
    const parentKeys = (cfg.parents || 'uniform,exp,bimodal,die,beta,cauchy').split(',');
    const statKeys = (cfg.stats || 'mean').split(',');
    let parent = parentKeys[0], stat = statKeys[0], n = +(cfg.n || 10), vals = [], lastSample = [], busy = false;
    const topLabel = el('p', { class: 'stage-label' }, stage);
    const topBox = el('div', { class: 'chart-box' }, stage);
    const top = new LineChart(topBox, { minH: 130, maxH: 170, margin: { t: 10, r: 18, b: 30, l: 48 }, yTicks: 2, xLabel: 'value in the population' });
    top.addSeries('pdf', { color: C.green, width: 2 });
    top.addSeries('pmf', { type: 'bars', color: C.green, barFrac: 0.3, opacity: 1 });
    top.addSeries('sample', { type: 'dots', color: C.blue, opacity: 0.8, r: 3.5 });
    const botLabel = el('p', { class: 'stage-label' }, stage);
    const botBox = el('div', { class: 'chart-box' }, stage);
    const bot = new LineChart(botBox, { minH: 190, maxH: 260, xLabel: 'value of the statistic' });
    bot.addSeries('hist', { type: 'bars', color: C.blue, opacity: 0.55 });
    bot.addSeries('normal', { color: C.green, width: 2, dash: '5 4' });
    const legend = el('div', {}, stage);
    ui.button(controls, 'Draw one sample', { kind: 'primary', onClick: () => go(1) });
    ui.button(controls, 'Draw 100 samples', { onClick: () => go(100) });
    ui.button(controls, 'Draw 1,000 samples', { onClick: () => go(1000) });
    ui.button(controls, 'Reset', { kind: 'quiet', onClick: () => { vals = []; lastSample = []; render(); } });
    ui.slider(panel, { label: 'n, size of each sample =', min: +(cfg.nmin || 1), max: +(cfg.nmax || 100), value: n, onInput: (v) => { n = v; vals = []; lastSample = []; render(); } });
    if (parentKeys.length > 1) ui.chips(panel, parentKeys.map((k) => ({ label: PARENTS[k].label, value: k })), { value: parent, label: 'Population', onChange: (v) => { parent = v; vals = []; lastSample = []; render(); } });
    if (statKeys.length > 1) ui.chips(panel, statKeys.map((k) => ({ label: STATS[k].label, value: k })), { value: stat, label: 'Statistic', onChange: (v) => { stat = v; vals = []; lastSample = []; render(); } });
    const R = ui.readouts(panel, [
      { id: 'k', label: 'Samples drawn' }, { id: 'last', label: 'Statistic of last sample' },
      { id: 'm', label: 'Mean of the statistic' }, { id: 's', label: 'SD of the statistic' },
      { id: 'tc', label: 'Theory: centre', green: true }, { id: 'ts', label: 'Theory: SD (σ/√n)', green: true },
    ]);
    function go(k) { if (busy) return; busy = true; animateSteps(k, () => { const d = PARENTS[parent].make(); lastSample = Array.from({ length: n }, () => d.sample()); vals.push(STATS[stat].f(lastSample)); }, render, () => { busy = false; }); }
    function render() {
      const d = PARENTS[parent].make(), st = STATS[stat], th = st.theory(d, n);
      topLabel.textContent = `Population: ${d.name}. Blue dots are the last sample of n = ${n}.`;
      const [lo, hi] = d.support;
      if (d.kind === 'discrete') { const b = []; for (let k = lo; k <= hi; k++) b.push([k, d.pmf(k)]); top.setData('pmf', b).setData('pdf', []).setX([lo - 0.6, hi + 0.6]).setY([0, niceMax(Math.max(...b.map((x) => x[1])) * 1.2)]); top.o.xTicksAt = b.map((x) => x[0]); }
      else { const pts = curve(d.pdf, lo + (hi - lo) / 600, hi, 240); const ys = pts.map((p) => p[1]).sort((a, b) => a - b); const cap = Math.min(ys[ys.length - 1], 3 * ys[Math.floor(ys.length * 0.9)] + 1e-9); top.setData('pdf', pts).setData('pmf', []).setX([lo, hi]).setY([0, niceMax(cap * 1.1)]); top.o.xTicksAt = undefined; }
      top.setData('sample', lastSample.filter((v) => v >= lo && v <= hi).map((v) => [v, 0])).render();
      // bottom histogram
      let bins = [];
      if (vals.length) {
        const finite = vals.filter(Number.isFinite);
        let a = S.quantileOf(finite, 0.005), b = S.quantileOf(finite, 0.995);
        if (Number.isFinite(th.center) && Number.isFinite(th.sd)) { a = Math.min(a, th.center - 4 * th.sd); b = Math.max(b, th.center + 4 * th.sd); }
        if (b - a < 1e-9) { a -= 0.5; b += 0.5; }
        const pad = (b - a) * 0.05; a -= pad; b += pad;
        const h = S.histogram(finite, { min: a, max: b, bins: Math.min(40, Math.max(12, Math.round(Math.sqrt(finite.length) * 1.5))) });
        bins = h.bars; bot.setStyle('hist', { barWidth: h.width, barFrac: 1 }); bot.setX([a, b]);
        let ymax = Math.max(...bins.map((x) => x[1]));
        if (stat === 'mean' && Number.isFinite(th.sd) && th.sd > 0) { bot.setData('normal', curve((x) => S.normPdf(x, th.center, th.sd), a, b, 200)); ymax = Math.max(ymax, S.normPdf(th.center, th.center, th.sd)); }
        else bot.setData('normal', []);
        bot.setY([0, niceMax(ymax * 1.1)]);
      } else { bot.setData('normal', []); bot.setX(Number.isFinite(th.center) ? [th.center - 1, th.center + 1] : [-1, 1]).setY([0, 1]); }
      bot.setData('hist', bins);
      bot.setVRef('center', Number.isFinite(th.center) ? th.center : null, { color: C.green, label: stat === 'mean' ? 'μ' : 'true value' });
      bot.render();
      botLabel.textContent = `${st.label} of each sample: ${int(vals.length)} so far.`;
      legend.innerHTML = ''; ui.legend(legend, [{ swatch: 'blue', label: 'Histogram of the statistic' }, ...(stat === 'mean' ? [{ swatch: 'green-dash', label: 'Normal with mean μ and SD σ/√n' }] : [])]);
      const finite = vals.filter(Number.isFinite);
      R.set('k', int(vals.length)); R.set('last', vals.length ? sig(vals[vals.length - 1], 4) : '–');
      R.set('m', finite.length ? sig(S.mean(finite), 4) : '–'); R.set('s', finite.length > 1 ? sig(S.sd(finite), 4) : '–');
      R.set('tc', Number.isFinite(th.center) ? sig(th.center, 4) : (stat === 'max' ? 'depends on n' : 'undefined')); R.set('ts', Number.isFinite(th.sd) ? sig(th.sd, 4) : (stat === 'mean' ? 'undefined' : '–'));
    }
    render();
  };
})();
