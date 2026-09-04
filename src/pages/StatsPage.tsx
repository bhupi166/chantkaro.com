import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppData } from '@/state/AppDataContext';
import { CHANTS } from '@/data/chants';
import { AFFIRMATIONS } from '@/data/affirmations';
import {
  completionHistory,
  last30DaysCalendar,
  lifetimeTotals,
  sevenDayTotal,
  todaysRepetitions,
} from '@/lib/statsSelectors';
import { formatCount } from '@/lib/format';
import { useDocumentHead } from '@/hooks/useDocumentHead';

function labelForKey(key: string, profile: ReturnType<typeof useAppData>['activeProfile']): string {
  if (key.startsWith('option:')) {
    const id = key.slice('option:'.length);
    return (
      CHANTS.find((c) => c.id === id)?.title ?? AFFIRMATIONS.find((a) => a.id === id)?.title ?? id
    );
  }
  if (key.startsWith('custom:')) {
    const id = key.slice('custom:'.length);
    return (
      profile.customChants.find((c) => c.id === id)?.text ??
      profile.customAffirmations.find((c) => c.id === id)?.text ??
      id
    );
  }
  if (key.startsWith('text:chant:') || key.startsWith('text:affirmation:')) {
    return key.replace(/^text:(chant|affirmation):/, '');
  }
  return key;
}

export function StatsPage() {
  const { t, i18n } = useTranslation();
  const { activeProfile } = useAppData();

  useDocumentHead({
    title: `${t('stats.heading')} — Chant Karo`,
    description: t('seo.homeDescription'),
    path: '/stats',
    noindex: true,
  });

  const today = useMemo(() => todaysRepetitions(activeProfile), [activeProfile]);
  const sevenDay = useMemo(() => sevenDayTotal(activeProfile), [activeProfile]);
  const lifetime = useMemo(() => lifetimeTotals(activeProfile), [activeProfile]);
  const calendar = useMemo(() => last30DaysCalendar(activeProfile), [activeProfile]);
  const completions = useMemo(() => completionHistory(activeProfile), [activeProfile]);
  const perPractice = useMemo(
    () =>
      Object.entries(activeProfile.stats)
        .map(([key, stats]) => ({ key, label: labelForKey(key, activeProfile), stats }))
        .sort((a, b) => b.stats.lifetimeCount - a.stats.lifetimeCount),
    [activeProfile],
  );
  const maxDay = Math.max(1, ...calendar.map((d) => d.count));
  const count = (value: number) => formatCount(value, [i18n.language, navigator.language]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t('stats.heading')}</h1>
        <p className="mt-1 text-[color:var(--fg-muted)]">{t('stats.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label={t('stats.today')} formatted={count(today)} />
        <StatCard label={t('stats.last7Days')} formatted={count(sevenDay)} />
        <StatCard label={t('stats.lifetimeChants')} formatted={count(lifetime.chant)} />
        <StatCard label={t('stats.lifetimeAffirmations')} formatted={count(lifetime.affirmation)} />
        <StatCard label={t('stats.yourTotal')} formatted={count(lifetime.chant + lifetime.affirmation)} />
      </div>

      <section className="card-surface rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold">{t('stats.dailyConsistency')}</h2>
        <p className="text-sm text-[color:var(--fg-muted)]">{t('stats.last30Days')}</p>
        <div className="mt-4 grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
          {calendar.map((day) => {
            const intensity = day.count === 0 ? 0 : Math.max(0.25, day.count / maxDay);
            const dayLabel = t('stats.dayRepetitions', { date: day.date, count: day.count });
            return (
              <div
                key={day.date}
                title={dayLabel}
                aria-label={dayLabel}
                className="aspect-square rounded"
                style={{
                  background:
                    day.count === 0
                      ? 'var(--border)'
                      : `color-mix(in srgb, var(--accent) ${Math.round(intensity * 100)}%, var(--bg-elevated))`,
                }}
              />
            );
          })}
        </div>
      </section>

      <section className="card-surface rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold">{t('stats.perPracticeTotals')}</h2>
        {perPractice.length === 0 ? (
          <p className="mt-2 text-sm text-[color:var(--fg-muted)]">{t('stats.noPracticeYet')}</p>
        ) : (
          <ul className="mt-3 divide-y divide-[color:var(--border)]">
            {perPractice.map((row) => (
              <li key={row.key} className="flex items-center justify-between py-2">
                <span className="truncate pr-4">{row.label}</span>
                <span className="tabular-nums font-medium">{count(row.stats.lifetimeCount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-surface rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold">{t('stats.targetCompletions')}</h2>
        {completions.length === 0 ? (
          <p className="mt-2 text-sm text-[color:var(--fg-muted)]">{t('stats.noCompletionsYet')}</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {completions.slice(0, 20).map((c, i) => (
              <li key={i} className="flex justify-between">
                <span>{labelForKey(c.key, activeProfile)}</span>
                <span className="text-[color:var(--fg-muted)]">
                  {c.target} · {new Date(c.at).toLocaleDateString(i18n.language)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, formatted }: { label: string; formatted: string }) {
  return (
    <div className="card-surface rounded-2xl p-4 text-center">
      <div className="text-xs text-[color:var(--fg-muted)]">{label}</div>
      <div className="font-display text-2xl font-semibold tabular-nums">{formatted}</div>
    </div>
  );
}
