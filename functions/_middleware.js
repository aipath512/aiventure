// AiVenture — middleware pe TOATE paginile aiventure.ro
// v1.4.1 · 2026-11-19
//
// v1.4.1: sub autor, vizibil pe fiecare articol: „Publicat de AiVenture S.R.L. — firmă din București, România · CUI 51415878 · contact@5thelement.ai”;
//         schema: Organization cu CUI/EUID/ONRC + contactPoint, Person cu workLocation București.
// v1.4: AUTOR = Dan Ionescu (persoană, ORCID), PUBLICAT DE AiVenture S.R.L. (decizie 19.11.2026, varianta C).
//   Pe fiecare articol /blog/<slug>/ (vechi și noi, inclusiv cele publicate din Telegram), fără să atingem fișierele:
//   - antetul și meniul site-ului + căutare în blog (/blog/?q=…) + footer-ul site-ului;
//   - breadcrumb vizibil (Acasă › Blog › titlu) + linie „de Dan Ionescu · publicat de AiVenture S.R.L.” + cuprins din H2;
//   - familia completă de meta tag-uri (robots, author, Open Graph complet cu imagine, Twitter, locale, hreflang, article:*),
//     doar cele care lipsesc din fișier;
//   - schema.org într-un singur @graph: WebSite, Organization (publisher), Person (autor), WebPage, BlogPosting,
//     BreadcrumbList și FAQPage (din subtitlurile-întrebare H2 care se termină cu „?” + primul lor paragraf, deja vizibile);
//     JSON-LD-ul vechi din fișier e înlocuit, ca să nu existe doi autori diferiți;
//   - stil de bază pentru articolele vechi care nu aveau deloc stil.
//   /autor/aiventure-team/ -> 301 către /autor/dan-ionescu/ (_redirects); lista articolelor de pe pagina autorului e generată aici.
// v1.3: autor + firma legală + distribuire + funnel (Audit GEO, WhatsApp, 3 articole înrudite) pe toate articolele.
// v1.2: butonul de apel (telefon) eliminat — rămâne doar WhatsApp.
// v1.1: butoane rotunde mici (iconițe), stau în marginea din stânga și nu mai acoperă textul.
// Butonul WhatsApp se adaugă automat la fiecare pagină HTML, inclusiv paginile noi; restul fișierelor trec neatinse.

const SITE = "https://aiventure.ro";
const AUTHOR_NAME = "Dan Ionescu";
const AUTHOR_PATH = "/autor/dan-ionescu/";
const PERSON_ID = SITE + AUTHOR_PATH + "#person";
const ORG_ID = "https://5thelement.ai/#organization";
const WEBSITE_ID = SITE + "/#website";
const BLOG_ID = SITE + "/blog/#blog";
const OG_IMAGE = SITE + "/assets/og/aiventure-a2a-1200x630.png";
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

const SITE_CSS = `<style>
.aiv-hdr{border-bottom:1px solid #292d36;background:#090b10}.aiv-hdr .w{max-width:1100px;margin:auto;padding:12px 18px;display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px}
.aiv-hdr .brand{font:700 18px system-ui,sans-serif;color:#f5f5f5;text-decoration:none}.aiv-hdr .brand span{color:#9298a4;font-weight:400;font-size:13px}
.aiv-hdr nav{display:flex;flex-wrap:wrap;gap:4px 14px}.aiv-hdr nav a{color:#c9ccd3;font-size:14px;text-decoration:none}.aiv-hdr nav a:hover{color:#e7c86e}
.aiv-hdr form{margin-left:auto;display:flex}.aiv-hdr input{width:210px;max-width:52vw;padding:7px 10px;border-radius:8px;border:1px solid #292d36;background:#0d1016;color:#f5f5f5;font-size:14px}
.aiv-bc{font-size:13px;color:#9298a4}.aiv-bc a{color:#9298a4}.aiv-bc span[aria-current]{color:#c9ccd3}
.aiv-by{font-size:14px;color:#b8bcc6;margin:6px 0 0}.aiv-by a{color:#e7c86e}
.aiv-pub{font-size:14px;color:#b8bcc6;margin:4px 0 0;padding:8px 12px;border-left:3px solid #e7c86e;background:#0d1016;border-radius:0 8px 8px 0}.aiv-pub a{color:#e7c86e}
.aiv-toc{margin:22px 0;padding:12px 16px;border:1px solid #292d36;border-radius:10px;background:#0d1016;font-size:15px}.aiv-toc strong{display:block;margin-bottom:4px}.aiv-toc ol{margin:0;padding-left:20px}.aiv-toc a{color:#e7c86e}
.aiv-ftr{border-top:1px solid #292d36;margin-top:40px;padding:22px 18px;font-size:13px;color:#9298a4;text-align:center}.aiv-ftr a{color:#9298a4;margin:0 6px}
</style>`;
const BASE_CSS = `<style>*{box-sizing:border-box}body{margin:0;background:#090b10;color:#f5f5f5;font:17px/1.7 system-ui,-apple-system,Segoe UI,sans-serif}main{max-width:820px;margin:auto;padding:26px 18px 80px}a{color:#e7c86e;text-decoration:none}h1{font-size:clamp(32px,6vw,52px);line-height:1.08;margin:20px 0 12px}h2{margin-top:40px;line-height:1.2}</style>`;

