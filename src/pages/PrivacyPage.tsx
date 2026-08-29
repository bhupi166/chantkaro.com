import { Trans, useTranslation } from 'react-i18next';

export function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <article className="prose-content flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold">{t('privacy.title')}</h1>
      <p className="text-sm text-[color:var(--fg-muted)]">{t('privacy.lastUpdated')}</p>

      <p>{t('privacy.intro')}</p>

      <h2 className="font-display text-lg font-semibold">{t('privacy.noAccountHeading')}</h2>
      <p>{t('privacy.noAccountBody')}</p>

      <h2 className="font-display text-lg font-semibold">{t('privacy.onDeviceHeading')}</h2>
      <p>{t('privacy.onDeviceBody')}</p>

      <h2 className="font-display text-lg font-semibold">{t('privacy.voiceModeHeading')}</h2>
      <p>{t('privacy.voiceModeBody')}</p>

      <h2 className="font-display text-lg font-semibold">{t('privacy.globalTotalsHeading')}</h2>
      <p>{t('privacy.globalTotalsBody')}</p>

      <h2 className="font-display text-lg font-semibold">{t('privacy.yourControlHeading')}</h2>
      <ul className="list-disc pl-5">
        <li>{t('privacy.yourControlBullet1')}</li>
        <li>{t('privacy.yourControlBullet2')}</li>
        <li>{t('privacy.yourControlBullet3')}</li>
      </ul>

      <h2 className="font-display text-lg font-semibold">{t('privacy.serverLogsHeading')}</h2>
      <p>{t('privacy.serverLogsBody')}</p>

      <h2 className="font-display text-lg font-semibold">{t('privacy.independenceHeading')}</h2>
      <p>{t('privacy.independenceBody')}</p>

      <h2 className="font-display text-lg font-semibold">{t('privacy.contactHeading')}</h2>
      <p>
        <Trans i18nKey="privacy.contactBody">
          {'Questions about this policy can be sent to '}
          <a className="underline" href="mailto:privacy@chantkaro.com">
            privacy@chantkaro.com
          </a>
          {' [PLACEHOLDER — replace before production].'}
        </Trans>
      </p>
    </article>
  );
}
