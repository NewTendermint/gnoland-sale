# gnoland-sale

Frontend for the GNOT public token sale (`sale.gno.land`), running on [Sonar by Echo](https://docs.echo.xyz/). Uniform-price (English) auction, USDC on Ethereum, KYC via Sonar OAuth.

One Next.js app serves every stage of the sale. Nothing is redeployed between stages: the page reads its phase from the sale clock (the 3 dates in `economics.ts`, with an optional env override), and renders the right surfaces (see "Sale phases" below).

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind v4 · next-themes (light/dark) · Biome · wagmi v2 + RainbowKit + viem (Ethereum mainnet / Sepolia only) · `@echoxyz/sonar-core` (server-only) + `sonar-react` · iron-session + libsodium · Drizzle on Netlify DB (Neon) · Netlify Blobs · Vitest + Playwright + MSW v2.

## Run locally

```
npm install
npm run dev
```

Open http://localhost:3000. Zero config needed: with no env set, development runs fully mocked (Sonar fixtures + Mailchimp mock + phase `live`). Copy `.env.example` to `.env.local` only when you need real services or a specific phase.

## Scripts

```
npm run dev          start dev server
npm run build        production build (includes the client-bundle secret scan)
npm run lint         Biome
npm run typecheck    tsc strict
npm run test         Vitest unit suite
npm run test:e2e     Playwright on localhost
npm run db:generate  generate a Drizzle migration from lib/db/schema.ts
npm run db:migrate   apply migrations to DATABASE_URL
npm run db:studio    Drizzle Studio against DATABASE_URL
```

## How the site works

### Sale phases (global)

Three phases drive every surface (`lib/sale/phase.ts`):

| Phase | The page shows |
|---|---|
| `pre-sale` | Countdown bar, newsletter or registration CTAs, no bid form |
| `live` | Live metrics (clearing, committed, bidders), the bid funnel |
| `ended` | Final clearing price, per-bidder settlement (allocation / refundable) + the USDC refund claim |

Resolution order (first match wins):

1. **`NEXT_PUBLIC_SALE_PHASE` env** (`pre-sale` | `live` | `ended`) - an operator OVERRIDE. Leave it UNSET in production so the phase follows the clock (below); set it only for staging, screenshots, or to force a phase during an incident.
2. **The sale clock** - the three dates in `lib/sale/economics.ts` (`saleOpensIso`, `saleClosesIso`): `pre-sale` before it opens, `live` during the window, `ended` after it closes. **This is the production default: set the 3 dates and the page serves the right version itself - no deploy, no manual flip.** Resolved server-side (`app/page.tsx`, ISR ~30s) so it renders directly, and re-resolved client-side every 60s so a visitor with the page open sees pre-sale -> live -> ended flip without a reload.
3. Dev default: `live`.

### The two pre-sale stages (automatic flip)

`pre-sale` covers two distinct stages (`lib/sale/phase.ts` + dates in `lib/sale/economics.ts`):

- **Stage A - `registration-closed`** (before registration opens). Sonar registration is NOT open yet. The only asks are **newsletter capture** ("Get notified", our own form -> Mailchimp double opt-in) and add-to-calendar. Countdown targets `registrationOpensIso`.
- **Stage B - `registration-open`** (registration opens -> sale opens). **"Register now" -> Sonar OAuth KYC** is the single primary ask (bar + How-to). The pre-footer keeps a secondary newsletter + calendar capture below its Register CTA, for visitors not ready to KYC yet. A registered user parks on a "You're registered" state; pending / failed / not-eligible verification statuses surface in the bar and the How-to section. Countdown targets `saleOpensIso`.

**The A -> B flip is fully automatic.** `SaleProvider` re-resolves the stage against the clock every 60s and on tab refocus, so visitors with the page already open see it flip without a reload, and no deploy is needed. The milestone dates are env-overridable (`NEXT_PUBLIC_REGISTRATION_OPENS`, `NEXT_PUBLIC_SALE_OPENS`, `NEXT_PUBLIC_SALE_CLOSES`, ISO strings) if the schedule moves.

### Per-user journey (automatic)

Inside a phase, each visitor gets a derived funnel state (`lib/sale/journey.ts`, unit-tested): verify-first ordering, `Verify (Sonar KYC) -> Connect (wallet) -> Bid`. KYC status comes from the server-held Sonar session (entity polling), wallet status from wagmi, bid status from comparing the user's commitment to the clearing price (polled every 10s). All automatic.

### Emergency pause

`SALE_PAUSED=true` (server env) is the kill switch: the bar shows a paused notice and the mutating API routes answer 503. Flip back to `false` to resume.

### Operator runbook

| When | What you do | What is automatic |
|---|---|---|
| Pre-sale launch | Confirm the 3 dates in `economics.ts` (or env), `NEXT_PUBLIC_NEWSLETTER_ENABLED=1`, Mailchimp creds; **delete the `NEXT_PUBLIC_STATE_OVERRIDES` block from `netlify.toml [build.environment]`** (hardening checklist M3 - the public page must not be flippable from a crafted `?phase=` link); deploy. Do NOT set `NEXT_PUBLIC_SALE_PHASE` - the clock drives it. | Pre-sale renders; pre-sale -> live -> ended all flip by the dates |
| Registration opens | Nothing | Stage A -> B by clock, "Register now" appears |
| Sale opens | Nothing | Page flips to `live` by the clock (ISR ~30s) - metrics + bid funnel |
| Sale closes | Nothing | Page flips to `ended` by the clock - final clearing + results |
| Schedule moves | Update the 3 ISO dates in `economics.ts` (or the `NEXT_PUBLIC_*` env overrides); deploy | Phase + countdowns follow the new dates |
| Incident | `SALE_PAUSED=true` (kill switch); optionally `NEXT_PUBLIC_SALE_PHASE` to force a phase | Bid routes 503; UI shows paused / the forced phase |
| Schedule slips | Update the `NEXT_PUBLIC_*` date envs | All countdowns, copy dates, stage flips follow |

Newsletter kill switch: unset `NEXT_PUBLIC_NEWSLETTER_ENABLED` and the capture UI disappears (surfaces fall back to a date line).

## Environment

Copy `.env.example` to `.env.local`. Production secrets live in Netlify env, never in the repo. The server env is validated at boot by `lib/env.ts` (fails fast, never echoes values).

**Public (inlined in the client bundle - flags only, never secrets):**

| Var | Role |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL (metadata, sitemap) |
| `NEXT_PUBLIC_SALE_PHASE` | Phase override (see runbook) |
| `NEXT_PUBLIC_REGISTRATION_OPENS` / `SALE_OPENS` / `SALE_CLOSES` | Milestone date overrides (ISO) |
| `NEXT_PUBLIC_NEWSLETTER_ENABLED` | `1` renders the newsletter capture (dev defaults on) |

**Server-only (never `NEXT_PUBLIC`, scanned out of the client bundle in CI):**

| Var | Role |
|---|---|
| `SONAR_CLIENT_UUID` / `SONAR_SALE_UUID` / `SONAR_API_BASE_URL` / `SONAR_REDIRECT_URI` | Sonar OAuth (PKCE public client) + sale identity |
| `ENCRYPTION_KEY` | 32-byte hex, libsodium secretbox for OAuth tokens at rest |
| `SESSION_PASSWORD` | iron-session cookie sealing |
| `IP_HMAC_PEPPER` | 32-byte hex, irreversible IP hashing (audit + rate limit) |
| `DATABASE_URL` | Netlify DB (Neon) connection string |
| `NETLIFY_BLOBS_TOKEN` | Blobs access (PKCE state store) |
| `SALE_PAUSED` | `true` = kill switch |
| `SALE_CHAIN` | `base` (prod) / `base-sepolia` (preview); drives audit chain_id |
| `MAILCHIMP_API_KEY` / `MAILCHIMP_AUDIENCE_ID` | Newsletter upstream (absent = dev mocks, prod fails closed with 502) |
| `SONAR_MOCK` / `MAILCHIMP_MOCK` | Dev-only: `1` serves local fixtures instead of the real APIs |

## Database and storage

The site needs **Netlify DB (Neon Postgres)** and **Netlify Blobs** in production:

- `oauth_tokens` (Postgres): the libsodium-encrypted `{accessToken, refreshToken}` envelope per opaque session id. Plaintext tokens never touch the DB or the browser.
- `audit_log` (Postgres): append-only trail of permit issuance and sensitive events. Wallets/entity ids in clear (already public on chain), IPs only as HMAC, metadata behind a strict allow-list.
- PKCE state (Blobs): single-use OAuth state + code verifier, expiry checked on read (Blobs does not auto-expire).

Schema lives in `lib/db/schema.ts` (Drizzle). New deploy target: run `npm run db:migrate` against its `DATABASE_URL` once (Netlify DB previews get their own branch DB). The newsletter stores NOTHING here: emails go straight to Mailchimp, which is the only data holder.

## API surface

Our routes only - the browser never talks to Sonar or Mailchimp directly:

| Route | Method | Purpose |
|---|---|---|
| `/api/sonar/commitments` | GET | Public auction metrics (clearing, committed, bidders), polled every 10s; carries the `paused` flag |
| `/api/sonar/entity` | GET | Session's KYC + eligibility snapshot (401/404 = not connected, a normal state) |
| `/api/sonar/my-position` | GET | Session's bid (price + committed) |
| `/api/sonar/pre-purchase` | POST | Sonar pre-purchase check for a wallet |
| `/api/sonar/generate-permit` | POST | Signed purchase permit (audited, server-side only) |
| `/api/auth/sonar/init` | POST | Start OAuth: mints PKCE state, returns the authorization URL |
| `/api/auth/sonar/callback` | GET | OAuth return: validates the state (session-bound, single-use), exchanges the code, stores tokens encrypted, redirects to `/?auth=ok\|error` (read + stripped by the UI, display-only) |
| `/api/auth/sonar/logout` | POST | Destroys the session + deletes stored tokens (204) |
| `/api/newsletter` | POST | Newsletter capture -> Mailchimp upsert (double opt-in). Anti-enumeration uniform 202, honeypot, HMAC-keyed IP rate limit; the email is never logged or stored on our side |

The one on-chain write (submitting the signed bid with the permit) happens client-side via wagmi; `lib/sale/onchain.ts` is the seam (emulated until `SettlementSale` is deployed - see the file header for the go-live steps).

## Development and review

- `SONAR_MOCK=1` (auto-behavior in dev with no creds): the whole Sonar surface runs on local fixtures (`lib/sonar/mock-*`), including a slowly climbing mock clearing price.
- `/dev/states`: every funnel state, collapsed + expanded, without a wallet or Sonar.
- URL overrides: `?phase=pre-sale|live|ended`, `?registration=open|closed`, `?journey=<state>` preview any combination on the real page.
- Both are gated by `stateOverridesEnabled()` (`lib/sale/overrides.ts`): always on in dev; on in production builds only while `netlify.toml` sets `NEXT_PUBLIC_STATE_OVERRIDES=1` (the staging URL is reviewable by the whole team). **That flag MUST be removed from `[build.environment]` before the public launch** - tracked as hardening checklist M3, also flagged in the runbook above.

## Layout

- `app/` App Router: `(sections)` page sections, `(layout)` chrome (bar, provider, forms), `(ui)` primitives, `api/` route handlers, `dev/states` harness
- `content/sections.md` canonical copy (edit here; `content/sections/*.ts` mirror it for the build)
- `lib/` `sale/` (phase, journey, calc, economics, on-chain seam), `sonar/` (server client, OAuth, mocks), `newsletter/`, `security/`, `db/`
- `docs/specs/` ADR + dated design docs (start with `2026-05-19-gnot-ico-landing-design.md`); `docs/REQUIREMENTS_FROM_TEAMS.md` tracks external blockers
- `tests/` unit + e2e; `scripts/` build guards (client-bundle secret scan)

## Security invariants (full model: ADR §4)

- All Sonar API calls, OAuth tokens and secrets are server-side; the client gets derived JSON only.
- OAuth tokens encrypted at rest (libsodium envelope), sessions HttpOnly/Secure/Lax, PKCE state single-use and session-bound.
- CSP nonce-based via middleware (Report-Only pending enforcement), CI build fails if a secret name appears in client output.
- No PII in logs: IPs HMAC-peppered, newsletter emails pass through without persistence.
