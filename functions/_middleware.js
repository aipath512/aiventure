// AiVenture — middleware pe TOATE paginile aiventure.ro
// v1.7 · 2026-11-24
//
// v1.7: pe telefon, fereastra de cookie-uri (gdpr.aiventure.ro) devine compactă și butoanele nu mai ies din ecran.
// v1.6 · 2026-11-19
//
// v1.6: pe fiecare articol, sus, blocul complet de identitate a firmei (CUI, TVA, Reg. Com., EUID, CAEN, sediu, site-uri, email)
//       + „Nu confundați cu alte firme sau domenii numite AiVenture”; schema Organization cu disambiguatingDescription.
// v1.5.1: fără autor dublat (dacă fișierul are deja „Autor:” în linia .meta, rămân doar butonul de copiere și rândul „Publicat de”);
//         întrebări FAQ detectate și din subtitluri H3 (secțiunea „Întrebări frecvente” scrisă din pagina de scris).
// v1.5: STRAT DE ÎMBOGĂȚIRE /blog/imbogatire.json (descriere, cuvinte cheie, subiecte, întrebări-răspuns din text) — secțiune vizibilă
//       „Întrebări frecvente” + FAQPage pereche, meta description/keywords, BlogPosting cu ~30 de proprietăți (keywords, about,
//       mentions, abstract, speakable, timeRequired …); articolele vechi scrise ca text brut (## în <pre>) afișate ca HTML real.
// v1.4.3: articol inexistent sau retras (status ≠ published în articles.json) -> 410 Gone, nu pagina principală.
// v1.4.2: buton „📋 Copiază linkul articolului” sus, lângă autor și dată.
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
    sediu: { strada: "Drumul Pădurea Pustnicu nr. 141C, Corp A, Etaj 2, Ap. 5", localitate: "București", sector: "Sector 1", cod_postal: "014044", tara: "RO" },
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
/* v1.7: fereastra de cookie-uri pe telefon — butoanele nu mai ies din ecran, fereastra e mai compactă */
@media (max-width:600px){#aiv-consent-banner{padding:14px 14px calc(14px + env(safe-area-inset-bottom,0px))!important;font-size:13px!important;line-height:1.45!important}#aiv-consent-banner>div{gap:10px!important}#aiv-consent-banner>div>div:first-child{min-width:0!important}#aiv-consent-banner>div>div:last-child{flex-shrink:1!important;width:100%!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}#aiv-consent-banner>div>div:last-child button{width:100%!important;padding:11px 10px!important;font-size:14px!important;white-space:normal!important}#aiv-consent-banner>div>div:last-child button[data-act="accept"]{grid-column:1/-1!important}}
</style>
<div id="aiv-contact-float" aria-label="Contact AiVenture">
  <a class="aiv-wa" href="https://wa.me/40737123540" target="_blank" rel="noopener" aria-label="WhatsApp +40 737 123 540" title="WhatsApp +40 737 123 540">
    <svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.03c-.25.69-1.45 1.32-2 1.4-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.62-2.98-1.29-4.92-4.29-5.07-4.49-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.6-.37.8-.37h.57c.18 0 .43-.07.67.51.25.6.84 2.06.92 2.21.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.61.17.3.77 1.27 1.65 2.06 1.14 1.01 2.1 1.33 2.4 1.48.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.5.22.57.35.08.12.08.72-.17 1.41z"/></svg>
  </a>
</div>`;

// Componentă comună pentru toate paginile HTML. Dacă o pagină are deja bula
// #chat-launcher (de ex. homepage), componenta globală este eliminată.
// Aceasta reproduce panoul de ajutor existent; nu pretinde chat AI live.
const ASSISTANT = `
<style>
#aiv-global-help{position:fixed;right:22px;bottom:calc(23px + env(safe-area-inset-bottom,0px));z-index:9998;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
#aiv-global-help *{box-sizing:border-box}
#aiv-global-help-button{width:55px;height:55px;display:grid;place-items:center;border:1px solid #c6c7cb;border-radius:50%;background:#fff;color:#17171b;cursor:pointer;box-shadow:0 9px 28px #0007;position:relative}
#aiv-global-help-button:after{content:"";position:absolute;width:12px;height:12px;right:6px;bottom:2px;background:#fff;transform:rotate(35deg);border-radius:2px}
#aiv-global-help-dots{display:flex;gap:4px;align-items:center;position:relative;z-index:1}
#aiv-global-help-dots i{width:5px;height:5px;background:#202027;border-radius:50%;display:block}
#aiv-global-help-panel{display:none;position:absolute;right:0;bottom:72px;width:min(340px,calc(100vw - 32px));padding:21px;border:1px solid #51535d;border-radius:18px;background:#171920;color:#fff;box-shadow:0 16px 45px #000a}
#aiv-global-help-panel[aria-hidden="false"]{display:block}
#aiv-global-help-panel h2{font-size:20px;margin:0 0 10px;line-height:1.25;color:#fff}
#aiv-global-help-panel p{font-size:16px;margin:0 0 12px;color:#ced0d9;line-height:1.45}
#aiv-global-help-panel a{display:block;font-size:16px;line-height:1.35;color:#f4d5a4;text-decoration:none;border:1px solid #655640;background:#2c2929;padding:12px;border-radius:9px;margin-top:8px;font-weight:700}
#aiv-global-help-panel a:hover,#aiv-global-help-panel a:focus-visible{background:#3f3833;color:#fff}
#aiv-global-help-panel small{display:block;margin-top:14px;color:#bbc0cb;font-size:13px;line-height:1.4}
@media(max-width:600px){#aiv-global-help{right:13px;bottom:calc(13px + env(safe-area-inset-bottom,0px))}#aiv-global-help-button{width:49px;height:49px}#aiv-global-help-panel{bottom:65px}}
@media print{#aiv-global-help{display:none}}
</style>
<div id="aiv-global-help">
 <aside id="aiv-global-help-panel" aria-label="Ajutor AiVenture" aria-hidden="true">
  <h2>Cum te putem ajuta?</h2>
  <p>Alege ce vrei să faci pentru firma ta.</p>
  <a href="/#verifica">Verifică dacă firma este găsită</a>
  <a href="https://firmsfinder.eu/">Găsește potențiali clienți</a>
  <a href="/contact/">Discută cu AiVenture</a>
  <small>Panou de ajutor. Chatul AI conversațional nu este conectat în această interfață.</small>
 </aside>
 <button id="aiv-global-help-button" type="button" aria-label="Deschide ajutorul AiVenture" aria-controls="aiv-global-help-panel" aria-expanded="false"><span id="aiv-global-help-dots" aria-hidden="true"><i></i><i></i><i></i></span></button>
</div>
<script>
(function(){
 const root=document.getElementById('aiv-global-help');
 if(!root)return;
 if(document.getElementById('chat-launcher')){root.remove();return;}
 const btn=document.getElementById('aiv-global-help-button'), panel=document.getElementById('aiv-global-help-panel');
 function toggle(force){const open=typeof force==='boolean'?force:btn.getAttribute('aria-expanded')!=='true';btn.setAttribute('aria-expanded',String(open));btn.setAttribute('aria-label',open?'Închide ajutorul AiVenture':'Deschide ajutorul AiVenture');panel.setAttribute('aria-hidden',String(!open));}
 btn.addEventListener('click',()=>toggle());
 document.addEventListener('keydown',e=>{if(e.key==='Escape')toggle(false)});
 document.addEventListener('click',e=>{if(!root.contains(e.target))toggle(false)});
})();
</script>`;

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

async function loadEnrich(context) {
  try {
    const u = new URL("/blog/imbogatire.json", context.request.url);
    const r = context.env && context.env.ASSETS ? await context.env.ASSETS.fetch(u) : await fetch(u);
    if (!r.ok) return {};
    const d = await r.json();
    return d.articole || {};
  } catch (_) { return {}; }
}

// Markdown simplu (articole vechi publicate ca text brut în <pre>) -> HTML real (h2, h3, liste, tabele, îngroșat).
function mdToHtml(md) {
  const inl = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const L = String(md).replace(/\r/g, "").split("\n");
  const out = []; let para = [];
  const flush = () => { if (para.length) { out.push(`<p>${inl(para.join(" "))}</p>`); para = []; } };
  for (let i = 0; i < L.length; i++) {
    const t = L[i].trim();
    if (!t) { flush(); continue; }
    let m;
    if ((m = /^(#{2,4})\s+(.*)$/.exec(t))) { flush(); const n = m[1].length >= 3 ? 3 : 2; out.push(`<h${n}>${inl(m[2])}</h${n}>`); continue; }
    if (/^\|.*\|$/.test(t)) {
      flush(); const rows = [];
      while (i < L.length && /^\|.*\|$/.test(L[i].trim())) { rows.push(L[i].trim()); i++; }
      i--;
      const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const data = rows.filter((r) => !/^\|?\s*:?-{2,}/.test(r)).map(cells); const head = data.shift() || [];
      out.push(`<div class="tw"><table><thead><tr>${head.map((c) => `<th>${inl(c)}</th>`).join("")}</tr></thead><tbody>${data.map((r) => `<tr>${r.map((c) => `<td>${inl(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    if (/^[-*]\s+/.test(t) || /^\d+[.)]\s+/.test(t)) {
      flush(); const ord = /^\d/.test(t), re = ord ? /^\d+[.)]\s+/ : /^[-*]\s+/, items = [];
      while (i < L.length && re.test(L[i].trim())) { items.push(L[i].trim().replace(re, "")); i++; }
      i--;
      out.push(`<${ord ? "ol" : "ul"}>${items.map((x) => `<li>${inl(x)}</li>`).join("")}</${ord ? "ol" : "ul"}>`);
      continue;
    }
    para.push(t);
  }
  flush();
  return out.join("\n");
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
.aiv-by{font-size:14px;color:#b8bcc6;margin:6px 0 0}.aiv-cp{padding:4px 10px;border-radius:8px;border:1px solid #e7c86e;background:transparent;color:#e7c86e;font:600 13px system-ui,sans-serif;cursor:pointer}.aiv-cp:hover{background:#e7c86e;color:#090b10}.aiv-by a{color:#e7c86e}
.aiv-pub{font-size:14px;line-height:1.55;color:#c9ccd3;margin:8px 0 0;padding:10px 14px;border-left:3px solid #e7c86e;background:#0d1016;border-radius:0 8px 8px 0}.aiv-pub p{margin:2px 0}.aiv-pub a{color:#e7c86e}.aiv-pub .aiv-dis{color:#9298a4;font-size:13px;margin-top:6px}
.aiv-toc{margin:22px 0;padding:12px 16px;border:1px solid #292d36;border-radius:10px;background:#0d1016;font-size:15px}.aiv-toc strong{display:block;margin-bottom:4px}.aiv-toc ol{margin:0;padding-left:20px}.aiv-toc a{color:#e7c86e}
.aiv-faq{margin:40px 0 0;padding:18px;border:1px solid #292d36;border-radius:12px;background:#0d1016}.aiv-faq>h2{margin:0 0 8px}.aiv-faq details{border-top:1px solid #292d36;padding:10px 0}.aiv-faq summary{cursor:pointer;list-style:none}.aiv-faq summary h3{display:inline;font-size:17px;color:#e7c86e;margin:0}.aiv-faq p{margin:6px 0 0}
.aiv-ftr{border-top:1px solid #292d36;margin-top:40px;padding:22px 18px;font-size:13px;color:#9298a4;text-align:center}.aiv-ftr a{color:#9298a4;margin:0 6px}
</style>`;
const BASE_CSS = `<style>*{box-sizing:border-box}body{margin:0;background:#090b10;color:#f5f5f5;font:17px/1.7 system-ui,-apple-system,Segoe UI,sans-serif}main{max-width:820px;margin:auto;padding:26px 18px 80px}a{color:#e7c86e;text-decoration:none}h1{font-size:clamp(32px,6vw,52px);line-height:1.08;margin:20px 0 12px}h2{margin-top:40px;line-height:1.2}</style>`;

const NAV = [["/", "Acasă"], ["/produse/", "Produse"], ["/servicii/", "Servicii"], ["/geo/", "GEO"], ["/blog/", "Blog"], ["/contact/", "Contact"]];
// Header unic: aceeași identitate vizuală și aceleași acțiuni ca pe homepage.
// Stilurile sunt încapsulate pentru a nu schimba tipografia și layoutul paginilor vechi.
const GLOBAL_HEADER_CSS = `<style id="aiv-global-header-style">
.aiv-global-header{position:sticky;top:0;z-index:1000;width:100%;background:#08090cf2;border-bottom:1px solid #2e3037;backdrop-filter:blur(16px);font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#f4f4f6;line-height:1.2}
.aiv-global-header *{box-sizing:border-box}
.aiv-global-header .aiv-gh-row{width:min(1160px,calc(100% - 34px));min-height:80px;margin:auto;display:flex;align-items:center;gap:10px}
.aiv-global-header .aiv-gh-brand{display:flex;align-items:center;gap:11px;margin-right:auto;color:#f4f4f6!important;text-decoration:none!important;font-size:27px;font-weight:800;letter-spacing:-1.2px;white-space:nowrap}
.aiv-global-header .aiv-gh-mark{width:42px;height:42px;display:grid;place-items:center;border-radius:50%;background:#22b9a9;color:#032a2b;font-size:24px;letter-spacing:-1px}
.aiv-global-header .aiv-gh-control{display:inline-flex;align-items:center;justify-content:center;height:40px;border:1px solid #3c3e47;border-radius:40px;background:#171920;color:#eee;cursor:pointer;font-family:inherit;line-height:1}
.aiv-global-header .aiv-gh-theme{width:40px;font-size:23px}
.aiv-global-header .aiv-gh-language{position:relative;margin:0}
.aiv-global-header .aiv-gh-language select{appearance:none;width:65px;height:40px;padding:0 24px 0 13px;border:1px solid #3c3e47;border-radius:40px;background:#171920;color:#eee;font:650 17px system-ui,sans-serif;cursor:pointer}
.aiv-global-header .aiv-gh-language:after{content:'⌄';position:absolute;pointer-events:none;right:9px;top:6px;font-size:23px}
.aiv-global-header .aiv-gh-menu{width:44px;font-size:28px}
.aiv-global-header .aiv-gh-panel{display:none;position:absolute;right:20px;top:calc(100% - 9px);width:min(320px,calc(100% - 40px));max-height:75vh;overflow:auto;padding:12px;border:1px solid #40424a;border-radius:16px;background:#15161c;box-shadow:0 22px 40px #0009}
.aiv-global-header .aiv-gh-panel.open{display:grid}
.aiv-global-header .aiv-gh-panel a{display:block;padding:13px 14px;border-radius:9px;color:#dcdde3!important;text-decoration:none!important;font:500 19px/1.3 system-ui,sans-serif}
.aiv-global-header .aiv-gh-panel a:hover,.aiv-global-header .aiv-gh-panel a:focus-visible{background:#272a32;color:#fff!important}
.aiv-global-header button:focus-visible,.aiv-global-header select:focus-visible,.aiv-global-header a:focus-visible{outline:2px solid #d4ac62;outline-offset:3px}
/* Același arbore de navigație pe homepage și pe paginile injectate la Edge. */
.aiv-gh-panel,#menu-panel:has(.aiv-nav-tree){color:#ececf0;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
.aiv-gh-panel .aiv-nav-tree,#menu-panel .aiv-nav-tree{display:grid;gap:14px}
.aiv-nav-tree{font-size:16px;text-align:left}
.aiv-nav-tree *{box-sizing:border-box}
.aiv-nav-tree .aiv-nav-primary{display:grid;gap:8px}
.aiv-nav-tree .aiv-nav-heading{display:flex;align-items:center;gap:8px;min-width:0}
.aiv-nav-tree .aiv-nav-heading>a{flex:1;min-width:0;font-weight:800!important;color:#f6f4ee!important}
.aiv-nav-tree button{font:inherit;cursor:pointer;border:1px solid #4b4e59;border-radius:10px;background:#202129;color:#f1f1f4;min-width:44px;min-height:44px}
.aiv-nav-tree button[aria-expanded="true"]{border-color:#d4ac62;color:#e5bf7b}
.aiv-nav-tree .aiv-nav-heading>a,.aiv-nav-tree .aiv-nav-sub>a,.aiv-nav-tree .aiv-nav-resources a{display:flex;align-items:center;min-height:44px;padding:10px 12px;border-radius:9px;text-decoration:none!important}
.aiv-nav-tree .aiv-nav-branch{border:1px solid #393b46;border-radius:12px;padding:8px;background:#1a1b22}
.aiv-nav-tree .aiv-nav-subtree{display:none;padding:12px 0 5px}
.aiv-nav-tree .aiv-nav-subtree.is-open{display:grid;gap:10px}
.aiv-nav-tree .aiv-nav-sub{min-width:0}
.aiv-nav-tree .aiv-nav-sub>a{color:#e5e6ec!important;font-size:16px!important;font-weight:650!important}
.aiv-nav-tree .aiv-nav-sub>a:hover{background:#292c34}
.aiv-nav-tree .aiv-nav-sub-row{display:flex;gap:7px;align-items:center}
.aiv-nav-tree .aiv-nav-sub-row>a{flex:1;min-width:0}
.aiv-nav-tree .aiv-nav-sub-row button{font-size:18px}
.aiv-nav-tree .aiv-nav-tertiary{display:flex;gap:8px;flex-wrap:wrap;padding:2px 6px 9px}
.aiv-nav-tree .aiv-nav-tertiary a{display:inline-flex;align-items:center;min-height:44px;padding:8px 11px;border:1px solid #4a3f2e;border-radius:8px;color:#eac98e!important;text-decoration:none!important;font-size:14px!important}
.aiv-nav-tree .aiv-nav-resources{border-top:1px solid #41434b;padding-top:12px}
.aiv-nav-tree .aiv-nav-resources>strong{display:block;margin:0 8px 8px;color:#d7b779;font-size:13px;letter-spacing:.09em;text-transform:uppercase}
.aiv-nav-tree .aiv-nav-resources>div{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px}
.aiv-nav-tree .aiv-nav-resources a{font-size:14px!important;color:#c9cbd3!important}
.aiv-nav-tree .aiv-nav-cta{display:block!important;text-align:center;background:#d4ac62!important;color:#15100a!important;border-radius:11px;padding:13px!important;font-size:16px!important;font-weight:800!important}
.aiv-nav-tree .aiv-nav-fii .aiv-nav-subtree{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:14px}
.aiv-nav-tree .aiv-nav-fii .aiv-nav-subtree .aiv-nav-sub{border-bottom:1px solid #333640;padding-bottom:3px}
.aiv-global-header .aiv-gh-panel:has(.aiv-nav-tree){width:min(850px,calc(100vw - 40px));max-height:min(76vh,760px);right:20px;top:calc(100% - 5px);padding:18px;overflow-y:auto}
#menu-panel:has(.aiv-nav-tree){width:min(850px,calc(100vw - 40px));max-height:min(76vh,760px);overflow-y:auto;padding:18px}
body.aiv-nav-locked{overflow:hidden}
@media(max-width:700px){
.aiv-global-header .aiv-gh-panel:has(.aiv-nav-tree),#menu-panel:has(.aiv-nav-tree){position:fixed;top:67px;left:0;right:0;width:100vw;max-width:none;height:calc(100dvh - 67px);max-height:none;border-radius:0;border-left:0;border-right:0;overflow-y:auto;overscroll-behavior:contain;padding:18px 17px 35px;background:#15161c}
.aiv-nav-tree .aiv-nav-fii .aiv-nav-subtree{grid-template-columns:1fr}
.aiv-nav-tree .aiv-nav-tertiary{display:none;margin-left:12px}
.aiv-nav-tree .aiv-nav-tertiary.is-open{display:flex}
.aiv-nav-tree .aiv-nav-resources>div{grid-template-columns:1fr}
.aiv-nav-tree .aiv-nav-branch{padding:7px}
}
@media(max-width:540px){.aiv-global-header .aiv-gh-row{min-height:67px}.aiv-global-header .aiv-gh-brand{font-size:24px}.aiv-global-header .aiv-gh-mark{width:36px;height:36px;font-size:21px}.aiv-global-header .aiv-gh-control,.aiv-global-header .aiv-gh-language select{height:36px}.aiv-global-header .aiv-gh-theme{width:36px}.aiv-global-header .aiv-gh-language select{width:61px}.aiv-global-header .aiv-gh-menu{width:39px}}
@media(max-width:360px){.aiv-global-header .aiv-gh-row{gap:6px}.aiv-global-header .aiv-gh-brand{font-size:21px;gap:8px}.aiv-global-header .aiv-gh-mark{width:32px;height:32px;font-size:18px}.aiv-global-header .aiv-gh-theme{width:34px}.aiv-global-header .aiv-gh-menu{width:36px;font-size:24px}}
</style>`;
// Sursa unică de navigație pentru ambele prezentări: mega-menu și drawer.
const GLOBAL_MENU = [
  { id:"fii", title:"FII GĂSIT", href:"/#fii-gasit-intro", children:[
    {title:"SEO · Google",href:"/seo/",group:"Motoare & AI Search",links:[["Educativ","/seo/"],["Servicii SEO","/servicii/seo/"]]},
    {title:"GEO · AI Search",href:"/geo/",group:"Motoare & AI Search",links:[["GEO Educativ","/geo/"],["Servicii GEO","/servicii-geo/"]]},
    {title:"AEO · Answers",href:"/aeo/",group:"Motoare & AI Search",links:[["Educativ","/aeo/"],["Servicii AEO","/servicii/aeo/"]]},
    {title:"AI-SEO",href:"/seo/",group:"Motoare & AI Search",links:[["Ghid SEO","/seo/"],["Servicii SEO","/servicii/seo/"]]},
    {title:"AIO",href:"/aio/",group:"Motoare & AI Search",links:[["Educativ","/aio/"],["Servicii AIO","/servicii/aio/"]]},
    {title:"ON-SITE",href:"/seo/#faq",group:"Optimizare & autoritate"},
    {title:"ON-PAGE",href:"/seo/#faq",group:"Optimizare & autoritate"},
    {title:"OFF-PAGE",href:"/seo/#faq",group:"Optimizare & autoritate"}
  ]},
  {id:"gaseste",title:"GĂSEȘTE CLIENȚI",href:"/#cauta-intro",children:[
    {title:"FirmsFinder",href:"https://firmsfinder.eu/"},{title:"Produse și prețuri",href:"/produse/"}
  ]},
  {id:"creste",title:"CREȘTE CU GOOGLE & AI",href:"/#creste-cu-ai",children:[
    {title:"Web-Om",href:"/web-om/"},{title:"Web-AI",href:"/web-ai/"},{title:"Web-A2A",href:"/web-a2a/"},{title:"3 Webs",href:"/three-webs/"}
  ]}
];
const GLOBAL_RESOURCES = [
  ["/eu-ai-act-ready/","EU AI Act"],["/arhitectura/","Arhitectură"],["/dovezi/","Dovezi"],
  ["/viziune/","Viziune"],["/despre/","Despre"],["/faq/","FAQ"],["/legal/","Legale"],
  ["/intentii/","Intenții și cuvinte-cheie"],["/tools/","Tools"],["/blog/","Blog"],["/contact/","Contact"]
];
const renderMenu = () => `<div class="aiv-nav-tree" data-aiv-menu="v2"><div class="aiv-nav-primary">${GLOBAL_MENU.map(g=>`
<section class="aiv-nav-branch aiv-nav-${g.id}">
<div class="aiv-nav-heading"><a href="${g.href}">${g.title}</a><button type="button" aria-expanded="false" aria-label="Extinde ${g.title}" aria-controls="aiv-sub-${g.id}" data-aiv-expand="aiv-sub-${g.id}">⌄</button></div>
<div class="aiv-nav-subtree" id="aiv-sub-${g.id}">${g.children.map((c,i)=>`<div class="aiv-nav-sub" data-group="${c.group||""}"><div class="aiv-nav-sub-row"><a href="${c.href}">${g.id==="fii"?`${i+1}. `:""}${c.title}</a>${c.links?`<button type="button" aria-expanded="false" aria-label="Opțiuni ${c.title}" aria-controls="aiv-third-${g.id}-${i}" data-aiv-expand="aiv-third-${g.id}-${i}">⌄</button>`:""}</div>${c.links?`<div class="aiv-nav-tertiary" id="aiv-third-${g.id}-${i}">${c.links.map(([label,href])=>`<a href="${href}">${label}</a>`).join("")}</div>`:""}</div>`).join("")}
${g.id==="fii"?'<a class="aiv-nav-cta" href="/#verifica">Cere testul gratuit</a>':""}</div></section>`).join("")}</div>
<div class="aiv-nav-resources"><strong>Resurse & companie</strong><div>${GLOBAL_RESOURCES.map(([url,label])=>`<a href="${url}">${label}</a>`).join("")}</div></div></div>`;
const header = () => `<header class="aiv-global-header" data-aiv-header="v2"><div class="aiv-gh-row"><a class="aiv-gh-brand" href="/"><span class="aiv-gh-mark" aria-hidden="true">AI</span>AiVenture</a><button class="aiv-gh-control aiv-gh-theme" type="button" aria-label="Comută tema">☀</button><label class="aiv-gh-language"><span class="sr" style="position:absolute;clip-path:inset(50%);width:1px;height:1px;overflow:hidden">Alege limba</span><select aria-label="Limba site-ului"><option value="ro">RO</option><option value="en">EN</option><option value="fr">FR</option></select></label><button class="aiv-gh-control aiv-gh-menu" type="button" aria-controls="aiv-global-menu" aria-expanded="false" aria-label="Deschide meniul">☰</button></div><nav class="aiv-gh-panel" id="aiv-global-menu" aria-label="Navigație">${renderMenu()}</nav></header>`;
const GLOBAL_HEADER_SCRIPT = `<script id="aiv-global-header-script">(function(){
const h=document.querySelector('.aiv-global-header');
const panel=h?h.querySelector('.aiv-gh-panel'):document.querySelector('#menu-panel');
const btn=h?h.querySelector('.aiv-gh-menu'):document.querySelector('#menu');
if(!panel||!btn||!panel.querySelector('[data-aiv-menu]'))return;
function sync(){document.body.classList.toggle('aiv-nav-locked',panel.classList.contains('open')&&matchMedia('(max-width:700px)').matches)}
function close(){panel.classList.remove('open');btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label','Deschide meniul');sync()}
if(h)btn.addEventListener('click',()=>{const open=panel.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));btn.setAttribute('aria-label',open?'Închide meniul':'Deschide meniul');sync()});
else btn.addEventListener('click',sync);
panel.querySelectorAll('[data-aiv-expand]').forEach(b=>b.addEventListener('click',()=>{
const content=document.getElementById(b.dataset.aivExpand);if(!content)return;
const open=content.classList.toggle('is-open');b.setAttribute('aria-expanded',String(open));
}));
panel.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
document.addEventListener('click',e=>{if(!panel.contains(e.target)&&e.target!==btn&&!btn.contains(e.target))close()});
window.addEventListener('resize',sync);
if(h){
const theme=h.querySelector('.aiv-gh-theme');theme.addEventListener('click',()=>{const light=document.body.classList.toggle('light');theme.textContent=light?'☾':'☀';theme.setAttribute('aria-label',light?'Activează modul întunecat':'Activează modul luminos')});
const lang=h.querySelector('select');const p=location.pathname;lang.value=p.startsWith('/en/')?'en':p.startsWith('/fr/')?'fr':'ro';
lang.addEventListener('change',()=>{location.assign(lang.value==='ro'?'/':'/'+lang.value+'/')});
}
})();</script>`;
const footer = (I) => `<footer class="aiv-ftr">${esc((I.firma || {}).denumire_legala || "AiVenture S.R.L.")} · CUI ${esc((I.firma || {}).cui || "51415878")} · <a href="mailto:contact@5thelement.ai">contact@5thelement.ai</a> · <a href="https://wa.me/40737123540" rel="noopener">WhatsApp</a><br><a href="/produse/">Produse</a><a href="/servicii/">Servicii</a><a href="/blog/">Blog</a><a href="${AUTHOR_PATH}">Autor</a><a href="/contact/">Contact</a><a href="/legal/">Informații legale</a></footer>`;

const strip = (h) => String(h || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
const iso = (d) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : d || undefined);

// Analizează HTML-ul articolului: titlu, subtitluri, FAQ, număr de cuvinte, ce meta există deja.
function analyze(html) {
  const art = (/<article[\s>][\s\S]*?<\/article>/i.exec(html) || /<main[\s>][\s\S]*?<\/main>/i.exec(html) || [html])[0];
  const h1 = strip((/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(art) || [])[1]);
  const h2s = [...art.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => strip(m[1]));
  const faq = [];
  for (const m of art.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>\s*((?:<(?:p|ul|ol|div class="tw")[\s\S]*?<\/(?:p|ul|ol|div)>\s*){1,2})/gi)) {
    const q = strip(m[1]).replace(/^\d+[.)]\s*/, "");
    if (faq.some((x) => x.q === q)) continue;
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
  if (A.desc) add(/name=["']description["']/i, `<meta name="description" content="${esc(A.desc)}">`);
  const kw = (A.keywords || []).join(", ");
  if (kw) add(/name=["']keywords["']/i, `<meta name="keywords" content="${esc(kw)}">`);
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
    disambiguatingDescription: `${f.denumire_legala || "AiVenture S.R.L."} — societate cu răspundere limitată din România (București), CUI ${f.cui || "51415878"}, EUID ${f.euid || "ROONRC.J2025016406000"}; nu este aceeași entitate cu alte firme sau domenii numite „AiVenture”.`,
    foundingDate: f.data_infiintare || undefined, foundingLocation: { "@type": "Place", name: "București, România" },
    identifier: [{ "@type": "PropertyValue", propertyID: "CUI", value: f.cui }, { "@type": "PropertyValue", propertyID: "EUID", value: f.euid }, { "@type": "PropertyValue", propertyID: "ONRC", value: f.nr_registrul_comertului }],
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: (I.contact || {}).email || "contact@5thelement.ai", areaServed: "RO", availableLanguage: ["ro", "fr", "en"] }, vatID: f.cod_tva, email: (I.contact || {}).email,
    logo: { "@type": "ImageObject", url: SITE + "/icon-512.png", width: 512, height: 512 },
    address: { "@type": "PostalAddress", streetAddress: s.strada, addressRegion: s.sector, addressLocality: s.localitate, postalCode: s.cod_postal, addressCountry: s.tara || "RO" },
    founder: { "@id": PERSON_ID },
    sameAs: [p.linkedin_firma, p.crunchbase, p.x, p.youtube, p.medium, "https://5thelement.ai/", SITE + "/"].filter(Boolean) };
}

function articleGraph(I, A, cur, url, title, en = {}, faqList = []) {
  const pub = cur ? iso(cur.published_at || cur.published) : undefined;
  const kws = (en.keywords && en.keywords.length ? en.keywords : (cur && cur.keywords) || []);
  const thing = (n) => ({ "@type": "Thing", name: n });
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
      abstract: A.desc || undefined, keywords: kws.length ? kws.join(", ") : undefined,
      about: en.about && en.about.length ? en.about.map(thing) : undefined,
      mentions: en.mentions && en.mentions.length ? en.mentions.map(thing) : undefined,
      timeRequired: A.words ? `PT${Math.max(1, Math.round(A.words / 200))}M` : undefined,
      dateCreated: pub, copyrightHolder: { "@id": ORG_ID }, copyrightYear: pub ? Number(String(pub).slice(0, 4)) : undefined,
      isAccessibleForFree: true, thumbnailUrl: OG_IMAGE,
      speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", ".aiv-faq"] },
      ...(cur && cur.sha256 ? { additionalProperty: { "@type": "PropertyValue", propertyID: "SHA-256", value: cur.sha256 } } : {}) },
    { "@type": "BreadcrumbList", "@id": url + "#breadcrumb", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasă", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: SITE + "/blog/" },
      { "@type": "ListItem", position: 3, name: title, item: url }] }
  ];
  if (faqList.length >= 2) graph.push({ "@type": "FAQPage", "@id": url + "#faq", isPartOf: { "@id": url + "#webpage" },
    mainEntity: faqList.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) });
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")}</script>`;
}

const fmtRo = (a) => {
  const s = a && (a.published_at || a.published) || "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.split("-").reverse().join(".");
  try { return new Date(s).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", day: "2-digit", month: "2-digit", year: "numeric" }); } catch (_) { return s; }
};

// Bloc vizibil de identitate legală: deosebește AiVenture S.R.L. (România) de alte firme / domenii cu numele „AiVenture”.
function identityBlock(I) {
  const f = I.firma || {}, s = f.sediu || {}, c = I.contact || {};
  const email = c.email || "contact@5thelement.ai";
  const adr = [s.strada, s.sector, s.localitate, s.cod_postal, "România"].filter(Boolean).join(", ");
  return `<div class="aiv-pub" id="identitate-firma" aria-label="Datele firmei care publică">`
    + `<p><strong>Publicat de ${esc(f.denumire_legala || "AiVenture S.R.L.")}</strong> — firmă românească, cu sediul în ${esc(s.localitate || "București")}, România.</p>`
    + `<p>CUI <strong>${esc(f.cui || "51415878")}</strong> · Cod TVA <strong>${esc(f.cod_tva || "RO51415878")}</strong> · Nr. Registrul Comerțului <strong>${esc(f.nr_registrul_comertului || "J2025016406000")}</strong> · EUID <strong>${esc(f.euid || "ROONRC.J2025016406000")}</strong>${f.caen_principal ? ` · CAEN principal ${esc(f.caen_principal)}` : ""}</p>`
    + (adr ? `<p>Sediu social: ${esc(adr)}</p>` : "")
    + `<p>Site-uri oficiale: <a href="${SITE}/">aiventure.ro</a> · <a href="https://5thelement.ai/">5thelement.ai</a> · Contact: <!--email_off--><a href="mailto:${esc(email)}">${esc(email)}</a><!--/email_off--></p>`
    + `<p class="aiv-dis">Nu confundați cu alte firme sau domenii care poartă numele „AiVenture”. Datele de mai sus identifică singura firmă care publică acest articol.</p>`
    + `</div>`;
}

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
      let html = await response.text();
      const [I, all, EN] = await Promise.all([loadIdentity(), loadArticles(context), loadEnrich(context)]);
      // articole vechi publicate ca text brut (## ...) într-un <pre>: afișate ca HTML real
      html = html.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (m, body) => (/^#{2,3}\s/m.test(body) ? mdToHtml(body.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")) : m));
      const slug = m[1], pageUrl = `${SITE}/blog/${slug}/`;
      const cur = all.find((a) => a.slug === slug);
      if (all.length && !cur) {
        // articol inexistent sau retras: 410 Gone (nu pagina principală cu 200), ca Google și AI să-l scoată din index
        return new Response(`<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Articol indisponibil | AiVenture</title>${BASE_CSS}${SITE_CSS}</head><body>${header()}<main><h1>Articolul nu mai este disponibil</h1><p>Articolul a fost retras sau adresa nu există. <a href="/blog/">Vedeți toate articolele</a> sau căutați în blog din bara de sus.</p></main>${footer(I)}</body></html>`,
          { status: 410, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
      }
      const A = analyze(html);
      const en = EN[slug] || {};
      if (en.description) A.desc = en.description; else if (cur && cur.description && !A.desc) A.desc = cur.description;
      A.keywords = en.keywords && en.keywords.length ? en.keywords : (cur && cur.keywords) || [];
      const enFaq = (en.faq || []).filter((x) => x && x.q && x.a);
      const faqList = enFaq.length ? enFaq : A.faq;
      const faqHtml = enFaq.length ? `<section class="aiv-faq" id="intrebari-frecvente" aria-label="Întrebări frecvente"><h2>Întrebări frecvente</h2>${enFaq.map((x) => `<details open><summary><h3>${esc(x.q)}</h3></summary><p>${esc(x.a)}</p></details>`).join("")}</section>` : "";
      const title = (cur && cur.title) || A.h1 || "Articol";
      const blocks = articleBlocks(I, all, slug, pageUrl);
      const crumb = `<nav class="aiv-bc" aria-label="Fir de navigare"><a href="/">Acasă</a> › <a href="/blog/">Blog</a> › <span aria-current="page">${esc(title)}</span>${cur && cur.id ? ` · ${esc(cur.id)}` : ""}</nav>`;
      const F = I.firma || {}, S = F.sediu || {}, email = (I.contact || {}).email || "contact@5thelement.ai";
      const metaHasAuthor = /class="meta"[^>]*>[\s\S]{0,300}?Autor:/i.test(html);
      const by = metaHasAuthor ? `<p class="aiv-by"><button class="aiv-cp" type="button" data-url="${esc(pageUrl)}" title="${esc(pageUrl)}" onclick="var b=this,u=b.dataset.url,t=b.textContent;function d(){b.textContent='✓ Copiat';setTimeout(function(){b.textContent=t},1500)}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(d,function(){prompt('Copiați linkul:',u)})}else{prompt('Copiați linkul:',u)}">📋 Copiază linkul articolului</button></p>`
        + identityBlock(I)
        : `<p class="aiv-by">de <a href="${AUTHOR_PATH}" rel="author">${AUTHOR_NAME}</a>${cur && (cur.published_at || cur.published) ? ` · <time datetime="${esc(cur.published_at || cur.published)}">${esc(fmtRo(cur))}</time>` : ""}${cur && cur.version ? ` · v${esc(cur.version)}` : ""} · <button class="aiv-cp" type="button" data-url="${esc(pageUrl)}" title="${esc(pageUrl)}" onclick="var b=this,u=b.dataset.url,t=b.textContent;function d(){b.textContent='✓ Copiat';setTimeout(function(){b.textContent=t},1500)}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(d,function(){prompt('Copiați linkul:',u)})}else{prompt('Copiați linkul:',u)}">📋 Copiază linkul articolului</button></p>`
        + identityBlock(I);
      const toc = A.h2s.length >= 3 ? `<nav class="aiv-toc" aria-label="Cuprins"><strong>Cuprins</strong><ol>${A.h2s.map((t, i) => `<li><a href="#s${i + 1}">${esc(t)}</a></li>`).join("")}</ol></nav>` : "";
      let n = 0, crumbDone = false, h1Done = false;
      const hasArticle = /<article[\s>]/i.test(html);
      const rw = new HTMLRewriter()
        .on('script[type="application/ld+json"]', { element(el) { el.remove(); } })
        .on('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]', { element(el) { if (en.description) el.setAttribute("content", en.description); } })
        .on("head", { element(el) { el.append((A.hasStyle ? "" : BASE_CSS) + SITE_CSS + GLOBAL_HEADER_CSS + metaFamily(A, cur, pageUrl, title) + articleGraph(I, A, cur, pageUrl, title, en, faqList), { html: true }); } })
        .on("body", { element(el) { el.prepend(header(), { html: true }); el.append(footer(I) + WIDGET + ASSISTANT + GLOBAL_HEADER_SCRIPT + '<script defer src="/assets/aiventure-assistant-theme.js"></script>', { html: true }); } })
        .on("div.crumb", { element(el) { if (!crumbDone) { el.replace(crumb, { html: true }); crumbDone = true; } } })
        .on("h1", { element(el) { if (!h1Done) { h1Done = true; if (!crumbDone) { el.before(crumb, { html: true }); crumbDone = true; } el.after(by + toc, { html: true }); } } })
        .on("main h2", { element(el) { n++; if (!el.getAttribute("id")) el.setAttribute("id", "s" + n); } })
        .on("main", { element(el) { el.append((hasArticle ? "" : faqHtml) + blocks, { html: true }); } })
        .on("article", { element(el) { if (faqHtml) el.append(faqHtml, { html: true }); } });
      const out = new Response(html, response);
      out.headers.delete("content-length");
      return rw.transform(out);
    } catch (_) {
      return response; // dacă ceva eșuează, pagina rămâne cum e în fișier
    }
  }

  // Homepage-ul este sursa vizuală de referință și își păstrează headerul nativ.
  // Preview-urile, paginile tehnice și variantele de test nu primesc rescriere.
  const globalHeaderEnabled = path !== "/" &&
    !/(^|\/)(preview[^/]*|[^/]*-preview|test|sandbox)(\/|$)/i.test(path) &&
    !/^\/(?:\.well-known|api|assets|_next|cdn-cgi)\//.test(path);
  let rw = new HTMLRewriter();
  if (globalHeaderEnabled) {
    rw = rw
      .on("head", { element(el) { el.append(GLOBAL_HEADER_CSS, { html: true }); } })
      .on("body", { element(el) { el.prepend(header(), { html: true }); } })
      .on("body > header", { element(el) { el.remove(); } });
  } else if (path === "/") {
    // Homepage: păstrăm intact headerul vizual, dar folosim EXACT același arbore de meniu.
    rw = rw
      .on("head", { element(el) { el.append(GLOBAL_HEADER_CSS, { html: true }); } })
      .on("#menu-panel", { element(el) { el.setInnerContent(renderMenu(), { html: true }); } });
  }
  rw = rw.on("body", { element(el) { el.append(WIDGET + ASSISTANT + ((globalHeaderEnabled || path === "/") ? GLOBAL_HEADER_SCRIPT : "") + '<script defer src="/assets/aiventure-assistant-theme.js"></script>', { html: true }); } });
  try {
    if (path === AUTHOR_PATH) {
      const [I, all] = await Promise.all([loadIdentity(), loadArticles(context)]);
      rw = rw.on("#art-list", { element(el) { el.setInnerContent(authorList(all), { html: true }); } })
        .on("#legal", { element(el) { el.setInnerContent(legalList(I), { html: true }); } });
    }
  } catch (_) { /* pagina rămâne cu butonul WhatsApp */ }
  return rw.transform(response);
}
