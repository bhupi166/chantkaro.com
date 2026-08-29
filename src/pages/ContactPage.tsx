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
            <a
              className="underline"
              href="mailto:bhupi166@gmail.com?subject=Chant%20Karo%20-%20General%20Inquiry"
            >
              bhupi166@gmail.com
            </a>
          </dd>
        </div>
      </dl>
      <p className="text-sm text-[color:var(--fg-muted)]">{t('contact.subjectNote')}</p>
    </article>
  );
}
