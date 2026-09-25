CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS posts (
 id TEXT PRIMARY KEY, text TEXT NOT NULL, permalink TEXT, published_at TEXT NOT NULL,
 first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL, project_country TEXT,
 CHECK(project_country IS NULL OR length(project_country)=2)
);
CREATE TABLE IF NOT EXISTS analyses (
 post_id TEXT NOT NULL REFERENCES posts(id), version TEXT NOT NULL, dictionary_hash TEXT NOT NULL,
 text_hash TEXT NOT NULL, result_json TEXT NOT NULL, created_at TEXT NOT NULL,
 PRIMARY KEY(post_id,version,dictionary_hash,text_hash)
);
CREATE TABLE IF NOT EXISTS query_runs (
 id TEXT PRIMARY KEY, query_id TEXT NOT NULL, query_text TEXT NOT NULL,
 since_at TEXT NOT NULL, until_at TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT,
 status TEXT NOT NULL CHECK(status IN ('running','complete','partial','error')),
 requests INTEGER NOT NULL DEFAULT 0, received INTEGER NOT NULL DEFAULT 0,
 inserted INTEGER NOT NULL DEFAULT 0, skipped INTEGER NOT NULL DEFAULT 0, message TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS post_query_matches (
 post_id TEXT NOT NULL REFERENCES posts(id), run_id TEXT NOT NULL REFERENCES query_runs(id),
 PRIMARY KEY(post_id,run_id)
);
CREATE TABLE IF NOT EXISTS checkpoints (query_id TEXT PRIMARY KEY, query_text TEXT NOT NULL, completed_until TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS locks (name TEXT PRIMARY KEY, owner TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS posts_date ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS runs_date ON query_runs(started_at DESC);
