# Chant Karo

**Har naam. Har aastha. Dil se chant karo.**
_Every faith. Every chant. One peaceful space._

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
├── public/                # Static assets, icons, robots.txt, sitemap.xml
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
npx wrangler secret put ADMIN_TOKEN            # a long random value
npx wrangler secret put SESSION_SIGNING_KEY    # a long random value — signs session tokens, see §14.1
npx wrangler secret put TURNSTILE_SECRET_KEY   # from your Cloudflare Turnstile widget, see §14.3
npx wrangler deploy
```

Never put any of these three values in `wrangler.toml`, `.dev.vars`, or any frontend code. Note the
deployed Worker URL (e.g. `https://chantkaro-api.<subdomain>.workers.dev`). `ADMIN_TOKEN` gates the
admin-only endpoints (`GET /api/admin/usage`, `PATCH /api/admin/config`, `GET`/`PATCH
/api/admin/security-config` — see §13.4, §14.4); generate it with something like `openssl rand -hex 32`,
store it in a password manager, and rotate it with `wrangler secret put ADMIN_TOKEN` again if it's ever
exposed. `TURNSTILE_SECRET_KEY` is paired with the public `TURNSTILE_SITE_KEY` already set in
`wrangler.toml` — create the widget once via `npx wrangler turnstile widget create "<name>" --domain
<your-domain> --mode managed` and use the `secret` it returns.

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

The Worker requires the **lowest Workers Paid plan** ($5/mo) rather than the free plan — see §13 for
why (cron-triggered `scheduled()` maintenance and D1 usage need it) — but is designed to stay on that
single flat fee. Never upgrade to a higher plan, and never enable paid Bot Management, paid
analytics/logging add-ons, or paid speech-recognition services without explicit administrator
approval; none of those are required for Chant Karo to function.

### 6.4 Before every deploy: size and budget checklist

```bash
npm run build                # tsc -b && vite build → dist/
npm run check:deploy-size    # fails (non-zero exit) if dist/ or the Worker bundle are oversized
```

`scripts/check-deploy-size.mjs` reports the `dist/` output size and file count, flags any asset over
5 MiB, fails if any asset exceeds Cloudflare's 25 MiB static-asset limit, runs
`wrangler deploy --outdir bundled --dry-run` to measure the Worker's compressed bundle size, and fails
if that exceeds the Workers Paid plan's 10 MiB compressed script limit. Wire it into CI as a required
step before any deploy job. It always cleans up the throwaway `worker/bundled/` dry-run output
(also gitignored, in case a run is interrupted).

Do **not** deploy the working directory as-is via a generic file copy — it also contains
`node_modules/`, `.git/`, test artifacts and dev caches (several hundred MB), none of which Cloudflare
needs. `wrangler deploy` and Cloudflare Pages builds both already exclude these correctly on their own
(they build from source, not from a directory snapshot), and `.gitignore` keeps them out of the
repository submitted for a Pages build in the first place.

### 6.5 Manual, one-time dashboard steps (not automatable via Wrangler)

- **Billing/usage alerts**: Cloudflare dashboard → Billing → Notifications — add alerts at
  approximately ₹400 and ₹500 of monthly spend, so an administrator is warned well before the ₹600–700
  target is at risk.
- **Zone-level Cache Rule** (optional but recommended at higher traffic): the Worker already caches
  `GET /api/totals` and `GET /api/config` at the edge via the Cache API (`caches.default`), which saves
  D1 reads and CPU time — but a Worker invocation still happens (and counts against the request quota)
  even on a cache hit. To also avoid counting those as Worker *requests*, add a dashboard Cache Rule
  (Rules → Cache Rules) matching `/api/totals` and `/api/config` with "Eligible for cache" and an edge
  TTL matching the values in §13.2. This is a zone-level dashboard setting with no Wrangler/API
  equivalent in this project, so it must be configured manually and isn't part of `wrangler deploy`.

## 7. Privacy architecture (what goes where)

| Data                                                           | Where it lives                                                 | Sent to server?                             |
| -------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------- |
| Selected/custom chants, prayers, affirmations                  | Browser LocalStorage                                           | Never                                       |
| Session / today / lifetime counts, targets, completion history | Browser LocalStorage                                           | Never                                       |
| Local profiles, theme, language, vibration/sound prefs         | Browser LocalStorage                                           | Never                                       |
| Voice transcript                                               | React component state only, cleared on stop                    | Never                                       |
| Microphone audio                                               | Not accessed by Chant Karo beyond the browser's own recognizer | Never                                       |
| Anonymous increment: `{ category, amount, idempotencyKey }`    | —                                                              | Only if "Contribute to Global Totals" is on |

