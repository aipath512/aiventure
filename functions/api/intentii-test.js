/**
 * /api/intentii-test — testul de pe pagina /intentii/ (v1.0, 2026-11-23)
 *
 * 1. Verifică site-ul dat: citește pagina principală și până la 4 pagini relevante
 *    (întrebări, prețuri, servicii, ofertă) și caută pasajele care răspund la întrebare.
 *    Verificare simplă, după cuvinte — nu folosește AI.
 * 2. Trimite DOAR întrebarea (test orb: AI-ul nu primește numele firmei) la ChatGPT, Claude, Gemini și Perplexity prin motorul AI-LENS
 *    (ai-lens.eu/api/lens-market, cu cheile API configurate acolo) și transmite
 *    rezultatele pe măsură ce sosesc (NDJSON).
 *
 * Limită: 5 teste pe zi pentru fiecare adresă IP și 150 pe zi în total (pe nod Cloudflare).
 */

const MARKET_URL = 'https://ai-lens.eu/api/lens-market';
const PER_IP_DAILY = 5;
const GLOBAL_DAILY = 150;
const enc = new TextEncoder();

const STOP = new Set(('a ai al ale alt am ar are as asa au ca cat care ce cei cel cele cine cu cum da daca de din dupa e este fi fie for in la le lor mai ma mi ne nu o or pe pentru prin sa se si sunt te tu un una unei unui va vreau caut am nevoie imi iti ne-ar care-i mea meu mele mei the and for with of to in on my is are').split(' '));

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokens(q) {
  return [...new Set(norm(q).split(' ').filter(w => w.length > 2 && !STOP.has(w)))];
}
function stem(w) { return w.length > 5 ? w.slice(0, w.length - 2) : w; }
function decode(s) { return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }
function textOf(html) {
  return decode(String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<svg[\s\S]*?<\/svg>/gi, ' ').replace(/<(br|p|li|h\d|div|tr|td|th|dt|dd|summary|details|section|article)[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ');
}
function normalizeUrl(v) {
  try { v = String(v || '').trim(); if (!v) return null; if (!/^https?:\/\//i.test(v)) v = 'https://' + v; const u = new URL(v); return ['http:', 'https:'].includes(u.protocol) ? u.href : null; } catch { return null; }
}
async function get(url, ms = 9000) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { signal: ac.signal, redirect: 'follow', headers: { 'User-Agent': 'AiVenture-Intentii/1.0 (+https://aiventure.ro/intentii/)', 'Accept': 'text/html,*/*;q=0.5' } });
    const ct = r.headers.get('content-type') || '';
    if (!r.ok || !/html|text/i.test(ct)) return null;
    return { url: r.url, html: (await r.text()).slice(0, 600000) };
  } catch { return null; } finally { clearTimeout(t); }
}

async function siteCheck(target, query) {
  const home = await get(target);
  if (!home) return { status: 'NOT_FETCHED', url: target };
  const origin = new URL(home.url).origin;
  const links = [];
  for (const m of home.html.matchAll(/href=["']([^"'#]+)["']/gi)) {
    try {
      const u = new URL(m[1], home.url); if (u.origin !== origin) continue;
      const p = norm(u.pathname);
      if (/(intreb|faq|pret|tarif|servic|oferta|pachet|startup|contact|despre)/.test(p) && !links.includes(u.href) && u.href !== home.url) links.push(u.href);
    } catch {}
  }
  const pages = [home];
  for (const l of links.slice(0, 4)) { const p = await get(l, 7000); if (p) pages.push(p); }

  const qt = tokens(query).map(stem);
  const hits = [];
  for (const p of pages) {
    const sentences = textOf(p.html).split(/\n|(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 25 && s.length < 400);
    for (const s of sentences) {
      const st = norm(s).split(' ').map(stem);
      const found = qt.filter(w => st.some(x => x.startsWith(w) || w.startsWith(x) && x.length > 3));
      if (found.length) hits.push({ url: p.url, text: s, score: found.length / Math.max(qt.length, 1) });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  const best = []; const seen = new Set();
  for (const h of hits) { const k = norm(h.text).slice(0, 80); if (seen.has(k)) continue; seen.add(k); best.push({ url: h.url, text: h.text.slice(0, 280), score: Math.round(h.score * 100) }); if (best.length >= 3) break; }
  const top = best[0]?.score || 0;
  return {
    status: 'OK', url: home.url, pages_checked: pages.map(p => p.url), query_words: tokens(query),
    verdict: top >= 60 ? 'FOUND' : top >= 30 ? 'PARTIAL' : 'MISSING', best
  };
}

async function allow(request) {
  const ip = request.headers.get('cf-connecting-ip') || 'x';
  const day = new Date().toISOString().slice(0, 10);
  const cache = caches.default;
  const keys = [[`https://rl.aiventure.ro/intentii/${day}/${ip}`, PER_IP_DAILY], [`https://rl.aiventure.ro/intentii/${day}/all`, GLOBAL_DAILY]];
  const counts = [];
  for (const [k, max] of keys) {
    const r = await cache.match(k); const n = r ? Number(await r.text()) || 0 : 0;
    if (n >= max) return false; counts.push([k, n]);
  }
  for (const [k, n] of counts) await cache.put(k, new Response(String(n + 1), { headers: { 'Cache-Control': 'max-age=90000' } }));
  return true;
}

export async function onRequestPost({ request }) {
  let b; try { b = await request.json(); } catch { return Response.json({ error: 'Date invalide.' }, { status: 400 }); }
  const query = String(b.query || '').trim().slice(0, 300);
  const name = String(b.name || '').trim().slice(0, 120);
  const url = normalizeUrl(b.url);
  if (query.length < 3) return Response.json({ error: 'Scrie întrebarea clientului sau un cuvânt cheie.' }, { status: 400 });
  if (!name && !url) return Response.json({ error: 'Scrie numele firmei sau adresa site-ului.' }, { status: 400 });
  if (!(await allow(request))) return Response.json({ error: 'Ai atins limita de teste pentru azi. Revino mâine sau scrie-ne pe WhatsApp: +40 737 123 540.' }, { status: 429 });

  const stream = new ReadableStream({
    async start(c) {
      const send = o => c.enqueue(enc.encode(JSON.stringify(o) + '\n'));
      try {
        send({ type: 'start', query, name, url });
        const market = fetch(MARKET_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_intent: query, target_name: name || new URL(url).hostname, target_url: url || '', blind: true }) });
        if (url) { try { send({ type: 'site_check', ...(await siteCheck(url, query)) }); } catch (e) { send({ type: 'site_check', status: 'NOT_FETCHED', url, error: String(e?.message || e) }); } }
        else send({ type: 'site_check', status: 'NO_URL' });
        const r = await market;
        if (!r.ok || !r.body) { send({ type: 'ai_error', error: 'Motorul AI nu răspunde acum (HTTP ' + r.status + ').' }); }
        else {
          const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = '';
          for (;;) {
            const { value, done } = await reader.read(); if (done) break;
            buf += dec.decode(value, { stream: true });
            let i; while ((i = buf.indexOf('\n')) >= 0) {
              const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue;
              try { const j = JSON.parse(line); if (['market_provider_start', 'market_candidates', 'market_comparison'].includes(j.type)) send(j); } catch {}
            }
          }
        }
        send({ type: 'end' });
      } catch (e) { send({ type: 'ai_error', error: String(e?.message || e) }); send({ type: 'end' }); }
      finally { c.close(); }
    }
  });
  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export async function onRequestGet() { return Response.json({ error: 'Folosește POST.' }, { status: 405 }); }
