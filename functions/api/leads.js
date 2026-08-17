/**
 * /api/leads — panou de citire pentru verificarea zilnică manuală.
 *
 *   GET /api/leads?key=...            → ultimele 50, ca pagină HTML
 *   GET /api/leads?key=...&format=json
 *   GET /api/leads?key=...&days=7     → doar ultimele N zile
 *
 * Protecție: variabila de mediu LEADS_KEY. Dacă nu este setată, endpointul
 * răspunde 404 — nimeni nu poate citi lead-urile din greșeală.
 */

const notFound = () => new Response('Not found', { status: 404 });

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const key = u.searchParams.get('key');

  if (!env.LEADS_KEY) return notFound();
  if (key !== env.LEADS_KEY) return notFound();
  if (!env.DB) {
    return new Response('D1 (binding DB) nu este legat — nu există unde citi.', { status: 500 });
  }

  const days = parseInt(u.searchParams.get('days') || '0', 10);
  const limit = Math.min(parseInt(u.searchParams.get('limit') || '50', 10) || 50, 500);

  let rows = [];
  try {
    const sql = days > 0
      ? `SELECT * FROM lead WHERE ts >= datetime('now', ?) ORDER BY id DESC LIMIT ?`
      : `SELECT * FROM lead ORDER BY id DESC LIMIT ?`;
    const stmt = days > 0
      ? env.DB.prepare(sql).bind(`-${days} days`, limit)
      : env.DB.prepare(sql).bind(limit);
    const r = await stmt.all();
    rows = r.results || [];
  } catch (_) {
    rows = [];  // tabela nu există încă = niciun lead primit
  }

  if (u.searchParams.get('format') === 'json') {
    return new Response(JSON.stringify({ count: rows.length, leads: rows }, null, 2),
      { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }

  const esc = (s) => String(s == null ? '' : s)
    .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const body = rows.length
    ? rows.map((r) => `
      <article>
        <div class="ts">${esc(r.ts)}${r.country ? ' · ' + esc(r.country) : ''}</div>
        <h2>${esc(r.website)}</h2>
        <p><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></p>
        <p class="tip">${esc(r.tip)}</p>
        ${r.obiectiv ? `<p class="ob">${esc(r.obiectiv)}</p>` : ''}
        ${r.mesaj ? `<p class="msg">${esc(r.mesaj)}</p>` : ''}
      </article>`).join('')
    : '<p class="empty">Niciun lead încă.</p>';

  return new Response(`<!DOCTYPE html><html lang="ro"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Lead-uri AiVenture</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0A0A0A;color:#fff;font:16px/1.6 -apple-system,system-ui,sans-serif;padding:20px;max-width:760px;margin:0 auto}
h1{font-size:20px;margin-bottom:4px}
.sub{color:#9a9a94;font:12px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;margin-bottom:24px}
article{background:#121212;border:1px solid #2a2a28;border-radius:12px;padding:18px;margin-bottom:14px}
article h2{font-size:18px;color:#D4AF37;margin:6px 0}
.ts{font:11px ui-monospace,monospace;color:#77776f;letter-spacing:.1em}
.tip{color:#9a9a94;font-size:14px}
.ob{color:#D4AF37;font-size:14px;margin-top:6px}
.msg{margin-top:10px;padding-top:10px;border-top:1px solid #2a2a28;color:#c9c9c2;font-size:15px}
a{color:#F2C94C}
.empty{color:#9a9a94;text-align:center;padding:50px 0}
.f{margin-bottom:18px;font-size:13px}
.f a{margin-right:14px}
</style></head><body>
<h1>Lead-uri AiVenture</h1>
<div class="sub">${rows.length} afișate · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC</div>
<div class="f">
  <a href="?key=${esc(key)}">Toate</a>
  <a href="?key=${esc(key)}&days=1">Azi</a>
  <a href="?key=${esc(key)}&days=7">7 zile</a>
  <a href="?key=${esc(key)}&format=json">JSON</a>
</div>
${body}
</body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
