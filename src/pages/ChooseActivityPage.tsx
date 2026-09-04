import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocumentHead } from '@/hooks/useDocumentHead';

export function ChooseActivityPage() {
  const { t } = useTranslation();

  useDocumentHead({
    title: t('seo.chooseTitle'),
    description: t('seo.chooseDescription'),
    path: '/choose',
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t('choose.heading')}</h1>
        <Link to="/benefits" className="mt-1 inline-block text-sm underline underline-offset-2">
          {t('choose.benefitsLink')}
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <ActivityCard
          title={t('choose.chantTitle')}
          description={t('choose.chantDescription')}
          to="/chant"
          buttonLabel={t('choose.chantButton')}
        />
        <ActivityCard
          title={t('choose.affirmationTitle')}
          description={t('choose.affirmationDescription')}
          to="/affirmation"
          buttonLabel={t('choose.affirmationButton')}
        />
        <ActivityCard
          title={t('choose.childrenTitle')}
          description={t('choose.childrenDescription')}
          to="/affirmation/children"
          buttonLabel={t('choose.childrenButton')}
        />
        <ActivityCard
          title={t('choose.parentsTitle')}
          description={t('choose.parentsDescription')}
          to="/affirmation/parents"
          buttonLabel={t('choose.parentsButton')}
        />
        <ActivityCard
          title={t('choose.professionalTitle')}
          description={t('choose.professionalDescription')}
          to="/affirmation/professional"
          buttonLabel={t('choose.professionalButton')}
        />
        <ActivityCard
          title={t('choose.lovingPartnerTitle')}
          description={t('choose.lovingPartnerDescription')}
          to="/affirmation/loving-partner"
          buttonLabel={t('choose.lovingPartnerButton')}
        />
        <ActivityCard
          title={t('choose.relationshipTitle')}
          description={t('choose.relationshipDescription')}
          to="/affirmation/relationship"
          buttonLabel={t('choose.relationshipButton')}
        />
      </div>
    </div>
  );
}

function ActivityCard({
  title,
  description,
  to,
  buttonLabel,
}: {
  title: string;
  description: string;
  to: string;
  buttonLabel: string;
}) {
  return (
    <div className="card-surface flex flex-col items-start gap-3 rounded-2xl p-6">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="text-[color:var(--fg-muted)]">{description}</p>
      <Link
        to={to}
        className="mt-auto min-h-11 rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-contrast)]"
      >
        {buttonLabel}
      </Link>
    </div>
  );
}
