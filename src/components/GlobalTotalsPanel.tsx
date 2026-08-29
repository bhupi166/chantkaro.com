import { useTranslation } from 'react-i18next';
import { useGlobalTotals } from '@/hooks/useGlobalTotals';
import { formatCount } from '@/lib/format';

export function GlobalTotalsPanel() {
  const { t } = useTranslation();
  const { totals, status } = useGlobalTotals();

  return (
    <section aria-labelledby="global-totals-heading" className="card-surface rounded-2xl p-6">
      <p id="global-totals-heading" className="font-display text-lg font-semibold">
        {t('totals.heading')}
      </p>
      {status === 'unavailable' && (
        <p className="mt-3 text-sm text-[color:var(--fg-muted)]" role="status">
          {t('totals.unavailable')}
        </p>
      )}
      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TotalStat
          label={t('totals.chantsAndPrayers')}
          value={totals?.chantsAndPrayers}
          loading={status === 'loading'}
        />
        <TotalStat
          label={t('totals.positiveAffirmations')}
          value={totals?.positiveAffirmations}
          loading={status === 'loading'}
        />
        <TotalStat
          label={t('totals.totalPositiveRepetitions')}
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
  const { i18n } = useTranslation();
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
          formatCount(value, [i18n.language, navigator.language])
        )}
      </dd>
    </div>
  );
}
