# Requirements from external teams

**Owner**: alexiscolin
**Status**: Active — needed to unblock implementation
**Date**: 2026-05-19

This document lists everything we need from **Sonar** and from the **gno.land marketing/legal team** to ship `sale.gno.land`. Items are tagged by **urgency** for the implementation timeline:

- 🔴 **Blocker** — implementation cannot proceed without this
- 🟠 **Pre-launch** — needed before mainnet go-live, but we can scaffold without it
- 🟡 **Launch-window** — nice for launch day but post-MVP acceptable

---

## A. From the Sonar team

### Technical (blocking implementation)

| # | Item | Why we need it | Tag |
|---|---|---|---|
| A1 | OAuth credentials: confirm PKCE-only public client OR confidential client + `client_secret`. Provide `clientUUID` for sandbox + prod | Determines our OAuth flow exactly | 🔴 |
| A2 | Redirect URIs to register in their Founder dashboard | OAuth callback must match exactly | 🔴 |
| A3 | Sandbox environment: URL + how to access ("test tenancy" mode) | E2E testing depends on this | 🔴 |
| A4 | Confirmation that sandbox runs on **Base Sepolia** (testnet) | Wagmi config + faucet flow | 🔴 |
| A5 | `saleUUID` for sandbox (provisioned now) + prod (provisioned later) | Hardcoded in contract calls, env-var-driven | 🔴 sandbox / 🟠 prod |
| A6 | `SettlementSale` contract address on Base Sepolia + Base mainnet | Contract calls via wagmi | 🔴 sandbox / 🟠 prod |
| A7 | ABI / TypeScript types for `SettlementSale.sol` (or pointer to `sonar-core` types) | Type-safe contract calls | 🔴 |
| A8 | `replaceBidWithPermit()` exact signature + permit struct layout (Solidity definition) | We pass permits to this function | 🔴 |
| A9 | Confirm whether EIP-2612 USDC permit signature is handled by `sonar-core` server-side, or whether the user must sign it client-side | Impacts UX (1 sig vs 2 sigs) | 🟠 |
| A10 | Test wallets for sandbox: how to fund with test USDC on Base Sepolia (faucet links) | E2E test setup | 🟠 |
| A11 | Webhook availability for sale events (commitments, settlement, sale closed). If yes: payload schema + HMAC signing secret | Real-time UI updates without polling | 🟡 (we can poll if unavailable) |
| A12 | Geographic restrictions: confirmed list of blocked jurisdictions for this sale | Display + UX messaging | 🟠 |
| A13 | OAuth consent screen branding specs: square logo + wide logo (dimensions, formats accepted) | We must provide assets | 🟠 |
| A14 | `SettlementSale` audit report PDF (Sonar's audited contract) | Linked in #4 Transparency section + due diligence | 🟠 |
| A15 | Support / escalation channel for go-live (Slack, email, phone for incidents) | Incident response | 🟠 |

### Operational

| # | Item | Why | Tag |
|---|---|---|---|
| A16 | Compliance contact at Sonar for KYC/KYB questions from our community | Pre-launch FAQ | 🟠 |
| A17 | Process for domain verification of our redirect URIs (production) | OAuth security | 🟠 |
| A18 | Expected timeline: when can sandbox be operational? When is prod deployed? | Project planning | 🔴 |
| A19 | Custom contract option: if we want sale-specific tweaks, what's the lead time? | Risk hedge | 🟡 |

---

## B. From the gno.land marketing / legal team

### Sale economics (blocking #3 Token Sale Details + #4 Transparency)

| # | Item | Why we need it | Tag |
|---|---|---|---|
| B1 | Token minimum price ($) | Auction starting price | 🔴 |
| B2 | Total raise target ($2M floor, max cap if any) | Sale config + UI display | 🔴 |
| B3 | Minimum commitment per entity ($) | Sonar config + UI floor | 🔴 |
| B4 | Maximum commitment per entity (whale cap, $) | Sonar config + UI ceiling | 🔴 |
| B5 | FDV target when raise is met ($) | Transparency / #3 display | 🟠 |
| B6 | Unlock schedule (cliff months + linear vest months OR custom curve) | Display + legal | 🟠 |
| B7 | Sale allocation (% of total token supply going to this sale) | Tokenomics pie + display | 🟠 |
| B8 | Sale contribution window: exact start datetime + end datetime + timezone | Countdown + sale config | 🔴 |
| B9 | Accepted payment currencies confirmed (USDC + USDT on Base?) | Wagmi config + UI tokens list | 🟠 |
| B10 | Auction format confirmed: Uniform Price Auction (English) + settlement strategy (Pro-rata? Iterative fill?) | Sale config | 🔴 |

### Legal documents (blocking #4 + #16)

| # | Item | Why | Tag |
|---|---|---|---|
| B11 | Terms of Service PDF (reviewed by Carolyn Pehrson) — final URL | Footer + click-through on Connect | 🟠 |
| B12 | Token Disclosure / Risk Disclosure PDF | #4 Transparency card | 🟠 |
| B13 | Privacy Policy PDF or URL | Footer | 🟠 |
| B14 | MiCA whitepaper final version PDF | Required for EU compliance | 🟠 |
| B15 | Restricted jurisdictions notice (final copy) | Display before Connect Wallet | 🟠 |

### Tokenomics & branding

| # | Item | Why | Tag |
|---|---|---|---|
| B16 | Final tokenomics breakdown for pie chart (allocations: sale %, team %, ecosystem %, treasury %, advisors %, public %) | #4 Transparency pie | 🟠 |
| B17 | Tokenomics pie chart asset (we can render from data, but if you have a designed version, share it) | Optional asset | 🟡 |

### Voxel illustrations (blocking hero + design)

| # | Item | Why | Tag |
|---|---|---|---|
| B18 | Hero voxel scene: `.vox` source + optional `.glb` export reference | WebGL hero (the showstopper) | 🔴 |
| B19 | #6 Open Knowledge Base companion illustration: `.jpeg` HD (≥2x display, ≥1920px wide) | Narrative section visual | 🟠 |
| B20 | #8 GNOT Utility flow illustration: `.vox` or `.jpeg` | Utility section visual | 🟠 |
| B21 | Pre-footer CTA full-width background: `.jpeg` panoramic (≥3840×1600px) | Conversion section | 🟠 |
| B22 | #11 Roadmap milestone markers (optional): `.jpeg` detached small assets, 1 per year if available | Decorative anchors | 🟡 |
| B23 | Reserve illustration (sticky bid panel emblem OR section transition): small voxel asset | Refinement | 🟡 |

**Asset guidelines** (please share with designer):
- `.vox` files keep editable source; we'll convert to Draco-compressed `.glb` at build time
- `.jpeg` HD: 2x display dimensions minimum, sRGB color space, quality 90+
- Color palette should harmonize with `#0a0e2a` deep navy base + `#00d4a8` mint accent
- If silhouettes/cut-outs are needed: provide PNG with alpha channel

### Team & Partners

| # | Item | Why | Tag |
|---|---|---|---|
| B24 | Core team list: name, role, photo (or voxel avatar), 1-2 line bio, socials (X, LinkedIn) | #10 Team section | 🟠 |
| B25 | Advisors list: same fields as above | #10 Team section | 🟠 |
| B26 | Partner logos in SVG (preferred) or transparent PNG: Samourai Coop, Berty, Onbloc, AtomOne | #14 Partners | 🟠 |
| B27 | Decision: keep #13 Investors section? If yes, provide logos + descriptions. If no, remove from spec | Section scope | 🟠 |

### Stats & ecosystem data

| # | Item | Why | Tag |
|---|---|---|---|
| B28 | Testnet13 data (if available): apps deployed, transactions, active addresses | #9 Stats section update | 🟡 |
| B29 | Ecosystem project list update (current xls covers 13 projects from newtendermint) | #12 Ecosystem section | 🟡 |
| B30 | Updated commit/PR/contributor counts (currently: 150+ contributors, 2400+ PRs, etc.) | #9 Stats freshness | 🟡 |

### Brand assets

| # | Item | Why | Tag |
|---|---|---|---|
| B31 | gno.land logo SVG (multiple variants if available: light/dark, monochrome/color) | Header + footer | 🔴 |
| B32 | OG image 1200×630px (or template we can populate) | Social sharing (Twitter, Discord, LinkedIn) | 🟠 |
| B33 | Favicon set (16, 32, 192, 512) — already on gno.land probably | Browser tab | 🟠 |
| B34 | Brand voice / tone guidelines (for #5 "How the Sale Works" copy we'll write) | Copy consistency | 🟡 |
| B35 | OAuth consent screen logos (square + wide) — see A13 for specs from Sonar | Sonar consent UI | 🟠 |

### Copy approval

| # | Item | Why | Tag |
|---|---|---|---|
| B36 | Review + approve our proposed 5-step copy for #5 "How the Sale Works" (in `content/sections.md` §5) | Copy lock | 🟠 |
| B37 | Review + approve disclaimers in #16 Footer (high-risk, jurisdiction notice, mainnet Q3 2026, etc.) | Legal sign-off | 🟠 |
| B38 | Review + approve all imported text from xls (sections #6, #7, #8, #11, #12, #14) once on the staging site | Final QA | 🟠 |

### Media (post-MVP)

| # | Item | Why | Tag |
|---|---|---|---|
| B39 | Press coverage links, podcast appearances, video features — as they appear | #15 Media section | 🟡 |

---

## C. From internal devops / infrastructure

| # | Item | Why | Tag |
|---|---|---|---|
| C1 | Subdomain `sale.gno.land` provisioned + DNS access (CNAME to Netlify) | Custom domain | 🔴 |
| C2 | Netlify team account access (or new project under gno.land org) | Hosting | 🔴 |
| C3 | GitHub repo `gnoland/ico` provisioned with branch protection on `main` | Source control + CI | 🔴 |
| C4 | Sentry project (free tier OK) + DSN for client + DSN for server | Error tracking | 🟠 |
| C5 | Simple Analytics account + tracking ID | Privacy-friendly analytics | 🟠 |
| C6 | 2FA enforced on all collaborator accounts (Netlify + GitHub) | Security baseline | 🔴 |
| C7 | CAA DNS record allowing Let's Encrypt + future HSTS preload submission | TLS hardening | 🟠 |

---

## Priority recap

**🔴 BLOCKERS** (need this week to start scaffolding properly):
- Sonar: A1, A2, A3, A4, A5 (sandbox), A6 (sandbox), A7, A8, A18
- Marketing: B1, B2, B3, B4, B8, B10, B18, B31
- Internal: C1, C2, C3, C6

**🟠 PRE-LAUNCH** (need before mainnet go-live):
- Sonar: A5 (prod), A6 (prod), A9, A10, A12, A13, A14, A15, A16, A17
- Marketing: B5–B7, B9, B11–B15, B16, B19–B21, B24–B26, B32, B33, B35–B38
- Internal: C4, C5, C7

**🟡 LAUNCH-WINDOW** (acceptable post-MVP):
- Sonar: A11, A19
- Marketing: B17, B22, B23, B27, B28–B30, B34, B39

### Internal hardening — deferred / withdrawn

Custom secretlint rules for ETH private keys, BIP-39 mnemonics, AWS keys, etc. were considered and explicitly **NOT scoped** for this project:

- Single-developer workflow → no external commit pressure
- Private repo → leak surface contained
- Recommend preset already catches GitHub tokens, npm tokens, JWTs, PEM keys (the relevant generic vectors)
- Project lifecycle is short (sale window ~3 weeks)

Discipline + `.gitignore` strict on `.env*` files is the chosen control. Revisit only if the team grows or repo becomes public.

---

## How to use this doc

1. **Send section A** to Sonar team contact (whoever signed the partnership). Ask for ETA on each blocker.
2. **Send section B** to your marketing + legal leads. Stagger by priority: 🔴 first, then 🟠 over the week.
3. **Section C** is internal — coordinate with whoever manages the gno.land infrastructure.
4. **Update this doc** as items come in. Strike through completed items. Track ETAs.
5. **Anything unanswered by EOW** → escalate to the project owner so we don't block the deadline.

---

*If anything in this list is unclear or unnecessary, flag it — better to remove a request than to over-burden the teams.*
