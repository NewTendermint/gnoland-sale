# GNOT Token Sale Landing — Design Document (ADR)

**Status**: Draft for review
**Date**: 2026-05-19
**Owner**: alexiscolin
**Repo**: `gnoland/ico`
**Target launch**: Late May – Early June 2026 (sale window)
**Goal**: $2,000,000 minimum raise via Sonar Uniform Price Auction

---

## 1. Context

Gno.land plans a public token sale on **Sonar** (Coinbase) as part of fundraising. The sale uses a **Uniform Price Auction** (English Auction) on **Base** (EVM), accepting USDC/USDT. Sonar provides KYC/KYB (~100k pre-verified users), compliance, signed permits, and the on-chain `SettlementSale` contract.

We build the **frontend experience** at `sale.gno.land` (subdomain TBD): a marketing landing page that converts visitors into bidders, with the bid widget embedded inline and following the user as a sticky panel during scroll.

**Non-negotiable constraints**:
- Security paranoia on token/wallet flows ($2M+ at stake)
- Awwwards-level polish without "degen" excess
- Smooth UI/UX (60fps target, sub-2.5s LCP)
- Testable on Sonar sandbox + Base Sepolia before go-live
- Iterable: copy in MD files for sessions to come
- Deadline: end of week (this ADR week)
- Goal-driven: every design decision serves the $2M conversion target

**Reference designs**:
- newtendermint.org (clean, focused, hero impact — same visual DNA)
- sale.fluent.xyz (split layout, sticky bid panel)
- monad.xyz (overall site polish)
- Plasma announcement (information density treatment)

---

## 2. Decision (one-liner)

Build `sale.gno.land` as a **Next.js 15 (App Router) site on Netlify**, integrating Sonar via the **Frontend-with-Backend pattern** (officially recommended), with a **split-layout hero (60/40)** featuring a **WebGL voxel scene** and an **embedded-then-sticky bid panel**, scoped to **English Auction on Base**, with strict **CSP/HSTS/rate-limit** hardening and **MSW + Sonar sandbox** testing.

### 2.1 Build philosophy: layered design (UX-first, visual-last)

**Implementation order is layered, not big-bang**:

1. **Layer 1 — Skeleton + UX**: Structure semantique, layout, navigation, interactions clavier/souris. **2 couleurs max** (bg + foreground), espacement et typographie de base. Tout interactif fonctionne, rien n'est "joli".
2. **Layer 2 — Functionality**: Sonar OAuth, wallet connect, bid flow, Server Actions, DB, security headers. End-to-end testable sur sandbox.
3. **Layer 3 — Design tokens**: Palette complète injectée (mint, blue, amber, red, glassmorph), typographie finalisée, dark backgrounds finaux.
4. **Layer 4 — Voxel + illustrations**: Hero WebGL scene + illustrations sections (au fur et à mesure que les assets arrivent du designer).
5. **Layer 5 — Motion + polish**: Lenis, fade-ups, magnetic cursor, counter-up, scroll-pin roadmap, parallax.

**Why this order**:
- Skeleton tôt = UX validable avant d'investir dans le visuel
- Functionality avant design = on connaît les vrais états (loading, error, etc.) avant de styler
- Design en couches = on n'attend pas le designer pour commencer, et on absorbe ses livraisons sans refactor
- Motion en dernier = les animations enrobent ce qui marche déjà, jamais l'inverse

**Practical rule for the implementation plan**: chaque phase doit produire une version **déployable et testable** sur preview Netlify. Pas de gros chunks de 3 jours sans démo possible.

---

## 3. Architecture

### High-level diagram

```
                  ┌─────────────────────────────────┐
                  │  Netlify                        │
                  │                                 │
                  │  ┌──────────────────────────┐   │
                  │  │ Next.js 15 (App Router)  │   │
Browser ─────────►│  │ - SSG/RSC marketing      │   │
                  │  │ - Client islands (hero,  │   │
                  │  │   bid widget)            │   │
                  │  │ - Server Actions /api/*  │   │
                  │  └──────────────────────────┘   │
                  │              │                  │
                  │   ┌──────────┼──────────┐       │
                  │   ▼          ▼          ▼       │
                  │ Edge      Netlify    Netlify    │
                  │ Rate Lim  Blobs      DB         │
                  │ (10/min)  (PKCE TTL) (tokens)   │
                  └─────────────────────────────────┘
                              │
                  ┌───────────┴────────────┐
                  ▼                        ▼
            Sonar API                 Base mainnet
            api.echo.xyz              SettlementSale contract
            (server-side only)        (wagmi from browser)
```

