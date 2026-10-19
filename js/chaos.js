// Responsive Chaos Mode: Pip "decorates" the site like a scrapbook
// (tape, stickers, tilted windows) with a different personality for every
// screen size, and on desktop you can drag the windows around.
import { $, $$, toast, emit } from './util.js';
import { sfx } from './audio.js';

export function initChaos({ pip }) {
  const root = document.documentElement;
  const btn = $('#tbChaos');
  const wins = $$('[data-win]');
  const titles = $$('.sec-title');
  let lastW = innerWidth;
  let resizeT;

  const sizeName = (w) => (w < 700 ? 'pocket sticker-book' : w < 1100 ? 'scrapbook' : 'collage desk');
  const STICKERS = ['⭐', '🌙', '👻', '🍼', '💤', '☁️', '🧸', '🎀', '✨', '🍪', '🦄', '💖'];
  let layer = null;

  // stickers live in the page margins, so they never cover anything you need to read
  function stickers() {
    if (layer) layer.remove();
    const w = innerWidth;
    const h = document.documentElement.scrollHeight;
    const count = w < 700 ? 12 : w < 1100 ? 22 : 34;
    const size = w < 700 ? 24 : w < 1100 ? 32 : 40;
    const margin = w < 700 ? 0.07 : Math.max(0.06, (w - 1000) / 2 / w);
    layer = document.createElement('div');
    layer.className = 'stickers';
    layer.setAttribute('aria-hidden', 'true');
    let seed = 7;
    const r = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < count; i++) {
      const left = i % 2 ? 1 - margin * r() - 0.03 : margin * r();
      const el = document.createElement('span');
      el.className = 'sticker';
      el.style.left = `${(left * 100).toFixed(2)}%`;
      el.style.top = `${Math.round(((i + r()) / count) * (h - 200) + 80)}px`;
      el.style.setProperty('--s', `${Math.round(size * (0.75 + r() * 0.5))}px`);
      el.style.setProperty('--r', `${Math.round((r() - 0.5) * 50)}deg`);
      el.style.setProperty('--d', `${(i * 0.03).toFixed(2)}s`);
      el.innerHTML = `<span>${STICKERS[i % STICKERS.length]}</span>`;
      layer.appendChild(el);
    }
    document.body.appendChild(layer);
  }
  document.body.style.position = 'relative';

  function layout() {
    const w = innerWidth;
    const k = w < 700 ? 0.5 : w < 1100 ? 0.9 : 1.2;
    wins.forEach((el, i) => {
      if (el.dataset.dragged) return;
      const rot = ((((i * 37) % 9) - 4) * k * 0.6).toFixed(2);
      const dx = w >= 1100 ? (i % 2 ? 1 : -1) * (14 + ((i * 29) % 34)) : 0;
      el.style.setProperty('--rot', `${rot}deg`);
      el.style.setProperty('--dx', `${dx}px`);
    });
    titles.forEach((t, i) => t.style.setProperty('--chaos-tilt', `${(i % 2 ? 1 : -1) * (1 + k)}deg`));
    stickers();
  }

  function clear() {
    if (layer) { layer.remove(); layer = null; }
    wins.forEach((el) => { el.style.removeProperty('--rot'); el.style.removeProperty('--dx'); el.style.removeProperty('translate'); delete el.dataset.dragged; });
  }

  // the crayon font is only needed here, so it's fetched on first use
  function loadHandFont() {
    if (document.getElementById('handFont')) return;
    const l = document.createElement('link');
    l.id = 'handFont';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Gochi+Hand&display=swap';
    document.head.appendChild(l);
  }

  function set(on, announce) {
    if (on) loadHandFont();
    root.classList.toggle('chaos', on);
    try { localStorage.setItem('pip.chaos', on ? '1' : '0'); } catch { /* fine */ }
    btn.setAttribute('aria-pressed', String(on));
    btn.querySelector('.tb-l').textContent = on ? 'tidy up' : 'chaos';
    if (on) layout(); else clear();
    if (!announce) return;
    if (on) {
      sfx.big();
      emit('burst', { x: innerWidth / 2, y: innerHeight / 2, n: 80 });
      toast(`✂ chaos mode! ur screen is ${innerWidth}px wide, so it's a ${sizeName(innerWidth)} ✦`, 3600);
      const p = pip();
      if (p) p.say('i decorated!! do u like my stickers?', 3000);
    } else {
      sfx.boop();
      toast('phew. tidy again ♡');
    }
  }

  btn.addEventListener('click', () => set(!root.classList.contains('chaos'), true));
  set(root.classList.contains('chaos'), false);

  // the layout reshapes to every screen, and Pip notices when you resize
  addEventListener('resize', () => {
    if (!root.classList.contains('chaos')) return;
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      layout();
      if (Math.abs(innerWidth - lastW) > 60) {
        toast(`ooh! ${innerWidth}×${innerHeight}: now it's a ${sizeName(innerWidth)}`, 2200);
        lastW = innerWidth;
      }
    }, 200);
  });

  // drag windows by their title bar (mouse / pen only, so phones can still scroll)
  wins.forEach((el) => {
    const bar = el.querySelector('.win-bar');
    if (!bar) return;
    let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
    bar.addEventListener('pointerdown', (e) => {
      if (!root.classList.contains('chaos') || e.pointerType === 'touch' || e.target.closest('i, button')) return;
      dragging = true;
      el.classList.add('dragging');
      const [tx, ty] = (el.style.translate || '0px 0px').split(' ').map(parseFloat);
      ox = tx || 0; oy = ty || 0; sx = e.clientX; sy = e.clientY;
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      el.style.translate = `${ox + e.clientX - sx}px ${oy + e.clientY - sy}px`;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
      el.dataset.dragged = '1';
    };
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
  });
}
