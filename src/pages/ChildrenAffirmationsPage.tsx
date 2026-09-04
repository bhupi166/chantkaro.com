import { PracticeSelector } from '@/components/PracticeSelector';
import { CHILDREN_AFFIRMATIONS } from '@/data/childrenAffirmations';

export function ChildrenAffirmationsPage() {
  return (
    <PracticeSelector
      category="affirmation"
      headingKey="children.heading"
      supportingTextKey="children.supportingText"
      customLabelKey="affirmationCommon.customLabel"
      customPlaceholderKey="children.customPlaceholder"
      privacyTextKey="affirmationCommon.privacyText"
      options={CHILDREN_AFFIRMATIONS}
      seoTitleKey="seo.childrenAffirmationsTitle"
      seoDescriptionKey="seo.childrenAffirmationsDescription"
      seoPath="/affirmation/children"
    />
  );
}
