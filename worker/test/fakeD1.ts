/**
 * Minimal in-memory stand-in for D1Database, covering exactly the query
 * shapes used by src/index.ts, src/db.ts and src/rateLimit.ts. Not a
 * general SQL engine — each `prepare()` call is matched by a recognizable
 * substring of the query text against the fake's in-memory tables.
 */
export function createFakeD1() {
  const totals = new Map<string, number>([
    ['chant', 0],
    ['affirmation', 0],
  ]);
  const idempotencyKeys = new Map<string, { category: string; amount: number; createdAt: string }>();
  const rateLimits = new Map<string, { count: number; windowStart: string }>();
  let syncConfig = {
    mode: 'normal',
    batch_threshold: 100,
    totals_refresh_seconds: 45,
    submissions_paused: 0,
    auto_managed: 1,
    updated_at: new Date(0).toISOString(),
  };
  const sessions = new Map<
    string,
    {
      expires_at: string;
      ip_hash: string;
      device_hash: string;
      suspicion_score: number;
      challenge_required: number;
      last_batch_at: string | null;
      last_interval_ms: number | null;
      pattern_streak: number;
    }
  >();
  let securityConfig = {
    max_tap_rate_per_second: 8,
    max_voice_rate_per_second: 2,
    session_ttl_seconds: 21_600,
    challenge_suspicion_threshold: 5,
    abuse_lockdown: 0,
    challenges_issued: 0,
    challenges_passed: 0,
    batches_rejected_speed: 0,
    batches_rejected_pattern: 0,
    batches_rejected_auth: 0,
  };

  function statement(sql: string, boundArgs: unknown[] = []) {
    return {
      __sql: sql,
      __args: boundArgs,
      bind: (...args: unknown[]) => statement(sql, args),

      async first<T>(): Promise<T | null> {
        if (sql.includes('SELECT idempotency_key FROM idempotency_keys')) {
          const key = boundArgs[0] as string;
          return (idempotencyKeys.has(key) ? { idempotency_key: key } : null) as T | null;
        }
        if (sql.includes('INSERT INTO rate_limits')) {
          const [bucketKey, windowStart] = boundArgs as [string, string];
          const existing = rateLimits.get(bucketKey);
          const next = { count: (existing?.count ?? 0) + 1, windowStart };
          rateLimits.set(bucketKey, next);
          return { count: next.count } as T;
        }
        if (sql.includes('SELECT mode, batch_threshold') && sql.includes('sync_config')) {
          return { ...syncConfig } as T;
        }
        if (sql.includes('SELECT COUNT(*) AS n FROM idempotency_keys')) {
          if (sql.includes('WHERE created_at >=')) {
            const since = boundArgs[0] as string;
            const n = Array.from(idempotencyKeys.values()).filter((r) => r.createdAt >= since).length;
            return { n } as T;
          }
          return { n: idempotencyKeys.size } as T;
        }
        if (sql.includes('SELECT COUNT(*) AS n FROM rate_limits')) {
          return { n: rateLimits.size } as T;
        }
        if (sql.includes('SELECT session_id') && sql.includes('FROM sessions')) {
          const id = boundArgs[0] as string;
          const row = sessions.get(id);
          return (row ? { session_id: id, ...row } : null) as T | null;
        }
        if (sql.includes('SELECT max_tap_rate_per_second') && sql.includes('security_config')) {
          return { ...securityConfig } as T;
        }
        if (sql.includes('SELECT challenges_issued') && sql.includes('security_config')) {
          return { ...securityConfig } as T;
        }
        return null;
      },

      async run() {
        applyWrite(sql, boundArgs);
        return { success: true, meta: { changes: lastDeleteCount } } as unknown;
      },

      async all<T>() {
        if (sql.includes('SELECT category, count FROM totals')) {
          const results = Array.from(totals.entries()).map(([category, count]) => ({
            category,
            count,
          }));
          return { results } as unknown as { results: T[] };
        }
        return { results: [] } as unknown as { results: T[] };
      },
    };
  }

  let lastDeleteCount = 0;

  function applyWrite(sql: string, args: unknown[]) {
    if (sql.includes('INSERT INTO idempotency_keys')) {
      const [key, category, amount] = args as [string, string, number];
      idempotencyKeys.set(key, { category, amount, createdAt: new Date().toISOString() });
    } else if (sql.includes('UPDATE totals SET count = count')) {
      const [amount, category] = args as [number, string];
      totals.set(category, (totals.get(category) ?? 0) + amount);
    } else if (sql.includes('UPDATE sync_config')) {
      const [mode, batchThreshold, totalsRefreshSeconds, submissionsPaused, autoManaged, updatedAt] =
        args as [string, number, number, number, number, string];
      syncConfig = {
        mode,
        batch_threshold: batchThreshold,
        totals_refresh_seconds: totalsRefreshSeconds,
        submissions_paused: submissionsPaused,
        auto_managed: autoManaged,
        updated_at: updatedAt,
      };
    } else if (sql.includes('DELETE FROM idempotency_keys WHERE created_at <')) {
      const cutoff = args[0] as string;
      let removed = 0;
      for (const [key, row] of idempotencyKeys) {
        if (row.createdAt < cutoff) {
          idempotencyKeys.delete(key);
          removed++;
        }
      }
      lastDeleteCount = removed;
    } else if (sql.includes('DELETE FROM rate_limits WHERE window_start <')) {
      const cutoff = args[0] as string;
      let removed = 0;
      for (const [key, row] of rateLimits) {
        if (row.windowStart < cutoff) {
          rateLimits.delete(key);
          removed++;
        }
      }
      lastDeleteCount = removed;
    } else if (sql.includes('INSERT INTO sessions')) {
      const [sessionId, expiresAt, ipHash, deviceHash] = args as [string, string, string, string];
      sessions.set(sessionId, {
        expires_at: expiresAt,
        ip_hash: ipHash,
        device_hash: deviceHash,
        suspicion_score: 0,
        challenge_required: 0,
        last_batch_at: null,
        last_interval_ms: null,
        pattern_streak: 0,
      });
    } else if (sql.includes('UPDATE sessions') && sql.includes('suspicion_score = ?1')) {
      const [suspicionScore, challengeRequired, patternStreak, lastBatchAt, lastIntervalMs, sessionId] =
        args as [number, number, number, string, number | null, string];
      const row = sessions.get(sessionId);
      if (row) {
        sessions.set(sessionId, {
          ...row,
          suspicion_score: suspicionScore,
          challenge_required: challengeRequired,
          pattern_streak: patternStreak,
          last_batch_at: lastBatchAt,
          last_interval_ms: lastIntervalMs,
        });
      }
    } else if (sql.includes('UPDATE sessions SET challenge_required = 0')) {
      const [sessionId] = args as [string];
      const row = sessions.get(sessionId);
      if (row) {
        sessions.set(sessionId, { ...row, challenge_required: 0, suspicion_score: 0, pattern_streak: 0 });
      }
    } else if (sql.includes('DELETE FROM sessions WHERE expires_at <')) {
      const cutoff = args[0] as string;
      let removed = 0;
      for (const [key, row] of sessions) {
        if (row.expires_at < cutoff) {
          sessions.delete(key);
          removed++;
        }
      }
      lastDeleteCount = removed;
    } else if (sql.includes('UPDATE security_config') && sql.includes('max_tap_rate_per_second = ?1')) {
      const [maxTap, maxVoice, ttl, threshold, lockdown] = args as [number, number, number, number, number];
      securityConfig = {
        ...securityConfig,
        max_tap_rate_per_second: maxTap,
        max_voice_rate_per_second: maxVoice,
        session_ttl_seconds: ttl,
        challenge_suspicion_threshold: threshold,
        abuse_lockdown: lockdown,
      };
    } else if (/UPDATE security_config SET (\w+) = \1 \+ 1/.test(sql)) {
      const match = sql.match(/UPDATE security_config SET (\w+) = \1 \+ 1/);
      const column = match?.[1] as keyof typeof securityConfig | undefined;
      if (column) securityConfig = { ...securityConfig, [column]: (securityConfig[column] as number) + 1 };
    } else {
      lastDeleteCount = 0;
    }
  }

  return {
    totals,
    idempotencyKeys,
    rateLimits,
    sessions,
    getSyncConfigRaw: () => syncConfig,
    setSyncConfigRaw: (patch: Partial<typeof syncConfig>) => {
      syncConfig = { ...syncConfig, ...patch };
    },
    getSecurityConfigRaw: () => securityConfig,
    setSecurityConfigRaw: (patch: Partial<typeof securityConfig>) => {
      securityConfig = { ...securityConfig, ...patch };
    },
    setSessionRaw: (id: string, patch: Record<string, unknown>) => {
      const existing = sessions.get(id) ?? {
        expires_at: new Date(Date.now() + 3_600_000).toISOString(),
        ip_hash: 'ip-hash',
        device_hash: 'device-hash',
        suspicion_score: 0,
        challenge_required: 0,
        last_batch_at: null,
        last_interval_ms: null,
        pattern_streak: 0,
      };
      sessions.set(id, { ...existing, ...(patch as object) });
    },
    prepare(sql: string) {
      return statement(sql);
    },
    async batch(stmts: ReturnType<typeof statement>[]) {
      // Re-run each statement's write against our fake tables. Since this
      // fake has no real transaction log, we recover the sql/args by
      // closing over them at prepare()/bind() time via a side channel.
      for (const stmt of stmts as unknown as { __sql: string; __args: unknown[] }[]) {
        applyWrite(stmt.__sql, stmt.__args);
      }
      return stmts.map(() => ({ success: true }));
    },
  };
}
