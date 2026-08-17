#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generează embeddings pentru NDJSON-urile produse de import_kb.py.

  export CF_ACCOUNT_ID=...
  export CF_API_TOKEN=...        # permisiune: Workers AI Read
  python3 build/embed_kb.py data/vectors-qa.ndjson data/vectors-uc.ndjson

Scrie data/vectors-embedded.ndjson în formatul cerut de `wrangler vectorize insert`.
Reia de unde a rămas: dacă fișierul de ieșire există, sare peste id-urile deja procesate.
"""
import os, sys, json, time, urllib.request

MODEL = "@cf/baai/bge-m3"
BATCH = 50
OUT   = "data/vectors-embedded.ndjson"

ACC = os.environ.get("CF_ACCOUNT_ID")
TOK = os.environ.get("CF_API_TOKEN")
if not ACC or not TOK:
    sys.exit("Lipsesc CF_ACCOUNT_ID și/sau CF_API_TOKEN din mediu.")

URL = "https://api.cloudflare.com/client/v4/accounts/%s/ai/run/%s" % (ACC, MODEL)

def embed(texts):
    body = json.dumps({"text": texts}).encode()
    req = urllib.request.Request(URL, data=body, headers={
        "Authorization": "Bearer " + TOK, "Content-Type": "application/json"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                d = json.load(r)
            if not d.get("success"):
                raise RuntimeError(d.get("errors"))
            return d["result"]["data"]
        except Exception as e:
            if attempt == 4:
                raise
            time.sleep(2 ** attempt)

def main(paths):
    done = set()
    if os.path.exists(OUT):
        for l in open(OUT, encoding="utf-8"):
            try: done.add(json.loads(l)["id"])
            except Exception: pass
        print("reiau — %d vectori deja generați" % len(done))

    items = []
    for p in paths:
        for l in open(p, encoding="utf-8"):
            if l.strip():
                o = json.loads(l)
                if o["id"] not in done:
                    items.append(o)
    print("de procesat: %d" % len(items))

    with open(OUT, "a", encoding="utf-8") as f:
        for i in range(0, len(items), BATCH):
            chunk = items[i:i + BATCH]
            vecs = embed([c["text"] for c in chunk])
            for c, v in zip(chunk, vecs):
                f.write(json.dumps({"id": c["id"], "values": v,
                                    "metadata": c["metadata"]}, ensure_ascii=False) + "\n")
            f.flush()
            print("  %d/%d" % (min(i + BATCH, len(items)), len(items)))
    print("gata →", OUT)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    main(sys.argv[1:])
