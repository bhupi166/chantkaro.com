import { Link } from 'react-router-dom';

interface Benefit {
  title: string;
  description: string;
}

const CHANT_BENEFITS: Benefit[] = [
  {
    title: 'Creates a Peaceful Pause',
    description: 'Repeating sacred words may help the mind slow down and create a moment of calm.',
  },
  {
    title: 'Supports Concentration',
    description: 'Focusing on one chant can help reduce everyday distractions during the practice.',
  },
  {
    title: 'Builds a Consistent Practice',
    description: 'Personal counts and optional targets can encourage regular spiritual practice.',
  },
  {
    title: 'Deepens Spiritual Connection',
    description: 'Chanting can provide personal time for devotion, prayer and remembrance.',
  },
  {
    title: 'Encourages Positive Feelings',
    description: 'A meaningful chant may support gratitude, hope and inner positivity.',
  },
];

const AFFIRMATION_BENEFITS: Benefit[] = [
  {
    title: 'Encourages Positive Self-Talk',
    description: 'Repeating constructive words can help develop a kinder internal voice.',
  },
  {
    title: 'Strengthens Confidence',
    description:
      'Positive affirmations may remind users of their abilities and personal strengths.',
  },
  {
    title: 'Creates Clear Intentions',
    description:
      'An affirmation can help users focus on the attitude they want to carry throughout the day.',
  },
  {
    title: 'Supports a Positive Perspective',
    description:
      'Regular repetition may help users approach everyday situations more thoughtfully.',
  },
  {
    title: 'Develops a Mindful Routine',
    description: 'Morning and evening affirmations can become a simple, peaceful daily habit.',
  },
];

export function BenefitsPage() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-2xl font-semibold">Benefits of Chanting & Affirmations</h1>
        <p className="mt-2 max-w-2xl text-[color:var(--fg-muted)]">
          These reflect common, personally reported experiences of steady practice — not medical or
          guaranteed outcomes. Chant Karo does not provide medical or mental-health advice; see our{' '}
          <Link to="/terms" className="underline">
            Terms of Use
          </Link>
          .
        </p>
      </div>

      <BenefitSection title="Chant Benefits" benefits={CHANT_BENEFITS} />
      <BenefitSection title="Affirmation Benefits" benefits={AFFIRMATION_BENEFITS} />
    </div>
  );
}

function BenefitSection({ title, benefits }: { title: string; benefits: Benefit[] }) {
  const headingId = `${title.toLowerCase().replace(/\s+/g, '-')}-heading`;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-xl font-semibold">
        {title}
      </h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {benefits.map((b) => (
          <li key={b.title} className="card-surface rounded-2xl p-5">
            <h3 className="font-display font-semibold">{b.title}</h3>
            <p className="mt-1.5 text-sm text-[color:var(--fg-muted)]">{b.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