### Stack technique (final)

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 App Router | RSC + Server Actions = secrets isolés serveur par design |
| Hosting | Netlify (Next.js Runtime) | Cohérence infra gno.land, branch DBs auto, Edge rate limit natif |
| Auth | OAuth 2.0 + PKCE (Sonar Echo) | Pattern officiel Sonar |
| Session | `iron-session` cookie chiffré | HttpOnly + Secure + SameSite=Lax |
| DB | Netlify DB (Neon-powered, GA depuis avril 2026) + Drizzle ORM | Per-PR branch DB = test sandbox sans config |
| KV | Netlify Blobs | PKCE store avec TTL natif |
| Rate limit | Netlify Edge Rate Limiting (`netlify.toml`) | 0 dep, déclaratif |
| Sale SDK | `@echoxyz/sonar-react` (UI) + `@echoxyz/sonar-core` (server) | Officiel Sonar |
| Wallet | wagmi v2 + RainbowKit | Standard EVM, audité |
| Chain | Base mainnet (prod) / Base Sepolia (preview) | Pinned dans wagmi config |
| Data fetch | TanStack Query | Polling clearing price, dédup auto |
| 3D | `@react-three/fiber` + `@react-three/drei` (escape hatch raw three.js) | Mature R3F, R3F simplifie le DX |
| Animation | `motion` (ex-Framer) + GSAP ScrollTrigger (roadmap pin only) | Standard awwwards |
| Smooth scroll | Lenis | Inertia pro, accessibility-friendly |
| Styling | Tailwind v4 + CSS variables | Design tokens centralisés |
| Content | MD/MDX + `gray-matter`, source `content/sections.md` | Edit hors-code, iterations rapides |
| Mocks | MSW v2 | Intercept Server Actions en dev |
| Tests | Vitest (unit) + Playwright (E2E sandbox) | Couvre flow bid complet |
| Lint | Biome | 1 outil, plus rapide |
| Errors | Sentry (free tier) | Seul service externe |
| Analytics | Simple Analytics (script tag, cookieless) | Privacy-friendly, requirement utilisateur |

---

## 4. Security model (paranoia integrated)

### 4.1 Threat model

| Threat | Vector | Mitigation |
|---|---|---|
| OAuth `codeVerifier` leak | Stored insecurely | Netlify Blobs server-only, deleted on use, check-on-read expiration |
| Access token theft | XSS, browser storage | Tokens **never** sent to browser, stored encrypted (envelope encryption) in Netlify DB |
| CSRF on OAuth callback | Forged callback | PKCE `state` validation, session-bound, single-use |
| Replay attack on permit (chain) | Reuse captured permit on-chain | Sonar permits expire in 10 min, single-use, time-bound, contract-enforced |
| Replay attack on permit (app) | Request duplicate permit for same intent | Server-level dedup: refuse `generatePurchasePermit` for same `(wallet, amount)` within 5s |
| Forge of permit | Off-chain manipulation | ECDSA signature verified **on-chain** by audited `SettlementSale` contract |
| Race condition on token refresh | Concurrent refresh | Promise coalescing per-session-id |
| Bid on wrong chain | Wallet on Ethereum mainnet | wagmi pinned `chains: [base]` (prod) only, explicit "Switch to Base" UI gate before bid |
| Insufficient balance / expired permit (silent failure) | User signs failing tx | `useSimulateContract` (wagmi) pre-flight before signature → catch errors before wallet pop |
| Clickjacking bid widget | Embed in malicious iframe | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` |
| XSS → session steal | Reflected/stored XSS | CSP nonce-based via Next.js middleware, no `dangerouslySetInnerHTML`, sanitize MDX |
| Smart contract bug | Sonar contract vulnerability | Use Sonar's audited contract as-is, no fork |
| KYC PII leak | Storing user PII | We **never** receive/store PII; Sonar handles everything |
| PII leak in logs / Sentry | Errors capture wallet/entityID | Sentry `beforeSend` scrubber, structured logs with redaction (wallet→hash, no full permits) |
| DDoS | Volumetric attacks | Netlify Edge protection + Edge rate limit |
| Phishing OAuth login | Lookalike domain | Verify redirect URI in Sonar dashboard, exact match only |
| Public RPC rate-limit / outage | Free Base RPC degraded | Dedicated provider (Alchemy/QuickNode) with private API key + fallback endpoint |
| Webhook spoofing (if used) | Forged Sonar webhook | HMAC signature verification on `/api/sonar/webhook` |

### 4.2 What stays server-side (never exposed)

**Note on OAuth credentials**: Sonar uses PKCE with `clientUUID` (public identifier, not a secret). There is **no `client_secret`** for PKCE public clients — the security guarantee comes from PKCE `codeVerifier` + per-user access tokens. We confirmed this by reading Sonar docs; the only identifier referenced is `clientUUID`. ⚠️ If Sonar later issues a secret for confidential clients, treat it like access tokens (server-only, encrypted).

Server-only items:
- `accessToken` / `refreshToken` per user (encrypted at-rest via envelope encryption)
- Encryption master key (`ENCRYPTION_KEY`, 32-byte random, env var only)
- `codeVerifier` (PKCE, in Netlify Blobs with `expiresAt` metadata, deleted post-exchange)
- All Sonar API calls: `listAvailableEntities`, `prePurchaseCheck`, `generatePurchasePermit`
- Token refresh logic + promise coalescing
- Audit log writes
- RPC provider API key (Alchemy/QuickNode for Base)
- Sentry DSN (server-side; client uses public DSN with PII scrubbing)
- Webhook HMAC secret (if Sonar offers webhooks)

### 4.3 What lives client-side (legitimate)

- Wallet connect (wagmi/RainbowKit) — user's wallet, not a secret
- Submission of **already-signed** permit to `SettlementSale.commit()` via wagmi `writeContract`
- UI state, animations, public clearing price (poll via TanStack Query against our own `/api/sonar/commitments` proxy)

### 4.4 OAuth + Permit + Bid flow (exact)

**Important**: Sonar's recommended single-tx flow uses `replaceBidWithPermit()` on the `SettlementSale` contract. This combines purchase-permit submission and bid placement in one user signature (no separate `approve` step required). We use this as the primary path.

```
1. User clicks "Connect with Sonar"
   ├─> POST /api/auth/sonar/init (Server Action)
   │   ├─ Generate PKCE: { state, codeVerifier, codeChallenge }
   │   ├─ Set Netlify Blobs: key=state, value={ sessionId, codeVerifier },
   │   │   metadata.expiresAt = now + 10 min
   │   └─ Return Sonar authorization URL
   └─> Browser redirects to Sonar

