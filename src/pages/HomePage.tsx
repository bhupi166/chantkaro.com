import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Logo } from '@/components/Logo';
import { GlobalTotalsPanel } from '@/components/GlobalTotalsPanel';
import { useAppData } from '@/state/AppDataContext';

export function HomePage() {
  const { t } = useTranslation();
  const { activeProfile } = useAppData();
  const hasProgress = activeProfile.lastActivePractice != null;

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col items-center gap-5 py-6 text-center">
        <Logo className="scale-150" titleId="home-logo-title" />
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{t('common.brandName')}</h1>
          <p className="mt-2 text-lg font-medium text-[color:var(--accent)]">
            {t('common.brandTagline')}
          </p>
          <p className="mt-1 text-sm text-[color:var(--fg-muted)]">{t('home.taglineSupport')}</p>
        </div>
        <p className="max-w-xl text-balance text-[color:var(--fg)]">{t('home.intro')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/choose"
            className="min-h-12 rounded-full bg-[color:var(--accent)] px-6 py-3 text-base font-semibold text-[color:var(--accent-contrast)] shadow-sm"
          >
            {t('home.startPractice')}
          </Link>
          {hasProgress && (
            <Link
              to="/practice"
              className="min-h-12 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-6 py-3 text-base font-semibold"
            >
              {t('home.continueLastPractice')}
            </Link>
          )}
        </div>
      </section>

      <GlobalTotalsPanel />

      <section className="grid gap-4 sm:grid-cols-2">
        <ModeExplainer title={t('home.tapModeTitle')} description={t('home.tapModeDescription')} />
        <ModeExplainer
          title={t('home.voiceModeTitle')}
          description={t('home.voiceModeDescription')}
        />
      </section>

      <section className="card-surface rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold">{t('home.privacyHeading')}</h2>
        <ul className="mt-3 space-y-2 text-sm text-[color:var(--fg-muted)]">
          <li>{t('home.privacyBullet1')}</li>
          <li>{t('home.privacyBullet2')}</li>
          <li>{t('home.privacyBullet3')}</li>
          <li>
            <Trans i18nKey="home.readFullPrivacyPolicy">
              {'Read the full '}
              <Link to="/privacy" className="underline">
                Privacy Policy
              </Link>
              {'.'}
            </Trans>
          </li>
        </ul>
      </section>
    </div>
  );
}

function ModeExplainer({ title, description }: { title: string; description: string }) {
  return (
    <div className="card-surface rounded-2xl p-5">
      <h3 className="font-display font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[color:var(--fg-muted)]">{description}</p>
    </div>
  );
}
