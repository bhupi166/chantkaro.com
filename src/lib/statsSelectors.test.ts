import { describe, expect, it } from 'vitest';
import { createDefaultAppData } from './storage';
import { appDataReducer } from '@/state/appDataReducer';
import { practiceKey } from './practice';
import { lifetimeTotals, sevenDayTotal, todaysRepetitions } from './statsSelectors';

const chantSelection = {
  category: 'chant' as const,
  optionId: 'sanatan-om-namah-shivaya',
  displayText: 'Om Namah Shivaya',
};
const affSelection = {
  category: 'affirmation' as const,
  optionId: 'aff-i-am-peaceful',
  displayText: 'I am peaceful',
};

describe('statsSelectors', () => {
  it('splits lifetime totals by category correctly', () => {
    let state = createDefaultAppData();
    const chantKey = practiceKey(chantSelection);
    const affKey = practiceKey(affSelection);
    state = appDataReducer(state, { type: 'TAP', key: chantKey, category: 'chant' });
    state = appDataReducer(state, { type: 'TAP', key: chantKey, category: 'chant' });
    state = appDataReducer(state, { type: 'TAP', key: affKey, category: 'affirmation' });
    const profile = state.profiles.find((p) => p.id === state.activeProfileId)!;
    const totals = lifetimeTotals(profile);
    expect(totals.chant).toBe(2);
    expect(totals.affirmation).toBe(1);
  });

  it("today's repetitions and 7-day total include today's taps", () => {
    let state = createDefaultAppData();
    const chantKey = practiceKey(chantSelection);
    state = appDataReducer(state, { type: 'TAP', key: chantKey, category: 'chant' });
    state = appDataReducer(state, { type: 'TAP', key: chantKey, category: 'chant' });
    const profile = state.profiles.find((p) => p.id === state.activeProfileId)!;
    expect(todaysRepetitions(profile)).toBe(2);
    expect(sevenDayTotal(profile)).toBe(2);
  });
});
