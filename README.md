# Seeing Theory, rebuilt

> **An updated version of [Seeing Theory](https://github.com/seeingtheory/Seeing-Theory)** by [Seeing Theory](https://github.com/seeingtheory) (Daniel Kunin with Jingru Guo, Tyler Dae Devlin and Daniel Xiang, Brown University). All credit for the original idea, design and chapters goes to them; see [Credits](#credits).
>
> Live site: <https://dnguye.github.io/seeing-theory/>

A modern, dependency-free recreation of the archived [Seeing Theory](https://seeing-theory.brown.edu/) extended into a full two-course sequence: **Probability & Statistics 1** (chapters 1–6) and **Probability & Statistics 2** (chapters 7–14). Every concept has an interactive lab in the same style: green = theory, blue = what you observed.

## Run it

```bash
python -m http.server 8123 --bind 0.0.0.0
```

Then open <http://localhost:8123> (or your machine's LAN address on a phone). No build step, no npm; the pages also work from `file://`.

## Chapters

| # | Page | Sections and labs |
|---|---|---|
| 1 | `index.html` | Galton board hero; chance events (coin), sample spaces (die faces), expectation (draggable die probabilities), variance (card deck), law of large numbers (20 gamblers), streaks, Monte Carlo π |
| 2 | `compound-probability.html` | Events as sets (100-cell sample space), counting (enumerated permutations/combinations), conditional probability (6×6 dice grid), Bayes' theorem (1,000-person natural-frequency grid) |
| 3 | `discrete-distributions.html` | PMFs (dice sums), binomial, geometric & negative binomial, Poisson, hypergeometric |
| 4 | `continuous-distributions.html` | Density as area (a/b sliders, empirical rule), uniform & exponential, normal, gamma & beta |
| 5 | `joint-distributions.html` | Joint/marginal/conditional table, covariance & correlation (with a guessing game), sums of random variables |
| 6 | `limit-theorems.html` | LLN including the Cauchy failure, central limit theorem (any parent, any n), normal approximation to the binomial |
| 7 | `sampling-distributions.html` | Population to sample (mean/median/SD/max), sample mean, t vs normal, χ² and F |
| 8 | `point-estimation.html` | Bias/variance dartboard, likelihood function, n vs n − 1 |
| 9 | `confidence-intervals.html` | 100-interval coverage (z / t / wrong z), t intervals, bootstrap |
| 10 | `hypothesis-testing.html` | p-value tail areas, Type I/II errors and power, t-test experiments with p-value histogram |
| 11 | `categorical-data.html` | χ² goodness of fit (loaded die, repeated experiments), 2×2 independence |
| 12 | `anova.html` | Between vs within, F statistic, repeated experiments against F(2, N − 3) |
| 13 | `regression.html` | Draggable-point least squares with residual squares, correlation, sampling distribution of the slope |
| 14 | `bayesian-inference.html` | Bayes as inference, likelihood, Beta prior → posterior with credible interval |

## Navigation

The site map lives in one table, `ST.site` in `js/nav.js`. It drives the **chapter dropdown** in the top bar, the in-page section links, the "In this chapter" contents list, the full chapter list on the home page, and the previous/next pager on every page. Add a chapter by adding one row and one HTML file.

## Files

- `index.html` + 13 chapter pages — prose, MathML formulas, and `<div class="lab" data-lab="…">` placeholders
- `css/style.css` — design tokens (light + dark), typography, layout, chapter-1 components
- `css/labs.css` — dropdown menu, chapter head, pager, and the shared lab components
- `js/core.js` — DOM/SVG helpers, responsive `LineChart` (lines, dots, bars, areas, references), `ui` builders (buttons, sliders, chips, readouts), lab registry and `mountLabs()`
- `js/stats.js` — special functions (lgamma, incomplete gamma/beta, erf), 15 distributions with pdf/pmf, cdf, quantile and samplers, summaries and histograms
- `js/nav.js` — site map and navigation chrome
- `js/labs-prob.js` — labs: `dist`, `area`, `sets`, `counting`, `conditional`, `bayes`, `joint`, `correlation`, `lln`, `clt`
- `js/labs-stat.js` — labs: `estimators`, `likelihood`, `coverage`, `bootstrap`, `pvalue`, `power`, `ttest`, `gof`, `independence`, `anova`, `ols`, `slopes`, `posterior`
- `js/galton.js`, `coin.js`, `events.js`, `expectation.js`, `variance.js`, `lln.js`, `streaks.js`, `montecarlo.js` — chapter-1 labs

### Adding a lab

Register a builder, then place it:

```js
ST.labs.mylab = (root, cfg) => {
  const { stage, panel, controls } = ST.ui.lab(root);   // standard stage + side panel
  ST.ui.button(controls, 'Run', { kind: 'primary', onClick: run });
  const R = ST.ui.readouts(panel, [{ id: 'x', label: 'Something' }]);
  // draw into `stage` (ST.LineChart, SVG, or plain DOM) and call R.set('x', value)
};
```

```html
<div class="lab" data-lab="mylab" data-anything="passed as cfg"></div>
```

The `dist` lab takes `data-dist` (binomial, geometric, negbinomial, poisson, hypergeometric, dicesum, uniform, exponential, normal, gamma, beta, t, chisq, f) and optional `data-overlay="normal"`. The `clt` lab takes `data-parents`, `data-stats` (mean, median, sd, var, var_n, max), `data-n`, `data-nmax`.

## Design notes

- Blue = observed / sample, green = theoretical / true, gold = second category, red = miss or rejection region.
- Bricolage Grotesque for headings, controls and readouts; Newsreader for prose (Google Fonts, system fallbacks).
- Respects `prefers-color-scheme` and `prefers-reduced-motion`. Responsive to 375 px; labs collapse to one column under 820 px.

## Credits

This project is an updated version of **Seeing Theory**, created by [Seeing Theory](https://github.com/seeingtheory): Daniel Kunin with Jingru Guo, Tyler Dae Devlin and Daniel Xiang (Brown University).

- Original source: <https://github.com/seeingtheory/Seeing-Theory> (Apache License 2.0)
- Original site: <https://seeing-theory.brown.edu/>

What changed in this version: the site was rebuilt from scratch in plain HTML, CSS and JavaScript (no dependencies or build step), and extended from the original's six chapters to fourteen, adding a second course on statistical inference (chapters 7–14). Chapter 1's definitions of expectation and variance and its coin, die and card experiments follow the original; the other labs and text are new. This version is not affiliated with or endorsed by the original authors.
