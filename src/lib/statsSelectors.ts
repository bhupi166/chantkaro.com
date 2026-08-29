import { todayKey } from './format';
import type { ProfileData } from './types';

export interface PracticeTotalRow {
  key: string;
  label: string;
  category: 'chant' | 'affirmation';
  lifetimeCount: number;
  todayCount: number;
}

export function todaysRepetitions(profile: ProfileData): number {
  const entry = profile.dailyLog.find((l) => l.date === todayKey());
  return entry ? entry.chantCount + entry.affirmationCount : 0;
}

export function sevenDayTotal(profile: ProfileData): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffKey = todayKey(cutoff);
  return profile.dailyLog
    .filter((l) => l.date >= cutoffKey)
    .reduce((sum, l) => sum + l.chantCount + l.affirmationCount, 0);
}

export function lifetimeTotals(profile: ProfileData): { chant: number; affirmation: number } {
  return Object.entries(profile.stats).reduce(
    (acc, [key, stats]) => {
      acc[inferCategory(key, profile)] += stats.lifetimeCount;
      return acc;
    },
    { chant: 0, affirmation: 0 },
  );
}

function inferCategory(key: string, profile: ProfileData): 'chant' | 'affirmation' {
  if (key.startsWith('text:chant:')) return 'chant';
  if (key.startsWith('text:affirmation:')) return 'affirmation';
  if (key.startsWith('option:')) {
    const id = key.slice('option:'.length);
    return id.startsWith('aff-') ? 'affirmation' : 'chant';
  }
  if (key.startsWith('custom:')) {
    const id = key.slice('custom:'.length);
    if (profile.customAffirmations.some((c) => c.id === id)) return 'affirmation';
    if (profile.customChants.some((c) => c.id === id)) return 'chant';
  }
  return 'chant';
}

export function last30DaysCalendar(profile: ProfileData): { date: string; count: number }[] {
  const days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    const entry = profile.dailyLog.find((l) => l.date === key);
    days.push({ date: key, count: entry ? entry.chantCount + entry.affirmationCount : 0 });
  }
  return days;
}

export function completionHistory(
  profile: ProfileData,
): { key: string; at: string; target: number }[] {
  return Object.entries(profile.stats)
    .flatMap(([key, stats]) => stats.completions.map((c) => ({ key, at: c.at, target: c.target })))
    .sort((a, b) => (a.at < b.at ? 1 : -1));
}