The Worker (`worker/src/index.ts`) validates every increment request server-side
(`worker/src/validate.ts`): category must be `chant`/`affirmation`, amount must be a positive integer
under a fixed batch cap, the payload must contain **exactly** those three fields (nothing else is
accepted), and a request-size cap and per-IP-hash rate limit apply. IP addresses are never stored —
`worker/src/rateLimit.ts` only stores a SHA-256 hash of `(ip, one-minute window)`, and those rows are
pruned hourly by the Worker's scheduled handler, so nothing persists as a device fingerprint.

The frontend batches taps client-side (`src/lib/globalTotalsClient.ts` + `globalTotalsQueue.ts`)
rather than sending one request per repetition — see **§13 Cost model and global synchronization**
for the full batching, caching and budget-control architecture.

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

- Contact addresses (`PrivacyPage.tsx`, `TermsPage.tsx`, `ContactPage.tsx`) and the "Last updated"
  dates (`PrivacyPage.tsx`, `TermsPage.tsx`) are set — all contact mailto links point to
  `bhupi166@gmail.com` (every mailto link includes a `subject=Chant%20Karo%20-%20…` query parameter so
  outgoing emails always carry a "Chant Karo" subject), and both "Last updated" dates read
  August 29, 2026. Revisit both if the contact address or launch date changes.
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

**Affirmation translations** (Hindi/Punjabi, in every `titleTranslations` field across
`src/data/*Affirmations.ts`) were produced for this app rather than sourced from a published
reference — a reasonable first pass, not a substitute for a native-speaker review before treating them
as final. This is a lower-stakes category than the chant content above (ordinary supportive sentences,
not liturgical text), but the same principle applies: verify before relying on it.

## 11. Accessibility

Built to WCAG 2.2 AA principles: semantic landmarks and headings, full keyboard operability, visible
focus rings, an accessible modal dialog for destructive confirmations, `aria-live` regions for
status/voice transcript, `role="progressbar"` on the circular counter, minimum 44×44px touch targets,
`prefers-reduced-motion` support, and correct `lang`/RTL handling for Hindi, Gurmukhi and Arabic
script. `npm run test:e2e` runs an automated axe-core pass on the primary journey as part of CI.

## 12. Internationalization

The interface is fully translated into **English, Hindi and Punjabi** using
[i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/). Nothing user-facing
is hardcoded in a component — every string goes through `t('namespace.key')` (or `<Trans>` for text
with an embedded link, e.g. "Read the full **Privacy Policy**.").

- **Where translations live**: `src/i18n/locales/{en,hi,pa}.json` — one flat, namespaced JSON file per
  language (`common.*`, `home.*`, `settings.*`, `privacy.*`, …). `src/i18n/locales.test.ts` asserts all
  three files have exactly the same key set and no empty values, so a missing translation fails CI
  instead of silently falling back to English (or a raw key) in production.
- **Loading strategy**: only English ships in the main bundle; Hindi and Punjabi are fetched as
  separate chunks on first use (`src/i18n/index.ts` → `loadLanguage()`), so visitors who never switch
  language — the default case — don't pay for translations they never see.
- **Language selection**: driven by the existing per-profile `uiLanguage` setting (Settings →
  Appearance & Language) — the single source of truth, already persisted to LocalStorage via
  `AppDataContext`. `src/hooks/useLanguage.ts` reacts to it: loads the language bundle, calls
  `i18n.changeLanguage`, updates `<html lang>`, and swaps the PWA manifest `<link>` to
  `manifest.{lang}.webmanifest` (see below).
- **Voice recognition locale**: `VOICE_RECOGNITION_LOCALE` in `src/i18n/index.ts` maps the UI language
  to the BCP-47 tag passed to the Web Speech API — `en` → `en-IN`, `hi` → `hi-IN`, `pa` → `pa-IN` —
  wired through `VoiceCounterArea`.
