// Project 4: Rattle & Block Toys. "Catch the Dreams" canvas game,
// a shakeable rattle, and stackable letter blocks.
import { $, $$, store, toast, emit, pick } from './util.js';
import { sfx } from './audio.js';

export function initToys() {
  initGame();
  initRattle();
  initBlocks();
}

/* ================= Catch the Dreams ================= */
function initGame() {
  const cv = $('#game');
  const wrap = cv.parentElement;
  const cx = cv.getContext('2d');
  const W = 360, H = 480;
  const overlay = $('#gOverlay');
  const msg = $('#gMsg');
  const startBtn = $('#gStart');
  const hudScore = $('#gScore');
  const hudLives = $('#gLives');
  const hudBest = $('#gBest');
  let best = store.get('game-best', 0);
  let state = 'idle';
  let visible = false;
  let raf = 0;
  let last = 0;
  let g;

  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = W * dpr;
  cv.height = H * dpr;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  hudBest.textContent = `best ${best}`;

  const bgStars = Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.4, p: Math.random() * 6 }));

  function reset() {
    g = { x: W / 2, tx: W / 2, items: [], fx: [], score: 0, lives: 3, t: 0, spawn: 0, keys: { l: false, r: false } };
    hud();
  }
  function hud() {
    hudScore.textContent = `★ ${g.score}`;
    hudLives.textContent = '♥'.repeat(g.lives) + '♡'.repeat(3 - g.lives);
  }

  function spawn() {
    const r = Math.random();
    const speedUp = Math.min(1.8, 1 + g.score / 60);
    let kind = 'star';
    if (r < 0.12) kind = 'moon';
    else if (r < 0.12 + Math.min(0.32, 0.16 + g.score / 300)) kind = 'rain';
    g.items.push({ kind, x: 24 + Math.random() * (W - 48), y: -20, vy: (70 + Math.random() * 50) * speedUp, wob: Math.random() * 6, r: kind === 'rain' ? 18 : kind === 'moon' ? 15 : 12 });
  }

  function step(dt) {
    g.t += dt;
    g.spawn -= dt;
    if (g.spawn <= 0) { spawn(); g.spawn = Math.max(0.38, 0.95 - g.score / 120); }
    if (g.keys.l) g.tx -= 340 * dt;
    if (g.keys.r) g.tx += 340 * dt;
    g.tx = Math.max(36, Math.min(W - 36, g.tx));
    g.x += (g.tx - g.x) * Math.min(1, dt * 14);

    for (let i = g.items.length - 1; i >= 0; i--) {
      const it = g.items[i];
      it.y += it.vy * dt;
      it.x += Math.sin(g.t * 3 + it.wob) * 18 * dt;
      const caught = it.y > 400 && it.y < 446 && Math.abs(it.x - g.x) < 40 + it.r * 0.4;
      if (caught) {
        g.items.splice(i, 1);
        if (it.kind === 'rain') {
          g.lives--; sfx.ouch(); burst(it.x, it.y, '#8fb8ff', 'oops');
          if (g.lives <= 0) { over(); return; }
        } else {
          const pts = it.kind === 'moon' ? 3 : 1;
          g.score += pts; sfx.catch(); burst(it.x, it.y, it.kind === 'moon' ? '#ffe7a3' : '#ffd98a', `+${pts}`);
          if (g.score > 0 && g.score % 25 === 0) { sfx.big(); burst(g.x, 400, '#ffb3c7', 'wow!!'); }
        }
        hud();
      } else if (it.y > H + 30) g.items.splice(i, 1);
    }
    for (let i = g.fx.length - 1; i >= 0; i--) {
      const f = g.fx[i];
      f.life -= dt;
      f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 200 * dt;
      if (f.life <= 0) g.fx.splice(i, 1);
    }
  }

  function burst(x, y, color, label) {
    for (let i = 0; i < 10; i++) g.fx.push({ x, y, vx: (Math.random() - 0.5) * 220, vy: -Math.random() * 220, life: 0.6, color, dot: true });
    g.fx.push({ x, y: y - 10, vx: 0, vy: -60, life: 0.8, color: '#fff', label });
  }

  /* --- drawing --- */
  function star(x, y, r, fill) {
    cx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.48 : r;
      cx.lineTo(x + Math.sin(a) * rr, y - Math.cos(a) * rr);
    }
    cx.closePath();
    cx.fillStyle = fill; cx.fill();
    cx.lineWidth = 2; cx.strokeStyle = '#2b2147'; cx.stroke();
  }
  function moon(x, y, r) {
    cx.save();
    cx.beginPath(); cx.arc(x, y, r, 0, 7);
    cx.fillStyle = '#ffe7a3'; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = '#2b2147'; cx.stroke();
    cx.globalCompositeOperation = 'destination-out';
    cx.beginPath(); cx.arc(x + r * 0.55, y - r * 0.35, r * 0.85, 0, 7); cx.fill();
    cx.restore();
  }
  function rain(x, y, r, t) {
    cx.fillStyle = '#7d86b8'; cx.strokeStyle = '#2b2147'; cx.lineWidth = 2;
    cx.beginPath();
    cx.arc(x - r * 0.6, y, r * 0.55, Math.PI * 0.5, Math.PI * 1.5);
    cx.arc(x - r * 0.1, y - r * 0.45, r * 0.6, Math.PI, Math.PI * 1.9);
    cx.arc(x + r * 0.6, y - r * 0.1, r * 0.5, Math.PI * 1.3, Math.PI * 0.5);
    cx.closePath(); cx.fill(); cx.stroke();
    cx.strokeStyle = '#2b2147';
    cx.beginPath(); cx.moveTo(x - 8, y - 6); cx.lineTo(x - 3, y - 3); cx.moveTo(x + 8, y - 6); cx.lineTo(x + 3, y - 3); cx.stroke();
    cx.beginPath(); cx.arc(x, y + 4, 4, Math.PI * 1.15, Math.PI * 1.85); cx.stroke();
    cx.fillStyle = '#8fb8ff';
    for (let i = -1; i <= 1; i++) { cx.beginPath(); cx.ellipse(x + i * 9, y + r * 0.8 + ((t * 60 + i * 7) % 10), 2, 3.5, 0, 0, 7); cx.fill(); }
  }
  function player(x) {
    const y = 432;
    cx.fillStyle = '#fff4f8'; cx.strokeStyle = '#f0cde0'; cx.lineWidth = 3;
    cx.beginPath();
    [[-28, 6, 16], [-10, -2, 20], [12, 0, 18], [30, 8, 14], [0, 10, 22]].forEach(([dx, dy, r]) => cx.arc(x + dx, y + dy, r, 0, 7));
    cx.fill();
    // mini Pip
    const hy = y - 30;
    cx.fillStyle = '#fffaf0'; cx.strokeStyle = '#2b2147'; cx.lineWidth = 2.5;
    cx.beginPath(); cx.ellipse(x, hy, 22, 20, 0, 0, 7); cx.fill(); cx.stroke();
    cx.fillStyle = '#fbf0d8';
    cx.beginPath(); cx.moveTo(x - 22, hy - 4); cx.bezierCurveTo(x - 22, hy - 34, x + 22, hy - 34, x + 22, hy - 6); cx.closePath(); cx.fill(); cx.stroke();
    cx.beginPath(); cx.arc(x - 26, hy + 2, 6, 0, 7); cx.fill(); cx.stroke();
    cx.fillStyle = '#3a2a3a';
    cx.beginPath(); cx.ellipse(x - 8, hy + 3, 6, 6, 0, 0, 7); cx.ellipse(x + 8, hy + 3, 6, 6, 0, 0, 7); cx.fill();
    const look = (g.tx - g.x) * 0.05;
    cx.fillStyle = '#fff3c0';
    cx.beginPath(); cx.arc(x - 8 + look, hy + 3, 1.8, 0, 7); cx.arc(x + 8 + look, hy + 3, 1.8, 0, 7); cx.fill();
    cx.fillStyle = '#ffb3c7';
    cx.beginPath(); cx.ellipse(x - 15, hy + 10, 4, 2.4, 0, 0, 7); cx.ellipse(x + 15, hy + 10, 4, 2.4, 0, 0, 7); cx.fill();
  }

  function draw(t) {
    const grd = cx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#1b1640'); grd.addColorStop(1, '#45348f');
    cx.fillStyle = grd; cx.fillRect(0, 0, W, H);
    bgStars.forEach((s) => { cx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + s.p)); cx.fillStyle = '#fff6e8'; cx.fillRect(s.x, s.y, s.r, s.r); });
    cx.globalAlpha = 1;
    if (!g) return;
    g.items.forEach((it) => {
      if (it.kind === 'star') star(it.x, it.y, it.r, '#ffd98a');
      else if (it.kind === 'moon') moon(it.x, it.y, it.r);
      else rain(it.x, it.y, it.r, t);
    });
    player(g.x);
    g.fx.forEach((f) => {
      cx.globalAlpha = Math.max(0, f.life / 0.6);
      if (f.label) { cx.fillStyle = f.color; cx.font = '600 18px "Pixelify Sans", monospace'; cx.textAlign = 'center'; cx.fillText(f.label, f.x, f.y); }
      else { cx.fillStyle = f.color; cx.fillRect(f.x - 2, f.y - 2, 4, 4); }
    });
    cx.globalAlpha = 1;
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (state === 'play') step(dt);
    draw(now / 1000);
    if (state === 'play' && visible && !document.hidden) raf = requestAnimationFrame(loop);
    else raf = 0;
  }
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };

  function start() {
    reset();
    state = 'play';
    overlay.hidden = true;
    wrap.classList.add('playing');
    cv.focus({ preventScroll: true });
    kick();
  }
  function over() {
    state = 'over';
    wrap.classList.remove('playing');
    const newBest = g.score > best;
    if (newBest) { best = g.score; store.set('game-best', best); hudBest.textContent = `best ${best}`; }
    msg.textContent = newBest ? `NEW BEST: ${g.score}!!` : `you caught ${g.score} dreams`;
    startBtn.textContent = '▶ again!';
    overlay.hidden = false;
    sfx.thud();
    if (g.score >= 10) emit('game-score', g.score);
    draw(performance.now() / 1000);
  }

  startBtn.addEventListener('click', start);
  const aim = (e) => {
    if (state !== 'play') return;
    const r = cv.getBoundingClientRect();
    g.tx = ((e.clientX - r.left) / r.width) * W;
  };
  cv.addEventListener('pointermove', aim);
  cv.addEventListener('pointerdown', aim);
  cv.tabIndex = 0;
  const key = (down) => (e) => {
    if (state !== 'play') return;
    if (e.key === 'ArrowLeft' || e.key === 'a') { g.keys.l = down; e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'd') { g.keys.r = down; e.preventDefault(); }
  };
  cv.addEventListener('keydown', key(true));
  cv.addEventListener('keyup', key(false));

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) { kick(); } }, { threshold: 0.2 }).observe(cv);
  } else visible = true;
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  reset();
  draw(0);
}

