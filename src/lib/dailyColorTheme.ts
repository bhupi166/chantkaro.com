/**
 * One accent colour per day of the week (0 = Sunday … 6 = Saturday, matching
 * `Date.getDay()`), purely for visual variety when a user opts in via
 * Settings. Deliberately not tied to any tradition's day-colour associations
 * — Chant Karo doesn't rank or favour traditions (see README), so this is a
 * secular rotation chosen only to feel warm and legible against the app's
 * existing ivory/dark palette. Light values pair with white/light text
 * (accent-contrast); dark values pair with the app's dark-mode ink text,
 * mirroring the app's existing saffron-700/saffron-400 light/dark pattern.
 */
export interface DailyAccent {
  light: string;
  lightContrast: string;
  dark: string;
  darkContrast: string;
}

const DARK_INK_CONTRAST = '#241c2e';

export const DAILY_ACCENT_COLORS: Record<number, DailyAccent> = {
  0: { light: '#b84e29', lightContrast: '#ffffff', dark: '#f0955c', darkContrast: DARK_INK_CONTRAST }, // Sunday — saffron (the app's own default)
  1: { light: '#8f6a0a', lightContrast: '#ffffff', dark: '#e6b85c', darkContrast: DARK_INK_CONTRAST }, // Monday — gold
  2: { light: '#a83d63', lightContrast: '#ffffff', dark: '#f3b6c8', darkContrast: DARK_INK_CONTRAST }, // Tuesday — rose
  3: { light: '#472c62', lightContrast: '#ffffff', dark: '#b9a0dd', darkContrast: DARK_INK_CONTRAST }, // Wednesday — purple
  4: { light: '#2f6b5e', lightContrast: '#ffffff', dark: '#7ed6c4', darkContrast: DARK_INK_CONTRAST }, // Thursday — teal
  5: { light: '#3a4a8f', lightContrast: '#ffffff', dark: '#aab6ec', darkContrast: DARK_INK_CONTRAST }, // Friday — indigo
  6: { light: '#7c2e3f', lightContrast: '#ffffff', dark: '#e6a0ac', darkContrast: DARK_INK_CONTRAST }, // Saturday — maroon
};

/** `day` is Date.getDay() (0-6); falls back to Sunday's colour for any out-of-range input. */
export function accentForDay(day: number): DailyAccent {
  return DAILY_ACCENT_COLORS[day] ?? DAILY_ACCENT_COLORS[0];
}
