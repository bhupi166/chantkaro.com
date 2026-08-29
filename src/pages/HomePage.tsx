import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { GlobalTotalsPanel } from '@/components/GlobalTotalsPanel';
import { useAppData } from '@/state/AppDataContext';

export function HomePage() {
  const { activeProfile } = useAppData();
  const hasProgress = activeProfile.lastActivePractice != null;

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col items-center gap-5 py-6 text-center">
        <Logo className="scale-150" titleId="home-logo-title" />
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Chant Karo</h1>
          <p className="mt-2 text-lg font-medium text-[color:var(--accent)]">
            Har naam. Har aastha. Dil se chant karo.
          </p>
          <p className="mt-1 text-sm text-[color:var(--fg-muted)]">
            Every faith. Every chant. One peaceful space.
          </p>
        </div>
        <p className="max-w-xl text-balance text-[color:var(--fg)]">
          Choose any sacred name, mantra, prayer, simran, dhikr or positive affirmation. Repeat
          privately, count effortlessly and build a peaceful daily practice—without registration.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/choose"
            className="min-h-12 rounded-full bg-[color:var(--accent)] px-6 py-3 text-base font-semibold text-[color:var(--accent-contrast)] shadow-sm"
          >
            Start Your Practice
          </Link>
          {hasProgress && (
            <Link
              to="/practice"
              className="min-h-12 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-6 py-3 text-base font-semibold"
            >
              Continue Last Practice
            </Link>
          )}
        </div>
      </section>

      <GlobalTotalsPanel />

      <section className="grid gap-4 sm:grid-cols-2">
        <ModeExplainer
          title="Tap Mode"
          description="Tap anywhere on a large, calm counter to record each repetition. Works fully offline, with optional gentle vibration."
        />
        <ModeExplainer
          title="Voice Mode (Beta)"
          description="Your browser listens for your selected phrase and counts it automatically. Chant Karo never records, stores or sends your voice."
        />
      </section>

      <section className="card-surface rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold">Your privacy, in short</h2>
        <ul className="mt-3 space-y-2 text-sm text-[color:var(--fg-muted)]">
          <li>No login, registration or personal details, ever.</li>
          <li>Your words, custom chants and personal history stay on this device.</li>
          <li>Only an anonymous number and category may be added to the community totals above.</li>
          <li>
            Read the full{' '}
            <Link to="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </li>
        </ul>
      </section>
    </div>
  );
}

function ModeExplainer({ title, description }: { title: string; description: string }) {
  return (
    <div className="card-surface rounded-2xl p-5">
      <h3 className="font-display font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[color:var(--fg-muted)]">{description}</p>
    </div>
  );
}
