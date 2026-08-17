#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AiVenture.ro v2.0 — static site generator."""
import os, shutil, json, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from faqbank import FAQ, GENERIC

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, "site")
BASE = "https://aiventure.ro"
VERSION = "v2.0.0"

CRUMB_LABEL = {
 "/niveluri/":"Nivelurile AI","/solutii/":"Soluții","/pentru-cine/":"Pentru cine",
 "/verifica/":"Verifică firma","/exemplu-ecbtax/":"Exemplu ECBTAX","/rezultate/":"Rezultate",
 "/de-ce-ai/":"De ce AI?","/de-ce-acum/":"De ce acum?","/preturi/":"Prețuri",
 "/resurse/":"Resurse","/faq/":"Întrebări","/despre/":"Despre","/contact/":"Contact",
 "/legal/":"Legal & GDPR","/tehnologie/":"Tehnologie","/cum/":"Cum funcționează","/cum/descoperire/":"Descoperire","/cum/intelegere/":"Înțelegere","/cum/actiune/":"Acțiune","/cum/a2a/":"A2A","/intrebari/":"Banca de întrebări","/use-cases/":"Use cases","/eu-ai-act-ready/":"EU AI Act Ready",
 "/solutii/ai-lens/":"AI LENS","/solutii/ai-audit/":"AI AUDIT","/solutii/ai-ready/":"AI READY",
 "/solutii/ai-edge/":"AI EDGE","/solutii/agent-ready/":"AGENT READY","/solutii/a2a/":"A2A READY",
 "/pentru-cine/imm/":"IMM / B2B","/pentru-cine/it/":"IT & Software",
 "/pentru-cine/contabilitate/":"Contabilitate · HR","/pentru-cine/consultanti/":"Consultanți",
 "/pentru-cine/agentii/":"Agenții","/pentru-cine/freelanceri/":"Freelanceri",
}
TOPIC = {
 "/solutii/ai-lens/":"AI LENS","/solutii/ai-audit/":"AI AUDIT","/solutii/ai-ready/":"AI READY",
 "/solutii/ai-edge/":"AI EDGE","/solutii/agent-ready/":"AGENT READY","/solutii/a2a/":"A2A READY",
 "/tehnologie/":"stratul tehnic","/preturi/":"structura de preț","/rezultate/":"formatul de rezultate",
 "/de-ce-ai/":"schimbarea adusă de AI","/de-ce-acum/":"momentul actual","/despre/":"AiVenture","/cum/":"felul în care mașinile citesc un site","/intrebari/":"banca de întrebări","/use-cases/":"cele 199 de situații",
 "/pentru-cine/imm/":"pachetul pentru IMM","/pentru-cine/it/":"pachetul pentru IT",
 "/pentru-cine/contabilitate/":"pachetul pentru contabilitate","/pentru-cine/consultanti/":"pachetul pentru consultanți",
 "/pentru-cine/agentii/":"pachetul pentru agenții","/pentru-cine/freelanceri/":"pachetul pentru freelanceri",
}

NAV = [
    ("/cum/",            "Cum funcționează"),
    ("/niveluri/",       "Nivelurile AI"),
    ("/solutii/",        "Soluții"),
    ("/pentru-cine/",    "Pentru cine"),
    ("/rezultate/",      "Rezultate"),
    ("/intrebari/",      "Întrebări"),
    ("/resurse/",        "Resurse"),
]

FOOT = [
    ("Scara AiVenture", [("/solutii/ai-lens/","AI LENS"),("/solutii/ai-audit/","AI AUDIT"),
                         ("/solutii/ai-ready/","AI READY"),("/solutii/ai-edge/","AI EDGE"),
                         ("/solutii/agent-ready/","AGENT READY"),("/solutii/a2a/","A2A READY")]),
    ("Află unde ești",  [("/niveluri/","Nivelurile AI"),("/verifica/","Verifică firma"),
                         ("/exemplu-ecbtax/","Exemplu ECBTAX"),("/rezultate/","Rezultate"),
                         ("/use-cases/","199 use cases"),("/intrebari/","Banca de întrebări"),
                         ("/cum/","Cum funcționează"),("/de-ce-ai/","De ce AI?"),("/de-ce-acum/","De ce acum?")]),
    ("Pentru cine",     [("/pentru-cine/","Toate profilurile"),("/pentru-cine/contabilitate/","Contabilitate · HR"),
                         ("/pentru-cine/it/","IT & Software"),("/pentru-cine/imm/","IMM / B2B"),
                         ("/pentru-cine/consultanti/","Consultanți"),("/pentru-cine/freelanceri/","Freelanceri")]),
    ("AiVenture",       [("/despre/","Despre"),("/eu-ai-act-ready/","EU AI Act Ready"),("/preturi/","Prețuri"),("/resurse/","Resurse"),
                         ("/tehnologie/","Tehnologie"),("/faq/","Întrebări"),("/contact/","Contact"),("/legal/","Legal & GDPR")]),
]

HEAD = """<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{base}{path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="AiVenture">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{base}{path}">
<meta property="og:locale" content="ro_RO">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css">
<script type="application/ld+json">{jsonld}</script>
</head>
<body>
<div class="statusbar"><div class="wrap">
  <span>AIVENTURE · AI PENTRU FIRMA TA</span>
  <span>ROMÂNIA · WEB → AI → AGENȚI</span>
  <span class="ver">{version}</span>
  <span class="clock">--.--.---- --:--:--</span>
</div></div>

<header><div class="wrap">
  <a class="logo" href="/">Ai<em>Venture</em></a>
  <button class="navtoggle" aria-expanded="false" aria-label="Meniu">☰</button>
  <nav>
    {nav}
    <select class="langsel" aria-label="Limbă">
      <option value="ro" selected>RO</option>
      <option value="en">EN</option>
      <option value="fr">FR</option>
    </select>
    <a class="btn btn-primary btn-sm" href="/verifica/">VERIFICĂ FIRMA</a>
  </nav>
</div></header>
"""

FOOTER = """
<footer><div class="wrap">
  <p class="footquote">Nu trebuie să devii o companie AI. Trebuie să faci compania ta pregătită
  pentru lumea în care AI-ul o poate descoperi, înțelege, recomanda și utiliza.</p>
  <div class="footgrid">{cols}</div>
  <div class="footbottom">
    <span>© 2026 AiVenture S.R.L. · CUI 51415878 · București</span>
    <span>WEB → AI → AGENȚI → A2A</span>
  </div>
</div></footer>
<script src="/assets/site.js"></script>
</body></html>
"""

ORG   = BASE + "/#organization"
SITE  = BASE + "/#website"
ADDR  = BASE + "/#address"
CPOINT= BASE + "/#contactpoint"
LOGO  = BASE + "/#logo"
CATALOG = BASE + "/#offercatalog"

SERVICES = [
  ("ai-lens","AI LENS","Diagnostic: cum apare firma în răspunsurile sistemelor AI","/solutii/ai-lens/"),
  ("ai-audit","AI AUDIT","Analiza semnalelor lipsă sau contradictorii despre firmă","/solutii/ai-audit/"),
  ("ai-ready","AI READY","Structurarea informației firmei pentru sisteme AI","/solutii/ai-ready/"),
  ("ai-edge","AI EDGE","Stratul AI adăugat fără reconstruirea site-ului","/solutii/ai-edge/"),
  ("agent-ready","AGENT READY","Expunerea capabilităților firmei pentru agenți AI","/solutii/agent-ready/"),
  ("a2a-ready","A2A READY","Interoperabilitate agent-to-agent","/solutii/a2a/"),
  ("eu-ai-act-ready","EU AI ACT READY","Pregătirea documentară pentru Regulamentul european privind AI","/eu-ai-act-ready/"),
]

def crumbs_for(path):
    """[(url, label)] fără Acasă duplicat; ultimul = pagina curentă."""
    out = [("/", "Acasă")]
    if path == "/":
        return out
    parts = [x for x in path.strip("/").split("/") if x]
    acc = ""
    for i, seg in enumerate(parts):
        acc += "/" + seg
        out.append((acc + "/", CRUMB_LABEL.get(acc + "/", seg.replace("-", " ").capitalize())))
    return out

def breadcrumb_html(path):
    c = crumbs_for(path)
    if len(c) < 2:
        return ""
    items = []
    for i, (u, l) in enumerate(c):
        if i == len(c) - 1:
            items.append('<span aria-current="page">%s</span>' % l)
        else:
            items.append('<a href="%s">%s</a>' % (u, l))
    return ('<nav class="crumbs" aria-label="Breadcrumb"><div class="wrap">%s</div></nav>'
            % ' <span class="sep">/</span> '.join(items))

def faq_for(path, title):
    """19 întrebări per pagină: specifice dacă există, altfel contextualizate."""
    if path in FAQ:
        return FAQ[path][:19]
    topic = TOPIC.get(path, title.split("|")[0].strip())
    specific = [
      ("Ce rezolvă %s?" % topic, "Răspunde la o singură întrebare din traseul firmei tale în era AI, iar restul treptelor rămân separate."),
      ("Pentru cine este %s?" % topic, "Pentru firme care au trecut de treapta anterioară și au nevoie de următorul pas, nu de tot pachetul deodată."),
      ("Este %s obligatoriu?" % topic, "Nu. Fiecare treaptă are sens doar dacă cea de dinaintea ei este acoperită."),
      ("Ce primesc concret?", "Un rezultat pe care îl poți verifica: raport, documentație sau infrastructură livrată, în funcție de treaptă."),
      ("Cum știu dacă am nevoie acum?", "Verificarea gratuită îți arată la ce nivel ești și dacă această treaptă este cea potrivită."),
    ]
    return (specific + GENERIC)[:19]

def faq_html(items):
    rows = "".join('<details><summary><h3>%s</h3></summary><p>%s</p></details>' % (q, a) for q, a in items)
    return ('<section id="intrebari"><div class="wrap"><h2>Întrebări frecvente</h2>'
            '<p class="muted">19 întrebări la care răspundem despre această etapă.</p>'
            '<div style="margin-top:26px">%s</div></div></section>' % rows)

def graph(path, title, desc, faqs):
    """@graph cu ~40 de noduri: entități, navigație, breadcrumb, servicii, FAQ."""
    g = []
    # 1 Organization
    g.append({"@type":"Organization","@id":ORG,"name":"AiVenture S.R.L.","alternateName":"AiVenture",
      "url":BASE+"/","logo":{"@id":LOGO},"slogan":"AI pentru firma ta",
      "description":"Operator român care pregătește firmele pentru tranziția Web → AI → Agenți.",
      "identifier":[{"@type":"PropertyValue","name":"CUI","value":"51415878"},
                    {"@type":"PropertyValue","name":"EUID","value":"ROONRC.J2025016406000"}],
      "address":{"@id":ADDR},"contactPoint":{"@id":CPOINT},"areaServed":{"@type":"Country","name":"România"},
      "knowsLanguage":["ro","en","fr"],"hasOfferCatalog":{"@id":CATALOG}})
    # 2 PostalAddress
    g.append({"@type":"PostalAddress","@id":ADDR,"addressCountry":"RO","addressLocality":"București",
      "addressRegion":"Sectorul 1","streetAddress":"Drumul Pădurea Pustnicu 141C, Corp A, Etaj 2, Ap. 5"})
    # 3 ContactPoint
    g.append({"@type":"ContactPoint","@id":CPOINT,"contactType":"sales","availableLanguage":["ro","en","fr"],
      "areaServed":"RO","url":BASE+"/contact/"})
    # 4 ImageObject (logo)
    g.append({"@type":"ImageObject","@id":LOGO,"url":BASE+"/assets/logo.png","caption":"AiVenture"})
    # 5 WebSite
    g.append({"@type":"WebSite","@id":SITE,"url":BASE+"/","name":"AiVenture","inLanguage":"ro-RO",
      "publisher":{"@id":ORG},
      "potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint",
        "urlTemplate":BASE+"/verifica/?domain={search_term_string}"},"query-input":"required name=search_term_string"}})
    # 6 WebPage
    g.append({"@type":"WebPage","@id":BASE+path+"#webpage","url":BASE+path,"name":title,
      "description":desc,"inLanguage":"ro-RO","isPartOf":{"@id":SITE},"about":{"@id":ORG},
      "breadcrumb":{"@id":BASE+path+"#breadcrumb"},"primaryImageOfPage":{"@id":LOGO},
      "speakable":{"@type":"SpeakableSpecification","cssSelector":["h1",".lead"]}})
    # 7 BreadcrumbList
    cl = crumbs_for(path)
    g.append({"@type":"BreadcrumbList","@id":BASE+path+"#breadcrumb",
      "itemListElement":[{"@type":"ListItem","position":i+1,"name":l,"item":BASE+u}
                         for i,(u,l) in enumerate(cl)]})
    # 8 SiteNavigationElement
    g.append({"@type":"SiteNavigationElement","@id":BASE+"/#nav","name":[l for _,l in NAV],
      "url":[BASE+h for h,_ in NAV]})
    # 9 OfferCatalog
    g.append({"@type":"OfferCatalog","@id":CATALOG,"name":"Scara AiVenture","inLanguage":"ro-RO",
      "itemListElement":[{"@id":BASE+u+"#service"} for _,_,_,u in SERVICES]})
    # 10-16 Service ×7
    for sid,nm,sd,su in SERVICES:
        g.append({"@type":"Service","@id":BASE+su+"#service","name":nm,"description":sd,
          "serviceType":nm,"url":BASE+su,"provider":{"@id":ORG},
          "areaServed":{"@type":"Country","name":"România"},"inLanguage":"ro-RO"})
    # Brand
    g.append({"@type":"Brand","@id":BASE+"/#brand","name":"AiVenture","slogan":"AI pentru firma ta",
      "url":BASE+"/","logo":{"@id":LOGO}})
    # WebPageElement — blocul de FAQ
    g.append({"@type":"WebPageElement","@id":BASE+path+"#faqblock","name":"Întrebări frecvente",
      "cssSelector":"#intrebari","isPartOf":{"@id":BASE+path+"#webpage"}})
    # 17 ItemList — scara de maturitate
    g.append({"@type":"ItemList","@id":BASE+"/#maturitate","name":"Nivelurile de maturitate AI",
      "itemListOrder":"https://schema.org/ItemListOrderAscending",
      "itemListElement":[{"@type":"ListItem","position":i+1,"name":n,"description":q}
        for i,(n,q) in enumerate([
          ("Vizibilă","AI-ul găsește firma ta?"),
          ("Înțeleasă","AI-ul înțelege și recomandă firma ta?"),
          ("Acționabilă","Poate un agent să lucreze cu firma ta?"),
          ("A2A","Pot agenții să comunice între ei?")])]})
    # 18 HowTo — traseul clientului
    g.append({"@type":"HowTo","@id":BASE+"/#traseu","name":"Cum urci o treaptă de maturitate AI",
      "inLanguage":"ro-RO","step":[{"@type":"HowToStep","position":i+1,"name":n,"text":t}
        for i,(n,t) in enumerate([
          ("Află","Verifici ce știe AI-ul despre firmă."),
          ("Înțelege","Identifici ce lipsește sau ce se contrazice."),
          ("Pregătește","Pui informația în ordine."),
          ("Acționează","Expui capabilitățile pentru agenți."),
          ("Conectează","Pregătești comunicarea între agenți.")])]})
    # 19 FAQPage
    g.append({"@type":"FAQPage","@id":BASE+path+"#faq","inLanguage":"ro-RO",
      "isPartOf":{"@id":BASE+path+"#webpage"},
      "mainEntity":[{"@id":BASE+path+"#q%d" % (i+1)} for i in range(len(faqs))]})
    # 20-38 Question ×19
    for i,(q,a) in enumerate(faqs):
        g.append({"@type":"Question","@id":BASE+path+"#q%d" % (i+1),"name":q,"position":i+1,
          "acceptedAnswer":{"@type":"Answer","text":a}})
    return json.dumps({"@context":"https://schema.org","@graph":g}, ensure_ascii=False)

def page(path, title, desc, body):
    nav = "\n    ".join(
        '<a href="%s"%s>%s</a>' % (h, ' aria-current="page"' if path.startswith(h) and h != "/" else "", l)
        for h, l in NAV)
    cols = "".join(
        '<div><h4>%s</h4>%s</div>' % (h, "".join('<a href="%s">%s</a>' % (u, l) for u, l in ls))
        for h, ls in FOOT)
    faqs = faq_for(path, title)
    html = (HEAD.format(title=title, desc=desc, base=BASE, path=path, nav=nav, version=VERSION,
                        jsonld=graph(path, title, desc, faqs))
            + breadcrumb_html(path) + body + faq_html(faqs) + FOOTER.format(cols=cols))
    d = os.path.join(OUT, path.strip("/"))
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    return path

def hero(eyebrow, h1, tagline, lead, ctas=True, secondary=None):
    s = '<section class="hero"><div class="wrap">'
    if eyebrow: s += '<div class="eyebrow">%s</div>' % eyebrow
    s += "<h1>%s</h1>" % h1
    if tagline: s += '<p class="tagline">%s</p>' % tagline
    if lead: s += '<p class="lead center">%s</p>' % lead
    if ctas:
        s += '<div class="cta-row"><a class="btn btn-primary" href="/verifica/">VERIFICĂ FIRMA GRATUIT</a>'
        if secondary: s += '<a class="btn btn-ghost" href="%s">%s</a>' % secondary
        s += "</div>"
    s += '<div class="flow">WEB → AI → AGENȚI</div></div></section>'
    return s

def sec(inner, cls=""):
    return '<section%s><div class="wrap">%s</div></section>' % (
        ' class="%s"' % cls if cls else "", inner)

def cards(items, cols=3):
    c = "".join(
        '<a class="card link" href="%s"><h3>%s</h3><p class="muted small">%s</p>%s</a>'
        % (u, t, d, ('<p class="q">%s</p>' % q) if q else "")
        for t, d, q, u in items)
    return '<div class="grid g%d">%s</div>' % (cols, c)

# --------------------------------------------------------------- PAGES
P = []

