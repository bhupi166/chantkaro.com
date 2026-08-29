import { PracticeSelector } from '@/components/PracticeSelector';
import { CHILDREN_AFFIRMATIONS } from '@/data/childrenAffirmations';

export function ChildrenAffirmationsPage() {
  return (
    <PracticeSelector
      category="affirmation"
      heading="Which affirmation would you like to repeat?"
      supportingText="Calm, present-tense affirmations for exams and everyday confidence — choose one or write your own."
      customLabel="Write your own affirmation"
      customPlaceholder="Example: I am doing my best, one step at a time."
      privacyText="Your custom affirmation and personal progress are stored privately in this browser and are not sent to our server."
      options={CHILDREN_AFFIRMATIONS}
    />
  );
}