2. User authenticates at Sonar → callback /oauth/callback?code=X&state=Y
   ├─> Server: getWithMetadata(state)
   │     ├─ If missing OR metadata.expiresAt < now → 400 + delete (defense in depth)
   │     └─ Else: extract codeVerifier, IMMEDIATELY delete entry from Blobs (single-use)
   ├─> exchangeAuthorizationCode(code, codeVerifier)
   ├─> Encrypt { accessToken, refreshToken } via envelope encryption
   │   (master key in env ENCRYPTION_KEY, libsodium secretbox per-row)
   ├─> Persist encrypted blob + expiresAt in Netlify DB (oauth_tokens table)
   ├─> Set iron-session cookie: HttpOnly, Secure, SameSite=Lax, max-age=2h, rolling
   └─> Redirect to hero

3. User clicks "Place a bid" (after wallet connected + on Base chain)
   ├─> POST /api/sonar/pre-purchase (Server Action)
   │   ├─ Retrieve+decrypt tokens for sessionId
   │   ├─ Refresh if expiresAt - now < 5min (promise coalescing per sessionId)
   │   ├─ Call sonar-core: prePurchaseCheck({saleUUID, entityID, wallet})
   │   └─ If ReadyToPurchase=false → return FailureReason for UI
   ├─> POST /api/sonar/generate-permit
   │   ├─ Call sonar-core: generatePurchasePermit({saleUUID, entityID, wallet, amount})
   │   ├─ Audit log: INSERT (entityID, walletHash, amount, ipHash, timestamp)
   │   └─ Return permit struct + signature to browser
   └─> Browser receives permit (10 min lifetime, single-use)

4. Browser: pre-flight simulation, then submission
   ├─> useSimulateContract({
   │      address: SETTLEMENT_SALE,
   │      abi: SettlementSaleAbi,
   │      functionName: 'replaceBidWithPermit',
   │      args: [permit, signature, paymentToken, amount, ...]
   │    })
   │   ├─ If revert detected → show specific error UI, no wallet pop
   │   └─ If OK → enable "Sign in wallet" button
   ├─> useWriteContract: replaceBidWithPermit(...)
   │   ├─ User signs tx in wallet (1 signature, 1 tx)
   │   └─ Tx submitted to Base mainnet
   ├─> Contract on Base verifies:
   │   ├─ ECDSA signature against PURCHASE_PERMIT_SIGNER_ROLE
   │   ├─ permit.expiresAt > block.timestamp
   │   ├─ permit.wallet == msg.sender
   │   ├─ permit.saleUUID matches deployed sale
   │   └─ Time within [opensAt, closesAt)
   └─> Commitment recorded on-chain, event emitted