# ============ HOME ============
P.append(page("/", "AiVenture — AI pentru firma ta",
  "Unde este firma ta în Era AI? Verifică gratuit dacă AI-ul găsește, înțelege și poate recomanda firma ta.",
  hero("LINIA DE ORIENTARE PENTRU FIRME ÎN ERA AI",
       "Unde este firma ta în Era <em>AI</em>?",
       "AI pentru firma ta.",
       "De la a fi găsită pe Google, la a fi înțeleasă, recomandată și pregătită pentru agenți AI.",
       secondary=("/exemplu-ecbtax/", "Vezi demo (ECBTAX)"))
+ '<div class="band">⚡ AI LENS — află în 2 minute ce știe AI-ul despre firma ta · <a href="/verifica/">Verifică gratuit →</a></div>'

+ sec('<div class="center"><h2>Firma ta, în <em>bucla</em> AI</h2>'
      '<p class="lead center">Cine intervine, în ce ordine, și ce câștigi la fiecare pas.</p></div>'
      '<div class="loop">'
      '<div class="loop-row mine">'
      '  <div class="loop-who"><span class="loop-n">1</span><b>AiVenture</b>'
      '  <span class="loop-tag">pregătește firma</span></div>'
      '  <div class="loop-arrow">→</div>'
      '  <div class="loop-gain">Firma devine <b>inteligibilă</b> pentru sisteme AI'
      '  <a class="loop-how" href="/cum/">vezi cum →</a></div>'
      '</div>'
      '<div class="loop-row">'
      '  <div class="loop-who"><span class="loop-n">2</span><b>Google</b>'
      '  <span class="loop-tag">o face descoperibilă</span></div>'
      '  <div class="loop-arrow">→</div>'
      '  <div class="loop-gain">Firma poate fi <b>găsită</b> de client'
      '  <a class="loop-how" href="/cum/descoperire/">vezi cum →</a></div>'
      '</div>'
      '<div class="loop-row">'
      '  <div class="loop-who"><span class="loop-n">3</span><b>AI</b>'
      '  <span class="loop-tag">o înțelege, compară, recomandă</span></div>'
      '  <div class="loop-arrow">→</div>'
      '  <div class="loop-gain">Firma ajunge în <b>răspunsul</b> către client'
      '  <a class="loop-how" href="/cum/intelegere/">vezi cum →</a></div>'
      '</div>'
      '<div class="loop-row">'
      '  <div class="loop-who"><span class="loop-n">4</span><b>Agent</b>'
      '  <span class="loop-tag">acționează</span></div>'
      '  <div class="loop-arrow">→</div>'
      '  <div class="loop-gain">Firma <b>primește și procesează</b> solicitări'
      '  <a class="loop-how" href="/cum/actiune/">vezi cum →</a></div>'
      '</div>'
      '<div class="loop-row">'
      '  <div class="loop-who"><span class="loop-n">5</span><b>A2A</b>'
      '  <span class="loop-tag">agenții interacționează</span></div>'
      '  <div class="loop-arrow">→</div>'
      '  <div class="loop-gain">Firma intră în <b>procese orchestrate</b> de agenți'
      '  <a class="loop-how" href="/cum/a2a/">vezi cum →</a></div>'
      '</div>'
      '<div class="loop-base">AiVenture pregătește firma pentru <b>fiecare</b> dintre pașii de mai sus '
      '— nu doar pentru primul</div>'
      '</div>'
      '<p class="center muted" style="margin-top:26px;max-width:720px;margin-left:auto;margin-right:auto">'
      'Google și sistemele AI lucrează cu ce găsesc despre tine. Partea aceea nu o rezolvă ele. '
      'O rezolvi tu — înainte.</p>'
      '<div class="center" style="margin-top:24px"><a class="btn btn-primary" href="/verifica/">'
      'VEZI UNDE EȘTI ÎN BUCLĂ</a></div>')

+ sec('<div class="center"><h2>Ce s-a schimbat?</h2>'
      '<p class="lead center">Nu se schimbă doar tehnologia. Se schimbă modul în care ajunge clientul la firmă.</p></div>'
      '<div class="grid g3" style="margin-top:38px">'
      '<div class="card"><div class="eyebrow">IERI</div><h3>Clientul căuta</h3>'
      '<p class="muted small">„Caut o firmă de contabilitate în București.”</p>'
      '<p class="muted small" style="margin-top:10px">Google → rezultate → site-uri → comparație.</p></div>'
      '<div class="card"><div class="eyebrow">ASTĂZI</div><h3>Clientul întreabă</h3>'
      '<p class="muted small">„Recomandă-mi o firmă bună de contabilitate, HR și finanțe.”</p>'
      '<p class="muted small" style="margin-top:10px">AI → înțelege → compară → recomandă.</p></div>'
      '<div class="card"><div class="eyebrow">MÂINE</div><h3>Clientul deleagă</h3>'
      '<p class="muted small">„Găsește-mi o firmă, verifică dacă e potrivită și cere o ofertă.”</p>'
      '<p class="muted small" style="margin-top:10px">Agentul → caută → verifică → contactează → acționează.</p></div>'
      '</div>'
      '<p class="center gold" style="margin-top:34px;font-size:21px;font-family:var(--serif)">'
      'Poate AI-ul să găsească și să aleagă firma ta?</p>')

+ sec('<div class="center"><h2>Cine intervine și <em>când</em></h2>'
      '<p class="lead center">În ordine cronologică. AiVenture nu vine după Google și după AI — '
      'vine înaintea lor.</p></div>'
      '<table class="worlds"><thead><tr>'
      '<th class="mine">1 · AiVenture</th><th>2 · Google</th><th>3 · AI / Agenți</th>'
      '</tr></thead><tbody>'
      '<tr><td class="mine"><b>Te pregătește</b></td><td><b>Te găsește</b></td>'
      '<td><b>Te înțelege și acționează</b></td></tr>'
      '<tr><td class="mine muted">informație · entitate · servicii · interfețe</td>'
      '<td class="muted">Search · Maps · rezultate</td>'
      '<td class="muted">interpretare · comparație · recomandare · execuție</td></tr>'
      '<tr><td class="mine">Beneficiu: <span class="gold">să poți fi descoperit, înțeles, '
      'recomandat și utilizat</span></td>'
      '<td>Beneficiu: <span class="gold">vizibilitate</span></td>'
      '<td>Beneficiu: <span class="gold">relevanță și acțiune</span></td></tr>'
      '<tr><td class="mine muted">Firma devine inteligibilă pentru mașini</td>'
      '<td class="muted">Clientul găsește firma</td>'
      '<td class="muted">Clientul întreabă, iar agentul poate acționa</td></tr>'
      '</tbody></table>'
      '<pre class="dia" style="max-width:560px;margin:32px auto 0">'
      'AIVENTURE   →  pregătește firma\n'
      '     |\n     v\n'
      'GOOGLE      →  o face descoperibilă\n'
      '     |\n     v\n'
      'AI          →  o înțelege, compară și recomandă\n'
      '     |\n     v\n'
      'AGENT       →  acționează\n'
      '     |\n     v\n'
      'A2A         →  agenții interacționează</pre>'
      '<div class="triad" style="margin-top:34px">'
      '<p class="muted">Google te ajută să fii găsit.</p>'
      '<p class="muted">AI-ul te ajută să fii înțeles și comparat.</p>'
      '<p><strong>Dar amândouă lucrează cu ce găsesc despre tine. Partea aceea o pregătim noi — '
      'înainte.</strong></p>'
      '<p class="gold" style="font-family:var(--mono);font-size:13px;letter-spacing:.16em;margin-top:16px">PREGĂTIT → GĂSIT → ÎNȚELES → RECOMANDAT → ACȚIONABIL</p>'
      '</div>'
      '<div class="center" style="margin-top:26px"><a class="btn btn-ghost" href="/de-ce-ai/">'
      'VEZI LANȚUL COMPLET, PE 8 ETAPE →</a></div>')

+ sec('<div class="center"><div class="eyebrow">DE CE ABIA ACUM</div>'
      '<h2>Acum un an, asta nu se <em>putea</em></h2>'
      '<p class="lead center">Nu e o idee nouă care așteaptă tehnologia. Este exact invers: '
      'tehnologia a ajuns, iar pasul acesta a devenit posibil abia acum.</p></div>'
      '<div class="grid g2" style="margin-top:34px">'
      + "".join('<div class="card"><div class="eyebrow">%s</div><h3>%s</h3>'
                '<h4 class="gold">%s</h4><p class="muted small">%s</p></div>' % c for c in [
        ("ACUM UN AN", "Nu puteai afla ce spune AI-ul despre firma ta",
         "Azi: se poate măsura",
         "Nu exista o metodă de a interoga sistematic mai multe sisteme AI despre o firmă. "
         "Astăzi analiza rulează automat, pe zeci de semnale, și produce un rezultat repetabil."),
        ("ACUM UN AN", "Nu existau protocoale între agenți",
         "Azi: agenții își descoperă capabilitățile",
         "Un agent nu avea cum să afle ce poate face o firmă. Astăzi există standarde prin care "
         "un agent publică ce știe să facă, iar altul îl poate găsi și apela."),
        ("ACUM UN AN", "Trebuia să-ți reconstruiești site-ul",
         "Azi: stratul se adaugă la edge",
         "Orice schimbare de infrastructură cerea o refacere a site-ului. Astăzi stratul de "
         "semnale se livrează separat de conținut, fără să atingi ce ai."),
        ("ACUM UN AN", "Documentația se scria luni la rând",
         "Azi: se generează și se verifică la distanță",
         "Un set complet de documentație internă era muncă de luni. Astăzi se generează "
         "completat, cu amprentă criptografică pe fiecare piesă și verificare la distanță.")])
      + '</div>'
      '<p class="center gold" style="margin-top:32px;font-family:var(--serif);font-size:20px;max-width:760px;margin-left:auto;margin-right:auto">'
      'Fereastra asta nu rămâne deschisă. Cine intră acum construiește avantajul; '
      'cine intră peste doi ani recuperează un decalaj.</p>')

+ sec('<div class="center"><h2>Cele trei întrebări</h2></div>'
      '<div class="grid g3" style="margin-top:36px">'
      '<a class="card link" href="/niveluri/#nivel-1"><h3><span class="dot d1"></span>AI-ul găsește firma ta?</h3>'
      '<p class="muted small">Google te-a făcut vizibil. Dar te găsesc și ChatGPT, Gemini sau Perplexity?</p>'
      '<p class="q">→ AiVenture o face vizibilă.</p></a>'
      '<a class="card link" href="/niveluri/#nivel-2"><h3><span class="dot d2"></span>AI-ul înțelege și recomandă firma ta?</h3>'
      '<p class="muted small">Știe ce faci, pentru cine, ce te diferențiază și de ce ar avea încredere?</p>'
      '<p class="q">→ AiVenture o face ușor de înțeles.</p></a>'
      '<a class="card link" href="/niveluri/#nivel-3"><h3><span class="dot d3"></span>Poate un agent să lucreze cu firma ta?</h3>'
      '<p class="muted small">Poate cere o ofertă, verifica disponibilitatea, porni un proces comercial?</p>'
      '<p class="q">→ AiVenture o face pregătită pentru acțiune.</p></a>'
      '</div>'
      '<div class="center" style="margin-top:32px"><a class="btn btn-ghost" href="/niveluri/">AFLĂ NIVELUL FIRMEI TALE →</a></div>')

+ sec('<div class="center"><div class="eyebrow">AI LENS™ · PRODUSUL DE INTRARE</div>'
      '<h2>Nu ghici. <em>Măsoară.</em></h2>'
      '<p class="lead center">Introdu website-ul firmei și vezi ce știe AI-ul despre ea.</p>'
      '<form class="lensform" data-lens><input type="text" placeholder="firma-ta.ro" aria-label="Website" required>'
      '<button class="btn btn-primary" type="submit">VERIFICĂ</button></form></div>'
      '<div class="scorebox" style="margin-top:44px"><span class="badge">Exemplu — înlocuiește cu un snapshot real AUDIT-AI</span>'
      + "".join('<div class="scorerow"><span>%s</span><b>%s</b></div>' % r for r in [
          ("AI-ul te găsește","82%"),("Înțelege ce faci","64%"),("Înțelege pentru cine lucrezi","71%"),
          ("Are motive să te recomande","43%"),("Pregătită pentru agenți","18%")])
      + '</div>'
      '<p class="center muted small" style="margin-top:14px;font-family:var(--mono)">'
      'Scanare AUDIT-AI · sisteme verificate: ChatGPT · Gemini · Perplexity · Google AI · snapshot la data scanării</p>'
      '<p class="center muted" style="margin-top:26px;font-style:italic;max-width:640px;margin-left:auto;margin-right:auto">'
      'Problema nu este că firma ta nu există. Problema poate fi că AI-ul nu o înțelege suficient de bine.</p>')

+ sec('<div class="center"><div class="eyebrow">DEMONSTRAȚIE VIE</div>'
      '<h2>ECBTAX — o firmă <em>reală</em></h2>'
      '<p class="lead center">Contabilitate · Fiscalitate · HR · Finanțe</p></div>'
      '<div class="card" style="max-width:780px;margin:34px auto 0">'
      '<p class="muted" style="font-style:italic">Un client întreabă AI-ul:</p>'
      '<p style="font-size:19px;margin-top:10px">„Am o firmă în România și caut un partener care să mă ajute cu '
      'contabilitatea, fiscalitatea, HR-ul și partea financiară. Ce firme sunt potrivite?”</p>'
      '<pre class="dia" style="margin-top:24px">CE ȘTIE AI-UL DESPRE ECBTAX\n\n'
      '  ✓ contabilitate      ✓ fiscalitate\n  ✓ HR                 ✓ finanțe\n\n'
      '  ? ce o diferențiază  ? ce dovezi există</pre></div>'
      '<p class="center" style="margin-top:28px;font-family:var(--serif);font-size:20px">'
      'Uite o firmă reală. Acum vezi ce trebuie să știe AI-ul despre ea.</p>'
      '<div class="center" style="margin-top:22px"><a class="btn btn-ghost" href="/exemplu-ecbtax/">VEZI DEMONSTRAȚIA →</a></div>'
      '<p class="center muted small" style="margin-top:16px;font-family:var(--mono)">PARTENER AIVENTURE · ECBTAX.COM</p>')

+ sec('<div class="center"><h2>Nu vinzi AI. Urci o <em>treaptă</em>.</h2></div>'
      '<div class="steps" style="margin-top:34px">'
      + "".join('<div class="step"><b>%s</b><span class="gold">%s</span><span class="muted">%s</span></div>' % s for s in [
          ("① AFLĂ","AI LENS","Unde ești?"),("② ÎNȚELEGE","AI AUDIT","Ce lipsește?"),
          ("③ PREGĂTEȘTE","AI READY","Ce trebuie reparat?"),("④ ACȚIONEAZĂ","AGENT READY","Ce poate face AI-ul cu firma?"),
          ("⑤ CONECTEAZĂ","A2A READY","Cum comunică agenții?")])
      + '</div>'
      '<p class="center muted" style="margin-top:28px;font-style:italic">AiVenture nu îți cere să reconstruiești firma. '
      'Construim stratul AI peste ce ai deja.</p>')

+ sec('<div class="center"><h2>Nu știi în ce etapă este firma ta?</h2>'
      '<p class="lead center">Nu trebuie să înțelegi AI, LLM, MCP sau A2A. Începe cu o întrebare simplă: '
      '<em class="gold">Ce poate afla AI-ul despre firma mea?</em></p>'
      '<div class="cta-row"><a class="btn btn-primary" href="/verifica/">VERIFICĂ FIRMA GRATUIT</a></div></div>')
))

