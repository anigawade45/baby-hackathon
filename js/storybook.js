// Project 5: Bedtime Storybook. "Goodnight, Boo", written & drawn by Pip.
// 3D page-turn with buttons, arrow keys and swipe.
import { $ } from './util.js';
import { sfx } from './audio.js';

const ATTIC = '<path d="M20 190 L150 40 L280 190" fill="none" stroke="#c9b48f" stroke-width="5" stroke-linejoin="round"/><path d="M40 60 q20 10 0 30 M40 60 q-4 18 22 22" stroke="#cfc6e8" stroke-width="2" fill="none"/>';
const GHOST = (x, y, s = 1, sleepy = true) => `<use href="${sleepy ? '#i-ghost' : '#i-ghost-awake'}" x="${x}" y="${y}" width="${90 * s}" height="${100 * s}"/>`;

const PAGES = [
  {
    cover: true,
    art: `<svg viewBox="0 0 300 200"><circle cx="230" cy="50" r="28" fill="#ffe7a3"/><circle cx="244" cy="42" r="24" fill="#c39cf0"/>${GHOST(150, 70, 1.1)}<use href="#i-pip" x="40" y="70" width="110" height="110"/><g fill="#fff"><circle cx="40" cy="30" r="2"/><circle cx="120" cy="20" r="2.5"/><circle cx="180" cy="40" r="1.6"/></g></svg>`,
  },
  {
    text: 'Little Boo the ghost could not sleep. Every night, Boo floated round and round the attic, counting cobwebs.',
    art: `<svg viewBox="0 0 300 200">${ATTIC}${GHOST(110, 70, 1, false)}<text x="210" y="100" font-family="Fredoka" font-size="20" fill="#8f7ad6">1, 2, 3…</text></svg>`,
  },
  {
    text: '“It\'s too quiet,” said Boo. “Silence is the loudest thing I know.”',
    art: `<svg viewBox="0 0 300 200">${GHOST(40, 80, 1, false)}<path d="M150 40 h120 q14 0 14 14 v40 q0 14 -14 14 h-80 l-20 18 4 -18 h-24 q-14 0 -14 -14 v-40 q0 -14 14 -14z" fill="#fff" stroke="#2b2147" stroke-width="3"/><text x="210" y="84" text-anchor="middle" font-family="Fredoka" font-size="34" fill="#2b2147">. . .</text></svg>`,
  },
  {
    text: 'So Pip wound up the music box. Plink, plonk, plink. The cobwebs swayed like tiny hammocks.',
    art: `<svg viewBox="0 0 300 200"><path d="M30 40 q60 40 120 0 M150 40 q60 40 120 0" stroke="#cfc6e8" stroke-width="2.5" fill="none"/><rect x="100" y="110" width="100" height="60" rx="10" fill="#ffd1dc" stroke="#2b2147" stroke-width="3"/><rect x="92" y="100" width="116" height="16" rx="6" fill="#ff9cc0" stroke="#2b2147" stroke-width="3"/><circle cx="214" cy="140" r="9" fill="none" stroke="#e8b85a" stroke-width="4"/><g fill="#e8b85a" font-family="Fredoka" font-size="26"><text x="90" y="80">♪</text><text x="150" y="64">♫</text><text x="200" y="86">♪</text></g><use href="#i-pip" x="20" y="110" width="70" height="70"/></svg>`,
  },
  {
    text: 'Pip hung up a nightlight shaped like a moon that was also sleepy. “We can be sleepy together,” said the moon.',
    art: `<svg viewBox="0 0 300 200"><circle cx="150" cy="96" r="70" fill="#ffe7a3" opacity=".35"/><path d="M150 20 v24" stroke="#c9a24a" stroke-width="4"/><path d="M170 50 a46 46 0 1 0 0 92 a38 38 0 0 1 0 -92z" fill="#ffe7a3" stroke="#2b2147" stroke-width="3"/><path d="M128 90 q6 5 12 0" stroke="#2b2147" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="130" cy="104" r="5" fill="#ffb3c7"/>${GHOST(220, 100, 0.7)}</svg>`,
  },
  {
    text: 'Boo yawned a yawn so big it had an echo. Then Boo was a tiny, snoring cloud.',
    art: `<svg viewBox="0 0 300 200"><use href="#i-cloud" x="60" y="80" width="180" height="80"/>${GHOST(118, 66, 0.7)}<g fill="#8f7ad6" font-family="Fredoka" font-weight="700"><text x="196" y="70" font-size="18">z</text><text x="210" y="52" font-size="24">z</text><text x="228" y="30" font-size="30">Z</text></g></svg>`,
  },
  {
    text: 'The End. (shhh, Boo is sleeping) ♡ — Pip',
    art: '<svg viewBox="0 0 300 200"><path d="M150 170 C60 110 70 40 120 40 C140 40 150 56 150 66 C150 56 160 40 180 40 C230 40 240 110 150 170Z" fill="#ffb3c7" stroke="#2b2147" stroke-width="3"/><text x="150" y="112" text-anchor="middle" font-family="Pixelify Sans" font-size="26" fill="#2b2147">THE END</text></svg>',
  },
];

export function initStorybook() {
  const book = $('#book');
  const label = $('#bookPage');
  const prev = $('#bookPrev');
  const next = $('#bookNext');
  const n = PAGES.length;
  let at = 0;

  const els = PAGES.map((p, i) => {
    const d = document.createElement('div');
    d.className = `page${p.cover ? ' cover' : ''}`;
    d.style.zIndex = String(n - i);
    d.innerHTML = p.cover
      ? `${p.art}<h4>Goodnight, Boo</h4><p class="by">written &amp; illustrated by Pip (age: baby)</p>`
      : `${p.art}<p>${p.text}</p><span class="pg-n">${i}</span>`;
    d.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    book.appendChild(d);
    return d;
  });

  const render = () => {
    els.forEach((e, i) => {
      e.classList.toggle('turned', i < at);
      e.style.zIndex = String(i < at ? i + 1 : n - i + n);
      e.setAttribute('aria-hidden', String(i !== at));
    });
    label.textContent = at === 0 ? 'cover' : `page ${at}/${n - 1}`;
    prev.disabled = at === 0;
    next.disabled = at === n - 1;
  };

  const go = (d) => {
    const to = Math.max(0, Math.min(n - 1, at + d));
    if (to === at) return;
    at = to;
    sfx.flip();
    render();
  };

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  prev.parentElement.dataset.quiet = '';
  book.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
  let sx = null;
  let sy = 0;
  book.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
  book.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      // tap the right half to go forward, left half to go back
      const r = book.getBoundingClientRect();
      go(e.clientX > r.left + r.width / 2 ? 1 : -1);
    }
  });
  book.addEventListener('pointercancel', () => { sx = null; });
  render();
}
