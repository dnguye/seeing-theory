/* Seeing Theory — probability & statistics math: special functions, distributions, samplers, summaries. */
ST.stats = (() => {
  /* ---------- special functions ---------- */
  const LANCZOS = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  function lgamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
    x -= 1;
    let a = LANCZOS[0]; const t = x + 7.5;
    for (let i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  function factorial(n) { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; }
  const lchoose = (n, k) => lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
  function choose(n, k) { if (k < 0 || k > n) return 0; if (n <= 30) { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c); } return Math.exp(lchoose(n, k)); }
  function permutations(n, k) { let p = 1; for (let i = 0; i < k; i++) p *= n - i; return p; }

  /* regularized lower incomplete gamma P(a, x) */
  function gammaP(a, x) {
    if (x <= 0) return 0;
    if (x < a + 1) {
      let sum = 1 / a, term = 1 / a;
      for (let n = 1; n < 1000; n++) { term *= x / (a + n); sum += term; if (Math.abs(term) < Math.abs(sum) * 1e-15) break; }
      return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
    }
    let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
    for (let i = 1; i < 1000; i++) {
      const an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; const del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
  }
  /* regularized incomplete beta I_x(a, b) */
  function betacf(a, b, x) {
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - (qab * x) / qap; if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; let h = d;
    for (let m = 1; m <= 500; m++) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; h *= d * c;
      aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return h;
  }
  function betaI(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
    return 1 - (bt * betacf(b, a, 1 - x)) / b;
  }
  const erf = (z) => (z < 0 ? -1 : 1) * gammaP(0.5, z * z);
  const normCdf = (x, mu = 0, sd = 1) => 0.5 * (1 + erf((x - mu) / (sd * Math.SQRT2)));
  const normPdf = (x, mu = 0, sd = 1) => Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));

  /* generic quantile by bisection on a monotone cdf */
  function quantile(cdf, q, lo, hi) {
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (cdf(mid) < q) lo = mid; else hi = mid; if (hi - lo < 1e-10) break; }
    return (lo + hi) / 2;
  }

  /* ---------- random samplers ---------- */
  const U = Math.random;
  function rnorm(mu = 0, sd = 1) {
    let u = 0, v = 0; while (u === 0) u = U(); v = U();
    return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function rgamma(k, theta = 1) {
    if (k < 1) return rgamma(k + 1, theta) * Math.pow(U(), 1 / k);
    const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x, v;
      do { x = rnorm(); v = 1 + c * x; } while (v <= 0);
      v = v * v * v; const u = U();
      if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v * theta;
    }
  }
  const rbeta = (a, b) => { const x = rgamma(a), y = rgamma(b); return x / (x + y); };
  const rexp = (lambda) => -Math.log(1 - U()) / lambda;
  const rbinom = (n, p) => { let s = 0; for (let i = 0; i < n; i++) s += U() < p ? 1 : 0; return s; };
  function rpois(lambda) {
    if (lambda > 60) { return Math.max(0, Math.round(rnorm(lambda, Math.sqrt(lambda)))); }
    const L = Math.exp(-lambda); let k = 0, p = 1;
    do { k++; p *= U(); } while (p > L);
    return k - 1;
  }
  const rgeom = (p) => Math.max(1, Math.ceil(Math.log(1 - U()) / Math.log(1 - p)));
  const rchisq = (df) => rgamma(df / 2, 2);
  const rt = (df) => rnorm() / Math.sqrt(rchisq(df) / df);
  const rf = (d1, d2) => (rchisq(d1) / d1) / (rchisq(d2) / d2);
  const rcauchy = () => Math.tan(Math.PI * (U() - 0.5));
  function rhyper(N, K, n) { let k = 0, bad = N - K, good = K; for (let i = 0; i < n; i++) { if (U() < good / (good + bad)) { k++; good--; } else bad--; } return k; }

  /* ---------- distribution objects ---------- */
  function discreteCdf(pmf, lo) { return (x) => { let s = 0; for (let k = lo; k <= Math.floor(x); k++) s += pmf(k); return Math.min(1, s); }; }
  const D = {
    binomial: (n, p) => ({
      kind: 'discrete', name: `Binomial(${n}, ${p})`, support: [0, n],
      pmf: (k) => (k < 0 || k > n || k % 1 ? 0 : Math.exp(lchoose(n, k) + k * Math.log(p || 1e-300) + (n - k) * Math.log(1 - p || 1e-300))),
      mean: n * p, variance: n * p * (1 - p), sample: () => rbinom(n, p),
    }),
    geometric: (p) => ({
      kind: 'discrete', name: `Geometric(${p})`, support: [1, Math.min(60, Math.ceil(Math.log(0.001) / Math.log(1 - p)) + 1)],
      pmf: (k) => (k < 1 || k % 1 ? 0 : Math.pow(1 - p, k - 1) * p),
      mean: 1 / p, variance: (1 - p) / (p * p), sample: () => rgeom(p),
    }),
    negbinomial: (r, p) => ({
      kind: 'discrete', name: `Negative binomial(${r}, ${p})`, support: [r, Math.min(120, Math.round(r / p + 4 * Math.sqrt(r * (1 - p)) / p))],
      pmf: (k) => (k < r || k % 1 ? 0 : Math.exp(lchoose(k - 1, r - 1) + r * Math.log(p) + (k - r) * Math.log(1 - p))),
      mean: r / p, variance: (r * (1 - p)) / (p * p), sample: () => { let s = 0; for (let i = 0; i < r; i++) s += rgeom(p); return s; },
    }),
    poisson: (l) => ({
      kind: 'discrete', name: `Poisson(${l})`, support: [0, Math.max(6, Math.ceil(l + 4 * Math.sqrt(l) + 2))],
      pmf: (k) => (k < 0 || k % 1 ? 0 : Math.exp(k * Math.log(l) - l - lgamma(k + 1))),
      mean: l, variance: l, sample: () => rpois(l),
    }),
    hypergeometric: (N, K, n) => ({
      kind: 'discrete', name: `Hypergeometric(${N}, ${K}, ${n})`, support: [Math.max(0, n + K - N), Math.min(n, K)],
      pmf: (k) => (k < Math.max(0, n + K - N) || k > Math.min(n, K) || k % 1 ? 0 : Math.exp(lchoose(K, k) + lchoose(N - K, n - k) - lchoose(N, n))),
      mean: (n * K) / N, variance: ((n * K) / N) * (1 - K / N) * ((N - n) / (N - 1)), sample: () => rhyper(N, K, n),
    }),
    dicesum: (k) => {
      let dist = [1]; // index = sum - k
      for (let i = 0; i < k; i++) { const next = new Array(dist.length + 5).fill(0); dist.forEach((p, j) => { for (let f = 0; f < 6; f++) next[j + f] += p / 6; }); dist = next; }
      return {
        kind: 'discrete', name: `Sum of ${k} dice`, support: [k, 6 * k],
        pmf: (s) => (s < k || s > 6 * k || s % 1 ? 0 : dist[s - k]),
        mean: 3.5 * k, variance: (35 / 12) * k, sample: () => { let s = 0; for (let i = 0; i < k; i++) s += 1 + Math.floor(U() * 6); return s; },
      };
    },
    uniform: (a, b) => ({
      kind: 'continuous', name: `Uniform(${a}, ${b})`, support: [a, b],
      pdf: (x) => (x < a || x > b ? 0 : 1 / (b - a)), cdf: (x) => Math.min(1, Math.max(0, (x - a) / (b - a))),
      mean: (a + b) / 2, variance: ((b - a) ** 2) / 12, sample: () => a + (b - a) * U(),
    }),
    exponential: (l) => ({
      kind: 'continuous', name: `Exponential(${l})`, support: [0, 6 / l],
      pdf: (x) => (x < 0 ? 0 : l * Math.exp(-l * x)), cdf: (x) => (x < 0 ? 0 : 1 - Math.exp(-l * x)),
      mean: 1 / l, variance: 1 / (l * l), sample: () => rexp(l),
    }),
    normal: (mu, sd) => ({
      kind: 'continuous', name: `Normal(${mu}, ${sd}²)`, support: [mu - 4 * sd, mu + 4 * sd],
      pdf: (x) => normPdf(x, mu, sd), cdf: (x) => normCdf(x, mu, sd), quantile: (q) => quantile((x) => normCdf(x, mu, sd), q, mu - 12 * sd, mu + 12 * sd),
      mean: mu, variance: sd * sd, sample: () => rnorm(mu, sd),
    }),
    gamma: (k, theta) => ({
      kind: 'continuous', name: `Gamma(${k}, ${theta})`, support: [0, (k + 4 * Math.sqrt(k)) * theta],
      pdf: (x) => (x <= 0 ? 0 : Math.exp((k - 1) * Math.log(x) - x / theta - lgamma(k) - k * Math.log(theta))),
      cdf: (x) => (x <= 0 ? 0 : gammaP(k, x / theta)),
      mean: k * theta, variance: k * theta * theta, sample: () => rgamma(k, theta),
    }),
    beta: (a, b) => ({
      kind: 'continuous', name: `Beta(${a}, ${b})`, support: [0, 1],
      pdf: (x) => (x <= 0 || x >= 1 ? 0 : Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) + lgamma(a + b) - lgamma(a) - lgamma(b))),
      cdf: (x) => betaI(x, a, b), quantile: (q) => quantile((x) => betaI(x, a, b), q, 0, 1),
      mean: a / (a + b), variance: (a * b) / ((a + b) ** 2 * (a + b + 1)), sample: () => rbeta(a, b),
    }),
    t: (df) => ({
      kind: 'continuous', name: `t(${df})`, support: [-5, 5],
      pdf: (x) => Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2)) / Math.sqrt(df * Math.PI) * Math.pow(1 + (x * x) / df, -(df + 1) / 2),
      cdf: (x) => { const ib = betaI(df / (df + x * x), df / 2, 0.5); return x >= 0 ? 1 - 0.5 * ib : 0.5 * ib; },
      quantile: (q) => quantile((x) => D.t(df).cdf(x), q, -200, 200),
      mean: 0, variance: df > 2 ? df / (df - 2) : Infinity, sample: () => rt(df),
    }),
    chisq: (df) => ({
      kind: 'continuous', name: `χ²(${df})`, support: [0, df + 4 * Math.sqrt(2 * df) + 2],
      pdf: (x) => (x <= 0 ? 0 : Math.exp((df / 2 - 1) * Math.log(x) - x / 2 - lgamma(df / 2) - (df / 2) * Math.LN2)),
      cdf: (x) => (x <= 0 ? 0 : gammaP(df / 2, x / 2)),
      mean: df, variance: 2 * df, sample: () => rchisq(df),
    }),
    f: (d1, d2) => ({
      kind: 'continuous', name: `F(${d1}, ${d2})`, support: [0, d2 > 2 ? Math.min(8, (d2 / (d2 - 2)) * 4) : 8],
      pdf: (x) => (x <= 0 ? 0 : Math.exp(0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2)) - Math.log(x) - (lgamma(d1 / 2) + lgamma(d2 / 2) - lgamma((d1 + d2) / 2)))),
      cdf: (x) => (x <= 0 ? 0 : betaI((d1 * x) / (d1 * x + d2), d1 / 2, d2 / 2)),
      mean: d2 > 2 ? d2 / (d2 - 2) : Infinity, variance: d2 > 4 ? (2 * d2 * d2 * (d1 + d2 - 2)) / (d1 * (d2 - 2) ** 2 * (d2 - 4)) : Infinity, sample: () => rf(d1, d2),
    }),
    cauchy: () => ({
      kind: 'continuous', name: 'Cauchy', support: [-8, 8],
      pdf: (x) => 1 / (Math.PI * (1 + x * x)), cdf: (x) => 0.5 + Math.atan(x) / Math.PI,
      mean: NaN, variance: NaN, sample: rcauchy,
    }),
    bimodal: () => ({
      kind: 'continuous', name: 'Bimodal mixture', support: [-4, 4],
      pdf: (x) => 0.5 * normPdf(x, -1.6, 0.6) + 0.5 * normPdf(x, 1.6, 0.6), cdf: (x) => 0.5 * normCdf(x, -1.6, 0.6) + 0.5 * normCdf(x, 1.6, 0.6),
      mean: 0, variance: 0.36 + 1.6 * 1.6, sample: () => rnorm(U() < 0.5 ? -1.6 : 1.6, 0.6),
    }),
  };
  for (const key of Object.keys(D)) {
    const make = D[key];
    D[key] = (...args) => { const d = make(...args); if (d.kind === 'discrete' && !d.cdf) d.cdf = discreteCdf(d.pmf, d.support[0]); if (!d.quantile) d.quantile = (q) => (d.kind === 'discrete' ? Math.ceil(quantile(d.cdf, q, d.support[0] - 1, d.support[1] + 1)) : quantile(d.cdf, q, d.support[0] - 1e-9, d.support[1] + 1e-9)); return d; };
  }

  /* ---------- summaries ---------- */
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  function variance(a, ddof = 1) { const m = mean(a); return a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - ddof); }
  const sd = (a, ddof = 1) => Math.sqrt(variance(a, ddof));
  function median(a) { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }
  function quantileOf(a, q) { const s = [...a].sort((x, y) => x - y); const pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos); return s[lo] + (s[hi] - s[lo]) * (pos - lo); }
  function corr(xs, ys) {
    const mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
    return { r: sxy / Math.sqrt(sxx * syy), cov: sxy / (xs.length - 1), slope: sxy / sxx, intercept: my - (sxy / sxx) * mx, sxx, syy, sxy, mx, my };
  }
  /* histogram → bars data [[center, height]], height as density or proportion */
  function histogram(values, { min, max, bins = 30, density = true } = {}) {
    if (!values.length) return { bars: [], width: (max - min) / bins };
    const w = (max - min) / bins, counts = new Array(bins).fill(0);
    for (const v of values) { let i = Math.floor((v - min) / w); if (i < 0 || i >= bins) continue; counts[i]++; }
    const n = values.length;
    return { width: w, bars: counts.map((c, i) => [min + (i + 0.5) * w, density ? c / (n * w) : c / n]) };
  }
  /* discrete counts → bars over integer support */
  function countsOver(values, lo, hi) {
    const c = new Map(); for (const v of values) c.set(v, (c.get(v) || 0) + 1);
    const out = []; for (let k = lo; k <= hi; k++) out.push([k, (c.get(k) || 0) / (values.length || 1)]);
    return out;
  }

  return { lgamma, factorial, choose, permutations, gammaP, betaI, erf, normCdf, normPdf, quantile,
    rnorm, rgamma, rbeta, rexp, rbinom, rpois, rgeom, rchisq, rt, rf, rcauchy, rhyper,
    D, mean, variance, sd, median, quantileOf, corr, histogram, countsOver };
})();