# ============ NIVELURI ============
P.append(page("/niveluri/", "Nivelurile AI — unde este firma ta | AiVenture",
  "Cele trei niveluri de maturitate AI pentru o firmă: vizibilă, înțeleasă, acționabilă — plus etapa A2A.",
  hero("MATURITATE AI", "Cele trei <em>niveluri</em>", "",
       "Nu trebuie să sari la nivelul 3. Trebuie să știi unde ești.")
+ sec('<h2>Cine intervine, în ce ordine</h2>'
      '<p class="lead">AiVenture nu este „nivelul 1” după care ne retragem. Este stratul care '
      'face posibile toate celelalte.</p>'
      '<div style="overflow-x:auto;margin-top:26px">'
      '<table class="chain"><thead><tr><th>Etapa</th><th class="mine">AiVenture</th><th>Google</th>'
      '<th>OpenAI / AI</th><th>Beneficiul pentru firmă</th></tr></thead><tbody>'
      + "".join('<tr><td><b>%s</b></td><td class="mine">%s</td><td class="muted">%s</td>'
                '<td class="muted">%s</td><td class="gold">%s</td></tr>' % r for r in [
        ("1. Pregătire","Pregătește informația, entitatea și serviciile firmei pentru ecosistemul AI",
         "—","—","Firma devine inteligibilă pentru sisteme AI"),
        ("2. Descoperire","Optimizează disponibilitatea informației firmei pentru AI",
         "Te găsește prin Search, Maps etc.","Poate descoperi informații despre firmă",
         "Firma poate fi găsită de client"),
        ("3. Înțelegere","Structurează și clarifică informația firmei",
         "Interpretează conținutul pentru Search","Te înțelege și sintetizează informația",
         "AI-ul poate identifica corect ce face firma"),
        ("4. Comparare","Face diferențiatorii și dovezile mai clare",
         "Oferă rezultate și alternative","Te compară cu alte opțiuni",
         "Firma poate deveni relevantă într-o selecție"),
        ("5. Recomandare","Pregătește semnalele care susțin recomandarea",
         "Poate contribui prin vizibilitatea din Search","Te poate recomanda pentru o nevoie concretă",
         "Firma poate ajunge în răspunsul AI către client"),
        ("6. Acțiune","Pregătește servicii, procese, interfețe și permisiuni",
         "—","Agentul poate acționa folosind instrumente și workflow-uri",
         "AI-ul trece de la răspuns la acțiune"),
        ("7. Agent ↔ firmă","Construiește interfața agentului firmei",
         "—","Agentul clientului interacționează cu agentul firmei",
         "Firma poate primi și procesa solicitări de la agenți"),
        ("8. A2A","Pregătește comunicarea Agent ↔ Agent",
         "—","Ecosistemul agentic",
         "Firma poate participa la procese comerciale orchestrate de agenți")])
      + '</tbody></table></div>'
      '<h3 style="margin-top:32px">Nuanța care contează</h3>'
      '<p class="muted">Coloana AiVenture nu este goală pe nicio linie. Coloanele Google și AI au '
      'liniuțe — nu ca reproș, ci pentru că ele nu acoperă tot lanțul și nici nu au cum. '
      'Pregătirea este transversală: intervine înainte de fiecare etapă și continuă în timpul ei.</p>'
      '<pre class="dia" style="max-width:560px;margin:28px auto 0">'
      'AIVENTURE   →  pregătește firma\n     |\n     v\n'
      'GOOGLE      →  o face descoperibilă\n     |\n     v\n'
      'AI          →  o înțelege, compară și recomandă\n     |\n     v\n'
      'AGENT       →  acționează\n     |\n     v\n'
      'A2A         →  agenții interacționează</pre>')
+ sec('<div id="nivel-1" class="card"><div class="eyebrow"><span class="dot d1"></span>NIVELUL 1</div>'
      '<h2>Firma este vizibilă</h2>'
      '<p class="muted">Google o găsește. Are website, informații, prezență online. Informația este gândită pentru oameni.</p>'
      '<p class="q" style="font-size:19px">Întrebarea: „Mă găsește și AI-ul?”</p>'
      '<p class="muted small" style="margin-top:14px">Ce verificăm: dacă ChatGPT, Gemini, Perplexity și Google AI știu că exiști, '
      'ce spun despre serviciile tale, dacă identifică corect regiunea în care lucrezi.</p>'
      '<p style="margin-top:16px"><a class="btn btn-ghost btn-sm" href="/solutii/ai-lens/">AI LENS →</a></p></div>'

      '<div id="nivel-2" class="card" style="margin-top:22px"><div class="eyebrow"><span class="dot d2"></span>NIVELUL 2</div>'
      '<h2>Firma este înțeleasă</h2>'
      '<p class="muted">AI-ul știe cine ești, ce faci și pentru cine. Poate compara informațiile și înțelege când firma este potrivită.</p>'
      '<p class="q" style="font-size:19px">Întrebarea: „Mă poate recomanda AI-ul?”</p>'
      '<p class="muted small" style="margin-top:14px">Ce construim: informație coerentă, verificabilă, cu dovezi — '
      'astfel încât AI-ul să aibă motive să te includă în răspuns.</p>'
      '<p style="margin-top:16px"><a class="btn btn-ghost btn-sm" href="/solutii/ai-ready/">AI READY →</a></p></div>'

      '<div id="nivel-3" class="card" style="margin-top:22px"><div class="eyebrow"><span class="dot d3"></span>NIVELUL 3</div>'
      '<h2>Firma este acționabilă</h2>'
      '<p class="muted">Un agent AI poate interacționa cu firma: poate solicita informații, cere o ofertă, programa, '
      'transmite o cerere sau începe un proces.</p>'
      '<p class="q" style="font-size:19px">Întrebarea: „Poate un agent să facă ceva cu firma mea?”</p>'
      '<p style="margin-top:16px"><a class="btn btn-ghost btn-sm" href="/solutii/agent-ready/">AGENT READY →</a></p></div>'

      '<div id="a2a" class="card" style="margin-top:22px"><div class="eyebrow"><span class="dot d4"></span>URMĂTOAREA ETAPĂ</div>'
      '<h2>Agent ↔ Agent</h2>'
      '<p class="muted">Agentul clientului comunică direct cu agentul firmei.</p>'
      '<p class="q" style="font-size:19px">Întrebarea: „Poate firma mea să lucreze cu agenții AI ai clienților și partenerilor?”</p>'
      '<p class="muted small" style="margin-top:14px">Aceasta este destinația, nu punctul de plecare.</p>'
      '<p style="margin-top:16px"><a class="btn btn-ghost btn-sm" href="/solutii/a2a/">A2A READY →</a></p></div>')
+ sec('<div class="center"><h2>Nu ești sigur unde ești?</h2>'
      '<div class="cta-row"><a class="btn btn-primary" href="/verifica/">FĂ VERIFICAREA GRATUITĂ</a></div></div>')
))

# ============ SOLUTII HUB ============
P.append(page("/solutii/", "Soluții — scara AiVenture | AiVenture",
  "AI LENS, AI AUDIT, AI READY, AI EDGE, AGENT READY, A2A READY — treptele de maturitate AI ale firmei tale.",
  hero("SCARA AIVENTURE", "De la diagnostic la <em>infrastructură</em>", "",
       "Nu un catalog de module. O singură scară, cu trepte în ordine.")
+ sec(cards([
    ("AI LENS","Unde ești? Scanare a firmei în ChatGPT, Gemini și Perplexity.","① AFLĂ","/solutii/ai-lens/"),
    ("AI AUDIT","De ce? Ce informații lipsesc sau se contrazic.","② ÎNȚELEGE","/solutii/ai-audit/"),
    ("AI READY","Punem informația în ordine pentru AI.","③ PREGĂTEȘTE","/solutii/ai-ready/"),
    ("AI EDGE","Stratul AI fără să-ți reconstruiești site-ul.","③b ACCELEREAZĂ","/solutii/ai-edge/"),
    ("AGENT READY","De la informație la acțiune.","④ ACȚIONEAZĂ","/solutii/agent-ready/"),
    ("A2A READY","Când agenții încep să vorbească între ei.","⑤ CONECTEAZĂ","/solutii/a2a/"),
  ]))
))

# ============ SOLUTION PAGES ============
SOL = [
 ("/solutii/ai-lens/","AI LENS","Cum te vede <em>AI-ul</em>?",
  "AI LENS verifică modul în care firma ta apare în răspunsurile generate de sistemele AI — și îți spune exact ce trebuie reparat.",
  ["Scanare în ChatGPT, Gemini, Perplexity și Google AI","Raport de vizibilitate cu scor pe dimensiuni",
   "Acuratețea descrierii: ce spune AI-ul corect despre tine","Serviciile identificate vs. serviciile reale",
   "Informațiile lipsă și pașii prioritari de îmbunătățire"],
  "VERIFICĂ ACUM","/verifica/",
  "structured data · entități · consistența informației"),

 ("/solutii/ai-audit/","AI AUDIT","Ce <em>nu</em> înțelege AI-ul despre tine?",
  "De la „AI-ul nu mă vede” la „acestea sunt exact semnalele lipsă”.",
  ["Inventariem informația firmei","Găsim contradicțiile dintre surse",
   "Identificăm ce lipsește","Stabilim prioritatea de reparat","Raport cu pași concreți"],
  "CERE AUDITUL","/contact/",
  "signal inventory · entity consistency · knowledge graph · LLM interpretability"),

 ("/solutii/ai-ready/","AI READY","Fă-ți firma <em>inteligibilă</em> pentru AI",
  "Punem în ordine informația importantă despre firma ta, astfel încât sistemele AI să o poată găsi, înțelege și verifica mai ușor.",
  ["Corectăm datele despre firmă","Construim entități clare",
   "Creăm baza de cunoștințe","Deschidem accesul pentru AI crawlers","Asigurăm consistența informației"],
  "DEVINO AI-READY","/contact/",
  "Schema.org · JSON-LD · llms.txt · knowledge layer"),

 ("/solutii/ai-edge/","AI EDGE","Adaugă stratul AI fără să-ți <em>reconstruiești</em> site-ul",
  "1-Click AI EDGE Injector. Păstrezi website-ul. Adăugăm infrastructura.",
  ["Nu atingem site-ul existent","Stratul AI se adaugă la nivel de edge",
   "Funcționează cu orice CMS","Poate fi dezactivat oricând","Fricțiune minimă de adopție"],
  "VEZI CUM FUNCȚIONEAZĂ","/contact/",
  "Cloudflare Workers · edge injection · signal delivery"),

 ("/solutii/agent-ready/","AGENT READY","Este firma ta pregătită pentru <em>agenți</em> AI?",
  "Chatbot ≠ Agent. Chatbotul răspunde. Agentul acționează.",
  ["Interfețe pentru serviciile firmei","Automatizări de proces",
   "Permisiuni și control","Jurnal de audit","Human-in-the-Loop"],
  "CONSTRUIEȘTE INTERFAȚA AGENT","/contact/",
  "API endpoints · MCP · workflow automation · provenance"),

 ("/solutii/a2a/","A2A READY","Când agenții încep să vorbească <em>între ei</em>",
  "Agentul clientului comunică direct cu agentul firmei tale. Aceasta este destinația, nu punctul de plecare.",
  ["Identitate de agent","Protocoale de comunicare",
   "Permisiuni de acțiune","Verificare și audit","Human-in-the-Loop pentru decizii"],
  "DISCUTĂ DESPRE A2A","/contact/",
  "A2A · agent card · capability discovery"),
]
for path, eyebrow, h1, lead, items, cta, ctahref, tech in SOL:
    body = hero(eyebrow, h1, "", lead, ctas=False)
    body += sec('<div class="center"><h2>Ce facem</h2></div>'
        '<div class="grid g2" style="margin-top:30px">'
        + "".join('<div class="card"><h3 class="gold">%02d</h3><p>%s</p></div>' % (i+1, t)
                  for i, t in enumerate(items))
        + '</div>'
        '<div class="center" style="margin-top:36px"><a class="btn btn-primary" href="%s">%s</a></div>'
        '<p class="center muted small" style="margin-top:24px;font-family:var(--mono)">%s</p>' % (ctahref, cta, tech))
    body += sec('<div class="center"><p class="lead center">Nu ești sigur că e treapta potrivită pentru tine acum?</p>'
        '<div class="cta-row"><a class="btn btn-ghost" href="/niveluri/">VEZI TOATE NIVELURILE →</a></div></div>')
    P.append(page(path, "%s | AiVenture" % eyebrow, lead, body))

# ============ VERIFICA ============
P.append(page("/verifica/", "Verifică firma gratuit | AiVenture",
  "Introdu website-ul firmei și află ce știe AI-ul despre ea. Verificare gratuită, fără cont.",
  hero("AI LENS™ · VERIFICARE GRATUITĂ", "Ce știe AI-ul despre <em>firma ta</em>?", "",
       "AI LENS verifică modul în care firma ta apare în răspunsurile generate de sistemele AI. Primești un raport despre vizibilitate, acuratețea descrierii, serviciile identificate, informațiile lipsă și pașii prioritari de îmbunătățire.", ctas=False)
+ sec('<form class="lensform" data-lens><input type="text" placeholder="firma-ta.ro" aria-label="Website" required>'
      '<button class="btn btn-primary" type="submit">VERIFICĂ</button></form>'
      '<div id="lens-result" class="scorebox" style="margin-top:34px;display:none"></div>'
      '<div class="center" style="margin-top:52px"><h2>Cele trei situații pe care le distingem</h2></div>'
      '<div class="grid g3" style="margin-top:24px">'
      '<div class="card"><h3 class="gold">Nu apari</h3><p class="muted small">AI-ul nu are nicio informație despre firmă. '
      'Problema este de descoperire.</p></div>'
      '<div class="card"><h3 class="gold">Apari greșit</h3><p class="muted small">AI-ul spune ceva despre firmă, dar '
      'incorect: alte servicii, altă regiune, confuzie cu o firmă similară.</p></div>'
      '<div class="card"><h3 class="gold">Apari incomplet</h3><p class="muted small">Informația este corectă, dar '
      'insuficientă ca AI-ul să aibă motive să te recomande.</p></div>'
      '</div>'
      '<div class="center" style="margin-top:52px"><h2>La ce răspundem</h2></div>'
      '<div class="grid g2" style="margin-top:26px">'
      + "".join('<div class="card"><p>%s</p></div>' % q for q in [
        "AI-ul găsește firma ta?","Înțelege ce faci?","Știe pentru cine lucrezi?",
        "Te poate diferenția de concurență?","Are dovezi să te considere de încredere?",
        "Te poate recomanda?","Poate un agent să interacționeze cu firma ta?"])
      + '</div>')
))

# ============ ECBTAX ============
P.append(page("/exemplu-ecbtax/", "ECBTAX — demonstrația AiVenture | AiVenture",
  "O firmă reală de contabilitate, fiscalitate, HR și finanțe. Vezi ce trebuie să știe AI-ul despre ea.",
  hero("DEMONSTRAȚIE VIE", "ECBTAX", "Contabilitate · Fiscalitate · HR · Finanțe",
       "Nu un case study. O firmă reală pe care poți vedea concret ce înseamnă trecerea de la Google la AI.", ctas=False)
+ sec('<div class="center"><h2>Întrebarea clientului</h2></div>'
      '<div class="card" style="max-width:760px;margin:26px auto 0">'
      '<p style="font-size:20px;font-family:var(--serif)">„Am o firmă în România și caut un partener care să mă ajute cu '
      'contabilitatea, fiscalitatea, HR-ul și partea financiară. Ce firme sunt potrivite?”</p></div>'
      '<pre class="dia" style="max-width:760px;margin:26px auto 0">'
      '           CLIENT\n             |\n             v\n        ÎNTREABĂ AI\n             |\n             v\n'
      '   +---------------------+\n   |    CE ȘTIE AI?      |\n   |                     |\n'
      '   |  ECBTAX             |\n   |  [x] contabilitate  |\n   |  [x] fiscalitate    |\n'
      '   |  [x] HR             |\n   |  [x] finanțe        |\n   |  [ ] diferențiere   |\n'
      '   |  [ ] dovezi         |\n   +----------+----------+\n              |\n              v\n'
      '         RECOMANDARE</pre>')
+ sec('<div class="center"><h2>Ce trebuie să știe AI-ul</h2></div>'
      '<div class="grid g4" style="margin-top:28px">'
      + "".join('<div class="card"><h3 class="gold">%s</h3></div>' % q for q in
        ["Cine este?","Ce servicii oferă?","Pentru cine?","Unde?",
         "Ce o diferențiază?","De ce ar fi potrivită?","Ce dovezi există?","Cum începe clientul?"])
      + '</div>')
+ sec('<div class="grid g2">'
      '<div class="card"><div class="eyebrow">ÎNAINTE</div><h3>Informația există</h3>'
      '<p class="muted">Website, servicii, articole, echipă, experiență — dar dispersate și gândite pentru oameni.</p></div>'
      '<div class="card"><div class="eyebrow">DUPĂ</div><h3>AI-ul poate construi o imagine clară</h3>'
      '<p class="muted">ECBTAX = contabilitate + fiscalitate + HR + finanțe pentru companii și antreprenori — '
      'și poate înțelege când este alegerea potrivită.</p></div></div>'
      '<p class="center gold" style="margin-top:32px;font-size:20px;font-family:var(--serif)">'
      'Nu inventăm informație. Facem informația existentă mai ușor de găsit și înțeles de AI.</p>')
+ sec('<div class="center"><h2>Vrei același lucru pentru <em>firma ta</em>?</h2>'
      '<div class="cta-row"><a class="btn btn-primary" href="/verifica/">VERIFICĂ FIRMA GRATUIT</a></div></div>')
))

# ============ REZULTATE ============
P.append(page("/rezultate/", "Rezultate — vezi diferența | AiVenture",
  "Format fix pentru fiecare caz: înainte, ce am descoperit, ce am făcut, după, următorul pas.",
  hero("REZULTATE", "Vezi <em>diferența</em>", "",
       "Același format pentru fiecare client, ca să fie comparabile între ele.", ctas=False)
+ sec('<div class="steps">'
      + "".join('<div class="step"><b>%s</b><span class="muted">%s</span></div>' % s for s in [
        ("ÎNAINTE","Ce găsește AI-ul azi despre firmă"),
        ("CE AM DESCOPERIT","Ce lipsește sau ce înțelege greșit"),
        ("CE AM FĂCUT","Ce am corectat și structurat"),
        ("DUPĂ","Ce poate înțelege AI-ul acum"),
        ("URMĂTORUL PAS","Ce devine posibil de aici")])
      + '</div>'
      '<div class="card" style="margin-top:34px"><div class="eyebrow">PRIMUL CAZ</div>'
      '<h3>ECBTAX — contabilitate, fiscalitate, HR, finanțe</h3>'
      '<p class="muted">Problema: informația există, dar trebuie să fie mai ușor de găsit și înțeles de AI. '
      'Ce facem: inventariem → verificăm → structurăm → pregătim.</p>'
      '<p style="margin-top:16px"><a class="btn btn-ghost btn-sm" href="/exemplu-ecbtax/">VEZI DEMONSTRAȚIA →</a></p></div>')
))

