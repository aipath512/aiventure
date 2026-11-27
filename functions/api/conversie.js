/**
 * /api/conversie v1.0 (2026-11-27) — înregistrează conversia o singură dată pentru fiecare lead_id confirmat de server.
 * Setează lead.converted_at doar dacă lead-ul există și nu a fost deja numărat.
 */
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
export async function onRequestPost({ request, env }) {
  let b = {};
  try { b = await request.json(); } catch { try { b = JSON.parse(await request.text()); } catch {} }
  const id = String(b.lead_id || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(id) || !env.DB) return json({ ok: false, counted: false }, 400);
  try {
    const r = await env.DB.prepare("UPDATE lead SET converted_at = datetime('now') WHERE lead_uid = ? AND converted_at IS NULL").bind(id).run();
    return json({ ok: true, counted: (r.meta && r.meta.changes) === 1 });
  } catch { return json({ ok: false, counted: false }, 500); }
}
export async function onRequestGet() { return json({ ok: false }, 405); }
