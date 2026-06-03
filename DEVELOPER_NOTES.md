# DojoTrack — Developer Notes

> Onboarding + production-readiness notes for the DojoTrack codebase as of **Sprint 5**
> (commit `9cea2f9`). If you just cloned this repo, start at
> [Post-clone setup](#post-clone-setup).

DojoTrack is a martial-arts club management app (classes, belt progression,
payments, competitions, sparring). It is **demo-grade**: every external
dependency (database, Stripe, Supabase auth) is gated so the app stays buildable
and browsable with **no configuration at all** — unconfigured services render
empty states and APIs return a friendly `503`. That makes local exploration easy
but also means several things that look "done" are deliberately stubbed. This
document lists exactly what is and isn't wired up.

---

## Table of contents

1. [Architecture overview](#architecture-overview)
2. [Post-clone setup](#post-clone-setup)
3. [Environment variables](#environment-variables)
4. [Missing / required configuration](#missing--required-configuration)
   - [Database (Supabase Postgres + Prisma)](#1-database-supabase-postgres--prisma)
   - [Seeding the first club (important)](#2-seeding-the-first-club-important)
   - [Supabase auth (phone OTP)](#3-supabase-auth-phone-otp)
   - [Stripe payments + webhooks](#4-stripe-payments--webhooks)
   - [Deployment (Vercel)](#5-deployment-vercel)
5. [Security gaps to close before production](#security-gaps-to-close-before-production)
6. [Known limitations / TODOs (Sprints 1–5)](#known-limitations--todos-sprints-15)

---

## Architecture overview

### Tech stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | **Next.js 16.2.7** (App Router, `src/`, Turbopack) | Uses `src/proxy.ts`, the Next 16 replacement for `middleware.ts`. |
| UI | **React 19.2.4**, **Tailwind CSS v4**, `lucide-react`, `clsx` + `tailwind-merge` | `components/ui/` is an empty shadcn placeholder (not yet adopted). |
| ORM | **Prisma 7.8** + **`@prisma/adapter-pg`** (pg driver adapter) | App connects via the **pooled** `DATABASE_URL`; the Prisma CLI uses `DIRECT_URL`. The `datasource` block carries **no `url`** — see `prisma.config.ts`. |
| Database | **Supabase Postgres** | Tables/columns map to `snake_case`. **No migrations dir** — schema ships via `db push` (see below). |
| Auth | **Supabase Auth** (`@supabase/ssr`) — **phone OTP / SMS** | Browser + server clients in `src/lib/supabase/`. |
| Payments | **Stripe 22.2** (server SDK only) | Hosted Checkout — no `@stripe/stripe-js`. API pinned to `2026-05-27.dahlia`. |
| Notifications | WhatsApp Business API (**planned**) | Currently a `console.log` stub — see `src/lib/notify.ts`. |
| Hosting | **Vercel** (intended) | No `vercel.json`; Next.js is auto-detected. |
| QR | `qrcode` | Self-check-in links for class sessions. |

**Runtime:** Next 16 requires **Node ≥ 20.9** (dev machines here run Node 22).
There is no `engines` field or `.nvmrc` yet — consider adding one.

### Key directories

```
src/
├── app/
│   ├── (app)/              # Authenticated dashboard (route group → no URL segment)
│   │   ├── dashboard/      # Entry point after login (there is NO (app)/page.tsx — by design)
│   │   ├── students/  classes/  belts/  payments/
│   │   ├── competitions/  sparring/  settings/
│   ├── (auth)/             # login/ + register/ — phone-OTP forms
│   ├── api/                # 28 route handlers (REST-ish, see below)
│   ├── club/[slug]/        # PUBLIC club profile page
│   ├── join/[token]/       # PUBLIC invitation accept page
│   ├── checkin/[sessionId] # Student self-check-in (PROTECTED)
│   ├── certificate/[candidateId]  # PUBLIC-by-link printable grading certificate
│   └── page.tsx            # PUBLIC landing page
├── components/             # sidebar, logo, belt-badge, level-badge (ui/ is empty)
├── lib/
│   ├── prisma.ts           # Prisma singleton (driver adapter, lazy)
│   ├── db.ts               # isDbConfigured() gate
│   ├── stripe.ts           # getStripe() singleton + isStripeConfigured() gate
│   ├── supabase/           # client.ts (browser) + server.ts (RSC/route handlers)
│   ├── queries.ts          # ~70KB serialized-DTO data layer (the bulk of the app)
│   ├── constants.ts        # BRAND, COLORS, 12 BELT_SYSTEMS, requirement/billing meta
│   ├── schedule.ts         # nextOccurrences() — deterministic session dates
│   ├── sparring.ts         # generateSparringPlan() — pure pairing algorithm
│   ├── sparring-service.ts # regenerateSparringPairs() — persistence
│   ├── notify.ts           # WhatsApp STUB (console.log)
│   ├── invite.ts / qr.ts / utils.ts
│   └── ...
├── proxy.ts                # Route protection + Supabase session refresh (Next 16 middleware)
└── types/index.ts
prisma/schema.prisma        # 21 models, 14 enums
```

### How the gating pattern works (read this first)

Three independent "is X configured?" gates keep the app runnable with zero env:

- **`isDbConfigured()`** (`src/lib/db.ts`) — true when `DATABASE_URL` starts with `postgres`. Every query in `queries.ts` checks it and returns `[]` / `null` on miss, swallowing errors.
- **`isStripeConfigured()`** (`src/lib/stripe.ts`) — true when `STRIPE_SECRET_KEY` is set. `/payments` renders an empty state; `/api/checkout` and `/api/webhooks/stripe` return `503` when unset.
- **Supabase no-op** (`src/proxy.ts`, `src/app/(app)/layout.tsx`) — when `NEXT_PUBLIC_SUPABASE_URL` isn't an `http(s)` URL, route protection is skipped entirely so placeholder pages stay reachable.

Net effect: `npm run build` and `npm run dev` succeed with no `.env`. "Empty everywhere" is expected, not a bug.

### Data-model notes that aren't obvious from the schema

- **No migrations.** There is no `prisma/migrations/` directory. Schema changes ship via `prisma db push`. To change the schema: edit `schema.prisma` → `npx prisma generate` → `npm run db:push`. Do **not** author migration files.
- **Lazy materialization.** `ClassSession` rows (concrete dated classes) and `BeltRank` rows (per-club belt ladders) are **not** pre-generated — they're `upsert`-created on first view/book/check-in. Session dates come from `schedule.ts`; belt ranks from the `BELT_SYSTEMS` constants via `ensureBeltRanks()`.
- **No `BeltHistory` model.** Belt history is *derived* from passed `GradingCandidate` rows.
- **Sparring pairing is pure** (`sparring.ts`): matches by belt-`order` proximity, avoids repeat matchups across rounds, rotates byes. Weight is not tracked yet (always `null`). Persistence is separate in `sparring-service.ts`.

---

## Post-clone setup

```bash
# 1. Install dependencies (runs `prisma generate` via postinstall)
npm install

# 2. Create your local env file from the template
cp .env.example .env.local
#    → fill in the values described in the Environment variables section.
#    The app builds & runs with an EMPTY .env.local (everything no-ops),
#    so configure only what you need.

# 3. Push the Prisma schema to your database (creates all tables)
#    Requires DATABASE_URL + DIRECT_URL to be set first.
npm run db:push

# 4. Seed the first club + owner user (REQUIRED — nothing creates one yet).
#    See "Seeding the first club" below. Easiest path:
npm run db:studio   # opens Prisma Studio — add one Club row and one OWNER User row

# 5. Run the dev server
npm run dev         # http://localhost:3000
```

### Useful scripts (`package.json`)

| Script | What it does |
| --- | --- |
| `npm run dev` | Next dev server (Turbopack). |
| `npm run build` | `prisma generate && next build`. Succeeds with no env. |
| `npm start` | Production server (after `build`). |
| `npm run lint` | ESLint (`eslint-config-next`). |
| `npm run format` | Prettier write. |
| `npm run db:push` | `prisma db push` — apply schema (the canonical workflow here). |
| `npm run db:generate` | `prisma generate` — regenerate the client. |
| `npm run db:migrate` | `prisma migrate dev` — **not used**; this project has no migrations. |
| `npm run db:studio` | Prisma Studio — the practical way to seed/inspect data. |

### Local Stripe webhooks

To exercise checkout end-to-end locally you need the **Stripe CLI** forwarding events to the local webhook route:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# → prints a "whsec_..." signing secret. Put it in .env.local as STRIPE_WEBHOOK_SECRET
#   and restart `npm run dev`.

# Trigger a test event in another terminal:
stripe trigger checkout.session.completed
```

---

## Environment variables

Copy `.env.example` → `.env.local` (gitignored) and fill in. **The app runs with
all of these blank** — only set what you intend to exercise.

| Variable | Required? | Description | Where to get it |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | For auth | Supabase project URL (`https://<ref>.supabase.co`). When not an `http(s)` URL, all auth/route-protection is skipped. | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For auth | Supabase anonymous/public key (browser-safe). | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_URL` | Recommended | App base URL. Used for invite/check-in/share links **and** Stripe checkout success/cancel redirects. Defaults to `http://localhost:3000`. | You set it — e.g. `https://yourapp.vercel.app` in prod. |
| `DATABASE_URL` | For all data | **Pooled** Postgres connection (port `6543`, `?pgbouncer=true`). Used by the app at runtime via the pg adapter. Must start with `postgres` to pass `isDbConfigured()`. | Supabase Dashboard → Project Settings → Database → Connection string → "Transaction" pooler |
| `DIRECT_URL` | For schema push | **Direct** Postgres connection (port `5432`). Used **only** by the Prisma CLI for `db push` / `generate`. | Supabase Dashboard → Database → Connection string → "Session" / direct |
| `STRIPE_SECRET_KEY` | For payments | Stripe server secret (`sk_test_...` / `sk_live_...`). When unset, `/payments` shows an empty state and checkout/webhook routes return `503`. | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | For payments | Signing secret to verify incoming Stripe events (`whsec_...`). Without it the webhook route returns `503`. | Stripe CLI (`stripe listen`) locally, or Dashboard → Webhooks → your endpoint |
| `NEXT_PUBLIC_SITE_URL` | Optional | **Undocumented in `.env.example`.** Alternate fallback for the checkout redirect base URL in `src/lib/stripe.ts` (`appUrl()` tries `NEXT_PUBLIC_URL` → `NEXT_PUBLIC_SITE_URL` → localhost). Prefer `NEXT_PUBLIC_URL`; this exists only as a fallback. | You set it (alias of `NEXT_PUBLIC_URL`). |
| `NODE_ENV` | Auto | Set by the framework/host. `prisma.ts` only caches the client globally when `!= production`. | n/a |

> **Note:** there are currently **no env vars for the WhatsApp API**, no Supabase
> **service-role** key, and no SMS-provider credentials in the app — see the
> relevant sections below for where those actually live.

---

## Missing / required configuration

### 1. Database (Supabase Postgres + Prisma)

- Create a Supabase project; copy the **pooled** string into `DATABASE_URL` and
  the **direct** string into `DIRECT_URL`.
- Run **`npm run db:push`** to create all tables. There is **no migration
  history** and **no seed script** in the repo — `db push` is the only schema
  workflow. In CI/CD this push step is **manual**; it is *not* part of
  `npm run build`.
- `BeltRank` ladders seed themselves lazily per club the first time `/belts` is
  viewed, so you do **not** need to seed belts.

### 2. Seeding the first club (important)

⚠️ **There is no code path that creates a `Club` or `User` row.** The registration
page (`/register`) only calls Supabase `signInWithOtp` and stashes the club name
/ discipline in the user's auth metadata — it does **not** write to Postgres.
Meanwhile the entire app resolves "the current club" via
`getCurrentClub()`, which simply returns the **oldest `Club` row** (the app is
effectively single-tenant today).

**Consequence:** after `db:push`, the dashboard will be empty and most pages will
have nothing to act on until at least one `Club` exists. Until a real
registration backend lands, seed manually:

- **Easiest:** `npm run db:studio` → add one `Club` row (set `name`, a unique
  `slug`, and `disciplines`) and one `User` row with `role = OWNER` linked to
  that club.
- Or write a one-off script / SQL insert.

There is **no `prisma/seed.ts`** — adding one (and wiring `prisma.seed` in
`prisma.config.ts`) is a good first improvement.

### 3. Supabase auth (phone OTP)

The login/register UI uses **phone OTP over SMS** (`supabase.auth.signInWithOtp({ phone })`).
For codes to actually send you must configure an **SMS provider in the Supabase
Dashboard** → Authentication → Providers → **Phone** (Twilio, MessageBird,
Vonage, or Textlocal). Those credentials live in Supabase, **not** in this repo's
env.

- `src/app/api/auth/callback/route.ts` exchanges an OAuth/magic-link `code` for a
  session — it exists but the current UI path is phone OTP, so it's only exercised
  if you add an OAuth/magic-link flow.
- **Auth → tenant mapping is not built.** A signed-in Supabase user is **not**
  linked to a `Club`/`User` row. `getCurrentClub()`, `getCurrentStudent()`, and
  `getCurrentInstructor()` are single-tenant demo resolvers (oldest club / oldest
  active member / first owner-or-instructor). Real multi-tenant auth is a
  prerequisite for production.

### 4. Stripe payments + webhooks

1. Set `STRIPE_SECRET_KEY`.
2. Configure a webhook endpoint at `https://<your-domain>/api/webhooks/stripe`
   and set `STRIPE_WEBHOOK_SECRET` (locally: use the Stripe CLI — see
   [Local Stripe webhooks](#local-stripe-webhooks)).
3. **Subscribe these events** (the handler ignores everything else):
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

How it works (so you don't double-count revenue):

- **Hosted Checkout** — the server creates a Checkout Session and redirects the
  browser to `session.url`. No client-side Stripe.js.
- A plan's Stripe **Product + Price** is provisioned lazily on first checkout and
  cached back onto `PaymentPlan.stripeProductId/stripePriceId`.
- **ONE_TIME** plans: checkout pre-creates a `PENDING` `Payment`; the webhook
  flips it to `PAID` on `checkout.session.completed`.
- **Subscriptions**: no payment is pre-created. `invoice.payment_succeeded`
  records one `Payment` per invoice (idempotent on `stripeInvoiceId`);
  `customer.subscription.*` upserts the `Membership` (keyed by
  `stripeSubscriptionId`). The webhook is the **source of truth** for revenue.
- The handler reads a few fields defensively via `as any` because the
  `2026-05-27.dahlia` API moved `current_period_end` / invoice `subscription` /
  `payment_intent`. If you bump `apiVersion` in `src/lib/stripe.ts`, re-check
  those accessors in `src/app/api/webhooks/stripe/route.ts`.

### 5. Deployment (Vercel)

- No `vercel.json` is needed — Next.js is auto-detected. Build command is already
  `prisma generate && next build` (via `package.json`).
- **Set every env var** from the table above in the Vercel project (per
  environment). Remember `DIRECT_URL` is needed for any `prisma generate` that
  runs during build.
- **Run `db:push` manually** against the production DB before/after first deploy —
  it is not part of the build.
- Point your production **Stripe webhook** at `/api/webhooks/stripe` and set
  `STRIPE_WEBHOOK_SECRET` to that endpoint's secret (the CLI secret is local-only).
  The webhook route is already `export const dynamic = "force-dynamic"` and reads
  the raw body for signature verification — no extra body-parser config needed.
- Set `NEXT_PUBLIC_URL` to the deployed origin so invite links, check-in QR codes,
  and Stripe success/cancel redirects resolve correctly.
- Consider pinning Node (add `"engines": { "node": ">=20.9" }` or a `.nvmrc`).
- `public/` is currently empty (no `favicon.ico` asset). Harmless, but add brand
  assets when ready.

---

## Security gaps to close before production

These are fine for a single-tenant demo but **must** be addressed before a real
multi-tenant launch:

- **API routes are unauthenticated.** `src/proxy.ts` protects *page* routes
  (`/dashboard`, `/students`, … via `PROTECTED_PREFIXES`) but its `matcher`
  **excludes `/api`**, and **no API route handler checks the Supabase user**.
  Handlers gate only on `isDbConfigured()` and resolve the club through the
  single-tenant `getCurrentClub()`. As written, any deployed endpoint
  (`POST /api/students`, `/api/checkout`, `/api/exams/[id]/results`, etc.) is
  **publicly callable**. Add auth + per-tenant authorization to every mutating
  route.
- **No real tenant isolation.** Because `getCurrentClub()` returns the oldest
  club, all requests act on the same club regardless of who is signed in.
- **Public-by-design routes** (intentional, but be aware): `/club/[slug]`,
  `/join/[token]`, the landing page, and `/certificate/[candidateId]` are all
  reachable without auth. `/checkin/[sessionId]` **is** protected.
- No rate limiting / abuse protection on public endpoints (invites, check-in,
  webhook).

---

## Known limitations / TODOs (Sprints 1–5)

Stubs and deliberate placeholders still in the tree (these are *not* bugs — they
were scoped to "later sprints"):

- **WhatsApp notifications are a stub.** `src/lib/notify.ts` `notifyStudents()`
  only `console.log`s. It's wired into session cancellation and exam-pass flows,
  so the call sites are real — only delivery is missing. No WhatsApp env vars
  exist yet.
- **Settings page is read-only.** `src/app/(app)/settings/page.tsx` has all inputs
  `disabled` and the Save button is inert ("Editing arrives in a later sprint").
- **Registration doesn't persist a club** — see
  [Seeding the first club](#2-seeding-the-first-club-important).
- **Demo single-tenant resolvers** in `src/lib/queries.ts`:
  - `getCurrentClub()` → oldest `Club`.
  - `getCurrentStudent(clubId)` → club's oldest active member (used as the
    booking/check-in actor).
  - `getCurrentInstructor(clubId)` → first `OWNER`/`INSTRUCTOR` (used for
    `assessedBy` and the certificate's "Assessed by").
- **Landing page** (`src/app/page.tsx`) shows a **placeholder club directory** —
  real entries arrive once registration ships.
- **Public club page** (`/club/[slug]`) shows "Location coming soon" / "This club
  page is coming soon" empty states when a profile isn't filled in.
- **Roster table** (`students-table.tsx`) — attendance and payment columns are
  placeholders until those subsystems are surfaced there.
- **Belt data gap (carried from Sprint 4):** students created in Sprints 2–3 may
  have `beltRankId = null` (the add-student form's belt options were non-persistable
  before ranks were seeded), so they won't appear as exam candidates until promoted
  or re-added.
- **Sparring ignores weight** — pairing is by belt order only; `weight` is always
  `null`. `SparringPair.studentBId = null` denotes a bye.
- **`COMPETITION` / `CUSTOM` belt requirements** reuse the manual technique-log
  assessment (there's no automatic competition-results → requirement link).
- **`components/ui/` is empty** — shadcn/ui was planned but not adopted; components
  are hand-rolled in `src/components/`.

### Quick "definition of production-ready" checklist

- [ ] Real **auth → tenant mapping** (replace the three demo resolvers).
- [ ] **Authorize every `/api/*` route** (or bring `/api` under `proxy.ts`).
- [ ] **Club/User creation** on registration (persist to Postgres), or a seed script.
- [ ] Configure **Supabase SMS provider** (Twilio/etc.) for phone OTP.
- [ ] Real **WhatsApp** delivery in `notify.ts` (+ its env vars).
- [ ] Make the **Settings** page writable.
- [ ] Production **Stripe** keys + webhook endpoint + event subscriptions.
- [ ] Set all **env vars** in the host; run **`db:push`** against prod.
- [ ] Add **rate limiting** on public routes; pin **Node version**.

---

*Generated from a full review of the codebase at commit `9cea2f9` (Sprint 5).
The repo builds clean (`npm run build` → exit 0) with no environment configured.*
