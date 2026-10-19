// Chapter 01: Pip's origin, told in 5 scroll-driven scenes.
import { $, $$, sectionProgress } from './util.js';
import { bell, freq } from './audio.js';

export function initStory() {
  const section = $('#story');
  const stage = $('#storyStage');
  const caps = $$('[data-cap]', stage);
  const dots = $$('.story-dots li', stage);
  const notes = ['C5', 'E5', 'G5', 'A5', 'C6'];
  let scene = -1;
  let queued = false;

  const update = () => {
    queued = false;
    const p = sectionProgress(section);
    const s = Math.min(caps.length - 1, Math.floor(p * caps.length * 0.999));
    if (s === scene) return;
    scene = s;
    stage.dataset.scene = String(s);
    caps.forEach((c, i) => c.classList.toggle('on', i === s));
    dots.forEach((d, i) => d.classList.toggle('on', i <= s));
    bell(freq(notes[s]), 0, 0.06, 1.2);
  };

  addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  // the dots double as chapter buttons
  dots.forEach((d, i) => {
    d.addEventListener('click', () => {
      const bar = document.getElementById('toolbar').offsetHeight;
      const total = section.offsetHeight - (innerHeight - bar);
      const top = section.getBoundingClientRect().top + scrollY - bar + ((i + 0.5) / dots.length) * total;
      scrollTo({ top, behavior: 'smooth' });
    });
  });

  // phones: zoom the stage in a little so the scene isn't tiny
  const svg = $('.story-svg', stage);
  const fit = () => svg.setAttribute('viewBox', innerWidth < 700 ? '70 70 660 390' : '0 0 800 460');
  addEventListener('resize', () => { fit(); update(); });
  fit();
  update();
}
