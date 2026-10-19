// PipIM: an AIM-style chat window. Pip answers in character with a
// rule-based brain (no AI API needed) and remembers your name.
import { $, store, pick, whenVisible, emit } from './util.js';
import { sfx, playTune } from './audio.js';
import { secretHint } from './eggs.js';

const R = (re, replies, fx) => ({ re, replies, fx });

const JOKES = [
  'why did the ghost go to the party? for the BOO-ffet!! hehehe',
  'what do you call a sleeping dinosaur? a dino-SNORE 🦕',
  'why don\'t skeletons fight? they don\'t have the guts. (i have a skull FACE, not a skeleton, totally different)',
  'what did the blanket say to the bed? i\'ve got you covered ♡',
  'why did the moon skip dinner? it was already full 🌕',
];

const RULES = [
  R(/\b(my name is|call me|i am called)\s+([a-z0-9 _-]{1,20})/i, null, 'name'),
  R(/\b(thank|thx|ty)\b/i, ['ur welcome!! *happy wiggle*', 'hehe anytime ♡', 'no, thank YOU :3']),
  R(/\b(bye|good ?night|gn|night night|nite|cya|see (ya|you))\b/i, ['goodnight!! may ur dreams be extra fluffy ☁', 'bye bye! i\'ll put a nice dream in ur pillow ✦', 'nini!! don\'t let the bedbugs knit (they\'re making scarves)'], 'bye'),
  R(/\b(hi+|hello|hey+|yo|sup|heya|hiya|helo|hai)\b/i, ['hiii!! ^_^', 'hello hello!! *waves tiny hand*', 'hey!! ur here!! :D']),
  R(/\b(skull|bone|bones|scary|spooky|dead|creepy|skeleton)\b/i, ['it\'s just my face! it\'s very soft. like a marshmallow that went to art school', 'i\'m not spooky, i\'m SNOOZY. big difference', 'my eye holes glow so i can read bedtime stories in the dark ✦']),
  R(/(who (are|r) (you|u)|what (are|r) (you|u)|about (you|u)|tell me about)/i, ['i\'m Pip! a baby with a skull face and a starry nightcap. Junior Dream Engineer at the Midnight Nursery ✦', 'just a lil guy who builds dreams :3 and giggles a LOT']),
  R(/(job|work|what do (you|u) do|engineer|profession|career)/i, ['i\'m a Junior Dream Engineer! i design dreams, lullabies, nightlights and bedtime stories so the neighbourhood can sleep ☾', 'i build the dreams you fall asleep inside. tonight i\'m building one about a cat who\'s also a cloud']),
  R(/\b(sing|song|lullaby|music|hum)\b/i, ['ok ok here\'s a tiny one ♪', 'la la laaa ♪ (my real ones are in the Lullaby Lab!)'], 'sing'),
  R(/\b(sad|tired|cry|crying|lonely|anxious|scared|worried|cant sleep|can't sleep|insomnia|stress)/i, ['aww. come here *tiny hug* ♡ u did good today, even if it doesn\'t feel like it', 'want me to leave a nightlight on for u? i\'ll stay up. i\'m good at staying up (no i\'m not)', 'breathe in like ur smelling a cookie… breathe out like ur cooling soup. better? ♡']),
  R(/\b(dream|dreams|nightmare)/i, ['last night i made a dream where everyone was a pancake. 10/10', 'nightmares aren\'t allowed here. i put a lil sign on the door', 'my best dream ever: a library where all the books are pillows']),
  R(/\b(light|lamp|lantern|dark|nightlight)/i, ['i have 6 nightlights! find them all in my closet (Nightlights window) ✦', 'the dark is just the sky wearing pajamas']),
  R(/\b(ghost|boo|ghosts)\b/i, ['Boo is my best friend! Boo used to be scared of silence, like me', 'ghosts are just very shy blankets']),
  R(/\b(story|book|read)\b/i, ['i wrote a book! “Goodnight, Boo” — it\'s in the Storybook window, i drew it with crayons', 'once upon a time there was a baby who hated silence. the end. (it\'s autobiographical)']),
  R(/(where.*(from|live)|born|parents|mom|dad|origin|how did (you|u))/i, ['a sleepy star fell into an empty cradle and plip! there i was', 'i live at the Midnight Nursery on Hushwillow Lane. 3rd cloud on the left']),
  R(/\b(old|age|birthday)\b/i, ['i\'m about 300 moons old but in baby years so like… baby', 'my birthday is every time a star falls. so pretty often']),
  R(/\b(eat|food|hungry|milk|snack|cookie)/i, ['warm milk with one (1) marshmallow. that\'s the recipe', 'i ate a moonbeam once. tasted like vanilla']),
  R(/\b(jokes?|funny|laugh)\b/i, JOKES),
  R(/\b(love|cute|adorable|like (you|u)|ily|best)\b/i, ['!!!!! *blushes in skull* ♡♡♡', 'u r cute too!! :3', 'eeeee *hides under nightcap*']),
  R(/\b(secrets?|easter|hidden|eggs?|hints?)\b/i, null, 'secret'),
  R(/\b(help|what can|how do)\b/i, ['u can: play my music box, find my nightlights, fly my dream route, play catch, read my book, sign my guestbook… or just chat w me :3']),
  R(/\b(time|late|clock)\b/i, null, 'time'),
  R(/\b(silence|quiet|shh)\b/i, ['NOOO not the silence!! quick, say something!!', '*hums loudly to fight the silence*']),
  R(/\b(day|sun|morning)\b/i, ['daytime makes me so sleepy… dream engineers work nights!', 'the sun is like a nightlight that\'s too excited']),
];

