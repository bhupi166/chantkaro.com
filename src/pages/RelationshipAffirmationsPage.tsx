import { PracticeSelector } from '@/components/PracticeSelector';
import { RELATIONSHIP_AFFIRMATIONS } from '@/data/relationshipAffirmations';

export function RelationshipAffirmationsPage() {
  return (
    <PracticeSelector
      category="affirmation"
      headingKey="relationship.heading"
      supportingTextKey="relationship.supportingText"
      customLabelKey="affirmationCommon.customLabel"
      customPlaceholderKey="relationship.customPlaceholder"
      privacyTextKey="affirmationCommon.privacyText"
      options={RELATIONSHIP_AFFIRMATIONS}
      contentNoteKey="relationship.contentNote"
      seoTitleKey="seo.relationshipTitle"
      seoDescriptionKey="seo.relationshipDescription"
      seoPath="/affirmation/relationship"
    />
  );
}