# ============ PENTRU CINE ============
PROFILES = [
 ("imm","IMM / B2B","Unde este firma mea și ce trebuie să fac acum?",
  "Vrei să știi dacă AI-ul îți vede firma și ce trebuie să faci pentru a nu rămâne în urmă. AiVenture îți arată unde ești și care este următorul pas."),
 ("contabilitate","Contabilitate · Fiscalitate · HR","Cum fac ca AI-ul să înțeleagă expertiza mea?",
  "Ai foarte multă expertiză. Problema este dacă AI-ul o poate găsi și înțelege corect atunci când un client caută exact aceste servicii. ECBTAX este exemplul nostru de pornire."),
 ("it","IT & Software","Cum fac ca AI-ul să înțeleagă produsele și serviciile mele?",
  "Vrei ca produsele și serviciile tale să fie găsite și înțelese de AI și, în timp, să poată fi utilizate de agenți AI."),
 ("consultanti","Consultanți","Cum ajunge expertiza mea în răspunsul AI?",
  "Vrei ca AI-ul să înțeleagă cine ești, ce știi și când ești persoana potrivită pentru o anumită problemă — și să nu te prezinte greșit."),
 ("agentii","Agenții & Marketing","Cum pregătesc firmele clienților mei pentru căutarea AI?",
  "Treci de la AI-generated content la AI-ready business. Clienții tăi au nevoie să fie înțeleși de AI, nu doar să producă text cu AI."),
 ("freelanceri","Freelanceri","Cum fac ca AI-ul să știe cine sunt?",
  "Vrei ca atunci când cineva întreabă AI-ul „cine mă poate ajuta cu…?”, să poată apărea și numele tău."),
]
P.append(page("/pentru-cine/", "Pentru cine este AiVenture | AiVenture",
  "Fiecare business are altă problemă în tranziția către AI. Găsește-o pe a ta.",
  hero("PENTRU CINE", "Fiecare business are <em>altă</em> problemă", "",
       "Alege tipul de business și vezi ce înseamnă tranziția AI pentru tine.", ctas=False)
+ sec(cards([(t, d, q, "/pentru-cine/%s/" % s) for s, t, q, d in PROFILES]))
))
for slug, title, q, desc in PROFILES:
    P.append(page("/pentru-cine/%s/" % slug, "%s | AiVenture" % title, desc,
      hero(title.upper(), q, "", desc)
    + sec('<div class="center"><h2>Cei trei pași pentru tine</h2></div>'
          '<div class="grid g3" style="margin-top:28px">'
          '<div class="card"><h3><span class="dot d1"></span>Află unde ești</h3>'
          '<p class="muted small">AI LENS scanează firma și îți arată ce știe AI-ul despre ea.</p></div>'
          '<div class="card"><h3><span class="dot d2"></span>Repară ce lipsește</h3>'
          '<p class="muted small">AI AUDIT + AI READY pun informația în ordine.</p></div>'
          '<div class="card"><h3><span class="dot d3"></span>Pregătește-te pentru agenți</h3>'
          '<p class="muted small">AGENT READY transformă serviciile în ceva cu care un agent poate lucra.</p></div>'
          '</div>'
          '<div class="center" style="margin-top:34px"><a class="btn btn-primary" href="/verifica/">VERIFICĂ FIRMA GRATUIT</a></div>')))

# ============ DE CE AI / DE CE ACUM ============
P.append(page("/de-ce-ai/", "De ce AI? Ce se schimbă pentru firma ta | AiVenture",
  "Omul trece de la „caut” la „deleg”. Firma trece de la „vreau să fiu găsită” la „vreau să pot fi înțeleasă și utilizată”.",
  hero("DE CE AI?", "Ce se schimbă, de fapt?", "",
       "Pentru om, AI evoluează de la instrument de căutare la delegat. Pentru firmă, de la un canal de vizibilitate la un canal de selecție și acțiune.", ctas=False)
+ sec('<table><thead><tr><th>Etapă</th><th>Omul</th><th>Firma B2B</th></tr></thead><tbody>'
      '<tr><td><b>Web / Google</b></td><td>Caută și compară</td><td>Este găsită și accesată</td></tr>'
      '<tr><td><b>AI / Answers</b></td><td>Întreabă și primește un răspuns sintetizat</td><td>Este înțeleasă și evaluată de AI</td></tr>'
      '<tr><td><b>AI Agents</b></td><td>Deleagă o sarcină</td><td>Poate fi selectată și utilizată de agent</td></tr>'
      '</tbody></table>'
      '<p class="center gold" style="margin-top:34px;font-size:20px;font-family:var(--serif)">'
      'Omul trece de la „caut” la „deleg”. Firma trece de la „vreau să fiu găsită” la „vreau să pot fi înțeleasă, selectată și utilizată”.</p>')
+ sec('<div class="center"><h2>Ce vede omul vs. ce trebuie să înțeleagă AI-ul</h2></div>'
      '<div class="grid g2" style="margin-top:28px">'
      '<div class="card"><h3>👤 Ce vede omul</h3><p class="muted">Logo · Website · Servicii · Echipă · Telefon · Portofoliu</p></div>'
      '<div class="card"><h3>🤖 Ce trebuie să poată înțelege AI-ul</h3>'
      '<p class="muted">Identitate · Servicii · Public țintă · Autoritate · Dovezi · Relații · Politici · Capabilități · Acțiuni</p></div>'
      '</div>'
      '<p class="center muted" style="margin-top:26px;font-style:italic">'
      'Site-ul tău a fost construit pentru oameni. AiVenture adaugă stratul pentru mașini.</p>')
+ sec('<h2>Cine intervine, în ce ordine</h2>'
      '<p class="lead">Nu sunt trei jucători care fac același lucru. Sunt roluri diferite, '
      'care intră în scenă la momente diferite.</p>'
      '<div style="overflow-x:auto">'
      '<table class="chain"><thead><tr><th>Etapă</th><th class="mine">AiVenture</th><th>Google</th>'
      '<th>OpenAI / AI</th><th>Beneficiul pentru firmă</th></tr></thead><tbody>'
      + "".join('<tr><td><b>%s</b></td><td class="mine">%s</td><td class="muted">%s</td>'
                '<td class="muted">%s</td><td class="gold">%s</td></tr>' % r for r in [
        ("1. Pregătire",
         "Pregătește informația, entitatea și serviciile firmei pentru ecosistemul AI",
         "—", "—",
         "Firma devine inteligibilă pentru sisteme AI"),
        ("2. Descoperire",
         "Optimizează disponibilitatea informației firmei pentru AI",
         "Te găsește prin Search, Maps etc.",
         "Poate descoperi informații despre firmă",
         "Firma poate fi găsită de client"),
        ("3. Înțelegere",
         "Structurează și clarifică informația firmei",
         "Interpretează conținutul pentru Search",
         "Te înțelege și sintetizează informația",
         "AI-ul poate identifica corect ce face firma"),
        ("4. Comparare",
         "Face diferențiatorii și dovezile mai clare",
         "Oferă rezultate și alternative",
         "Te compară cu alte opțiuni",
         "Firma poate deveni relevantă într-o selecție"),
        ("5. Recomandare",
         "Pregătește semnalele care susțin recomandarea",
         "Poate contribui prin vizibilitatea din Search",
         "Te poate recomanda pentru o nevoie concretă",
         "Firma poate ajunge în răspunsul AI către client"),
        ("6. Acțiune",
         "Pregătește servicii, procese, interfețe și permisiuni",
         "—",
         "Agentul poate acționa folosind instrumente și workflow-uri",
         "AI-ul trece de la răspuns la acțiune"),
        ("7. Agent → firmă",
         "Construiește interfața agentului firmei",
         "—",
         "Agentul clientului interacționează cu agentul firmei",
         "Firma poate primi și procesa solicitări de la agenți"),
        ("8. A2A",
         "Pregătește comunicarea Agent ↔ Agent",
         "—",
         "Ecosistemul agentic",
         "Firma poate participa la procese orchestrate de agenți")])
      + '</tbody></table></div>'
      '<h3 style="margin-top:32px">O nuanță importantă</h3>'
      '<p class="muted">Coloana AiVenture nu este goală pe nicio linie, iar asta nu e întâmplător. '
      'Pregătirea nu este „etapa 1” după care ne retragem. Este transversală: intervine înainte de '
      'fiecare etapă și continuă în timpul ei. Coloanele Google și AI au liniuțe tocmai pentru că '
      'ele nu acoperă tot lanțul — și nici nu au cum.</p>'
      '<h3 style="margin-top:26px">Unde este golul</h3>'
      '<p class="muted">Google se ocupă de descoperire. Sistemele AI se ocupă de interpretare, '
      'recomandare și, tot mai mult, de execuție. Niciuna nu se ocupă de firma ta — de cum este '
      'descrisă, structurată și făcută utilizabilă. Acolo intrăm noi.</p>')
+ sec('<h2>Ce câștigă firma, concret, în fiecare ecosistem</h2>'
      '<p class="lead">Nu „vizibilitate" în general. Lucruri diferite, în locuri diferite.</p>'
      '<div style="overflow-x:auto">'
      '<table class="chain"><thead><tr><th>Ce pregătim</th><th>Efectul în ecosistemul Google</th>'
      '<th>Efectul în ecosistemele AI conversaționale</th><th class="mine">Beneficiul de business</th>'
      '</tr></thead><tbody>'
      + "".join('<tr><td><b>%s</b></td><td class="muted">%s</td><td class="muted">%s</td>'
                '<td class="mine gold">%s</td></tr>' % r for r in [
        ("Identitate clară a firmei",
         "Entitatea este recunoscută consecvent, nu confundată cu firme cu nume similar",
         "AI-ul descrie corect ce faci, în loc să ghicească sau să omită",
         "Nu mai pierzi clienți din cauza unei descrieri greșite"),
        ("Servicii și public țintă explicite",
         "Potrivire mai bună între interogare și pagină",
         "Firma apare la întrebări specifice, nu doar la numele ei",
         "Ajungi în discuții pe care nu le-ai fi văzut niciodată"),
        ("Diferențiatori și dovezi",
         "Semnale de credibilitate pentru evaluarea calității",
         "AI-ul are motive să te aleagă când compară mai multe opțiuni",
         "Treci din menționat în recomandat"),
        ("Informație verificabilă",
         "Consecvență între surse, fără contradicții",
         "Răspunsuri stabile despre firmă, nu variabile de la o sesiune la alta",
         "Reputația nu depinde de ce a nimerit modelul"),
        ("Capabilități expuse programatic",
         "Nu este obiectul Search",
         "Un agent poate cere o ofertă, verifica disponibilitatea, porni un proces",
         "Primești cereri în timp ce dormi, fără operator"),
        ("Interfață de agent",
         "Nu este obiectul Search",
         "Agentul clientului vorbește direct cu agentul firmei",
         "Intri în fluxuri comerciale la care altfel nu ai acces")])
      + '</tbody></table></div>'
      '<h3 style="margin-top:32px">De ce coloanele nu se suprapun</h3>'
      '<p class="muted">Ultimele două rânduri au „nu este obiectul Search" în coloana Google — '
      'nu ca reproș, ci pentru că descoperirea și execuția sunt lucruri diferite. Google rezolvă '
      'foarte bine descoperirea. Execuția se mută în altă parte, iar firma trebuie pregătită '
      'separat pentru ea.</p>')
+ sec('<h2>Cronologia, pe scurt</h2>'
      '<pre class="dia" style="max-width:620px;margin:24px auto 0">'
      'AIVENTURE   →  pregătește firma\n'
      '     |\n     v\n'
      'GOOGLE      →  o face descoperibilă\n'
      '     |\n     v\n'
      'AI          →  o înțelege, compară și recomandă\n'
      '     |\n     v\n'
      'AGENT       →  acționează\n'
      '     |\n     v\n'
      'A2A         →  agenții interacționează</pre>'
      '<p class="center gold" style="margin-top:24px;font-family:var(--mono);font-size:13px;letter-spacing:.16em">'
      'WEB → AI → AGENTS → A2A</p>')
+ sec('<div class="center"><a class="btn btn-primary" href="/de-ce-acum/">DE CE ACUM? →</a></div>')
))

P.append(page("/de-ce-acum/", "De ce acum? România vs. UE | AiVenture",
  "România este mult sub media UE la adopția AI în întreprinderi. Fereastra de avantaj este acum.",
  hero("DE CE ACUM?", "Nu aștepta să devină <em>normă</em>", "",
       "Trebuie să fii pregătit înainte ca acest comportament să devină obișnuit.", ctas=False)
+ sec('<div class="grid g3">'
      '<div class="card"><div class="eyebrow">ASTĂZI</div><h3>Google → site → telefon</h3></div>'
      '<div class="card"><div class="eyebrow">ÎN TRANZIȚIE</div><h3>AI → recomandare → contact</h3></div>'
      '<div class="card"><div class="eyebrow">URMĂTORUL PAS</div><h3>Agent → firmă → acțiune</h3></div>'
      '</div>')
+ sec('<h2>Cine e pregătit din timp câștigă de două ori</h2>'
      '<p class="lead">Firmele pregătite sunt cele pe care Google le găsește, AI-ul le recomandă '
      'și agenții le pot folosi. Celelalte rămân în afara răspunsului — nu pentru că sunt mai slabe, '
      'ci pentru că nu există în forma pe care o pot citi mașinile.</p>'
      '<div class="grid g2" style="margin-top:28px">'
      '<div class="card" style="border-color:var(--gold)"><h3>Firma pregătită</h3>'
      '<h4 class="gold">Intră în buclă</h4>'
      '<p class="muted small">Este găsită, descrisă corect, comparată pe baza dovezilor ei reale, '
      'recomandată pentru situația potrivită și, în timp, poate primi cereri direct de la agenți.</p></div>'
      '<div class="card"><h3>Firma nepregătită</h3><h4>Rămâne în afara buclei</h4>'
      '<p class="muted small">Există, are clienți și experiență — dar în răspunsul AI apare parțial, '
      'greșit sau deloc. Iar clientul nu află niciodată că a fost o opțiune.</p></div>'
      '</div>'
      '<p class="center gold" style="margin-top:30px;font-family:var(--serif);font-size:20px;max-width:740px;margin-left:auto;margin-right:auto">'
      'Diferența nu se vede azi. Se vede peste doi ani, când recuperarea costă de zece ori mai mult '
      'decât pregătirea de acum.</p>')
+ sec('<div class="center"><h2>Harta tranziției AI în UE</h2>'
      '<p class="lead center">UE nu are o singură eră AI. Companiile sunt distribuite simultan pe cele trei etape — '
      'Nordul și Vestul avansează spre etapa 3, Sudul și Estul sunt în principal în etapele 1 și 2.</p></div>'
      '<div class="grid g2" style="margin-top:30px">'
      '<div class="card"><h3><span class="dot" style="background:#5a2d0c"></span>Etapa 3 — peste 20%%</h3>'
      '<h4 class="gold">Lideri</h4><p class="muted small">Suedia, Finlanda</p></div>'
      '<div class="card"><h3><span class="dot" style="background:#c87f2a"></span>Tranziție 2 → 3 — 10-20%%</h3>'
      '<h4 class="gold">Avansați</h4><p class="muted small">Danemarca, Olanda, Germania, Austria, Belgia, Estonia</p></div>'
      '<div class="card"><h3><span class="dot d2"></span>Etapa 2 — 5-10%%</h3>'
      '<h4 class="gold">Zona de tranziție</h4><p class="muted small">Irlanda, Franța, Spania, Italia, Polonia, '
      'Cehia, Slovacia, Ungaria, Letonia, Lituania</p></div>'
      '<div class="card" style="border-color:var(--gold)"><h3><span class="dot d1"></span>Tranziție 1 → 2 — 2-5%%</h3>'
      '<h4 class="gold">Aici este România</h4><p class="muted small">România, Croația, Slovenia, Portugalia</p></div>'
      '</div>'
      '<p class="center muted small" style="margin-top:22px;max-width:700px;margin-left:auto;margin-right:auto">'
      'Harta completă a celor 27 de state poate fi adăugată ca imagine la <code>/assets/harta-ue.png</code>. '
      'Datele de mai sus rămân valabile ca structură, dar verifică procentele la sursă înainte de publicare.</p>'
      '<p class="center muted small" style="margin-top:20px;font-family:var(--mono)">'
      'Sursă de verificat înainte de publicare: Eurostat — utilizarea tehnologiilor AI de către întreprinderi</p>')
))

# ============ PRETURI ============
P.append(page("/preturi/", "Prețuri | AiVenture",
  "Patru trepte simple: verificare, AI Ready, Agent Ready, A2A. Nu 15 produse cu 15 prețuri.",
  hero("PREȚURI", "Nu cumperi AI. Cumperi <em>următoarea treaptă</em>.", "",
       "Patru trepte. Plătești doar pentru cea la care ești acum.", ctas=False)
+ sec('<div class="grid g4">'
      '<div class="card"><div class="eyebrow"><span class="dot d1"></span>START</div><h3>Verificare AI</h3>'
      '<p class="muted small">Vrei doar să afli unde ești. Diagnostic AI LENS.</p>'
      '<p class="gold" style="margin-top:14px">Gratuit</p></div>'
      '<div class="card"><div class="eyebrow"><span class="dot d2"></span>GROW</div><h3>AI Ready</h3>'
      '<p class="muted small">Vrei să repari ce lipsește. Audit + remediere + validare.</p>'
      '<p class="gold" style="margin-top:14px">La cerere</p></div>'
      '<div class="card"><div class="eyebrow"><span class="dot d3"></span>SCALE</div><h3>Agent Ready</h3>'
      '<p class="muted small">Vrei ca agenții să poată lucra cu firma ta.</p>'
      '<p class="gold" style="margin-top:14px">La cerere</p></div>'
      '<div class="card"><div class="eyebrow"><span class="dot d4"></span>ENTERPRISE</div><h3>A2A</h3>'
      '<p class="muted small">Ești deja acolo. Pregătim comunicarea între agenți.</p>'
      '<p class="gold" style="margin-top:14px">Custom</p></div>'
      '</div>'
      '<div class="center" style="margin-top:36px"><a class="btn btn-primary" href="/contact/">CERE O DISCUȚIE</a></div>')
))

# ============ RESURSE ============
P.append(page("/resurse/", "Resurse — AI pentru proprietari de firme | AiVenture",
  "Ce înseamnă tranziția Web → AI → Agenți pentru o firmă. Fără jargon.",
  hero("RESURSE", "AI pentru proprietari de <em>firme</em>", "",
       "Nu „10 prompturi ChatGPT”. Ce se schimbă concret pentru firma ta.", ctas=False)
+ sec('<div class="grid g3">'
      + "".join('<div class="card"><h3>%s</h3><p class="muted small">%s</p></div>' % c for c in [
        ("AI și firma mea","Ce înseamnă concret pentru un business existent."),
        ("AI și clienții","Cum se schimbă modul în care ajung la tine."),
        ("Google → AI","Ce rămâne din SEO și ce nu mai e suficient."),
        ("AI → Agenți","Diferența dintre a fi recomandat și a fi utilizabil."),
        ("Agenți → A2A","Ce înseamnă când agenții vorbesc între ei."),
        ("Exemple reale","Ce am descoperit pe firme concrete.")])
      + '</div>')
+ sec('<div class="card" style="border-color:var(--gold)">'
      '<h3 class="gold">Ai nevoie și de conformitate EU AI Act?</h3>'
      '<p class="muted">AiVenture te pregătește pentru AI. Pentru conformitate legală (EU AI Act, GDPR, NIS2), '
      'documentația completă este pe un site separat, actualizat independent.</p>'
      '<p style="margin-top:16px"><a class="btn btn-ghost btn-sm" href="https://eu-ai-act.ro" rel="noopener">VEZI EU-AI-ACT.RO →</a></p></div>')
))

