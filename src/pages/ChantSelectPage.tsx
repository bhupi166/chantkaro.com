import { PracticeSelector } from '@/components/PracticeSelector';
import { CHANTS, FEATURED_CHANT_IDS } from '@/data/chants';

export function ChantSelectPage() {
  return (
    <PracticeSelector
      category="chant"
      headingKey="chant.heading"
      supportingTextKey="chant.supportingText"
      customLabelKey="chant.customLabel"
      customPlaceholderKey="chant.customPlaceholder"
      privacyTextKey="chant.privacyText"
      options={CHANTS}
      featuredIds={FEATURED_CHANT_IDS}
      showTraditionFilter
      contentNoteKey="chant.contentNote"
      seoTitleKey="seo.chantTitle"
      seoDescriptionKey="seo.chantDescription"
      seoPath="/chant"
    />
  );
}
