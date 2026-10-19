// shared helpers for the tiny Pip backend (also used by dev-server.mjs)
export const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

const STICKERS = ['moon', 'star', 'ghost', 'heart', 'bottle'];
// keep the nursery kind: a small, deliberately boring blocklist
const UNKIND = /(f+u+c+k|sh[i1]t|b[i1]tch|cunt|n[i1]gg|f[a@]g|rape|kys|kill\s*(your|ur)self|porn|nazi|retard)/i;
const LINKY = /(https?:\/\/|www\.|\.(com|net|org|xyz|ru|io)\b)/i;

const clean = (s, max) => String(s ?? '')
  .replace(/[\u0000-\u001f\u007f​-‏‪-‮]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

export function checkWish(body = {}) {
  const name = clean(body.name, 24);
  const msg = clean(body.msg, 140);
  const sticker = STICKERS.includes(body.sticker) ? body.sticker : 'moon';
  const entry = { name, msg, sticker, ts: Date.now() };
  if (body.website) return { bot: true, entry };
  if (!name || !msg) return { error: 'pls write a name and a wish ♡' };
  if (UNKIND.test(name + ' ' + msg)) return { error: 'Pip only reads kind wishes ♡' };
  if (LINKY.test(msg) || LINKY.test(name)) return { error: 'no links pls, just dreams ♡' };
  return { entry };
}