- **Suggested-content translation model**: a chant/prayer's `title` (e.g. "Om Namah Shivaya") is a
  transliterated proper noun and **never changes** with UI language — only its `script` field
  (Devanagari/Gurmukhi/Arabic) does, independently. Affirmations are ordinary sentences, so they _do_
  translate: `PracticeOption.titleTranslations: { hi?, pa? }` holds the per-language text, resolved by
  `src/lib/practiceLocalization.ts`, with the English `title` as fallback. **Custom, user-entered text
  is never translated or altered** — the app doesn't have translation access to it, by design (it's
  never sent anywhere — see §7).
- **PWA metadata**: three static manifest files (`public/manifest.{en,hi,pa}.webmanifest`) carry a
  translated `name`/`description`; `useLanguage` swaps which one `index.html`'s `<link rel="manifest">`
  points at. (The Web App Manifest spec has no mechanism for one manifest to carry multiple languages,
  and this is a static Cloudflare Pages deployment with no server-side `Accept-Language` negotiation —
  this client-side swap is the practical middle ground.)
- **Fonts**: the base font stack (`src/index.css`) lists `Hind` (Latin + Devanagari) with `Noto Sans
Devanagari` and `Noto Sans Gurmukhi` as fallbacks, loaded in `index.html`, so both scripts render
  correctly whether they appear in translated UI chrome or in a chant's native-script line.
- **Testing**: `e2e/i18n.spec.ts` switches language and checks translated headings render, persist
  across reload, update `<html lang>`, and — critically — that the layout has **no horizontal overflow
  in Hindi or Punjabi** on real mobile viewports (Devanagari/Gurmukhi text runs longer than English in
  places, e.g. the header nav). `src/pages/HomePage.test.tsx` guards specifically against a `<Trans>`
  child-index bug class (a stray `{' '}` between text and a linked element shifts every following
  index, silently dropping the link — see git history for the concretes).

## 13. Cost model and global synchronization

Chant Karo's global totals ("X people have chanted Y times today") are the only feature that touches
a server at all. Everything else — counting, targets, history, custom chants, profiles — is entirely
local to the browser and costs nothing to run. This section explains how the global-totals path is
designed to stay near a **₹600–700/month** infrastructure budget (excluding domain and taxes) even
under heavy load, and exactly what happens as usage grows. ₹600 is an operational target, not a
contractual guarantee — actual Cloudflare pricing/limits can change.

### 13.1 Why one repetition is not one request

The single biggest cost lever is that the client never calls the server per tap. `record()` in
`src/lib/globalTotalsClient.ts` increments an in-memory/IndexedDB-persisted counter locally on every
repetition, and only pushes a batch onto the sync queue once the **server-configured batch
threshold** is reached (100 by default — see §13.3). A batch is also flushed early on
pause/stop/tab-hide (`flushPendingNow()`, wired into `PracticePage.tsx`'s visibility/pagehide
handlers) so a partial count is never stranded past a session boundary.

Each queued batch carries a client-generated `crypto.randomUUID()` idempotency key. The Worker
(`worker/src/index.ts` → `handleIncrement`) inserts that key and applies the increment in a single
atomic `D1Database.batch()` call; a `PRIMARY KEY` constraint on `idempotency_keys.idempotency_key`
makes a retried submission of the same batch a no-op (`409`, treated by the client as success) rather
than a double count. This is what makes retries, `sendBeacon` duplicates, and offline-queue replays
all safe.

On page unload, a plain `fetch()` can be cancelled by the browser before it completes, so
`flushViaBeacon()` additionally uses `navigator.sendBeacon` as a best-effort delivery attempt — but
its return value only means "the browser accepted this for later delivery," never "the server
processed it," so the client **never** removes a batch from its local queue on the strength of a
beacon alone. Only a real server response (via the next `sync()` cycle) clears a queue entry — so at
worst a beacon delivery is *redundant* with a later retry (safely deduplicated by its idempotency
key), never *lost*.

If a sync attempt fails (offline, server error), the batch stays in the IndexedDB-backed queue and
the client backs off with capped exponential delay (`BASE_RETRY_DELAY_MS = 30s`, doubling,
`MAX_RETRY_DELAY_MS = 30min`, in `src/lib/globalTotalsQueue.ts`) rather than retrying continuously —
so a burst of visitors going offline together never turns into a retry storm against the Worker the
moment connectivity returns.

### 13.2 Global-totals caching

