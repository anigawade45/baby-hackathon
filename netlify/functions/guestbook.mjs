// Dream Wish Guestbook API (Netlify Function + Netlify Blobs)
// GET  /api/guestbook  -> { entries: [...] }
// POST /api/guestbook  { name, msg, sticker } -> { entry }
import { getStore } from '@netlify/blobs';
import { checkWish, json } from '../lib/shared.mjs';

export default async (req, context) => {
  const store = getStore({ name: 'guestbook', consistency: 'strong' });

  if (req.method === 'GET') {
    const entries = (await store.get('entries', { type: 'json' })) || [];
    return json({ entries: entries.slice(0, 60) });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch { return json({ error: 'that wish got scrambled, try again?' }); }

    const result = checkWish(body);
    // friendly refusals are 200s so visitors never see a red console error
    if (result.error) return json({ error: result.error });
    if (result.bot) return json({ entry: result.entry }); // honeypot: smile and wave

    // one wish per visitor every 20 seconds
    const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || 'anon';
    const rlKey = `rl/${ip.replace(/[^a-z0-9.:]/gi, '')}`;
    const lastAt = Number(await store.get(rlKey)) || 0;
    if (Date.now() - lastAt < 20000) return json({ error: 'slow down, sleepyhead! one wish every 20 seconds ♡' });
    await store.set(rlKey, String(Date.now()));

    const entries = (await store.get('entries', { type: 'json' })) || [];
    entries.unshift(result.entry);
    await store.setJSON('entries', entries.slice(0, 300));
    return json({ entry: result.entry }, 201);
  }

  return json({ error: 'method not allowed' }, 405);
};

export const config = { path: '/api/guestbook' };
