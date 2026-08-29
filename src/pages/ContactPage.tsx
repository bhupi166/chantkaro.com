export function ContactPage() {
  return (
    <article className="flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold">Contact</h1>
      <p>We welcome questions, corrections to suggested phrases, and accessibility feedback.</p>
      <dl className="mt-2 space-y-2">
        <div>
          <dt className="text-sm font-medium text-[color:var(--fg-muted)]">General</dt>
          <dd>
            <a className="underline" href="mailto:hello@chantkaro.com">
              hello@chantkaro.com
            </a>{' '}
            <span className="text-xs text-[color:var(--fg-muted)]">[PLACEHOLDER]</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-[color:var(--fg-muted)]">Privacy</dt>
          <dd>
            <a className="underline" href="mailto:privacy@chantkaro.com">
              privacy@chantkaro.com
            </a>{' '}
            <span className="text-xs text-[color:var(--fg-muted)]">[PLACEHOLDER]</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-[color:var(--fg-muted)]">Content corrections</dt>
          <dd>
            <a className="underline" href="mailto:content@chantkaro.com">
              content@chantkaro.com
            </a>{' '}
            <span className="text-xs text-[color:var(--fg-muted)]">[PLACEHOLDER]</span>
          </dd>
        </div>
      </dl>
    </article>
  );
}
