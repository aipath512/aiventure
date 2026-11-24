/** 3WEBOBS Web X-Ray — public technical scan, bounded and read-only. */
const MAX_PAGES = 5;
const MAX_BYTES = 260000;
const TIMEOUT_MS = 8500;

const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': 'https://aiventure.ro' } });
const forbiddenHost = host => {
  const h = host.toLowerCase().replace(/\.$/, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.test') || h.endsWith('.invalid') || h.endsWith('.onion')) return true;
  if (/^(?:\d+\.){3}\d+$/.test(h)) {
    const n = h.split('.').map(Number);
    return n.some(v => v > 255) || n[0] === 0 || n[0] === 10 || n[0] === 127 || n[0] >= 224 || (n[0] === 169 && n[1] === 254) || (n[0] === 172 && n[1] >= 16 && n[1] <= 31) || (n[0] === 192 && n[1] === 168) || (n[0] === 100 && n[1] >= 64 && n[1] <= 127) || (n[0] === 192 && n[1] === 0 && n[2] === 0);
  }
  // Reject IPv6, IPv4-in-IPv6 and unusual numeric/encoded host representations.
  return h.includes(':') || /^\d+$/.test(h) || /^(?:0x|0[0-9])[0-9a-f.]+$/i.test(h) || !/^[a-z0-9.-]+$/.test(h) || !h.includes('.');
};
function safeUrl(input, base) {
  let u;
  try { u = new URL(input, base); } catch { return null; }
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || forbiddenHost(u.hostname) || (u.port && !['80', '443'].includes(u.port))) return null;
  u.hash = '';
  return u;
}
async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let current = url;
    for (let redirects = 0; redirects <= 2; redirects++) {
      const response = await fetch(current, { redirect: 'manual', signal: controller.signal, headers: { 'Accept': 'text/html,application/xhtml+xml', 'User-Agent': 'AiVenture-3WEBOBS/1.0 (+https://aiventure.ro/three-webs/)' } });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const next = safeUrl(response.headers.get('location') || '', current);
        if (!next || next.hostname !== url.hostname) throw new Error('Redirecționare în afara domeniului');
        current = next;
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!/html/i.test(response.headers.get('content-type') || '')) throw new Error('Conținutul nu este HTML');
      if (Number(response.headers.get('content-length') || 0) > MAX_BYTES) throw new Error('Pagină prea mare pentru analiza rapidă');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Răspuns fără conținut');
      let total = 0; const chunks = [];
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_BYTES) { await reader.cancel(); throw new Error('Limită de 260 KB/pagină'); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(total); let at = 0;
      for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.byteLength; }
      return { html: new TextDecoder().decode(bytes), finalUrl: current.href, status: response.status };
    }
    throw new Error('Prea multe redirecționări');
  } finally { clearTimeout(timer); }
}
const strip = s => (s || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&(?:nbsp|amp|lt|gt|quot);/g, ' ').replace(/\s+/g, ' ').trim();
const first = (html, re) => html.match(re)?.[1]?.trim() || '';
const tag = (html, name) => first(html, new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
const hasMeta = (html, key, value) => [...html.matchAll(/<meta\b[^>]*>/gi)].some(m => new RegExp(`(?:name|property)=["']${key}["']`, 'i').test(m[0]) && (!value || new RegExp(`content=["'][^"']*${value}`, 'i').test(m[0])));
const hasLink = (html, rel) => [...html.matchAll(/<link\b[^>]*>/gi)].some(m => new RegExp(`rel=["']${rel}["']`, 'i').test(m[0]));
function analyze(raw, finalUrl, status) {
  const body = strip(raw);
  const title = strip(tag(raw, 'title'));
  const h1Tags = [...raw.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1 = h1Tags.map(x => strip(x[1]));
  const h2 = [...raw.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map(x => strip(x[1]));
  const scripts = [...raw.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const parsed = scripts.map(x => { try { return JSON.parse(x[1]); } catch { return null; } });
  const structured = parsed.filter(Boolean).length;
  const headings = [...h1, ...h2].filter(Boolean);
  const textLength = body.length;
  const facts = {
    h1Count: h1.length, title: title.slice(0, 140), h1: h1[0] || '',
    h2Count: h2.length, textCharacters: textLength, canonical: hasLink(raw, 'canonical'),
    description: hasMeta(raw, 'description'), robotsNoindex: hasMeta(raw, 'robots', 'noindex'),
    openGraph: hasMeta(raw, 'og:title') && hasMeta(raw, 'og:description'),
    jsonLdBlocks: structured, jsonLdInvalid: parsed.length - structured,
    questions: (body.match(/\?/g) || []).length,
    hasForm: /<form\b/i.test(raw), hasContact: /mailto:|tel:|whatsapp|\/contact\b/i.test(raw),
    hasPrice: /(?:€|EUR|RON|lei|preț|pret|tarif|price)/i.test(body),
    hasServices: /(?:servicii|serviciile|services|prestări|ofertă|offer)/i.test(body),
    hasAgentSignals: /agent-card|agent\.json|ai\.json|application\/json|api\//i.test(raw),
  };
  const perspectives = [
    { id: 'om', label: 'OM', checks: [
      ['Titlu principal identificabil', h1.length === 1, 'H1 detectate: ' + h1.length],
      ['Conținut explicativ suficient pentru prima lectură', textLength >= 450, `${textLength} caractere text extrase`],
      ['Punct de contact sau formular identificabil', facts.hasContact || facts.hasForm, 'Detectare din HTML; nu este un test de funcționare'],
      ['Informații comerciale despre servicii', facts.hasServices, 'Indicator lexical orientativ']
    ] },
    { id: 'google', label: 'GOOGLE', checks: [
      ['Titlu HTML prezent', !!title, title || 'Lipsă'],
      ['Un singur H1', h1.length === 1, `Detectate: ${h1.length}`],
      ['Canonical declarat', facts.canonical, 'Prezență, fără confirmarea indexării'],
      ['Meta description declarată', facts.description, 'Prezență în sursa HTML'],
      ['Date structurate JSON-LD parsabile', structured > 0 && facts.jsonLdInvalid === 0, `${structured} blocuri valide`]
    ] },
    { id: 'ai', label: 'AI', checks: [
      ['Text accesibil prin HTML', textLength >= 300, `${textLength} caractere text`],
      ['Întrebare sau titluri explicite', headings.length >= 2 || facts.questions >= 2, `${headings.length} titluri H1/H2`],
      ['Date structurate disponibile', structured > 0, `${structured} blocuri JSON-LD`],
      ['Identitate și servicii descrise', facts.hasServices, 'Test lexical, nu răspuns ChatGPT']
    ] },
    { id: 'a2a', label: 'A2A', checks: [
      ['Formular sau interfață de contact', facts.hasForm || facts.hasContact, 'Nu implică execuție automată'],
      ['Semnale sau legături către capabilități pentru agenți', facts.hasAgentSignals, 'Indiciu, nu interoperabilitate demonstrată'],
      ['Condiții comerciale detectabile', facts.hasPrice, 'Indicator lexical orientativ']
    ] }
  ].map(p => ({ ...p, passed: p.checks.filter(x => x[1]).length, total: p.checks.length, checks: p.checks.map(([name,ok,evidence]) => ({ name, status: ok ? 'detectat' : 'neverificat', evidence })) }));
  return { url: finalUrl, status, title, h1: h1[0] || '', facts, perspectives };
}
function internalLinks(raw, base) {
  const origin = new URL(base).origin; const out = [];
  for (const m of raw.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["']/gi)) {
    const u = safeUrl(m[1], base);
    if (!u || u.origin !== origin || !/^https?:/.test(u.href) || /\.(?:pdf|jpg|png|webp|svg|zip|xml|json)$/i.test(u.pathname)) continue;
    u.search = '';
    if (!out.includes(u.href)) out.push(u.href);
    if (out.length >= 35) break;
  }
  return out;
}
export async function onRequestPost({ request }) {
  let data;
  try { data = await request.json(); } catch { return json({ error: 'Cerere JSON invalidă' }, 400); }
  const initial = safeUrl(String(data?.url || '').trim());
  if (!initial) return json({ error: 'Introdu un URL public HTTP(S) valid, fără IP privat sau port personalizat.' }, 400);
  const start = Date.now();
  const queue = [initial.href], visited = new Set(), pages = [], errors = [];
  while (queue.length && pages.length < MAX_PAGES && visited.size < MAX_PAGES + 3) {
    const url = queue.shift(); if (visited.has(url)) continue; visited.add(url);
    try {
      const result = await fetchPage(safeUrl(url));
      if (new URL(result.finalUrl).hostname !== initial.hostname) throw new Error('Domeniul final diferă');
      pages.push(analyze(result.html, result.finalUrl, result.status));
      if (pages.length === 1) queue.push(...internalLinks(result.html, result.finalUrl).filter(x => !visited.has(x)));
    } catch (error) { errors.push({ url, reason: String(error.message || error).slice(0, 160) }); }
  }
  return json({ product: '3WEBOBS Web X-Ray', version: 'MVP 0.1', target: initial.origin, scannedAt: new Date().toISOString(), durationMs: Date.now()-start, maxPages: MAX_PAGES, pages, errors, limitations: ['Analiză publică, fără acces la Google Search Console', 'AI: evaluare a semnalelor accesibile, nu test real de răspuns ChatGPT', 'A2A: semnale detectate, fără execuție de acțiuni și fără tranzacții', 'Rezultatele sunt indicii tehnice, nu poziții garantate în Google sau AI'] });
}
export function onRequestGet() { return json({ error: 'Folosește POST cu JSON {url}.' }, 405); }
