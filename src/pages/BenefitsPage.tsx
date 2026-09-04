import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useDocumentHead } from '@/hooks/useDocumentHead';

const CHANT_KEYS = ['chant1', 'chant2', 'chant3', 'chant4', 'chant5'] as const;
const AFFIRMATION_KEYS = [
  'affirmation1',
  'affirmation2',
  'affirmation3',
  'affirmation4',
  'affirmation5',
] as const;

export function BenefitsPage() {
  const { t } = useTranslation();

  useDocumentHead({
    title: t('seo.benefitsTitle'),
    description: t('seo.benefitsDescription'),
    path: '/benefits',
  });

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t('benefits.title')}</h1>
        <p className="mt-2 max-w-2xl text-[color:var(--fg-muted)]">
          <Trans i18nKey="benefits.intro">
            {
              'These reflect common, personally reported experiences of steady practice — not medical or guaranteed outcomes. Chant Karo does not provide medical or mental-health advice; see our '
            }
            <Link to="/terms" className="underline">
              Terms of Use
            </Link>
            {'.'}
          </Trans>
        </p>
      </div>

      <BenefitSection title={t('benefits.chantBenefitsTitle')} keys={CHANT_KEYS} />
      <BenefitSection title={t('benefits.affirmationBenefitsTitle')} keys={AFFIRMATION_KEYS} />
    </div>
  );
}

function BenefitSection({ title, keys }: { title: string; keys: readonly string[] }) {
  const { t } = useTranslation();
  const headingId = `${title.toLowerCase().replace(/\s+/g, '-')}-heading`;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-xl font-semibold">
        {title}
      </h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {keys.map((key) => (
          <li key={key} className="card-surface rounded-2xl p-5">
            <h3 className="font-display font-semibold">{t(`benefits.${key}Title`)}</h3>
            <p className="mt-1.5 text-sm text-[color:var(--fg-muted)]">
              {t(`benefits.${key}Body`)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