const NAV = [["/", "Acasă"], ["/produse/", "Produse"], ["/servicii/", "Servicii"], ["/geo/", "GEO"], ["/blog/", "Blog"], ["/contact/", "Contact"]];
const header = () => `<header class="aiv-hdr"><div class="w"><a class="brand" href="/">AiVenture <span>· A2A Business Infrastructure</span></a><nav aria-label="Navigare principală">${NAV.map(([u, t]) => `<a href="${u}">${t}</a>`).join("")}</nav><form action="/blog/" method="get" role="search"><input type="search" name="q" placeholder="🔎 Căutați în blog…" aria-label="Căutați în blog"></form></div></header>`;
const footer = (I) => `<footer class="aiv-ftr">${esc((I.firma || {}).denumire_legala || "AiVenture S.R.L.")} · CUI ${esc((I.firma || {}).cui || "51415878")} · <a href="mailto:contact@5thelement.ai">contact@5thelement.ai</a> · <a href="https://wa.me/40737123540" rel="noopener">WhatsApp</a><br><a href="/produse/">Produse</a><a href="/servicii/">Servicii</a><a href="/blog/">Blog</a><a href="${AUTHOR_PATH}">Autor</a><a href="/contact/">Contact</a><a href="/legal/">Informații legale</a></footer>`;

const strip = (h) => String(h || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
const iso = (d) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : d || undefined);

// Analizează HTML-ul articolului: titlu, subtitluri, FAQ, număr de cuvinte, ce meta există deja.
function analyze(html) {
  const art = (/<article[\s>][\s\S]*?<\/article>/i.exec(html) || /<main[\s>][\s\S]*?<\/main>/i.exec(html) || [html])[0];
  const h1 = strip((/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(art) || [])[1]);
  const h2s = [...art.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => strip(m[1]));
  const faq = [];
  for (const m of art.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>\s*((?:<(?:p|ul|ol|div class="tw")[\s\S]*?<\/(?:p|ul|ol|div)>\s*){1,2})/gi)) {
    const q = strip(m[1]).replace(/^\d+[.)]\s*/, "");
    const ans = strip(m[2]);
    if (q.endsWith("?") && ans.length >= 30) faq.push({ q, a: ans.length > 900 ? ans.slice(0, 897).replace(/\s+\S*$/, "") + "…" : ans });
  }
  const desc = (/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i.exec(html) || [])[1] || "";
  return { h1, h2s, faq, desc: strip(desc), words: strip(art).split(" ").filter(Boolean).length, has: (re) => re.test(html), hasStyle: /<style/i.test(html) };
}

