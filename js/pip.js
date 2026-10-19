// Pip, the interactive SVG puppet in the hero.
// Eyes follow the pointer, the head tilts, Pip blinks, giggles, yawns and naps.
import { clamp, pick, emit, reducedMotion } from './util.js';
import { sfx } from './audio.js';

const SVG = `
<svg class="pip-svg" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="pHead" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fffefa"/><stop offset=".7" stop-color="#fbf3e6"/><stop offset="1" stop-color="#efe0cb"/></radialGradient>
    <radialGradient id="pCap" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f1e1c2"/></radialGradient>
    <radialGradient id="pSock" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#4a3646"/><stop offset="1" stop-color="#2a1d2a"/></radialGradient>
    <radialGradient id="pGlow"><stop offset="0" stop-color="#fff6c8"/><stop offset=".45" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
    <radialGradient id="pCloud" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f6dcea"/></radialGradient>
  </defs>
  <g class="float">
    <g class="cloud">
      <ellipse cx="100" cy="222" rx="86" ry="14" fill="#000" opacity=".08"/>
      <path d="M26 214 a24 24 0 0 1 10 -42 a30 30 0 0 1 46 -14 a34 34 0 0 1 56 4 a28 28 0 0 1 40 22 a22 22 0 0 1 -6 30 z" fill="url(#pCloud)" stroke="#f0cde0" stroke-width="3"/>
    </g>
    <g class="body-all">
      <!-- onesie -->
      <path d="M62 196 C58 168 70 150 100 150 C130 150 142 168 138 196 Z" fill="#fdf1df" stroke="#ead8bf" stroke-width="2.5"/>
      <g fill="#ffc2d4"><path d="M80 172 l3 -3 3 3 -3 3z"/><path d="M112 166 l3 -3 3 3 -3 3z"/><path d="M98 186 l3 -3 3 3 -3 3z"/><path d="M122 186 l3 -3 3 3 -3 3z"/><path d="M74 188 l3 -3 3 3 -3 3z"/></g>
      <path d="M100 152 V194" stroke="#f3c6d6" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round"/>
      <ellipse cx="78" cy="198" rx="17" ry="11" fill="#d9c6f2" stroke="#bda6e6" stroke-width="2"/>
      <ellipse cx="122" cy="198" rx="17" ry="11" fill="#d9c6f2" stroke="#bda6e6" stroke-width="2"/>
      <!-- resting arm -->
      <path d="M66 166 C56 172 54 182 62 186" stroke="#fdf1df" stroke-width="13" fill="none" stroke-linecap="round"/>
      <circle cx="63" cy="186" r="7.5" fill="#fffaf2" stroke="#ead8bf" stroke-width="2"/>
      <!-- waving arm -->
      <g class="arm-wave">
        <path d="M132 166 C156 166 174 154 182 138" stroke="#fdf1df" stroke-width="13" fill="none" stroke-linecap="round"/>
        <path d="M132 166 C156 166 174 154 182 138" stroke="#ead8bf" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".6"/>
        <circle cx="184" cy="133" r="8.5" fill="#fffaf2" stroke="#ead8bf" stroke-width="2"/>
        <path d="M178 126 l-1 -5 M184 124 v-5 M190 126 l1 -5" stroke="#ead8bf" stroke-width="2" stroke-linecap="round"/>
      </g>

      <g class="head">
        <!-- skull head: round on top, softer jaw -->
        <path d="M100 32 C150 32 174 66 172 104 C170 134 152 150 132 156 C120 160 80 160 68 156 C48 150 30 134 28 104 C26 66 50 32 100 32Z" fill="url(#pHead)" stroke="#e9d7bf" stroke-width="2.5"/>
        <ellipse class="blush" cx="52" cy="128" rx="13" ry="7" fill="#ffb3c7" opacity=".55"/>
        <ellipse class="blush" cx="148" cy="128" rx="13" ry="7" fill="#ffb3c7" opacity=".55"/>
        <g class="eyes">
          <ellipse class="sock" cx="72" cy="104" rx="22" ry="20" fill="url(#pSock)" transform="rotate(-6 72 104)"/>
          <ellipse class="sock" cx="128" cy="104" rx="22" ry="20" fill="url(#pSock)" transform="rotate(6 128 104)"/>
          <g class="pupil" data-eye="l"><circle class="pupil-glow" cx="72" cy="104" r="11" fill="url(#pGlow)"/><circle cx="72" cy="104" r="4.2" fill="#fff3c0"/></g>
          <g class="pupil" data-eye="r"><circle class="pupil-glow" cx="128" cy="104" r="11" fill="url(#pGlow)"/><circle cx="128" cy="104" r="4.2" fill="#fff3c0"/></g>
          <ellipse class="eye-lid" cx="72" cy="104" rx="23.5" ry="21.5" fill="#f8eedf" transform="rotate(-6 72 104)"/>
          <ellipse class="eye-lid" cx="128" cy="104" rx="23.5" ry="21.5" fill="#f8eedf" transform="rotate(6 128 104)"/>
          <path class="closed-eyes" d="M56 108 q16 12 32 0 M112 108 q16 12 32 0" stroke="#4a3540" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path class="happy-eyes" d="M56 110 q16 -20 32 0 M112 110 q16 -20 32 0" stroke="#3a2a3a" stroke-width="6" fill="none" stroke-linecap="round"/>
        </g>
        <path d="M95 125 q5 -4 10 0 q-1 6 -5 8 q-4 -2 -5 -8z" fill="#4a3540"/>
        <path class="mouth-smile" d="M84 140 q14 11 30 -2" stroke="#4a3540" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <g class="mouth-open"><path d="M84 138 q16 0 32 -2 q-4 16 -16 16 q-12 0 -16 -14z" fill="#4a3540"/><path d="M92 146 q8 -5 16 0 q-3 5 -8 5 q-5 0 -8 -5z" fill="#ff8fb0"/></g>
        <ellipse class="mouth-yawn" cx="100" cy="142" rx="9" ry="11" fill="#4a3540"/>

        <!-- nightcap -->
        <path d="M60 34 C30 32 6 58 10 98 L28 94 C28 68 44 50 74 42Z" fill="url(#pCap)" stroke="#e7d2ad" stroke-width="2.5"/>
        <path d="M30 92 C24 44 66 12 110 14 C150 16 178 44 172 88 C140 66 62 66 30 92Z" fill="url(#pCap)" stroke="#e7d2ad" stroke-width="2.5"/>
        <path d="M26 92 C60 66 140 64 174 86 L172 102 C140 80 62 80 28 106Z" fill="#f6e7c8" stroke="#e7d2ad" stroke-width="2.5"/>
        <g fill="#e8b85a">
          <path d="M70 34 l2.2 4.6 5 .6 -3.7 3.4 1 5 -4.5 -2.5 -4.5 2.5 1 -5 -3.7 -3.4 5 -.6z"/>
          <path d="M118 26 l1.8 3.8 4.2 .5 -3.1 2.8 .8 4.2 -3.7 -2.1 -3.7 2.1 .8 -4.2 -3.1 -2.8 4.2 -.5z"/>
          <path d="M150 52 l1.6 3.4 3.7 .4 -2.7 2.5 .7 3.7 -3.3 -1.8 -3.3 1.8 .7 -3.7 -2.7 -2.5 3.7 -.4z"/>
          <path d="M96 52 l1.4 3 3.2 .4 -2.4 2.2 .6 3.2 -2.8 -1.6 -2.8 1.6 .6 -3.2 -2.4 -2.2 3.2 -.4z"/>
          <path d="M34 66 l1.4 3 3.2 .4 -2.4 2.2 .6 3.2 -2.8 -1.6 -2.8 1.6 .6 -3.2 -2.4 -2.2 3.2 -.4z"/>
        </g>
        <!-- bow -->
        <g transform="translate(64 80) rotate(-14)">
          <path d="M0 0 C-10 -14 -26 -10 -24 2 C-22 12 -8 10 0 0Z" fill="#ffadc4" stroke="#f08aa8" stroke-width="2"/>
          <path d="M0 0 C10 -14 26 -10 24 2 C22 12 8 10 0 0Z" fill="#ffadc4" stroke="#f08aa8" stroke-width="2"/>
          <circle r="5" fill="#ff9cb8" stroke="#f08aa8" stroke-width="2"/>
        </g>
        <g class="pompom" role="presentation">
          <circle cx="16" cy="104" r="15" fill="#f3e2c2" stroke="#e2c99c" stroke-width="2.5"/>
          <path d="M8 98 l3 2 M18 94 l1 3 M24 104 l-3 1 M12 110 l2 -2 M20 112 l-1 -3" stroke="#d9bd8c" stroke-width="2" stroke-linecap="round"/>
        </g>
        <g class="zzz" fill="#c7b8ff" font-family="Fredoka, sans-serif" font-weight="700">
          <text x="160" y="40" font-size="16">z</text><text x="168" y="30" font-size="20">z</text><text x="176" y="18" font-size="24">Z</text>
        </g>
      </g>
    </g>
  </g>
</svg>`;

