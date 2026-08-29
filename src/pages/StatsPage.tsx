import { useMemo } from 'react';
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
  const { activeProfile } = useAppData();

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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">My Progress</h1>
        <p className="mt-1 text-[color:var(--fg-muted)]">
          Your practice is personal. Continue whenever it feels right.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Today" value={today} />
        <StatCard label="Last 7 Days" value={sevenDay} />
        <StatCard label="Lifetime Chants & Prayers" value={lifetime.chant} />
        <StatCard label="Lifetime Affirmations" value={lifetime.affirmation} />
      </div>

      <section className="card-surface rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold">Daily consistency</h2>
        <p className="text-sm text-[color:var(--fg-muted)]">Last 30 days</p>
        <div className="mt-4 grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
          {calendar.map((day) => {
            const intensity = day.count === 0 ? 0 : Math.max(0.25, day.count / maxDay);
            return (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} repetitions`}
                aria-label={`${day.date}: ${day.count} repetitions`}
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
        <h2 className="font-display text-lg font-semibold">Per-practice totals</h2>
        {perPractice.length === 0 ? (
          <p className="mt-2 text-sm text-[color:var(--fg-muted)]">
            Nothing recorded yet — start a practice to see it here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[color:var(--border)]">
            {perPractice.map((row) => (
              <li key={row.key} className="flex items-center justify-between py-2">
                <span className="truncate pr-4">{row.label}</span>
                <span className="tabular-nums font-medium">
                  {formatCount(row.stats.lifetimeCount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-surface rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold">Target completions</h2>
        {completions.length === 0 ? (
          <p className="mt-2 text-sm text-[color:var(--fg-muted)]">No targets completed yet.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {completions.slice(0, 20).map((c, i) => (
              <li key={i} className="flex justify-between">
                <span>{labelForKey(c.key, activeProfile)}</span>
                <span className="text-[color:var(--fg-muted)]">
                  {c.target} · {new Date(c.at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-surface rounded-2xl p-4 text-center">
      <div className="text-xs text-[color:var(--fg-muted)]">{label}</div>
      <div className="font-display text-2xl font-semibold tabular-nums">{formatCount(value)}</div>
    </div>
  );
}
