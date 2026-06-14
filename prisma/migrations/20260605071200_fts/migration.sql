-- Full-text search for published articles.
-- Contentless FTS5 table; rows are maintained from application code
-- (src/lib/search.ts) on publish/update, mapped to Article cuids via
-- article_fts_map (FTS5 requires integer rowids).

CREATE VIRTUAL TABLE article_fts USING fts5(
  title, abstract, authors, keywords,
  content='', tokenize='porter unicode61'
);

CREATE TABLE article_fts_map (
  rowid INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT UNIQUE NOT NULL
);