5. UI updates via:
   ├─ Wagmi useWatchContractEvent: BidPlaced event → optimistic update
   └─ TanStack Query refetch: GET /api/sonar/commitments (proxied) for clearing price
```

**Increase bid later**: same `replaceBidWithPermit()` flow with a higher amount. Sonar enforces "amounts can only go up, never down" at the contract level.

**Cancel / reduce / refund**: separate contract methods (`cancelBid`, `reduceCommitment`, `claimRefund`) — wired in UI as secondary actions where enabled by sale config.

**Pre-flight wallet gates** (block bid CTA until all satisfied):
- Wallet connected (wagmi `isConnected`)
- Chain is Base (`useChainId() === base.id`) — if not, show "Switch to Base" CTA
- User has sufficient USDC/USDT balance (read via wagmi `useBalance`)
- KYC complete (Sonar entity check)
- Sale is in `Active` stage (`stage()` read from contract)

### 4.5 Hardening checklist (must-do before launch)

- [ ] `next build` + grep-based scanner for `process.env.SONAR_*` / `process.env.*_SECRET` / `ENCRYPTION_KEY` in `.next/static/**` (CI gate)
- [ ] `server-only` and `client-only` packages enforce boundaries (build fails on violation)
- [ ] CSP nonce-based via Next.js middleware (`headers()` + `<Script nonce>`)
- [ ] CSP `connect-src` whitelist: self, api.echo.xyz, configured Base RPC endpoint(s), WalletConnect relays
- [ ] HSTS preload (`max-age=63072000; includeSubDomains; preload`)
- [ ] `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=()` (all disabled)
- [ ] Edge rate limit: `/api/sonar/*` → 10 req/min/IP, `/api/auth/sonar/init` → 3/min/IP
- [ ] Audit log table in DB: every permit issuance (entityID, walletHash, amount, ipHash, timestamp)
- [ ] Envelope encryption for OAuth tokens: master key in env `ENCRYPTION_KEY`, libsodium `secretbox` per-row
- [ ] iron-session config: HttpOnly + Secure + SameSite=Lax + max-age=2h + rolling refresh
- [ ] Netlify Blobs check-on-read pattern for PKCE state (verify `metadata.expiresAt`, delete on expiry)
- [ ] Sentry `beforeSend` PII scrubber: redact wallet addresses, entity IDs, permit hashes
- [ ] Structured logs with PII redaction (wallet → short hash, never full permits)
- [ ] 2FA required on Netlify + GitHub for all collaborators
- [ ] 1 owner / multiple collaborators (least privilege)
- [ ] Pre-commit secretlint (Husky + lint-staged)
- [ ] CODEOWNERS for `lib/sonar/*` and `lib/security/*` (requires explicit review)
- [ ] OWASP ZAP scan before mainnet launch
- [ ] `npm audit --audit-level=high` + Snyk in CI
- [ ] Dependabot enabled
- [ ] Bundle analyzer (`@next/bundle-analyzer`) in CI with size budgets (initial <250KB, post-wallet <500KB)
- [ ] Lighthouse CI: Perf >90, A11y >95, LCP <2.5s, TBT <200ms (PR gate)
- [ ] `sonar-react` and `sonar-core` pinned to exact versions (semver <1.0, breaking changes possible)
- [ ] Kill switch: env var `SALE_PAUSED=true` disables widget in 1 redeploy (<30s)
- [ ] Runbook (`docs/RUNBOOK.md`): incident procedures, kill switch, contacts
- [ ] No deploys on Friday after 14:00 or weekend (sale-critical operational rule)

### 4.6 Logging & observability hygiene

- **Sentry config**: client + server with separate DSNs (client DSN can be public, but PII scrubbing mandatory)
- **`beforeSend` hook**: regex-strip wallet addresses (`/0x[a-fA-F0-9]{40}/g` → `0x…`), entity UUIDs, permit signatures
- **Don't log**: full permits, raw OAuth codes, codeVerifier, access tokens (ever, anywhere)
- **Do log**: anonymized correlation IDs, response times, status codes, redacted permit IDs (first 8 chars)
- **Alert thresholds**: error rate >1% over 5min, OAuth callback failure rate >5%, p95 API latency >1s
- **Audit log retention**: 90 days minimum (regulatory), then archive (S3 cold or Netlify DB archive table)

---

## 5. Content structure

Site is a single-page scroll with anchored sections. Full copy is maintained in `content/sections.md` (canonical source).

**Section order** (validated):

| # | Section | Status |
|---|---|---|
| 1 | Header (sticky, glassmorph) | ✅ |
| Hero | GNOT Token Sale + voxel WebGL + embedded bid panel | ✅ design |
| 2 | Sale Metrics (live data) | ✅ |
| 5 | How the Sale Works (5 steps) | ⚠️ copy TBD |
| 3 | Token Sale Details (key/value table) | ⚠️ values TBD |
| 4 | Transparency (tokenomics + legal + audit) | ⚠️ assets TBD |
| 6 | Open Knowledge Base (narrative + illustration) | ✅ |
| 7 | Built for Developers (5 features) | ✅ |
| 8 | GNOT Utility (4 use cases + voxel flow) | ✅ |
| 9 | Ecosystem in numbers (animated counter) | ✅ |
| 11 | Roadmap (horizontal scroll-pin) | ✅ |
| 12 | Ecosystem (13 projects grid) | ✅ |
| 10 | Team & Advisors | ⚠️ list TBD |
| 13 | Investors (optional, may drop) | ⚠️ TBD |
| 14 | Partners (4 entries) | ✅ |
| 15 | Media (press, videos) | ⚠️ post-launch |
| CTA | Pre-footer "Join the sale" (full-bleed voxel) | ✅ design |
| 16 | Footer (legal, socials) | 🟡 partial |

### Content-to-MDX pipeline

```
content/sections.md (canonical, edited by anyone)
        │
        ▼  (build-time)
content/parsed/*.mdx (one MDX file per section, generated)
        │
        ▼
React components in app/(sections)/*.tsx import their MDX
```

This lets non-devs edit `sections.md` without touching code. A CI job validates schema on commit.

---

## 6. Visual design

**Theme constraint**: **Dark background only**. No light mode toggle, no `prefers-color-scheme: light` override, no theme switcher in UI. All design tokens, illustrations, voxel scene lighting, and component states are designed exclusively for a dark UI on `#0a0e2a` deep navy. This is a final decision — light mode is explicit out-of-scope (§13).

### 6.1 Voxel dosage (3 levels)

| Level | Where | Treatment |
|---|---|---|
| 🟢 Voxel HERO (rare, justified) | Hero (WebGL), #6 Open Knowledge Base, #8 GNOT Utility, Pre-footer CTA | Full or near-full presence, narrative |
| 🟡 Voxel TEXTURE (subtle, omnipresent) | BG noise grain 3%, section dividers (voxel-staircase clip-path), icon set (pixel grid), button corners (radius 2px) | Background DNA, not the subject |
| 🔴 Voxel ABSENT (data clarity) | #2 Sale Metrics, #3 Details, #4 Transparency cards, #9 Stats, #10 Team, #11 Roadmap markers, #13/#14 logos, #16 Footer | Pure typography + data |

### 6.2 Illustration allocation (5-6 voxel assets to be delivered)

| # | Placement | Mode | Format | Effect |
|---|---|---|---|---|
| 1 | Hero | Full-page WebGL | `.vox` → `.glb` Draco | Orbit caméra ~30s, parallax curseur ±5°, bloom, fog |
| 2 | #6 Open Knowledge Base | Half-page companion | `.jpeg` | Reveal au scroll, parallax 3D simulé CSS |
| 3 | #8 GNOT Utility | Centered medium | `.vox` → `.glb` OR `.jpeg` | Auto-rotation OR hover-tilt |
| 4 | #11 Roadmap milestones | Small per-year | `.jpeg` détourés | Activation au scroll-pin |
| 5 | Pre-footer CTA | Full-width background | `.jpeg` panoramique | Fixed parallax léger, dark overlay |
| 6 (reserve) | Sticky bid panel OR transition #7→#8 | Small emblem | `.jpeg` ou icon | Subtle |

### 6.3 Hero composition (split 60/40)

- **LEFT (~60%)** : WebGL voxel scene
  - Renderer R3F, `WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })`
  - `devicePixelRatio` capped 1.5
  - Camera `PerspectiveCamera` 35° FOV, pos `[4, 3, 5]`
  - Lighting: directional warm 4500K + ambient cool 5500K + emissive on lanterns/windows
  - Fog: `FogExp2` density 0.08
  - Post: `UnrealBloomPass` only (threshold 0.9, strength 0.6)
  - Orbit: 30s loop, delta-based
  - Parallax curseur: lerp 0.05, ±5° max
  - Right edge: gradient mask fading to bg → fusion with right column

- **RIGHT (~40%)** : Content + bid panel
  - Badge `● LIVE · ENGLISH AUCTION` (mint)
  - Headline `GNOT Public Token Sale` (88px desktop)
  - Subhead (1-2 lines, opacity 0.7)
  - Bid panel embedded (360×480), glassmorph backdrop-blur 20px
  - Live metrics: clearing price, committed, filled %, bidders, countdown
  - CTA primary `Place a bid` (mint, magnetic cursor)
  - Secondary: `View docs · FAQ`

### 6.4 Bid panel — 3 states

| State | Trigger | Visual |
|---|---|---|
| Hero embedded | Initial (scrollY < heroH - 100) | 360×480, full metrics + CTA |
| Sticky compact | Scrolling body | Fixed right 24px, 280×320, clearing px + countdown + CTA |
| Mobile bottom-bar | `< 768px width` | Bottom-fixed, h:80, clearing px gauche + CTA droite, tap → modal |

Detach transition: 400ms `ease-out-quart`, transform + opacity only (no layout shift).

### 6.5 Performance budget (Hero)

| Metric | Budget | Strategy |
|---|---|---|
| Bundle WebGL chunk | < 300KB gzipped | Lazy `next/dynamic({ssr: false})`, tree-shake R3F |
| `.glb` asset | < 500KB | Draco compression at build |
| LCP | < 2.5s on 3G simulated | Text + panel render BEFORE canvas hydrates |
| INP | < 100ms | WebGL never blocks main thread |
| FPS target | 60fps; <30fps → fallback poster | Monitor `renderer.info.memory` |
| GPU memory | < 100MB | — |

### 6.6 Fallback strategy (paranoia, mirror of security)

- No JS / SSR initial → static JPEG poster (Next/Image AVIF)
- `prefers-reduced-motion: reduce` → poster, no orbit, no parallax
- WebGL2 unsupported → poster
- `navigator.deviceMemory < 4` → poster
- Mobile portrait < 600px → simplified scene (no bloom, no fog) or poster

The text and bid panel are **never** dependent on canvas success. Canvas crash = visual loss only, CTA preserved.

---

## 7. Effects (scroll, motion)

| Effect | Where | Implementation |
|---|---|---|
| Lenis smooth scroll | Global page | `lerp: 0.1`, off under reduced-motion |
| Fade-up reveal | All `.animate-on-scroll` (text, cards) | IntersectionObserver, 500ms ease-out-quart, 1-shot |
| Custom cursor | Desktop only | Dot + ring, magnetic on CTAs, label states |
| Magnetic cursor | CTAs only (`Place a bid`, `Connect`, `View docs`) | translate(distX*0.3, distY*0.3), 300ms |
| Sticky bid detach | Past hero | position fixed, 400ms transition |
| Hero parallax | Voxel canvas | R3F useFrame lerp ±5° |
| Live ticker pulse | Clearing price change | Scale 1→1.05→1, color flash 400ms (mint up / red down) |
| Counter-up | #9 stats | 1.5s ease-out, tabular-nums |
| Horizontal scroll-pin | #11 Roadmap | GSAP ScrollTrigger, 3 viewports pinned, mobile = native horizontal |
| Section dividers | Between sections | Voxel-staircase clip-path SVG, no animation |
| Scroll progress bar | Top viewport, 2px | scaleX, gradient mint→blue |

### Accessibility (mandatory)

`prefers-reduced-motion: reduce` disables: Lenis, fade-ups, cursor effects, hero orbit/parallax, counter-up, roadmap pin. Sale must remain fully completable with zero motion.

### Performance discipline

- All animations use `transform` + `opacity` only (GPU composited)
- `will-change` set manually before animation, removed after
- `passive: true` on all scroll listeners
- `requestAnimationFrame` throttle on scroll-driven effects
- GSAP ScrollTrigger only on Roadmap page chunk (separate bundle)

---

## 8. Design tokens

See `app/styles/tokens.css` (CSS variables consumed by Tailwind v4 theme). Summary:

- **Palette**: dark-first (#0a0e2a base), white text, mint accent (#00d4a8) for gno signature, amber/red for warning/danger
- **Typography**: Geist Sans Variable (display + body), Geist Mono (data), modular scale 12→120px, tracking tight on display
- **Spacing**: 4px base, scale to 160px
- **Radius**: 2-8px max (voxel feel, no soft 2018 marketing)
- **Motion**: 150/300/500/800/1500ms durations, ease-out-quart default
- **Breakpoints**: 640/768/1024/1280/1536px (mobile-first)
- **Z-index**: named scale (sticky 100, header 200, modal 9200, cursor 9000)
- **Glassmorph**: `backdrop-filter: blur(20px) saturate(180%)` + fallback bg

Full token spec in `content/design-tokens.md` (to be generated alongside ADR).

---

## 9. Testing strategy

### 9.1 Three layers

| Layer | Tool | Purpose | Speed |
|---|---|---|---|
| Unit | Vitest | Pure functions, utilities, content parsers | Fast (<1s suite) |
| Integration | Vitest + React Testing Library + MSW | Component behavior with mocked Sonar API | Medium |
| E2E | Playwright | Full bid flow against Sonar sandbox + Base Sepolia | Slow (CI only) |

### 9.2 MSW for dev (no real Sonar calls during UI iteration)

- Intercept fetch + Server Actions in dev
- Fixtures cover all states: pre-sale, live, oversubscribed, sale ended, user not connected, user connected no KYC, user KYC done, bid placed, refund pending, error states

### 9.3 `/dev/states` route (poor-man Storybook)

A `/dev/states` Next.js route renders all widget states side-by-side. Visible only in dev/preview, blocked in production via env check.

### 9.4 Sonar sandbox

Per-PR Netlify deploy preview connects to:
- Sonar Echo sandbox (`api.sandbox.echo.xyz` — verify exact URL)
- Base Sepolia testnet (`https://sepolia.base.org`)
- Per-PR Netlify DB branch (isolated)

Real flow: connect → KYC sandbox → bid → tx on Sepolia → commitment recorded.

### 9.5 Pre-launch checklist (signed by 2 humans)

In `docs/PRE_LAUNCH_CHECKLIST.md`:

- [ ] OWASP ZAP scan passed
- [ ] `npm audit --audit-level=high` clean
- [ ] Snyk no high-severity
- [ ] CSP passes csp-evaluator.withgoogle.com (no `unsafe-*`)
- [ ] Lighthouse: Perf > 90, A11y > 95, Best Practices 100, SEO > 90
- [ ] Manual penetration test of OAuth flow (intercept state, replay code, etc.)
- [ ] Full bid flow tested on sandbox by 2 different humans, 2 different wallets
- [ ] Kill switch verified (`SALE_PAUSED=true` → widget disabled in <30s)
- [ ] DNS + HTTPS cert validated (HSTS preload)
- [ ] Runbook reviewed, on-call contacts confirmed
- [ ] Sentry alerts wired (error rate, OAuth failures)
- [ ] Simple Analytics dashboard accessible
- [ ] Sonar production keys provisioned, scoped correctly
- [ ] Base mainnet RPC endpoint validated (private or fallback set)
- [ ] Mobile flow tested on iOS Safari + Android Chrome (real devices)
- [ ] All TBDs in `content/sections.md` resolved or accepted

---

## 10. Deployment

### 10.1 Environments (Netlify deploy contexts)

| Context | Trigger | Sonar env | Chain | DB |
|---|---|---|---|---|
| `production` | Push to `main` | Sonar prod | Base mainnet | Netlify DB main branch |
| `deploy-preview` | PR opened | Sonar sandbox | Base Sepolia | Netlify DB PR branch (auto) |
| `branch-deploy` | Push to non-`main` branch | Sonar sandbox | Base Sepolia | Netlify DB branch |

Env var scoping isolates production credentials from previews **by Netlify construction**.

### 10.2 CI pipeline (GitHub Actions)

```yaml
on: [pull_request, push]
jobs:
  validate:
    steps:
      - biome lint
      - biome typecheck
      - vitest run
      - next build (asserts no SECRET in client bundle)
      - secretlint
      - npm audit
      - lighthouse-ci (perf budget)
  e2e:
    needs: validate
    if: github.event_name == 'pull_request'
    steps:
      - wait for Netlify preview deploy
      - playwright test --base-url=$NETLIFY_PREVIEW_URL
```

Branch protection on `main`: requires `validate` + `e2e` green + 1 approval.

### 10.3 Cost estimate

| Service | Tier | Monthly cost (sale period) |
|---|---|---|
| Netlify Pro | $19/mo | $19 |
| Netlify DB | included | $0 |
| Netlify Blobs | included | $0 |
| Sentry | Free (5k events) | $0 |
| Simple Analytics | Basic | $9 |
| Domain | sale.gno.land subdomain | $0 (uses gno.land DNS) |
| **Total** | | **~$28/mo** |

Negligible vs $2M+ raise.

---

## 11. Process safeguards (anti-human-error)

- Pre-commit hooks: secretlint, biome lint, biome typecheck (Husky + lint-staged)
- CI gates: see §10.2 above
- Branch protection on `main`
- CODEOWNERS for `lib/sonar/*`, `lib/security/*`
- `server-only` / `client-only` packages enforced (build fails on violation)
- 2FA required on Netlify + GitHub
- 1 owner / collaborators (least privilege)
- Deploy windows: no prod release Fri after 14:00 or weekends (sale-critical)
- `docs/RUNBOOK.md`: incident procedures
- `docs/PRE_LAUNCH_CHECKLIST.md`: 2-human signoff before mainnet
- `docs/INCIDENT_LOG.md`: rolling log for post-mortems
- Dependabot + Snyk
- `.env*` in `.gitignore`, `.env.example` documents required vars

---

## 12. Open questions / TBDs (to resolve before implementation)

Already tracked in `content/sections.md` TBD summary, plus:

### Verifications needed with Sonar team (blocking)
- [ ] OAuth credentials: confirm PKCE-only public client (no `client_secret`), or confidential client with secret
- [ ] Sandbox identifier: confirm Base Sepolia is the testnet target
- [ ] `replaceBidWithPermit()` exact ABI signature + Solidity struct layout for permit (need contract source or types from `sonar-core`)
- [ ] EIP-2612 USDC permit signing: handled by sonar-core server-side, or client must sign? (impacts UX)
- [ ] Whether Sonar provides webhooks for sale lifecycle events (commitment, sale closed, etc.) — if yes, HMAC verification
- [ ] OAuth consent screen branding requirements (square + wide logo specs)
- [ ] Geographic restrictions: confirmed list of blocked jurisdictions for this sale
- [ ] `saleUUID` provisioning timeline (when does Sonar give us the prod UUID?)
- [ ] `SettlementSale` contract address on Base mainnet + sandbox

### Verifications needed internally (non-blocking)
- [ ] Final subdomain: `sale.gno.land` confirmed?
- [ ] `sonar-react@0.14.0` compatibility with Next.js 15 App Router (RSC vs Client Components) — verify on day 1 of scaffolding
- [ ] Drizzle migrations strategy with per-branch Netlify DB (auto-run on deploy?)
- [ ] Final voxel asset count + format split (`.vox` vs `.jpeg`) from designer
- [ ] MiCA whitepaper URL (legal team)
- [ ] Privacy policy URL (legal team)
- [ ] Audit firm + audit PDF (Sonar provides)
- [ ] Bug bounty program: opt-in via Immunefi or self-managed?
- [ ] Base RPC endpoint: start with public `https://mainnet.base.org`, upgrade to Alchemy/QuickNode if rate-limited under load (decision deferrable to post-MVP)

---

## 13. Out of scope (explicit)

- Light theme (dark-only for this sale)
- Multi-language (EN only)
- Investor relations dashboard
- Post-sale claim / vesting UI (handled separately by Liquifi per Sonar partnership)
- Native mobile app
- Token transfers / DEX integration (mainnet launch is Q3 2026, transferability after)
- Storybook (replaced by `/dev/states` route)
- Standalone backend service (Next.js Server Actions sufficient)

---

## 14. Status

| Phase | State |
|---|---|
| Brainstorming | ✅ Complete |
| ADR drafted | ✅ This document |
| ADR reviewed by user | ⏳ Pending |
| Implementation plan | ⏳ Pending (writing-plans skill next) |
| Scaffolding | ⏳ Pending |
| Implementation | ⏳ Pending |
| Pre-launch checklist | ⏳ Pending |
| Mainnet launch | ⏳ Late May / Early June 2026 |

---

## 15. References

- Sonar overview: `Sonar Sales Overview (2).pdf` (provided)
- Sonar API docs: https://docs.echo.xyz/
- Frontend-with-backend (CRITICAL): https://docs.echo.xyz/sonar/integration-guides/frontend-with-backend.md
- Purchase permits: https://docs.echo.xyz/sonar/core-features/purchase-permits.md
- OAuth: https://docs.echo.xyz/sonar/core-features/authentication.md
- Content source: `content/sections.md`
- Design reference: https://newtendermint.org and `newtendermint/themes/design-a/static/js/`
- Sale references: https://sale.fluent.xyz, https://www.plasma.to/insights/announcing-the-xpl-public-sale-using-sonar-by-echo, https://www.monad.xyz
- Netlify DB GA: https://www.netlify.com/blog/netlify-database/

---

*Draft v1 — 2026-05-19 — Awaiting user review before implementation plan.*
