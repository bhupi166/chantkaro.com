import { Trans, useTranslation } from 'react-i18next';
import { useDocumentHead } from '@/hooks/useDocumentHead';

export function TermsPage() {
  const { t } = useTranslation();

  useDocumentHead({
    title: t('seo.termsTitle'),
    description: t('seo.termsDescription'),
    path: '/terms',
  });

  return (
    <article className="flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold">{t('terms.title')}</h1>
      <p className="text-sm text-[color:var(--fg-muted)]">{t('terms.lastUpdated')}</p>

      <p>{t('terms.intro')}</p>

      <h2 className="font-display text-lg font-semibold">{t('terms.whatItIsHeading')}</h2>
      <p>{t('terms.whatItIsBody')}</p>

      <h2 className="font-display text-lg font-semibold">{t('terms.whatItIsNotHeading')}</h2>
      <ul className="list-disc pl-5">
        <li>{t('terms.whatItIsNotBullet1')}</li>
        <li>{t('terms.whatItIsNotBullet2')}</li>
        <li>{t('terms.whatItIsNotBullet3')}</li>
      </ul>

      <h2 className="font-display text-lg font-semibold">{t('terms.followTraditionHeading')}</h2>
      <p>{t('terms.followTraditionBody')}</p>

      <h2 className="font-display text-lg font-semibold">{t('terms.customContentHeading')}</h2>
      <p>{t('terms.customContentBody')}</p>

      <h2 className="font-display text-lg font-semibold">{t('terms.availabilityHeading')}</h2>
      <p>{t('terms.availabilityBody')}</p>

      <h2 className="font-display text-lg font-semibold">{t('terms.changesHeading')}</h2>
      <p>{t('terms.changesBody')}</p>

      <h2 className="font-display text-lg font-semibold">{t('terms.contactHeading')}</h2>
      <p>
        <Trans i18nKey="terms.contactBody">
          {'Questions can be sent to '}
          <a
            className="underline"
            href="mailto:contact@chantkaro.com?subject=Chant%20Karo%20-%20Terms%20Question"
          >
            contact@chantkaro.com
          </a>
          {'.'}
        </Trans>
      </p>
    </article>
  );
}
