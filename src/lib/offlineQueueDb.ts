/**
 * IndexedDB-backed persistence for the anonymous-contribution offline
 * queue (spec: "Use IndexedDB for ... offline queues"). The data shape is
 * a single small JSON record — IndexedDB is used here as a roomier, more
 * durable replacement for LocalStorage for that one record, not as a
 * queryable multi-row store.
 *
 * Every function degrades gracefully: if IndexedDB is unavailable
 * (unsupported, private-browsing restrictions, quota errors), callers get
 * `null`/no-op rather than a thrown error — global-contribution queueing
 * is inherently best-effort and must never interfere with personal
 * counting (which never touches this module at all).
 */

const DB_NAME = 'chantkaro-queue';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const RECORD_KEY = 'queue-state';

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function loadQueueRecord<T>(): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(RECORD_KEY);
      request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    } finally {
      db.close();
    }
  });
}

/** Returns true on success, false on any failure (including quota errors) — never throws. */
export async function saveQueueRecord<T>(value: T): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, RECORD_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false); // e.g. QuotaExceededError
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    } finally {
      db.close();
    }
  });
}
