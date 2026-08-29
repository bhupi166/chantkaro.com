# Chant Karo

**Har naam. Har aastha. Dil se chant karo.**
*Every faith. Every chant. One peaceful space.*

A free, inclusive, no-login repetition counter for chants, prayers, simran, dhikr and positive
affirmations — count by tap or voice, with your personal progress kept privately in your browser.

- **Frontend**: React 19 + TypeScript + Vite 8 + Tailwind CSS 4, deployed as a PWA on Cloudflare Pages.
- **API**: a small Cloudflare Worker (`worker/`) backed by Cloudflare D1, used only for three anonymous
  aggregate totals.
- **No accounts, ever.** All personal data lives in the browser (LocalStorage).

---

## 1. Project layout

```
.
├── src/                 # React app (frontend)
│   ├── components/      # Reusable UI (Logo, TapCounterArea, VoiceCounterArea, dialogs…)
│   ├── data/             # Suggested chant/affirmation catalogs (data-only, extensible)
│   ├── hooks/            # usePracticeCounter, useSpeechRecognition, useGlobalTotals…
│   ├── lib/               # Pure logic: storage, reducer helpers, speech matching, format, API client
│   ├── pages/             # Route-level screens
│   ├── state/             # AppDataContext + reducer (the local data model)
│   └── test/               # Vitest setup
├── e2e/                  # Playwright end-to-end tests
├── worker/                # Cloudflare Worker API + D1 schema/migrations
│   ├── src/
│   ├── migrations/
│   └── schema.sql
├── public/                # Static assets, icons, robots.txt, sitemap.xml, offline.html
└── scripts/generate-icons.mjs  # Regenerates PWA icons from the Chant Karo mark
```

