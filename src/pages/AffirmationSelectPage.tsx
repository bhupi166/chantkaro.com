import { PracticeSelector } from '@/components/PracticeSelector';
import { AFFIRMATIONS } from '@/data/affirmations';

export function AffirmationSelectPage() {
  return (
    <PracticeSelector
      category="affirmation"
      headingKey="affirmation.heading"
      supportingTextKey="affirmation.supportingText"
      customLabelKey="affirmationCommon.customLabel"
      customPlaceholderKey="affirmation.customPlaceholder"
      privacyTextKey="affirmationCommon.privacyText"
      options={AFFIRMATIONS}
      seoTitleKey="seo.affirmationTitle"
      seoDescriptionKey="seo.affirmationDescription"
      seoPath="/affirmation"
    />
  );
}
