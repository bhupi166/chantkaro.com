import { API_BASE } from './env';

export type SyncMode = 'normal' | 'elevated' | 'high' | 'cost-protection';

export interface SyncConfig {
  mode: SyncMode;
  batchThreshold: number;
  totalsRefreshSeconds: number;
  submissionsPaused: boolean;
  updatedAt: string;
}

/** Used whenever the server can't be reached — matches the server's own "normal" defaults. */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  mode: 'normal',
  batchThreshold: 100,
  totalsRefreshSeconds: 45,
  submissionsPaused: false,
  updatedAt: '',
};

const CONFIG_CACHE_KEY = 'chantkaro:syncConfig:v1';
/** Never re-fetch more often than this — the config itself is a cost surface. */
const MIN_REFETCH_INTERVAL_MS = 5 * 60_000;

function readCache(): SyncConfig | null {
  try {
    const raw = window.localStorage.getItem(CONFIG_CACHE_KEY);
    return raw ? (JSON.parse(raw) as SyncConfig) : null;
  } catch {
    return null;
  }
}

function writeCache(config: SyncConfig): void {
  try {
    window.localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config));
  } catch {
    /* best-effort */
  }
}

function isValidConfigPayload(data: unknown): data is SyncConfig {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.mode === 'string' &&
    typeof d.batchThreshold === 'number' &&
    d.batchThreshold > 0 &&
    typeof d.totalsRefreshSeconds === 'number' &&
    d.totalsRefreshSeconds > 0 &&
    typeof d.submissionsPaused === 'boolean'
  );
}

let memoryCache: SyncConfig | null = null;
let lastFetchAt = 0;
let inFlight: Promise<SyncConfig> | null = null;

/**
 * Returns the current adaptive sync config, fetching from the server at
 * most once per MIN_REFETCH_INTERVAL_MS and falling back to the last known
 * value (cached in LocalStorage — small preference-shaped data) or the
 * built-in default if the server has never been reached. Never throws —
 * a config-fetch failure must never block personal counting.
 */
export async function getSyncConfig(force = false): Promise<SyncConfig> {
  const now = Date.now();
  if (!force && memoryCache && now - lastFetchAt < MIN_REFETCH_INTERVAL_MS) {
    return memoryCache;
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/config`);
      if (!res.ok) throw new Error(`config fetch failed: ${res.status}`);
      const data: unknown = await res.json();
      if (!isValidConfigPayload(data)) throw new Error('malformed config payload');
      memoryCache = data;
      lastFetchAt = now;
      writeCache(data);
      return data;
    } catch {
      const fallback = memoryCache ?? readCache() ?? DEFAULT_SYNC_CONFIG;
      memoryCache = fallback;
      lastFetchAt = now; // don't hammer the endpoint on repeated failures either
      return fallback;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/** Synchronous best-effort read for hot paths (e.g. recording a tap) that can't await. */
export function getCachedSyncConfig(): SyncConfig {
  return memoryCache ?? readCache() ?? DEFAULT_SYNC_CONFIG;
}

export function __resetSyncConfigCacheForTests(): void {
  memoryCache = null;
  lastFetchAt = 0;
  inFlight = null;
}
