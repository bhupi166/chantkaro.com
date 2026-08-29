-- Migration 0001: initial schema.
CREATE TABLE IF NOT EXISTS totals (
  category TEXT PRIMARY KEY CHECK (category IN ('chant', 'affirmation')),
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0)
);

INSERT OR IGNORE INTO totals (category, count) VALUES ('chant', 0);
INSERT OR IGNORE INTO totals (category, count) VALUES ('affirmation', 0);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  idempotency_key TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('chant', 'affirmation')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys (created_at);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL
);
