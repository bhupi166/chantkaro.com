export function TermsPage() {
  return (
    <article className="flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold">Terms of Use</h1>
      <p className="text-sm text-[color:var(--fg-muted)]">
        Last updated: [PLACEHOLDER — set on launch date]
      </p>

      <p>By using Chant Karo, you agree to the following terms.</p>

      <h2 className="font-display text-lg font-semibold">What Chant Karo is</h2>
      <p>
        Chant Karo is a free counting and personal-practice tool for chants, prayers, simran, dhikr
        and positive affirmations. It helps you count repetitions by tap or voice and keep a private
        record of your practice.
      </p>

      <h2 className="font-display text-lg font-semibold">What Chant Karo is not</h2>
      <ul className="list-disc pl-5">
        <li>It does not provide religious, spiritual, medical or mental-health advice.</li>
        <li>It does not guarantee any spiritual, medical, financial or personal outcome.</li>
        <li>
          Voice-recognition accuracy is not guaranteed and may vary by device, browser and accent.
        </li>
      </ul>

      <h2 className="font-display text-lg font-semibold">Follow your own tradition</h2>
      <p>
        Suggested phrases are provided for convenient counting only. Please follow the wording,
        pronunciation and guidance of your own spiritual tradition or teacher. Traditions are
        presented neutrally in this app and are not ranked or compared.
      </p>

      <h2 className="font-display text-lg font-semibold">Your custom content</h2>
      <p>
        Any custom chant, prayer or affirmation you enter is your own responsibility. Please use it
        lawfully and respectfully. Custom text is stored only in your browser and is never
        transmitted to our server.
      </p>

      <h2 className="font-display text-lg font-semibold">Availability</h2>
      <p>
        Chant Karo is provided "as is" and free of charge. We aim for high reliability but do not
        guarantee uninterrupted availability of the global-totals service; personal counting
        continues to work even when it is unavailable.
      </p>

      <h2 className="font-display text-lg font-semibold">Changes</h2>
      <p>
        We may update these terms from time to time. Continued use after a change means you accept
        the updated terms.
      </p>

      <h2 className="font-display text-lg font-semibold">Contact</h2>
      <p>
        Questions can be sent to{' '}
        <a className="underline" href="mailto:hello@chantkaro.com">
          hello@chantkaro.com
        </a>{' '}
        [PLACEHOLDER — replace before production].
      </p>
    </article>
  );
}
