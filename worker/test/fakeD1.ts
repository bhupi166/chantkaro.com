/**
 * Minimal in-memory stand-in for D1Database, covering exactly the query
 * shapes used by src/index.ts and src/rateLimit.ts. Not a general SQL
 * engine — each `prepare()` call is matched by a recognizable substring of
 * the query text against the fake's in-memory tables.
 */
export function createFakeD1() {
  const totals = new Map<string, number>([
    ['chant', 0],
    ['affirmation', 0],
  ]);
  const idempotencyKeys = new Set<string>();
  const rateLimits = new Map<string, number>();

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
          const bucketKey = boundArgs[0] as string;
          const next = (rateLimits.get(bucketKey) ?? 0) + 1;
          rateLimits.set(bucketKey, next);
          return { count: next } as T;
        }
        return null;
      },

      async run() {
        applyWrite(sql, boundArgs);
        return { success: true } as unknown;
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

  function applyWrite(sql: string, args: unknown[]) {
    if (sql.includes('INSERT INTO idempotency_keys')) {
      idempotencyKeys.add(args[0] as string);
    } else if (sql.includes('UPDATE totals SET count = count')) {
      const [amount, category] = args as [number, string];
      totals.set(category, (totals.get(category) ?? 0) + amount);
    }
  }

  return {
    totals,
    idempotencyKeys,
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
