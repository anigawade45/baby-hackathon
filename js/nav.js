// Wayfinding: scrollspy + progress bar in the toolbar, gentle reveal-on-scroll,
// an "arrival" glow when you jump somewhere, and Pip as a floating tour guide.
import { $, $$, on, reducedMotion } from './util.js';
import { sfx } from './audio.js';
import { PROJECTS, openProject } from './desk.js';

const STOPS = ['hello', 'story', 'routes', 'work', 'chat', 'guestbook'];
const TOP_LEVEL = { routes: 'story' };
const GUIDE = {
  hello: 'hi! i\'m ur tour guide. tap me to hop to the next room ✦',
  story: 'this is how i happened! keep scrolling ▾',
  work: 'my desktop! click an icon to open a project ✦',
  'lullaby-lab': 'wind my music box!! it makes a new song every night ♪',
  nightlights: 'it\'s so dark in here… find all 6 lights!',
  routes: 'scroll to fly with me over the rooftops ✈',
  toys: 'bet u can\'t beat my high score hehe',
  storybook: 'i wrote this one myself. with crayons!',
  growth: 'look how much i\'ve grown!!',
  chat: 'psst… message me!',
  guestbook: 'leave me a dream wish? ♡ (tap me to go back up)',
};

export function initNav() {
  const bar = $('#toolbar');
  const progress = $('#tbProgress');
  const path = $('#addrPath');
  const links = $$('.tb-nav a');
  const sections = STOPS.map((id) => document.getElementById(id)).filter(Boolean);
  const guide = $('#guide');
  const bubble = $('#guideBubble');
  const guideSr = $('#guideSr');
  let current = '';
  let queued = false;
  let lastY = scrollY;
  let goingUp = false;
  let bubbleT;

  const say = (text, ms = 4200) => {
    bubble.textContent = text;
    guide.classList.add('talk');
    clearTimeout(bubbleT);
    bubbleT = setTimeout(() => guide.classList.remove('talk'), ms);
  };

  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const dy = scrollY - lastY;
    if (Math.abs(dy) > 6) {
      const wasUp = goingUp;
      goingUp = dy < 0 && scrollY > innerHeight * 1.2;
      guide.classList.toggle('up', goingUp);
      if (goingUp && !wasUp && document.body.classList.contains('booted')) say('going up? tap me and we\'ll fly to the top ▴', 2600);
      guideSr.textContent = goingUp || current === 'guestbook' ? 'Pip, your tour guide: fly back to the top.' : 'Pip, your tour guide: go to the next section.';
      lastY = scrollY;
    }
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;

    const line = bar.offsetHeight + innerHeight * 0.3;
    let id = sections[0].id;
    for (const s of sections) if (s.getBoundingClientRect().top <= line) id = s.id;
    if (max - scrollY < 4) id = 'guestbook';
    if (id === current) return;
    current = id;
    path.classList.add('swap');
    setTimeout(() => { path.textContent = id === 'hello' ? 'hello' : `#${id}`; path.classList.remove('swap'); }, 150);
    const top = TOP_LEVEL[id] || id;
    links.forEach((a) => {
      const on = a.dataset.spy === top;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    guide.classList.toggle('last', id === 'guestbook');
    if (GUIDE[id] && document.body.classList.contains('booted')) say(GUIDE[id]);
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();

  /* guide: click to hop to the next room */
  guide.addEventListener('click', () => {
    const i = STOPS.indexOf(current);
    const next = goingUp || current === 'guestbook' ? 'hello' : STOPS[Math.min(STOPS.length - 1, i + 1)];
    if (next === 'hello') { goingUp = false; guide.classList.remove('up'); }
    guide.classList.remove('hop');
    void guide.offsetWidth;
    guide.classList.add('hop');
    sfx.boop();
    go(next);
  });
  setTimeout(() => say(GUIDE.hello, 5200), 2200);
  // when a new project window opens, Pip tells you what it is
  on('desk', (id) => { if (GUIDE[id]) say(GUIDE[id]); });

  /* smooth in-page jumps + a little "window opens" glow on arrival */
  function go(id) {
    if (PROJECTS.includes(id)) {
      openProject(id, { scroll: true });
      history.replaceState(null, '', `#${id}`);
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start' });
    history.replaceState(null, '', id === 'hello' ? location.pathname : `#${id}`);
    const win = el.matches('[data-win], .win') ? el : el.querySelector('[data-win], .win, .im');
    const arrive = () => {
      // sections that hadn't rendered yet may have changed size on the way: land exactly
      const off = el.getBoundingClientRect().top - (bar.offsetHeight + 12);
      if (id !== 'hello' && Math.abs(off) > 6) scrollBy({ top: off, behavior: 'instant' });
      if (!win) return;
      win.classList.remove('arrive');
      void win.offsetWidth;
      win.classList.add('arrive');
    };
    if ('onscrollend' in window) addEventListener('scrollend', arrive, { once: true });
    else setTimeout(arrive, 650);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.closest('.webring') || e.defaultPrevented) return;
    const id = a.getAttribute('href').slice(1);
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    go(id);
  });

  /* reveal windows softly as they scroll in */
  const items = $$('.desk, .routes-sec > .sec-title, .im, .gb-form, .gb-wall, .props-win, .work > .sec-title, .work > .sec-sub, .chat-sec .sec-title, .gb-sec .sec-title, .gb-sec .sec-sub, .foot > *');
  if (!reducedMotion() && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => { el.classList.add('reveal'); io.observe(el); });
  }
}