# ============ FAQ ============
FAQ = [
 ("AI-ul găsește firma mea?","Depinde de cât de clar este exprimată informația despre firmă și de unde o poate prelua. Verificarea AI LENS îți arată exact ce găsesc ChatGPT, Gemini și Perplexity."),
 ("Cum mă vede ChatGPT?","Îți arătăm concret: ce spune despre firma ta, ce identifică corect, ce înțelege greșit și ce lipsește complet."),
 ("Care este diferența dintre SEO și vizibilitate AI?","SEO optimizează pentru ca oamenii să găsească pagini. Vizibilitatea AI se referă la ce poate înțelege și verifica un sistem AI despre firmă — sunt lucruri diferite, deși se suprapun parțial."),
 ("Trebuie să-mi refac website-ul?","Nu. Stratul AI se poate adăuga peste site-ul existent, fără să-l reconstruiești."),
 ("Ce este AI Ready?","Înseamnă că informația despre firma ta este structurată, coerentă și verificabilă, astfel încât AI-ul o poate găsi și înțelege corect."),
 ("Ce este un agent AI?","Un sistem software căruia îi dai un obiectiv și care poate decide ce pași să facă și poate folosi instrumente pentru a-l atinge. Diferența față de un chatbot: chatbotul răspunde, agentul acționează."),
 ("Am nevoie de un agent acum?","Cel mai probabil nu. Pentru majoritatea firmelor, primul pas este să fie găsite și înțelese corect de AI. Agenții vin după."),
 ("Ce este A2A?","Agent-to-Agent — comunicarea directă între agentul unui client și agentul unei firme. Este destinația, nu punctul de plecare."),
 ("Cât durează?","Depinde de treapta la care ești. Verificarea durează minute. Remedierea depinde de cât de dispersată este informația firmei."),
 ("De unde încep?","Cu verificarea gratuită. Nu trebuie să înțelegi AI ca să afli unde este firma ta."),
]
P.append(page("/faq/", "Întrebări frecvente | AiVenture",
  "Întrebările reale pe care le au proprietarii de firme despre AI.",
  hero("ÎNTREBĂRI", "Ce întreabă <em>proprietarii de firme</em>", "", "", ctas=False)
+ sec("".join('<details><summary>%s</summary><p>%s</p></details>' % f for f in FAQ))
+ sec('<div class="center"><a class="btn btn-primary" href="/verifica/">VERIFICĂ FIRMA GRATUIT</a></div>')
))

# ============ DESPRE ============
P.append(page("/despre/", "Despre AiVenture | AiVenture",
  "Nu vindem AI. Pregătim firme pentru lumea AI.",
  hero("DESPRE", "Nu vindem AI. Pregătim <em>firme</em> pentru lumea AI.", "",
       "Nu credem că o firmă trebuie să devină o companie de tehnologie pentru a intra în era AI.", ctas=False)
+ sec('<div class="grid g2">'
      '<div class="card"><h3>Ce ai deja</h3><p class="muted">Clienți · servicii · oameni · experiență · '
      'informații · procese · website.</p></div>'
      '<div class="card"><h3>Ce adăugăm</h3><p class="muted">Ceea ce lipsește pentru noua relație dintre firma ta și AI: '
      'informație pe care sistemele AI o pot găsi, înțelege și verifica.</p></div></div>'
      '<p class="center gold" style="margin-top:34px;font-size:20px;font-family:var(--serif)">'
      'Vizibilă → Înțeleasă → Acționabilă → Agent ↔ Agent</p>'
      '<p class="center muted" style="margin-top:20px">ECBTAX este primul nostru exemplu practic în '
      'contabilitate, fiscalitate, HR și finanțe.</p>')
+ sec('<h2>De ce AiVenture</h2>'
      '<p class="lead">Pentru că nimeni altcineva nu se ocupă de partea care depinde de tine.</p>'
      '<div class="grid g3" style="margin-top:28px">'
      '<div class="card" style="border-color:var(--gold)"><h3>1 · AiVenture</h3><h4 class="gold">Te pregătește</h4>'
      '<p class="muted small">Partea care depinde de firma ta: ce informație există, cât este de clară, '
      'cât de verificabilă și ce se poate face cu ea. Vine <em>înaintea</em> celorlalte două.</p></div>'
      '<div class="card"><h3>2 · Google</h3><h4 class="gold">Te găsește</h4>'
      '<p class="muted small">Search și Maps rezolvă descoperirea. Este rolul lor și îl fac bine.</p></div>'
      '<div class="card"><h3>3 · Sistemele AI</h3><h4 class="gold">Te înțeleg, compară și acționează</h4>'
      '<p class="muted small">Interpretează, sintetizează, recomandă și, tot mai mult, execută — dar doar '
      'pe baza a ceea ce găsesc despre tine.</p></div>'
      '</div>'
      '<h3 style="margin-top:34px">Nu concurăm cu ei. Venim înaintea lor.</h3>'
      '<p class="muted">Un sistem AI nu poate recomanda o firmă despre care nu are informație suficientă. '
      'Nu este vina sistemului și nu o poate repara el. Este partea ta din lanț — și este exact ce facem noi.</p>'
      '<div style="margin-top:24px"><a class="btn btn-ghost btn-sm" href="/de-ce-ai/">'
      'VEZI LANȚUL COMPLET, PE 8 ETAPE →</a> '
      '<a class="btn btn-ghost btn-sm" href="/tehnologie/">CUM SE VERIFICĂ →</a></div>')
+ sec('<div class="center"><h2>AiVenture S.R.L.</h2>'
      '<p class="muted small" style="font-family:var(--mono);margin-top:16px">'
      'CUI 51415878 · Nr. Reg. Com. J2025016406000 · EUID ROONRC.J2025016406000<br>'
      'București, Sectorul 1, Drumul Pădurea Pustnicu, Nr. 141C, Corp A, Etaj 2, Ap. 5</p></div>')
))

# ============ CONTACT ============
P.append(page("/contact/", "Hai să vedem unde este firma ta | AiVenture",
  "Spune-ne website-ul și tipul firmei, iar noi îți arătăm unde ești și care e următorul pas.",
  hero("CONTACT", "Hai să vedem unde este <em>firma ta</em>", "", "", ctas=False)
+ sec('<h2>Spune-ne unde ești</h2>'
      '<p class="lead">Trei câmpuri și o bifă. Îți răspundem cu unde se află firma ta și care e pasul următor.</p>'
      '<form class="stack" id="contact-form" method="POST" action="/api/contact" style="margin-top:28px">'
      '<label for="site-input">Website-ul tău</label>'
      '<input class="field" id="site-input" name="website" type="text" placeholder="firma-ta.ro" required>'
      '<label for="tip">Tipul firmei</label>'
      '<select class="field" id="tip" name="tip">'
      '<option>IMM / B2B</option><option>Contabilitate · Fiscalitate · HR</option><option>IT &amp; Software</option>'
      '<option>Consultanță</option><option>Agenție / Marketing</option><option>Freelancer</option><option>Altele</option>'
      '</select>'
      '<label for="email">Email</label>'
      '<input class="field" id="email" name="email" type="email" placeholder="nume@firma.ro" required>'
      '<label>Ce vrei să afli?</label>'
      '<div class="checks">'
      '<label><input type="checkbox" name="obiectiv" value="Cum mă vede AI-ul"> Cum mă vede AI-ul</label>'
      '<label><input type="checkbox" name="obiectiv" value="Cum devin AI-ready"> Cum devin AI-ready</label>'
      '<label><input type="checkbox" name="obiectiv" value="Cum mă pregătesc pentru agenți"> Cum mă pregătesc pentru agenți</label>'
      '<label><input type="checkbox" name="obiectiv" value="EU AI Act Ready"> Pregătirea pentru EU AI Act</label>'
      '</div>'
      '<label for="mesaj">Detalii (opțional)</label>'
      '<textarea class="field" id="mesaj" name="mesaj" rows="3" placeholder="Orice context util."></textarea>'
      '<input type="text" name="companie_website" tabindex="-1" autocomplete="off" '
      'style="position:absolute;left:-9999px" aria-hidden="true">'
      '<button class="btn btn-primary" type="submit" style="margin-top:10px">ÎNCEPEM</button>'
      '<p id="form-status" role="status" aria-live="polite" class="small"></p>'
      '<p class="muted small">Prin trimitere, ești de acord cu prelucrarea datelor conform '
      '<a href="/legal/" class="gold">politicii de confidențialitate</a>.</p>'
      '</form>')
+ sec('<h2>Alte căi de contact</h2>'
      '<div class="grid g3" style="margin-top:24px">'
      '<div class="card"><h3>WhatsApp</h3><p class="muted small">'
      '<a href="https://api.whatsapp.com/send/?phone=40737123540" class="gold" rel="noopener">40737123540</a></p></div>'
      '<div class="card"><h3>LinkedIn</h3><p class="muted small">'
      '<a href="https://linkedin.com/company/107338970" class="gold" rel="noopener">AiVenture digital</a></p></div>'
      '<div class="card"><h3>Sediu</h3><p class="muted small">București, Sectorul 1<br>'
      'Drumul Pădurea Pustnicu 141C</p></div>'
      '</div>')
))

# ============ LEGAL ============
P.append(page("/legal/", "Confidențialitate, cookie-uri și termeni | AiVenture",
  "Cine este operatorul, ce date colectăm prin formularul de contact, cât le păstrăm și ce drepturi ai.",
  hero("LEGAL", "Confidențialitate și <em>termeni</em>", "",
       "Colectăm strict ce ne trebuie ca să îți răspundem. Nimic altceva.", ctas=False)

+ sec('<h2>1. Cine este operatorul</h2>'
      '<p class="muted">AiVenture S.R.L., societate înregistrată în România.</p>'
      '<p class="muted small" style="font-family:var(--mono);margin-top:14px">'
      'CUI 51415878<br>Nr. Reg. Com. J2025016406000<br>EUID ROONRC.J2025016406000<br>'
      'Sediu: București, Sectorul 1, Drumul Pădurea Pustnicu 141C, Corp A, Etaj 2, Ap. 5<br>'
      'Contact pentru date cu caracter personal: prin formularul din pagina /contact/</p>')

+ sec('<h2>2. Ce date colectăm și de ce</h2>'
      '<h3>Prin formularul de contact</h3>'
      '<div class="steps" style="margin-top:18px">'
      + "".join('<div class="step"><b>%s</b><span class="muted">%s</span></div>' % r for r in [
        ("Website-ul firmei","Ca să putem analiza situația despre care ne întrebi."),
        ("Adresa de email","Ca să îți putem răspunde. Este singurul dat de contact obligatoriu."),
        ("Tipul firmei","Ca să adaptăm răspunsul la situația ta."),
        ("Obiectivul selectat","Ca să știm despre ce vrei să discutăm."),
        ("Mesajul (opțional)","Doar ce alegi tu să scrii.")])
      + '</div>'
      '<h4 style="margin-top:24px">Temeiul legal</h4>'
      '<p class="muted">Interesul legitim de a răspunde unei solicitări comerciale pe care ne-ai adresat-o, '
      'respectiv demersurile precontractuale la cererea ta.</p>'
      '<h3 style="margin-top:30px">Prin verificarea gratuită (AI LENS)</h3>'
      '<p class="muted">Domeniul introdus este transmis motorului nostru de analiză pentru a interoga surse publice. '
      'Nu colectăm date personale în acest pas. Dacă alegi să primești raportul pe email, se aplică '
      'aceleași reguli ca la formularul de contact.</p>'
      '<h3 style="margin-top:30px">Automat, la vizitarea site-ului</h3>'
      '<p class="muted">Infrastructura noastră (Cloudflare) procesează adresa IP și datele tehnice ale cererii '
      'pentru livrarea paginii și pentru securitate. Nu folosim aceste date pentru profilare.</p>')

+ sec('<h2>3. Cookie-uri și urmărire</h2>'
      '<p class="lead">Acest site nu folosește cookie-uri de marketing, de publicitate sau de urmărire între site-uri.</p>'
      '<p class="muted">Nu avem Google Analytics, nu avem pixel de Facebook, nu avem rețele de retargetare. '
      'Nu îți vindem și nu îți închiriem datele nimănui.</p>'
      '<h3 style="margin-top:26px">Ce se stochează totuși local</h3>'
      '<p class="muted">Nimic care să te identifice. Site-ul nu setează cookie-uri proprii. '
      'Fonturile sunt încărcate de la Google Fonts, ceea ce presupune o cerere către serverele Google '
      'care include adresa ta IP.</p>')

+ sec('<h2>4. Cât păstrăm datele</h2>'
      '<div class="grid g3" style="margin-top:22px">'
      '<div class="card"><h3>Solicitări fără urmare</h3><h4 class="gold">12 luni</h4>'
      '<p class="muted small">Dacă discuția nu duce la o colaborare, ștergem datele.</p></div>'
      '<div class="card"><h3>Relație contractuală</h3><h4 class="gold">Pe durata legală</h4>'
      '<p class="muted small">Documentele financiare se păstrează conform legislației contabile aplicabile.</p></div>'
      '<div class="card"><h3>Loguri tehnice</h3><h4 class="gold">Termen scurt</h4>'
      '<p class="muted small">Păstrate de furnizorul de infrastructură pentru securitate operațională.</p></div>'
      '</div>')

+ sec('<h2>5. Cui transmitem datele</h2>'
      '<p class="muted">Doar furnizorilor de care avem nevoie ca să funcționăm, în calitate de persoane '
      'împuternicite:</p>'
      '<div class="steps" style="margin-top:18px">'
      + "".join('<div class="step"><b>%s</b><span class="muted">%s</span></div>' % r for r in [
        ("Cloudflare","Găzduire, livrare, bază de date și securitate."),
        ("Furnizor de email","Livrarea notificărilor și a răspunsurilor noastre."),
        ("Contabilitate","Doar dacă devii client, pentru documentele financiare.")])
      + '</div>'
      '<p class="muted" style="margin-top:20px">Nu transferăm date în afara Spațiului Economic European '
      'în alte scopuri decât funcționarea acestor servicii.</p>')

+ sec('<h2>6. Drepturile tale</h2>'
      '<p class="lead">Ai dreptul de acces, rectificare, ștergere, restricționare a prelucrării, '
      'portabilitate a datelor și opoziție.</p>'
      '<h3 style="margin-top:24px">Cum le exerciți</h3>'
      '<p class="muted">Scrie-ne prin formularul din pagina de contact. Răspundem în termenul prevăzut de lege. '
      'Nu îți cerem justificare pentru o cerere de ștergere.</p>'
      '<h3 style="margin-top:24px">Dacă nu ești mulțumit de răspuns</h3>'
      '<p class="muted">Poți depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării '
      'Datelor cu Caracter Personal (ANSPDCP), sau la autoritatea din statul membru în care îți ai reședința.</p>')

+ sec('<h2>7. Termeni de utilizare</h2>'
      '<h3>Ce oferim și ce nu oferim</h3>'
      '<p class="muted">Serviciile noastre sprijină pregătirea firmei tale. Nu certificăm conformitatea cu '
      'nicio reglementare, nu oferim consultanță juridică și nu garantăm un rezultat care depinde de decizia '
      'unui sistem extern.</p>'
      '<h3 style="margin-top:26px">Limita garanției</h3>'
      '<p class="muted">Garantăm ce controlăm: infrastructura livrată, funcționarea ei și măsurarea rezultatului. '
      'Nu putem garanta dacă un sistem AI extern te va menționa, recomanda sau alege — acea decizie nu ne aparține '
      'și nu aparține nimănui din afara furnizorului respectiv.</p>'
      '<h3 style="margin-top:26px">Rezultatele analizelor</h3>'
      '<p class="muted">Orice scor sau raport este un instantaneu la data realizării lui. Sistemele AI își '
      'actualizează informația independent de noi, deci rezultatul se poate schimba fără nicio modificare din '
      'partea ta sau a noastră.</p>'
      '<h3 style="margin-top:26px">Proprietate intelectuală</h3>'
      '<p class="muted">Conținutul acestui site aparține AiVenture S.R.L. Rapoartele livrate îți aparțin ție.</p>')

+ sec('<h2>8. Modificări</h2>'
      '<p class="muted">Dacă modificăm această politică, actualizăm versiunea afișată în bara de sus a site-ului. '
      'Modificările se aplică de la data publicării.</p>'
      '<div class="center" style="margin-top:30px"><a class="btn btn-ghost" href="/contact/">'
      'ÎNTREABĂ-NE ORICE DESPRE DATELE TALE →</a></div>')
))

