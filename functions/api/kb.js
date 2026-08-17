/**
 * /api/kb — căutare hibridă peste banca de Q&A și use cases.
 *
 *   GET /api/kb?q=cum+ma+vede+chatgpt          → hibrid (FTS + vector)
 *   GET /api/kb?q=...&mode=fts|vector|hybrid
 *   GET /api/kb?kind=qa|usecase&category=...&limit=20
 *   GET /api/kb?slug=...                        → o singură înregistrare
 *
 * Bindings necesare (wrangler.toml): DB (D1), VEC (Vectorize), AI (Workers AI).
 */

const EMBED_MODEL = '@cf/baai/bge-m3';   // multilingv, bun pe română
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data, null, 2), { status, headers: CORS });

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const q = (u.searchParams.get('q') || '').trim();
  const slug = u.searchParams.get('slug');
  const kind = u.searchParams.get('kind') || 'qa';
  const category = u.searchParams.get('category');
  const mode = u.searchParams.get('mode') || 'hybrid';
  const limit = Math.min(parseInt(u.searchParams.get('limit') || '20', 10) || 20, 50);

  if (!env.DB) return json({ error: 'D1 binding DB lipsește' }, 500);

  try {
    // ---- o singură înregistrare
    if (slug) {
      const table = kind === 'usecase' ? 'usecase' : 'qa';
      const r = await env.DB.prepare(`SELECT * FROM ${table} WHERE slug = ?`).bind(slug).first();
      return r ? json(r) : json({ error: 'not found' }, 404);
    }

    // ---- listare / filtrare fără interogare text
    if (!q) {
      const table = kind === 'usecase' ? 'usecase' : 'qa';
      const col = kind === 'usecase' ? 'industry' : 'category';
      const sql = category
        ? `SELECT * FROM ${table} WHERE ${col} = ? ORDER BY id LIMIT ?`
        : `SELECT * FROM ${table} ORDER BY id LIMIT ?`;
      const stmt = category
        ? env.DB.prepare(sql).bind(category, limit)
        : env.DB.prepare(sql).bind(limit);
      const { results } = await stmt.all();
      return json({ mode: 'list', count: results.length, results });
    }

    // ---- FTS
    let fts = [];
    if (mode === 'fts' || mode === 'hybrid') {
      const match = q.replace(/["']/g, ' ').split(/\s+/).filter(Boolean).join(' OR ');
      const sql = kind === 'usecase'
        ? `SELECT u.*, bm25(uc_fts) AS rank FROM uc_fts JOIN usecase u ON u.id = uc_fts.rowid
           WHERE uc_fts MATCH ? ORDER BY rank LIMIT ?`
        : `SELECT a.*, bm25(qa_fts) AS rank FROM qa_fts JOIN qa a ON a.id = qa_fts.rowid
           WHERE qa_fts MATCH ? ORDER BY rank LIMIT ?`;
      const { results } = await env.DB.prepare(sql).bind(match, limit).all();
      fts = results || [];
    }

    // ---- vector
    let vec = [];
    if ((mode === 'vector' || mode === 'hybrid') && env.VEC && env.AI) {
      const emb = await env.AI.run(EMBED_MODEL, { text: [q] });
      const vector = emb.data?.[0];
      if (vector) {
        const hits = await env.VEC.query(vector, {
          topK: limit,
          returnMetadata: true,
          filter: { kind: kind === 'usecase' ? 'usecase' : 'qa' },
        });
        const ids = (hits.matches || []).map(m => m.id);
        if (ids.length) {
          const table = kind === 'usecase' ? 'usecase' : 'qa';
          const ph = ids.map(() => '?').join(',');
          const { results } = await env.DB
            .prepare(`SELECT * FROM ${table} WHERE vector_id IN (${ph})`).bind(...ids).all();
          const byId = Object.fromEntries((results || []).map(r => [r.vector_id, r]));
          vec = (hits.matches || [])
            .map(m => byId[m.id] && { ...byId[m.id], score: m.score })
            .filter(Boolean);
        }
      }
    }

    // ---- fuziune: Reciprocal Rank Fusion
    const merged = new Map();
    const add = (list, weight) => list.forEach((r, i) => {
      const key = r.slug;
      const prev = merged.get(key) || { ...r, _rrf: 0 };
      prev._rrf += weight / (60 + i + 1);
      merged.set(key, prev);
    });
    if (mode === 'fts') add(fts, 1);
    else if (mode === 'vector') add(vec, 1);
    else { add(fts, 1); add(vec, 1.2); }

    const out = [...merged.values()].sort((a, b) => b._rrf - a._rrf).slice(0, limit);

    // telemetrie best-effort
    env.DB.prepare('INSERT INTO query_log (q, hits, mode) VALUES (?, ?, ?)')
      .bind(q, out.length, mode).run().catch(() => {});

    return json({ q, mode, count: out.length, results: out });
  } catch (err) {
    return json({ error: String(err && err.message || err) }, 500);
  }
}
