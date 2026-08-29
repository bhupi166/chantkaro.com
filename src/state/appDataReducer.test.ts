import { describe, expect, it } from 'vitest';
import { createDefaultAppData } from '@/lib/storage';
import { practiceKey } from '@/lib/practice';
import { appDataReducer } from './appDataReducer';

const selection = {
  category: 'chant' as const,
  optionId: 'sanatan-om-namah-shivaya',
  displayText: 'Om Namah Shivaya',
};
const affirmationSelection = {
  category: 'affirmation' as const,
  optionId: 'aff-i-am-peaceful',
  displayText: 'I am peaceful',
};
const key = practiceKey(selection);
const affKey = practiceKey(affirmationSelection);

function activeStats(state: ReturnType<typeof createDataWithTaps>, k = key) {
  const profile = state.profiles.find((p) => p.id === state.activeProfileId)!;
  return profile.stats[k];
}

function createDataWithTaps(taps: number) {
  let state = createDefaultAppData();
  for (let i = 0; i < taps; i++) {
    state = appDataReducer(state, { type: 'TAP', key, category: 'chant' });
  }
  return state;
}

describe('appDataReducer TAP/UNDO', () => {
  it('a single TAP increments session, today and lifetime by exactly one', () => {
    const state = appDataReducer(createDefaultAppData(), { type: 'TAP', key, category: 'chant' });
    const stats = activeStats(state);
    expect(stats.sessionCount).toBe(1);
    expect(stats.todayCount).toBe(1);
    expect(stats.lifetimeCount).toBe(1);
  });

  it('rapid repeated taps stay accurate', () => {
    const state = createDataWithTaps(50);
    const stats = activeStats(state);
    expect(stats.sessionCount).toBe(50);
    expect(stats.lifetimeCount).toBe(50);
  });

  it('UNDO removes exactly one repetition', () => {
    const tapped = createDataWithTaps(5);
    const undone = appDataReducer(tapped, { type: 'UNDO', key, category: 'chant' });
    const stats = activeStats(undone);
    expect(stats.sessionCount).toBe(4);
    expect(stats.lifetimeCount).toBe(4);
  });

  it('UNDO never goes below zero', () => {
    const state = appDataReducer(createDefaultAppData(), { type: 'UNDO', key, category: 'chant' });
    const stats = activeStats(state) ?? { sessionCount: 0 };
    expect(stats.sessionCount ?? 0).toBe(0);
  });

  it('RESET_SESSION zeroes the session count but preserves lifetime total', () => {
    const tapped = createDataWithTaps(10);
    const reset = appDataReducer(tapped, { type: 'RESET_SESSION', key });
    const stats = activeStats(reset);
    expect(stats.sessionCount).toBe(0);
    expect(stats.lifetimeCount).toBe(10);
  });

  it('records a completion exactly once when the target is reached, and undo retracts it', () => {
    let state = createDefaultAppData();
    state = appDataReducer(state, { type: 'SET_TARGET', key, target: 3 });
    state = appDataReducer(state, { type: 'TAP', key, category: 'chant' });
    state = appDataReducer(state, { type: 'TAP', key, category: 'chant' });
    state = appDataReducer(state, { type: 'TAP', key, category: 'chant' });
    expect(activeStats(state).completions).toHaveLength(1);

    // tapping past target must not add a second completion entry
    state = appDataReducer(state, { type: 'TAP', key, category: 'chant' });
    expect(activeStats(state).completions).toHaveLength(1);

    state = appDataReducer(state, { type: 'UNDO', key, category: 'chant' });
    expect(activeStats(state).completions).toHaveLength(1);
    state = appDataReducer(state, { type: 'UNDO', key, category: 'chant' });
    expect(activeStats(state).completions).toHaveLength(0);
  });

  it('keeps separate practices in separate totals', () => {
    let state = createDefaultAppData();
    state = appDataReducer(state, { type: 'TAP', key, category: 'chant' });
    state = appDataReducer(state, { type: 'TAP', key: affKey, category: 'affirmation' });
    state = appDataReducer(state, { type: 'TAP', key: affKey, category: 'affirmation' });
    expect(activeStats(state, key).sessionCount).toBe(1);
    expect(activeStats(state, affKey).sessionCount).toBe(2);
  });

  it('tracks chant and affirmation totals separately in the daily log', () => {
    let state = createDefaultAppData();
    state = appDataReducer(state, { type: 'TAP', key, category: 'chant' });
    state = appDataReducer(state, { type: 'TAP', key, category: 'chant' });
    state = appDataReducer(state, { type: 'TAP', key: affKey, category: 'affirmation' });
    const profile = state.profiles.find((p) => p.id === state.activeProfileId)!;
    expect(profile.dailyLog[0].chantCount).toBe(2);
    expect(profile.dailyLog[0].affirmationCount).toBe(1);
  });
});

describe('appDataReducer profiles', () => {
  it('keeps progress isolated between local profiles', () => {
    let state = createDefaultAppData();
    const firstProfileId = state.activeProfileId;
    state = appDataReducer(state, { type: 'CREATE_PROFILE', name: 'Mother' });
    const motherId = state.activeProfileId;
    expect(motherId).not.toBe(firstProfileId);

    state = appDataReducer(state, { type: 'TAP', key, category: 'chant' });
    state = appDataReducer(state, { type: 'SWITCH_PROFILE', profileId: firstProfileId });
    state = appDataReducer(state, { type: 'TAP', key, category: 'chant' });
    state = appDataReducer(state, { type: 'TAP', key, category: 'chant' });

    const me = state.profiles.find((p) => p.id === firstProfileId)!;
    const mother = state.profiles.find((p) => p.id === motherId)!;
    expect(me.stats[key].sessionCount).toBe(2);
    expect(mother.stats[key].sessionCount).toBe(1);
  });

  it('refuses to delete the last remaining profile', () => {
    const state = createDefaultAppData();
    const result = appDataReducer(state, {
      type: 'DELETE_PROFILE',
      profileId: state.activeProfileId,
    });
    expect(result.profiles).toHaveLength(1);
  });
});

describe('appDataReducer settings', () => {
  it('can disable global contribution without touching personal counts', () => {
    let state = createDefaultAppData();
    state = appDataReducer(state, {
      type: 'UPDATE_SETTINGS',
      patch: { contributeToGlobalTotals: false },
    });
    state = appDataReducer(state, { type: 'TAP', key, category: 'chant' });
    const profile = state.profiles.find((p) => p.id === state.activeProfileId)!;
    expect(profile.contributeToGlobalTotals).toBe(false);
    expect(profile.stats[key].sessionCount).toBe(1);
  });
});
