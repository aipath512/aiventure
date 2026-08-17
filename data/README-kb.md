# Banca de cunoștințe — 1900 Q&A + 199 use cases

## 0. Pune fișierele aici
Orice format: `.json` `.jsonl` `.csv` `.md`. Importerul detectează singur
structura și separă Q&A de use cases.

```
data/qa.json          (sau .csv / .md — oricâte fișiere)
data/usecases.csv
```

## 1. Import local → SQL + payload vectorial
```bash
python3 build/import_kb.py data/qa.json data/usecases.csv
```
Produce `seed-qa.sql`, `seed-usecases.sql`, `vectors-qa.ndjson`,
`vectors-uc.ndjson` și `kb-report.txt`.
**Citește raportul înainte de a urca** — arată câte au intrat, câte s-au respins și de ce.

## 2. Creează resursele (o singură dată)
```bash
wrangler d1 create aiventure-kb
# copiază database_id în wrangler.toml

wrangler vectorize create aiventure-kb --dimensions=1024 --metric=cosine
wrangler vectorize create-metadata-index aiventure-kb --property-name=kind     --type=string
wrangler vectorize create-metadata-index aiventure-kb --property-name=category --type=string
wrangler vectorize create-metadata-index aiventure-kb --property-name=industry --type=string
```
1024 = dimensiunea pentru `@cf/baai/bge-m3`. Dacă schimbi modelul de embedding
în `functions/api/kb.js`, schimbă și dimensiunea aici — altfel indexul respinge vectorii.

## 3. Încarcă schema și datele
```bash
wrangler d1 execute aiventure-kb --remote --file=./data/schema.sql
wrangler d1 execute aiventure-kb --remote --file=./data/seed-qa.sql
wrangler d1 execute aiventure-kb --remote --file=./data/seed-usecases.sql
```
La 1900 de rânduri, dacă lovești limita per fișier, sparge-l:
```bash
split -l 500 data/seed-qa.sql data/seed-qa-part-
```

## 4. Generează embeddings și încarcă în Vectorize
```bash
python3 build/embed_kb.py data/vectors-qa.ndjson data/vectors-uc.ndjson
wrangler vectorize insert aiventure-kb --file=data/vectors-embedded.ndjson
```

## 5. Verifică
```bash
curl "https://aiventure.ro/api/kb?q=cum%20ma%20vede%20chatgpt"
curl "https://aiventure.ro/api/kb?kind=usecase&industry=contabilitate"
```

## Cum se leagă de site
- `/intrebari/` — hub căutabil peste toate cele 1900
- `/intrebari/<categorie>/` — pagini de câte 19 întrebări, fiecare cu FAQPage complet
- `/use-cases/` + `/use-cases/<industrie>/` — cele 199, în formatul fix
  ÎNAINTE → CE AM DESCOPERIT → CE AM FĂCUT → DUPĂ → URMĂTORUL PAS

Cele 19 întrebări per pagină de produs rămân **statice în HTML** (nu se încarcă din API):
sunt indexabile de crawlere fără JavaScript. Restul bancii se servește prin `/api/kb`.
