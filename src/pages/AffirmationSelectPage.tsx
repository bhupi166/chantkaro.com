import { PracticeSelector } from '@/components/PracticeSelector';
import { AFFIRMATIONS } from '@/data/affirmations';

export function AffirmationSelectPage() {
  return (
    <PracticeSelector
      category="affirmation"
      heading="Which positive affirmation would you like to repeat?"
      supportingText="Choose a suggested affirmation or write your own positive statement."
      customLabel="Write your own affirmation"
      customPlaceholder="Example: I am peaceful, confident and grateful."
      privacyText="Your custom affirmation and personal progress are stored privately in this browser and are not sent to our server."
      options={AFFIRMATIONS}
    />
  );
}
