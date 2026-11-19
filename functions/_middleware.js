// AiVenture — middleware pe TOATE paginile aiventure.ro
// v1.3 · 2026-11-19
//
// v1.3: pe fiecare articol /blog/<slug>/ (cele vechi și cele noi, fără să atingem fișierele) se adaugă automat:
//   1. AUTORUL „AiVenture Team” cu firma legală completă (CUI, TVA, ONRC, EUID, sediu, fondator, contact) și
//      linkuri: pagina autorului, LinkedIn „AiVenture Digital” (firma), LinkedIn Dan Ionescu (fondator), Crunchbase, ORCID;
//   2. DISTRIBUIRE: „Copiază linkul articolului”, „Copiază linkul autorului”, LinkedIn, WhatsApp;
//   3. PASUL URMĂTOR (funnel): Audit GEO (/geo/) + WhatsApp + 3 articole înrudite (linkuri interne, generate pe server).
//   Pe /autor/aiventure-team/ lista articolelor se generează pe server din /blog/articles.json (mereu la zi).
//   Datele firmei vin din masterul unic aipath512/aiventure-identity; dacă nu răspunde, se folosește copia de rezervă de mai jos.
// v1.2: butonul de apel (telefon) eliminat — rămâne doar WhatsApp.
// v1.1: butoane rotunde mici (iconițe), stau în marginea din stânga și nu mai acoperă textul.
// Butonul WhatsApp se adaugă automat la fiecare pagină HTML, inclusiv paginile noi; restul fișierelor trec neatinse.

const SITE = "https://aiventure.ro";
const AUTHOR_NAME = "AiVenture Team";
const AUTHOR_PATH = "/autor/aiventure-team/";
const ORG_ID = "https://5thelement.ai/#organization";
const TEAM_ID = "https://5thelement.ai/#team";
const IDENTITY_URL = "https://raw.githubusercontent.com/aipath512/aiventure-identity/main/identitate/aiventure-identity.json";

// Copie de rezervă a masterului aiventure-identity v1.11 (2026-11-19) — folosită DOAR dacă masterul nu răspunde.
const IDENTITY_FALLBACK = {
  _meta: { versiune: "1.11 (copie de rezervă)" },
  firma: {
    denumire_legala: "AiVenture S.R.L.", brand_operare: "5thelement.ai",
    cui: "51415878", cod_tva: "RO51415878", euid: "ROONRC.J2025016406000", nr_registrul_comertului: "J2025016406000",
    data_infiintare: "2025-03-07", caen_principal: "6210",
    sediu: { strada: "Drumul Pădurea Pustnicul nr. 141C, Corp A, Etaj 2, Ap. 5", localitate: "București", sector: "Sector 1", cod_postal: "014044", tara: "RO" },
    fondator: { nume: "Dan Ionescu", orcid: "https://orcid.org/0009-0002-5498-1046", linkedin: "https://ro.linkedin.com/in/dan-ionesco-a856082a0" }
  },
  contact: { email: "contact@5thelement.ai", whatsapp: "https://api.whatsapp.com/send/?phone=40737123540" },
  profiluri: {
    linkedin_firma: "https://www.linkedin.com/company/107338970", linkedin_firma_nume: "AiVenture Digital",
    linkedin_personal: "https://ro.linkedin.com/in/dan-ionesco-a856082a0", linkedin_personal_nume: "Dan Ionescu",
    crunchbase: "https://www.crunchbase.com/organization/aiventure-s-r-l", x: "https://x.com/aipath512",
    youtube: "https://www.youtube.com/@AIVenture-q8u", medium: "https://medium.com/@aipath512"
  }
};

