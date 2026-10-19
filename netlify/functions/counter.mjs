// Retro hit counter (Netlify Function + Netlify Blobs)
// GET  /api/counter -> { count }
// POST /api/counter -> { count }  (counts one visit; the page only POSTs once per session)
import { getStore } from '@netlify/blobs';
import { json } from '../lib/shared.mjs';

export default async (req) => {
  const store = getStore({ name: 'counter', consistency: 'strong' });
  let count = Number(await store.get('visits')) || 0;
  if (req.method === 'POST') {
    count += 1;
    await store.set('visits', String(count));
  } else if (req.method !== 'GET') {
    return json({ error: 'method not allowed' }, 405);
  }
  return json({ count });
};

export const config = { path: '/api/counter' };
