-- Chant Karo aggregate totals schema (Cloudflare D1 / SQLite).
-- This file is the full current schema, convenient for a fresh local init.
-- Production changes should go through migrations/ instead.

CREATE TABLE IF NOT EXISTS totals (
  category TEXT PRIMARY KEY CHECK (category IN ('chant', 'affirmation')),
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0)
);

INSERT OR IGNORE INTO totals (category, count) VALUES ('chant', 0);
INSERT OR IGNORE INTO totals (category, count) VALUES ('affirmation', 0);

-- One row per idempotency key ever applied, so a resubmitted batch (e.g.
-- after a client retried a timed-out request) is detected and safely
-- ignored instead of double-counted. No personal data — just the key,
-- what it did, and when.
CREATE TABLE IF NOT EXISTS idempotency_keys (
  idempotency_key TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('chant', 'affirmation')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys (created_at);

-- Coarse, short-lived abuse-rate limiting. bucket_key is a hash of the
-- caller's IP and a rolling time window (see src/rateLimit.ts) — never the
-- raw IP — and rows are pruned hourly by the Worker's scheduled handler, so
-- nothing here amounts to a persistent device fingerprint.
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL
);
