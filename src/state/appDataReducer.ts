import { createEmptyStats, rolledOverForToday } from '@/lib/practice';
import { createProfile } from '@/lib/storage';
import { todayKey } from '@/lib/format';
import type {
  AppData,
  CustomPractice,
  PracticeCategory,
  PracticeMode,
  PracticeSelection,
  ProfileData,
  RepetitionTarget,
  ThemePreference,
  UiLanguage,
} from '@/lib/types';

export type AppDataAction =
  | { type: 'SWITCH_PROFILE'; profileId: string }
  | { type: 'CREATE_PROFILE'; name: string; makeActive?: boolean }
  | { type: 'RENAME_PROFILE'; profileId: string; name: string }
  | { type: 'DELETE_PROFILE'; profileId: string }
  | {
      type: 'UPDATE_SETTINGS';
      patch: Partial<
        Pick<
          ProfileData,
          | 'theme'
          | 'uiLanguage'
          | 'vibrationEnabled'
          | 'soundEnabled'
          | 'contributeToGlobalTotals'
          | 'hasSeenContributionNotice'
        >
      >;
    }
  | { type: 'ADD_CUSTOM_PRACTICE'; category: PracticeCategory; text: string }
  | { type: 'SET_ACTIVE_PRACTICE'; selection: PracticeSelection; mode: PracticeMode }
  | { type: 'SET_TARGET'; key: string; target: RepetitionTarget }
  | { type: 'TAP'; key: string; category: PracticeCategory }
  | { type: 'UNDO'; key: string; category: PracticeCategory }
  | { type: 'RESET_SESSION'; key: string }
  | { type: 'IMPORT_DATA'; data: AppData }
  | { type: 'CLEAR_ALL_DATA'; freshData: AppData };

function updateActiveProfile(state: AppData, fn: (p: ProfileData) => ProfileData): AppData {
  return {
    ...state,
    profiles: state.profiles.map((p) => (p.id === state.activeProfileId ? fn(p) : p)),
  };
}

function bumpDailyLog(
  profile: ProfileData,
  category: PracticeCategory,
  delta: number,
): ProfileData {
  const today = todayKey();
  const log = [...profile.dailyLog];
  const idx = log.findIndex((l) => l.date === today);
  if (idx === -1) {
    log.push({
      date: today,
      chantCount: category === 'chant' ? Math.max(0, delta) : 0,
      affirmationCount: category === 'affirmation' ? Math.max(0, delta) : 0,
    });
  } else {
    const entry = { ...log[idx] };
    if (category === 'chant') entry.chantCount = Math.max(0, entry.chantCount + delta);
    else entry.affirmationCount = Math.max(0, entry.affirmationCount + delta);
    log[idx] = entry;
  }
  // Keep a rolling 365 days of detailed daily history — lifetime totals
  // (ProfileData.stats[key].lifetimeCount) are separate fields and are
  // never trimmed, so this only bounds the day-by-day breakdown, not the
  // all-time counts.
  const trimmed = log.slice(-365);
  return { ...profile, dailyLog: trimmed };
}

