// tiny shared helpers
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// localStorage can throw (private mode, blocked storage), so never trust it
export const store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem('pip.' + key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('pip.' + key, JSON.stringify(value)); } catch { /* fine */ }
  },
};

let toastTimer;
export function toast(msg, ms = 2600) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), ms);
}

// tiny event bus so modules can talk without importing each other
const bus = new EventTarget();
export const on = (name, fn) => bus.addEventListener(name, (e) => fn(e.detail));
export const emit = (name, detail) => bus.dispatchEvent(new CustomEvent(name, { detail }));

// run fn once when el scrolls into view
export function whenVisible(el, fn, rootMargin = '200px') {
  if (!el) return;
  if (!('IntersectionObserver' in window)) { fn(); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
  }, { rootMargin });
  io.observe(el);
}

// scroll progress (0..1) of a tall section with a sticky child
// (accounts for the sticky toolbar the sticky stage sits under)
export function sectionProgress(section) {
  const r = section.getBoundingClientRect();
  const bar = document.getElementById('toolbar')?.offsetHeight || 0;
  const total = r.height - (innerHeight - bar);
  return total <= 0 ? 0 : clamp((bar - r.top) / total, 0, 1);
}

export const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// rolling odometer digits (hit counter, dreams delivered)
export function renderOdometer(el, n, digits) {
  const str = String(Math.max(0, Math.floor(n))).padStart(digits, '0');
  if (el.children.length !== str.length) {
    el.innerHTML = '';
    for (let i = 0; i < str.length; i++) {
      const d = document.createElement('span');
      d.className = 'dg';
      const col = document.createElement('span');
      col.innerHTML = '0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9';
      d.appendChild(col);
      el.appendChild(d);
    }
  }
  [...el.children].forEach((d, i) => { d.firstChild.style.transform = `translateY(-${+str[i] * 10}%)`; });
  el.setAttribute('aria-label', String(n));
}
