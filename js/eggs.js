// Easter eggs! Five secrets, tracked in the toolbar and remembered between visits.
import { $, store, toast, on, emit, pick } from './util.js';
import { sfx, playTune } from './audio.js';

const SECRETS = {
  pompom: { name: 'the Pom-Pom Polka', hint: 'Pip\'s pom-pom looks very boop-able… (try 3 times)' },
  nap: { name: 'you watched Pip nap', hint: 'if you stay really, really still for a while, babies get sleepy…' },
  lamps: { name: 'every nightlight is on', hint: 'my closet has 6 nightlights. can you light them ALL?' },
  attic: { name: 'the secret attic', hint: 'knock on the moon. knock, knock, knock.' },
  konami: { name: 'DREAM DISCO', hint: 'old video games had a secret code: ↑ ↑ ↓ ↓ ← → ← → B A' },
};
const KEYS = Object.keys(SECRETS);
let found = new Set(store.get('secrets', []).filter((k) => KEYS.includes(k)));

export function secretHint() {
  const left = KEYS.filter((k) => !found.has(k));
  if (!left.length) return 'u found ALL my secrets!! ur an official Dream Inspector now ✦';
  return `psst… ${SECRETS[pick(left)].hint}`;
}

export function initEggs({ pip }) {
  const count = $('#tbSecretsN');
  const btn = $('#tbSecrets');
  const render = () => {
    count.textContent = `${found.size}/${KEYS.length}`;
  };

  const unlock = (key) => {
    if (!SECRETS[key]) return;
    const isNew = !found.has(key);
    found.add(key);
    store.set('secrets', [...found]);
    render();
    if (!isNew) return;
    sfx.secret();
    btn.classList.remove('pulse');
    void btn.offsetWidth;
    btn.classList.add('pulse');
    const r = btn.getBoundingClientRect();
    emit('burst', { x: r.left + r.width / 2, y: r.top, n: 40 });
    toast(`✦ SECRET FOUND: ${SECRETS[key].name} (${found.size}/${KEYS.length})`, 3600);
    if (found.size === KEYS.length) setTimeout(() => { const p = pip(); if (p) p.say('ALL SECRETS!! u r a Dream Inspector ✦', 5000); toast('🏆 all 5 secrets! you are an official Dream Inspector', 4000); }, 3800);
  };
  on('secret', unlock);
  render();

  const showHint = () => toast(`🔑 ${found.size}/${KEYS.length} found · ${secretHint()}`, 5000);
  btn.addEventListener('click', showHint);
  $('#smSecrets').addEventListener('click', showHint);

  /* 1. pom-pom polka */
  on('pompom', () => {
    const p = pip();
    if (p) p.say('♪ the pom-pom polka!! ♪', 4000);
    const el = $('#pipHero').getBoundingClientRect();
    emit('burst', { x: el.left + el.width * 0.15, y: el.top + el.height * 0.45, n: 50 });
    playTune([
      ['G5', 0.5, 'C4'], ['E5', 0.5], ['G5', 0.5, 'G3'], ['E5', 0.5], ['A5', 0.5, 'F3'], ['G5', 0.5], ['F5', 0.5, 'G3'], ['D5', 0.5],
      ['F5', 0.5, 'G3'], ['D5', 0.5], ['F5', 0.5, 'G3'], ['D5', 0.5], ['G5', 0.5, 'G3'], ['F5', 0.5], ['E5', 1, 'C4'],
      ['C6', 1, 'C4'],
    ], { bpm: 150 });
    unlock('pompom');
  });

  /* 4. knock on the moon → attic */
  const moon = $('#heroMoon');
  const attic = $('#attic');
  let knocks = 0;
  let knockT;
  moon.addEventListener('click', () => {
    knocks++;
    moon.classList.remove('knock');
    void moon.offsetWidth;
    moon.classList.add('knock');
    sfx.thud();
    clearTimeout(knockT);
    knockT = setTimeout(() => { knocks = 0; }, 2000);
    if (knocks < 3) { toast(knocks === 1 ? 'knock…' : 'knock knock…', 1200); return; }
    knocks = 0;
    if (attic.showModal) attic.showModal(); else attic.setAttribute('open', '');
    sfx.secret();
    unlock('attic');
  });
  attic.addEventListener('click', (e) => {
    if (e.target === attic || e.target.closest('[data-close]')) attic.close ? attic.close() : attic.removeAttribute('open');
  });

  /* 2. nap: unlocked from pip.js when you wake Pip up */

  /* 5. konami code → dream disco */
  const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let pos = 0;
  addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === code[pos] ? pos + 1 : (k === code[0] ? 1 : 0);
    if (pos < code.length) return;
    pos = 0;
    disco();
  });

  // touch devices can't do the konami code, so a secret gesture for them:
  // tap the 🔑 button 5 times quickly
  let taps = 0;
  let tapT;
  btn.addEventListener('pointerup', () => {
    taps++;
    clearTimeout(tapT);
    tapT = setTimeout(() => { taps = 0; }, 900);
    if (taps >= 5) { taps = 0; disco(); }
  });

  function disco() {
    const root = document.documentElement;
    if (root.classList.contains('disco')) return;
    root.classList.add('disco');
    const p = pip();
    if (p) p.say('DREAM DISCO!!! ✦ ✦ ✦', 6000);
    const stop = playTune([
      ['C5', 0.5, 'C3'], ['E5', 0.5], ['G5', 0.5, 'C3'], ['C6', 0.5], ['A5', 0.5, 'A2'], ['E5', 0.5], ['A5', 0.5, 'A2'], ['C6', 0.5],
      ['F5', 0.5, 'F2'], ['A5', 0.5], ['C6', 0.5, 'F2'], ['A5', 0.5], ['G5', 0.5, 'G2'], ['B5', 0.5], ['D6', 0.5, 'G2'], ['G5', 0.5],
    ], { bpm: 220, loop: true, onNote: () => emit('burst', { x: Math.random() * innerWidth, y: Math.random() * innerHeight * 0.7, n: 6 }) });
    setTimeout(() => { stop(); root.classList.remove('disco'); }, 7400);
    unlock('konami');
  }
}
