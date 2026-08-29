import { PracticeSelector } from '@/components/PracticeSelector';
import { LOVING_PARTNER_AFFIRMATIONS } from '@/data/lovingPartnerAffirmations';

export function LovingPartnerAffirmationsPage() {
  return (
    <PracticeSelector
      category="affirmation"
      headingKey="lovingPartner.heading"
      supportingTextKey="lovingPartner.supportingText"
      customLabelKey="affirmationCommon.customLabel"
      customPlaceholderKey="lovingPartner.customPlaceholder"
      privacyTextKey="affirmationCommon.privacyText"
      options={LOVING_PARTNER_AFFIRMATIONS}
      contentNoteKey="lovingPartner.contentNote"
    />
  );
}
