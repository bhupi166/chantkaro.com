/**
 * Formats a count using Indian digit grouping (e.g. 1,25,450) when the
 * runtime locale looks like an Indian locale, otherwise falls back to the
 * browser's default grouping for the detected locale.
 */
export function formatCount(
  value: number,
  locales: string | string[] = navigator?.language,
): string {
  const localeList = Array.isArray(locales) ? locales : [locales].filter(Boolean);
  const isIndianLocale = localeList.some((l) => /^[a-z]{2,3}-in$/i.test(l) || /^hi\b/i.test(l));
  const locale = isIndianLocale ? 'en-IN' : localeList[0] || 'en-US';
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return new Intl.NumberFormat('en-US').format(value);
  }
}

export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