/* ================= Rattle ================= */
function initRattle() {
  const r = $('#rattle');
  const n = $('#rattleN');
  let count = 0;
  r.parentElement.dataset.quiet = '';
  r.addEventListener('click', (e) => {
    count++;
    n.textContent = count;
    r.classList.remove('shake');
    void r.offsetWidth;
    r.classList.add('shake');
    sfx.rattle();
    const b = r.getBoundingClientRect();
    emit('burst', { x: b.left + b.width / 2, y: b.top + b.height * 0.3, n: 8 });
    if (count === 10) toast('the rattle is dizzy now @_@');
    if (count === 50) toast('50 shakes!! you are a professional baby');
  });
}

/* ================= Blocks ================= */
function initBlocks() {
  const tray = $('#blocksTray');
  const tower = $('#blocksTower');
  const COLORS = ['#ffb3c7', '#c7b8ff', '#ffd98a', '#a8f0d8', '#8fb8ff', '#ffc89a'];
  const LETTERS = ['P', 'I', 'P', '♡', 'Z', 'Z', 'Z', '★'];
  const MAX = 7;
  let falling = false;

  LETTERS.forEach((ch, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'blk';
    b.textContent = ch;
    b.style.setProperty('--c', COLORS[i % COLORS.length]);
    b.setAttribute('aria-label', `Stack block ${ch === '♡' ? 'heart' : ch === '★' ? 'star' : ch}`);
    b.addEventListener('click', () => stack(ch, COLORS[i % COLORS.length]));
    tray.appendChild(b);
  });
  tray.dataset.quiet = '';

  function stack(ch, c) {
    if (falling) return;
    const b = document.createElement('div');
    b.className = 'blk';
    b.textContent = ch;
    b.style.setProperty('--c', c);
    b.style.setProperty('--tilt', `${(Math.random() - 0.5) * (4 + tower.children.length * 2)}deg`);
    tower.appendChild(b);
    sfx.pop();
    const word = [...tower.children].map((x) => x.textContent).join('');
    if (word === 'PIP') toast('P-I-P! that spells ME!! ♡');
    if (word === 'ZZZ') toast('zzz… a very sleepy tower');
    if (tower.children.length >= MAX) setTimeout(() => knock('TIMBER!! (too tall for a baby)'), 450);
  }

  function knock(note) {
    if (!tower.children.length || falling) return;
    falling = true;
    [...tower.children].forEach((b) => {
      b.style.setProperty('--fx', `${(Math.random() - 0.5) * 220}px`);
      b.style.setProperty('--fr', `${(Math.random() - 0.5) * 360}deg`);
    });
    tower.classList.add('fall');
    sfx.thud();
    setTimeout(() => sfx.giggle(), 250);
    if (note) toast(note);
    setTimeout(() => { tower.innerHTML = ''; tower.classList.remove('fall'); falling = false; }, 820);
  }
  $('#blocksReset').addEventListener('click', () => knock(pick(['crash! hehehe', 'boom. again again!'])));
}
