import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold">Page not found</h1>
      <p className="text-[color:var(--fg-muted)]">This page does not exist, or may have moved.</p>
      <Link
        to="/"
        className="min-h-11 rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-contrast)]"
      >
        Return Home
      </Link>
    </div>
  );
}
