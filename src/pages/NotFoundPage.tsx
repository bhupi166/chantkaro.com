import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold">{t('notFound.heading')}</h1>
      <p className="text-[color:var(--fg-muted)]">{t('notFound.body')}</p>
      <Link
        to="/"
        className="min-h-11 rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-contrast)]"
      >
        {t('notFound.returnHome')}
      </Link>
    </div>
  );
}
