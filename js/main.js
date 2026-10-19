// Pip's Dream Workshop: boots the page and wires the shared bits
// (toolbar, mood, sound, sparkles, visitor memory, hit counter).
import { $, $$, store, toast, on, emit, reducedMotion, pick, renderOdometer } from './util.js';
import { sfx, isMuted, setMuted } from './audio.js';
import { Pip } from './pip.js';
import { initStory } from './story.js';
import { initLullaby } from './lullaby.js';
import { initNightlights } from './nightlights.js';
import { initRoutes } from './routes.js';
import { initToys } from './toys.js';
import { initStorybook } from './storybook.js';
import { initGrowth } from './growth.js';
import { initChat } from './chat.js';
import { initGuestbook } from './guestbook.js';
import { initChaos } from './chaos.js';
import { initEggs } from './eggs.js';
import { initNav } from './nav.js';
import { initDesk } from './desk.js';

const root = document.documentElement;
let pip;
let pip3d = null;
let is3dMode = false;

// one broken toy should never take the whole nursery down
function safe(name, fn) {
  try { fn(); } catch (err) { console.warn(`[pip] ${name} took a nap:`, err); }
}

/* ---------------- visitor memory ---------------- */
const visit = (() => {
  const v = store.get('visitor', { visits: 0, first: Date.now(), last: 0, name: '' });
  const prevLast = v.last;
  v.visits += 1;
  v.last = Date.now();
  store.set('visitor', v);
  return { ...v, prevLast };
})();
export const getVisitor = () => store.get('visitor', visit);

function greeting() {
  const name = getVisitor().name;
  if (visit.visits <= 1) return 'hi hi! i\'m Pip! ✦';
  const away = Date.now() - visit.prevLast;
  const hi = name ? `welcome back, ${name}!` : 'you came back!!';
  if (away < 1000 * 60 * 30) return `${hi} (that was quick hehe)`;
  return `${hi} visit #${visit.visits} ✦ i saved u a dream`;
}

/* ---------------- boot screen ----------------
   the dial-up screen itself runs inline in index.html so it never waits on
   these modules; here Pip just says hello once it has faded */
function boot() {
  const greet = () => { if (pip) { pip.wave(); pip.say(greeting(), 4200); } };
  if (document.body.classList.contains('booted')) greet();
  else document.addEventListener('pip:booted', greet, { once: true });
}

/* ---------------- mood (day / night) ---------------- */
function setMood(mood, announce) {
  root.dataset.mood = mood;
  store.set('mood', mood);
  try { localStorage.setItem('pip.mood', mood); } catch { /* fine */ }
  const btn = $('#tbMood');
  btn.querySelector('.tb-i').textContent = mood === 'night' ? '☾' : '☀';
  btn.querySelector('.tb-l').textContent = mood;
  $('meta[name="theme-color"]').content = mood === 'night' ? '#1b1640' : '#fff1e2';
  const meter = $('#sleepMeter');
  if (meter) meter.style.width = mood === 'night' ? '18%' : '86%';
  const meterVal = $('#sleepMeterVal');
  if (meterVal) meterVal.textContent = mood === 'night' ? '18% (wide awake!)' : '86% (very sleepy… zzz)';
  if (pip) {
    pip.setMood(mood);
    if (announce) pip.say(mood === 'night' ? 'ooh it\'s night! i\'m AWAKE ✦' : '*yawn* daytime… so sleepy…', 2800);
  }
  emit('mood', mood);
}

/* ---------------- sound ---------------- */
function renderSound() {
  const m = isMuted();
  const b = $('#tbSound');
  b.setAttribute('aria-pressed', String(m));
  b.querySelector('.tb-i').textContent = m ? '🔇' : '🔊';
  b.querySelector('.tb-l').textContent = m ? 'muted' : 'sound on';
}

/* ---------------- clock ---------------- */
function clock() {
  const el = $('#tbClock');
  const tick = () => {
    const d = new Date();
    const h = d.getHours();
    const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let tag = '';
    if (h >= 19 || h < 6) tag = ' ☾';
    else if (h >= 17) tag = ' ⌛';
    el.textContent = t + tag;
    el.title = h >= 19 || h < 6 ? 'it\'s dream o\'clock' : `bedtime in ~${(19 - h + 24) % 24}h`;
  };
  tick();
  setInterval(tick, 20000);
}

