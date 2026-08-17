#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Importă banca de 1900 Q&A + 199 use cases în D1 și pregătește payload-ul Vectorize.

Acceptă, fără configurare:
  .json   listă de obiecte  sau  {"qa":[...], "usecases":[...]}
  .jsonl  un obiect per linie
  .csv    cu antet (delimitator detectat automat)
  .md     blocuri "## Întrebare" / paragraf răspuns  sau  "Q:" / "R:"

Rulează:
  python3 build/import_kb.py data/qa.json data/usecases.csv
Produce:
  data/seed-qa.sql          — INSERT-uri pentru D1
  data/seed-usecases.sql
  data/vectors-qa.ndjson    — pentru wrangler vectorize insert
  data/vectors-uc.ndjson
  data/kb-report.txt        — ce a intrat, ce s-a respins și de ce
"""
import os, sys, json, csv, re, unicodedata, io

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
os.makedirs(DATA, exist_ok=True)

# ------------------------------------------------------------------ utilitare
def slugify(t, maxlen=80):
    t = unicodedata.normalize("NFKD", t)
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"[^a-zA-Z0-9]+", "-", t).strip("-").lower()
    return t[:maxlen] or "item"

def sq(v):
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"

def first(d, *keys, default=None):
    for k in keys:
        for kk in (k, k.lower(), k.upper(), k.capitalize()):
            if kk in d and str(d[kk]).strip():
                return str(d[kk]).strip()
    return default

# ------------------------------------------------------------------ parsere
def load_json(path):
    d = json.load(open(path, encoding="utf-8"))
    if isinstance(d, dict):
        out = []
        for k in ("qa", "questions", "intrebari", "usecases", "use_cases", "cazuri", "items", "data"):
            if k in d and isinstance(d[k], list):
                out += d[k]
        return out or [d]
    return d

def load_jsonl(path):
    return [json.loads(l) for l in open(path, encoding="utf-8") if l.strip()]

def load_csv(path):
    raw = open(path, encoding="utf-8-sig").read()
    try:
        dialect = csv.Sniffer().sniff(raw[:4096], delimiters=",;\t|")
    except csv.Error:
        dialect = csv.excel
    return list(csv.DictReader(io.StringIO(raw), dialect=dialect))

def load_md(path):
    """Detectează ## titlu + paragraf, sau Q:/R: (respectiv Î:/R:)."""
    txt = open(path, encoding="utf-8").read()
    items = []
    blocks = re.split(r"\n(?=#{2,4}\s)", txt)
    for b in blocks:
        m = re.match(r"#{2,4}\s+(.+?)\n(.+)", b, re.S)
        if m:
            q, a = m.group(1).strip(), m.group(2).strip()
            if q and a:
                items.append({"question": q, "answer": a})
    if items:
        return items
    for m in re.finditer(r"^\s*(?:Q|Î|I)\s*[:.\-]\s*(.+?)\n\s*(?:A|R)\s*[:.\-]\s*(.+?)(?=\n\s*(?:Q|Î|I)\s*[:.\-]|\Z)",
                         txt, re.S | re.M):
        items.append({"question": m.group(1).strip(), "answer": m.group(2).strip()})
    return items

def load_any(path):
    ext = os.path.splitext(path)[1].lower()
    return {".json": load_json, ".jsonl": load_jsonl, ".ndjson": load_jsonl,
            ".csv": load_csv, ".tsv": load_csv, ".md": load_md, ".txt": load_md}.get(ext, load_json)(path)

# ------------------------------------------------------------------ normalizare
def is_usecase(r):
    return bool(first(r, "situation", "situatie", "inainte", "before", "title", "titlu")) and not \
           first(r, "question", "intrebare", "întrebare", "q")

def norm_qa(r, i):
    q = first(r, "question", "intrebare", "întrebare", "q", "titlu")
    a = first(r, "answer", "raspuns", "răspuns", "a", "text", "continut")
    if not q or not a:
        return None
    return {
      "id": i,
      "slug": slugify(q) + "-" + str(i),
      "question": q, "answer": a,
      "category": first(r, "category", "categorie", "topic", default="general"),
      "subcategory": first(r, "subcategory", "subcategorie"),
      "audience": first(r, "audience", "public", "target", "profil"),
      "level": first(r, "level", "nivel", "etapa"),
      "page_path": first(r, "page", "page_path", "pagina", "url"),
      "source": first(r, "source", "sursa"),
    }

def norm_uc(r, i):
    t = first(r, "title", "titlu", "name", "nume")
    sit = first(r, "situation", "situatie", "inainte", "before", "problema", "description", "descriere")
    if not t and not sit:
        return None
    t = t or (sit[:70] + "…")
    return {
      "id": i,
      "slug": slugify(t) + "-" + str(i),
      "title": t,
      "industry": first(r, "industry", "industrie", "sector", "domeniu", default="general"),
      "audience": first(r, "audience", "public", "profil"),
      "level": first(r, "level", "nivel"),
      "situation": sit or "",
      "discovered": first(r, "discovered", "descoperit", "ce_am_descoperit", "gaps"),
      "action": first(r, "action", "actiune", "ce_am_facut", "solution", "solutie"),
      "outcome": first(r, "outcome", "rezultat", "dupa", "after"),
      "next_step": first(r, "next_step", "urmatorul_pas", "next"),
      "service_slug": first(r, "service", "serviciu", "service_slug"),
    }