const WIDGET = `
<style>
#aiv-contact-float{position:fixed;left:16px;bottom:18px;z-index:9997;display:flex;flex-direction:column;gap:10px}
#aiv-contact-float a{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.5);transition:transform .15s}
#aiv-contact-float a:hover{transform:scale(1.08)}
#aiv-contact-float .aiv-wa{background:#25d366}
#aiv-contact-float svg{width:26px;height:26px}
@media (max-width:600px){#aiv-contact-float{left:10px;bottom:12px;gap:8px}#aiv-contact-float a{width:46px;height:46px}#aiv-contact-float svg{width:23px;height:23px}}
@media print{#aiv-contact-float{display:none}}
</style>
<div id="aiv-contact-float" aria-label="Contact AiVenture">
  <a class="aiv-wa" href="https://wa.me/40737123540" target="_blank" rel="noopener" aria-label="WhatsApp +40 737 123 540" title="WhatsApp +40 737 123 540">
    <svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.03c-.25.69-1.45 1.32-2 1.4-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.62-2.98-1.29-4.92-4.29-5.07-4.49-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.6-.37.8-.37h.57c.18 0 .43-.07.67.51.25.6.84 2.06.92 2.21.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.61.17.3.77 1.27 1.65 2.06 1.14 1.01 2.1 1.33 2.4 1.48.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.5.22.57.35.08.12.08.72-.17 1.41z"/></svg>
  </a>
</div>`;

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function loadIdentity() {
  try {
    const r = await fetch(IDENTITY_URL, { cf: { cacheTtl: 600, cacheEverything: true } });
    if (r.ok) { const j = await r.json(); if (j && j.firma && j.firma.cui) return j; }
  } catch (_) { /* rezerva */ }
  return IDENTITY_FALLBACK;
}

async function loadArticles(context) {
  try {
    const u = new URL("/blog/articles.json", context.request.url);
    const r = context.env && context.env.ASSETS ? await context.env.ASSETS.fetch(u) : await fetch(u);
    if (!r.ok) return [];
    const d = await r.json();
    return (d.articles || []).filter((a) => a.status === "published" && a.slug);
  } catch (_) { return []; }
}

const newest = (a, b) => ((b.published_at || b.published || "") + b.id).localeCompare((a.published_at || a.published || "") + a.id);
const fmtDate = (a) => (a.published || "").split("-").reverse().join(".");
const words = (s) => new Set(String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).filter((w) => w.length > 3));

function related(all, slug, n = 3) {
  const cur = all.find((a) => a.slug === slug);
  const others = all.filter((a) => a.slug !== slug);
  if (!cur) return others.sort(newest).slice(0, n);
  const ref = words(`${cur.category} ${cur.title} ${(cur.keywords || []).join(" ")}`);
  const score = (a) => { let s = 0; for (const w of words(`${a.category} ${a.title} ${(a.keywords || []).join(" ")}`)) if (ref.has(w)) s++; return s; };
  return others.map((a) => ({ a, s: score(a) })).sort((x, y) => y.s - x.s || newest(x.a, y.a)).slice(0, n).map((x) => x.a);
}

const lnk = (u, t) => `<a href="${esc(u)}" rel="noopener">${esc(t)}</a>`;
function phoneOf(I) { const m = /phone=(\d+)/.exec((I.contact && I.contact.whatsapp) || ""); return m ? m[1] : "40737123540"; }

