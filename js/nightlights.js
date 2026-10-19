// Project 2: Nightlight Collection. A dark closet + a flashlight cursor
// (CSS mask). Find each nightlight and click it to switch it on.
import { $, emit, toast } from './util.js';
import { sfx, bell, freq } from './audio.js';

const LAMPS = [
  {
    id: 'jelly', x: 20, y: 40, w: 84, c: '#a8f0d8', note: 'C5',
    name: 'Jellyfish Jar', desc: 'a jar with one (1) very chill jellyfish. it glows when it\'s happy, which is always.',
    svg: '<svg viewBox="0 0 100 120"><rect x="28" y="6" width="44" height="12" rx="4" fill="#c7b8ff" stroke="#2b2147" stroke-width="3"/><path d="M22 22h56q8 0 8 12v66q0 14-16 14H30q-16 0-16-14V34q0-12 8-12z" fill="#d8fff2" fill-opacity=".55" stroke="#2b2147" stroke-width="3"/><path d="M32 64a18 16 0 0 1 36 0z" fill="#a8f0d8" stroke="#2b2147" stroke-width="2.5"/><path d="M36 66q-3 12 2 22M46 66q-2 14 2 26M56 66q3 12-1 24M64 66q4 10 0 20" stroke="#2b2147" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="44" cy="56" r="2" fill="#2b2147"/><circle cx="56" cy="56" r="2" fill="#2b2147"/></svg>',
  },
  {
    id: 'shroom', x: 50, y: 40, w: 86, c: '#ffb3c7', note: 'E5',
    name: 'Mushroom Lamp', desc: 'grew it myself from a sock i forgot under the bed. very soft light. smells like toast?',
    svg: '<svg viewBox="0 0 100 120"><path d="M38 64h24l4 46H34z" fill="#fff3e3" stroke="#2b2147" stroke-width="3"/><path d="M8 66C8 30 30 10 50 10s42 20 42 56z" fill="#ff9cc0" stroke="#2b2147" stroke-width="3"/><g fill="#fff6e8"><circle cx="30" cy="40" r="7"/><circle cx="56" cy="28" r="6"/><circle cx="72" cy="50" r="7"/><circle cx="46" cy="54" r="4"/></g><path d="M44 86q6 4 12 0" stroke="#2b2147" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="26" y="108" width="48" height="8" rx="4" fill="#c7b8ff" stroke="#2b2147" stroke-width="3"/></svg>',
  },
  {
    id: 'bucket', x: 80, y: 40, w: 84, c: '#ffd98a', note: 'G5',
    name: 'Star Bucket', desc: 'i caught these on a fishing trip. throw them back in the sky every morning. it\'s the rules.',
    svg: '<svg viewBox="0 0 100 120"><path d="M30 44q20-34 40 0" stroke="#2b2147" stroke-width="3" fill="none"/><path d="M14 54h72l-10 58H24z" fill="#8fb8ff" stroke="#2b2147" stroke-width="3"/><g fill="#ffd98a" stroke="#2b2147" stroke-width="2"><path d="M34 30l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z"/><path d="M62 36l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z"/><path d="M50 48l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z"/></g><path d="M14 54h72" stroke="#2b2147" stroke-width="6"/></svg>',
  },
  {
    id: 'moon', x: 20, y: 82, w: 140, c: '#ffe7a3', note: 'A5', img: true,
    name: 'The Snoozing Moon', desc: 'my favourite!! a moon that is also sleepy, so you\'re never sleepy alone. (porcelain, brass handle)',
  },
  {
    id: 'candle', x: 50, y: 82, w: 70, c: '#c7b8ff', note: 'C6',
    name: 'Little Ghost Candle', desc: 'the flame is a tiny friendly ghost named Flick. no fire, only feelings. 100% baby-safe.',
    svg: '<svg viewBox="0 0 80 130"><path d="M40 8c14 14 16 28 12 38-3 8-21 8-24 0-4-10-2-24 12-38z" fill="#e9e2ff" stroke="#2b2147" stroke-width="3"/><circle cx="35" cy="34" r="2.4" fill="#2b2147"/><circle cx="45" cy="34" r="2.4" fill="#2b2147"/><path d="M37 40q3 3 6 0" stroke="#2b2147" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="24" y="54" width="32" height="56" rx="6" fill="#fff6e8" stroke="#2b2147" stroke-width="3"/><path d="M24 66q8 6 16 0t16 0" stroke="#ffb3c7" stroke-width="3" fill="none"/><ellipse cx="40" cy="116" rx="30" ry="8" fill="#ffd98a" stroke="#2b2147" stroke-width="3"/></svg>',
  },
  {
    id: 'cloud', x: 81, y: 82, w: 100, c: '#8fb8ff', note: 'D6',
    name: 'Rainy Cloud Lamp', desc: 'it rains little drops of light. great for ghosts who miss the sound of rain.',
    svg: '<svg viewBox="0 0 120 120"><path d="M24 64a18 18 0 0 1 6-34 24 24 0 0 1 44-6 20 20 0 0 1 30 18 16 16 0 0 1-4 22z" fill="#eef3ff" stroke="#2b2147" stroke-width="3"/><path d="M48 46q4 3 8 0M66 46q4 3 8 0" stroke="#2b2147" stroke-width="2.5" fill="none" stroke-linecap="round"/><g fill="#8fb8ff" stroke="#2b2147" stroke-width="2"><path d="M38 76q-4 8 0 10t0-10z"/><path d="M58 82q-4 8 0 10t0-10z"/><path d="M78 76q-4 8 0 10t0-10z"/><path d="M48 96q-4 8 0 10t0-10z"/><path d="M70 98q-4 8 0 10t0-10z"/></g></svg>',
  },
];

