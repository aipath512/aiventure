// AiVenture Seller Agent — A2A (JSON-RPC 2.0)
// v4.0 · 2026-11-24
// Răspunde agenților AI ai cumpărătorilor cu oferta publică AiVenture (aceeași ca pe homepage v3.49 și în ai.json).
// Regula: agentul NU inventează oferte, NU semnează, NU încasează. Cererile (method "request") ajung în tabela D1 `lead`
// (tip = "a2a-request") și se văd în /api/leads, ca orice alt lead; oferta finală o validează echipa.

const OFFER = {
  seller: "AiVenture S.R.L. (CUI 51415878, București, România)",
  currency: "EUR",
  vat: "excluded",
  updated: "2026-11-24",
  products: [
    { id: "verificare", name: "Verificare vizibilitate AI", price: { once: 0 },
      includes: ["Cum apare firma în Google și în răspunsurile AI", "Întrebările clienților la care site-ul nu răspunde", "Acțiunile recomandate, în ordinea importanței"],
      terms: "Gratuit, un test pentru fiecare CUI. Rezultat pe e-mail, de regulă în 24 de ore lucrătoare." },
    { id: "firmsfinder", name: "FirmsFinder", price: { monthly: 3.99, annual: 39.99 },
      includes: ["Căutare gratuită în ~1,3 milioane de firme active din România (ONRC, 2 septembrie 2026)", "Export 1.000 de firme pe lună", "Căutări salvate", "Monitorizare săptămânală"],
      terms: "Asemănarea economică nu înseamnă intenție de cumpărare.", url: "https://firmsfinder.eu/" },
    { id: "start", name: "START — Site + Asistent AI", price: { monthly: 10, annual: 96 },
      includes: ["Site gata făcut, văzut înainte de plată", "Asistent AI cu răspunsuri validate de firmă", "Găzduire și SSL", "Domeniu propriu, înregistrat pe numele firmei, la plata anuală"],
      terms: "Tarif de lansare. Prima săptămână gratuită; după 7 zile se emite factura, abonamentul continuă doar dacă este plătit. Activarea se confirmă printr-un link de confirmare." },
    { id: "business", name: "BUSINESS", price: { quote: "la ofertă" },
      includes: ["WhatsApp și e-mail", "Preluarea apelurilor telefonice", "Memorie comercială pe toate canalele", "Monitorizare AI", "Configurare asistată"],
      terms: "Prețul depinde de integrările alese. Oferta este validată de echipa AiVenture." }
  ],
  not_guaranteed: ["poziția 1 în Google", "citarea sau recomandarea de către un model AI", "conformitatea juridică", "răspunsuri AI fără erori"],
  human_contact: { email: "contact@5thelement.ai", whatsapp: "+40737123540", web: "https://aiventure.ro/" }
};

const LIMITS = {
  agent: "AiVenture Seller Agent",
  version: "4.0",
  can: ["prezintă oferta publică", "dă prețurile publice", "preia o cerere pentru echipa AiVenture"],
  cannot: ["inventa oferte sau prețuri", "negocia", "semna contracte", "încasa plăți", "garanta poziții în Google sau citări AI"],
  human_approval: "Orice ofertă BUSINESS și orice activare sunt aprobate de om.",
  rules: ["No rule -> no autonomy", "Capability != permission", "The edge must never invent the offer during a transaction"]
};

const H = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" };
const ok = (id, result) => new Response(JSON.stringify({ jsonrpc: "2.0", id, result }, null, 2), { headers: H });
const err = (id, code, message, status = 200) =>
  new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }, null, 2), { status, headers: H });
const clean = (v, max = 300) => String(v == null ? "" : v).trim().slice(0, max);
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

function quote(p) {
  const id = clean(p.product, 30).toLowerCase();
  const prod = OFFER.products.find((x) => x.id === id);
  if (!prod) return { error: `Produs necunoscut. Valori posibile: ${OFFER.products.map((x) => x.id).join(", ")}.` };
  const billing = clean(p.billing, 10).toLowerCase() === "annual" ? "annual" : "monthly";
  let price = null;
  if (prod.price.once !== undefined) price = { amount: 0, period: "o singură dată" };
  else if (prod.price.quote) price = { amount: null, period: "la ofertă", requires_human_approval: true };
  else price = { amount: prod.price[billing], period: billing === "annual" ? "an" : "lună" };
  return { product: prod.id, name: prod.name, currency: "EUR", vat: "excluded", price, terms: prod.terms,
           binding: false, note: "Preț public informativ. Nu este o ofertă semnată." };
}

