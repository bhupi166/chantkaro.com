import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PracticeSelector } from '@/components/PracticeSelector';
import { PROFESSIONAL_AFFIRMATIONS, PROFESSION_CATEGORIES } from '@/data/professionalAffirmations';
import { useDocumentHead } from '@/hooks/useDocumentHead';

export function ProfessionalAffirmationsPage() {
  const { t } = useTranslation();
  const [professionKey, setProfessionKey] = useState<string | null>(null);

  useDocumentHead({
    title: t('seo.professionalAffirmationsTitle'),
    description: t('seo.professionalAffirmationsDescription'),
    path: '/affirmation/professional',
  });

  if (!professionKey) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t('professional.chooseHeading')}</h1>
          <p className="mt-1 text-[color:var(--fg-muted)]">
            {t('professional.chooseSupportingText')}
          </p>
        </div>
        <div
          className="grid gap-3 sm:grid-cols-2"
          role="group"
          aria-label={t('professional.categoriesLabel')}
        >
          {PROFESSION_CATEGORIES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setProfessionKey(p.key)}
              className="min-h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-4 py-3 text-left font-medium"
            >
              {t(`professional.categories.${p.key}`, p.label)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const category = PROFESSION_CATEGORIES.find((p) => p.key === professionKey)!;
  const options = PROFESSIONAL_AFFIRMATIONS[professionKey] ?? [];
  const categoryLabel = t(`professional.categories.${category.key}`, category.label);

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setProfessionKey(null)}
        className="self-start text-sm underline underline-offset-2"
      >
        {t('professional.changeCategory')}
      </button>
      {/* key forces a clean remount so search/selection state never leaks
          between one profession's list and the next. */}
      <PracticeSelector
        key={professionKey}
        category="affirmation"
        headingKey="professional.headingForCategory"
        headingValues={{ profession: categoryLabel }}
        supportingTextKey={
          options.length > 0
            ? 'professional.supportingTextWithSuggestions'
            : 'professional.supportingTextEmpty'
        }
        customLabelKey="affirmationCommon.customLabel"
        customPlaceholderKey="professional.customPlaceholder"
        privacyTextKey="affirmationCommon.privacyText"
        options={options}
      />
    </div>
  );
}
