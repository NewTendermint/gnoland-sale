# GNOT ICO Landing - Project Instructions for Claude

This file is loaded at the start of each Claude Code session in this repo. It tells you what this project is, where the source of truth lives, and the conventions that **must** be respected.

---

## What this is

`sale.gno.land` - a Next.js 15 landing page for the **GNOT public token sale** on Sonar (Coinbase's token sale infrastructure). The sale uses a Uniform Price Auction (English) on **Base mainnet**, accepts USDC/USDT, targets **$2M+ raise**.

Built in 5 deployable layers: skeleton+UX → functionality → design tokens → voxel/illustrations → motion+polish.

---

## Read these FIRST (the canonical sources of truth)

When you start a session, read these in order. They override anything you think you remember from prior sessions:

1. **`docs/specs/2026-05-19-gnot-ico-landing-design.md`** - the ADR. Architecture, security model, design language, testing, deployment. If a decision is ambiguous, the ADR wins.
2. **`docs/plans/2026-05-19-gnot-ico-landing.md`** - the implementation plan, broken into 5 layers of tasks. Execute task-by-task; commit after each.
3. **`content/sections.md`** - the canonical copy for all 16 page sections, including TBDs and notes. Edit content here, not in components.
4. **`docs/REQUIREMENTS_FROM_TEAMS.md`** - pending asks to Sonar / marketing / infra teams. If you're blocked on missing input, check here first.

### Sonar external documentation (READ FIRST when touching Sonar/OAuth/permit/bid code)

Authoritative reference for the integration - verify SDK behavior and API surfaces against these before implementing:

- **Frontend-with-Backend pattern (our architecture)**: https://docs.echo.xyz/sonar/integration-guides/frontend-with-backend.md
- **OAuth + PKCE flow**: https://docs.echo.xyz/sonar/core-features/authentication.md
- **Purchase permits (signing, expiry, struct)**: https://docs.echo.xyz/sonar/core-features/purchase-permits.md
- **Entities (KYC verification objects)**: https://docs.echo.xyz/sonar/core-features/entities.md
- **SettlementSale contract (`replaceBidWithPermit`)**: https://docs.echo.xyz/sonar/reference/contracts/settlement-sale.md
- **Smart contract operations (frontend perspective)**: https://docs.echo.xyz/sonar/operations/smart-contract-operations.md
- **Reading commitment data (live clearing price)**: https://docs.echo.xyz/sonar/integration-guides/reading-commitment-data.md
- **SDK reference**: https://docs.echo.xyz/sonar/reference/sonar-core.md and https://docs.echo.xyz/sonar/reference/sonar-react.md
- **OpenAPI spec**: https://docs.echo.xyz/openapi/sonar.json
- **Complete index**: https://docs.echo.xyz/llms.txt

When Sonar SDK behavior contradicts the spec or plan, the SDK source (`node_modules/@echoxyz/sonar-core/dist/*.d.ts`) is authoritative. Update the spec if needed.

---

## Stack (locked in)

- **Framework**: Next.js 15 App Router (no Pages Router)
- **Language**: TypeScript strict
- **Styling**: Tailwind v4 + CSS variables in `styles/tokens.css`
- **Lint/format**: Biome (not ESLint, not Prettier)
- **Hosting**: Netlify with Next.js Runtime
- **DB**: Netlify DB (Neon-powered) + Drizzle ORM
- **KV**: Netlify Blobs (PKCE state, with check-on-read TTL - Blobs has no auto-expiry)
- **Auth**: Sonar OAuth 2.0 + PKCE (likely PKCE-only public client - no `client_secret`, verify on day 1)
- **Sale SDK**: `@echoxyz/sonar-react@0.14.0` (UI hooks, client) + `@echoxyz/sonar-core@0.15.0` (server)
- **Wallet**: wagmi v2 + RainbowKit + viem
- **Chain**: Base mainnet (prod), Base Sepolia (preview/sandbox) - **pinned**, do not add other chains
- **3D**: `@react-three/fiber` + `@react-three/drei` (escape to raw three.js only if R3F perf insufficient)
- **Animation**: `motion` (ex-Framer) + GSAP ScrollTrigger (only for Roadmap pin)
- **Smooth scroll**: Lenis
- **Tests**: Vitest (unit) + Playwright (E2E sandbox) + MSW v2 (mocks)
- **Errors**: Sentry with PII scrubber (mandatory)
- **Analytics**: Simple Analytics (privacy-friendly, cookieless)

---

## Non-negotiable conventions

### Security paranoia (mandatory, $2M+ at stake)

- **Server-side only** for: OAuth tokens, encryption keys, all Sonar API calls. Use `import "server-only"` at the top of those modules.
- **Client-side only** for: wallet connection (wagmi), submitting already-signed permit to the contract, UI.
- **CSP nonce-based** via Next.js middleware. No `unsafe-inline` for scripts.
- **OAuth tokens encrypted at rest** in Netlify DB (envelope encryption with libsodium, key in `ENCRYPTION_KEY` env var).
- **iron-session cookies**: HttpOnly + Secure + SameSite=Lax + max-age=2h rolling.
- **Audit log** every permit issuance (hashed entityID/wallet/IP - never raw PII).
- **Bundle scan in CI** rejects any `SONAR_*`, `ENCRYPTION_KEY`, `SESSION_PASSWORD`, `DATABASE_URL` strings in client output.
- **PII redaction in Sentry + logs**: wallets → `0x…`, UUIDs → `uuid:…`. Never log full permits.
- **2FA required** on Netlify + GitHub accounts (operational rule).
- **No deploys to prod on Friday after 14:00 or weekends** unless hotfix-critical.

### Build philosophy: layered, not big-bang

Implement strictly in this order:
1. **Layer 1** - Skeleton + UX (2-color, structure, navigation)
2. **Layer 2** - Functionality (Sonar + wallet + Server Actions, end-to-end)
3. **Layer 3** - Design tokens (palette, typo, glassmorph)
4. **Layer 4** - Voxel + illustrations (when designer delivers assets)
5. **Layer 5** - Motion + polish

Each layer must ship a working Netlify preview deploy. **Never skip ahead** - Layer 4 voxel before Layer 2 functionality means you can't test the end-to-end flow.

### Design

- **Dark theme only**. No light mode toggle. `prefers-color-scheme` ignored. `#0a0e2a` is the page background, period.
- **English only** (no i18n yet - sale is launched in EN).
- **Voxel dosage** = 3 levels (HERO, TEXTURE, ABSENT). See spec §6.1. Never decorative.
- **Effects justified, not decorative**. No mouse trails, no scroll-hijack except Roadmap, no audio.
- **Border-radius ≤ 8px** everywhere (voxel-modern feel, not soft 2018 marketing).

### Code

- **Edit existing files** rather than creating new ones. Especially `content/sections.md` for copy.
- **MD files for content**, not hardcoded strings in components (when feasible).
- **TDD where it makes sense** (utility functions, encryption, parsers). UI components are visually reviewed on preview deploys.
- **Commits**: one logical change per commit, conventional commit prefixes (`feat:`, `fix:`, `chore:`, `test:`, `design:`).
- **Co-author Claude**: every Claude-authored commit ends with `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

---

## Common commands

```bash
# Dev
npm run dev                     # Start Next dev server

# Quality
npm run lint                    # Biome lint
npm run typecheck               # TS strict
npm run test                    # Vitest unit
npm run test:watch              # Vitest watch
npm run test:e2e                # Playwright (preview URL or local)

# Build
npm run build                   # Next prod build
npm run build:assets            # Convert .vox → .glb (when applicable)

# DB
npm run db:generate             # Create migration from schema changes
npm run db:migrate              # Apply migrations
npm run db:studio               # Drizzle Studio
```

---

## Common pitfalls to avoid

1. **Don't add an `client_secret` to OAuth config** unless Sonar explicitly confirms confidential-client mode. Default is PKCE public client.
2. **Don't assume Netlify Blobs auto-expires entries** - check `metadata.expiresAt` on read and delete manually.
3. **Don't import `server-only` modules into Client Components** - the `server-only` package will fail the build by design, but be mindful when adding new dependencies.
4. **Don't bundle `@echoxyz/sonar-core` in the client** - it's server-only. `sonar-react` is the client-side companion.
5. **Don't unpin `sonar-react` / `sonar-core`** - they're semver <1.0, breaking changes possible. Pin exact versions.
6. **Don't add new wagmi chains** - Base mainnet (prod) and Base Sepolia (preview) only.
7. **Don't add Storybook** - use `/dev/states` route + MSW for component state previews.
8. **Don't hardcode copy** - edit `content/sections.md` and update the relevant component to read from it.
9. **Don't use `dangerouslySetInnerHTML`** anywhere. MDX/content parsing should produce React nodes, not raw HTML strings.
10. **Don't disable CSP for convenience** - fix the underlying issue (e.g., add the domain to `connect-src` whitelist).

---

## When in doubt

1. Read the spec (`docs/specs/2026-05-19-gnot-ico-landing-design.md`)
2. Check the plan (`docs/plans/2026-05-19-gnot-ico-landing.md`) for the relevant task
3. Check `content/sections.md` for copy
4. Check `docs/REQUIREMENTS_FROM_TEAMS.md` for external blockers
5. If still unclear → ask Alexis before making the call

---

## Important contacts (to fill in)

- **Sonar technical contact**: TBD
- **gno.land project owner**: alexiscolin
- **Legal counsel**: Carolyn Pehrson (per intro brief)
- **Incident on-call**: TBD

---

*Last updated: 2026-05-19 - End of brainstorming, start of implementation.*
