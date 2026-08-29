-- Migration 0002: adaptive sync configuration.
-- A single-row table so the client's batch threshold, totals-refresh
-- interval and a submissions-paused flag can change at runtime — no
-- redeploy needed to respond to rising usage (see src/syncConfig.ts).
CREATE TABLE IF NOT EXISTS sync_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  mode TEXT NOT NULL DEFAULT 'normal' CHECK (mode IN ('normal', 'elevated', 'high', 'cost-protection')),
  batch_threshold INTEGER NOT NULL DEFAULT 100 CHECK (batch_threshold > 0),
  totals_refresh_seconds INTEGER NOT NULL DEFAULT 45 CHECK (totals_refresh_seconds > 0),
  submissions_paused INTEGER NOT NULL DEFAULT 0 CHECK (submissions_paused IN (0, 1)),
  auto_managed INTEGER NOT NULL DEFAULT 1 CHECK (auto_managed IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO sync_config (id, mode, batch_threshold, totals_refresh_seconds, submissions_paused, auto_managed)
VALUES (1, 'normal', 100, 45, 0, 1);
