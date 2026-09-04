import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { thoughtForToday } from '@/data/dailyThoughts';

/**
 * Shows one thought per calendar day, automatically moving to the next
 * day's thought on its own — re-checked on tab focus (the same lightweight
 * pattern as useDailyColorTheme) so a tab left open overnight picks up the
 * new day without needing a reload.
 */
export function DailyThought() {
  const { t } = useTranslation();
  const [thought, setThought] = useState(() => thoughtForToday());

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setThought(thoughtForToday());
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);

  return (
    <section aria-labelledby="daily-thought-heading" className="card-surface rounded-2xl p-6 text-center">
      <p
        id="daily-thought-heading"
        className="text-xs font-medium uppercase tracking-wide text-[color:var(--fg-muted)]"
      >
        {t('home.dailyThoughtHeading')}
      </p>
      <p className="mt-2 font-display text-lg font-medium text-balance">{thought}</p>
    </section>
  );
}
