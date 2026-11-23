/**
 * /api/clic — numără clicurile pe butoanele marcate cu data-clic (v1.0, 2026-11-23)
 * Salvează în D1 (tabela clic) doar dacă baza este legată ca DB în Cloudflare Pages.
 * Fără bază legată: răspunde 204 și nu salvează nimic. Nu salvează IP-ul.
 */
export async function onRequestPost({ request, env }) {
  let b = {};
  try { b = await request.json(); } catch { try { b = JSON.parse(await request.text()); } catch {} }
  const ev = String(b.e || '').slice(0, 60), page = String(b.p || '').slice(0, 120);
  if (!ev) return new Response(null, { status: 204 });
  if (env.DB) {
    try {
      await env.DB.prepare('CREATE TABLE IF NOT EXISTS clic (id INTEGER PRIMARY KEY, ev TEXT, page TEXT, country TEXT, ts TEXT NOT NULL DEFAULT (datetime(\'now\')))').run();
      await env.DB.prepare('INSERT INTO clic (ev, page, country) VALUES (?,?,?)').bind(ev, page, request.headers.get('cf-ipcountry') || '').run();
    } catch {}
  }
  return new Response(null, { status: 204 });
}
export async function onRequestGet() { return new Response(null, { status: 405 }); }
