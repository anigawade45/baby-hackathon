// Every sound on this site is synthesized right here with Web Audio.
// No audio files = nothing to credit, nothing to download.
import { store, emit } from './util.js';

let ctx = null;
let master = null;
let wet = null;
let noiseBuf = null;
let muted = store.get('muted', false);

// AudioContext may only start after a user gesture, so we wait for one
// instead of creating it on load (which would log a browser warning).
function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);

    // a cheap, cozy "room": feedback delay through a lowpass
    wet = ctx.createGain();
    wet.gain.value = 0.28;
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.19;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    wet.connect(delay).connect(lp).connect(fb).connect(delay);
    lp.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
}
['pointerdown', 'keydown', 'touchend'].forEach((ev) => addEventListener(ev, unlock, { capture: true, passive: true }));

const ready = () => ctx && ctx.state === 'running' && !muted;

export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  store.set('muted', m);
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.55, ctx.currentTime, 0.03);
  emit('mute', m);
}

const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
export function freq(n) {
  if (typeof n === 'number') return 440 * 2 ** ((n - 69) / 12);
  const m = /^([A-G]#?)(\d)$/.exec(n);
  const midi = 12 * (+m[2] + 1) + NOTE[m[1]];
  return 440 * 2 ** ((midi - 69) / 12);
}

function tone(f, { type = 'sine', dur = 0.15, vol = 0.2, attack = 0.005, when = 0, slide = null, toWet = 0 } = {}) {
  if (!ready()) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  if (toWet) {
    const s = ctx.createGain();
    s.gain.value = toWet;
    g.connect(s).connect(wet);
  }
  o.start(t);
  o.stop(t + dur + 0.05);
}

// music-box bell: fundamental + slightly inharmonic partials
export function bell(f, when = 0, vol = 0.22, dur = 1.6) {
  tone(f, { when, vol, dur, attack: 0.004, toWet: 0.9 });
  tone(f * 2.01, { when, vol: vol * 0.32, dur: dur * 0.6, attack: 0.003, toWet: 0.6 });
  tone(f * 3.98, { when, vol: vol * 0.1, dur: dur * 0.3, attack: 0.002 });
}

function noise(dur = 0.08, { when = 0, vol = 0.25, freq: fq = 3000, q = 3 } = {}) {
  if (!ready()) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime + when;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = fq;
  bp.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g).connect(master);
  src.start(t, Math.random() * 0.3);
  src.stop(t + dur + 0.02);
}

export const sfx = {
  click() { tone(900 + Math.random() * 400, { type: 'triangle', dur: 0.05, vol: 0.09, slide: 600 }); },
  boop() { tone(480, { dur: 0.16, vol: 0.22, slide: 960 }); },
  pop() { tone(300, { dur: 0.09, vol: 0.2, slide: 1200 }); },
  thud() { tone(160, { dur: 0.25, vol: 0.3, slide: 55 }); },
  giggle() {
    const base = 680 + Math.random() * 160;
    [0, 1, 2, 3, 4].forEach((i) => {
      const f = base * (1 + 0.12 * Math.sin(i * 1.3)) * (i === 4 ? 1.25 : 1);
      tone(f, { when: i * 0.095, dur: 0.08, vol: 0.16, slide: f * 1.35, type: 'sine' });
      tone(f * 2, { when: i * 0.095, dur: 0.05, vol: 0.03, slide: f * 2.6 });
    });
  },
  yawn() {
    if (!ready()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    o.type = 'sawtooth';
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1200, t);
    lp.frequency.exponentialRampToValueAtTime(400, t + 1.1);
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(560, t + 0.3);
    o.frequency.exponentialRampToValueAtTime(200, t + 1.1);
    lfo.frequency.value = 6;
    lg.gain.value = 10;
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(lp).connect(g).connect(master);
    o.start(t); lfo.start(t);
    o.stop(t + 1.25); lfo.stop(t + 1.25);
  },
  rattle() {
    for (let i = 0; i < 5; i++) noise(0.05, { when: i * 0.06 + Math.random() * 0.02, vol: 0.35, freq: 2500 + Math.random() * 2500, q: 6 });
  },
  chime(i) {
    const scale = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6'];
    bell(freq(scale[i % scale.length]), 0, 0.2);
  },
  flip() { noise(0.22, { vol: 0.12, freq: 1400, q: 0.7 }); noise(0.12, { when: 0.1, vol: 0.08, freq: 2600, q: 0.7 }); },
  sparkle() { bell(freq('E6'), 0, 0.08, 0.6); bell(freq('B6'), 0.07, 0.07, 0.6); },
  catch() { bell(freq('G5'), 0, 0.12, 0.5); bell(freq('D6'), 0.06, 0.1, 0.6); },
  big() { ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => bell(freq(n), i * 0.07, 0.13, 0.8)); },
  ouch() { tone(330, { dur: 0.3, vol: 0.18, slide: 180, type: 'triangle' }); },
  imIn() { tone(660, { dur: 0.12, vol: 0.12, type: 'square', slide: 880 }); tone(990, { when: 0.12, dur: 0.15, vol: 0.1, type: 'square' }); },
  imMsg() { bell(freq('A5'), 0, 0.12, 0.4); bell(freq('E6'), 0.09, 0.1, 0.5); },
  door() { tone(220, { dur: 0.08, vol: 0.12, type: 'square' }); tone(330, { when: 0.1, dur: 0.12, vol: 0.12, type: 'square' }); },
  secret() { ['G5', 'C6', 'E6', 'G6', 'C7'].forEach((n, i) => bell(freq(n), i * 0.09, 0.12, 1)); },
  modem() {
    // a very polite dial-up handshake
    [1300, 2100, 1650, 2400, 980].forEach((f, i) => tone(f, { when: i * 0.12, dur: 0.11, vol: 0.05, type: 'square' }));
    noise(0.5, { when: 0.6, vol: 0.06, freq: 1800, q: 1 });
  },
};

// Plays [note, beats] pairs on the music box. Returns a stop() function.
export function playTune(notes, { bpm = 96, onNote, onEnd, loop = false } = {}) {
  unlock();
  if (!ctx) { onEnd && onEnd(); return () => {}; }
  const beat = 60 / bpm;
  let i = 0;
  let next = ctx.currentTime + 0.1;
  let stopped = false;
  const timers = [];
  const tick = () => {
    if (stopped) return;
    while (next < ctx.currentTime + 0.25) {
      if (i >= notes.length) {
        if (!loop) {
          const endIn = (next - ctx.currentTime) * 1000 + 600;
          timers.push(setTimeout(() => { if (!stopped) { stopped = true; clearInterval(iv); onEnd && onEnd(); } }, endIn));
          clearInterval(iv);
          return;
        }
        i = 0;
      }
      const [n, beats, harm] = notes[i];
      if (n) {
        const f = freq(n);
        bell(f, next - ctx.currentTime, 0.2);
        if (harm) bell(freq(harm), next - ctx.currentTime, 0.08);
        const idx = i;
        timers.push(setTimeout(() => !stopped && onNote && onNote(n, idx), Math.max(0, (next - ctx.currentTime) * 1000)));
      }
      next += beats * beat;
      i++;
    }
  };
  const iv = setInterval(tick, 40);
  tick();
  return () => { stopped = true; clearInterval(iv); timers.forEach(clearTimeout); };
}