const FALLBACK = [
  'hehe i don\'t know that word yet but i like it',
  '*nods very seriously* mhm. mhm. yes.',
  'whoa. tell me more!!',
  'i\'m just a baby, i only understand like 40 words :3 (try: dreams, ghosts, lullaby, joke)',
  'that\'s so interesting!! *falls over*',
  'brb writing that down in my crayon diary',
];

export function initChat({ getVisitor, pip }) {
  const log = $('#imLog');
  const form = $('#imForm');
  const input = $('#imInput');
  const typing = $('#imTyping');
  const chips = $('#imChips');
  let awaitingName = false;
  let busy = 0;

  const line = (who, text, cls) => {
    const p = document.createElement('p');
    p.className = cls;
    if (who) {
      const b = document.createElement('span');
      b.className = 'who';
      b.textContent = `${who}: `;
      p.appendChild(b);
    }
    p.appendChild(document.createTextNode(text));
    log.appendChild(p);
    while (log.children.length > 80) log.firstChild.remove();
    log.scrollTop = log.scrollHeight;
  };
  const youName = () => getVisitor().name || 'you';

  const pipSays = (text, delay) => {
    busy++;
    typing.hidden = false;
    setTimeout(() => {
      busy--;
      if (!busy) typing.hidden = true;
      line('xX_PipDreams_Xx', text, 'pip');
      sfx.imMsg();
    }, delay ?? 500 + Math.min(1400, text.length * 18) + Math.random() * 300);
  };

  const setName = (raw) => {
    const name = raw.replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 20);
    if (!name) return false;
    const v = getVisitor();
    v.name = name.replace(/^\w/, (c) => c.toUpperCase());
    store.set('visitor', v);
    emit('name', v.name);
    return v.name;
  };

  const reply = (msg) => {
    const m = msg.trim();
    if (awaitingName) {
      awaitingName = false;
      const words = m.replace(/^(i'?m|im|i am|it'?s|its|my name is|me is|me)\s+/i, '').split(/\s+/);
      if (words.length <= 3 && !/\?/.test(m) && !/^(no|nope|nah)$/i.test(m)) {
        const n = setName(words.join(' '));
        if (n) { pipSays(`${n}!! that's such a cozy name. i'll remember it forever (or until u clear ur cookies) ♡`); return; }
      }
      pipSays('ok secret agent, i\'ll call u “friend” :3');
      return;
    }
    for (const rule of RULES) {
      const hit = rule.re.exec(m);
      if (!hit) continue;
      if (rule.fx === 'name') {
        const n = setName(hit[2]);
        pipSays(n ? `${n}!! got it. i wrote it on my hand in crayon` : 'hmm i couldn\'t read that name');
        return;
      }
      if (rule.fx === 'secret') { pipSays(secretHint()); return; }
      if (rule.fx === 'time') {
        const h = new Date().getHours();
        pipSays(h >= 19 || h < 6 ? 'it\'s DREAM O\'CLOCK. the best o\'clock ☾' : `it's ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. too early for dreams… or is it`);
        return;
      }
      pipSays(pick(rule.replies));
      if (rule.fx === 'sing') {
        setTimeout(() => playTune([['E5', 0.5], ['G5', 0.5], ['A5', 1], ['G5', 0.5], ['E5', 0.5], ['D5', 1], ['C5', 2]], { bpm: 110 }), 900);
      }
      if (rule.fx === 'bye') { const p = pip(); if (p) p.say('nini!! ♡', 2500); }
      return;
    }
    const word = (m.match(/[a-z]{5,}/gi) || [])[0];
    pipSays(word && Math.random() < 0.4 ? `“${word.toLowerCase()}”… hehe that's a funny word. ${pick(['say it again!', 'i\'m gonna name a dream that', 'is it edible?'])}` : pick(FALLBACK));
  };

  const send = (text) => {
    const t = text.trim().slice(0, 160);
    if (!t) return;
    line(youName(), t, 'you');
    reply(t);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    send(input.value);
    input.value = '';
  });

  ['who r u?', 'what do u do?', 'tell me a joke', 'sing!', 'any secrets?', 'i can\'t sleep'].forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = c;
    b.addEventListener('click', () => send(c));
    chips.appendChild(b);
  });

  whenVisible($('#chat'), () => {
    line('', '*** xX_PipDreams_Xx has signed on ***', 'sys');
    sfx.door();
    const v = getVisitor();
    if (v.name) {
      pipSays(`omg ${v.name}!! u came back!! hiii ^_^`, 700);
      pipSays('ask me anything. i know about dreams, ghosts, and some soups', 1900);
    } else {
      pipSays('hiii!! a new friend!! :D', 700);
      pipSays('what\'s ur name? (u can make one up, i won\'t tell)', 1900);
      awaitingName = true;
    }
  }, '-60px');
}