## 2. Local setup

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local     # optional — see comments inside
npm run dev                    # http://localhost:5173
```

By default the frontend calls the Worker API at the **same origin** (`/api/*`). For local
full-stack development, run the Worker separately (see §4) and point the frontend at it via
`VITE_API_BASE_URL` in `.env.local`. Without a running Worker, the app still works fully — Tap Mode,
custom chants, targets and personal stats all work offline-first; only the three global totals show
"temporarily unavailable".

## 3. Testing

```bash
npm run lint            # oxlint
npm run format:check    # Prettier
npm run typecheck       # tsc -b (project references, strict)
npm test                # Vitest — unit + component tests (jsdom)
npm run test:coverage   # Vitest with coverage
npm run test:e2e        # Playwright — Mobile Android, Mobile iOS, Desktop Chrome
```

`npm run test:e2e` builds and serves both the dev server (port 5173) and a production preview with
the service worker enabled (port 4173, used by `e2e/pwa-offline.spec.ts`) and drives them with
Playwright, including an automated accessibility pass (`@axe-core/playwright`) on the main journey.

Worker tests (pure validation/CORS/rate-limit logic, no live D1 needed):

```bash
cd worker
npm install
npm test
npm run typecheck
```

## 4. Running the Worker API locally

```bash
cd worker
npm install
cp .dev.vars.example .dev.vars
npm run db:init:local     # creates & seeds a local D1 database from schema.sql
npm run dev                # wrangler dev — http://127.0.0.1:8787
```

Point the frontend at it by setting `VITE_API_BASE_URL=http://127.0.0.1:8787` in `.env.local`.

## 5. Production build

```bash
npm run build      # tsc -b && vite build  →  dist/
npm run preview    # serve dist/ locally to sanity-check the PWA build
```

## 6. Deploying to Cloudflare

### 6.1 Database (D1)

```bash
cd worker
npx wrangler d1 create chantkaro-db
# copy the returned database_id into worker/wrangler.toml ([[d1_databases]] database_id)
npm run db:migrate:remote
```

### 6.2 Worker API

```bash
cd worker
# set your real domain(s) in wrangler.toml [vars] ALLOWED_ORIGINS
npx wrangler deploy
```

Note the deployed Worker URL (e.g. `https://chantkaro-api.<subdomain>.workers.dev`).

### 6.3 Frontend (Cloudflare Pages)

1. Create a Cloudflare Pages project pointed at this repository.
   - Build command: `npm run build`
   - Build output directory: `dist`
2. Add a Pages **Function** or route rule so requests to `/api/*` are proxied to the Worker (Cloudflare
   Pages supports this via a `_routes.json` / Pages Functions passthrough, or you can point
   `VITE_API_BASE_URL` at the Worker's own `*.workers.dev` / custom domain instead and skip proxying —
   simplest for a first deploy).
3. Set the environment variable `VITE_API_BASE_URL` in the Pages project if not proxying same-origin.
4. Configure your custom domain (`chantkaro.com`) in Pages, and update `ALLOWED_ORIGINS` in
   `worker/wrangler.toml` to match exactly, then redeploy the Worker.

Both the Worker and Pages are designed to fit comfortably in Cloudflare's free tier for
moderate traffic.

## 7. Privacy architecture (what goes where)

| Data | Where it lives | Sent to server? |
|---|---|---|
| Selected/custom chants, prayers, affirmations | Browser LocalStorage | Never |
| Session / today / lifetime counts, targets, completion history | Browser LocalStorage | Never |
| Local profiles, theme, language, vibration/sound prefs | Browser LocalStorage | Never |
| Voice transcript | React component state only, cleared on stop | Never |
| Microphone audio | Not accessed by Chant Karo beyond the browser's own recognizer | Never |
| Anonymous increment: `{ category, amount, idempotencyKey }` | — | Only if "Contribute to Global Totals" is on |

The Worker (`worker/src/index.ts`) validates every increment request server-side
(`worker/src/validate.ts`): category must be `chant`/`affirmation`, amount must be a positive integer
under a fixed batch cap, the payload must contain **exactly** those three fields (nothing else is
accepted), and a request-size cap and per-IP-hash rate limit apply. IP addresses are never stored —
`worker/src/rateLimit.ts` only stores a SHA-256 hash of `(ip, one-minute window)`, and those rows are
pruned hourly by the Worker's scheduled handler, so nothing persists as a device fingerprint.

The frontend batches taps client-side (`src/lib/globalTotalsClient.ts` + `globalTotalsQueue.ts`)
rather than sending one request per repetition, flushing every ~15 repetitions, every 30 seconds, or
on pause/stop/tab-hide, and queues batches in LocalStorage when offline so they sync exactly once
when connectivity returns (idempotency keys are `crypto.randomUUID()`, checked server-side, so a
retried submission is safely ignored rather than double-counted).

## 8. Browser support notes — Voice Mode

Voice Mode uses the (still non-standard) Web Speech `SpeechRecognition` API:

- **Supported**: Chrome/Edge on Android and desktop, Safari 14.1+ (iOS/macOS, limited), Samsung Internet.
- **Not supported / inconsistent**: Firefox (no `SpeechRecognition` by default), older browsers, most
  in-app WebViews.
- Where unsupported, or if microphone permission is denied, Chant Karo automatically offers **Tap
  Mode** as a fallback — Voice Mode is never required.
- Recognition quality and language coverage vary by device and OS-level speech-recognition service;
  Chant Karo does not control or guarantee this.

## 9. Placeholders that MUST be replaced before production

- `privacy@chantkaro.com`, `hello@chantkaro.com`, `content@chantkaro.com` — placeholder contact
  addresses in `src/pages/PrivacyPage.tsx`, `TermsPage.tsx`, `ContactPage.tsx`.
- "Last updated" dates in `PrivacyPage.tsx` and `TermsPage.tsx`.
- `worker/wrangler.toml` — `database_id` under `[[d1_databases]]`, and `ALLOWED_ORIGINS` under `[vars]`.
- `https://chantkaro.com/social-preview.png` referenced in `index.html` Open Graph tags — generate and
  upload an actual social preview image (1200×630).
- Confirm the final production domain matches `index.html`'s canonical URL, `public/robots.txt`, and
  `public/sitemap.xml`.

## 10. Suggested phrases requiring final expert/community review

**Jain tradition**: only the Namokar (Navkar) Mantra is included, cross-checked against Wikipedia's
"Namokar Mantra" article and jaina.org's published text (both agree on wording). No other Jain
suggestions are included by design — users can enter any other Jain prayer via "Enter your own chant
or prayer," which stays entirely on-device. Add more reviewed Jain entries to the `CHANTS` array in
`src/data/chants.ts` (tradition: `'jain'`) as they're verified; the `needsReview: true` flag on a
`PracticeOption` exists for exactly this — flagging something shown to users as still pending final
sign-off.

More broadly, every suggested chant/prayer/dhikr/affirmation in `src/data/chants.ts` and
`src/data/affirmations.ts` is offered for convenient counting only ("Suggested phrases are provided
for convenient counting. Please follow the wording and guidance of your own spiritual tradition.") —
the content is organized to be easy to correct, extend or hide (`hidden: true`) without touching any
counting logic.

## 11. Accessibility

Built to WCAG 2.2 AA principles: semantic landmarks and headings, full keyboard operability, visible
focus rings, an accessible modal dialog for destructive confirmations, `aria-live` regions for
status/voice transcript, `role="progressbar"` on the circular counter, minimum 44×44px touch targets,
`prefers-reduced-motion` support, and correct `lang`/RTL handling for Hindi, Gurmukhi and Arabic
script. `npm run test:e2e` runs an automated axe-core pass on the primary journey as part of CI.