# ============ TEHNOLOGIE ============
P.append(page("/tehnologie/", "Tehnologie — stratul tehnic AiVenture | AiVenture",
  "ADI-3D, EDGE, semnale AI. Pagina pentru CTO și echipe tehnice.",
  hero("TEHNOLOGIE", "Stratul <em>tehnic</em>", "",
       "CEO-ul vede rezultatul. CTO-ul poate coborî în arhitectură. Aceasta este pagina a doua.", ctas=False)
+ sec('<div class="center"><h2>ADI-3D — arhitectura informațională</h2></div>'
      '<pre class="dia" style="max-width:620px;margin:26px auto 0">'
      'D1 — DISCOVERY     robots · sitemap · llms.txt\n'
      '       |           „Cine este firma?"\n       v\n'
      'D2 — DECLARATION   identity · entities · authority · proof\n'
      '       |           „Ce declară firma despre ea insasi?"\n       v\n'
      'D3 — DECISION      intents · answer layer · knowledge graph\n'
      '       |           „Este relevanta si de incredere?"\n       v\n'
      'D4 — ACTION        capabilities · permissions · APIs · agents\n'
      '                   „Ce poate face agentul cu firma?"</pre>')
+ sec('<div class="center"><h2>Matricea de maturitate</h2>'
      '<p class="lead center">Aceeași scară, în termeni tehnici.</p></div>'
      '<table><thead><tr><th>Dimensiune</th><th>Web-visible</th><th>AI-understandable</th><th>Agent-actionable</th></tr></thead><tbody>'
      '<tr><td><b>Paradigmă</b></td><td>Om → Google → Website</td><td>Om → AI → Informație</td><td>Om → Agent ↔ Agent → Firmă</td></tr>'
      '<tr><td><b>Canal principal</b></td><td>Motoare de căutare clasice</td><td>Modele conversaționale, RAG, căutare generativă</td><td>Sisteme autonome, protocoale de execuție</td></tr>'
      '<tr><td><b>Rolul omului</b></td><td>Operator direct</td><td>Supervizor al sintezelor</td><td>Human-in-the-Loop</td></tr>'
      '<tr><td><b>Tehnologii suport</b></td><td>HTML, SEO clasic</td><td>Structured data, JSON-LD, llms.txt, knowledge graph</td><td>API-uri, workflows, MCP, agent interfaces</td></tr>'
      '<tr><td><b>Strat de dovadă</b></td><td>—</td><td>SHA-256 · OpenTimestamps · manifest canonic</td><td>Provenance · audit trail</td></tr>'
      '</tbody></table>'
      '<p class="muted small" style="margin-top:18px;font-style:italic">Nota: stratul de dovadă (SHA-256, OTS) este ortogonal scării — '
      'nu este infrastructură de execuție pentru agenți, ci ancorare de proveniență.</p>')
+ sec('<h2>Stratul de dovadă</h2>'
      '<p class="lead">Diferența dintre „am făcut" și „se poate verifica" este un hash și o ancoră '
      'în timp. Fără ele, orice afirmație despre pregătire este doar o afirmație.</p>'
      '<h3 style="margin-top:30px">Amprentă SHA-256 pe fiecare document</h3>'
      '<p class="muted">Fiecare document generat primește o amprentă calculată pe conținutul lui. '
      'Amprenta se calculează întotdeauna pe aceeași reprezentare, indiferent de formatul livrat — '
      'altfel același document ar avea două amprente și dovada ar fi inutilă.</p>'
      '<h3 style="margin-top:26px">Ancorare temporală (OpenTimestamps)</h3>'
      '<p class="muted">Amprentele se ancorează public, astfel încât existența documentului la un '
      'moment dat poate fi verificată de oricine, fără să depindă de noi. Nu dovedește că un '
      'document este corect — dovedește că exista atunci și că nu a fost modificat de atunci.</p>'
      '<h3 style="margin-top:26px">Registru cu verificare la distanță</h3>'
      '<p class="muted">Documentele intră într-un registru cu identificator determinist. Oricine are '
      'identificatorul sau amprenta poate verifica public existența și integritatea, fără cont și '
      'fără acces la conținut.</p>'
      '<div class="scorebox" style="margin-top:24px;text-align:left">'
      '<div class="scorerow"><span>Identificator</span><b>COD-FIRMA-8HEX</b></div>'
      '<div class="scorerow"><span>Verificare</span><b>GET /verify?doc= sau ?hash=</b></div>'
      '<div class="scorerow"><span>Date personale expuse</span><b>niciuna</b></div>'
      '<div class="scorerow"><span>Enumerarea clienților</span><b>imposibilă</b></div>'
      '</div>'
      '<h4 style="margin-top:22px">De ce nu se poate lista</h4>'
      '<p class="muted small">Registrul răspunde doar la o căutare exactă, după identificator sau '
      'amprentă. Nu are listare per firmă — deliberat. Un registru care poate fi enumerat expune '
      'clienții altcuiva.</p>')

+ sec('<h2>Arhitectura pe straturi</h2>'
      '<p class="lead">Semnale → fișiere, niciodată fișiere → semnale.</p>'
      '<p class="muted">Ordinea contează mai mult decât pare. Dacă pornești de la fișiere și încerci '
      'să deduci semnalele, obții o colecție de artefacte fără sursă de adevăr. Dacă pornești de la '
      'semnale, fișierele devin ieșiri regenerabile — și pot fi verificate.</p>'
      '<pre class="dia" style="margin-top:24px">'
      'RAW  →  FACT  →  ENTITATE  →  RELAȚIE  →  SEMNAL  →  FIȘIER  →  VALIDARE\n\n'
      '        sursa de adevăr        transformare        artefact livrat</pre>'
      '<h3 style="margin-top:28px">Cele trei surse de adevăr</h3>'
      '<div class="grid g3" style="margin-top:20px">'
      '<div class="card"><h3 class="gold">Conținut</h3><h4>Repozitoriu</h4>'
      '<p class="muted small">Textul și structura, versionate.</p></div>'
      '<div class="card"><h3 class="gold">Semnale</h3><h4>Stocare cheie-valoare</h4>'
      '<p class="muted small">Ce declară firma despre ea însăși, separat de prezentare.</p></div>'
      '<div class="card"><h3 class="gold">Execuție</h3><h4>Worker la edge</h4>'
      '<p class="muted small">Ce se livrează efectiv, la cerere, fiecărui consumator.</p></div>'
      '</div>'
      '<p class="muted" style="margin-top:22px">Separarea celor trei este motivul pentru care stratul '
      'AI se poate adăuga fără să atingi site-ul existent: conținutul rămâne unde este, semnalele '
      'trăiesc separat, iar livrarea se face la edge.</p>')

+ sec('<h2>Disciplina epistemică</h2>'
      '<p class="lead">Trei niveluri de certitudine, marcate explicit. Nu amestecăm ce declară firma '
      'cu ce poate fi verificat public sau certificat de un terț.</p>'
      '<div class="steps" style="margin-top:24px">'
      + "".join('<div class="step"><b>%s</b><span class="muted">%s</span></div>' % r for r in [
        ("AUTODECLARAT","Firma afirmă. Util, dar nu are greutate de dovadă."),
        ("VERIFICABIL PUBLIC","Poate fi confirmat din surse independente, de oricine."),
        ("CERTIFICAT DE TERȚ","Confirmat de o entitate acreditată. Rar, și cel mai greu de obținut.")])
      + '</div>'
      '<h3 style="margin-top:28px">Regula pe care nu o încălcăm</h3>'
      '<p class="muted">Sprijinim pregătirea. Nu certificăm și nu satisfacem în locul nimănui. '
      'Un instrument care pretinde altceva îți vinde o falsă siguranță, iar aceea se descoperă '
      'exact în momentul în care ai avea nevoie de ea.</p>')

+ sec('<h2>Lanțul de certitudine</h2>'
      '<p class="lead">Acces ≠ Vizibilitate ≠ Citare ≠ Trafic ≠ Lead ≠ Venit.</p>'
      '<p class="muted">Fiecare săgeată este o tranziție separată, cu rata ei de pierdere. Măsurăm '
      'fiecare tranziție în parte, tocmai ca să nu confundăm una cu alta.</p>'
      '<pre class="dia" style="margin-top:22px">'
      'ACCES  →  VIZIBILITATE  →  CITARE  →  TRAFIC  →  LEAD  →  VENIT\n'
      '  |__________ ce garantăm ___________|______ ce nu poate garanta nimeni ______|</pre>'
      '<h3 style="margin-top:26px">Ce intră în garanție</h3>'
      '<p class="muted">Infrastructura livrată și funcțională, endpointurile valide, accesul pentru '
      'crawlerele selectate, identitatea consecventă și interacțiunile măsurate.</p>'
      '<h3 style="margin-top:22px">Ce nu intră, la nimeni</h3>'
      '<p class="muted">Selecția făcută de un sistem extern. Nu o controlăm noi, nu o controlează '
      'nicio agenție, și oricine îți promite altceva îți promite ceva ce nu deține.</p>')

+ sec('<div class="center"><h2>Stack</h2></div>'
      '<p class="center muted" style="font-family:var(--mono);font-size:14px;line-height:2.2;max-width:760px;margin:20px auto 0">'
      'EDGE · Cloudflare Workers · D1 · R2 · Vectorize · JSON-LD · Schema.org · llms.txt · '
      'knowledge graph · RAG · MCP · A2A · SHA-256 · OpenTimestamps</p>'
      '<h3 style="margin-top:36px">Ce rulează deja</h3>'
      '<div class="grid g2" style="margin-top:20px">'
      + "".join('<div class="card"><h3 class="gold">%s</h3><h4>%s</h4><p class="muted small">%s</p></div>' % c for c in [
        ("Motor de audit agentic","Analiză pe zeci de semnale",
         "Buclă de căutare în mai mulți pași peste sisteme AI publice, cu rezultat repetabil."),
        ("Bază de cunoștințe vectorizată","Căutare hibridă",
         "Corpus interogabil semantic, combinat cu căutare textuală clasică."),
        ("Registru de documente","Verificare la distanță",
         "Identificator determinist, amprentă SHA-256, endpoint public de verificare."),
        ("Punte A2A","JSON-RPC 2.0",
         "Endpoint prin care un agent extern poate apela capabilități expuse.")])
      + '</div>'
      '<p class="muted small" style="margin-top:18px;font-style:italic">Componentele de mai sus sunt '
      'operaționale, nu planificate. Cele experimentale nu apar pe această listă.</p>')
+ sec('<div class="center"><p class="lead center">Nu ești tehnic? Nu ai nevoie de pagina asta.</p>'
      '<div class="cta-row"><a class="btn btn-primary" href="/verifica/">VERIFICĂ FIRMA GRATUIT</a></div></div>')
))

# ============ EU AI ACT READY ============
P.append(page("/eu-ai-act-ready/", "EU AI Act Ready — pregătirea firmei tale | AiVenture",
  "Inventar, clasificare pe risc și documentație pentru Regulamentul european privind AI. Sprijinim pregătirea — nu certificăm conformitatea.",
  hero("EU AI ACT READY™", "Firma ta folosește deja <em>AI</em>", "Pregătirea începe cu un inventar.",
       "Nu cu un audit juridic, nu cu o platformă. Cu o listă a sistemelor AI pe care firma ta le folosește deja.",
       secondary=("/contact/","Discută cu noi"))
+ '<div class="band">⚠ Sprijinim pregătirea. Nu certificăm și nu înlocuim o evaluare juridică. · <a href="https://eu-ai-act.ro" rel="noopener">Textul legal și termenele →</a></div>'

+ sec('<h2>Problema</h2>'
      '<p class="lead">Majoritatea firmelor folosesc deja AI fără să știe exact unde. Un instrument în marketing, '
      'altul în HR, un asistent în customer service, un plugin în contabilitate.</p>'
      '<h3>De ce contează</h3>'
      '<p class="muted">Nu poți documenta, clasifica sau controla ceva ce nu știi că se folosește în firmă. '
      'Orice discuție despre conformitate care începe cu documente, și nu cu inventar, începe greșit.</p>')

+ sec('<h2>Cum o rezolvăm</h2>'
      '<div class="grid g2" style="margin-top:26px">'
      '<div class="card"><h3>① Inventar</h3><h4 class="gold">Ce sisteme AI folosește firma?</h4>'
      '<p class="muted small">Instrumente, plugin-uri, asistenți, automatizări — inclusiv cele intrate prin furnizori.</p></div>'
      '<div class="card"><h3>② Clasificare</h3><h4 class="gold">În ce rol și cu ce risc?</h4>'
      '<p class="muted small">Furnizor sau utilizator, și pe ce nivel de risc se încadrează fiecare utilizare.</p></div>'
      '<div class="card"><h3>③ Documentație</h3><h4 class="gold">Ce trebuie să existe scris?</h4>'
      '<p class="muted small">Documentație de furnizor, proceduri de supraveghere umană, materiale de transparență.</p></div>'
      '<div class="card"><h3>④ Oameni</h3><h4 class="gold">Cine știe ce?</h4>'
      '<p class="muted small">Nivelul de înțelegere pe care echipa trebuie să îl aibă despre sistemele cu care lucrează.</p></div>'
      '</div>')

+ sec('<h2>Rezultatul</h2>'
      '<div class="steps" style="margin-top:24px">'
      + "".join('<div class="step"><b>%s</b><span class="muted">%s</span></div>' % s for s in [
        ("INVENTAR","Lista sistemelor AI folosite efectiv în firmă"),
        ("CLASIFICARE","Rolul firmei și nivelul de risc pentru fiecare utilizare"),
        ("DOCUMENTAȚIE","Ce trebuie să existe scris și unde"),
        ("SUPRAVEGHERE","Unde intervine un om și cum se consemnează"),
        ("TRANSPARENȚĂ","Ce se comunică utilizatorilor și clienților")])
      + '</div>'
      '<h3 style="margin-top:34px">Ce NU facem</h3>'
      '<p class="muted">Nu emitem certificate. Nu dăm consultanță juridică. Nu publicăm pe acest site cifre, '
      'termene sau texte de lege — acelea stau pe domeniul dedicat, unde sunt verificate sursă cu sursă.</p>')

+ sec('<h2>Cum se leagă de restul</h2>'
      '<p class="lead">Conformitatea privește cum folosești AI <em>în interior</em>. '
      'Restul scării AiVenture privește cum te vede AI-ul <em>din exterior</em>. Sunt complementare, nu concurente.</p>'
      '<div class="center" style="margin-top:30px"><a class="btn btn-primary" href="/contact/">ÎNCEPE CU INVENTARUL</a> '
      '<a class="btn btn-ghost" href="/tehnologie/">CUM SE VERIFICĂ DOCUMENTELE →</a></div>')
))

# ============ HUB ÎNTREBĂRI (peste banca de 1900) ============
P.append(page("/intrebari/", "Toate întrebările despre AI pentru firma ta | AiVenture",
  "Banca de întrebări AiVenture: caută răspunsul la orice întrebare despre vizibilitatea, înțelegerea și pregătirea firmei tale pentru AI.",
  hero("BANCA DE ÎNTREBĂRI", "Caută <em>orice</em> întrebare", "",
       "Nu găsești ce cauți în cele 19 de mai jos? Caută în banca completă.", ctas=False)
+ sec('<h2>Caută în banca de întrebări</h2>'
      '<form class="lensform" data-kb><input type="text" id="kb-q" placeholder="ex. cum mă vede ChatGPT" aria-label="Caută">'
      '<button class="btn btn-primary" type="submit">CAUTĂ</button></form>'
      '<div id="kb-results" style="margin-top:30px"></div>'
      '<noscript><p class="muted" style="margin-top:20px">Căutarea are nevoie de JavaScript. '
      'Întrebările principale sunt oricum vizibile mai jos, în text.</p></noscript>')
+ sec('<h2>Pe categorii</h2>'
      '<div class="grid g3" style="margin-top:24px">'
      + "".join('<a class="card link" href="/intrebari/?c=%s"><h3>%s</h3><p class="muted small">%s</p></a>' % c for c in [
        ("vizibilitate","Vizibilitate","AI-ul te găsește? Ce spune despre tine?"),
        ("intelegere","Înțelegere","Ce înțelege corect și ce greșit despre firmă."),
        ("recomandare","Recomandare","De ce te-ar alege pe tine și nu pe altcineva."),
        ("agenti","Agenți AI","Ce poate face un agent cu firma ta."),
        ("a2a","A2A","Când agenții încep să vorbească între ei."),
        ("eu-ai-act","EU AI Act","Ce înseamnă pregătirea pentru regulament.")])
      + '</div>')
))

# ============ HUB USE CASES (peste cele 199) ============
P.append(page("/use-cases/", "199 situații reale din firme românești | AiVenture",
  "Ce se întâmplă concret în firme: situația de azi, ce am descoperit, ce am făcut, rezultatul și pasul următor.",
  hero("USE CASES", "Situații <em>reale</em>, nu scenarii", "",
       "Fiecare caz în același format: ÎNAINTE → CE AM DESCOPERIT → CE AM FĂCUT → DUPĂ → URMĂTORUL PAS.", ctas=False)
+ sec('<h2>Caută după industrie sau problemă</h2>'
      '<form class="lensform" data-kb data-kind="usecase"><input type="text" placeholder="ex. contabilitate, lead-uri, ofertare" aria-label="Caută">'
      '<button class="btn btn-primary" type="submit">CAUTĂ</button></form>'
      '<div id="kb-results" style="margin-top:30px"></div>')
+ sec('<h2>Pe industrie</h2>'
      '<div class="grid g4" style="margin-top:24px">'
      + "".join('<a class="card link" href="/use-cases/?i=%s"><h3>%s</h3></a>' % (i.lower().replace(" ","-"), i) for i in [
        "Contabilitate","IT & Software","Juridic","Consultanță","Producție","Distribuție",
        "Retail","Servicii medicale","Imobiliare","HoReCa","Educație","Agenții"])
      + '</div>')
+ sec('<h2>Formatul fiecărui caz</h2>'
      '<div class="steps" style="margin-top:24px">'
      + "".join('<div class="step"><b>%s</b><span class="muted">%s</span></div>' % s for s in [
        ("ÎNAINTE","Ce găsește AI-ul azi despre firmă"),
        ("CE AM DESCOPERIT","Ce lipsește sau ce înțelege greșit"),
        ("CE AM FĂCUT","Ce am corectat și structurat"),
        ("DUPĂ","Ce poate înțelege AI-ul acum"),
        ("URMĂTORUL PAS","Ce devine posibil de aici")])
      + '</div>')
))