function legalList(I) {
  const f = I.firma || {}, s = f.sediu || {}, c = I.contact || {}, p = I.profiluri || {};
  const li = (k, v) => (v ? `<li><strong>${esc(k)}:</strong> ${v}</li>` : "");
  const ph = phoneOf(I);
  return `<ul>`
    + li("Denumire legală", esc(f.denumire_legala))
    + li("CUI", `${esc(f.cui)} · <strong>Cod TVA:</strong> ${esc(f.cod_tva)}`)
    + li("Nr. Registrul Comerțului", `${esc(f.nr_registrul_comertului)} · <strong>EUID:</strong> ${esc(f.euid)}`)
    + li("Înființată", `${esc((f.data_infiintare || "").split("-").reverse().join("."))} · <strong>CAEN principal:</strong> ${esc(f.caen_principal)}`)
    + li("Sediu social", esc([s.strada, s.sector, s.localitate, s.cod_postal, "România"].filter(Boolean).join(", ")))
    + li("Fondator", f.fondator ? `${esc(f.fondator.nume)}${f.fondator.orcid ? " · ORCID " + lnk(f.fondator.orcid, f.fondator.orcid.replace(/^.*orcid\.org\//, "")) : ""}` : "")
    + li("Contact", `${lnk("mailto:" + c.email, c.email)} · WhatsApp ${lnk("https://wa.me/" + ph, ph)}`)
    + li("LinkedIn", [p.linkedin_firma && lnk(p.linkedin_firma, (p.linkedin_firma_nume || "AiVenture Digital") + " (firma)"), p.linkedin_personal && lnk(p.linkedin_personal, (p.linkedin_personal_nume || "Dan Ionescu") + " (fondator)")].filter(Boolean).join(" · "))
    + li("Alte profiluri", [p.crunchbase && lnk(p.crunchbase, "Crunchbase"), p.youtube && lnk(p.youtube, "YouTube"), p.x && lnk(p.x, "X"), p.medium && lnk(p.medium, "Medium")].filter(Boolean).join(" · "))
    + li("Site-uri", `${lnk("https://5thelement.ai/", "5thelement.ai")} · ${lnk(SITE + "/", "aiventure.ro")}`)
    + `</ul>`;
}

const CSS = `<style>
.aiv-box{margin-top:46px;padding:18px 18px 14px;border:1px solid #292d36;border-radius:12px;background:#0d1016;font-size:15px;line-height:1.6;color:#e9e9ec}
.aiv-box h2{margin:0 0 10px;font-size:20px;line-height:1.25}.aiv-box ul{margin:8px 0;padding-left:18px}.aiv-box li{margin:3px 0}
.aiv-box a{color:#e7c86e}.aiv-row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 4px}
.aiv-btn{display:inline-block;padding:9px 14px;border-radius:9px;border:1px solid #e7c86e;background:transparent;color:#e7c86e;font:600 14px system-ui,sans-serif;cursor:pointer;text-decoration:none}
.aiv-btn.p{background:#e7c86e;color:#090b10!important}.aiv-btn:hover{filter:brightness(1.1)}
.aiv-rel{list-style:none;padding:0!important}.aiv-rel li{border-top:1px solid #292d36;padding:8px 0}.aiv-rel small{color:#9298a4}
.aiv-ok{font-size:13px;color:#8fd19e;min-height:18px}
</style>`;

function articleBlocks(I, all, slug, pageUrl) {
  const authorUrl = SITE + AUTHOR_PATH;
  const rel = related(all, slug);
  const ph = phoneOf(I);
  const cur = all.find((a) => a.slug === slug);
  const title = cur ? cur.title : "";
  const author = `<section class="aiv-box" id="autor" aria-label="Despre autor"><h2>Despre autor: ${lnk(AUTHOR_PATH, AUTHOR_NAME)}</h2>
<p>Articol scris de <strong>${esc(AUTHOR_NAME)}</strong>, echipa ${esc((I.firma || {}).denumire_legala)} (${esc((I.firma || {}).brand_operare || "5thelement.ai")}). Toate articolele și datele firmei: ${lnk(AUTHOR_PATH, "pagina autorului")}.</p>
${legalList(I)}</section>`;
  const share = `<section class="aiv-box" aria-label="Distribuiți"><h2>Distribuiți</h2>
<div class="aiv-row">
<button class="aiv-btn" type="button" data-copy="${esc(pageUrl)}">📋 Copiază linkul articolului</button>
<button class="aiv-btn" type="button" data-copy="${esc(authorUrl)}">📋 Copiază linkul autorului</button>
<a class="aiv-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}" target="_blank" rel="noopener">LinkedIn</a>
<a class="aiv-btn" href="https://wa.me/?text=${encodeURIComponent((title ? title + " — " : "") + pageUrl)}" target="_blank" rel="noopener">WhatsApp</a>
</div><div class="aiv-ok" aria-live="polite"></div>
<p style="font-size:13px;color:#9298a4;margin:4px 0 0">Articol: ${esc(pageUrl)}<br>Autor: ${esc(authorUrl)}</p></section>`;
  const funnel = `<section class="aiv-box" aria-label="Pasul următor"><h2>Pasul următor: vă găsește AI-ul firma?</h2>
<p>Verificați cum apare firma dumneavoastră în Google și în răspunsurile AI (ChatGPT, Gemini, Perplexity, AI Overviews): ce intenții ale clienților acoperă site-ul și ce lipsește.</p>
<div class="aiv-row"><a class="aiv-btn p" href="/geo/?utm_source=blog&amp;utm_medium=articol&amp;utm_campaign=${encodeURIComponent(slug)}">Audit GEO →</a>
<a class="aiv-btn" href="https://wa.me/${ph}?text=${encodeURIComponent("Bună ziua, am citit articolul " + (title || pageUrl) + " și vreau să aflu dacă AI-ul îmi găsește firma.")}" target="_blank" rel="noopener">Întrebați-ne pe WhatsApp</a></div>
${rel.length ? `<h2 style="margin-top:18px;font-size:17px">Citiți și</h2><ul class="aiv-rel">${rel.map((a) => `<li>${lnk(`/blog/${a.slug}/`, a.title)}<br><small>${esc([a.id, a.category, fmtDate(a)].filter(Boolean).join(" · "))}</small></li>`).join("")}</ul>` : ""}
<p style="margin:8px 0 0">${lnk("/blog/", "← Toate articolele")}</p></section>`;
  const script = `<script>(function(){document.querySelectorAll('[data-copy]').forEach(function(b){b.addEventListener('click',function(){var u=b.getAttribute('data-copy'),o=b.closest('section').querySelector('.aiv-ok');function ok(){if(o)o.textContent='✓ Copiat: '+u;}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(ok,function(){prompt('Copiați linkul:',u);});}else{prompt('Copiați linkul:',u);}});});})();</script>`;
  return CSS + author + share + funnel + script;
}

