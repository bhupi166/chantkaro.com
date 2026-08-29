import { beforeEach, describe, expect, it } from 'vitest';
import { loadQueueRecord, saveQueueRecord } from './offlineQueueDb';

function deleteDb(): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase('chantkaro-queue');
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

beforeEach(async () => {
  await deleteDb();
});

describe('offlineQueueDb', () => {
  it('returns null when nothing has been saved yet', async () => {
    const result = await loadQueueRecord();
    expect(result).toBeNull();
  });

  it('round-trips an arbitrary JSON-serializable record', async () => {
    const record = { pending: { chant: 3, affirmation: 0 }, queue: [{ a: 1 }] };
    const ok = await saveQueueRecord(record);
    expect(ok).toBe(true);
    const loaded = await loadQueueRecord<typeof record>();
    expect(loaded).toEqual(record);
  });

  it('overwrites the previous record on a second save', async () => {
    await saveQueueRecord({ n: 1 });
    await saveQueueRecord({ n: 2 });
    const loaded = await loadQueueRecord<{ n: number }>();
    expect(loaded).toEqual({ n: 2 });
  });
});
