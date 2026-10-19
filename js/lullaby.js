// Project 1: The Lullaby Lab. A Web Audio music box + playable star chimes.
// "tonight song" is generated from today's date, so it's new every night.
import { $, $$, pick, emit, on } from './util.js';
import { playTune, sfx } from './audio.js';

const TWINKLE = [
  ['C5', 1, 'C4'], ['C5', 1], ['G5', 1, 'E4'], ['G5', 1], ['A5', 1, 'F4'], ['A5', 1], ['G5', 2, 'E4'],
  ['F5', 1, 'D4'], ['F5', 1], ['E5', 1, 'C4'], ['E5', 1], ['D5', 1, 'G3'], ['D5', 1], ['C5', 2, 'C4'],
  ['G5', 1, 'E4'], ['G5', 1], ['F5', 1, 'D4'], ['F5', 1], ['E5', 1, 'C4'], ['E5', 1], ['D5', 2, 'G3'],
  ['G5', 1, 'E4'], ['G5', 1], ['F5', 1, 'D4'], ['F5', 1], ['E5', 1, 'C4'], ['E5', 1], ['D5', 2, 'G3'],
  ['C5', 1, 'C4'], ['C5', 1], ['G5', 1, 'E4'], ['G5', 1], ['A5', 1, 'F4'], ['A5', 1], ['G5', 2, 'E4'],
  ['F5', 1, 'D4'], ['F5', 1], ['E5', 1, 'C4'], ['E5', 1], ['D5', 1, 'G3'], ['D5', 1], ['C5', 3, 'C4'],
];

// Brahms' Wiegenlied (public domain), in C
const BRAHMS = [
  ['E5', 0.5], ['E5', 0.5], ['G5', 2, 'C4'], ['E5', 0.5], ['E5', 0.5], ['G5', 2, 'C4'],
  ['E5', 0.5], ['G5', 0.5], ['C6', 1, 'E4'], ['B5', 1.5, 'G3'], ['A5', 0.5], ['A5', 1, 'F4'], ['G5', 1, 'C4'],
  ['D5', 0.5], ['E5', 0.5], ['F5', 1, 'G3'], ['D5', 1], ['D5', 0.5], ['E5', 0.5], ['F5', 2, 'G3'],
  ['D5', 0.5], ['F5', 0.5], ['B5', 0.5, 'G3'], ['A5', 0.5], ['G5', 1], ['B5', 1, 'G3'], ['C6', 3, 'C4'],
];

// seeded random so everyone gets the SAME song on the same night
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tonightSong() {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const r = mulberry32(seed);
  const choose = (a) => a[Math.floor(r() * a.length)];
  const scale = ['G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6'];
  const chords = [['C4', 'C3'], ['A3', 'A2'], ['F3', 'F2'], ['G3', 'G2']];
  const rhythms = [[2, 1], [1, 1, 1], [3], [1.5, 0.5, 1], [1, 2]];
  let idx = 4;
  const notes = [];
  for (let phrase = 0; phrase < 4; phrase++) {
    for (let bar = 0; bar < 4; bar++) {
      const chord = chords[(bar + (phrase === 3 && bar === 2 ? 1 : 0)) % 4];
      const last = bar === 3 && (phrase === 1 || phrase === 3);
      const rhythm = last ? [3] : choose(rhythms);
      rhythm.forEach((beats, k) => {
        if (last) idx = phrase === 3 ? 2 : 4;
        else idx = Math.max(0, Math.min(scale.length - 1, idx + choose([-2, -1, -1, 0, 1, 1, 2])));
        notes.push([scale[idx], beats, k === 0 ? chord[0] : null]);
      });
    }
  }
  const adj = ['Sleepy', 'Velvet', 'Tiny', 'Wobbly', 'Moonlit', 'Fuzzy', 'Hushed', 'Pudding', 'Snuggly', 'Starry'];
  const noun = ['Teacup', 'Owl', 'Slipper', 'Comet', 'Biscuit', 'Lantern', 'Pillow', 'Moth', 'Cloud', 'Sock'];
  const title = `The ${choose(adj)} ${choose(noun)} Waltz`;
  return { notes, title, bpm: 104 };
}

export function initLullaby() {
  const box = $('#llBox');
  const notesEl = $('#llNotes');
  const play = $('#llPlay');
  const stopBtn = $('#llStop');
  const now = $('#llNow');
  const stars = $$('.ll-stars button');
  let stop = null;
  let visible = false;

  const tune = () => $('input[name="tune"]:checked').value;
  const NOTE_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  const floatNote = (n) => {
    const s = document.createElement('span');
    s.textContent = pick(['♪', '♫', '♬', '✦', '♩']);
    s.style.left = `${35 + Math.random() * 30}%`;
    s.style.top = '28%';
    s.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
    s.style.setProperty('--rot', `${(Math.random() - 0.5) * 60}deg`);
    notesEl.appendChild(s);
    setTimeout(() => s.remove(), 2600);
    // light the matching star chime
    const letter = n[0];
    const i = Math.min(7, NOTE_ORDER.indexOf(letter) + (n.endsWith('6') ? 3 : 0));
    lightStar(i);
  };

  const lightStar = (i) => {
    const b = stars[Math.max(0, Math.min(7, i))];
    b.classList.add('hit');
    setTimeout(() => b.classList.remove('hit'), 220);
  };

  const finish = (msg) => {
    if (stop) stop();
    stop = null;
    box.classList.remove('playing');
    play.disabled = false;
    stopBtn.disabled = true;
    now.textContent = msg;
  };

  const start = () => {
    if (stop) finish('');
    const which = tune();
    let song;
    if (which === 'twinkle') song = { notes: TWINKLE, title: 'Twinkle Twinkle (classic)', bpm: 120 };
    else if (which === 'brahms') song = { notes: BRAHMS, title: 'Brahms\' Lullaby', bpm: 92 };
    else song = tonightSong();
    box.classList.add('playing');
    play.disabled = true;
    stopBtn.disabled = false;
    now.textContent = `♪ now playing: ${song.title}`;
    stop = playTune(song.notes, {
      bpm: song.bpm,
      onNote: (n) => floatNote(n),
      onEnd: () => { finish('the box yawned and stopped. wind it again?'); emit('lullaby-done'); },
    });
  };

  play.addEventListener('click', start);
  $('#llKey').addEventListener('click', () => (stop ? finish('paused. *click*') : start()));
  stopBtn.addEventListener('click', () => finish('shh. stopped.'));

  stars.forEach((b, i) => {
    b.closest('.ll-stars').dataset.quiet = '';
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); sfx.chime(i); lightStar(i); floatNote(['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6'][i]); });
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sfx.chime(i); lightStar(i); } });
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe($('#lullaby-lab'));
  }
  const KEYS = 'asdfghjk';
  addEventListener('keydown', (e) => {
    if (!visible || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    const i = KEYS.indexOf(e.key.toLowerCase());
    if (i < 0) return;
    sfx.chime(i);
    lightStar(i);
  });

  // closing the window (switching projects) stops the box too
  on('desk', (id) => { if (id !== 'lullaby-lab' && stop) finish('paused while you were away.'); });

  // stop the music box when the page is hidden: be gentle on ears
  document.addEventListener('visibilitychange', () => { if (document.hidden && stop) finish('paused while you were away.'); });
}