const LINES = {
  night: [
    'it\'s dream o\'clock!! ✦', 'boo! (that\'s hello in ghost)', 'hehehe that tickles', 'i hate silence. say something!',
    'my eyes glow so i never lose my socks', 'wanna hear a lullaby? → Lullaby Lab', 'i made 3 dreams today. one was about soup',
    'shh… the moon is napping', 'i\'m very brave. except about bathtime',
  ],
  day: [
    '*yaaawn* too… bright…', 'dream engineers work nights, ok?', 'five more minutes…', 'switch to night mode pls (bottom right)',
    'zz— oh! hi! i was NOT napping', 'the sun is so loud', 'i\'m solar powered (not really)',
  ],
};

export class Pip {
  constructor(el, bubble) {
    this.el = el;
    this.bubble = bubble;
    el.innerHTML = SVG;
    this.svg = el.querySelector('svg');
    this.head = this.svg.querySelector('.head');
    this.pupils = [...this.svg.querySelectorAll('.pupil')];
    this.mood = document.documentElement.dataset.mood;
    this.asleep = false;
    this.pomClicks = 0;
    this.lastActive = performance.now();
    this.target = { x: 0, y: 0 };
    this.cur = { x: 0, y: 0, tilt: 0 };
    this.visible = true;

    this.setMood(this.mood);
    this.bind();
    this.blinkLoop();
    this.idleLoop();
    this.head.style.transformOrigin = '100px 160px';
    this.wakeEyes();
  }