/* ---------------- start menu ---------------- */
function startMenu() {
  const btn = $('#tbStart');
  const menu = $('#startMenu');
  const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menu.hidden;
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) menu.querySelector('a').focus();
  });
  menu.addEventListener('click', (e) => { if (e.target.closest('a,button')) close(); });
  document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target)) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { close(); btn.focus(); } });

  const sm3d = $('#sm3d');
  if (sm3d) {
    sm3d.addEventListener('click', () => {
      document.getElementById('hello').scrollIntoView({ behavior: 'smooth' });
      switchPipMode(true);
    });
  }

  $('#smShutdown').addEventListener('click', () => {
    const s = $('#shutdown');
    s.hidden = false;
    sfx.yawn();
    if (pip) pip.sleep();
    const wake = () => {
      s.hidden = true;
      if (pip) pip.wake(false);
      removeEventListener('keydown', wake);
    };
    setTimeout(() => { s.addEventListener('click', wake, { once: true }); addEventListener('keydown', wake); }, 400);
  });
}

/* ---------------- odometer hit counter ---------------- */
async function hitCounter() {
  const el = $('#hitCounter');
  renderOdometer(el, 0, 6);
  let first = false;
  try { first = !sessionStorage.getItem('pip.counted'); sessionStorage.setItem('pip.counted', '1'); } catch { /* fine */ }
  try {
    const res = await fetch('/api/counter', { method: first ? 'POST' : 'GET', headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(res.status);
    const { count } = await res.json();
    setTimeout(() => renderOdometer(el, count, 6), 500);
  } catch {
    // no backend (e.g. opened from a file): count this browser's visits instead
    setTimeout(() => renderOdometer(el, visit.visits, 6), 500);
    el.title = 'offline mode: counting your visits';
  }
}

/* ---------------- sparkle cursor trail ---------------- */
function sparkles() {
  const cv = $('#sparkles');
  if (reducedMotion() || !cv.getContext) { cv.remove(); return; }
  const cx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const parts = [];
  let running = false;
  let lx = 0, ly = 0;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);

  const COLORS = ['#ffd98a', '#ffb3c7', '#c7b8ff', '#a8f0d8', '#ffffff'];
  const spawn = (x, y, n = 1, burst = false) => {
    for (let i = 0; i < n; i++) {
      const day = root.dataset.mood === 'day';
      const r = Math.random();
      parts.push({
        x, y,
        vx: (Math.random() - 0.5) * (burst ? 5 : 1.2),
        vy: (burst ? -Math.random() * 4 : Math.random() * 0.6) - 0.2,
        life: 1,
        decay: 0.016 + Math.random() * 0.02,
        size: 3 + Math.random() * (burst ? 7 : 5),
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.2,
        color: pick(COLORS),
        kind: r < 0.12 ? 'bone' : day ? (r < 0.55 ? 'heart' : 'bubble') : (r < 0.8 ? 'star' : 'dot'),
      });
    }
    if (parts.length > 220) parts.splice(0, parts.length - 220);
    if (!running) { running = true; requestAnimationFrame(draw); }
  };

  const star = (s) => {
    cx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      const rr = i % 2 ? s * 0.45 : s;
      cx.lineTo(Math.sin(a) * rr, -Math.cos(a) * rr);
    }
    cx.closePath(); cx.fill();
  };
  const heart = (s) => {
    cx.beginPath();
    cx.moveTo(0, s * 0.35);
    cx.bezierCurveTo(-s * 1.1, -s * 0.4, -s * 0.4, -s * 1.1, 0, -s * 0.45);
    cx.bezierCurveTo(s * 0.4, -s * 1.1, s * 1.1, -s * 0.4, 0, s * 0.35);
    cx.fill();
  };
  const bone = (s) => {
    cx.lineWidth = s * 0.45; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(-s, 0); cx.lineTo(s, 0); cx.stroke();
    [[-s, -s * 0.35], [-s, s * 0.35], [s, -s * 0.35], [s, s * 0.35]].forEach(([a, b]) => { cx.beginPath(); cx.arc(a, b, s * 0.38, 0, 7); cx.fill(); });
  };

  function draw() {
    cx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.rot += p.vr; p.life -= p.decay;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      cx.save();
      cx.globalAlpha = Math.min(1, p.life * 1.4);
      cx.translate(p.x, p.y); cx.rotate(p.rot);
      cx.fillStyle = p.kind === 'bone' ? '#fffaf0' : p.color;
      cx.strokeStyle = '#fffaf0';
      const s = p.size * (0.5 + p.life * 0.5);
      if (p.kind === 'star') star(s);
      else if (p.kind === 'heart') heart(s);
      else if (p.kind === 'bone') bone(s * 0.7);
      else if (p.kind === 'bubble') { cx.strokeStyle = p.color; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(0, 0, s, 0, 7); cx.stroke(); }
      else { cx.beginPath(); cx.arc(0, 0, s * 0.4, 0, 7); cx.fill(); }
      cx.restore();
    }
    if (parts.length) requestAnimationFrame(draw);
    else { running = false; cx.clearRect(0, 0, W, H); }
  }

  addEventListener('pointermove', (e) => {
    const d = Math.hypot(e.clientX - lx, e.clientY - ly);
    if (d < 14) return;
    lx = e.clientX; ly = e.clientY;
    spawn(e.clientX, e.clientY, e.pointerType === 'touch' ? 1 : 2);
  }, { passive: true });
  addEventListener('pointerdown', (e) => spawn(e.clientX, e.clientY, 8, true), { passive: true });
  on('burst', ({ x, y, n = 30 }) => spawn(x, y, n, true));
}

