# ☾ Pip's Dream Workshop

> *"I build the dreams you fall asleep inside."*

The portfolio homepage of **Pip**, Junior Dream Engineer at the Midnight Nursery, built for **[Baby's First Website](https://hax.baby/baby-problem)** (haX.baby, 17–19 Oct 2026), **Track 1: The Skull Baby**.

It's styled as a 1998 GeoCribs homepage that Pip made on a pastel "PipOS 98" desktop: a dial-up boot screen, a marquee, beveled windows, a Start menu, a webring, 88×31 badges and an "under construction" sign. A sticky toolbar keeps navigation and controls (sound, day/night, chaos, secrets) at the top. Its mini address bar shows which "page" you're on, a progress strip fills as you scroll, and Pip floats in the corner as a tour guide who comments on each room and hops you to the next one. Underneath that, the craft is modern: Web Audio, SVG motion, CSS masks, canvas, and no frameworks or build step.

**Live site:** https://pip-dream-workshop.netlify.app/
**Repo:** https://github.com/Raj-nikam26/baby_hackathon

**Lighthouse (live, desktop):** Performance 90 · Accessibility 100 · Best Practices 100 · SEO 100

---

## Brief checklist

| Requirement | Where |
| --- | --- |
| **What Pip is** | Hero `pip.exe` window: an interactive SVG Pip, plus a `Pip — Properties` character sheet |
| **What Pip does** (3+ works) | **All 6** canon projects: Dream Delivery Routes (chapter 2) plus Lullaby Lab, Nightlight Collection, Rattle & Block Toys, Bedtime Storybook and Growth Chart in Pip's Desktop workspace (chapter 3) |
| **Pip's story** (not a text wall) | Chapter 01: five scroll-driven animated scenes (falling star → cradle → sleepless ghosts → firefly jar → the job) |
| **Immersion** | Eyes follow the cursor and the head tilts (touch fallback: Pip glances around by itself), clicks, sound with a mute toggle |
| **Mobile-friendly** | Built mobile-first; at phone size the story re-frames and the map camera follows Pip |
| **Easter egg** | Five of them (see below) |
| Pip is the host/narrator | Every line on the site is in Pip's voice |

### Tiers
- **Tier 1:** cursor-reactive character ✓ · scroll-driven story ✓ · day/night mood toggle that changes Pip's expression *and* the palette ✓ · responsive ✓ · easter egg ✓
- **Tier 2:** Lullaby Lab with real Web Audio ✓ · flashlight cursor (CSS mask) ✓ · Dream Delivery map with SVG path motion synced to scroll ✓ · interactive page-flip storybook (buttons, ← →, swipe, tap) ✓ · mini-game ✓
- **Tier 3:** 3D WebGL / Three.js model (drag to rotate 360°, zoom, stardust particles, 3D boop & giggles) ✓ · live guestbook backend ✓ · Pip remembers you (visit count, your name, custom greetings) ✓ · Pip chats back (rule-based PipIM, in character) ✓ · Lighthouse desktop 90 / 100 / 100 / 100 (no framework, ~100 KB of images, WebP, lazy-loading, idle-time init, offscreen sections skip rendering) ✓

### Side quests (+13)
- **Live Guestbook** (+2): "Dream Wish Guestbook", persisted with Netlify Functions + Netlify Blobs, with a kindness filter, a honeypot and a rate limit
- **Sparkle Cursor Trail** (+2): stars, tiny dreamy bones, hearts and bubbles on a canvas
- **Hit Counter Odometer** (+1): rolling green digits, backed by the server
- **Click Sounds + Mute** (+3): every click chimes; the mute button is always visible in the taskbar and the choice is remembered
- **Responsive Chaos Mode** (+5): the ✂ button. Pip "decorates" the site like a scrapbook: washi tape on every window, tilted windows, candy-striped title bars, crayon-style handwritten headings and stickers slapped in the margins. Each screen size gets its own personality: a *pocket sticker-book* on phones, a *scrapbook* on tablets and a *collage desk* on desktop, where you can drag windows by their title bars. Pip notices when you resize and redecorates.

### Easter eggs (🔑 counter in the taskbar)
1. **Pom-Pom Polka**: boop Pip's nightcap pom-pom 3×
2. **Nap time**: stay still for about 30 s and Pip falls asleep; click to wake Pip
3. **All lit**: switch on all 6 nightlights in the dark closet
4. **The Attic**: knock on the moon 3×
5. **Dream Disco**: ↑ ↑ ↓ ↓ ← → ← → B A (on touch: tap the 🔑 button 5× fast)

### Getting around (UX)
- **Pip's Desktop workspace**: the projects live in one "desktop". Click an icon (or use the arrow keys, since the icons are real tabs) and that project's window opens in place, with *previous / next project* buttons underneath. You never scroll past a pile of windows, and going back up is short.
- **Sticky toolbar**: section links with a scrollspy highlight, a mini address bar showing where you are (`geocribs.net/~pip/#toys`), a scroll progress strip, and all the controls (sound, day/night, chaos, secrets) at the top where you expect them.
- **Pip the tour guide** floats in the corner. Pip comments on each room and on every project you open, and a tap hops you to the next section. Start scrolling up and Pip offers to fly you **back to the top**.
- **Deep links**: `/#toys`, `/#storybook` and so on open that project directly.
- The scroll-driven chapters are short. The story has clickable scene dots and a "skip to my projects" link.
- Windows fade softly into view and glow when you jump to them. Toasts appear under the toolbar so nothing covers your thumb.

---

## The story behind the build

Pip hates silence, so the site is never quiet. Every sound is **synthesized live with Web Audio**: the music-box bells, the giggles, the rattle, the dial-up modem, the AIM door-open sound and the page-flip swish. That means there are no audio files to download and nothing to license. The Lullaby Lab plays two public-domain classics plus a **"tonight song"**: a waltz generated from a seed made of tonight's date, so everyone who visits on the same night hears the same song, and it never plays again.

The proudest bits:
- **A puppet, not a picture.** The hero Pip is hand-built SVG. Its glowing pupils ease toward your pointer, its head tilts, it blinks (sometimes twice), it gets sleepy in day mode, its eyes become ^^ when you boop it, and it dozes off if you ignore it.
- **The flashlight closet.** The darkness is a single div whose CSS mask is several radial gradients *intersected*: one hole for your flashlight and one for every lamp you've switched on.
- **The delivery route.** One SVG path drives everything: Pip's position, the glowing trail, which windows light up, the speech bubbles and the odometer. On phones the camera follows Pip.
- **PipIM.** An AIM-style buddy window where Pip asks your name, remembers it on later visits, tells jokes, comforts you if you can't sleep, and gives hints about the secrets.

## Run it locally

```bash
npm run dev
```
→ http://localhost:5173. This uses the zero-dependency `dev-server.mjs`, which serves the site and fakes the API in memory. Opening `index.html` directly also works; the guestbook and counter then fall back to "this browser only" mode.

## Deploy (Netlify, ~2 minutes)
1. Push this repo to GitHub (public).
2. On Netlify, choose **Add new site → Import from Git** and pick the repo. No build command is needed; `netlify.toml` handles it.
3. The functions in `netlify/functions/` deploy automatically, and Netlify Blobs needs no setup.

The site also works as plain static hosting (GitHub Pages, Vercel static); the guestbook and counter then quietly switch to local mode.

## Project structure
```
index.html            all sections + shared SVG sprites
css/style.css         themes (day/night), windows, layout, Chaos Mode
js/main.js            boot screen, toolbar controls, mood, sound, sparkles, hit counter
js/nav.js             scrollspy, progress bar, reveal-on-scroll, Pip tour guide
js/desk.js            Pip's Desktop: one-window-at-a-time project workspace
js/pip.js             the interactive SVG Pip puppet
js/pip3d.js           interactive 3D WebGL / Three.js Pip model (drag, zoom, boop, stardust)
js/audio.js           Web Audio synth (bells, giggles, rattle, modem…) and tune player
js/story.js           scroll-driven origin story
js/lullaby.js         Lullaby Lab + generative "tonight song"
js/nightlights.js     flashlight closet
js/routes.js          Dream Delivery Routes
js/toys.js            Catch the Dreams game, rattle, letter blocks
js/storybook.js       "Goodnight, Boo" flip book
js/growth.js          growth chart
js/chat.js            PipIM rule-based chat
js/guestbook.js       Dream Wish Guestbook client
js/chaos.js           Responsive Chaos Mode
js/eggs.js            secrets tracker
netlify/functions/    guestbook + counter API (Netlify Blobs)
dev-server.mjs        local preview server
```

Accessibility: keyboard-reachable controls, visible focus, `aria-live` regions for Pip's speech, chat and status text, `prefers-reduced-motion` support (no boot animation, no sparkles, calm transitions), alt text on every image, and a skip link.

## Credits
- **Pip** (name, look, profession) and the four studio renders (portrait, Pip on a cloud, music box, moon lantern) are from the official **haX.baby Track 1 creator asset pack**, used under its terms.
- Everything else visual (the SVG Pip puppet, ghosts, houses, story scenes, storybook pages, nightlights, game sprites) is hand-coded SVG, CSS and canvas made for this site.
- All sounds are synthesized with the Web Audio API. "Twinkle Twinkle Little Star" and Brahms' "Wiegenlied" are public domain.
- Fonts: [Fredoka](https://fonts.google.com/specimen/Fredoka), [Nunito](https://fonts.google.com/specimen/Nunito), [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) and [Gochi Hand](https://fonts.google.com/specimen/Gochi+Hand), SIL Open Font License, via Google Fonts.
- Built with plain HTML/CSS/JS, with help from AI coding tools (Claude). Backend: Netlify Functions + `@netlify/blobs`.
