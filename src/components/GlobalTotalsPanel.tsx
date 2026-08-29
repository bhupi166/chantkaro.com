import { useGlobalTotals } from '@/hooks/useGlobalTotals';
import { formatCount } from '@/lib/format';

export function GlobalTotalsPanel() {
  const { totals, status } = useGlobalTotals();

  return (
    <section aria-labelledby="global-totals-heading" className="card-surface rounded-2xl p-6">
      <p id="global-totals-heading" className="font-display text-lg font-semibold">
        Together, we are creating positive energy—one repetition at a time.
      </p>
      {status === 'unavailable' && (
        <p className="mt-3 text-sm text-[color:var(--fg-muted)]" role="status">
          Global totals are temporarily unavailable. Your personal practice keeps working normally.
        </p>
      )}
      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TotalStat
          label="Chants & Prayers"
          value={totals?.chantsAndPrayers}
          loading={status === 'loading'}
        />
        <TotalStat
          label="Positive Affirmations"
          value={totals?.positiveAffirmations}
          loading={status === 'loading'}
        />
        <TotalStat
          label="Total Positive Repetitions"
          value={totals?.totalPositiveRepetitions}
          loading={status === 'loading'}
          emphasize
        />
      </dl>
    </section>
  );
}

function TotalStat({
  label,
  value,
  loading,
  emphasize,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 text-center ${emphasize ? 'bg-[color:var(--bg)]' : ''}`}>
      <dt className="text-sm text-[color:var(--fg-muted)]">{label}</dt>
      <dd className={`mt-1 font-display font-semibold ${emphasize ? 'text-2xl' : 'text-xl'}`}>
        {loading ? (
          <span
            aria-hidden
            className="inline-block h-7 w-20 animate-pulse rounded bg-[color:var(--border)]"
          />
        ) : value == null ? (
          '—'
        ) : (
          formatCount(value)
        )}
      </dd>
    </div>
  );
}
