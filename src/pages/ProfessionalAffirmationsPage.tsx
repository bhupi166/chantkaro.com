import { useState } from 'react';
import { PracticeSelector } from '@/components/PracticeSelector';
import { PROFESSIONAL_AFFIRMATIONS, PROFESSION_CATEGORIES } from '@/data/professionalAffirmations';

export function ProfessionalAffirmationsPage() {
  const [professionKey, setProfessionKey] = useState<string | null>(null);

  if (!professionKey) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">What is your work or profession?</h1>
          <p className="mt-1 text-[color:var(--fg-muted)]">
            Choose a category to see relevant affirmations, or write your own.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Profession categories">
          {PROFESSION_CATEGORIES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setProfessionKey(p.key)}
              className="min-h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-4 py-3 text-left font-medium"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const category = PROFESSION_CATEGORIES.find((p) => p.key === professionKey)!;
  const options = PROFESSIONAL_AFFIRMATIONS[professionKey] ?? [];

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setProfessionKey(null)}
        className="self-start text-sm underline underline-offset-2"
      >
        ← Change category
      </button>
      {/* key forces a clean remount so search/selection state never leaks
          between one profession's list and the next. */}
      <PracticeSelector
        key={professionKey}
        category="affirmation"
        heading={`Affirmations for ${category.label}`}
        supportingText={
          options.length > 0
            ? 'Choose a suggested affirmation or write your own.'
            : 'No suggestions for this category yet — write your own below.'
        }
        customLabel="Write your own affirmation"
        customPlaceholder="Example: I approach my work with confidence and care."
        privacyText="Your custom affirmation and personal progress are stored privately in this browser and are not sent to our server."
        options={options}
      />
    </div>
  );
}
