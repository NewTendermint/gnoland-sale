# gnoland-sale

Frontend for the GNOT public token sale on Sonar.

## Stack

Next.js 15 (App Router), TypeScript, Tailwind v4, Biome.
Wagmi + RainbowKit for wallets, `@echoxyz/sonar-react` for the Sonar SDK.
Tests with Vitest (unit) and Playwright (e2e, chromium).

## Run locally

```
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

```
npm run dev          start dev server
npm run build        production build
npm run lint         Biome
npm run typecheck    tsc strict
npm run test         Vitest
npm run test:e2e     Playwright on localhost
```

## Layout

- `app/` Next.js App Router (pages, sections, route handlers)
- `content/sections.md` source copy for the page (edit here, not in components)
- `tests/` unit and e2e
- `scripts/` build helpers (bundle secret scan, asset pipeline)

## Environment

Copy `.env.example` to `.env.local` and fill the values you need locally.
Production secrets live in the deploy provider's env, never in the repo.

## Sale architecture

Bids, settlement and refunds happen in USDC on Base via Sonar's `SettlementSale` contract.
GNOT distribution itself is post-mainnet, handled by the gno.land to Base IBC bridge, not by this site.
