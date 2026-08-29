/**
 * The Vibration API is unsupported by design on iOS — Safari, Chrome-for-iOS
 * and every other iOS browser are required to use Apple's WebKit, which has
 * never implemented it. There is no web-code workaround; the honest fix is
 * to detect this and not offer a control that can never do anything.
 */
export function supportsVibration(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

export function vibrate(pattern: number | number[]): void {
  if (!supportsVibration()) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* vibration not permitted in this context (e.g. tab not focused) */
  }
}
