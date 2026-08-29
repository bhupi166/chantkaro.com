import { PracticeSelector } from '@/components/PracticeSelector';
import { CHANTS, FEATURED_CHANT_IDS } from '@/data/chants';

export function ChantSelectPage() {
  return (
    <PracticeSelector
      category="chant"
      heading="What would you like to chant?"
      supportingText="Choose from the suggested sacred chants and prayers, or enter your own."
      customLabel="Enter your own chant or prayer"
      customPlaceholder="Enter a sacred name, mantra, prayer, simran or dhikr"
      privacyText="Your custom chant and personal progress are stored privately in this browser and are not sent to our server."
      options={CHANTS}
      featuredIds={FEATURED_CHANT_IDS}
      showTraditionFilter
      contentNote="Suggested phrases are provided for convenient counting. Please follow the wording and guidance of your own spiritual tradition."
    />
  );
}