/* ---------------- click sounds everywhere (with mute) ---------------- */
function clickSounds() {
  document.addEventListener('click', (e) => {
    const t = e.target.closest('a, button, label, input[type="radio"], .dicon');
    if (!t || t.closest('[data-quiet]')) return;
    sfx.click();
  });
}

/* ---------------- window title-bar buttons ---------------- */
function windowButtons() {
  const quips = ['nope! this window is having a nice time', 'can\'t close, it\'s storytime', 'minimize?? but i\'m already tiny', 'that button is just for decoration (like my bow)'];
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.win-btns i');
    if (!b) return;
    const w = b.closest('[data-win], .win, .im');
    w.classList.remove('wiggle');
    void w.offsetWidth;
    w.classList.add('wiggle');
    sfx.boop();
    toast(pick(quips));
  });
  // the spans are decorative; give them real button semantics lazily
  $$('.win-btns i').forEach((i) => { i.setAttribute('role', 'presentation'); });
}

/* ---------------- webring ---------------- */
function webring() {
  const ids = ['hello', 'story', 'routes', 'work', 'chat', 'guestbook'];
  $$('.webring a').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const kind = a.dataset.ring;
    const target = kind === 'random' ? pick(ids.slice(1)) : kind === 'prev' ? 'guestbook' : 'hello';
    document.getElementById(target).scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth' });
    toast(kind === 'random' ? '✦ webring says: go here!' : 'the webring only has 1 site. it\'s me ♡');
  }));
}

/* ---------------- go! ---------------- */
// below-the-fold toys wake up when the browser is idle, so the first paint stays quick
const idle = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
const later = (name, fn) => idle(() => safe(name, fn));

/* ---------------- properties window tabs & controls ---------------- */
function propertiesWindow() {
  const tabs = [
    { btn: $('#tabPropsGeneral'), panel: $('#panelPropsGeneral') },
    { btn: $('#tabPropsQuirks'), panel: $('#panelPropsQuirks') },
    { btn: $('#tabPropsBedtime'), panel: $('#panelPropsBedtime') },
  ];

  tabs.forEach(({ btn, panel }) => {
    if (!btn || !panel) return;
    btn.addEventListener('click', () => {
      tabs.forEach((t) => {
        const active = t.btn === btn;
        t.btn.classList.toggle('on', active);
        t.btn.setAttribute('aria-selected', String(active));
        t.panel.hidden = !active;
      });
      sfx.click();
    });
  });

  // Quirk: tickle Pip
  const tickleBtn = $('#btnTickleQuirk');
  if (tickleBtn) {
    tickleBtn.addEventListener('click', () => {
      if (pip) {
        pip.boop();
        pip.say('hehehe that tickles my funny bone!!', 2800);
      }
    });
  }

  // Bedtime: bedtime tune
  const tuneBtn = $('#btnBedtimeTune');
  if (tuneBtn) {
    tuneBtn.addEventListener('click', () => {
      sfx.sparkle();
      sfx.bell(440, 0, 0.2, 1.2);
      sfx.bell(554.37, 0.15, 0.2, 1.2);
      sfx.bell(659.25, 0.3, 0.3, 1.5);
      if (pip) pip.say('♪ soft bedtime lullaby humming… ♪', 3000);
      toast('♫ playing Pip\'s bedtime hum…');
    });
  }

  // Bedtime: lamp checkbox
  const lampChk = $('#chkBedtimeLamp');
  if (lampChk) {
    lampChk.addEventListener('change', () => {
      if (lampChk.checked) {
        sfx.sparkle();
        toast('🏮 bedside lantern lit! sleep tight');
      } else {
        sfx.click();
      }
    });
  }

  // Properties help button
  const helpBtn = $('#propsHelpBtn');
  if (helpBtn) {
    helpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.sparkle();
      toast('⚙ Pip\'s certified Junior Dream Engineer spec sheet · Midnight Nursery Archive');
    });
  }
}

