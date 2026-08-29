-- Server-side session/abuse-protection infrastructure for the global-totals
-- sync path. No personal data anywhere here: sessions are keyed by a random
-- server-issued id, and the only "identifying" fields are short-lived
-- salted hashes of IP/device signal, pruned well within days.

-- One row per active practice session. Created by POST /api/session/start
-- and required (via a signed token carrying its id) on every
-- POST /api/increment. suspicion_score/pattern tracking lets the server
-- detect implausible speeds or robotic timing without ever seeing the
-- actual chant text, voice or personal count.
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  device_hash TEXT NOT NULL,
  suspicion_score INTEGER NOT NULL DEFAULT 0,
  challenge_required INTEGER NOT NULL DEFAULT 0 CHECK (challenge_required IN (0, 1)),
  last_batch_at TEXT,
  last_interval_ms INTEGER,
  pattern_streak INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

-- Singleton row: anti-abuse thresholds (admin-tunable without a redeploy —
-- see PATCH /api/admin/security-config) plus a few aggregate abuse
-- counters. Never exposed verbatim to the public /api/config endpoint.
CREATE TABLE IF NOT EXISTS security_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  max_tap_rate_per_second REAL NOT NULL DEFAULT 8,
  max_voice_rate_per_second REAL NOT NULL DEFAULT 2,
  session_ttl_seconds INTEGER NOT NULL DEFAULT 21600,
  challenge_suspicion_threshold INTEGER NOT NULL DEFAULT 5,
  abuse_lockdown INTEGER NOT NULL DEFAULT 0 CHECK (abuse_lockdown IN (0, 1)),
  challenges_issued INTEGER NOT NULL DEFAULT 0,
  challenges_passed INTEGER NOT NULL DEFAULT 0,
  batches_rejected_speed INTEGER NOT NULL DEFAULT 0,
  batches_rejected_pattern INTEGER NOT NULL DEFAULT 0,
  batches_rejected_auth INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO security_config (id) VALUES (1);
