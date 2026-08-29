import type { AppData, ProfileData } from './types';

export const STORAGE_KEY = 'chantkaro:data:v1';
export const CURRENT_SCHEMA_VERSION = 1;

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createProfile(name: string): ProfileData {
  return {
    id: uid(),
    name,
    createdAt: new Date().toISOString(),
    theme: 'system',
    uiLanguage: 'en',
    vibrationEnabled: true,
    soundEnabled: false,
    contributeToGlobalTotals: true,
    hasSeenContributionNotice: false,
    customChants: [],
    customAffirmations: [],
    recentPracticeKeys: [],
    stats: {},
    dailyLog: [],
  };
}

export function createDefaultAppData(): AppData {
  const profile = createProfile('Me');
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    activeProfileId: profile.id,
    profiles: [profile],
  };
}

/**
 * Migrates raw parsed JSON of any older schema version forward to the
 * current shape. Each step only needs to know how to move from N to N+1.
 */
function migrate(raw: unknown): AppData {
  const data = raw as Partial<AppData> | null | undefined;
  if (
    !data ||
    typeof data !== 'object' ||
    !Array.isArray(data.profiles) ||
    data.profiles.length === 0
  ) {
    return createDefaultAppData();
  }
  // No migrations defined yet beyond v1; future steps go here, e.g.:
  // if (data.schemaVersion === 1) { ...upgrade to v2...; data.schemaVersion = 2; }
  return { ...createDefaultAppData(), ...data, schemaVersion: CURRENT_SCHEMA_VERSION } as AppData;
}

let memoryFallback: AppData | null = null;

function isStorageAvailable(): boolean {
  try {
    const testKey = '__chantkaro_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function loadAppData(): AppData {
  if (!isStorageAvailable()) {
    return memoryFallback ?? (memoryFallback = createDefaultAppData());
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultAppData();
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch {
    // Corrupted data: recover gracefully rather than crashing the app.
    return createDefaultAppData();
  }
}

export function saveAppData(data: AppData): void {
  if (!isStorageAvailable()) {
    memoryFallback = data;
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked (e.g. private browsing quota) — keep working
    // in memory for this session rather than throwing.
    memoryFallback = data;
  }
}

export function clearAppData(): AppData {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  memoryFallback = null;
  return createDefaultAppData();
}

export function exportAppDataJson(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export interface ImportResult {
  ok: boolean;
  data?: AppData;
  error?: string;
}

export function importAppDataJson(json: string): ImportResult {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.profiles)) {
      return { ok: false, error: 'This file does not look like a Chant Karo backup.' };
    }
    return { ok: true, data: migrate(parsed) };
  } catch {
    return { ok: false, error: 'This file could not be read as valid JSON.' };
  }
}