`GET /api/totals` and `GET /api/config` are both served through `withEdgeCache()`
(`worker/src/index.ts`), which reads/writes Cloudflare's `caches.default` edge cache with a
`Cache-Control: public, max-age=…` matching the current mode's refresh interval. A cache hit never
touches D1. There is no WebSocket or live connection anywhere in this app — totals are explicitly
"near real-time" (`totals.nearRealTime` in every locale), refreshed on a timer
(`src/hooks/useGlobalTotals.ts`, adaptive recursive `setTimeout` using the server-provided
`refreshHintSeconds`), not pushed instantly. An in-Worker cache hit still counts as one Worker
*request*; eliminating that too requires a zone-level Cache Rule (§6.5), which isn't automatable via
Wrangler and must be configured once in the dashboard.

### 13.3 Adaptive cost-control modes

The Worker exposes its current operating mode via the cached `GET /api/config` endpoint
(`worker/src/syncConfig.ts`), and the client reads it (`src/lib/syncConfigClient.ts`, 5-minute
throttle, localStorage-cached, never blocks or throws) to drive both its batch threshold and its
totals-refresh interval — no client redeploy needed to change either.

| Mode              | Batch threshold | Totals refresh | Auto-escalates when this month's batches exceed |
| ----------------- | --------------: | --------------: | ------------------------------------------------ |
| `normal`           | 100              | 45s              | —                                                 |
| `elevated`         | 250              | 210s (3.5min)    | 500,000                                          |
| `high`             | 500              | 210s (3.5min)    | 2,000,000                                         |
| `cost-protection`  | 1000             | 750s (12.5min)   | 5,000,000                                         |

The Worker's `scheduled()` cron handler (`worker/wrangler.toml` trigger) recomputes this monthly
batch count and calls `nextAutoMode()` once per run; escalation is one-directional (it only steps
up, never silently back down mid-month) and only applies when `autoManaged` is true. An administrator
can always override any field manually via `PATCH /api/admin/config` (§13.4), including forcing a
mode, disabling `autoManaged`, or setting `submissionsPaused` directly — that patch also invalidates
the cached `/api/config` response immediately, rather than waiting out its TTL.

### 13.4 Admin usage endpoint