export function initNightlights() {
  const room = $('#nlRoom');
  const dark = $('#nlDark');
  const wrap = $('#nlLamps');
  const card = $('#nlCard');
  const count = $('#nlCount');
  const lit = new Set();
  const fl = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  let anim = false;
  let cardT;

  LAMPS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'nl-lamp';
    b.style.left = `${l.x}%`;
    b.style.top = `${l.y}%`;
    b.style.setProperty('--w', `${l.w}px`);
    b.style.setProperty('--c', l.c);
    b.setAttribute('aria-label', `${l.name}: switch on`);
    b.innerHTML = `<span class="halo"></span>${l.img
      ? '<img src="assets/img/lantern-480.webp" width="480" height="428" alt="" loading="lazy" decoding="async">'
      : l.svg}`;
    b.addEventListener('click', () => toggle(l, b));
    b.addEventListener('focus', () => aim(l.x / 100, (l.y - 10) / 100));
    wrap.appendChild(b);
  });

  function toggle(l, b) {
    const on = !lit.has(l.id);
    if (on) lit.add(l.id); else lit.delete(l.id);
    b.classList.toggle('lit', on);
    b.setAttribute('aria-label', `${l.name}: switch ${on ? 'off' : 'on'}`);
    b.setAttribute('aria-pressed', String(on));
    if (on) { bell(freq(l.note), 0, 0.18, 1.4); bell(freq(l.note) * 1.5, 0.08, 0.06, 1); } else sfx.click();
    count.textContent = `${lit.size}/${LAMPS.length} lit`;
    card.innerHTML = on ? `<b>${l.name}</b>: ${l.desc}` : `${l.name} is resting.`;
    card.classList.add('on');
    clearTimeout(cardT);
    cardT = setTimeout(() => card.classList.remove('on'), 5200);
    paint();
    if (lit.size === LAMPS.length && !room.classList.contains('all-lit')) {
      room.classList.add('all-lit');
      setTimeout(() => {
        sfx.big();
        card.innerHTML = '<b>ALL LIT!</b> the closet is so cozy now. thank u for helping me find them all ♡';
        card.classList.add('on');
        emit('secret', 'lamps');
      }, 500);
    } else if (lit.size < LAMPS.length) room.classList.remove('all-lit');
  }

  // darkness = several mask layers intersected: one hole for the flashlight,
  // one for each lamp that's switched on
  function paint() {
    const r = room.getBoundingClientRect();
    const big = Math.max(90, Math.min(150, r.width * 0.16));
    const layers = [`radial-gradient(circle at ${(fl.x * 100).toFixed(2)}% ${(fl.y * 100).toFixed(2)}%, transparent 0 ${big * 0.55}px, #000 ${big}px)`];
    LAMPS.forEach((l) => {
      if (lit.has(l.id)) layers.push(`radial-gradient(circle at ${l.x}% ${l.y - 12}%, transparent 0 ${big * 0.5}px, #000 ${big * 1.1}px)`);
    });
    dark.style.setProperty('--mask', layers.join(','));
    dark.style.maskComposite = 'intersect';
    dark.style.webkitMaskComposite = 'source-in';
  }

  function aim(x, y) {
    fl.tx = x; fl.ty = y;
    if (!anim) { anim = true; requestAnimationFrame(step); }
  }
  function step() {
    fl.x += (fl.tx - fl.x) * 0.25;
    fl.y += (fl.ty - fl.y) * 0.25;
    paint();
    if (Math.abs(fl.tx - fl.x) + Math.abs(fl.ty - fl.y) > 0.002) requestAnimationFrame(step);
    else anim = false;
  }

  const fromEvent = (e) => {
    const r = room.getBoundingClientRect();
    aim((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  };
  room.addEventListener('pointermove', fromEvent);
  room.addEventListener('pointerdown', fromEvent);
  addEventListener('resize', paint);
  paint();

  // a little sweep so first-time visitors get the idea
  let swept = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      if (!en.isIntersecting || swept) return;
      swept = true;
      const path = [[0.2, 0.3], [0.8, 0.35], [0.5, 0.7], [0.5, 0.5]];
      path.forEach(([x, y], i) => setTimeout(() => aim(x, y), 400 + i * 520));
      setTimeout(() => toast('psst: click the glowy things!'), 2600);
    }, { threshold: 0.5 }).observe(room);
  }
}