# ============ CUM FUNCȚIONEAZĂ ============
P.append(page("/cum/", "Cum devine un site inteligibil pentru AI | AiVenture",
  "Explicat simplu: același site poate vorbi în același timp cu omul și cu mașina. Fără să schimbi nimic din ce vede omul.",
  hero("CUM FUNCȚIONEAZĂ", "Cerneala <em>simpatică</em> digitală", "",
       "Aceeași informație poate fi pusă pe un site într-un loc în care omul nu o vede, dar mașina o poate citi.", ctas=False)

+ sec('<h2>De la papirus la JSON</h2>'
      '<p class="lead">Oamenii au folosit dintotdeauna cuvinte scrise — pe papirus, pe hârtie, apoi '
      'digital — ca să comunice între ei, inclusiv la distanță.</p>'
      '<p class="muted">Pentru comunicarea dintre om și computer, și mai ales dintre computere între ele, '
      'a fost nevoie de un format lipsit de ambiguitatea limbajului natural. Unul dintre ele se numește '
      '<b class="gold">JSON</b>.</p>'
      '<pre class="dia" style="max-width:420px;margin-top:24px">{\n'
      '  "produs": "X",\n  "pret": 500,\n  "moneda": "USD"\n}</pre>'
      '<div class="grid g2" style="margin-top:22px">'
      '<div class="card"><h3>👤 Omul vede</h3><p class="muted">Produsul X costă 500 USD.</p></div>'
      '<div class="card"><h3>🤖 Mașina vede</h3>'
      '<p class="muted" style="font-family:var(--mono);font-size:14px">produs = X<br>preț = 500<br>monedă = USD</p></div>'
      '</div>'
      '<h3 style="margin-top:30px">Aceeași informație, două cititori</h3>'
      '<p class="muted">Diferența nu este în conținut. Este în forma în care este exprimat. Omul are nevoie '
      'de o propoziție. Mașina are nevoie de câmpuri fără interpretare posibilă.</p>')

+ sec('<h2>Partea care surprinde</h2>'
      '<p class="lead">Textul acesta poate fi pus pe un site fără să fie vizibil omului. '
      'Doar mașinile îl citesc.</p>'
      '<p class="muted">De aceea îi spunem cerneală simpatică digitală: e acolo, e citibilă, dar nu se vede. '
      'Pagina ta arată exact la fel pentru vizitatori. Nu se schimbă niciun cuvânt, nicio imagine, '
      'niciun buton.</p>'
      '<pre class="dia" style="margin-top:24px">'
      'ACELAȘI SITE\n\n'
      '   |---> pentru OM      : text, imagini, butoane\n'
      '   |\n'
      '   |---> pentru MAȘINĂ  : câmpuri structurate, invizibile</pre>'
      '<h3 style="margin-top:28px">Ce înseamnă asta practic</h3>'
      '<p class="muted">Nu trebuie să-ți refaci site-ul ca să devii inteligibil pentru AI. Trebuie doar '
      'să adaugi stratul pe care mașinile îl citesc. Restul rămâne neatins.</p>')

+ sec('<h2>Când mașinile își pun întrebări între ele</h2>'
      '<p class="lead">O mașină poate trimite alteia o întrebare sau o intenție, iar cealaltă poate '
      'răspunde într-un format pe care prima îl înțelege.</p>'
      '<pre class="dia" style="margin-top:22px">'
      'MAȘINA A      "Cine este firma X și ce oferă?"\n'
      '     |\n     v\n'
      'SITE-UL X     răspunde cu informațiile structurate\n'
      '     |\n     v\n'
      'MAȘINA A      înțelege răspunsul și îl prezintă omului</pre>'
      '<h3 style="margin-top:28px">Iar omul face același lucru, prin AI</h3>'
      '<pre class="dia" style="max-width:520px">OM  →  AI  →  SITE  →  AI  →  OM</pre>'
      '<h4 style="margin-top:18px">În paralel, fără niciun om implicat</h4>'
      '<pre class="dia" style="max-width:520px">SOFTWARE A  →  SITE  →  SOFTWARE B</pre>'
      '<p class="muted" style="margin-top:20px">Asta poate să pară inteligență, pentru că mașinile nu mai '
      'schimbă doar pagini și fișiere, ci întrebări, intenții și răspunsuri.</p>')

+ sec('<h2>O precizare onestă</h2>'
      '<p class="lead">JSON singur nu face mașinile inteligente.</p>'
      '<p class="muted">JSON le oferă doar un mod structurat de a comunica. Inteligența apare din '
      'combinația dintre <b>date</b> + <b>reguli și interfețe</b> + <b>software care interpretează '
      'și decide ce urmează</b>.</p>'
      '<h3 style="margin-top:28px">Ce face de fapt un sistem AI</h3>'
      '<div class="steps" style="margin-top:20px">'
      + "".join('<div class="step"><b>%s</b><span class="muted">%s</span></div>' % r for r in [
        ("MEMORIE","Are acces la cantități enorme de informație"),
        ("CAUTĂ","Găsește ce este relevant pentru întrebare"),
        ("COMPARĂ","Leagă între ele informații asemănătoare"),
        ("SINTETIZEAZĂ","Adună din mai multe locuri și formează un răspuns"),
        ("COMUNICĂ","Primește întrebări de la oameni sau de la alt software și răspunde")])
      + '</div>'
      '<h3 style="margin-top:28px">Nu este o memorie ca a omului</h3>'
      '<p class="muted">Un model nu păstrează textele originale ca într-o arhivă din care le scoate la '
      'cerere. A învățat tipare din datele de antrenare, iar când primește un context calculează ce '
      'urmează, bucată cu bucată. O metaforă utilă: un autocomplete probabilistic foarte performant.</p>'
      '<h4 style="margin-top:20px">De ce contează pentru tine</h4>'
      '<p class="muted">Pentru că un model nu „știe" firma ta din memorie. Ori găsește informația când '
      'caută, ori o aproximează. Iar când aproximează, greșește — și nu are cum să știe că a greșit.</p>')

+ sec('<h2>Ce s-a schimbat, de fapt</h2>'
      '<div class="grid g2" style="margin-top:24px">'
      '<div class="card"><h3>Internetul vechi</h3>'
      '<pre class="dia" style="font-size:12.5px;padding:16px">OM → BROWSER → PAGINĂ → OM</pre>'
      '<p class="muted small" style="margin-top:12px">Site-ul este conceput în primul rând pentru '
      'lectura umană.</p></div>'
      '<div class="card" style="border-color:var(--gold)"><h3>Ce se întâmplă acum</h3>'
      '<pre class="dia" style="font-size:12.5px;padding:16px">OM → AI → SITE → AI → OM\n\n'
      'și, în paralel:\n\nAI A → SITE → AI B</pre>'
      '<p class="muted small" style="margin-top:12px">Site-ul nu mai este doar o destinație pentru '
      'oameni. Devine și o interfață pentru software.</p></div>'
      '</div>'
      '<p class="center gold" style="margin-top:32px;font-family:var(--serif);font-size:20px;max-width:740px;margin-left:auto;margin-right:auto">'
      'Orice site poate deveni lizibil pentru mașini, oriunde s-ar afla ele, '
      'fără să schimbi nimic din ce vede omul.</p>'
      '<p class="center muted" style="margin-top:18px">Nimic magic. Doar un strat în plus.</p>')

+ sec('<div class="center"><div class="eyebrow">PARTEA A DOUA</div>'
      '<h2>Ce sunt, concret, <em>semnalele AI</em></h2>'
      '<p class="lead center">Nu există un singur „semnal AI”. Este orice informație lizibilă de mașină '
      'care reduce incertitudinea unui sistem despre un site, o firmă, un serviciu sau o afirmație.</p></div>')

+ sec('<h2>Cele patru niveluri</h2>'
      '<p class="lead">Fiecare nivel răspunde la altă întrebare a sistemului AI.</p>'
      '<div style="overflow-x:auto;margin-top:24px">'
      '<table class="chain"><thead><tr><th>Nivel</th><th>Semnale principale</th>'
      '<th class="mine">Întrebarea la care răspund</th></tr></thead><tbody>'
      + "".join('<tr><td><b>%s</b></td><td class="muted">%s</td><td class="mine gold">%s</td></tr>' % r for r in [
        ("1. Discovery","robots.txt · sitemap.xml · crawlabilitate · status HTTP · indexabilitate · llms.txt",
         "„Pot să găsesc site-ul și conținutul?”"),
        ("2. Understanding","HTML semantic · H1/H2 · title · meta description · Schema.org · JSON-LD · entități · FAQ · breadcrumb · linkuri interne",
         "„Ce este această firmă și ce oferă?”"),
        ("3. Verification","Organization/LocalBusiness · nume-adresă-telefon · date de contact · autoritate · politici · surse · consecvență între site și restul webului",
         "„Pot verifica faptul că informația este adevărată?”"),
        ("4. Decision","servicii · industrie · locație · client ideal · use cases · prețuri · disponibilitate · diferențiatori · dovezi · relații între entități",
         "„Este această firmă potrivită pentru utilizator?”")])
      + '</tbody></table></div>')

+ sec('<h2>Familiile de semnale</h2>'
      '<div class="grid g2" style="margin-top:26px">'
      + "".join('<div class="card"><h3 class="gold">%s</h3><h4>%s</h4>'
                '<p class="muted small" style="font-family:var(--mono);font-size:12.5px;line-height:2">%s</p></div>' % f for f in [
        ("A · Tehnice","Poate fi accesat?",
         "crawlabil · indexabil · HTTP 200 · permisiuni robots · sitemap · canonical · hreflang · acces mobil · viteză · URL-uri stabile · navigație structurată"),
        ("B · Semantice","Ce înseamnă ce scrie?",
         "title · H1 · H2/H3 · nume de entități · servicii · industrie · locație · relații semantice · definiții explicite · FAQ · linkuri interne cu sens"),
        ("C · Date structurate","În ce formă e exprimat?",
         "Organization · LocalBusiness · WebSite · WebPage · Service · Product · Person · Article · BreadcrumbList · FAQPage · ContactPoint · Offer · Review"),
        ("D · Încredere","Se poate verifica?",
         "identitate · CUI/TVA · denumire legală · adresă · telefon · email · consecvență de domeniu · autor · acreditări · dovezi de la clienți · referințe externe · politici · prospețime"),
        ("E · Business","Ce vinde și cui?",
         "ce vinde · cui vinde · unde vinde · pentru ce industrie · pentru ce problemă · pentru ce tip de client · diferențiatori · rezultate · use cases · informație comercială · disponibilitate"),
        ("F · Declarații AI","Ce declară firma explicit?",
         "robots.txt · llms.txt · ai.json · ai-proof.json · authority.json · entities.json · governance.json · policy.json · intents.json · answer-layer.json · knowledge-graph.json · ai-ready-score.json")])
      + '</div>')

+ sec('<div class="center"><h2>Semnalele <em>acestui</em> site</h2>'
      '<p class="lead center">Nu explicăm ceva ce nu aplicăm. Fiecare fișier de mai jos este live, '
      'pe acest domeniu, chiar acum. Deschide-l.</p></div>'
      '<div class="grid g2" style="margin-top:30px">'
      + "".join('<a class="card link sigfile" href="%s" target="_blank" rel="noopener">'
                '<div class="eyebrow">%s</div><h3>%s</h3><p class="muted small">%s</p></a>' % f for f in [
        ("/robots.txt","D1 · DISCOVERY","robots.txt","Cine are voie să citească site-ul, inclusiv crawlerele sistemelor AI."),
        ("/sitemap.xml","D1 · DISCOVERY","sitemap.xml","Lista paginilor importante, ca nimic să nu depindă de noroc."),
        ("/llms.txt","D1 · DISCOVERY","llms.txt","Rezumat orientat spre sisteme AI: ce este firma și unde se află conținutul."),
        ("/ai.json","D2 · DECLARAȚIE","ai.json","Declarația de business lizibilă de mașină: identitate, poziționare, servicii."),
        ("/entities.json","D2 · DECLARAȚIE","entities.json","Entitățile: firma, serviciile, conceptele și publicul țintă."),
        ("/authority.json","D2 · DECLARAȚIE","authority.json","Ce afirmăm și pe ce nivel de certitudine stă fiecare afirmație."),
        ("/ai-proof.json","D2 · DOVADĂ","ai-proof.json","Metoda de dovadă: SHA-256, ancorare temporală, verificare fără date personale."),
        ("/governance.json","D2 · GUVERNANȚĂ","governance.json","Principiile și lanțul de certitudine: ce garantăm și ce nu garantează nimeni."),
        ("/policy.json","D2 · POLITICĂ","policy.json","Politica de utilizare a conținutului și de clasificare a crawlerelor."),
        ("/intents.json","D3 · DECIZIE","intents.json","Ce intenții poate satisface firma și ce pagină servește fiecare."),
        ("/answer-layer.json","D3 · DECIZIE","answer-layer.json","Răspunsuri pregătite pentru întrebările frecvente, cu sursa fiecăruia."),
        ("/knowledge-graph.json","D3 · DECIZIE","knowledge-graph.json","Relațiile dintre entități: cine oferă ce și ce treaptă deblochează."),
        ("/ai-ready-score.json","D3 · EVALUARE","ai-ready-score.json","Autoevaluarea pe axa discoverable → recommendable, declarată ca atare.")])
      + '</div>'
      '<p class="center muted small" style="margin-top:24px;font-style:italic;max-width:700px;margin-left:auto;margin-right:auto">'
      'Fișierele se deschid în filă nouă. Sunt exact ce citește o mașină când ajunge aici — '
      'nimic ascuns, nimic diferit de ce vezi tu în pagină.</p>')

+ sec('<h2>Axa pe care se măsoară</h2>'
      '<p class="lead">Un site nu este „are sau nu are Schema.org”. Este o poziție pe cinci trepte.</p>'
      '<pre class="dia" style="margin-top:22px">'
      'DESCOPERIBIL → INTELIGIBIL → VERIFICABIL → DEMN DE ÎNCREDERE → RECOMANDABIL</pre>'
      '<h3 style="margin-top:28px">De ce contează distincția</h3>'
      '<p class="muted">Poți fi perfect descoperibil și complet neinteligibil. Poți fi inteligibil și '
      'neverificabil. Fiecare treaptă se pierde separat, iar un scor unic le ascunde pe toate.</p>'
      '<h4 style="margin-top:20px">Aici este diferența față de SEO tehnic</h4>'
      '<p class="muted">SEO tehnic rezolvă foarte bine primele două trepte. Restul — verificabilitate, '
      'încredere, potrivire pentru o nevoie concretă — sunt întrebări pe care motoarele de căutare '
      'clasice nu și le puneau, iar sistemele AI și le pun de fiecare dată.</p>')

+ sec('<div class="center"><h2>Vrei să vezi ce citesc mașinile despre <em>firma ta</em>?</h2>'
      '<div class="cta-row"><a class="btn btn-primary" href="/verifica/">VERIFICĂ FIRMA GRATUIT</a>'
      '<a class="btn btn-ghost" href="/solutii/ai-edge/">CUM SE ADAUGĂ STRATUL →</a></div></div>')
))

# ============ CUM — o pagină per etapă ============
STAGES = [
 ("/cum/descoperire/","2 · DESCOPERIRE","Cum te <em>găsește</em> Google",
  "A fi găsit înseamnă că un program a ajuns pe paginile tale, le-a citit și le poate scoate la cerere.",
  "Google", "o face descoperibilă", "Firma poate fi găsită de client",
  [("Ce se întâmplă","Un crawler parcurge site-ul, citește ce găsește și păstrează ce a înțeles într-un index."),
   ("Unde se blochează","Reguli de acces prea stricte, pagini care apar doar după rulare de script, sau lipsa unei hărți a site-ului."),
   ("Ce e nou","Crawlerele sistemelor AI sunt programe separate de cel al Google, cu reguli separate. Poți fi deschis pentru unul și închis pentru altul fără să știi."),
   ("Ce facem","Verificăm cine te citește efectiv, ce anume ajunge să fie parcurs și ce rămâne invizibil.")],
  "A fi citit nu înseamnă a fi arătat cuiva. Descoperirea este condiția, nu rezultatul.",
  "/cum/intelegere/","URMĂTORUL PAS: ÎNȚELEGEREA"),

 ("/cum/intelegere/","3 · ÎNȚELEGERE","Cum te <em>înțelege</em> AI-ul",
  "A fi înțeles înseamnă că sistemul poate spune corect ce faci, pentru cine, unde și în ce condiții.",
  "AI", "o înțelege, compară și recomandă", "Firma ajunge în răspunsul către client",
  [("Ce se întâmplă","Sistemul deduce din text cine ești. Când textul e clar, deduce corect. Când e ambiguu, inventează plauzibil."),
   ("Unde se blochează","Informație împrăștiată sau contradictorie între surse. Contradicția nu se ignoră — scade încrederea în toate variantele deodată."),
   ("Ce e nou","Nu mai e suficient ca un om să înțeleagă pagina. Trebuie ca și un program să ajungă la aceeași concluzie, fără să ghicească."),
   ("Ce facem","Structurăm cine ești, ce faci, pentru cine, unde și ce te diferențiază — și verificăm că nu se contrazice nicăieri.")],
  "Un sistem care te descrie greșit o face cu aceeași încredere cu care te-ar descrie corect. Nu are cum să știe că greșește.",
  "/cum/actiune/","URMĂTORUL PAS: ACȚIUNEA"),

 ("/cum/actiune/","4 · ACȚIUNE","Cum <em>acționează</em> un agent",
  "Chatbotul răspunde. Agentul primește un obiectiv, decide pașii și folosește instrumente ca să-l atingă.",
  "Agent", "acționează", "Firma primește și procesează solicitări",
  [("Ce se întâmplă","Un agent poate cere o ofertă, verifica disponibilitatea, transmite un brief sau porni un proces comercial."),
   ("Unde se blochează","Dacă firma expune doar text, agentul nu are ce apela. Are nevoie de ceva structurat, cu răspuns previzibil."),
   ("Ce e nou","Se trece de la „cine ești?” la „ce pot face cu tine?”. Este o întrebare diferită și cere alt tip de pregătire."),
   ("Ce facem","Stabilim ce capabilități se expun, în ce condiții, cu ce permisiuni și unde intervine un om.")],
  "Un agent peste informație dezordonată devine o interfață peste haos. De aceea etapele nu se sar.",
  "/cum/a2a/","URMĂTORUL PAS: A2A"),

 ("/cum/a2a/","5 · A2A","Când agenții vorbesc <em>între ei</em>",
  "Agentul clientului comunică direct cu agentul firmei, fără ca omul să intermedieze fiecare pas.",
  "A2A", "agenții interacționează", "Firma intră în procese orchestrate de agenți",
  [("Ce se întâmplă","Agentul clientului caută, verifică, compară și cere. Agentul firmei răspunde și poate porni pasul următor."),
   ("Unde se blochează","Fără identitate de agent, permisiuni explicite și jurnal de acțiuni, nu ai cum să reconstitui ce s-a întâmplat."),
   ("Ce e nou","Există deja standarde prin care un agent își publică ce știe să facă, iar altul îl poate găsi și apela."),
   ("Ce facem","Pregătim interfața agentului firmei, limitele lui și punctele în care decizia rămâne la om.")],
  "Aceasta este destinația scării, nu prima treaptă. Are sens după ce ești găsit, înțeles și acționabil.",
  "/verifica/","VEZI UNDE EȘTI ACUM"),
]