Two endpoints require a Bearer token matching the `ADMIN_TOKEN` Worker secret
(`worker/src/adminAuth.ts`, timing-safe comparison, fails closed if the secret isn't set):

```bash
# Technical usage snapshot — row counts, this month's batch count, current
# config, and a rough (non-authoritative) D1 storage estimate. No personal
# data of any kind — see worker/src/db.ts getUsageSnapshot().
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://<worker-url>/api/admin/usage

# Manually override any subset of the sync config.
curl -X PATCH -H "Authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"mode":"high","autoManaged":false}' https://<worker-url>/api/admin/config
```

For authoritative request counts, CPU time, and D1 storage, use the Cloudflare dashboard (Workers &
Pages → your Worker → Metrics; D1 → your database → Metrics) — the admin endpoint above is a cheap,
private, technical-only supplement, not a replacement for Cloudflare's own billing-accurate numbers.

### 13.5 Hard budget protection

If usage is trending to exceed the ~₹600–700 target, the intended operator response — via
`PATCH /api/admin/config` or the automatic escalation in §13.3 — is to raise the batch threshold,
slow the totals-refresh interval, and if genuinely necessary, set `submissionsPaused: true`. This is
a **client-side advisory signal only**: the Worker keeps accepting and applying any `/api/increment`
request that does arrive (never rejecting or discarding data that legitimately reaches it — that
would contradict "never lose data"), but a client that sees `submissionsPaused` in its config simply
stops *sending* new batches and keeps accumulating them locally instead
(`globalTotalsClient.ts` → `sync()` checks this before every attempt).

Personal counting (Tap Mode and Voice Mode, where supported) is entirely local and is **never**
affected by any of this — it doesn't call the Worker at all except to opportunistically contribute to
the global total. When `submissionsPaused` is active, `GlobalTotalsPanel` shows exactly:

> Your personal count is safe on this device. Global community synchronization is temporarily delayed
> to maintain reliable and sustainable service.

No paid plan upgrade, paid add-on, or additional infrastructure is ever triggered automatically by any
of this — the only manual, human-approved lever is the flat $5/mo Workers Paid plan itself (§6.3).

### 13.6 Estimated monthly usage at scale

Assuming the `normal`/`elevated`/`high` batching from §13.3 applies as volume grows (i.e. the system
is doing exactly what it's designed to do), and roughly estimating one `/api/increment` request per
batch, one `/api/totals` and one `/api/config` request per unique visitor session (both edge-cached,
so repeat requests within the TTL window are free):

| Repetitions/day | Mode (approx.)        | `/api/increment` requests/day | Rough Worker requests/month | D1 writes/month  |
| ---------------: | ---------------------- | ------------------------------: | ----------------------------: | ------------------: |
| 1,00,000 (1 lakh) | `normal` (÷100)         | ~1,000                          | ~60,000                        | ~60,000              |
| 10,00,000 (10 lakh) | `elevated`/`high` (÷250–500) | ~2,000–4,000              | ~150,000                       | ~150,000              |
| 1,00,00,000 (1 crore) | `cost-protection` (÷1000) | ~10,000                    | ~500,000                       | ~500,000              |

Even at 1 crore repetitions/day, monthly Worker requests and D1 writes stay a small fraction of the
Workers Paid plan's included 10 million requests/month and D1's generous included row-write
allowance — meaning the **only real recurring cost stays the flat $5/mo (≈ ₹420) base plan fee**,
comfortably inside the ₹600–700 target with headroom for the domain-independent taxes/FX variance
mentioned in the budget. These are order-of-magnitude planning estimates from the batching math
above, not a substitute for watching the Cloudflare dashboard directly.

### 13.7 What the server stores (and doesn't)

Per §7, the server only ever sees `{ category, amount, idempotencyKey }` — no personal counts, no
custom chant text, no religion/tradition, no profile names, no audio, no transcripts. Long-term, D1
holds exactly two kinds of rows (`worker/schema.sql`):

- `totals` — two aggregate numeric counters (`chant`, `affirmation`). This is the only long-lived
  data; it never grows in row count, only in value.
- `idempotency_keys` — one short-lived row per batch, auto-pruned by the `scheduled()` cron after
  `IDEMPOTENCY_RETENTION_HOURS = 60` hours (within the required 48–72h window), via
  `pruneExpiredIdempotencyKeys()` in `worker/src/db.ts`.
- `rate_limits` — one short-lived row per `(IP hash, one-minute window)`, pruned hourly by the same
  cron (§7).

`worker/src/db.ts`'s `getUsageSnapshot()`/`storageWarningMessage()` estimate D1 storage from row
counts (a rough, explicitly non-authoritative planning signal — the Cloudflare D1 dashboard is
always the authoritative figure) and the Worker's `scheduled()` handler logs a single warning line
when that estimate crosses ~50%, ~70% or ~85% of D1's included storage limit, so storage pressure is
visible in Worker logs well before it becomes a problem — without adding a routine per-request log
line anywhere (kept deliberately minimal, per the budget's "minimize production logging").

On the client, personal history/streaks/daily logs are capped to the most recent 365 days
(`src/state/appDataReducer.ts` → `bumpDailyLog`) while lifetime aggregate totals are preserved
indefinitely; the offline contribution queue lives in IndexedDB
(`src/lib/offlineQueueDb.ts`/`globalTotalsQueue.ts`), and small preferences (theme, language,
profile settings) remain in LocalStorage. Both storage layers degrade gracefully on quota errors
(operations become safe no-ops rather than throwing), and Settings already exposes export/clear of
all local data.

## 14. Security and abuse protection (global totals)

The client's own tap/repetition count is never trusted as-is by the server. Every batch that reaches
`POST /api/increment` is independently validated for who's sending it, how fast, and in what pattern,
before it is ever added to the public totals.

### 14.1 Session tokens

A genuine practice session calls `POST /api/session/start` once (`src/lib/sessionClient.ts`), sending
only a random, non-identifying `deviceId` (generated once via `crypto.randomUUID()` and cached in
LocalStorage — `src/lib/deviceId.ts`; never combined with personal data). The Worker
(`worker/src/session.ts`) creates a `sessions` row and returns a short-lived, HMAC-SHA256-signed token
(`SESSION_SIGNING_KEY` secret, default 6-hour TTL, admin-configurable — §14.4) — no external JWT
library, just Web Crypto. Every `POST /api/increment` must carry this token as
`Authorization: Bearer <token>` (or, only for the best-effort `sendBeacon` unload path, which cannot
set custom headers, a `?token=` query parameter — see `extractBearerToken()`); a missing, forged,
tampered or expired token is rejected with `401` before any other check runs. Personal, on-device
counting never needs a session token at all — only the optional contribution to the global total does.

### 14.2 Rate limits and speed/pattern detection

Beyond the per-IP-hash rate limit already used for cost control (§13), `/api/increment` also rate-limits
per session id and per device hash (`worker/src/rateLimit.ts`, generalized to any scope string) —
tighter ceilings than the shared IP limit, so one script cycling through fresh sessions from the same
device (or the same IP hosting many devices) still gets caught.

Each batch also carries `elapsedMs` (wall-clock time its repetitions were spread over) and `mode`
(`tap`/`voice`). `worker/src/security.ts` → `evaluateBatch()` computes an implied rate
(`amount / elapsedMs`) against server-configured ceilings — separately for Tap Mode (default 8/s) and
Voice Mode (default 2/s, since speaking a phrase inherently takes longer than tapping) — and flags
batches under 3 repetitions as too small a sample to judge a rate from at all. It also tracks
consecutive near-identical inter-batch intervals (within 20ms, 3 in a row by default) as a robotic
timing pattern. A single occasional anomaly is quietly rejected (`422`) — never applied to the total,
never retried — while cumulative suspicion crossing a threshold escalates to an interactive challenge
instead (§14.3), which is what makes this "progressive" rather than a silent, permanent block.

On the client, `TapCounterArea.tsx` also ignores any click whose native event is not
`isTrusted` — a script calling `.dispatchEvent()` or `.click()` produces an untrusted event in every
browser, so this stops trivial programmatic clicking at the source (real browser automation that
drives genuine input, as in the Playwright e2e suite, is indistinguishable from a real user and is a
known, accepted limit of any `isTrusted` check — the server-side speed/pattern/session checks are the
actual backstop). Voice Mode only ever counts phrases the Web Speech API itself recognized
(`useSpeechRecognition` → `onMatches`) — there is no code path for a client-supplied arbitrary total.

### 14.3 Progressive verification (Cloudflare Turnstile)

Turnstile — not the paid Bot Management product — is free and shown to nobody by default. Only once a
session's suspicion score crosses the configured threshold does `/api/increment` respond `428` with
`{ challengeRequired: true, turnstileSiteKey }`; the client (`TurnstileChallengeHost.tsx`) then lazily
loads the Turnstile script (never on the normal path) and shows a small modal. The resulting token is
sent back with the same batch; the Worker verifies it against Cloudflare's `siteverify` API
(`worker/src/turnstile.ts`, `TURNSTILE_SECRET_KEY` secret) before resetting the session's suspicion
score and applying the batch. A failed or abandoned challenge just means that batch is dropped and the
next sync cycle tries again — personal counting is completely unaffected either way.

### 14.4 Admin kill switch and tunable thresholds

`PATCH /api/admin/security-config` (Bearer `ADMIN_TOKEN`, same pattern as §13's `/api/admin/config`)
lets an administrator tune `maxTapRatePerSecond`, `maxVoiceRatePerSecond`, `sessionTtlSeconds` and
`challengeSuspicionThreshold` at runtime, with no redeploy. It also carries `abuseLockdown` — a
dedicated kill switch that, together with the existing cost-driven `submissionsPaused` flag, feeds into
the one public `submissionsPaused` boolean the client already knows how to handle (§13.5): personal
counting and Tap/Voice Mode keep working fully, existing batches stay safely queued, and the same
required message is shown. Flipping it back off resumes normal syncing with no data loss. None of these
threshold values, nor `ADMIN_TOKEN`/`SESSION_SIGNING_KEY`/`TURNSTILE_SECRET_KEY`, are ever exposed on
any public endpoint — only the Turnstile *site* key (`TURNSTILE_SITE_KEY`), which is meant to be public.

`GET /api/admin/usage` (§13.4) also reports aggregate abuse counters — `challengesIssued`,
`challengesPassed`, `batchesRejectedSpeed`, `batchesRejectedPattern`, `batchesRejectedAuth` — enough to
see abuse trends at a glance without ever storing a per-user history of what was rejected.

### 14.5 What's stored, and for how long

`sessions` rows (`worker/migrations/0003_security.sql`) hold nothing but a random session id, a
short-lived hash of IP and device signal, expiry, and small integer suspicion/pattern counters — pruned
automatically once expired by the same hourly `scheduled()` job that prunes idempotency keys and rate
limits (§7, §13.7). `security_config` is a single admin-tunable settings row plus a handful of
aggregate counters. No voice audio, transcript, chant text, or personal identifier is ever recorded,
uploaded or transmitted anywhere in this security layer — Voice Mode's privacy guarantee (§7, §8) is
completely unchanged by any of this.
