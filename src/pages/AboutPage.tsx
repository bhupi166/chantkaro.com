import { useTranslation } from 'react-i18next';
import { useDocumentHead } from '@/hooks/useDocumentHead';

export function AboutPage() {
  const { t } = useTranslation();

  useDocumentHead({
    title: t('seo.aboutTitle'),
    description: t('seo.aboutDescription'),
    path: '/about',
  });

  return (
    <article className="flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold">{t('about.title')}</h1>
      <p>{t('about.paragraph1')}</p>
      <p>{t('about.paragraph2')}</p>
      <p>{t('about.paragraph3')}</p>
      <p>{t('about.paragraph4')}</p>
      <h2 className="font-display text-lg font-semibold">{t('about.respectHeading')}</h2>
      <p>{t('about.respectBody1')}</p>
      <p>{t('about.respectBody2')}</p>
      <p>{t('about.respectBody3')}</p>
      <h2 className="font-display text-lg font-semibold">{t('about.whyHeading')}</h2>
      <p>{t('about.whyBody')}</p>
      <p>{t('about.whyBody2')}</p>
    </article>
  );
}
