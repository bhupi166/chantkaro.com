import { PracticeSelector } from '@/components/PracticeSelector';
import { PARENTS_AFFIRMATIONS } from '@/data/parentsAffirmations';

export function ParentsAffirmationsPage() {
  return (
    <PracticeSelector
      category="affirmation"
      headingKey="parents.heading"
      supportingTextKey="parents.supportingText"
      customLabelKey="affirmationCommon.customLabel"
      customPlaceholderKey="parents.customPlaceholder"
      privacyTextKey="affirmationCommon.privacyText"
      options={PARENTS_AFFIRMATIONS}
      seoTitleKey="seo.parentsAffirmationsTitle"
      seoDescriptionKey="seo.parentsAffirmationsDescription"
      seoPath="/affirmation/parents"
    />
  );
}
