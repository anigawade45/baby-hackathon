// Project 6: Pip's Growth Chart. Skills measured like height marks on the nursery wall.
import { $, whenVisible } from './util.js';
import { bell, freq } from './audio.js';

const SKILLS = [
  { name: 'Lullaby Composing', v: 92, c: '#ff8fb0', tag: '92 · 3 moons old' },
  { name: 'Nightlight Engineering', v: 85, c: '#e8b85a', tag: '85 · glowing!' },
  { name: 'Monster Befriending', v: 88, c: '#7fdcb8', tag: '88 · all of them' },
  { name: 'Dream Cartography', v: 74, c: '#8fb8ff', tag: '74 · got lost once' },
  { name: 'Giggling', v: 100, c: '#b49cff', tag: '∞ off the chart!!', over: true },
  { name: 'Staying Awake', v: 14, c: '#9a8fb5', tag: '14 · zzz' },
];

export function initGrowth() {
  const wall = $('#growthWall');
  const ruler = document.createElement('div');
  ruler.className = 'gc-ruler';
  ruler.setAttribute('aria-hidden', 'true');
  [0, 25, 50, 75, 100].forEach((v) => {
    const s = document.createElement('span');
    s.textContent = v;
    s.style.bottom = `calc(38px + (100% - 38px) * ${v / 100})`;
    ruler.appendChild(s);
  });
  wall.appendChild(ruler);
  wall.setAttribute('role', 'list');

  const marks = SKILLS.map((s, i) => {
    const col = document.createElement('div');
    col.className = `gc-col${s.over ? ' over' : ''}`;
    col.setAttribute('role', 'listitem');
    col.setAttribute('aria-label', `${s.name}: ${s.over ? 'off the chart' : `${s.v} out of 100`}`);
    col.style.setProperty('--c', s.c);
    col.innerHTML = `<div class="gc-bar"><div class="gc-mark"><span class="gc-tag" style="--rot:${(i % 2 ? 3 : -3)}deg">${s.tag}</span></div></div><span class="gc-name">${s.name}</span>`;
    wall.appendChild(col);
    return col.querySelector('.gc-mark');
  });

  whenVisible(wall, () => {
    marks.forEach((m, i) => setTimeout(() => {
      const v = SKILLS[i].v;
      m.style.height = `${v}%`;
      m.style.setProperty('--h-w', `${Math.max(8, v * 0.5)}%`);
      bell(freq(['C5', 'D5', 'E5', 'G5', 'C6', 'G4'][i]), 0, 0.06, 0.8);
    }, 150 + i * 160));
  }, '-80px');
}