function headExtras(I) {
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": TEAM_ID, name: AUTHOR_NAME, url: SITE + AUTHOR_PATH, parentOrganization: { "@id": ORG_ID } },
    { "@type": "Organization", "@id": ORG_ID, name: (I.firma || {}).denumire_legala, legalName: (I.firma || {}).denumire_legala, taxID: (I.firma || {}).cui, vatID: (I.firma || {}).cod_tva,
      sameAs: [(I.profiluri || {}).linkedin_firma, (I.profiluri || {}).crunchbase, "https://5thelement.ai/", SITE + "/"].filter(Boolean) }
  ] };
  return `<link rel="author" href="${AUTHOR_PATH}"><script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
}

function authorList(all) {
  const list = all.slice().sort(newest);
  return list.map((a) => `<li><a href="/blog/${esc(a.slug)}/"><span class="t">${esc(a.title)}</span><span class="m">${esc([a.id, a.category, fmtDate(a)].filter(Boolean).join(" · "))}</span></a></li>`).join("")
    + `<li class="cnt">${list.length} articole</li>`;
}

export async function onRequest(context) {
  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  const url = new URL(context.request.url);
  const path = url.pathname;
  const m = /^\/blog\/([a-z0-9-]+)\/$/.exec(path);
  let rw = new HTMLRewriter().on("body", { element(el) { el.append(WIDGET, { html: true }); } });

  try {
    if (m) {
      const [I, all] = await Promise.all([loadIdentity(), loadArticles(context)]);
      const pageUrl = `${SITE}/blog/${m[1]}/`;
      const blocks = articleBlocks(I, all, m[1], pageUrl);
      rw = rw.on("head", { element(el) { el.append(headExtras(I), { html: true }); } })
        .on("main", { element(el) { el.append(blocks, { html: true }); } });
    } else if (path === AUTHOR_PATH) {
      const [I, all] = await Promise.all([loadIdentity(), loadArticles(context)]);
      rw = rw.on("#art-list", { element(el) { el.setInnerContent(authorList(all), { html: true }); } })
        .on("#legal", { element(el) { el.setInnerContent(legalList(I), { html: true }); } });
    }
  } catch (_) { /* dacă ceva eșuează, pagina rămâne cu butonul WhatsApp */ }

  return rw.transform(response);
}
