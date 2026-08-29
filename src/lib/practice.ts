import type { PracticeSelection, PracticeStats } from './types';
import { todayKey } from './format';

/** Stable key used to bucket per-practice stats in ProfileData.stats. */
export function practiceKey(selection: PracticeSelection): string {
  if (selection.optionId) return `option:${selection.optionId}`;
  if (selection.customId) return `custom:${selection.customId}`;
  return `text:${selection.category}:${selection.displayText.trim().toLowerCase()}`;
}

export function createEmptyStats(target: PracticeStats['target'] = null): PracticeStats {
  return {
    sessionCount: 0,
    todayCount: 0,
    todayDate: todayKey(),
    lifetimeCount: 0,
    target,
    completions: [],
  };
}

/** Rolls todayCount over to 0 if the stored date is not today, keeping lifetime intact. */
export function rolledOverForToday(stats: PracticeStats): PracticeStats {
  const today = todayKey();
  if (stats.todayDate === today) return stats;
  return { ...stats, todayCount: 0, todayDate: today };
}

export function progressPercent(stats: PracticeStats): number | null {
  if (!stats.target || stats.target <= 0) return null;
  return Math.min(100, Math.round((stats.sessionCount / stats.target) * 100));
}

export function isTargetReached(stats: PracticeStats): boolean {
  return !!stats.target && stats.target > 0 && stats.sessionCount >= stats.target;
}