  bind() {
    const look = (x, y) => {
      const r = this.svg.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.43;
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy) || 1;
      const k = clamp(d / 220, 0, 1);
      this.target.x = (dx / d) * 7 * k;
      this.target.y = (dy / d) * 6 * k;
      this.target.tilt = clamp(dx / 60, -8, 8);
      this.activity();
      this.wakeEyes();
    };
    addEventListener('pointermove', (e) => look(e.clientX, e.clientY), { passive: true });
    addEventListener('pointerdown', (e) => look(e.clientX, e.clientY), { passive: true });
    addEventListener('scroll', () => this.activity(), { passive: true });
    addEventListener('keydown', () => this.activity());

    this.svg.addEventListener('click', (e) => {
      if (e.target.closest('.pompom')) { this.pompom(); return; }
      this.boop();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { this.visible = en.isIntersecting; if (this.visible) this.wakeEyes(); }).observe(this.el);
    }
  }

  activity() {
    this.lastActive = performance.now();
  }

  // the eye loop only runs while the eyes are actually moving
  wakeEyes() {
    if (this.looping) return;
    this.looping = true;
    requestAnimationFrame(() => this.frame());
  }

  frame() {
    // ease toward the target so the eyes feel soft, not twitchy
    const c = this.cur;
    const t = this.target;
    const tt = t.tilt || 0;
    c.x += (t.x - c.x) * 0.18;
    c.y += (t.y - c.y) * 0.18;
    c.tilt += (tt - c.tilt) * 0.12;
    const s = this.asleep ? 0 : 1;
    this.pupils.forEach((p) => p.setAttribute('transform', `translate(${(c.x * s).toFixed(2)} ${(c.y * s).toFixed(2)})`));
    this.head.style.transform = `rotate(${(c.tilt * 0.6).toFixed(2)}deg)`;
    const settled = Math.abs(t.x - c.x) + Math.abs(t.y - c.y) + Math.abs(tt - c.tilt) < 0.02;
    if (settled || !this.visible || document.hidden) { this.looping = false; return; }
    requestAnimationFrame(() => this.frame());
  }

  blinkLoop() {
    const go = () => {
      if (!this.asleep && !document.hidden) {
        this.svg.classList.add('blink');
        setTimeout(() => this.svg.classList.remove('blink'), 130);
        if (Math.random() < 0.25) setTimeout(() => { this.svg.classList.add('blink'); setTimeout(() => this.svg.classList.remove('blink'), 120); }, 260);
      }
      setTimeout(go, 2600 + Math.random() * 3200);
    };
    setTimeout(go, 1800);
  }

  // touch-friendly: when nobody is pointing, Pip glances around by itself.
  // After a long quiet stretch, Pip dozes off (that's a secret!)
  idleLoop() {
    setInterval(() => {
      const idle = performance.now() - this.lastActive;
      if (!this.asleep && idle > 3500 && !reducedMotion()) {
        this.target = { x: (Math.random() - 0.5) * 12, y: (Math.random() - 0.3) * 8, tilt: (Math.random() - 0.5) * 8 };
        this.wakeEyes();
      }
      if (!this.asleep && idle > 28000 && this.visible && !document.hidden) this.sleep();
    }, 1600);
  }

  say(text, ms = 3200) {
    if (!this.bubble) return;
    this.bubble.textContent = text;
    this.bubble.classList.remove('pop');
    void this.bubble.offsetWidth;
    this.bubble.classList.add('pop');
    clearTimeout(this.sayT);
    if (ms) this.sayT = setTimeout(() => { if (!this.asleep) this.bubble.textContent = this.mood === 'day' ? 'zzz… oh, hi' : 'hi hi! i\'m Pip!'; }, ms);
  }

  setMood(mood) {
    this.mood = mood;
    this.svg.classList.toggle('sleepy', mood === 'day');
  }

  boop() {
    if (this.asleep) { this.wake(true); return; }
    this.svg.classList.remove('bounce', 'happy', 'waving');
    void this.el.offsetWidth;
    this.svg.classList.add('happy', 'bounce', 'waving');
    sfx.giggle();
    this.say(pick(LINES[this.mood] || LINES.night));
    
    // Sparkle burst right at Pip's face
    const r = this.el.getBoundingClientRect();
    emit('burst', { x: r.left + r.width / 2, y: r.top + r.height * 0.45, n: 26 });
    
    // Pulse giggles meter
    const gMeter = document.getElementById('gigglesMeter');
    const gVal = document.getElementById('gigglesMeterVal');
    if (gMeter) {
      gMeter.classList.remove('pulse');
      void gMeter.offsetWidth;
      gMeter.classList.add('pulse');
      setTimeout(() => gMeter.classList.remove('pulse'), 600);
    }
    if (gVal) {
      gVal.textContent = '100% (HEHEHE! ♡)';
      clearTimeout(this.giggleValT);
      this.giggleValT = setTimeout(() => {
        gVal.textContent = '100% (overflowing!)';
      }, 1200);
    }
    
    emit('boop');
    clearTimeout(this.happyT);
    this.happyT = setTimeout(() => this.svg.classList.remove('happy', 'bounce', 'waving'), 1100);
  }

  wave() {
    this.svg.classList.add('waving');
    setTimeout(() => this.svg.classList.remove('waving'), 1900);
  }

  pompom() {
    this.pomClicks++;
    sfx.pop();
    this.svg.classList.remove('bounce');
    void this.el.offsetWidth;
    this.svg.classList.add('bounce');
    if (this.pomClicks === 3) {
      this.pomClicks = 0;
      emit('pompom');
    } else {
      this.say(this.pomClicks === 1 ? 'hey! that\'s my pom-pom' : 'one more and it plays a song…', 2400);
    }
  }

  sleep() {
    this.asleep = true;
    this.svg.classList.add('asleep');
    this.wakeEyes();
    this.say('zzz… (click to wake me)', 0);
    emit('pip-sleep');
  }

  wake(byUser) {
    if (!this.asleep) return;
    this.asleep = false;
    this.activity();
    this.svg.classList.remove('asleep');
    this.wakeEyes();
    this.svg.classList.add('yawn');
    sfx.yawn();
    setTimeout(() => this.svg.classList.remove('yawn'), 1300);
    this.say('*yaaawn* …i wasn\'t sleeping. i was testing a dream.', 3800);
    if (byUser) emit('secret', 'nap');
  }
}