function metaFamily(A, cur, url, title) {
  const out = [];
  const add = (re, tag) => { if (!A.has(re)) out.push(tag); };
  const d = esc(A.desc || title);
  add(/name=["']robots["']/i, `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`);
  add(/name=["']author["']/i, `<meta name="author" content="${AUTHOR_NAME}">`);
  add(/rel=["']canonical["']/i, `<link rel="canonical" href="${url}">`);
  add(/hreflang=/i, `<link rel="alternate" hreflang="ro" href="${url}">`);
  add(/og:type/i, `<meta property="og:type" content="article">`);
  add(/og:site_name/i, `<meta property="og:site_name" content="AiVenture">`);
  add(/og:locale/i, `<meta property="og:locale" content="ro_RO">`);
  add(/og:title/i, `<meta property="og:title" content="${esc(title)}">`);
  add(/og:description/i, `<meta property="og:description" content="${d}">`);
  add(/og:url/i, `<meta property="og:url" content="${url}">`);
  add(/og:image/i, `<meta property="og:image" content="${OG_IMAGE}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="AiVenture — Web-Om, Web-AI și Web-A2A">`);
  add(/article:published_time/i, cur && (cur.published_at || cur.published) ? `<meta property="article:published_time" content="${esc(cur.published_at || cur.published)}">` : "");
  add(/article:modified_time/i, cur && cur.updated_at ? `<meta property="article:modified_time" content="${esc(cur.updated_at)}">` : "");
  add(/article:author/i, `<meta property="article:author" content="${SITE + AUTHOR_PATH}">`);
  add(/article:section/i, cur && cur.category ? `<meta property="article:section" content="${esc(cur.category)}">` : "");
  add(/twitter:card/i, `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@aipath512"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${d}"><meta name="twitter:image" content="${OG_IMAGE}">`);
  out.push(`<link rel="author" href="${AUTHOR_PATH}">`);
  return out.filter(Boolean).join("");
}

function personNode(I) {
  const f = I.firma || {}, p = I.profiluri || {}, fo = f.fondator || {};
  return { "@type": "Person", "@id": PERSON_ID, name: AUTHOR_NAME, alternateName: "Dan Ionesco", url: SITE + AUTHOR_PATH,
    jobTitle: "Fondator AiVenture S.R.L. · Arhitect de sisteme informatice",
    identifier: { "@type": "PropertyValue", propertyID: "ORCID", value: "0009-0002-5498-1046" },
    worksFor: { "@id": ORG_ID }, knowsLanguage: ["ro", "fr", "en"],
    workLocation: { "@type": "Place", name: "București, România", address: { "@type": "PostalAddress", addressLocality: "București", addressCountry: "RO" } },
    sameAs: [fo.orcid || "https://orcid.org/0009-0002-5498-1046", p.linkedin_personal || "https://ro.linkedin.com/in/dan-ionesco-a856082a0"] };
}
function orgNode(I) {
  const f = I.firma || {}, p = I.profiluri || {}, s = f.sediu || {};
  return { "@type": "Organization", "@id": ORG_ID, name: f.denumire_legala || "AiVenture S.R.L.", legalName: f.denumire_legala || "AiVenture S.R.L.",
    alternateName: ["AiVenture", "5thelement.ai"], url: "https://5thelement.ai/", taxID: f.cui, areaServed: "RO",
    identifier: [{ "@type": "PropertyValue", propertyID: "CUI", value: f.cui }, { "@type": "PropertyValue", propertyID: "EUID", value: f.euid }, { "@type": "PropertyValue", propertyID: "ONRC", value: f.nr_registrul_comertului }],
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: (I.contact || {}).email || "contact@5thelement.ai", areaServed: "RO", availableLanguage: ["ro", "fr", "en"] }, vatID: f.cod_tva, email: (I.contact || {}).email,
    logo: { "@type": "ImageObject", url: SITE + "/icon-512.png", width: 512, height: 512 },
    address: { "@type": "PostalAddress", streetAddress: s.strada, addressRegion: s.sector, addressLocality: s.localitate, postalCode: s.cod_postal, addressCountry: s.tara || "RO" },
    founder: { "@id": PERSON_ID },
    sameAs: [p.linkedin_firma, p.crunchbase, p.x, p.youtube, p.medium, "https://5thelement.ai/", SITE + "/"].filter(Boolean) };
}

function articleGraph(I, A, cur, url, title) {
  const pub = cur ? iso(cur.published_at || cur.published) : undefined;
  const graph = [
    { "@type": "WebSite", "@id": WEBSITE_ID, url: SITE + "/", name: "AiVenture", inLanguage: "ro-RO", publisher: { "@id": ORG_ID },
      potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: SITE + "/blog/?q={search_term_string}" }, "query-input": "required name=search_term_string" } },
    orgNode(I), personNode(I),
    { "@type": "Blog", "@id": BLOG_ID, url: SITE + "/blog/", name: "Blog AiVenture", inLanguage: "ro-RO", publisher: { "@id": ORG_ID }, isPartOf: { "@id": WEBSITE_ID } },
    { "@type": "WebPage", "@id": url + "#webpage", url, name: title, description: A.desc || undefined, inLanguage: "ro-RO", isPartOf: { "@id": WEBSITE_ID },
      breadcrumb: { "@id": url + "#breadcrumb" }, primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE }, datePublished: pub, dateModified: cur && cur.updated_at || pub },
    { "@type": "BlogPosting", "@id": url + "#article", headline: title, description: A.desc || undefined, inLanguage: "ro-RO", url, mainEntityOfPage: { "@id": url + "#webpage" },
      isPartOf: { "@id": BLOG_ID }, author: { "@id": PERSON_ID }, publisher: { "@id": ORG_ID }, image: OG_IMAGE,
      datePublished: pub, dateModified: cur && cur.updated_at || pub, version: cur && cur.version || undefined, identifier: cur && cur.id || undefined,
      articleSection: cur && cur.category || undefined, wordCount: A.words || undefined,
      ...(cur && cur.sha256 ? { additionalProperty: { "@type": "PropertyValue", propertyID: "SHA-256", value: cur.sha256 } } : {}) },
    { "@type": "BreadcrumbList", "@id": url + "#breadcrumb", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasă", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: SITE + "/blog/" },
      { "@type": "ListItem", position: 3, name: title, item: url }] }
  ];
  if (A.faq.length >= 2) graph.push({ "@type": "FAQPage", "@id": url + "#faq", isPartOf: { "@id": url + "#webpage" },
    mainEntity: A.faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) });
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")}</script>`;
}

