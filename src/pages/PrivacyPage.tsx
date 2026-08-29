export function PrivacyPage() {
  return (
    <article className="prose-content flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold">Privacy Policy</h1>
      <p className="text-sm text-[color:var(--fg-muted)]">
        Last updated: [PLACEHOLDER — set on launch date]
      </p>

      <p>
        Chant Karo is built so that your practice can stay private. This page explains, in plain
        language, what stays on your device and what — if anything — reaches our server.
      </p>

      <h2 className="font-display text-lg font-semibold">No account is required</h2>
      <p>
        You never need to log in, register, or provide an email address, phone number or any
        personal detail to use Chant Karo.
      </p>

      <h2 className="font-display text-lg font-semibold">What stays on your device</h2>
      <p>
        Your selected practices, custom chants and affirmations, session and lifetime counts,
        targets, profiles, theme and language preferences are stored locally in your browser
        (LocalStorage). None of this is sent to our server. Clearing your browser data, using
        private browsing, or switching devices can remove it — you can export a backup at any time
        from Settings.
      </p>

      <h2 className="font-display text-lg font-semibold">Voice Mode</h2>
      <p>
        Voice Mode is optional and off until you explicitly start it. Chant Karo does not record,
        store or receive your voice. Your browser or device may process speech using its own
        built-in or cloud speech-recognition service, outside of Chant Karo's control — please
        review your browser's own privacy settings. We never store or transmit the transcript.
      </p>

      <h2 className="font-display text-lg font-semibold">Anonymous global totals</h2>
      <p>
        If "Contribute to Global Totals" is on, your device periodically sends only a category (
        <code>chant</code> or <code>affirmation</code>) and a positive whole-number increment,
        together with a random idempotency key used purely to prevent double-counting. We never
        receive your selected chant text, custom wording, religion, voice, personal history, or any
        identifying information. You can turn this off at any time in Settings; personal counting
        keeps working exactly the same either way.
      </p>

      <h2 className="font-display text-lg font-semibold">Your data, your control</h2>
      <ul className="list-disc pl-5">
        <li>Export your local data as a JSON file at any time.</li>
        <li>Import a previously exported file to restore your progress.</li>
        <li>Clear all local data permanently from Settings.</li>
      </ul>

      <h2 className="font-display text-lg font-semibold">Technical server logs</h2>
      <p>
        Our hosting and API infrastructure may temporarily process essential technical logs (such as
        request timestamps and error rates) for security, abuse prevention and reliability. These
        logs are kept for the minimum practical period and are not used to build personal profiles.
      </p>

      <h2 className="font-display text-lg font-semibold">Independence</h2>
      <p>
        Chant Karo is an independent project. It is not affiliated with, endorsed by, or operated on
        behalf of any religious organization, unless explicitly stated otherwise.
      </p>

      <h2 className="font-display text-lg font-semibold">Contact</h2>
      <p>
        Questions about this policy can be sent to{' '}
        <a className="underline" href="mailto:privacy@chantkaro.com">
          privacy@chantkaro.com
        </a>{' '}
        [PLACEHOLDER — replace before production].
      </p>
    </article>
  );
}
