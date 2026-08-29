import { PracticeSelector } from '@/components/PracticeSelector';
import { PARENTS_AFFIRMATIONS } from '@/data/parentsAffirmations';

export function ParentsAffirmationsPage() {
  return (
    <PracticeSelector
      category="affirmation"
      heading="Which affirmation would you like to repeat?"
      supportingText="Affirmations for patient, pressure-free parenting — choose one or write your own."
      customLabel="Write your own affirmation"
      customPlaceholder="Example: I guide my child with patience and love."
      privacyText="Your custom affirmation and personal progress are stored privately in this browser and are not sent to our server."
      options={PARENTS_AFFIRMATIONS}
    />
  );
}
