// Dream Wish Guestbook: a real, shared guestbook (Netlify Function + Blobs).
// If the backend isn't reachable it quietly keeps wishes in this browser.
import { $, store, emit, toast } from './util.js';
import { sfx } from './audio.js';

const STICKERS = { moon: '☾', star: '★', ghost: '👻', heart: '♥', bottle: '🍼' };
const OLD = [
  { name: 'Boo', msg: 'i wish for a dream where the attic has a disco ball. thank u Pip!!', sticker: 'ghost', ts: Date.UTC(1999, 9, 31) },
  { name: 'Grandma Moth', msg: 'a lamp. a big one. the biggest lamp.', sticker: 'moon', ts: Date.UTC(1999, 6, 4) },
  { name: 'the Moon', msg: '5 more minutes please', sticker: 'star', ts: Date.UTC(1998, 11, 24) },
];

const hashRot = (s) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 7) - 3) * 0.8;
};
const fmt = (ts) => new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export function initGuestbook({ getVisitor }) {
  const form = $('#gbForm');
  const wall = $('#gbWall');
  const status = $('#gbStatus');
  const send = $('#gbSend');
  const nameIn = $('#gbName');
  let online = true;

  if (getVisitor().name) nameIn.value = getVisitor().name;

  const note = (e, fresh) => {
    const li = document.createElement('li');
    li.className = `gb-note${fresh ? ' fresh' : ''}`;
    li.style.setProperty('--rot', `${hashRot(e.name + e.ts)}deg`);
    li.style.setProperty('--r0', String(hashRot(e.msg) || 1));
    const stk = document.createElement('span');
    stk.className = 'stk';
    stk.setAttribute('aria-hidden', 'true');
    stk.textContent = STICKERS[e.sticker] || '★';
    const p = document.createElement('p');
    p.textContent = e.msg;
    const f = document.createElement('footer');
    const n = document.createElement('span');
    n.textContent = `— ${e.name}`;
    const d = document.createElement('time');
    d.dateTime = new Date(e.ts).toISOString();
    d.textContent = fmt(e.ts);
    f.append(n, d);
    li.append(stk, p, f);
    return li;
  };

  const render = (entries) => {
    wall.innerHTML = '';
    [...entries, ...OLD].forEach((e) => wall.appendChild(note(e)));
  };

  const local = () => store.get('gb-local', []);

  async function load() {
    try {
      const r = await fetch('/api/guestbook', { headers: { accept: 'application/json' } });
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      if (!Array.isArray(data.entries)) throw new Error('bad data');
      render(data.entries);
    } catch {
      online = false;
      render(local());
      status.textContent = '(offline mode: wishes stay on this computer)';
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const entry = {
      name: String(fd.get('name') || '').trim().slice(0, 24),
      msg: String(fd.get('msg') || '').trim().slice(0, 140),
      sticker: String(fd.get('sticker') || 'moon'),
      website: String(fd.get('website') || ''),
    };
    if (!entry.name || !entry.msg) { status.textContent = 'pls write a name and a wish ♡'; return; }
    send.disabled = true;
    status.textContent = 'folding ur wish into a paper star…';
    let saved = null;
    if (online) {
      try {
        const r = await fetch('/api/guestbook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(entry) });
        const data = await r.json().catch(() => ({}));
        if (!r.ok || data.error || !data.entry) {
          status.textContent = data.error || 'hmm, the guestbook is sleepy. try again in a bit?';
          send.disabled = false;
          return;
        }
        saved = data.entry;
      } catch { online = false; }
    }
    if (!saved) {
      saved = { name: entry.name, msg: entry.msg, sticker: entry.sticker, ts: Date.now() };
      store.set('gb-local', [saved, ...local()].slice(0, 30));
    }
    wall.prepend(note(saved, true));
    wall.scrollTop = 0;
    form.querySelector('#gbMsg').value = '';
    status.textContent = online ? '✦ wish saved! i\'ll dream it tonight' : '✦ wish saved (on this computer)';
    sfx.secret();
    const v = getVisitor();
    if (!v.name) { v.name = entry.name; store.set('visitor', v); }
    const r = send.getBoundingClientRect();
    emit('burst', { x: r.left + r.width / 2, y: r.top, n: 36 });
    toast('thank u for the wish!! ♡');
    setTimeout(() => { send.disabled = false; }, 8000);
  });

  load();
}
