/* Sample spaces and events: build an event from die faces, then roll to see how often it happens. */
(() => {
  const { $, $$, fmt, int, setText, animateSteps, dieFaceSVG, rollDie, reduced } = ST;
  const root = $('[data-module="events"]');
  if (!root) return;

  const inE = new Set([2, 4, 6]);
  let rolls = 0, hits = 0, last = null, busy = false;
  const faces = $('#event-faces');
  const die = $('#event-die');
  const PRESETS = {
    even: [2, 4, 6], odd: [1, 3, 5], high: [5, 6], prime: [2, 3, 5], all: [1, 2, 3, 4, 5, 6], none: [],
  };

  faces.innerHTML = [1, 2, 3, 4, 5, 6].map((v) =>
    `<button type="button" class="face-toggle" data-value="${v}" aria-pressed="false" aria-label="Face ${v}">${dieFaceSVG(v, 56)}</button>`).join('');
  const toggles = $$('.face-toggle', faces);

  function setName() {
    const arr = [...inE].sort();
    setText('event-set', arr.length ? `{${arr.join(', ')}}` : '∅ (empty)');
    const p = inE.size / 6;
    setText('event-p', `${inE.size}/6 = ${fmt(p, 3)}`);
    setText('event-pc', fmt(1 - p, 3));
    $('#event-bar-theory').style.width = (100 * p) + '%';
    toggles.forEach((b) => b.setAttribute('aria-pressed', inE.has(+b.dataset.value)));
  }
  function roll() {
    last = 1 + ST.randInt(6);
    rolls++; if (inE.has(last)) hits++;
  }
  function render() {
    setText('event-rolls', int(rolls));
    setText('event-hits', int(hits));
    setText('event-freq', rolls ? fmt(hits / rolls, 3) : '–');
    $('#event-bar-observed').style.width = (rolls ? (100 * hits) / rolls : 0) + '%';
    toggles.forEach((b) => b.classList.toggle('is-hit', last !== null && +b.dataset.value === last));
    if (last !== null) { die.innerHTML = dieFaceSVG(last, 96); die.classList.toggle('is-in', inE.has(last)); }
  }

  toggles.forEach((b) => b.addEventListener('click', () => {
    const v = +b.dataset.value;
    inE.has(v) ? inE.delete(v) : inE.add(v);
    setName(); render();
  }));
  $$('[data-preset]', root).forEach((b) => b.addEventListener('click', () => {
    inE.clear(); PRESETS[b.dataset.preset].forEach((v) => inE.add(v));
    setName(); render();
  }));
  $('#event-roll').addEventListener('click', () => {
    if (busy) return; busy = true;
    roll();
    rollDie(die, last, () => { render(); busy = false; });
  });
  $$('[data-rolls]', root).forEach((b) => b.addEventListener('click', () => {
    if (busy) return; busy = true;
    animateSteps(+b.dataset.rolls, roll, render, () => { busy = false; });
  }));
  $('#event-reset').addEventListener('click', () => { rolls = 0; hits = 0; last = null; die.innerHTML = dieFaceSVG(1, 96); die.classList.remove('is-in'); render(); });

  die.innerHTML = dieFaceSVG(1, 96);
  setName(); render();
})();
