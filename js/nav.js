/* Site map + navigation chrome. One table drives the chapter menu, the chapter list and the prev/next pager. */
ST.site = {
  courses: [
    {
      name: 'Probability', course: 'Probability & Statistics 1',
      chapters: [
        { file: 'index.html', title: 'Basic probability', blurb: 'Chance events, sample spaces, expectation, variance, the law of large numbers, streaks, probability as area' },
        { file: 'compound-probability.html', title: 'Compound probability', blurb: 'Set operations, counting, conditional probability, independence, Bayes’ theorem' },
        { file: 'discrete-distributions.html', title: 'Discrete distributions', blurb: 'Random variables and PMFs; binomial, geometric, negative binomial, Poisson, hypergeometric' },
        { file: 'continuous-distributions.html', title: 'Continuous distributions', blurb: 'Density and area, uniform, exponential, normal, gamma and beta' },
        { file: 'joint-distributions.html', title: 'Joint distributions', blurb: 'Joint and marginal distributions, covariance, correlation, sums of random variables' },
        { file: 'limit-theorems.html', title: 'Limit theorems', blurb: 'The law of large numbers (and when it fails), the central limit theorem, normal approximation' },
      ],
    },
    {
      name: 'Statistics', course: 'Probability & Statistics 2',
      chapters: [
        { file: 'sampling-distributions.html', title: 'Sampling distributions', blurb: 'From population to sample; the sample mean, t, χ² and F distributions' },
        { file: 'point-estimation.html', title: 'Point estimation', blurb: 'Estimators, bias, variance and MSE, maximum likelihood, n versus n − 1' },
        { file: 'confidence-intervals.html', title: 'Confidence intervals', blurb: 'What confidence means, interval width, t intervals, the bootstrap' },
        { file: 'hypothesis-testing.html', title: 'Hypothesis testing', blurb: 'Null distributions and p-values, Type I and II errors, power, the t-test in practice' },
        { file: 'categorical-data.html', title: 'Categorical data', blurb: 'Chi-square goodness of fit and tests of independence' },
        { file: 'anova.html', title: 'Analysis of variance', blurb: 'Between versus within variation, the F test' },
        { file: 'regression.html', title: 'Regression', blurb: 'Least squares, residuals, correlation and R², inference for the slope' },
        { file: 'bayesian-inference.html', title: 'Bayesian inference', blurb: 'Bayes’ theorem, the likelihood function, prior to posterior, credible intervals' },
      ],
    },
  ],
};

ST.initNav = function initNav() {
  const { $, $$, el, site } = ST;
  const all = site.courses.flatMap((c) => c.chapters);
  all.forEach((ch, i) => (ch.num = i + 1));
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const current = all.find((ch) => ch.file === here) || all[0];
  const idx = all.indexOf(current);

  /* ---- top bar ---- */
  const bar = $('.topbar');
  if (bar) {
    bar.innerHTML = '';
    el('a', { class: 'brand', href: 'index.html' }, bar, '<span class="brand-mark" aria-hidden="true"></span>Seeing Theory');

    const dd = el('div', { class: 'dropdown' }, bar);
    const btn = el('button', { type: 'button', class: 'dropdown-btn', 'aria-expanded': 'false', 'aria-haspopup': 'true', 'aria-controls': 'chapter-menu' }, dd,
      `<span class="dropdown-num">${current.num}</span><span class="dropdown-title">${current.title}</span><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`);
    const menu = el('div', { class: 'menu', id: 'chapter-menu', hidden: '' }, dd);
    for (const c of site.courses) {
      const col = el('div', { class: 'menu-col' }, menu);
      el('p', { class: 'menu-course', text: c.course }, col);
      const ol = el('ol', { class: 'menu-list' }, col);
      for (const ch of c.chapters) {
        const li = el('li', {}, ol);
        const a = el('a', { href: ch.file, class: ch === current ? 'is-current' : '' }, li,
          `<span class="menu-num">${ch.num}</span><span><strong>${ch.title}</strong><span class="menu-blurb">${ch.blurb}</span></span>`);
        if (ch === current) a.setAttribute('aria-current', 'page');
      }
    }
    const open = (v) => { btn.setAttribute('aria-expanded', String(v)); menu.hidden = !v; if (v) menu.querySelector('a')?.focus({ preventScroll: true }); };
    btn.addEventListener('click', () => open(menu.hidden));
    document.addEventListener('click', (e) => { if (!dd.contains(e.target)) open(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { open(false); btn.focus(); } });

    const nav = el('nav', { 'aria-label': 'Sections in this chapter' }, bar);
    const sections = $$('section.concept[id]');
    for (const s of sections) {
      const label = s.dataset.nav || s.querySelector('h2')?.textContent || s.id;
      el('a', { href: '#' + s.id, text: label }, nav);
    }
    const links = $$('a', nav);
    if (sections.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          links.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
        }
      }, { rootMargin: '-40% 0px -55% 0px' });
      sections.forEach((s) => io.observe(s));
    }
  }

  /* ---- chapter head contents (list of sections) ---- */
  const toc = $('.chapter-toc');
  if (toc) {
    toc.innerHTML = '';
    for (const s of $$('section.concept[id]')) el('li', {}, toc, `<a href="#${s.id}">${s.querySelector('h2')?.textContent || s.dataset.nav || s.id}</a>`);
  }

  /* ---- full chapter list (index page and others) ---- */
  const list = $('#chapters');
  if (list) {
    list.innerHTML = '';
    el('h2', { text: 'All chapters' }, list);
    const grid = el('div', { class: 'chapter-courses' }, list);
    for (const c of site.courses) {
      const col = el('div', {}, grid);
      el('h3', { text: c.course }, col);
      const ol = el('ol', { class: 'chapter-list' }, col);
      for (const ch of c.chapters) {
        const li = el('li', { class: ch === current ? 'is-current' : '' }, ol,
          `<span class="chapter-num">${ch.num}</span><div><strong>${ch.title}</strong><span>${ch.blurb}</span></div>`);
        if (ch === current) el('span', { class: 'chapter-status', text: 'You are here' }, li);
        else el('a', { class: 'chapter-status', href: ch.file, text: 'Open' }, li);
      }
    }
  }

  /* ---- prev / next pager ---- */
  const pager = $('.pager');
  if (pager) {
    pager.innerHTML = '';
    const prev = all[idx - 1], next = all[idx + 1];
    el('a', { class: 'pager-link pager-prev', href: prev ? prev.file : '#top' }, pager,
      prev ? `<span>Previous chapter</span><strong>${prev.num}. ${prev.title}</strong>` : `<span>Start of the course</span><strong>Back to top</strong>`);
    el('a', { class: 'pager-link pager-next', href: next ? next.file : 'index.html' }, pager,
      next ? `<span>Next chapter</span><strong>${next.num}. ${next.title}</strong>` : `<span>End of the course</span><strong>Back to chapter 1</strong>`);
  }
};