# ------------------------------------------------------------------ main
def main(paths):
    qa, uc, rejected = [], [], []
    for p in paths:
        if not os.path.exists(p):
            print("  ! lipsă:", p); continue
        try:
            rows = load_any(p)
        except Exception as e:
            print("  ! nu pot citi %s: %s" % (p, e)); continue
        print("  · %s → %d înregistrări brute" % (os.path.basename(p), len(rows)))
        for r in rows:
            if not isinstance(r, dict):
                rejected.append(("non-dict", str(r)[:70])); continue
            if is_usecase(r):
                n = norm_uc(r, len(uc) + 1)
                (uc.append(n) if n else rejected.append(("usecase incomplet", str(r)[:70])))
            else:
                n = norm_qa(r, len(qa) + 1)
                (qa.append(n) if n else rejected.append(("Q&A fără întrebare sau răspuns", str(r)[:70])))

    # deduplicare pe întrebare normalizată
    seen, dedup = set(), []
    for x in qa:
        k = slugify(x["question"])
        if k in seen:
            rejected.append(("duplicat", x["question"][:70])); continue
        seen.add(k); dedup.append(x)
    qa = dedup
    for i, x in enumerate(qa, 1): x["id"] = i

    # ---- SQL
    with open(os.path.join(DATA, "seed-qa.sql"), "w", encoding="utf-8") as f:
        f.write("-- %d Q&A\nBEGIN TRANSACTION;\n" % len(qa))
        for x in qa:
            f.write("INSERT OR REPLACE INTO qa (id,slug,question,answer,category,subcategory,audience,level,page_path,vector_id,source) VALUES (%d,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);\n" % (
              x["id"], sq(x["slug"]), sq(x["question"]), sq(x["answer"]), sq(x["category"]),
              sq(x["subcategory"]), sq(x["audience"]),
              (x["level"] if str(x["level"] or "").isdigit() else "NULL"),
              sq(x["page_path"]), sq("qa-%d" % x["id"]), sq(x["source"])))
        f.write("COMMIT;\n")

    with open(os.path.join(DATA, "seed-usecases.sql"), "w", encoding="utf-8") as f:
        f.write("-- %d use cases\nBEGIN TRANSACTION;\n" % len(uc))
        for x in uc:
            f.write("INSERT OR REPLACE INTO usecase (id,slug,title,industry,audience,level,situation,discovered,action,outcome,next_step,service_slug,vector_id) VALUES (%d,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);\n" % (
              x["id"], sq(x["slug"]), sq(x["title"]), sq(x["industry"]), sq(x["audience"]),
              (x["level"] if str(x["level"] or "").isdigit() else "NULL"),
              sq(x["situation"]), sq(x["discovered"]), sq(x["action"]), sq(x["outcome"]),
              sq(x["next_step"]), sq(x["service_slug"]), sq("uc-%d" % x["id"])))
        f.write("COMMIT;\n")

    # ---- Vectorize (text de embed; embedding-ul se face în Worker cu Workers AI)
    with open(os.path.join(DATA, "vectors-qa.ndjson"), "w", encoding="utf-8") as f:
        for x in qa:
            f.write(json.dumps({"id": "qa-%d" % x["id"],
              "text": x["question"] + "\n" + x["answer"],
              "metadata": {"kind": "qa", "slug": x["slug"], "category": x["category"],
                           "audience": x["audience"] or "", "question": x["question"][:180]}},
              ensure_ascii=False) + "\n")
    with open(os.path.join(DATA, "vectors-uc.ndjson"), "w", encoding="utf-8") as f:
        for x in uc:
            f.write(json.dumps({"id": "uc-%d" % x["id"],
              "text": "\n".join(filter(None, [x["title"], x["situation"], x["outcome"]])),
              "metadata": {"kind": "usecase", "slug": x["slug"], "industry": x["industry"],
                           "service": x["service_slug"] or "", "title": x["title"][:180]}},
              ensure_ascii=False) + "\n")

    # ---- raport
    cats = {}
    for x in qa: cats[x["category"]] = cats.get(x["category"], 0) + 1
    inds = {}
    for x in uc: inds[x["industry"]] = inds.get(x["industry"], 0) + 1
    rep = ["Q&A importate:        %d" % len(qa),
           "Use cases importate:  %d" % len(uc),
           "Respinse:             %d" % len(rejected), "",
           "Categorii Q&A:"] + \
          ["  %-28s %4d" % (k, v) for k, v in sorted(cats.items(), key=lambda x: -x[1])] + \
          ["", "Industrii use cases:"] + \
          ["  %-28s %4d" % (k, v) for k, v in sorted(inds.items(), key=lambda x: -x[1])]
    if rejected:
        rep += ["", "Primele 25 respinse:"] + ["  [%s] %s" % r for r in rejected[:25]]
    open(os.path.join(DATA, "kb-report.txt"), "w", encoding="utf-8").write("\n".join(rep))
    print("\n".join(rep))
    print("\nFișiere scrise în data/. Pasul următor: vezi data/README-kb.md")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    main(sys.argv[1:])
