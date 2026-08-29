import { useTranslation } from 'react-i18next';

export function AboutPage() {
  const { t } = useTranslation();
  return (
    <article className="flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold">{t('about.title')}</h1>
      <p>{t('about.paragraph1')}</p>
      <p>{t('about.paragraph2')}</p>
      <p>{t('about.paragraph3')}</p>
      <h2 className="font-display text-lg font-semibold">{t('about.whyHeading')}</h2>
      <p>{t('about.whyBody')}</p>
    </article>
  );
}
