# gnoland-sale

Frontend for the GNOT public token sale (`sale.gno.land`), running on [Sonar by Echo](https://docs.echo.xyz/). Uniform-price (English) auction, USDC on Ethereum, KYC via Sonar OAuth.

One Next.js app serves every stage of the sale. Nothing is redeployed between stages: the page reads its phase from the sale clock (the 3 dates in `lib/sale/economics.ts`, with an optional env override) and renders the right surfaces (see "How the site works").

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind v4 · next-themes (light/dark) · Biome · wagmi v3 + viem (Ethereum mainnet / Sepolia only) with bespoke connectors (Coinbase Wallet SDK, WalletConnect, injected EIP-6963) · `@echoxyz/sonar-core` (server-only) · iron-session + libsodium · Drizzle on Netlify Database (GA managed Postgres) · GSAP + baked scene-slot videos · Vitest. Hosted on Netlify (Next.js Runtime + DB). No Sentry, no analytics.

## Run locally

```
npm install
npm run dev
```

Open http://localhost:3000. With no env set, development runs fully mocked (Sonar fixtures + Mailchimp mock + phase `live`), enough to work on every UI surface.

Two cases need real config (copy `.env.example` to `.env.local`):

- **A specific phase or real services**: set the relevant vars (see "Environment").
- **The Sonar OAuth / login flow (needs a database)**: run the app through the Netlify CLI instead of `npm run dev`. `netlify dev` starts a local Postgres, injects `NETLIFY_DB_URL`, and injects the secrets set on the linked site (`SONAR_*`, `ENCRYPTION_KEY`, `SESSION_PASSWORD`, `IP_HMAC_PEPPER`), so no `.env.local` is needed for those:

  ```
  netlify dev                        # Next + local DB + injected env, on the URL it prints (default :8888, not :3000)
  netlify database migrations apply  # once: local does not auto-apply migrations
  ```

  Without the CLI, set `NETLIFY_DB_URL` yourself in `.env.local`: a Neon URL works with the default adapter, a plain local Postgres also needs `NETLIFY_DB_DRIVER=server`. PKCE state lives in `pkce_states`, so the login flow throws at boot without a database. Mocked sale metrics and the newsletter do not need any of this.

## Scripts

```
npm run dev          start dev server (mocked, no DB, :3000)
npm run dev:db       start via Netlify CLI (local DB + injected env, :8888)
npm run build        production build (includes the client-bundle secret scan)
npm run lint         Biome
npm run typecheck    tsc strict
npm run test         Vitest unit suite
npm run db:generate  generate a Drizzle migration into netlify/database/migrations
npm run db:migrate   apply migrations locally to NETLIFY_DB_URL (deploy applies hosted DBs)
npm run db:studio    Drizzle Studio against NETLIFY_DB_URL
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

1. **`NEXT_PUBLIC_SALE_PHASE` env** (`pre-sale` | `live` | `ended`) - an operator OVERRIDE. Leave it UNSET in production so the phase follows the clock; set it only for staging, screenshots, or to force a phase during an incident.
2. **The sale clock** - the dates in `lib/sale/economics.ts` (`saleOpensIso`, `saleClosesIso`): `pre-sale` before it opens, `live` during the window, `ended` after it closes. This is the production default: set the 3 dates and the page serves the right version itself, no deploy. Resolved server-side (`app/page.tsx`, ISR ~30s) and re-resolved client-side every 60s so an open tab flips without a reload.
3. Dev default: `live`.

### The two pre-sale stages (automatic flip)

`pre-sale` covers two stages (`lib/sale/phase.ts` + dates in `lib/sale/economics.ts`):

- **Stage A - `registration-closed`** (before registration opens). The only asks are newsletter capture ("Get notified", our own form to Mailchimp double opt-in) and add-to-calendar. Countdown targets `registrationOpensIso`.
- **Stage B - `registration-open`** (registration opens to sale opens). "Register now" to Sonar OAuth KYC is the primary ask. A registered user parks on a "You're registered" state; pending / failed / not-eligible statuses surface in the bar and the How-to section. Countdown targets `saleOpensIso`.

The A to B flip is automatic: `SaleProvider` re-resolves the stage against the clock every 60s and on tab refocus. Milestone dates are env-overridable (`NEXT_PUBLIC_REGISTRATION_OPENS`, `NEXT_PUBLIC_SALE_OPENS`, `NEXT_PUBLIC_SALE_CLOSES`, ISO strings).

### Per-user journey (automatic)

Inside a phase, each visitor gets a derived funnel state (`lib/sale/journey.ts`, unit-tested): verify-first ordering, `Verify (Sonar KYC) -> Connect (wallet) -> Bid`. KYC status comes from the server-held Sonar session (entity polling), wallet status from wagmi, bid status from comparing the user's commitment to the clearing price (polled every 10s).

### Emergency pause

`SALE_PAUSED=true` (server env) is the kill switch: the bar shows a paused notice and the mutating API routes answer 503. Flip back to `false` to resume.

### Operator runbook

| When | What you do | What is automatic |
|---|---|---|
| Pre-sale launch | Confirm the 3 dates in `economics.ts` (or env), `NEXT_PUBLIC_NEWSLETTER_ENABLED=1`, Mailchimp creds. Do NOT set `NEXT_PUBLIC_SALE_PHASE` - the clock drives it. | Pre-sale renders; pre-sale -> live -> ended all flip by the dates |
| Registration opens | Nothing | Stage A -> B by clock, "Register now" appears |
| Sale opens | Nothing | Page flips to `live` by the clock (ISR ~30s) |
| Sale closes | Nothing | Page flips to `ended` by the clock - final clearing + results |
| Schedule moves | Update the 3 ISO dates in `economics.ts` (or the `NEXT_PUBLIC_*` env overrides); deploy | Phase + countdowns follow the new dates |
| Incident | `SALE_PAUSED=true`; optionally `NEXT_PUBLIC_SALE_PHASE` to force a phase | Bid routes 503; UI shows paused / the forced phase |

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
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Public Reown/WalletConnect id (has a built-in default) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push public key (same value as `VAPID_PUBLIC_KEY`) |

**Server-only (never `NEXT_PUBLIC`, scanned out of the client bundle in CI):**

| Var | Role |
|---|---|
| `SONAR_CLIENT_UUID` / `SONAR_SALE_UUID` / `SONAR_API_BASE_URL` / `SONAR_REDIRECT_URI` | Sonar OAuth (PKCE public client) + sale identity |
| `ENCRYPTION_KEY` | 32-byte hex, libsodium secretbox for OAuth tokens at rest |
| `SESSION_PASSWORD` | iron-session cookie sealing |
| `IP_HMAC_PEPPER` | 32-byte hex, irreversible IP hashing (audit + rate limit) |
| `NETLIFY_DB_URL` | Netlify Database (GA). Auto-injected on Netlify; the app reads it via the `drizzle-orm/netlify-db` adapter. Set it locally for `next dev` + `db:migrate`/`db:studio` (`DATABASE_URL` overrides it for drizzle-kit only) |
| `SALE_PAUSED` | `true` = kill switch |
| `SALE_CHAIN` | `mainnet` (prod) / `sepolia` (preview); drives the audit chain_id and chain branching |
| `MAILCHIMP_API_KEY` / `MAILCHIMP_AUDIENCE_ID` | Newsletter upstream (absent = dev mocks, prod fails closed) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push signing (outbid alerts) |
| `CRON_SECRET` | Bearer for the scheduled outbid-cron route |
| `SONAR_MOCK` / `MAILCHIMP_MOCK` | Dev-only: `1` serves local fixtures instead of the real APIs |

## Database and storage

The site uses **Netlify Database (GA)** in production - the managed Postgres built into Netlify, auto-provisioned by the `@netlify/database` dependency at deploy time. The app connects through the `drizzle-orm/netlify-db` adapter (no connection string in app code). Schema in `lib/db/schema.ts` (Drizzle):

- `oauth_tokens`: the libsodium-encrypted `{accessToken, refreshToken}` envelope per opaque session id. Plaintext tokens never touch the DB or the browser.
- `audit_log`: append-only trail of permit issuance and sensitive events. Wallets/entity ids in clear (already public on chain), IPs only as HMAC, metadata behind a strict allow-list.
- `pkce_states`: single-use OAuth state + code verifier, expiry checked on read.

Migrations live in `netlify/database/migrations/` and are applied automatically by the Netlify deploy (each deploy preview forks its own branch DB from production). Never run `drizzle-kit migrate`/`push` against a hosted Netlify DB - only against a local `NETLIFY_DB_URL`. The newsletter stores nothing here: emails go straight to Mailchimp.

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
| `/api/auth/sonar/callback` | GET | OAuth return: validates the state (session-bound, single-use), exchanges the code, stores tokens encrypted, redirects to `/?auth=ok\|error` |
| `/api/auth/sonar/logout` | POST | Destroys the session + deletes stored tokens (204) |
| `/api/newsletter` | POST | Newsletter capture to Mailchimp (double opt-in). Anti-enumeration uniform 202, honeypot, HMAC-keyed IP rate limit; the email is never logged or stored on our side |
| `/api/push/subscribe` | POST | Register a Web Push subscription for outbid alerts (no PII) |
| `/api/push/cron` | POST | Scheduled (Netlify) outbid-alert sweep, bearer `CRON_SECRET` |

The one on-chain write (submitting the signed bid with the permit) happens client-side via wagmi; `lib/sale/onchain.ts` is the seam. It runs against the deployed `SettlementSale` on the active sale chain (Sepolia wired; mainnet address TBD in `lib/sale/contracts.ts`). With no contract configured for the connected chain the bid is blocked, never emulated, so the funnel cannot reach success without a real transaction.

## Deploy and environments

Deploys are driven by **Netlify**, not GitHub Actions. There are no GitHub deployment environments to configure; the environment split is handled by Netlify deploy contexts (`netlify.toml`) plus context-scoped env in the Netlify dashboard.

| Git branch | Netlify context | Targets |
|---|---|---|
| `main` | production | `sale.gno.land`, Sonar prod, Ethereum mainnet |
| `staging` / other branches | branch-deploy | Sonar sandbox, Sepolia (per dashboard env) |
| Pull requests | deploy-preview | Sonar sandbox, Sepolia |

`NEXT_PUBLIC_STATE_OVERRIDES` (dev state-preview) is set only in the dashboard, scoped to branch + preview contexts, never production, and not committed.

CI (`.github/workflows/ci.yml`) runs on every PR and on push to `main`: Biome lint, secretlint source scan, typecheck, Vitest, build, client-bundle secret scan (`scripts/check-secrets.mjs`), and `npm audit --audit-level=high`. Protecting `main` with a required-CI rule is recommended before opening the repo.

## Before public launch

Tracked items that must be set when going live (most are config, not code):

- Attach the `sale.gno.land` domain and revert `NEXT_PUBLIC_SITE_URL` in the `netlify.toml` production context (currently a temporary Netlify subdomain).
- Wire the mainnet `SettlementSale` address in `lib/sale/contracts.ts`.
- Flip CSP from Report-Only to enforce in `middleware.ts` after wallet testing.
- Set the Reown/WalletConnect AllowList to `sale.gno.land`.
- Set `SALE_CHAIN=mainnet` on the production context, plus `SECRETS_SCAN_OMIT_KEYS=SALE_CHAIN` (the value `mainnet` trips Netlify's secret scanner otherwise).
- Provision the server-only secrets above on the production context.

## Development and review

- `SONAR_MOCK=1` (the default in dev with no creds): the whole Sonar surface runs on local fixtures (`lib/sonar/mock-*`), including a slowly climbing mock clearing price.
- `/dev/states`: every funnel state, collapsed + expanded, without a wallet or Sonar.
- URL overrides: `?phase=pre-sale|live|ended`, `?registration=open|closed`, `?journey=<state>` preview any combination on the real page.
- Both are gated by `stateOverridesEnabled()` (`lib/sale/overrides.ts`): always on in dev; in production builds only while `NEXT_PUBLIC_STATE_OVERRIDES=1` is set (dashboard, non-production contexts).

## Layout

- `app/` App Router: `(sections)` page sections, `(layout)` chrome (bar, provider, forms), `(ui)` primitives, `api/` route handlers, `dev/states` harness
- `content/sections/*.ts` section copy (edit here), `content/legal/*.ts` legal text
- `lib/` `sale/` (phase, journey, calc, economics, on-chain seam), `sonar/` (server client, OAuth, mocks), `newsletter/`, `push/`, `security/`, `db/`
- `tests/` Vitest unit suites; `scripts/` build guards (client-bundle secret scan, on-chain probe)

Design and architecture decision records live in `docs/` (internal, not committed); this README is the canonical doc for the shipped repo.

## Security invariants

- All Sonar API calls, OAuth tokens and secrets are server-side; the client gets derived JSON only.
- OAuth tokens encrypted at rest (libsodium envelope), sessions HttpOnly/Secure/Lax, PKCE state single-use and session-bound.
- CSP nonce-based via middleware (Report-Only pending enforcement); CI build fails if a server-only secret name appears in client output.
- No PII in logs: IPs HMAC-peppered, newsletter emails pass through without persistence.
