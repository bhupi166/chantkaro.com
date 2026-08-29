import { API_BASE } from './env';
import { getDeviceId } from './deviceId';

export interface SessionInfo {
  token: string;
  expiresAt: number;
  turnstileSiteKey: string | null;
}

/** Refresh a little before actual expiry so an in-flight batch never races a just-expired token. */
const EXPIRY_SAFETY_MARGIN_MS = 60_000;

let cached: SessionInfo | null = null;
let inFlight: Promise<SessionInfo | null> | null = null;

async function requestNewSession(): Promise<SessionInfo | null> {
  try {
    const res = await fetch(`${API_BASE}/api/session/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ deviceId: getDeviceId() }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data?.token !== 'string' || typeof data?.expiresAt !== 'string') return null;
    return {
      token: data.token,
      expiresAt: new Date(data.expiresAt).getTime(),
      turnstileSiteKey: typeof data.turnstileSiteKey === 'string' ? data.turnstileSiteKey : null,
    };
  } catch {
    return null;
  }
}

/**
 * Returns a valid session token, starting a new session with the server if
 * none is cached or the cached one is near expiry. Never throws — a
 * network/server problem just means no token, which callers treat the same
 * as "offline" (skip this sync attempt, try again next cycle).
 */
export async function getSessionToken(): Promise<SessionInfo | null> {
  if (cached && cached.expiresAt - EXPIRY_SAFETY_MARGIN_MS > Date.now()) return cached;
  if (inFlight) return inFlight;
  inFlight = requestNewSession().then((info) => {
    inFlight = null;
    if (info) cached = info;
    return info;
  });
  return inFlight;
}

/** Whatever is currently cached, without triggering a network call — used by the best-effort beacon path. */
export function getCachedSessionToken(): SessionInfo | null {
  return cached;
}

/** Forces the next getSessionToken() call to fetch a fresh session (e.g. after a 401). */
export function invalidateSessionToken(): void {
  cached = null;
}

export function __resetSessionForTests(): void {
  cached = null;
  inFlight = null;
}
