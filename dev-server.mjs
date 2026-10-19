// Local preview server: serves the static site and fakes the two API
// routes in memory, so you can test everything without a Netlify account.
//   node dev-server.mjs   ->  http://localhost:5173
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkWish } from './netlify/lib/shared.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 5173;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain' };

let visits = 0;
const entries = [];

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/counter') {
    if (req.method === 'POST') visits++;
    return send(res, 200, { count: visits });
  }
  if (url.pathname === '/api/guestbook') {
    if (req.method === 'GET') return send(res, 200, { entries });
    let raw = '';
    for await (const c of req) raw += c;
    let body = {};
    try { body = JSON.parse(raw); } catch { return send(res, 400, { error: 'bad json' }); }
    const r = checkWish(body);
    if (r.error) return send(res, 200, { error: r.error });
    if (!r.bot) entries.unshift(r.entry);
    return send(res, 201, { entry: r.entry });
  }
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  if (!path || path.endsWith('/') || path.endsWith('\\')) path = join(path, 'index.html');
  const file = join(ROOT, path);
  if (!file.startsWith(ROOT) || /(^|[/\\])(\.|node_modules|_download)/.test(path)) return send(res, 404, 'not found', 'text/plain');
  try {
    if (!(await stat(file)).isFile()) throw new Error();
    send(res, 200, await readFile(file), TYPES[extname(file)] || 'application/octet-stream');
  } catch {
    send(res, 404, 'not found', 'text/plain');
  }
}).listen(PORT, () => console.log(`Pip is awake at http://localhost:${PORT}`));
