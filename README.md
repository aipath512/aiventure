# AiVenture.ro — v2.0

Site static. Fără build step, fără dependențe, fără framework.
Ce vezi în repo este exact ce se servește.

## Deploy pe Cloudflare Pages

Repo-ul este deja conectat la Cloudflare Pages. Setările corecte:

| Setare | Valoare |
|---|---|
| Framework preset | **None** |
| Build command | *(gol)* |
| Build output directory | **/** (rădăcina repo-ului) |
| Root directory | *(gol)* |

Orice push pe `main` declanșează deploy automat.

## Structură

```
/                      index.html          — Home
/assets/               style.css, site.js  — tema dark/gold + JS partajat
/niveluri/             cele 3 niveluri + A2A
/solutii/              hub + 6 pagini de produs
/pentru-cine/          hub + 6 profiluri de business
/verifica/             formularul AI LENS
/exemplu-ecbtax/       demonstrația pe firmă reală
/rezultate/  /de-ce-ai/  /de-ce-acum/  /preturi/
/resurse/  /faq/  /despre/  /contact/  /legal/

robots.txt  sitemap.xml  llms.txt  ai.json
_headers    _redirects   (specifice Cloudflare Pages)
```

## Înainte de go-live

Nu mai există placeholdere în cod. Rămân doar lucruri care depind de contul tău Cloudflare.

### Obligatoriu — un singur lucru (2 minute)

**Leagă D1.** Cloudflare Pages → Settings → Functions → D1 database bindings →
adaugă unul cu numele variabilei `DB`.

Fără el, formularul de contact **nu are unde salva** și îi spune vizitatorului să
te contacteze pe WhatsApp (nu pretinde fals că a primit mesajul). Cu el, fiecare
lead se salvează. Tabela `lead` se creează singură la primul mesaj.

**Pentru verificarea manuală zilnică:** adaugă și variabila de mediu
`LEADS_KEY` = un șir lung, la alegerea ta. Apoi deschizi zilnic:

```
https://aiventure.ro/api/leads?key=ȘIRUL_TĂU
https://aiventure.ro/api/leads?key=ȘIRUL_TĂU&days=1     ← doar azi
```

Pagina e `noindex`, iar fără `LEADS_KEY` setată endpointul răspunde 404 pentru
oricine. Nu o lăsa nesetată dacă vrei să citești lead-urile.

### Opțional — notificare pe email
Dacă vrei să nu mai verifici manual, adaugă `LEAD_TO` și `LEAD_FROM` la
Environment variables. Până atunci, panoul de mai sus e suficient.

### Restul, oricând după lansare
3. **AI LENS** — `assets/site.js` trimite acum toți parametrii uzuali
   (`domain`, `url`, `site`, `q`) simultan, ca să funcționeze indiferent ce așteaptă
   motorul. Când confirmi care e cel corect, reduci `LENS_PARAMS` la unul singur.
4. **Scorurile de pe Home** — marcate `Exemplu`. Înlocuiește-le cu un snapshot real
   AUDIT-AI, păstrând linia de proveniență de dedesubt.
5. **Harta UE** — `/de-ce-acum/` afișează acum datele structurat, fără imagine.
   Dacă vrei și harta grafică, pune-o la `/assets/harta-ue.png`.
6. **Banca de 1900 Q&A + 199 use cases** — vezi `data/README-kb.md`.


## Regenerare

Paginile au fost generate dintr-un șablon comun. Dacă modifici structura
(navbar, footer, secțiuni repetate), modifică `build/gen.py` și rulează
`python3 build/gen.py` — altfel editează direct fișierele HTML.
