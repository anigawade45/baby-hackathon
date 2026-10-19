// Pip's Desktop: one workspace, one open project at a time.
// Icons are real tabs (arrow keys work), with prev/next buttons underneath,
// so the page stays short and you never scroll past five windows again.
import { $, $$, emit, reducedMotion } from './util.js';
import { sfx } from './audio.js';

export const PROJECTS = ['lullaby-lab', 'nightlights', 'toys', 'storybook', 'growth'];
let select = () => {};

// used by nav.js (start menu, guide, deep links)
export function openProject(id, opts) { select(id, opts); }

export function initDesk() {
  const tabs = PROJECTS.map((id) => document.getElementById(`tab-${id}`));
  const panels = PROJECTS.map((id) => document.getElementById(id));
  const stage = $('#deskStage');
  const count = $('#deskCount');
  let current = 0;

  select = (id, { scroll = false, focusTab = false, quiet = false, instant = false } = {}) => {
    const i = PROJECTS.indexOf(id);
    if (i < 0) return;
    const changed = i !== current;
    current = i;
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    panels.forEach((p, k) => {
      if (k === i) {
        p.hidden = false;
        if (changed && !reducedMotion()) {
          p.classList.remove('opening');
          void p.offsetWidth;
          p.classList.add('opening');
        }
      } else p.hidden = true;
    });
    count.textContent = `${i + 1} / ${PROJECTS.length}`;
    if (focusTab) tabs[i].focus();
    if (changed && !quiet) { sfx.pop(); emit('desk', id); }
    if (scroll) {
      // the workspace may not be rendered yet (content-visibility), so get near it
      // first, let it lay out, then land precisely on the desk
      const land = (behavior) => {
        const bar = document.getElementById('toolbar').offsetHeight;
        const top = $('#desk').getBoundingClientRect().top + scrollY - bar - 12;
        scrollTo({ top, behavior });
      };
      if ($('#desk').getBoundingClientRect().height > 0) land(instant || reducedMotion() ? 'instant' : 'smooth');
      else {
        document.getElementById('work').scrollIntoView({ behavior: 'instant' });
        requestAnimationFrame(() => requestAnimationFrame(() => land('instant')));
      }
    } else {
      // if the new window starts above the screen, bring its top into view
      const r = stage.getBoundingClientRect();
      const bar = document.getElementById('toolbar').offsetHeight;
      if (r.top < bar) scrollTo({ top: r.top + scrollY - bar - 12, behavior: reducedMotion() ? 'instant' : 'smooth' });
    }
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(PROJECTS[i]));
    t.addEventListener('keydown', (e) => {
      const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      let n = null;
      if (e.key in keys) n = (i + keys[e.key] + PROJECTS.length) % PROJECTS.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = PROJECTS.length - 1;
      if (n === null) return;
      e.preventDefault();
      select(PROJECTS[n], { focusTab: true });
    });
  });
  tabs[0].parentElement.dataset.quiet = '';

  $('#deskPrev').addEventListener('click', () => select(PROJECTS[(current - 1 + PROJECTS.length) % PROJECTS.length]));
  $('#deskNext').addEventListener('click', () => select(PROJECTS[(current + 1) % PROJECTS.length]));
  $$('.desk-foot button').forEach((b) => { b.dataset.quiet = ''; });

  // deep link straight to a project: /#toys
  const fromHash = (instant) => {
    const id = location.hash.slice(1);
    if (PROJECTS.includes(id)) select(id, { scroll: true, quiet: true, instant });
  };
  addEventListener('hashchange', () => fromHash(false));
  if (PROJECTS.includes(location.hash.slice(1))) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    select(location.hash.slice(1), { quiet: true });
    // jump once layout has settled (fonts + images can still shift things)
    const jump = () => fromHash(true);
    if (document.readyState === 'complete') setTimeout(jump, 50);
    else addEventListener('load', () => setTimeout(jump, 50), { once: true });
    setTimeout(jump, 700);
  }
}