export function appDataReducer(state: AppData, action: AppDataAction): AppData {
  switch (action.type) {
    case 'SWITCH_PROFILE': {
      if (!state.profiles.some((p) => p.id === action.profileId)) return state;
      return { ...state, activeProfileId: action.profileId };
    }
    case 'CREATE_PROFILE': {
      const profile = createProfile(action.name.trim() || 'Practitioner');
      return {
        ...state,
        profiles: [...state.profiles, profile],
        activeProfileId: action.makeActive === false ? state.activeProfileId : profile.id,
      };
    }
    case 'RENAME_PROFILE': {
      return {
        ...state,
        profiles: state.profiles.map((p) =>
          p.id === action.profileId ? { ...p, name: action.name.trim() || p.name } : p,
        ),
      };
    }
    case 'DELETE_PROFILE': {
      if (state.profiles.length <= 1) return state;
      const profiles = state.profiles.filter((p) => p.id !== action.profileId);
      const activeProfileId =
        state.activeProfileId === action.profileId ? profiles[0].id : state.activeProfileId;
      return { ...state, profiles, activeProfileId };
    }
    case 'UPDATE_SETTINGS': {
      return updateActiveProfile(state, (p) => ({ ...p, ...action.patch }));
    }
    case 'ADD_CUSTOM_PRACTICE': {
      const entry: CustomPractice = {
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        category: action.category,
        text: action.text.trim(),
        createdAt: new Date().toISOString(),
      };
      return updateActiveProfile(state, (p) =>
        action.category === 'chant'
          ? { ...p, customChants: [entry, ...p.customChants].slice(0, 50) }
          : { ...p, customAffirmations: [entry, ...p.customAffirmations].slice(0, 50) },
      );
    }
    case 'SET_ACTIVE_PRACTICE': {
      return updateActiveProfile(state, (p) => {
        const recentKey = `${action.selection.category}:${action.selection.optionId ?? action.selection.customId ?? action.selection.displayText}`;
        const recentPracticeKeys = [
          recentKey,
          ...p.recentPracticeKeys.filter((k) => k !== recentKey),
        ].slice(0, 8);
        return {
          ...p,
          lastActivePractice: action.selection,
          lastMode: action.mode,
          recentPracticeKeys,
        };
      });
    }
    case 'SET_TARGET': {
      return updateActiveProfile(state, (p) => {
        const existing = p.stats[action.key] ?? createEmptyStats();
        return {
          ...p,
          stats: { ...p.stats, [action.key]: { ...existing, target: action.target } },
        };
      });
    }
    case 'TAP': {
      return updateActiveProfile(state, (p) => {
        const existing = rolledOverForToday(p.stats[action.key] ?? createEmptyStats());
        const nextSessionCount = existing.sessionCount + 1;
        const justCompleted =
          !!existing.target &&
          existing.target > 0 &&
          existing.sessionCount < existing.target &&
          nextSessionCount >= existing.target;
        const stats = {
          ...existing,
          sessionCount: nextSessionCount,
          todayCount: existing.todayCount + 1,
          lifetimeCount: existing.lifetimeCount + 1,
          lastPracticedAt: new Date().toISOString(),
          completions: justCompleted
            ? [
                ...existing.completions,
                { at: new Date().toISOString(), target: existing.target as number },
              ]
            : existing.completions,
        };
        return bumpDailyLog(
          { ...p, stats: { ...p.stats, [action.key]: stats } },
          action.category,
          1,
        );
      });
    }
    case 'UNDO': {
      return updateActiveProfile(state, (p) => {
        const existing = p.stats[action.key];
        if (!existing || existing.sessionCount <= 0) return p;
        const nextSessionCount = existing.sessionCount - 1;
        const droppedBelowTarget =
          !!existing.target &&
          existing.target > 0 &&
          existing.sessionCount >= existing.target &&
          nextSessionCount < existing.target;
        const stats = {
          ...existing,
          sessionCount: nextSessionCount,
          todayCount: Math.max(0, existing.todayCount - 1),
          lifetimeCount: Math.max(0, existing.lifetimeCount - 1),
          completions: droppedBelowTarget
            ? existing.completions.slice(0, -1)
            : existing.completions,
        };
        return bumpDailyLog(
          { ...p, stats: { ...p.stats, [action.key]: stats } },
          action.category,
          -1,
        );
      });
    }
    case 'RESET_SESSION': {
      return updateActiveProfile(state, (p) => {
        const existing = p.stats[action.key];
        if (!existing) return p;
        return { ...p, stats: { ...p.stats, [action.key]: { ...existing, sessionCount: 0 } } };
      });
    }
    case 'IMPORT_DATA': {
      return action.data;
    }
    case 'CLEAR_ALL_DATA': {
      return action.freshData;
    }
    default:
      return state;
  }
}

export type { ThemePreference, UiLanguage };
