export type PracticeCategory = 'chant' | 'affirmation';

export type PracticeTradition =
  'sanatan' | 'sikh' | 'buddhist' | 'jain' | 'islamic' | 'christian' | 'universal';

export interface PracticeOption {
  /** Stable id, never reused, safe to store as a foreign key in local data. */
  id: string;
  category: PracticeCategory;
  tradition: PracticeTradition;
  /** English / Romanized title shown as the primary line. */
  title: string;
  /** Native-script rendering, may be empty for English-only phrases. */
  script?: string;
  /** BCP-47 language tag of the `script` field, used for correct font/RTL rendering. */
  scriptLang?: string;
  /** Short English translation or meaning, optional. */
  meaning?: string;
  /** Set true to hide from suggestion lists without deleting (soft-hide for review). */
  hidden?: boolean;
  /** Marks content pending final expert/community review. */
  needsReview?: boolean;
}

export type RepetitionTarget = 11 | 21 | 51 | 108 | 1008 | number | null;

export type PracticeMode = 'tap' | 'voice';

export type ThemePreference = 'light' | 'dark' | 'system';

export type UiLanguage = 'en' | 'hi';

export interface CustomPractice {
  id: string;
  category: PracticeCategory;
  text: string;
  createdAt: string;
}

export interface PracticeSelection {
  category: PracticeCategory;
  /** Present when a suggested PracticeOption was chosen. */
  optionId?: string;
  /** Present when the user entered their own text. */
  customId?: string;
  /** Denormalized display text so history/stats never need a lookup that could fail. */
  displayText: string;
  displayScript?: string;
}

export interface PracticeStats {
  /** Keyed by practice key (see practiceKey()). */
  sessionCount: number;
  todayCount: number;
  todayDate: string; // yyyy-mm-dd, local
  lifetimeCount: number;
  lastPracticedAt?: string;
  target: RepetitionTarget;
  completions: { at: string; target: number }[];
}

export interface DailyLogEntry {
  date: string; // yyyy-mm-dd
  chantCount: number;
  affirmationCount: number;
}

export interface ProfileData {
  id: string;
  name: string;
  createdAt: string;
  theme: ThemePreference;
  uiLanguage: UiLanguage;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  contributeToGlobalTotals: boolean;
  hasSeenContributionNotice: boolean;
  lastActivePractice?: PracticeSelection;
  lastMode?: PracticeMode;
  customChants: CustomPractice[];
  customAffirmations: CustomPractice[];
  recentPracticeKeys: string[];
  /** Per-practice stats keyed by a stable practice key. */
  stats: Record<string, PracticeStats>;
  dailyLog: DailyLogEntry[];
}

export interface AppData {
  schemaVersion: number;
  activeProfileId: string;
  profiles: ProfileData[];
}

export interface QueuedIncrement {
  idempotencyKey: string;
  category: PracticeCategory;
  amount: number;
  queuedAt: string;
}

export interface GlobalTotals {
  chantsAndPrayers: number;
  positiveAffirmations: number;
  totalPositiveRepetitions: number;
  updatedAt: string;
}
