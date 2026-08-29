import { Link } from 'react-router-dom';

export function ChooseActivityPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold">
        What would you like to practise today?
      </h1>
      <div className="grid gap-5 sm:grid-cols-2">
        <ActivityCard
          title="Chant or Prayer"
          description="Repeat a sacred name, mantra, prayer, simran or dhikr."
          to="/chant"
          buttonLabel="Choose Chant or Prayer"
        />
        <ActivityCard
          title="Positive Affirmation"
          description="Repeat positive words to build peace, gratitude and confidence."
          to="/affirmation"
          buttonLabel="Choose an Affirmation"
        />
      </div>
    </div>
  );
}

function ActivityCard({
  title,
  description,
  to,
  buttonLabel,
}: {
  title: string;
  description: string;
  to: string;
  buttonLabel: string;
}) {
  return (
    <div className="card-surface flex flex-col items-start gap-3 rounded-2xl p-6">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="text-[color:var(--fg-muted)]">{description}</p>
      <Link
        to={to}
        className="mt-auto min-h-11 rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-contrast)]"
      >
        {buttonLabel}
      </Link>
    </div>
  );
}
