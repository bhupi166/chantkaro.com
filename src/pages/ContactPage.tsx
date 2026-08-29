import { useTranslation } from 'react-i18next';

export function ContactPage() {
  const { t } = useTranslation();
  return (
    <article className="flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold">{t('contact.title')}</h1>
      <p>{t('contact.intro')}</p>
      <dl className="mt-2 space-y-2">
        <div>
          <dt className="text-sm font-medium text-[color:var(--fg-muted)]">
            {t('contact.generalLabel')}
          </dt>
          <dd>
            <a className="underline" href="mailto:hello@chantkaro.com">
              hello@chantkaro.com
            </a>{' '}
            <span className="text-xs text-[color:var(--fg-muted)]">{t('contact.placeholder')}</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-[color:var(--fg-muted)]">
            {t('contact.privacyLabel')}
          </dt>
          <dd>
            <a className="underline" href="mailto:privacy@chantkaro.com">
              privacy@chantkaro.com
            </a>{' '}
            <span className="text-xs text-[color:var(--fg-muted)]">{t('contact.placeholder')}</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-[color:var(--fg-muted)]">
            {t('contact.contentLabel')}
          </dt>
          <dd>
            <a className="underline" href="mailto:content@chantkaro.com">
              content@chantkaro.com
            </a>{' '}
            <span className="text-xs text-[color:var(--fg-muted)]">{t('contact.placeholder')}</span>
          </dd>
        </div>
      </dl>
    </article>
  );
}