async function switchPipMode(to3d) {
  const btn2d = $('#pipMode2d');
  const btn3d = $('#pipMode3d');
  const hero2d = $('#pipHero');
  const wrap3d = $('#pip3dContainer');
  const loader = $('#pip3dLoading');

  if (to3d === is3dMode) return;
  is3dMode = to3d;

  if (btn2d) {
    btn2d.classList.toggle('on', !to3d);
    btn2d.setAttribute('aria-selected', String(!to3d));
  }
  if (btn3d) {
    btn3d.classList.toggle('on', to3d);
    btn3d.setAttribute('aria-selected', String(to3d));
  }

  if (to3d) {
    if (hero2d) hero2d.hidden = true;
    if (wrap3d) wrap3d.hidden = false;
    if (loader) loader.classList.remove('done');
    if (!pip3d) {
      toast('✦ warming up 3D dream engine…');
      try {
        const { Pip3DViewer } = await import('./pip3d.js');
        pip3d = new Pip3DViewer({
          container: wrap3d,
          canvas: $('#pip3dCanvas'),
          loadingEl: loader,
          resetBtn: $('#pip3dReset'),
          getMood: () => root.dataset.mood || 'night',
          onBoop: () => {
            sfx.giggle();
            if (pip) {
              const quips = ['giggles in 3D!! ♡', 'wheee that tickles!', 'spin me again!', 'look at my starry hat!'];
              pip.say(pick(quips), 2400);
            }
          },
        });
        await pip3d.init();
        if (loader) loader.classList.add('done');
        toast('✨ 3D Pip is ready! drag to rotate ✦');
      } catch (e) {
        console.error(e);
        toast('3D engine took a nap, back to 2D puppet');
        switchPipMode(false);
        return;
      }
    } else {
      pip3d.start();
      pip3d.onResize();
      if (loader) loader.classList.add('done');
    }
    if (pip) pip.say('whoa, i\'m 3D!! drag to spin me around ✦', 3500);
    sfx.sparkle();
  } else {
    if (wrap3d) wrap3d.hidden = true;
    if (hero2d) hero2d.hidden = false;
    if (pip3d) pip3d.stop();
    if (pip) pip.say('back to 2D puppet mode ♡', 2000);
    sfx.boop();
  }
}

safe('pip', () => { pip = new Pip($('#pipHero'), $('#pipBubble')); });
safe('pip3dToggle', () => {
  const btn2d = $('#pipMode2d');
  const btn3d = $('#pipMode3d');
  if (btn2d) btn2d.addEventListener('click', () => switchPipMode(false));
  if (btn3d) btn3d.addEventListener('click', () => switchPipMode(true));
  on('mood', (m) => { if (pip3d) pip3d.updateMood(m); });
});
safe('mood', () => {
  setMood(root.dataset.mood || 'night');
  $('#tbMood').addEventListener('click', () => { setMood(root.dataset.mood === 'night' ? 'day' : 'night', true); sfx.sparkle(); });
});
safe('sound', () => {
  renderSound();
  $('#tbSound').addEventListener('click', () => {
    setMuted(!isMuted());
    renderSound();
    toast(isMuted() ? '🔇 shhh… all sounds off' : '🔊 sounds on! ♪');
    if (!isMuted()) sfx.sparkle();
  });
});
safe('boop', () => $('#pipBoop').addEventListener('click', () => {
  if (is3dMode && pip3d) {
    pip3d.boop();
  }
  if (pip) pip.boop();
}));
safe('boot', boot);
safe('clock', clock);
safe('start', startMenu);
safe('propsWin', propertiesWindow);
later('counter', hitCounter);
later('sparkles', sparkles);
safe('clicks', clickSounds);
safe('winbtns', windowButtons);
later('webring', webring);
safe('desk', initDesk);
safe('nav', initNav);
safe('story', initStory);
later('lullaby', initLullaby);
later('nightlights', initNightlights);
later('routes', initRoutes);
later('toys', initToys);
later('storybook', initStorybook);
later('growth', initGrowth);
later('chat', () => initChat({ getVisitor, pip: () => pip }));
later('guestbook', () => initGuestbook({ getVisitor }));
safe('chaos', () => initChaos({ pip: () => pip }));
safe('eggs', () => initEggs({ pip: () => pip }));
