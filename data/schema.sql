-- AiVenture — schema D1 pentru banca de 1900 Q&A + 199 use cases
-- Rulează: wrangler d1 execute aiventure-kb --remote --file=./data/schema.sql

PRAGMA foreign_keys = ON;

-- ============================================================ Q&A (1900)
CREATE TABLE IF NOT EXISTS qa (
  id            INTEGER PRIMARY KEY,
  slug          TEXT    NOT NULL UNIQUE,      -- ex. ce-este-ai-lens
  question      TEXT    NOT NULL,
  answer        TEXT    NOT NULL,
  category      TEXT    NOT NULL,             -- ex. niveluri | lens | agent | a2a | eu-ai-act
  subcategory   TEXT,
  audience      TEXT,                         -- imm | it | contabilitate | consultanti | agentii | freelanceri
  level         INTEGER,                      -- 1..4 pe scara de maturitate
  page_path     TEXT,                         -- pagina de site pe care apare vizibil
  lang          TEXT    NOT NULL DEFAULT 'ro',
  vector_id     TEXT,                         -- id în Vectorize
  source        TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_qa_cat   ON qa(category);
CREATE INDEX IF NOT EXISTS idx_qa_page  ON qa(page_path);
CREATE INDEX IF NOT EXISTS idx_qa_aud   ON qa(audience);
CREATE INDEX IF NOT EXISTS idx_qa_level ON qa(level);

-- căutare full-text în română
CREATE VIRTUAL TABLE IF NOT EXISTS qa_fts USING fts5(
  question, answer, category, content='qa', content_rowid='id', tokenize='unicode61 remove_diacritics 2'
);
CREATE TRIGGER IF NOT EXISTS qa_ai AFTER INSERT ON qa BEGIN
  INSERT INTO qa_fts(rowid, question, answer, category) VALUES (new.id, new.question, new.answer, new.category);
END;
CREATE TRIGGER IF NOT EXISTS qa_ad AFTER DELETE ON qa BEGIN
  INSERT INTO qa_fts(qa_fts, rowid, question, answer, category) VALUES('delete', old.id, old.question, old.answer, old.category);
END;
CREATE TRIGGER IF NOT EXISTS qa_au AFTER UPDATE ON qa BEGIN
  INSERT INTO qa_fts(qa_fts, rowid, question, answer, category) VALUES('delete', old.id, old.question, old.answer, old.category);
  INSERT INTO qa_fts(rowid, question, answer, category) VALUES (new.id, new.question, new.answer, new.category);
END;

-- ============================================================ USE CASES (199)
CREATE TABLE IF NOT EXISTS usecase (
  id            INTEGER PRIMARY KEY,
  slug          TEXT    NOT NULL UNIQUE,
  title         TEXT    NOT NULL,
  industry      TEXT    NOT NULL,             -- contabilitate | it | juridic | productie | retail | ...
  audience      TEXT,
  level         INTEGER,                      -- treapta de maturitate pe care o rezolvă
  situation     TEXT    NOT NULL,             -- ÎNAINTE — ce se întâmplă azi
  discovered    TEXT,                         -- CE AM DESCOPERIT
  action        TEXT,                         -- CE AM FĂCUT
  outcome       TEXT,                         -- DUPĂ
  next_step     TEXT,                         -- URMĂTORUL PAS
  service_slug  TEXT,                         -- ai-lens | ai-audit | ai-ready | agent-ready | a2a | eu-ai-act-ready
  lang          TEXT    NOT NULL DEFAULT 'ro',
  vector_id     TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_uc_ind  ON usecase(industry);
CREATE INDEX IF NOT EXISTS idx_uc_srv  ON usecase(service_slug);
CREATE INDEX IF NOT EXISTS idx_uc_lvl  ON usecase(level);

CREATE VIRTUAL TABLE IF NOT EXISTS uc_fts USING fts5(
  title, situation, outcome, industry, content='usecase', content_rowid='id', tokenize='unicode61 remove_diacritics 2'
);
CREATE TRIGGER IF NOT EXISTS uc_ai AFTER INSERT ON usecase BEGIN
  INSERT INTO uc_fts(rowid, title, situation, outcome, industry) VALUES (new.id, new.title, new.situation, new.outcome, new.industry);
END;

-- ============================================================ TELEMETRIE
CREATE TABLE IF NOT EXISTS query_log (
  id         INTEGER PRIMARY KEY,
  q          TEXT NOT NULL,
  hits       INTEGER,
  mode       TEXT,                            -- fts | vector | hybrid
  ts         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ql_ts ON query_log(ts);
