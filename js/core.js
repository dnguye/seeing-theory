/* Seeing Theory — shared helpers: DOM, SVG, formatting, animation, dice, line chart, lab UI builders. */
window.ST = (() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVG = 'http://www.w3.org/2000/svg';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function svg(tag, attrs = {}, parent) {
    const node = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
  }
  function el(tag, attrs = {}, parent, html) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v; else if (k === 'text') node.textContent = v; else node.setAttribute(k, v);
    }
    if (html !== undefined) node.innerHTML = html;
    if (parent) parent.appendChild(node);
    return node;
  }

  const fmt = (x, d = 3) => (Number.isFinite(x) ? x.toFixed(d) : '–');
  const pct = (x, d = 1) => (Number.isFinite(x) ? (100 * x).toFixed(d) + '%' : '–');
  const int = (n) => (Number.isFinite(n) ? n.toLocaleString('en-US') : '–');
  /* compact number: 3 significant figures, plain for integers */
  function sig(x, s = 3) { if (!Number.isFinite(x)) return '–'; if (Number.isInteger(x) && Math.abs(x) < 1e15) return int(x); return Number(x.toPrecision(s)).toString(); }

  function setText(id, value) {
    const n = document.getElementById(id);
    if (n) n.textContent = value;
  }

  const NICE = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
  function niceCeil(n, floor = 20) {
    for (const v of NICE) if (v >= n && v >= floor) return v;
    return NICE[NICE.length - 1];
  }
  function niceMax(v) { if (v <= 0) return 1; const mag = Math.pow(10, Math.floor(Math.log10(v))); const n = v / mag; const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10; return m * mag; }

  function randInt(n) { return Math.floor(Math.random() * n); }

  /* Spread `total` calls of step() across animation frames, calling render() after each frame. */
  function animateSteps(total, step, render, done) {
    if (reduced || total <= 1) {
      for (let i = 0; i < total; i++) step();
      render();
      if (done) done();
      return;
    }
    const frames = Math.min(45, total);
    const perFrame = total / frames;
    let performed = 0, frame = 0;
    function tick() {
      frame++;
      const target = frame >= frames ? total : Math.round(perFrame * frame);
      while (performed < target) { step(); performed++; }
      render();
      if (performed < total) requestAnimationFrame(tick);
      else if (done) done();
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Dice ---------- */
  const PIPS = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  };
  function dieFaceSVG(value, size = 64) {
    const c = size / 2, d = size * 0.24, r = size * 0.085;
    const pips = PIPS[value].map(([x, y]) => `<circle cx="${c + x * d}" cy="${c + y * d}" r="${r}"/>`).join('');
    return `<svg class="die-face" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Die showing ${value}"><rect x="1.5" y="1.5" width="${size - 3}" height="${size - 3}" rx="${size * 0.18}"/>${pips}</svg>`;
  }
  function rollDie(el, value, done) {
    if (reduced) { el.innerHTML = dieFaceSVG(value, el.dataset.size || 96); if (done) done(); return; }
    const size = el.dataset.size || 96;
    let n = 0;
    const id = setInterval(() => {
      n++;
      el.innerHTML = dieFaceSVG(n < 6 ? 1 + randInt(6) : value, size);
      if (n >= 6) { clearInterval(id); if (done) done(); }
    }, 55);
  }

  /* ---------- Line chart (SVG, responsive) ---------- */
  function niceTicks(min, max, count) {
    const span = max - min;
    if (span <= 0) return [min];
    const raw = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const ticks = [];
    for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(+v.toFixed(10));
    return ticks;
  }

  class LineChart {
    constructor(container, opts = {}) {
      this.c = container;
      this.o = Object.assign({
        aspect: 0.5, minH: 190, maxH: 320,
        margin: { t: 16, r: 18, b: 38, l: 48 },
        x: [0, 20], y: [0, 1], xScale: 'linear',
        xTicks: 5, yTicks: 4, xLabel: '', yLabel: '',
        yFormat: (v) => sig(v), xFormat: (v) => sig(v),
      }, opts);
      this.series = new Map();
      this.refs = new Map();
      this.vrefs = new Map();
      this.svg = svg('svg', { class: 'chart', role: 'img' }, container);
      if (opts.label) this.svg.setAttribute('aria-label', opts.label);
      this.gGrid = svg('g', { class: 'chart-grid' }, this.svg);
      this.gSeries = svg('g', { class: 'chart-series' }, this.svg);
      this.gRefs = svg('g', { class: 'chart-refs' }, this.svg);
      this.gAxes = svg('g', { class: 'chart-axes' }, this.svg);
      this.ro = new ResizeObserver(() => this.render());
      this.ro.observe(container);
    }
    addSeries(name, style = {}) {
      const s = { style, data: [], node: null };
      const type = style.type || 'line';
      if (type === 'dots' || type === 'bars') s.node = svg('g', { fill: style.color, opacity: style.opacity ?? (type === 'bars' ? 0.85 : 0.5) }, this.gSeries);
      else if (type === 'area') s.node = svg('path', { fill: style.color, opacity: style.opacity ?? 0.25, stroke: 'none' }, this.gSeries);
      else s.node = svg('path', {
        fill: 'none', stroke: style.color, 'stroke-width': style.width || 2,
        'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: style.opacity ?? 1,
        ...(style.dash ? { 'stroke-dasharray': style.dash } : {}),
      }, this.gSeries);
      this.series.set(name, s);
      return this;
    }
    removeSeries(name) { const s = this.series.get(name); if (s) { s.node.remove(); this.series.delete(name); } return this; }
    setData(name, data) { const s = this.series.get(name); if (s) s.data = data; return this; }
    setStyle(name, patch) { const s = this.series.get(name); if (!s) return this; Object.assign(s.style, patch); for (const k of ['stroke', 'fill', 'opacity']) if (patch[k] !== undefined) s.node.setAttribute(k, patch[k]); if (patch.color) s.node.setAttribute(s.style.type === 'line' || !s.style.type ? 'stroke' : 'fill', patch.color); return this; }
    setReference(name, y, style = {}) {
      let r = this.refs.get(name);
      if (!r) {
        r = { g: svg('g', {}, this.gRefs) };
        r.line = svg('line', { 'stroke-width': 1.5 }, r.g);
        r.text = svg('text', { class: 'chart-ref-label', 'text-anchor': 'end' }, r.g);
        this.refs.set(name, r);
      }
      r.line.setAttribute('stroke', style.color || 'currentColor'); r.line.setAttribute('stroke-dasharray', style.dash || '5 4');
      r.text.setAttribute('fill', style.color || 'currentColor');
      r.y = y; r.label = style.label || ''; r.g.style.display = y === null ? 'none' : '';
      return this;
    }
    setVRef(name, x, style = {}) {
      let r = this.vrefs.get(name);
      if (!r) {
        r = { g: svg('g', {}, this.gRefs) };
        r.line = svg('line', { 'stroke-width': 1.5 }, r.g);
        r.text = svg('text', { class: 'chart-ref-label', 'text-anchor': 'middle' }, r.g);
        this.vrefs.set(name, r);
      }
      r.line.setAttribute('stroke', style.color || 'currentColor'); r.line.setAttribute('stroke-dasharray', style.dash || '5 4');
      r.text.setAttribute('fill', style.color || 'currentColor');
      r.x = x; r.label = style.label || ''; r.g.style.display = x === null ? 'none' : '';
      return this;
    }
    setX(domain) { this.o.x = domain; return this; }
    setY(domain) { this.o.y = domain; return this; }
    render() {
      const W = Math.max(200, this.c.clientWidth || 300);
      const H = Math.max(this.o.minH, Math.min(this.o.maxH, W * this.o.aspect));
      const m = this.o.margin, iw = W - m.l - m.r, ih = H - m.t - m.b;
      this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      this.svg.setAttribute('width', W); this.svg.setAttribute('height', H);
      const [x0, x1] = this.o.x, [y0, y1] = this.o.y;
      const log = this.o.xScale === 'log';
      const fx = log ? Math.log10 : (v) => v;
      const xs = (v) => m.l + ((fx(v) - fx(x0)) / (fx(x1) - fx(x0))) * iw;
      const ys = (v) => m.t + ih - ((v - y0) / (y1 - y0)) * ih;
      this.xs = xs; this.ys = ys; this.W = W; this.H = H;

      this.gGrid.innerHTML = ''; this.gAxes.innerHTML = '';
      const yT = niceTicks(y0, y1, this.o.yTicks);
      let xT;
      if (log) { xT = []; for (let p = Math.ceil(fx(x0)); p <= fx(x1) + 1e-9; p++) xT.push(Math.pow(10, p)); }
      else xT = this.o.xTicksAt || niceTicks(x0, x1, this.o.xTicks);
      for (const v of yT) {
        svg('line', { x1: m.l, x2: W - m.r, y1: ys(v), y2: ys(v) }, this.gGrid);
        const t = svg('text', { x: m.l - 8, y: ys(v), 'text-anchor': 'end', 'dominant-baseline': 'middle' }, this.gAxes);
        t.textContent = this.o.yFormat(v);
      }
      for (const v of xT) {
        if (v < x0 || v > x1) continue;
        svg('line', { x1: xs(v), x2: xs(v), y1: m.t, y2: H - m.b }, this.gGrid);
        const t = svg('text', { x: xs(v), y: H - m.b + 16, 'text-anchor': 'middle' }, this.gAxes);
        t.textContent = this.o.xFormat(v);
      }
      svg('line', { class: 'axis-line', x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b }, this.gAxes);
      if (this.o.xLabel) { const t = svg('text', { class: 'axis-title', x: W - m.r, y: H - 4, 'text-anchor': 'end' }, this.gAxes); t.textContent = this.o.xLabel; }
      if (this.o.yLabel) { const t = svg('text', { class: 'axis-title', x: m.l, y: m.t - 5, 'text-anchor': 'start' }, this.gAxes); t.textContent = this.o.yLabel; }

      for (const r of this.refs.values()) {
        if (r.y === null) continue;
        const y = ys(Math.min(y1, Math.max(y0, r.y)));
        r.line.setAttribute('x1', m.l); r.line.setAttribute('x2', W - m.r); r.line.setAttribute('y1', y); r.line.setAttribute('y2', y);
        r.text.setAttribute('x', W - m.r - 4); r.text.setAttribute('y', y - 6); r.text.textContent = r.label;
      }
      for (const r of this.vrefs.values()) {
        if (r.x === null) continue;
        const x = xs(Math.min(x1, Math.max(x0, r.x)));
        r.line.setAttribute('x1', x); r.line.setAttribute('x2', x); r.line.setAttribute('y1', m.t); r.line.setAttribute('y2', H - m.b);
        r.text.setAttribute('x', x); r.text.setAttribute('y', m.t - 4); r.text.textContent = r.label;
      }
      const base = ys(Math.max(y0, 0));
      for (const s of this.series.values()) {
        const type = s.style.type || 'line';
        if (type === 'dots') {
          const pts = s.data.length > 800 ? s.data.filter((_, i) => i % Math.ceil(s.data.length / 800) === 0) : s.data;
          const r = s.style.r || 2.2;
          s.node.innerHTML = pts.map(([x, y]) => `<circle cx="${xs(x).toFixed(1)}" cy="${ys(y).toFixed(1)}" r="${r}"/>`).join('');
          continue;
        }
        if (type === 'bars') {
          const bwUnits = s.style.barWidth || 1, frac = s.style.barFrac ?? 0.8;
          const half = ((xs(x0 + bwUnits) - xs(x0)) * frac) / 2;
          s.node.innerHTML = s.data.map(([x, y]) => {
            if (x < x0 || x > x1) return '';
            const top = ys(Math.min(y1, y)); const h = Math.max(0, base - top);
            return `<rect x="${(xs(x) - half).toFixed(1)}" y="${top.toFixed(1)}" width="${(2 * half).toFixed(1)}" height="${h.toFixed(1)}" rx="1.5"/>`;
          }).join('');
          continue;
        }
        if (!s.data.length) { s.node.setAttribute('d', ''); continue; }
        let d = '';
        for (let i = 0; i < s.data.length; i++) {
          const [x, y] = s.data[i];
          if (log && x < x0) continue;
          d += (d ? 'L' : 'M') + xs(x).toFixed(1) + ' ' + ys(Math.max(y0 - (y1 - y0), Math.min(y1 + (y1 - y0), y))).toFixed(1);
        }
        if (type === 'area') { const f = s.data[0], l = s.data[s.data.length - 1]; d += `L${xs(l[0]).toFixed(1)} ${base.toFixed(1)}L${xs(f[0]).toFixed(1)} ${base.toFixed(1)}Z`; }
        s.node.setAttribute('d', d);
      }
    }
  }
  /* sample a function on [a,b] into [x,y] pairs */
  function curve(fn, a, b, n = 200) { const out = []; for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; out.push([x, fn(x)]); } return out; }

  /* ---------- Lab UI builders ---------- */
  const ui = {
    button(parent, label, { kind = '', small = false, onClick, attrs = {} } = {}) {
      const b = el('button', { type: 'button', class: `btn${kind ? ' btn--' + kind : ''}${small ? ' btn--small' : ''}`, text: label, ...attrs }, parent);
      if (onClick) b.addEventListener('click', onClick);
      return b;
    },
    slider(parent, { label, min, max, step = 1, value, format = (v) => v, onInput }) {
      const wrap = el('label', { class: 'slider' }, parent);
      const span = el('span', {}, wrap); span.append(label + ' ');
      const out = el('output', { text: format(value) }, span);
      const input = el('input', { type: 'range', min, max, step, value }, wrap);
      const api = {
        input, out, get value() { return +input.value; },
        set(v) { input.value = v; out.textContent = format(+input.value); },
      };
      input.addEventListener('input', () => { out.textContent = format(+input.value); if (onInput) onInput(+input.value); });
      return api;
    },
    readouts(parent, items) {
      const dl = el('dl', { class: 'readouts' }, parent);
      const map = {};
      for (const it of items) {
        const d = el('div', { class: it.span ? 'span-2' : '' }, dl);
        el('dt', { text: it.label }, d);
        map[it.id] = el('dd', { class: (it.green ? 'dd-green ' : '') + (it.text ? 'dd-text' : ''), text: it.value ?? '–' }, d);
      }
      return { set(id, v) { if (map[id]) map[id].textContent = v; }, el: map };
    },
    chips(parent, options, { value, label, onChange } = {}) {
      const wrap = el('div', { class: 'chips', role: 'group' }, parent);
      if (label) el('span', { class: 'chips-label', text: label }, wrap);
      const buttons = options.map((o) => el('button', { type: 'button', class: 'btn btn--small', text: o.label, 'aria-pressed': String(o.value === value) }, wrap));
      const api = {
        value,
        set(v) { api.value = v; buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(options[i].value === v))); },
      };
      buttons.forEach((b, i) => b.addEventListener('click', () => { api.set(options[i].value); if (onChange) onChange(options[i].value); }));
      return api;
    },
    legend(parent, items) {
      const p = el('p', { class: 'legend' }, parent);
      for (const it of items) el('span', { class: 'legend-item' }, p, `<span class="swatch swatch--${it.swatch}"></span>${it.label}`);
      return p;
    },
    /* standard lab skeleton: returns stage, controls, panel, plus helper to add readouts */
    lab(root) {
      root.innerHTML = '';
      const stage = el('div', { class: 'lab-stage' }, root);
      const panel = el('aside', { class: 'lab-panel' }, root);
      const controls = el('div', { class: 'controls' }, panel);
      return { root, stage, panel, controls };
    },
  };

  /* registry of lab builders: ST.labs[name] = (root, config) => void */
  const labs = {};
  function mountLabs() {
    for (const root of $$('.lab[data-lab]')) {
      const name = root.dataset.lab;
      if (!labs[name]) { console.warn('No lab builder for', name); continue; }
      try { labs[name](root, { ...root.dataset }); } catch (e) { console.error('Lab failed:', name, e); }
    }
  }

  return { reduced, $, $$, svg, el, fmt, pct, int, sig, setText, niceCeil, niceMax, randInt, animateSteps, dieFaceSVG, rollDie, LineChart, curve, ui, labs, mountLabs };
})();