for path, eyebrow, h1, lead, who, role, gain, blocks, punch, nxt, nxtlabel in STAGES:
    body = hero(eyebrow, h1, "", lead, ctas=False)
    body += sec('<div class="loop"><div class="loop-row mine">'
        '<div class="loop-who"><b>%s</b><span class="loop-tag">%s</span></div>'
        '<div class="loop-arrow">→</div>'
        '<div class="loop-gain">%s</div></div></div>' % (who, role, gain))
    body += sec('<h2>Ce se întâmplă la această etapă</h2>'
        '<div class="grid g2" style="margin-top:26px">'
        + "".join('<div class="card"><h3>%s</h3><p class="muted small">%s</p></div>' % b for b in blocks)
        + '</div>'
        '<p class="center gold" style="margin-top:32px;font-family:var(--serif);font-size:19px;'
        'max-width:720px;margin-left:auto;margin-right:auto">%s</p>' % punch)
    body += sec('<h2>Unde se află asta în bucla completă</h2>'
        '<pre class="dia" style="max-width:560px;margin:22px auto 0">'
        'AIVENTURE   →  pregătește firma\n     |\n     v\n'
        'GOOGLE      →  o face descoperibilă\n     |\n     v\n'
        'AI          →  o înțelege, compară și recomandă\n     |\n     v\n'
        'AGENT       →  acționează\n     |\n     v\n'
        'A2A         →  agenții interacționează</pre>'
        '<div class="center" style="margin-top:30px">'
        '<a class="btn btn-primary" href="/verifica/">VERIFICĂ FIRMA GRATUIT</a> '
        '<a class="btn btn-ghost" href="%s">%s →</a></div>' % (nxt, nxtlabel))
    P.append(page(path, "%s | AiVenture" % eyebrow.split("· ")[-1].capitalize(), lead, body))

# --------------------------------------------------------------- STATIC FILES
os.makedirs(os.path.join(OUT, "assets"), exist_ok=True)
for f in ("style.css", "site.js"):
    shutil.copy(os.path.join(ROOT, "assets", f), os.path.join(OUT, "assets", f))

# sitemap
urls = "".join('  <url><loc>%s%s</loc><changefreq>monthly</changefreq></url>\n' % (BASE, p) for p in P)
open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8").write(
 '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s</urlset>\n' % urls)

# robots
open(os.path.join(OUT, "robots.txt"), "w", encoding="utf-8").write(
"""User-agent: *
Allow: /

User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /
User-agent: CCBot
Allow: /

Sitemap: %s/sitemap.xml
""" % BASE)

# llms.txt
open(os.path.join(OUT, "llms.txt"), "w", encoding="utf-8").write(
"""# AiVenture

> AI pentru firma ta. AiVenture pregătește firmele B2B din România pentru tranziția
> Web → AI → Agenți: de la a fi găsite pe Google, la a fi înțelese și recomandate de
> sisteme AI, până la a putea fi utilizate de agenți autonomi.

## Ce facem
- AI LENS — diagnostic: ce știe AI-ul despre o firmă
- AI AUDIT — ce informații lipsesc sau se contrazic
- AI READY — structurarea informației pentru sisteme AI
- AI EDGE — stratul AI adăugat fără reconstruirea site-ului
- AGENT READY — expunerea capabilităților pentru agenți AI
- A2A READY — interoperabilitate agent-to-agent

## Pagini principale
- [Acasă](%(b)s/): unde este firma ta în Era AI
- [Nivelurile AI](%(b)s/niveluri/): vizibilă, înțeleasă, acționabilă, A2A
- [Soluții](%(b)s/solutii/): scara completă AiVenture
- [Verifică firma](%(b)s/verifica/): diagnostic gratuit
- [Exemplu ECBTAX](%(b)s/exemplu-ecbtax/): demonstrație pe o firmă reală
- [Pentru cine](%(b)s/pentru-cine/): IMM, IT, contabilitate, consultanți, agenții, freelanceri
- [Prețuri](%(b)s/preturi/)
- [Întrebări](%(b)s/faq/)
- [Contact](%(b)s/contact/)

## Organizație
AiVenture S.R.L. — CUI 51415878 — București, România.
""" % {"b": BASE})

# ai.json
open(os.path.join(OUT, "ai.json"), "w", encoding="utf-8").write(json.dumps({
  "schema_version": "1.0",
  "organization": {"name": "AiVenture S.R.L.", "brand": "AiVenture", "url": BASE + "/",
                   "identifier": {"cui": "51415878", "euid": "ROONRC.J2025016406000"},
                   "areaServed": "RO", "language": ["ro"]},
  "positioning": "AI pentru firma ta — pregătirea firmelor B2B pentru tranziția Web → AI → Agenți",
  "maturity_model": [
    {"level": 1, "name": "Vizibilă",   "question": "AI-ul găsește firma ta?"},
    {"level": 2, "name": "Înțeleasă",  "question": "AI-ul înțelege și recomandă firma ta?"},
    {"level": 3, "name": "Acționabilă","question": "Poate un agent să lucreze cu firma ta?"},
    {"level": 4, "name": "A2A",        "question": "Pot agenții să comunice între ei?"}],
  "services": [
    {"id": "ai-lens",     "name": "AI LENS",     "url": BASE + "/solutii/ai-lens/"},
    {"id": "ai-audit",    "name": "AI AUDIT",    "url": BASE + "/solutii/ai-audit/"},
    {"id": "ai-ready",    "name": "AI READY",    "url": BASE + "/solutii/ai-ready/"},
    {"id": "ai-edge",     "name": "AI EDGE",     "url": BASE + "/solutii/ai-edge/"},
    {"id": "agent-ready", "name": "AGENT READY", "url": BASE + "/solutii/agent-ready/"},
    {"id": "a2a-ready",   "name": "A2A READY",   "url": BASE + "/solutii/a2a/"}],
  "epistemic_status": "self_declared",
  "disclaimer": "Scorurile afișate ca exemplu pe site sunt ilustrative până la activarea motorului de evaluare."
}, ensure_ascii=False, indent=2))


# ---- fișiere de semnal ADI (D2/D3) ----
def w(name, obj):
    open(os.path.join(OUT, name), "w", encoding="utf-8").write(
        json.dumps(obj, ensure_ascii=False, indent=2))

w("entities.json", {
  "schema_version": "1.0", "generated_for": BASE + "/",
  "primary_entity": {"id": BASE + "/#organization", "type": "Organization",
    "name": "AiVenture S.R.L.", "brand": "AiVenture",
    "legal_identifiers": {"cui": "51415878", "reg_com": "J2025016406000",
                          "euid": "ROONRC.J2025016406000"},
    "country": "RO", "locality": "București", "language": "ro"},
  "service_entities": [{"id": sid, "name": nm, "url": BASE + su} for sid, nm, _, su in SERVICES],
  "concept_entities": [
    {"id": "ai-readiness", "name": "AI readiness", "definition":
     "Gradul în care informația unei firme poate fi descoperită, înțeleasă și verificată de sisteme AI."},
    {"id": "agent-readiness", "name": "Agent readiness", "definition":
     "Gradul în care capabilitățile unei firme pot fi apelate de un agent autonom."},
    {"id": "a2a", "name": "Agent-to-Agent", "definition":
     "Comunicare directă între agentul unui client și agentul unei firme."}],
  "audience_entities": ["IMM B2B", "firme de contabilitate/fiscalitate/HR", "firme IT",
                        "consultanți", "agenții de marketing", "freelanceri"],
  "epistemic_status": "self_declared"})

w("authority.json", {
  "schema_version": "1.0", "entity": BASE + "/#organization",
  "claims": [
    {"claim": "Societate înregistrată în România", "level": "publicly_verifiable",
     "basis": "registrul comerțului", "identifier": "J2025016406000"},
    {"claim": "Operează infrastructură de discovery pentru AI", "level": "self_declared"},
    {"claim": "Produse operaționale: audit agentic, generare documentație, registru de verificare, punte A2A",
     "level": "self_declared"}],
  "disclaimer": "Sprijinim pregătirea. Nu certificăm conformitatea și nu înlocuim o evaluare de specialitate.",
  "epistemic_levels": ["self_declared", "publicly_verifiable", "independently_certified"]})

w("ai-proof.json", {
  "schema_version": "1.1", "entity": BASE + "/#organization",
  "verification_endpoint": None,
  "note": "Registrul de verificare a documentelor rulează pe proprietatea dedicată conformității. "
          "Acest fișier declară metoda, nu conține amprente de documente ale clienților.",
  "method": {"hash": "SHA-256", "computed_on": "reprezentarea Markdown canonică",
             "timestamping": "OpenTimestamps", "identifier_format": "COD-FIRMA_SLUG-8HEX"},
  "privacy": {"personal_data_exposed": False, "client_enumeration_possible": False,
              "lookup": "doar căutare exactă după identificator sau amprentă"},
  "status": "self_declared"})

w("governance.json", {
  "schema_version": "1.0", "entity": BASE + "/#organization",
  "principles": [
    "Sprijinim pregătirea, nu certificăm.",
    "Nu inventăm informație despre firma clientului.",
    "Marcăm explicit nivelul de certitudine al fiecărei afirmații.",
    "Garantăm doar partea controlabilă: infrastructura livrată și măsurarea ei."],
  "certainty_chain": ["access", "visibility", "citation", "traffic", "lead", "revenue"],
  "guaranteed_segment": ["access", "visibility"],
  "not_guaranteed_by_anyone": ["citation", "traffic", "lead", "revenue"],
  "human_in_the_loop": True})

w("policy.json", {
  "schema_version": "1.0", "entity": BASE + "/#organization",
  "content_usage": {"ai_training": "allowed", "ai_search_indexing": "allowed",
                    "attribution_requested": True, "canonical": BASE + "/"},
  "crawler_policy": {"default": "allow",
    "classification": ["productiv", "informativ", "necunoscut", "extractiv", "ostil"],
    "note": "Clasificarea se face după valoarea observată, nu după nume."},
  "data_protection": {"tracking_cookies": False, "advertising_pixels": False,
                      "policy_url": BASE + "/legal/"}})

w("intents.json", {
  "schema_version": "1.0", "entity": BASE + "/#organization",
  "intents": [
    {"intent": "afla_ce_stie_ai_despre_firma", "question": "Ce știe AI-ul despre firma mea?",
     "served_by": BASE + "/verifica/", "service": "ai-lens"},
    {"intent": "afla_de_ce_nu_sunt_recomandat", "question": "De ce AI-ul nu îmi recomandă firma?",
     "served_by": BASE + "/solutii/ai-audit/", "service": "ai-audit"},
    {"intent": "devino_inteligibil_pentru_ai", "question": "Cum fac firma inteligibilă pentru AI?",
     "served_by": BASE + "/solutii/ai-ready/", "service": "ai-ready"},
    {"intent": "adauga_strat_fara_refacere_site", "question": "Pot adăuga stratul fără să-mi refac site-ul?",
     "served_by": BASE + "/solutii/ai-edge/", "service": "ai-edge"},
    {"intent": "pregatire_pentru_agenti", "question": "Poate un agent AI să lucreze cu firma mea?",
     "served_by": BASE + "/solutii/agent-ready/", "service": "agent-ready"},
    {"intent": "interoperabilitate_agenti", "question": "Pot agenții să comunice între ei?",
     "served_by": BASE + "/solutii/a2a/", "service": "a2a-ready"},
    {"intent": "pregatire_eu_ai_act", "question": "Cum mă pregătesc pentru Regulamentul european privind AI?",
     "served_by": BASE + "/eu-ai-act-ready/", "service": "eu-ai-act-ready"},
    {"intent": "intelege_mecanismul", "question": "Cum devine un site lizibil pentru mașini?",
     "served_by": BASE + "/cum/"}]})

w("answer-layer.json", {
  "schema_version": "1.0", "entity": BASE + "/#organization", "language": "ro",
  "answers": [
    {"q": "Ce face AiVenture?", "a": "Pregătește firmele B2B din România pentru felul în care sistemele AI le descoperă, înțeleg, recomandă și, în timp, le pot utiliza.", "source": BASE + "/despre/"},
    {"q": "Pentru cine este?", "a": "IMM-uri B2B, firme de contabilitate, fiscalitate și HR, firme IT, consultanți, agenții și freelanceri din România.", "source": BASE + "/pentru-cine/"},
    {"q": "Cum începe colaborarea?", "a": "Cu o verificare gratuită care arată ce știe AI-ul despre firmă și care este pasul următor.", "source": BASE + "/verifica/"},
    {"q": "Trebuie refăcut site-ul?", "a": "Nu. Stratul de semnale se adaugă peste site-ul existent, fără să îl modifice.", "source": BASE + "/solutii/ai-edge/"},
    {"q": "Ce garantează AiVenture?", "a": "Infrastructura livrată, funcționarea ei și măsurarea rezultatului. Selecția făcută de un sistem AI extern nu poate fi garantată de nimeni.", "source": BASE + "/tehnologie/"},
    {"q": "Certifică AiVenture conformitatea?", "a": "Nu. Sprijină pregătirea, nu emite certificate și nu oferă consultanță juridică.", "source": BASE + "/eu-ai-act-ready/"},
    {"q": "Unde este firma mea în tranziția AI?", "a": "Pe o scară cu patru trepte: vizibilă, înțeleasă, acționabilă și A2A. Verificarea gratuită arată treapta curentă.", "source": BASE + "/niveluri/"}]})

w("knowledge-graph.json", {
  "schema_version": "1.0", "@context": "https://schema.org",
  "nodes": [{"id": BASE + "/#organization", "type": "Organization", "label": "AiVenture"}]
    + [{"id": BASE + su + "#service", "type": "Service", "label": nm} for _, nm, _, su in SERVICES]
    + [{"id": BASE + "/#stage-%d" % i, "type": "DefinedTerm", "label": l}
       for i, l in enumerate(["Vizibilă", "Înțeleasă", "Acționabilă", "A2A"], 1)],
  "edges": [{"from": BASE + "/#organization", "rel": "provides", "to": BASE + su + "#service"}
            for _, _, _, su in SERVICES]
    + [{"from": BASE + "/solutii/ai-lens/#service", "rel": "diagnoses", "to": BASE + "/#stage-1"},
       {"from": BASE + "/solutii/ai-ready/#service", "rel": "enables", "to": BASE + "/#stage-2"},
       {"from": BASE + "/solutii/agent-ready/#service", "rel": "enables", "to": BASE + "/#stage-3"},
       {"from": BASE + "/solutii/a2a/#service", "rel": "enables", "to": BASE + "/#stage-4"},
       {"from": BASE + "/#stage-1", "rel": "precedes", "to": BASE + "/#stage-2"},
       {"from": BASE + "/#stage-2", "rel": "precedes", "to": BASE + "/#stage-3"},
       {"from": BASE + "/#stage-3", "rel": "precedes", "to": BASE + "/#stage-4"}]})

w("ai-ready-score.json", {
  "schema_version": "1.0", "entity": BASE + "/#organization",
  "axis": ["discoverable", "understandable", "verifiable", "trustable", "recommendable"],
  "self_assessment": {
    "discoverable": {"signals": ["robots.txt", "sitemap.xml", "llms.txt", "HTTP 200", "canonical"], "present": True},
    "understandable": {"signals": ["schema @graph", "H1-H4", "breadcrumb", "FAQPage", "entities.json"], "present": True},
    "verifiable": {"signals": ["identificatori legali", "adresă", "politici publicate"], "present": True},
    "trustable": {"signals": ["nivel epistemic declarat", "limita garanției explicită"], "present": True},
    "recommendable": {"signals": ["servicii", "public țintă", "intenții", "answer layer"], "present": True}},
  "note": "Autoevaluare declarată de operator. Nu este un audit independent.",
  "epistemic_status": "self_declared"})

# _headers + _redirects (Cloudflare Pages)
open(os.path.join(OUT, "_headers"), "w", encoding="utf-8").write(
"""/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/ai.json
  Content-Type: application/json; charset=utf-8
  Access-Control-Allow-Origin: *

/llms.txt
  Content-Type: text/plain; charset=utf-8
  Access-Control-Allow-Origin: *

/*.json
  Content-Type: application/json; charset=utf-8
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=3600
""")

open(os.path.join(OUT, "_redirects"), "w", encoding="utf-8").write(
"""/index.html            /                       301
/ai-lens/              /solutii/ai-lens/       301
/ai-audit/             /solutii/ai-audit/      301
/ai-ready/             /solutii/ai-ready/      301
/ai-edge/              /solutii/ai-edge/       301
/agent-ready/          /solutii/agent-ready/   301
/a2a/                  /solutii/a2a/           301
/ai-maturity/          /niveluri/              301
/blog/                 /resurse/               301
/proof.json            /ai.json                301
""")

print("Generated %d pages" % len(P))
for p in sorted(P):
    print("  " + p)
