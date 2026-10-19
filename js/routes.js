// Project 3: Dream Delivery Routes. SVG path motion synced with scroll:
// Pip flies along the route and every window lights up as its dream lands.
import { $, sectionProgress, renderOdometer } from './util.js';
import { bell, freq } from './audio.js';

const DREAMS = [
  ['Boo', 'flying pancakes 🥞'],
  ['Grandma Moth', 'a lamp that never ends'],
  ['Mr. Bat', 'upside-down cake'],
  ['the Twins', 'a pillow-fort castle 🏰'],
  ['Sniffles', 'infinite tennis balls'],
  ['Little Yeti', 'a warm snow day ❄'],
  ['Owl', 'sleeping at night, for once'],
  ['YOU', 'something really nice ♡'],
];
const ROOF = ['#ff9cc0', '#9f8bf0', '#7fdcb8', '#ffb86b', '#8fb8ff', '#ff9cc0', '#b49cff', '#ffd98a'];
const WALL = ['#fff3e3', '#ffe4ec', '#efe9ff', '#fff8d8', '#e6f7ff', '#ffeef0', '#f3ecff', '#fff3e3'];
const NS = 'http://www.w3.org/2000/svg';

export function initRoutes() {
  const section = $('#routes');
  const path = $('#rtPath');
  const trail = $('#rtTrail');
  const pipG = $('#rtPip');
  const houses = $('#rtHouses');
  const bubbles = $('#rtBubbles');
  const counter = $('#rtCount');
  const svg = $('#rtSvg');
  const now = $('#rtNow');
  const L = path.getTotalLength();
  const stops = DREAMS.map((_, i) => (i + 0.5) / DREAMS.length);
  let delivered = -1;
  let queued = false;

  trail.style.strokeDasharray = `${L}`;
  trail.style.strokeDashoffset = `${L}`;

  // scenery: moon, hills, trees, street label
  houses.insertAdjacentHTML('beforeend', `
    <circle cx="900" cy="70" r="34" fill="var(--moon)" opacity=".9"/>
    <path d="M0 470 Q250 430 500 460 T1000 450 V520 H0Z" fill="var(--hill)"/>
    <rect x="0" y="488" width="1000" height="32" fill="var(--hill2)"/>
    <path d="M0 503 H1000" stroke="var(--route)" stroke-width="3" stroke-dasharray="18 14" opacity=".5"/>
    <text x="500" y="514" text-anchor="middle" font-family="Pixelify Sans, monospace" font-size="14" fill="var(--route)" opacity=".85">~ HUSHWILLOW LANE ~</text>`);

  stops.forEach((t, i) => {
    const p = path.getPointAtLength(t * L);
    const w = 78 + (i % 3) * 10;
    const x = p.x - w / 2;
    const base = 488;
    const top = Math.max(p.y + 78, base - 230);
    const hh = base - top;
    // extra floors for tall houses (only the top window gets a dream)
    let floors = '';
    for (let fy = top + 58; fy < base - 52; fy += 46) {
      floors += `<rect x="${p.x - 26}" y="${fy}" width="18" height="18" rx="4" fill="#cfc4ec" stroke="#2b2147" stroke-width="2"/><rect x="${p.x + 8}" y="${fy}" width="18" height="18" rx="4" fill="#cfc4ec" stroke="#2b2147" stroke-width="2"/>`;
    }
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'rt-house');
    g.innerHTML = `
      <rect x="${x + w * 0.66}" y="${top - 34}" width="12" height="26" fill="#b78f74" stroke="#2b2147" stroke-width="2.5"/>
      <path d="M${x - 8} ${top + 4} L${p.x} ${top - 40} L${x + w + 8} ${top + 4}Z" fill="${ROOF[i]}" stroke="#2b2147" stroke-width="3" stroke-linejoin="round"/>
      <rect x="${x}" y="${top}" width="${w}" height="${hh}" fill="${WALL[i]}" stroke="#2b2147" stroke-width="3"/>
      ${floors}
      <circle class="win-glow" cx="${p.x}" cy="${top + 22}" r="30" fill="#ffd98a" opacity="0"/>
      <rect class="win-l" x="${p.x - 13}" y="${top + 10}" width="26" height="24" rx="5" stroke="#2b2147" stroke-width="2.5"/>
      <path d="M${p.x} ${top + 10} V${top + 34} M${p.x - 13} ${top + 22} H${p.x + 13}" stroke="#2b2147" stroke-width="2"/>
      <rect x="${p.x - 9}" y="${base - 26}" width="18" height="26" rx="9" fill="#b78f74" stroke="#2b2147" stroke-width="2.5"/>`;
    houses.appendChild(g);
  });
  const houseEls = [...houses.querySelectorAll('.rt-house')];

  const showBubble = (i) => {
    bubbles.innerHTML = '';
    if (i < 0) return;
    const p = path.getPointAtLength(stops[i] * L);
    const [who, what] = DREAMS[i];
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'rt-bubble');
    const text = document.createElementNS(NS, 'text');
    text.innerHTML = `<tspan font-weight="700">${who}:</tspan> ${what}`;
    g.appendChild(text);
    bubbles.appendChild(g);
    const tw = text.getComputedTextLength();
    const bw = tw + 24;
    let bx = p.x - bw / 2;
    bx = Math.max(8, Math.min(1000 - bw - 8, bx));
    const by = Math.max(8, p.y - 92);
    text.setAttribute('x', bx + 12);
    text.setAttribute('y', by + 24);
    const rect = document.createElementNS(NS, 'rect');
    Object.entries({ x: bx, y: by, width: bw, height: 36, rx: 14, fill: '#fff', stroke: '#2b2147', 'stroke-width': 3 }).forEach(([k, v]) => rect.setAttribute(k, v));
    g.insertBefore(rect, text);
  };

  const update = () => {
    queued = false;
    const raw = sectionProgress(section);
    const t = Math.min(1, raw * 1.08);
    const p = path.getPointAtLength(t * L);
    const ahead = path.getPointAtLength(Math.min(L, t * L + 2));
    const angle = Math.atan2(ahead.y - p.y, ahead.x - p.x) * 57.3;
    // phones: the camera follows Pip so the town stays big enough to see
    if (innerWidth < 700) svg.setAttribute('viewBox', `${Math.max(0, Math.min(480, p.x - 260)).toFixed(1)} 0 520 520`);
    else svg.setAttribute('viewBox', '0 0 1000 520');
    pipG.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${Math.max(-20, Math.min(20, angle * 0.35)).toFixed(1)})`);
    trail.style.strokeDashoffset = `${(L * (1 - t)).toFixed(1)}`;

    let n = -1;
    stops.forEach((s, i) => { if (t >= s) n = i; });
    if (n !== delivered) {
      if (n > delivered && n >= 0) bell(freq(['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6'][n]), 0, 0.12, 1);
      delivered = n;
      houseEls.forEach((h, i) => h.classList.toggle('lit', i <= n));
      renderOdometer(counter, n + 1, 2);
      showBubble(n);
      now.textContent = n < 0 ? 'scroll to take off ✈' : `✦ delivered to ${DREAMS[n][0]}: ${DREAMS[n][1]}`;
    }
  };

  renderOdometer(counter, 0, 2);
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
}
