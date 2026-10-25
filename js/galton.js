/* Hero: a living Galton board on canvas. */
(() => {
  const { reduced, $ } = ST;
  const canvas = $('#galton');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const ROWS = 11, BINS = ROWS + 1;
  const bins = new Array(BINS).fill(0);
  const balls = [];
  let total = 0, W = 0, H = 0, dpr = 1, running = false, lastT = 0, dripAcc = 0;
  let queued = 0; // balls waiting to be released from a burst
  const css = getComputedStyle(document.documentElement);
  const color = (name) => css.getPropertyValue(name).trim();

  function geometry() {
    const s = W / (ROWS + 3);            // horizontal peg spacing
    const top = H * 0.08;
    const rowGap = (H * 0.56) / ROWS;
    const binTop = top + rowGap * (ROWS + 0.6);
    const binH = H - binTop - H * 0.03;
    return { s, top, rowGap, binTop, binH, cx: W / 2 };
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function spawn() {
    balls.push({ row: 0, k: 0, t: 0, dir: 0 });
  }
  function binomialDrop() {
    let k = 0; for (let i = 0; i < ROWS; i++) k += Math.random() < 0.5 ? 1 : 0;
    bins[k]++; total++;
  }

  function step(dt) {
    const speed = 9; // rows per second
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      if (b.dir === 0) b.dir = Math.random() < 0.5 ? -1 : 1;
      b.t += dt * speed;
      while (b.t >= 1) {
        b.t -= 1; b.row++; b.k += b.dir === 1 ? 1 : 0; b.dir = Math.random() < 0.5 ? -1 : 1;
        if (b.row >= ROWS) { bins[b.k]++; total++; balls.splice(i, 1); break; }
      }
    }
  }

  function draw() {
    const g = geometry();
    ctx.clearRect(0, 0, W, H);
    const ink = color('--ink'), blue = color('--blue'), green = color('--green'), soft = color('--blue-soft');

    // pegs
    ctx.fillStyle = color('--ink-3');
    for (let r = 0; r < ROWS; r++) {
      for (let k = 0; k <= r; k++) {
        const x = g.cx + (k - r / 2) * g.s, y = g.top + r * g.rowGap;
        ctx.beginPath(); ctx.arc(x, y, Math.max(1.6, g.s * 0.07), 0, Math.PI * 2); ctx.fill();
      }
    }
    // bins
    const maxCount = Math.max(1, ...bins);
    const bw = g.s * 0.82;
    for (let i = 0; i < BINS; i++) {
      const x = g.cx + (i - ROWS / 2) * g.s;
      const h = (bins[i] / maxCount) * g.binH;
      ctx.fillStyle = soft;
      ctx.fillRect(x - bw / 2, g.binTop, bw, g.binH);
      ctx.fillStyle = blue;
      ctx.fillRect(x - bw / 2, g.binTop + g.binH - h, bw, h);
    }
    // expected shape (binomial) once there is enough data
    if (total >= 60) {
      // expected count in bin k is total * C(ROWS,k) / 2^ROWS; draw it on the same scale as the bars
      ctx.strokeStyle = green; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath();
      let c = 1;
      for (let k = 0; k <= ROWS; k++) {
        const expected = (total * c) / Math.pow(2, ROWS);
        const x = g.cx + (k - ROWS / 2) * g.s;
        const y = g.binTop + g.binH - Math.min(1, expected / maxCount) * g.binH;
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        c = (c * (ROWS - k)) / (k + 1);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    // balls
    ctx.fillStyle = ink;
    const rad = Math.max(2.5, g.s * 0.16);
    for (const b of balls) {
      const x0 = g.cx + (b.k - b.row / 2) * g.s;
      const x1 = g.cx + (b.k + (b.dir === 1 ? 1 : 0) - (b.row + 1) / 2) * g.s;
      const e = b.t * b.t; // ease-in: falls faster as it drops
      const x = x0 + (x1 - x0) * b.t;
      const y = g.top + (b.row + e) * g.rowGap - Math.sin(Math.PI * b.t) * g.rowGap * 0.25;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    }
    ST.setText('galton-count', ST.int(total));
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
    lastT = t;
    dripAcc += dt;
    const interval = queued > 0 ? 0.035 : 0.14;
    while (dripAcc >= interval) {
      dripAcc -= interval;
      spawn();
      if (queued > 0) queued--;
    }
    step(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function start() { if (running || reduced) return; running = true; lastT = performance.now(); requestAnimationFrame(frame); }
  function stop() { running = false; }

  new ResizeObserver(resize).observe(canvas);
  resize();

  if (reduced) {
    for (let i = 0; i < 800; i++) binomialDrop();
    draw();
  } else {
    // only animate while the hero is on screen
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? start() : stop()));
    }, { threshold: 0.1 });
    io.observe(canvas);
  }

  const burst = $('#galton-burst');
  if (burst) burst.addEventListener('click', () => {
    if (reduced) { for (let i = 0; i < 100; i++) binomialDrop(); draw(); return; }
    queued += 100; start();
  });
  const reset = $('#galton-reset');
  if (reset) reset.addEventListener('click', () => { bins.fill(0); total = 0; balls.length = 0; queued = 0; draw(); });
})();