const fmtRo = (a) => {
  const s = a && (a.published_at || a.published) || "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.split("-").reverse().join(".");
  try { return new Date(s).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", day: "2-digit", month: "2-digit", year: "numeric" }); } catch (_) { return s; }
};

function articleBlocks(I, all, slug, pageUrl) {
  const authorUrl = SITE + AUTHOR_PATH;
  const rel = related(all, slug);
  const ph = phoneOf(I);
  const cur = all.find((a) => a.slug === slug);
  const title = cur ? cur.title : "";
  const author = `<section class="aiv-box" id="autor" aria-label="Despre autor"><h2>Despre autor: ${lnk(AUTHOR_PATH, AUTHOR_NAME)}</h2>
<p><strong>${esc(AUTHOR_NAME)}</strong> este fondatorul ${esc((I.firma || {}).denumire_legala || "AiVenture S.R.L.")} (${esc((I.firma || {}).brand_operare || "5thelement.ai")}), arhitect de sisteme informatice, cu peste 40 de ani de experiență (IBM Global Services, Cap Gemini, Société Générale, Crédit Agricole). ORCID ${lnk("https://orcid.org/0009-0002-5498-1046", "0009-0002-5498-1046")} · ${lnk(((I.profiluri || {}).linkedin_personal) || "https://ro.linkedin.com/in/dan-ionesco-a856082a0", "LinkedIn")} · ${lnk(AUTHOR_PATH, "toate articolele")}.</p>
<h2 style="font-size:17px;margin-top:16px">Publicat de</h2>
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
${rel.length ? `<h2 style="margin-top:18px;font-size:17px">Citiți și</h2><ul class="aiv-rel">${rel.map((a) => `<li>${lnk(`/blog/${a.slug}/`, a.title)}<br><small>${esc([a.id, a.category, fmtRo(a)].filter(Boolean).join(" · "))}</small></li>`).join("")}</ul>` : ""}
<p style="margin:8px 0 0">${lnk("/blog/", "← Toate articolele")}</p></section>`;
  const script = `<script>(function(){document.querySelectorAll('[data-copy]').forEach(function(b){b.addEventListener('click',function(){var u=b.getAttribute('data-copy'),o=b.closest('section').querySelector('.aiv-ok');function ok(){if(o)o.textContent='✓ Copiat: '+u;}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(ok,function(){prompt('Copiați linkul:',u);});}else{prompt('Copiați linkul:',u);}});});})();</script>`;
  return CSS + author + share + funnel + script;
}

function authorList(all) {
  const list = all.slice().sort(newest);
  return list.map((a) => `<li><a href="/blog/${esc(a.slug)}/"><span class="t">${esc(a.title)}</span><span class="m">${esc([a.id, a.version ? "v" + a.version : "", a.category, fmtRo(a)].filter(Boolean).join(" · "))}</span></a></li>`).join("")
    + `<li class="cnt">${list.length} articole</li>`;
}

export async function onRequest(context) {
  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  const url = new URL(context.request.url);
  const path = url.pathname;
  const m = /^\/blog\/([a-z0-9-]+)\/$/.exec(path);

  if (m) {
    try {
      const html = await response.text();
      const [I, all] = await Promise.all([loadIdentity(), loadArticles(context)]);
      const slug = m[1], pageUrl = `${SITE}/blog/${slug}/`;
      const cur = all.find((a) => a.slug === slug);
      const A = analyze(html);
      const title = (cur && cur.title) || A.h1 || "Articol";
      const blocks = articleBlocks(I, all, slug, pageUrl);
      const crumb = `<nav class="aiv-bc" aria-label="Fir de navigare"><a href="/">Acasă</a> › <a href="/blog/">Blog</a> › <span aria-current="page">${esc(title)}</span>${cur && cur.id ? ` · ${esc(cur.id)}` : ""}</nav>`;
      const F = I.firma || {}, S = F.sediu || {}, email = (I.contact || {}).email || "contact@5thelement.ai";
      const by = `<p class="aiv-by">de <a href="${AUTHOR_PATH}" rel="author">${AUTHOR_NAME}</a>${cur && (cur.published_at || cur.published) ? ` · <time datetime="${esc(cur.published_at || cur.published)}">${esc(fmtRo(cur))}</time>` : ""}${cur && cur.version ? ` · v${esc(cur.version)}` : ""}</p>`
        + `<p class="aiv-pub">Publicat de <strong>${esc(F.denumire_legala || "AiVenture S.R.L.")}</strong> — firmă din <strong>${esc(S.localitate || "București")}, România</strong> · <strong>CUI ${esc(F.cui || "51415878")}</strong> · <a href="mailto:${esc(email)}">${esc(email)}</a></p>`;
      const toc = A.h2s.length >= 3 ? `<nav class="aiv-toc" aria-label="Cuprins"><strong>Cuprins</strong><ol>${A.h2s.map((t, i) => `<li><a href="#s${i + 1}">${esc(t)}</a></li>`).join("")}</ol></nav>` : "";
      let n = 0, crumbDone = false, h1Done = false;
      const rw = new HTMLRewriter()
        .on('script[type="application/ld+json"]', { element(el) { el.remove(); } })
        .on("head", { element(el) { el.append((A.hasStyle ? "" : BASE_CSS) + SITE_CSS + metaFamily(A, cur, pageUrl, title) + articleGraph(I, A, cur, pageUrl, title), { html: true }); } })
        .on("body", { element(el) { el.prepend(header(), { html: true }); el.append(footer(I) + WIDGET, { html: true }); } })
        .on("div.crumb", { element(el) { if (!crumbDone) { el.replace(crumb, { html: true }); crumbDone = true; } } })
        .on("h1", { element(el) { if (!h1Done) { h1Done = true; if (!crumbDone) { el.before(crumb, { html: true }); crumbDone = true; } el.after(by + toc, { html: true }); } } })
        .on("main h2", { element(el) { n++; if (!el.getAttribute("id")) el.setAttribute("id", "s" + n); } })
        .on("main", { element(el) { el.append(blocks, { html: true }); } });
      const out = new Response(html, response);
      out.headers.delete("content-length");
      return rw.transform(out);
    } catch (_) {
      return response; // dacă ceva eșuează, pagina rămâne cum e în fișier
    }
  }

  let rw = new HTMLRewriter().on("body", { element(el) { el.append(WIDGET, { html: true }); } });
  try {
    if (path === AUTHOR_PATH) {
      const [I, all] = await Promise.all([loadIdentity(), loadArticles(context)]);
      rw = rw.on("#art-list", { element(el) { el.setInnerContent(authorList(all), { html: true }); } })
        .on("#legal", { element(el) { el.setInnerContent(legalList(I), { html: true }); } });
    }
  } catch (_) { /* pagina rămâne cu butonul WhatsApp */ }
  return rw.transform(response);
}