async function request(p, req, env) {
  const product = clean(p.product, 30).toLowerCase();
  if (!OFFER.products.some((x) => x.id === product))
    return { error: `Câmpul "product" lipsește sau e greșit. Valori: ${OFFER.products.map((x) => x.id).join(", ")}.` };
  const email = clean(p.email, 200), phone = clean(p.phone, 40);
  const website = clean(p.website || p.cui, 200);
  if (!website) return { error: 'Lipsește "website" sau "cui".' };
  if (!validEmail(email) && phone.replace(/\D/g, "").length < 9) return { error: 'Lipsește un "email" valid sau un "phone".' };
  const mesaj = [`A2A request · produs: ${product}`, `agent cumpărător: ${clean(p.buyer_agent, 100) || "nespecificat"}`,
                 phone ? `telefon: ${phone}` : "", clean(p.message, 1500)].filter(Boolean).join(" · ");
  if (!env.DB) return { error: "Cererea nu a putut fi înregistrată. Contact direct: contact@5thelement.ai / WhatsApp +40737123540." };
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS lead (id INTEGER PRIMARY KEY, website TEXT, email TEXT, tip TEXT,
      obiectiv TEXT, mesaj TEXT, ua TEXT, country TEXT, ts TEXT NOT NULL DEFAULT (datetime('now')))`).run();
    const r = await env.DB.prepare(`INSERT INTO lead (website, email, tip, obiectiv, mesaj, ua, country, ts) VALUES (?,?,?,?,?,?,?,?)`)
      .bind(website, email, "a2a-request", product, mesaj, clean(req.headers.get("user-agent"), 300),
            req.headers.get("cf-ipcountry") || "", new Date().toISOString()).run();
    return { status: "RECEIVED", request_id: r?.meta?.last_row_id ?? null, product,
             next_step: "Echipa AiVenture revine pe e-mail sau telefon. Nicio obligație nu a fost creată.",
             human_approval_required: true };
  } catch (_) {
    return { error: "Cererea nu a putut fi înregistrată. Contact direct: contact@5thelement.ai / WhatsApp +40737123540." };
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { ...H, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}

export async function onRequestGet() {
  return new Response(JSON.stringify({ name: "AiVenture Seller Agent", protocol: "A2A / JSON-RPC 2.0", version: "4.0",
    status: "ACTIVE", endpoint: "https://aiventure.ro/api/a2a", agent_card: "https://aiventure.ro/.well-known/agent-card.json",
    methods: ["discover", "quote", "request", "status", "message/send"], offer: OFFER }, null, 2), { headers: H });
}

export async function onRequestPost({ request: req, env }) {
  let body;
  try { body = await req.json(); } catch (_) { return err(null, -32700, "JSON invalid.", 400); }
  const id = body.id ?? null;
  const method = clean(body.method, 40);
  const p = body.params || {};

  if (method === "discover" || method === "capabilities") return ok(id, OFFER);
  if (method === "status") return ok(id, LIMITS);
  if (method === "quote") { const r = quote(p); return r.error ? err(id, -32602, r.error) : ok(id, r); }
  if (method === "request") { const r = await request(p, req, env); return r.error ? err(id, -32602, r.error) : ok(id, r); }
  if (method === "message/send") {
    // A2A standard: răspundem cu oferta, ca text + date structurate.
    const text = "AiVenture S.R.L. (România): Verificare vizibilitate AI gratuită; FirmsFinder 3,99 €/lună; START Site + Asistent AI 10 €/lună sau 96 €/an; BUSINESS la ofertă. Prețuri fără TVA. Pentru o cerere, folosiți metoda \"request\".";
    return ok(id, { kind: "message", role: "agent", messageId: crypto.randomUUID(),
      parts: [{ kind: "text", text }, { kind: "data", data: OFFER }] });
  }
  return err(id, -32601, "Metodă necunoscută. Metode: discover, quote, request, status, message/send.");
}
