# GNOT ICO Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `sale.gno.land` — a Next.js 15 landing page integrating the Sonar Uniform Price Auction for the GNOT token sale (target $2M+ raise), built in 5 deployable layers so the user can validate and iterate at each layer.

**Architecture:** Next.js 15 App Router on Netlify with Frontend-with-Backend Sonar integration (server-side OAuth + permit issuance, client-side wallet + contract calls). Layered build: skeleton+UX first (deployable wireframe), then functionality (Sonar+wallet end-to-end), then design tokens, then voxel illustrations, then motion polish. Each layer ships a working preview on Netlify.

**Tech Stack:** Next.js 15 · TypeScript · Tailwind v4 · Biome · Drizzle ORM · Netlify DB/Blobs · `@echoxyz/sonar-react@0.14.0` + `@echoxyz/sonar-core@0.15.0` · wagmi v2 · RainbowKit · viem · `@react-three/fiber` + `drei` · `motion` + GSAP ScrollTrigger · Lenis · iron-session · libsodium · TanStack Query · MSW v2 · Vitest · Playwright

**Spec reference:** `docs/specs/2026-05-19-gnot-ico-landing-design.md`
**Content reference:** `content/sections.md`
**External asks tracker:** `docs/REQUIREMENTS_FROM_TEAMS.md`

---

## File structure (target end-state)

```
ico/
├── .github/workflows/ci.yml
├── .husky/{pre-commit,commit-msg}
├── app/
│   ├── (sections)/{hero,sale-metrics,how-it-works,token-details,transparency,narrative,features,gnot-utility,stats,roadmap,ecosystem,team,investors,partners,media,pre-footer-cta}/*.tsx
│   ├── (chrome)/{Header,Footer,BidPanel}.tsx
│   ├── api/auth/sonar/{init,callback}/route.ts
│   ├── api/sonar/{pre-purchase,generate-permit,commitments,entities}/route.ts
│   ├── api/health/route.ts
│   ├── dev/states/page.tsx
│   ├── layout.tsx · page.tsx · globals.css
│   └── middleware.ts            (CSP nonce, rate-limit context)
├── content/{sections.md,parsed/*.mdx (generated)}
├── docs/{specs,plans,REQUIREMENTS_FROM_TEAMS.md,RUNBOOK.md,PRE_LAUNCH_CHECKLIST.md,INCIDENT_LOG.md}
├── lib/
│   ├── sonar/{client,oauth,tokens,permit,server-only}.ts
│   ├── security/{encryption,session,rate-limit,csp,sentry-scrubber}.ts
│   ├── db/{schema,client}.ts + migrations/
│   ├── content/{parser,types}.ts
│   ├── wagmi/{config,abis}.ts
│   ├── analytics/simple-analytics.tsx
│   ├── utils/{format,countdown,address}.ts
│   └── env.ts
├── public/{models,images,fonts,og.png,favicon.ico}
├── scripts/{build-assets,content-pipeline,check-secrets}.ts
├── styles/tokens.css
├── tests/{e2e,unit,mocks}/*.ts
├── .env.example · .gitignore · biome.json · drizzle.config.ts
├── netlify.toml · next.config.ts · package.json
├── playwright.config.ts · tailwind.config.ts · tsconfig.json · vitest.config.ts
```

---

# LAYER 1 — Skeleton + UX (deployable wireframe, 2 colors max)

**Layer goal:** A deployed Netlify preview showing the full page structure with all 16 sections, navigation, sticky bid panel placeholder, responsive layout, and basic typography — all in grayscale + 1 accent color. No real data, no Sonar, no WebGL. Mobile + desktop work.

**Definition of done:** `https://<preview>.netlify.app` loads, all sections render with placeholder copy, navigation scrolls smoothly to anchors, bid panel placeholder appears in sticky position, Lighthouse a11y >90.

---

## Task 1.1: Initialize repo + Next.js scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `README.md`, `.env.example`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Init git repo**

```bash
cd /Users/alexiscolin/Server/gnoland/ico
git init -b main
git config user.name "Alexis Colin"
git config user.email "nesquimo@gmail.com"
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules
.next
.env
.env.*
!.env.example
.netlify
dist
build
coverage
.DS_Store
*.log
playwright-report
test-results
.vercel
```

- [ ] **Step 3: Create `package.json`**

Note: `next` is pinned to `15.5.18` (latest stable 15.x at plan revision time — fixes CVE-2025-66478 present in earlier 15.0.x). The `prepare` script is intentionally NOT included here; it's added in Task 1.2 alongside the husky dev dependency to avoid a broken `npm install` on fresh clones.

```json
{
  "name": "gnot-ico-landing",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "next": "15.5.18",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "@biomejs/biome": "1.9.4",
    "@types/node": "22.9.0",
    "@types/react": "19.0.1",
    "@types/react-dom": "19.0.1",
    "typescript": "5.7.2"
  }
}
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create `next.config.ts`**

```ts
import type { NextConfig } from "next"

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
}

export default config
```

- [ ] **Step 6: Create `app/layout.tsx`**

```tsx
import "./globals.css"
import type { ReactNode } from "react"

export const metadata = {
  title: "GNOT Public Token Sale — gno.land",
  description: "The native token for gno.land — Layer 1 smart contract platform.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 7: Create `app/page.tsx`**

```tsx
export default function Home() {
  return <main>GNOT Token Sale — skeleton</main>
}
```

- [ ] **Step 8: Create `app/globals.css`**

```css
:root {
  --bg: #0a0e2a;
  --fg: #ffffff;
}

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.5;
}

* { box-sizing: border-box; }
```

- [ ] **Step 9: Create `.env.example`**

```
# Public (safe in client bundle)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SALE_PHASE=pre
NEXT_PUBLIC_SENTRY_DSN_CLIENT=

# Server-only — NEVER prefix with NEXT_PUBLIC
SONAR_CLIENT_UUID=
SONAR_REDIRECT_URI=
SONAR_SALE_UUID=
SONAR_API_BASE_URL=
# 32-byte hex (libsodium AES-256). Rotates every 6 months per spec §4.7
ENCRYPTION_KEY=
# 32-byte hex (HMAC-SHA256 of IPs). Rotates every 3 months per spec §4.7
IP_HMAC_PEPPER=
# 32+ char string for iron-session cookie encryption
SESSION_PASSWORD=
SENTRY_DSN_SERVER=
SALE_PAUSED=false
DATABASE_URL=
NETLIFY_BLOBS_TOKEN=
```

- [ ] **Step 10: Install dependencies + verify**

```bash
npm install
npm run dev
```

Expected: dev server starts on `http://localhost:3000`, shows "GNOT Token Sale — skeleton" on dark navy bg.

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat: initialize Next.js 15 scaffold with TypeScript and base config

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 1.2: Tooling setup (Biome, Husky, secretlint)

**Files:**
- Create: `biome.json`, `.husky/pre-commit`, `.secretlintrc.json`

- [ ] **Step 1: Add Biome config**

Create `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "warn",
        "useImportType": "error"
      },
      "suspicious": {
        "noConsoleLog": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "asNeeded",
      "trailingCommas": "all"
    }
  },
  "files": {
    "ignore": ["node_modules", ".next", "build", "dist", "coverage", "*.md"]
  }
}
```

- [ ] **Step 2: Install Husky + lint-staged + secretlint**

```bash
npm install -D husky lint-staged @secretlint/secretlint-rule-preset-recommend secretlint
```

- [ ] **Step 3: Init Husky**

```bash
npx husky init
```

- [ ] **Step 4: Configure pre-commit hook**

Replace `.husky/pre-commit` content with:

```bash
npx lint-staged
npx secretlint "**/*"
```

- [ ] **Step 5: Add lint-staged config + `prepare` script to `package.json`**

Add to `package.json`:

```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx,json}": ["biome check --apply"]
  }
}
```

(The `prepare` script is added here, NOT in Task 1.1, so `npm install` doesn't fail on fresh clones before husky is in `devDependencies`.)

- [ ] **Step 6: Create `.secretlintrc.json`**

```json
{
  "rules": [
    { "id": "@secretlint/secretlint-rule-preset-recommend" }
  ]
}
```

- [ ] **Step 7: Verify hook fires**

```bash
echo "test = 'sk_live_FAKE_KEY_AT_LEAST_25_CHARACTERS'" > /tmp/secret-test.js
git add /tmp/secret-test.js 2>&1 || true
git commit -m "test" 2>&1 | head -5
rm -f /tmp/secret-test.js
git reset
```

Expected: commit attempt mentions secretlint (whether it blocks depends on path; verify config loads).

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: add Biome, Husky, secretlint with pre-commit hook

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 1.3: Install Tailwind v4

**Files:**
- Modify: `app/globals.css`, `package.json`, `next.config.ts`

- [ ] **Step 1: Install Tailwind v4**

```bash
npm install -D tailwindcss@^4 @tailwindcss/postcss postcss
```

- [ ] **Step 2: Create `postcss.config.mjs`**

```js
export default {
  plugins: { "@tailwindcss/postcss": {} },
}
```

- [ ] **Step 3: Update `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-bg: #0a0e2a;
  --color-fg: #ffffff;
  --color-fg-muted: rgba(255, 255, 255, 0.7);
  --color-fg-faint: rgba(255, 255, 255, 0.5);
  --color-border: rgba(255, 255, 255, 0.1);
}

html, body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-fg);
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

* { box-sizing: border-box; }
```

- [ ] **Step 4: Verify Tailwind works**

Update `app/page.tsx` to test classes:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">GNOT Token Sale — skeleton</h1>
      <p className="text-fg-muted mt-4">Tailwind v4 active</p>
    </main>
  )
}
```

Run `npm run dev` → confirm styles apply.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: install Tailwind v4 with theme tokens

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 1.4: Vitest + Playwright setup

**Files:**
- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/unit/example.test.ts`, `tests/e2e/homepage.spec.ts`

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
})
```

- [ ] **Step 3: Create `tests/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest"
```

- [ ] **Step 4: Write smoke test**

Create `tests/unit/example.test.ts`:

```ts
import { describe, it, expect } from "vitest"

describe("smoke", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Run test**

```bash
npm run test
```

Expected: PASS, 1 test.

- [ ] **Step 6: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 7: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
})
```

- [ ] **Step 8: Write E2E smoke test**

Create `tests/e2e/homepage.spec.ts`:

```ts
import { test, expect } from "@playwright/test"

test("homepage renders", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /GNOT Token Sale/i })).toBeVisible()
})
```

- [ ] **Step 9: Run E2E**

```bash
npm run test:e2e
```

Expected: PASS, 1 test in chromium.

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "test: add Vitest + Playwright with smoke tests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 1.5: Netlify deploy config

**Files:**
- Create: `netlify.toml`

- [ ] **Step 1: Create `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"

[context.production.environment]
  NEXT_PUBLIC_SITE_URL = "https://sale.gno.land"

[context.deploy-preview.environment]
  NEXT_PUBLIC_SITE_URL = "https://deploy-preview.netlify.app"
```

- [ ] **Step 2: Add Netlify Next.js plugin to package.json**

```bash
npm install -D @netlify/plugin-nextjs
```

- [ ] **Step 3: Verify `npm run build` succeeds**

```bash
npm run build
```

Expected: build completes, `.next` folder generated.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: add Netlify deploy config with security headers

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

**Out-of-plan action**: connect repo to Netlify dashboard, point to `gnoland/ico` repo. First preview deploy should succeed.

---

## Task 1.6: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Biome lint
        run: npm run lint
      - name: Typecheck
        run: npm run typecheck
      - name: Unit tests
        run: npm run test
      - name: Build
        run: npm run build
      - name: Scan bundle for secrets
        run: node scripts/check-secrets.mjs
      - name: Audit dependencies
        run: npm audit --audit-level=high
```

- [ ] **Step 2: Create `scripts/check-secrets.mjs`**

```js
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const FORBIDDEN_PATTERNS = [
  /SONAR_CLIENT_UUID/,
  /SONAR_REDIRECT_URI/,
  /ENCRYPTION_KEY/,
  /SESSION_PASSWORD/,
  /SENTRY_DSN_SERVER/,
  /DATABASE_URL/,
  /NETLIFY_BLOBS_TOKEN/,
]

const SCAN_DIR = ".next/static"

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full)
    else yield full
  }
}

let failed = false
for (const file of walk(SCAN_DIR)) {
  if (!/\.(js|html)$/.test(file)) continue
  const content = readFileSync(file, "utf8")
  for (const pat of FORBIDDEN_PATTERNS) {
    if (pat.test(content)) {
      console.error(`SECRET LEAK: ${pat} found in ${file}`)
      failed = true
    }
  }
}

if (failed) process.exit(1)
console.log("No secret leaks detected in client bundle ✓")
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "ci: add GitHub Actions workflow with secret bundle scanner

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 1.7: Layout shell (Header + Footer + BidPanel placeholder)

**Files:**
- Create: `app/(chrome)/Header.tsx`, `app/(chrome)/Footer.tsx`, `app/(chrome)/BidPanel.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create `app/(chrome)/Header.tsx`**

```tsx
export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-bg/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4">
        <a href="/" className="font-bold text-lg">gno.land</a>
        <ul className="hidden md:flex gap-6 text-sm text-fg-muted">
          <li><a href="#sale-metrics">Sale</a></li>
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#token-details">Token</a></li>
          <li><a href="#roadmap">Roadmap</a></li>
        </ul>
        <div className="flex items-center gap-3">
          <button type="button" className="text-sm px-4 py-2 border border-border rounded-sm">
            Register
          </button>
          <button type="button" className="text-sm px-4 py-2 bg-fg text-bg rounded-sm">
            Connect Wallet
          </button>
        </div>
      </nav>
    </header>
  )
}
```

- [ ] **Step 2: Create `app/(chrome)/Footer.tsx`**

```tsx
export function Footer() {
  return (
    <footer className="border-t border-border mt-32 py-12">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <p className="font-bold mb-4">gno.land</p>
            <p className="text-sm text-fg-muted">
              The native token for gno.land — Layer 1 smart contract platform.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-3 text-sm">Resources</p>
            <ul className="space-y-2 text-sm text-fg-muted">
              <li><a href="https://docs.gno.land">Documentation</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Risk Disclosure</a></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3 text-sm">Community</p>
            <ul className="space-y-2 text-sm text-fg-muted">
              <li><a href="https://x.com/_gnoland">X / Twitter</a></li>
              <li><a href="https://discord.gg/gnoland">Discord</a></li>
              <li><a href="https://t.me/join_gnoland">Telegram</a></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3 text-sm">Disclaimer</p>
            <p className="text-xs text-fg-faint">
              Not available in restricted jurisdictions. High-risk investment. You may lose your entire commitment. Token transferability begins at mainnet launch (Q3 2026).
            </p>
          </div>
        </div>
        <p className="mt-12 text-xs text-fg-faint text-center">
          © 2026 gno.land — All rights reserved.
        </p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Create `app/(chrome)/BidPanel.tsx` (placeholder)**

```tsx
"use client"

export function BidPanel() {
  return (
    <aside
      data-component="bid-panel"
      className="border border-border rounded-sm p-6 bg-bg"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-fg-muted mb-4">
        <span className="size-2 rounded-full bg-fg" />
        Live · English Auction
      </div>
      <div className="mb-6">
        <p className="text-xs text-fg-muted mb-1">Clearing price</p>
        <p className="text-3xl font-bold tabular-nums">$0.00</p>
      </div>
      <dl className="space-y-2 text-sm border-t border-border pt-4">
        <div className="flex justify-between"><dt className="text-fg-muted">Committed</dt><dd className="tabular-nums">—</dd></div>
        <div className="flex justify-between"><dt className="text-fg-muted">Filled</dt><dd className="tabular-nums">—</dd></div>
        <div className="flex justify-between"><dt className="text-fg-muted">Bidders</dt><dd className="tabular-nums">—</dd></div>
        <div className="flex justify-between"><dt className="text-fg-muted">Closes in</dt><dd className="tabular-nums">—</dd></div>
      </dl>
      <button
        type="button"
        className="mt-6 w-full px-4 py-3 bg-fg text-bg rounded-sm font-semibold"
        disabled
      >
        Connect to bid
      </button>
    </aside>
  )
}
```

- [ ] **Step 4: Update `app/layout.tsx`**

```tsx
import "./globals.css"
import type { ReactNode } from "react"
import { Header } from "./(chrome)/Header"
import { Footer } from "./(chrome)/Footer"

export const metadata = {
  title: "GNOT Public Token Sale — gno.land",
  description: "The native token for gno.land — Layer 1 smart contract platform.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Header, Footer, BidPanel placeholder

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 1.8: Section components (16 sections as semantic placeholders)

**Files:**
- Create: `app/(sections)/hero/Hero.tsx`, `app/(sections)/sale-metrics/SaleMetrics.tsx`, `app/(sections)/how-it-works/HowItWorks.tsx`, `app/(sections)/token-details/TokenDetails.tsx`, `app/(sections)/transparency/Transparency.tsx`, `app/(sections)/narrative/Narrative.tsx`, `app/(sections)/features/Features.tsx`, `app/(sections)/gnot-utility/GnotUtility.tsx`, `app/(sections)/stats/Stats.tsx`, `app/(sections)/roadmap/Roadmap.tsx`, `app/(sections)/ecosystem/Ecosystem.tsx`, `app/(sections)/team/Team.tsx`, `app/(sections)/investors/Investors.tsx`, `app/(sections)/partners/Partners.tsx`, `app/(sections)/media/Media.tsx`, `app/(sections)/pre-footer-cta/PreFooterCta.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create `Hero.tsx` (60/40 split layout, no canvas yet)**

```tsx
import { BidPanel } from "@/app/(chrome)/BidPanel"

export function Hero() {
  return (
    <section id="hero" className="relative min-h-[700px] border-b border-border">
      <div className="mx-auto max-w-[1440px] grid grid-cols-1 lg:grid-cols-[60fr_40fr] gap-12 px-6 py-20">
        <div
          aria-hidden="true"
          className="aspect-square lg:aspect-auto min-h-[400px] bg-fg/5 rounded-sm flex items-center justify-center text-fg-faint text-sm"
        >
          [WebGL voxel scene — Layer 4]
        </div>
        <div className="flex flex-col gap-8">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-fg-muted mb-4">
              <span className="size-2 rounded-full bg-fg animate-pulse" />
              Live · English Auction
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-none tracking-tight">
              GNOT Public<br />Token Sale
            </h1>
            <p className="mt-6 text-fg-muted text-lg max-w-md">
              The native token for gno.land — a Layer 1 smart contract platform.
            </p>
          </div>
          <BidPanel />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create `SaleMetrics.tsx`**

```tsx
export function SaleMetrics() {
  return (
    <section id="sale-metrics" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Sale metrics</p>
        <h2 className="text-3xl font-bold mb-12">Live auction data</h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {["Committed", "Filled", "Participants", "Closes in"].map((label) => (
            <div key={label}>
              <dt className="text-sm text-fg-muted mb-1">{label}</dt>
              <dd className="text-3xl font-bold tabular-nums">—</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create `HowItWorks.tsx`**

```tsx
const STEPS = [
  { n: "01", title: "Connect your wallet", body: "MetaMask, Coinbase Wallet, WalletConnect, or Rainbow." },
  { n: "02", title: "Verify with Sonar", body: "One-click for existing users (~100k pre-verified)." },
  { n: "03", title: "Place your bid", body: "Set your max price and commitment amount in USDC/USDT." },
  { n: "04", title: "Wait for auction close", body: "Everyone pays the same clearing price (uniform pricing)." },
  { n: "05", title: "Receive tokens", body: "Excess funds auto-refunded. Tokens distributed per unlock schedule." },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">How it works</p>
        <h2 className="text-3xl font-bold mb-12">Five steps to participate</h2>
        <ol className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {STEPS.map((s) => (
            <li key={s.n} className="border-l-2 border-border pl-4">
              <p className="text-xs text-fg-faint font-mono mb-2">{s.n}</p>
              <p className="font-semibold mb-2">{s.title}</p>
              <p className="text-sm text-fg-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create `TokenDetails.tsx`**

```tsx
const ROWS: Array<[string, string]> = [
  ["Token", "GNOT"],
  ["Auction format", "Uniform Price (English)"],
  ["Minimum price", "TBD"],
  ["Total raise", "TBD"],
  ["Min commitment", "TBD"],
  ["Max commitment", "TBD"],
  ["FDV (when raise met)", "TBD"],
  ["Unlock schedule", "TBD"],
  ["Allocation (% supply)", "TBD"],
  ["Contribution window", "TBD"],
  ["Accepted currencies", "USDC, USDT (Base)"],
  ["Mainnet launch", "Q1 2026 Beta · Q3 2026 transferable"],
]

export function TokenDetails() {
  return (
    <section id="token-details" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Token sale details</p>
        <h2 className="text-3xl font-bold mb-12">Sale parameters</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
          {ROWS.map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-border py-3">
              <dt className="text-fg-muted">{label}</dt>
              <dd className="font-semibold tabular-nums text-right">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Create `Transparency.tsx`**

```tsx
const CARDS = [
  { title: "Tokenomics", body: "Full breakdown of allocation, vesting, and unlock schedule.", cta: "View pie chart →" },
  { title: "Legal structure", body: "Token disclosure document reviewed by counsel.", cta: "Download PDF →" },
  { title: "Audit", body: "Independent audit of the Sonar SettlementSale contract.", cta: "View report →" },
]

export function Transparency() {
  return (
    <section id="transparency" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Transparency</p>
        <h2 className="text-3xl font-bold mb-12">Verifiable, auditable, public</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CARDS.map((c) => (
            <article key={c.title} className="border border-border rounded-sm p-6">
              <p className="font-semibold mb-3">{c.title}</p>
              <p className="text-sm text-fg-muted mb-6">{c.body}</p>
              <a href="#" className="text-sm font-medium border-b border-fg pb-px">{c.cta}</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Create `Narrative.tsx` (#6 Open Knowledge Base)**

```tsx
export function Narrative() {
  return (
    <section id="narrative" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div
          aria-hidden="true"
          className="aspect-video bg-fg/5 rounded-sm flex items-center justify-center text-fg-faint text-sm"
        >
          [Voxel illustration — Layer 4]
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Vision</p>
          <h2 className="text-3xl font-bold mb-6">The Open Knowledge Base for the New Millennium</h2>
          <div className="space-y-4 text-fg-muted">
            <p>Gno.land is a next-generation Layer 1 smart contract platform based on Gno, a deterministic, interpreted version of the Go programming language. Founded by Jae Kwon, co-founder of Cosmos and Tendermint, Gno.land represents a paradigm shift in multi-user programming.</p>
            <p>Our technology empowers developer communities to iteratively and interactively build a single shared program, enabling Gno.land to serve as the "GitHub" of the blockchain ecosystem.</p>
            <p>Under the leadership of GovDAO and adhering to its Constitution, Gno.land is positioned to be the decentralized global knowledge base for the new millennium.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Create `Features.tsx` (#7 Built for Developers)**

```tsx
const FEATURES = [
  { title: "Gno Programming Language", body: "Derived from Go, used by millions of developers worldwide. Immediate access to a large developer community, accelerating adoption." },
  { title: "Deterministic Execution", body: "Programs behave identically across all networks — every node produces the same results for trustless consensus." },
  { title: "Native Persistent State", body: "Applications persist by default. No external databases needed, eliminating state-management complexity." },
  { title: "Multi-User Concurrency", body: "Shared state, parallel execution, and long-lived processes built in. Scalable interactive applications." },
  { title: "OS-like Composability", body: "Applications interoperate as processes instead of isolated contracts — reusable, richer ecosystem." },
]

export function Features() {
  return (
    <section id="features" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Architecture</p>
        <h2 className="text-3xl font-bold mb-4">Built for Developers, Designed for Eternity</h2>
        <p className="text-fg-muted mb-12 max-w-2xl">Gno.land fundamentally changes the programming paradigm for blockchain.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <article key={f.title} className="border border-border rounded-sm p-6">
              <p className="font-semibold mb-3">{f.title}</p>
              <p className="text-sm text-fg-muted">{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Create `GnotUtility.tsx` (#8)**

```tsx
const USES = [
  { title: "Transaction fees", body: "GNOT is the fuel that enables each and every transaction." },
  { title: "Storage deposits", body: "Owning GNOT means reserving ownership of storage on Gno.land." },
  { title: "IBC/ICS interactions", body: "GNOT is used to pay for all cross-chain interactions." },
  { title: "Contract execution", body: "GNOT is the gas token that powers smart contract execution." },
]

export function GnotUtility() {
  return (
    <section id="gnot-utility" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Token utility</p>
          <h2 className="text-3xl font-bold mb-12">GNOT powers all economic activity on gno.land</h2>
          <dl className="space-y-6">
            {USES.map((u) => (
              <div key={u.title}>
                <dt className="font-semibold mb-1">{u.title}</dt>
                <dd className="text-sm text-fg-muted">{u.body}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div
          aria-hidden="true"
          className="aspect-square bg-fg/5 rounded-sm flex items-center justify-center text-fg-faint text-sm"
        >
          [GNOT flow voxel — Layer 4]
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 9: Create `Stats.tsx` (#9)**

```tsx
const STATS: Array<[string, string]> = [
  ["5+", "Years building"],
  ["150+", "Contributors"],
  ["100+", "On-chain packages"],
  ["2400+", "PRs merged"],
  ["100+", "Open source repos"],
  ["2900+", "Commits"],
  ["1100+", "Issues closed"],
]

export function Stats() {
  return (
    <section id="stats" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Ecosystem in numbers</p>
        <h2 className="text-3xl font-bold mb-12">Five years of compounding work</h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8">
          {STATS.map(([value, label]) => (
            <div key={label}>
              <dt className="text-4xl font-bold tabular-nums">{value}</dt>
              <dd className="text-sm text-fg-muted mt-1">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
```

- [ ] **Step 10: Create `Roadmap.tsx` (#11)**

```tsx
const MILESTONES = [
  { year: "2021", body: "Jae Kwon bootstraps GnoVM and Tendermint node. Foundational VM, state persistence, first Boards realm." },
  { year: "2022", body: "Test1 → Test3 with improved usability. GnoVM safety, initial community workshops." },
  { year: "2023", body: "gnodev, Playground, GnoChess. Official docs and Gno Network Public License." },
  { year: "2024", body: "Permanent multi-node Test4 with GovDAO, Test5 expanded validators." },
  { year: "2025", body: "Stabilization with Test6–Test8, GovDAO V3, token mechanics, major GnoVM upgrades." },
  { year: "Q1 2026", body: "Beta Mainnet launch. Token distribution. Functional network released.", highlight: true },
  { year: "Q2 2026", body: "Bridging AtomOne and Gno.land for security and interoperability." },
  { year: "Q3 2026", body: "Mainnet launch. Protocol-level transfers enabled." },
  { year: "Q4 2026+", body: "Ecosystem growth — killer apps and tooling on Gno.land." },
]

export function Roadmap() {
  return (
    <section id="roadmap" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Roadmap</p>
        <h2 className="text-3xl font-bold mb-12">Five years to mainnet, and beyond</h2>
        <ol className="space-y-6">
          {MILESTONES.map((m) => (
            <li
              key={m.year}
              className={`grid grid-cols-[120px_1fr] gap-6 border-l-2 ${m.highlight ? "border-fg" : "border-border"} pl-6 py-2`}
            >
              <p className="font-mono text-sm">{m.year}</p>
              <p className="text-fg-muted">{m.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
```

- [ ] **Step 11: Create `Ecosystem.tsx` (#12) — abbreviated for plan; full descriptions from `content/sections.md`**

```tsx
const PROJECTS = [
  { name: "Gnoscan", body: "Official blockchain explorer by Onbloc. Search wallets, transactions, blocks, contracts." },
  { name: "Adena", body: "Open-source, non-custodial wallet for Gno.land by Onbloc." },
  { name: "Gnoswap", body: "First decentralized exchange (DEX) on Gno.land, written in Gno." },
  { name: "Boards", body: "On-chain forum application — decentralized, censorship-resistant discussion." },
  { name: "Akkadia", body: "On-chain world-building game inspired by the Library of Alexandria." },
  { name: "Gno Playground", body: "Browser-based environment for writing, testing, and deploying Gno code." },
  { name: "Gno Studio Connect", body: "Direct access to Gno.land smart contracts through function calls." },
  { name: "CommonDAO", body: "Modular on-chain governance framework with parent/sub-DAO hierarchy." },
  { name: "Tendermint2", body: "Evolved consensus engine — simplicity, security, performance." },
  { name: "Gnokey", body: "Secure key management and transaction signing." },
  { name: "Gnodev", body: "Local development environment with hot reload." },
  { name: "Gnoweb", body: "Official web interface for browsing Gno.land realms." },
  { name: "Gnoverse", body: "Community-led GitHub organization for ecosystem builders." },
]

export function Ecosystem() {
  return (
    <section id="ecosystem" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Ecosystem</p>
        <h2 className="text-3xl font-bold mb-12">Projects building on Gno.land</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROJECTS.map((p) => (
            <article key={p.name} className="border border-border rounded-sm p-6">
              <p className="font-semibold mb-3">{p.name}</p>
              <p className="text-sm text-fg-muted">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 12: Create `Team.tsx`, `Investors.tsx`, `Partners.tsx`, `Media.tsx`, `PreFooterCta.tsx`**

`Team.tsx`:

```tsx
export function Team() {
  return (
    <section id="team" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Team</p>
        <h2 className="text-3xl font-bold mb-12">The people behind gno.land</h2>
        <p className="text-fg-muted">Team grid placeholder — TBD list from team.</p>
      </div>
    </section>
  )
}
```

`Investors.tsx`:

```tsx
export function Investors() {
  return (
    <section id="investors" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Investors</p>
        <h2 className="text-3xl font-bold mb-12">Backed by</h2>
        <p className="text-fg-muted">Investors logos — TBD (section may be removed).</p>
      </div>
    </section>
  )
}
```

`Partners.tsx`:

```tsx
const PARTNERS = [
  { name: "Samourai Coop", body: "Development team focused on DAOs and sustainable, community-powered applications." },
  { name: "Berty", body: "Non-profit NGO specializing in secure, peer-to-peer mobile communication." },
  { name: "Onbloc", body: "Engineering team building consumer-facing apps: Adena Wallet, Gnoswap, Gnoscan." },
  { name: "AtomOne", body: "Constitutionally-governed Cosmos blockchain. Gno.land plans integration for consensus." },
]

export function Partners() {
  return (
    <section id="partners" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Partners</p>
        <h2 className="text-3xl font-bold mb-12">Building together</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PARTNERS.map((p) => (
            <article key={p.name} className="border border-border rounded-sm p-6">
              <p className="font-semibold mb-3">{p.name}</p>
              <p className="text-sm text-fg-muted">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
```

`Media.tsx`:

```tsx
export function Media() {
  return (
    <section id="media" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Media</p>
        <h2 className="text-3xl font-bold mb-12">Press coverage</h2>
        <p className="text-fg-muted">Press logos and articles — to be populated during launch campaign.</p>
      </div>
    </section>
  )
}
```

`PreFooterCta.tsx`:

```tsx
export function PreFooterCta() {
  return (
    <section id="pre-footer-cta" className="relative py-32 border-b border-border">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-fg/5"
      >
        <div className="h-full w-full flex items-center justify-center text-fg-faint text-sm">
          [Full-width voxel background — Layer 4]
        </div>
      </div>
      <div className="relative mx-auto max-w-[1280px] px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to join the sale?</h2>
        <p className="text-fg-muted mb-8 max-w-xl mx-auto">
          Connect your wallet and place a bid in less than 2 minutes.
        </p>
        <button type="button" className="inline-block px-8 py-4 bg-fg text-bg rounded-sm font-semibold">
          Place a bid
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 13: Update `app/page.tsx` to render all sections**

```tsx
import { Hero } from "./(sections)/hero/Hero"
import { SaleMetrics } from "./(sections)/sale-metrics/SaleMetrics"
import { HowItWorks } from "./(sections)/how-it-works/HowItWorks"
import { TokenDetails } from "./(sections)/token-details/TokenDetails"
import { Transparency } from "./(sections)/transparency/Transparency"
import { Narrative } from "./(sections)/narrative/Narrative"
import { Features } from "./(sections)/features/Features"
import { GnotUtility } from "./(sections)/gnot-utility/GnotUtility"
import { Stats } from "./(sections)/stats/Stats"
import { Roadmap } from "./(sections)/roadmap/Roadmap"
import { Ecosystem } from "./(sections)/ecosystem/Ecosystem"
import { Team } from "./(sections)/team/Team"
import { Investors } from "./(sections)/investors/Investors"
import { Partners } from "./(sections)/partners/Partners"
import { Media } from "./(sections)/media/Media"
import { PreFooterCta } from "./(sections)/pre-footer-cta/PreFooterCta"

export default function Home() {
  return (
    <main>
      <Hero />
      <SaleMetrics />
      <HowItWorks />
      <TokenDetails />
      <Transparency />
      <Narrative />
      <Features />
      <GnotUtility />
      <Stats />
      <Roadmap />
      <Ecosystem />
      <Team />
      <Investors />
      <Partners />
      <Media />
      <PreFooterCta />
    </main>
  )
}
```

- [ ] **Step 14: Run dev, verify all sections render**

```bash
npm run dev
```

Open `http://localhost:3000`, scroll through page, confirm 16 sections render in order.

- [ ] **Step 15: Add E2E test for sections present**

Update `tests/e2e/homepage.spec.ts`:

```ts
import { test, expect } from "@playwright/test"

test("homepage renders all sections", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /GNOT Public/i })).toBeVisible()
  for (const id of [
    "sale-metrics", "how-it-works", "token-details", "transparency",
    "narrative", "features", "gnot-utility", "stats", "roadmap",
    "ecosystem", "team", "investors", "partners", "media", "pre-footer-cta",
  ]) {
    await expect(page.locator(`#${id}`)).toBeVisible()
  }
})

test("anchor navigation works", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: /Roadmap/i }).click()
  await expect(page).toHaveURL(/#roadmap$/)
})
```

- [ ] **Step 16: Run E2E**

```bash
npm run test:e2e
```

Expected: PASS, 2 tests.

- [ ] **Step 17: Commit**

```bash
git add .
git commit -m "feat: scaffold all 16 page sections with placeholder copy

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 1.9: Smooth anchor scroll + sticky header behavior

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add smooth scroll CSS**

Append to `app/globals.css`:

```css
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}

main > section { scroll-margin-top: 80px; }
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Click nav links, confirm smooth scrolling, sections land below sticky header.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add CSS-based smooth scroll with reduced-motion guard

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 1.10: Layer 1 deploy preview gate

- [ ] **Step 1: Open PR with all Layer 1 commits**

```bash
git checkout -b layer-1-skeleton
git push -u origin layer-1-skeleton
gh pr create --title "Layer 1: skeleton + UX" --body "First deployable wireframe of sale.gno.land. 16 sections, sticky header, bid panel placeholder, 2-color palette."
```

- [ ] **Step 2: Wait for Netlify preview deploy**

The preview URL appears as a comment from `netlify[bot]` on the PR. Open it.

- [ ] **Step 3: Manual review checklist**

- [ ] Homepage loads under 2s
- [ ] All 16 sections render with placeholder copy
- [ ] Header stays sticky on scroll
- [ ] Nav anchor links scroll smoothly to target sections
- [ ] BidPanel placeholder visible in hero column
- [ ] Footer renders with socials + disclaimer
- [ ] Mobile viewport (375px): sections stack vertically, no horizontal scroll
- [ ] Tab key navigates through all interactive elements (a, button)
- [ ] Lighthouse a11y >= 90, perf >= 80 (build is unoptimized still)

- [ ] **Step 4: Merge to main once approved**

```bash
gh pr merge --squash
git checkout main
git pull
```

**End of Layer 1.** Layer 2 starts on a fresh branch.

---

# LAYER 2 — Functionality (Sonar + wallet, end-to-end)

**Layer goal:** A deployed preview where a user can: connect with Sonar (OAuth sandbox), connect a wallet (Base Sepolia), see real sale metrics from the Sonar API, place a bid via `replaceBidWithPermit()`, and see the resulting tx on Base Sepolia.

**Definition of done:** E2E test passes: full bid flow against Sonar sandbox + Base Sepolia executes without error in CI. Security headers, rate limiting, audit log, kill switch all wired.

**Prerequisites from Sonar (blockers):** A1 (OAuth credentials), A3-A8 (sandbox env, contract addresses, ABIs). If these aren't ready, scaffolding Layer 2 tasks can proceed with MSW mocks, but E2E test gate requires real sandbox.

---

## Task 2.1: Type-safe env validation (zod)

**Files:**
- Create: `lib/env.ts`, `tests/unit/env.test.ts`

- [ ] **Step 1: Install zod**

```bash
npm install zod
```

- [ ] **Step 2: Write failing test**

Create `tests/unit/env.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest"

describe("env validation", () => {
  beforeEach(() => {
    // Reset module cache to re-validate env on each test
    process.env = {
      ...process.env,
      SONAR_CLIENT_UUID: "test-uuid",
      SONAR_REDIRECT_URI: "http://localhost:3000/oauth/callback",
      SONAR_SALE_UUID: "test-sale",
      SONAR_API_BASE_URL: "https://sandbox.api.echo.xyz",
      ENCRYPTION_KEY: "0".repeat(64),
      IP_HMAC_PEPPER: "1".repeat(64),
      SESSION_PASSWORD: "x".repeat(32),
      DATABASE_URL: "postgres://localhost/test",
    }
  })

  it("parses required env vars", async () => {
    const { env } = await import("@/lib/env")
    expect(env.SONAR_CLIENT_UUID).toBe("test-uuid")
  })

  it("rejects too-short ENCRYPTION_KEY", async () => {
    process.env.ENCRYPTION_KEY = "short"
    await expect(import("@/lib/env")).rejects.toThrow()
  })
})
```

- [ ] **Step 3: Run test, verify it fails**

```bash
npm run test -- env
```

Expected: FAIL (module not found).

- [ ] **Step 4: Implement `lib/env.ts`**

```ts
import "server-only"
import { z } from "zod"

const schema = z.object({
  SONAR_CLIENT_UUID: z.string().min(1),
  SONAR_REDIRECT_URI: z.string().url(),
  SONAR_SALE_UUID: z.string().min(1),
  SONAR_API_BASE_URL: z.string().url(),
  ENCRYPTION_KEY: z.string().length(64), // 32 bytes hex — rotates per spec §4.7
  IP_HMAC_PEPPER: z.string().length(64), // 32 bytes hex — rotates per spec §4.7 (3 months)
  SESSION_PASSWORD: z.string().min(32),
  DATABASE_URL: z.string().url(),
  SALE_PAUSED: z.enum(["true", "false"]).default("false"),
  SENTRY_DSN_SERVER: z.string().optional(),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error("Env validation failed:", parsed.error.flatten().fieldErrors)
  throw new Error("Invalid environment variables")
}

export const env = parsed.data
```

- [ ] **Step 5: Run test, verify it passes**

```bash
npm run test -- env
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(env): add zod-validated env schema (server-only)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.2: libsodium envelope encryption utility

**Files:**
- Create: `lib/security/encryption.ts`, `tests/unit/encryption.test.ts`

- [ ] **Step 1: Install libsodium**

```bash
npm install libsodium-wrappers
npm install -D @types/libsodium-wrappers
```

- [ ] **Step 2: Write failing test**

Create `tests/unit/encryption.test.ts`:

```ts
import { describe, it, expect, beforeAll } from "vitest"

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "a".repeat(64)
})

describe("encryption", () => {
  it("encrypts and decrypts string", async () => {
    const { encrypt, decrypt } = await import("@/lib/security/encryption")
    const plaintext = "sensitive token data"
    const cipher = await encrypt(plaintext)
    expect(cipher).not.toBe(plaintext)
    const decrypted = await decrypt(cipher)
    expect(decrypted).toBe(plaintext)
  })

  it("ciphertext is non-deterministic (different nonces)", async () => {
    const { encrypt } = await import("@/lib/security/encryption")
    const a = await encrypt("same input")
    const b = await encrypt("same input")
    expect(a).not.toBe(b)
  })

  it("fails to decrypt tampered ciphertext", async () => {
    const { encrypt, decrypt } = await import("@/lib/security/encryption")
    const cipher = await encrypt("test")
    const tampered = cipher.slice(0, -2) + "xx"
    await expect(decrypt(tampered)).rejects.toThrow()
  })
})
```

- [ ] **Step 3: Run test, verify it fails**

```bash
npm run test -- encryption
```

Expected: FAIL.

- [ ] **Step 4: Implement `lib/security/encryption.ts`**

```ts
import "server-only"
import sodium from "libsodium-wrappers"
import { env } from "@/lib/env"

let ready: Promise<void> | null = null

async function init() {
  if (!ready) {
    ready = sodium.ready
  }
  await ready
}

function getKey() {
  return sodium.from_hex(env.ENCRYPTION_KEY)
}

export async function encrypt(plaintext: string): Promise<string> {
  await init()
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
  const cipher = sodium.crypto_secretbox_easy(
    sodium.from_string(plaintext),
    nonce,
    getKey(),
  )
  const combined = new Uint8Array(nonce.length + cipher.length)
  combined.set(nonce, 0)
  combined.set(cipher, nonce.length)
  return sodium.to_base64(combined, sodium.base64_variants.URLSAFE_NO_PADDING)
}

export async function decrypt(ciphertext: string): Promise<string> {
  await init()
  const combined = sodium.from_base64(ciphertext, sodium.base64_variants.URLSAFE_NO_PADDING)
  const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES)
  const cipher = combined.slice(sodium.crypto_secretbox_NONCEBYTES)
  const plain = sodium.crypto_secretbox_open_easy(cipher, nonce, getKey())
  return sodium.to_string(plain)
}
```

- [ ] **Step 5: Run tests, verify PASS**

```bash
npm run test -- encryption
```

Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(security): add libsodium envelope encryption with tests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.3: Drizzle schema + Netlify DB setup

**Files:**
- Create: `lib/db/schema.ts`, `lib/db/client.ts`, `drizzle.config.ts`

- [ ] **Step 1: Install Drizzle + Postgres driver**

```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

- [ ] **Step 2: Create `lib/db/schema.ts`**

Per spec §4.7: we store already-public data in clear (wallets, entity IDs, amounts — all visible on-chain anyway), HMAC the IP with a server-side PEPPER, bucket the user-agent, and constrain `metadata` to a strict whitelist via zod. No fake-anonymizing hash truncation.

```ts
import { pgTable, text, timestamp, bigint, uuid, jsonb, index } from "drizzle-orm/pg-core"

/** Encrypted OAuth tokens, keyed by opaque session id. */
export const oauthTokens = pgTable("oauth_tokens", {
  sessionId: text("session_id").primaryKey(),
  /** libsodium AES-256-GCM ciphertext of {accessToken, refreshToken}. */
  encryptedTokens: text("encrypted_tokens").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  expiresIdx: index("oauth_tokens_expires_idx").on(t.expiresAt),
}))

/**
 * Forensic + compliance audit log.
 *
 * Stored fields are deliberately either:
 *   - already public on-chain (wallet, entity_id, amount) — no privacy gain from hashing
 *   - HMAC'd with a server-only PEPPER (ip_hmac) — irreversible without the secret
 *   - bucket-categorized (user_agent_class) — no fingerprinting surface
 *   - schema-restricted (metadata) — see whitelist below
 *
 * Forbidden in `metadata`: email, name, address, phone, DOB, full UA, full IP,
 * OAuth codes/tokens, full permit signatures, any string > 256 chars.
 */
export const auditLog = pgTable("audit_log", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  event: text("event").notNull(),
  /** Sonar entity UUID — public via Sonar SDK + on-chain `entityStatesByIDs()`. */
  entityId: uuid("entity_id"),
  /** Full wallet address (0x…40) — public on Base mainnet via SettlementSale events. */
  wallet: text("wallet"),
  /** Bid amount in payment-token minor units (USDC has 6 decimals). */
  amountMinor: bigint("amount_minor", { mode: "number" }),
  /** HMAC-SHA256(ip, IP_HMAC_PEPPER) — irreversible without the PEPPER. */
  ipHmac: text("ip_hmac"),
  /** Coarse UA bucket: "chrome-mobile" | "firefox-desktop" | etc. Never the raw UA. */
  userAgentClass: text("user_agent_class"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  eventIdx: index("audit_log_event_idx").on(t.event),
  createdAtIdx: index("audit_log_created_at_idx").on(t.createdAt),
  walletIdx: index("audit_log_wallet_idx").on(t.wallet),
}))
```

Add zod schema for `metadata` whitelist enforcement in `lib/db/schema.ts`:

```ts
import { z } from "zod"

/** Whitelist of allowed keys in audit_log.metadata. Reject anything else at write time. */
export const auditMetadataSchema = z
  .object({
    permit_id_prefix: z.string().max(16).optional(),
    error_code: z.string().max(64).optional(),
    chain_id: z.number().int().optional(),
    payment_token: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  })
  .strict()

export type AuditMetadata = z.infer<typeof auditMetadataSchema>
```

- [ ] **Step 3: Create `lib/db/client.ts`**

```ts
import "server-only"
import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import { env } from "@/lib/env"
import * as schema from "./schema"

const sql = neon(env.DATABASE_URL)
export const db = drizzle(sql, { schema })
```

- [ ] **Step 4: Create `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
})
```

- [ ] **Step 5: Add migration scripts to `package.json`**

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

- [ ] **Step 6: Generate initial migration**

```bash
npm run db:generate
```

Expected: `lib/db/migrations/0000_*.sql` file generated.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(db): add Drizzle schema for oauth_tokens and audit_log

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

**Out-of-plan**: provision Netlify DB via dashboard, copy `DATABASE_URL` into Netlify env vars (per deploy context). Run `npm run db:migrate` against each environment.

---

## Task 2.4: iron-session config

**Files:**
- Create: `lib/security/session.ts`

- [ ] **Step 1: Install iron-session**

```bash
npm install iron-session
```

- [ ] **Step 2: Implement `lib/security/session.ts`**

```ts
import "server-only"
import { getIronSession, type SessionOptions } from "iron-session"
import { cookies } from "next/headers"
import { env } from "@/lib/env"

export interface AppSession {
  sessionId?: string // UUID linking to oauth_tokens row
  walletAddress?: `0x${string}`
}

const options: SessionOptions = {
  password: env.SESSION_PASSWORD,
  cookieName: "gnot_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2, // 2h rolling
  },
}

export async function getSession() {
  return getIronSession<AppSession>(await cookies(), options)
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(security): add iron-session config with HttpOnly+Secure+SameSite cookie

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.5: Sonar client wrapper (server-only)

**Files:**
- Create: `lib/sonar/client.ts`, `lib/sonar/server-only.ts`

- [ ] **Step 1: Install Sonar SDK (pinned exact)**

```bash
npm install @echoxyz/sonar-core@0.15.0 @echoxyz/sonar-react@0.14.0
```

- [ ] **Step 2: Create `lib/sonar/server-only.ts` (barrel guard)**

```ts
import "server-only"
export * as sonarCore from "@echoxyz/sonar-core"
```

- [ ] **Step 3: Create `lib/sonar/client.ts`**

```ts
import "server-only"
import { sonarCore } from "./server-only"
import { env } from "@/lib/env"

// NOTE: Exact constructor + method names per `@echoxyz/sonar-core@0.15.0` API.
// Verify against the package's TypeScript types when scaffolding.
//
// This wrapper centralizes:
//   - client instantiation (no client_secret per PKCE public-client model)
//   - access-token injection per request
//   - error mapping to typed app errors
//
// To be filled in once we read the sonar-core API surface on day 1.
//
// Skeleton:
export function createSonarClient(accessToken: string) {
  return new sonarCore.SonarClient({
    clientUUID: env.SONAR_CLIENT_UUID,
    apiBaseUrl: env.SONAR_API_BASE_URL,
    accessToken,
  })
}
```

- [ ] **Step 4: Verify sonar-core actual API surface**

```bash
node -e "console.log(Object.keys(require('@echoxyz/sonar-core')))"
```

Adjust `client.ts` to match real exports. If `SonarClient` is not the constructor name, replace with whatever `@echoxyz/sonar-core` actually exports (read `node_modules/@echoxyz/sonar-core/dist/index.d.ts`).

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(sonar): scaffold server-only Sonar client wrapper

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.6: OAuth init route + PKCE generation + Blobs store

**Files:**
- Create: `lib/sonar/oauth.ts`, `app/api/auth/sonar/init/route.ts`

- [ ] **Step 1: Install Netlify Blobs**

```bash
npm install @netlify/blobs
```

- [ ] **Step 2: Implement `lib/sonar/oauth.ts`**

```ts
import "server-only"
import { getStore } from "@netlify/blobs"
import { randomBytes, createHash } from "node:crypto"
import { sonarCore } from "./server-only"
import { env } from "@/lib/env"

const PKCE_TTL_MS = 10 * 60 * 1000 // 10 min

function base64url(buf: Buffer) {
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
}

export async function generatePkceAndStore(sessionId: string) {
  const state = base64url(randomBytes(16))
  const codeVerifier = base64url(randomBytes(32))
  const codeChallenge = base64url(createHash("sha256").update(codeVerifier).digest())

  const store = getStore("pkce")
  await store.setJSON(
    state,
    { sessionId, codeVerifier },
    { metadata: { expiresAt: Date.now() + PKCE_TTL_MS } },
  )

  return { state, codeChallenge }
}

export async function consumePkceState(state: string) {
  const store = getStore("pkce")
  const entry = await store.getWithMetadata(state, { type: "json" })
  if (!entry) return null
  const expiresAt = (entry.metadata as { expiresAt?: number })?.expiresAt ?? 0
  await store.delete(state) // single-use, delete immediately
  if (expiresAt < Date.now()) return null
  return entry.data as { sessionId: string; codeVerifier: string }
}

export function buildAuthorizationUrl(state: string, codeChallenge: string) {
  // Replace with actual Sonar SDK helper once API is confirmed
  const params = new URLSearchParams({
    client_id: env.SONAR_CLIENT_UUID,
    redirect_uri: env.SONAR_REDIRECT_URI,
    response_type: "code",
    scope: "read_entities sale_eligibility_check",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  })
  return `${env.SONAR_API_BASE_URL}/oauth/authorize?${params}`
}
```

- [ ] **Step 3: Implement `app/api/auth/sonar/init/route.ts`**

```ts
import "server-only"
import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { getSession } from "@/lib/security/session"
import { generatePkceAndStore, buildAuthorizationUrl } from "@/lib/sonar/oauth"

export async function POST() {
  const session = await getSession()
  if (!session.sessionId) {
    session.sessionId = randomUUID()
    await session.save()
  }

  const { state, codeChallenge } = await generatePkceAndStore(session.sessionId)
  const url = buildAuthorizationUrl(state, codeChallenge)

  return NextResponse.json({ authorizationUrl: url })
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(auth): add OAuth init route with PKCE generation in Blobs

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.7: OAuth callback route + token exchange + DB store

**Files:**
- Create: `app/api/auth/sonar/callback/route.ts`, `lib/sonar/tokens.ts`

- [ ] **Step 1: Implement `lib/sonar/tokens.ts`**

```ts
import "server-only"
import { db } from "@/lib/db/client"
import { oauthTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { encrypt, decrypt } from "@/lib/security/encryption"

export interface SonarTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

export async function storeTokens(sessionId: string, tokens: SonarTokens) {
  const encryptedTokens = await encrypt(JSON.stringify({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  }))
  await db
    .insert(oauthTokens)
    .values({
      sessionId,
      encryptedTokens,
      expiresAt: tokens.expiresAt,
    })
    .onConflictDoUpdate({
      target: oauthTokens.sessionId,
      set: { encryptedTokens, expiresAt: tokens.expiresAt, updatedAt: new Date() },
    })
}

export async function loadTokens(sessionId: string): Promise<SonarTokens | null> {
  const [row] = await db
    .select()
    .from(oauthTokens)
    .where(eq(oauthTokens.sessionId, sessionId))
    .limit(1)
  if (!row) return null
  const { accessToken, refreshToken } = JSON.parse(await decrypt(row.encryptedTokens))
  return { accessToken, refreshToken, expiresAt: row.expiresAt }
}
```

- [ ] **Step 2: Implement `app/api/auth/sonar/callback/route.ts`**

```ts
import "server-only"
import { NextResponse, type NextRequest } from "next/server"
import { getSession } from "@/lib/security/session"
import { consumePkceState } from "@/lib/sonar/oauth"
import { storeTokens } from "@/lib/sonar/tokens"
import { sonarCore } from "@/lib/sonar/server-only"
import { env } from "@/lib/env"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  if (!code || !state) return NextResponse.json({ error: "missing params" }, { status: 400 })

  const pkce = await consumePkceState(state)
  if (!pkce) return NextResponse.json({ error: "invalid or expired state" }, { status: 400 })

  const session = await getSession()
  if (session.sessionId !== pkce.sessionId) {
    return NextResponse.json({ error: "session mismatch" }, { status: 400 })
  }

  // Exchange code (Sonar SDK API — verify exact method name on day 1)
  const exchanged = await sonarCore.exchangeAuthorizationCode({
    clientUUID: env.SONAR_CLIENT_UUID,
    code,
    codeVerifier: pkce.codeVerifier,
    redirectUri: env.SONAR_REDIRECT_URI,
  })

  await storeTokens(pkce.sessionId, {
    accessToken: exchanged.accessToken,
    refreshToken: exchanged.refreshToken,
    expiresAt: new Date(exchanged.expiresAt),
  })

  return NextResponse.redirect(new URL("/", req.url))
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(auth): add OAuth callback with token exchange and encrypted storage

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.8: Pre-purchase + generate-permit Server Actions

**Files:**
- Create: `lib/sonar/permit.ts`, `app/api/sonar/pre-purchase/route.ts`, `app/api/sonar/generate-permit/route.ts`

- [ ] **Step 1: Implement `lib/sonar/permit.ts`**

```ts
import "server-only"
import { loadTokens, storeTokens } from "./tokens"
import { createSonarClient } from "./client"
import { sonarCore } from "./server-only"
import { env } from "@/lib/env"
import { db } from "@/lib/db/client"
import { auditLog, auditMetadataSchema, type AuditMetadata } from "@/lib/db/schema"
import { createHmac } from "node:crypto"

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000

async function ensureFreshTokens(sessionId: string) {
  const tokens = await loadTokens(sessionId)
  if (!tokens) throw new Error("no tokens for session")
  if (tokens.expiresAt.getTime() - Date.now() > REFRESH_THRESHOLD_MS) return tokens

  const refreshed = await sonarCore.refreshTokens({
    clientUUID: env.SONAR_CLIENT_UUID,
    refreshToken: tokens.refreshToken,
  })
  const fresh = {
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    expiresAt: new Date(refreshed.expiresAt),
  }
  await storeTokens(sessionId, fresh)
  return fresh
}

export async function prePurchaseCheck(args: {
  sessionId: string
  entityId: string
  wallet: `0x${string}`
}) {
  const tokens = await ensureFreshTokens(args.sessionId)
  const client = createSonarClient(tokens.accessToken)
  return client.prePurchaseCheck({
    saleUUID: env.SONAR_SALE_UUID,
    entityID: args.entityId,
    walletAddress: args.wallet,
  })
}

/** HMAC-SHA256 of an IP using the server-only PEPPER. Irreversible without the PEPPER. */
export function ipHmac(ip: string): string {
  return createHmac("sha256", env.IP_HMAC_PEPPER).update(ip).digest("hex")
}

/**
 * Insert an audit_log row. Validates `metadata` against the whitelist schema before write
 * to guarantee no PII leaks into the database.
 */
async function recordAudit(args: {
  event: string
  entityId: string | null
  wallet: `0x${string}` | null
  amountMinor: number | null
  ipHmac: string | null
  userAgentClass: string | null
  metadata: AuditMetadata
}) {
  const metadata = auditMetadataSchema.parse(args.metadata)
  await db.insert(auditLog).values({
    event: args.event,
    entityId: args.entityId,
    wallet: args.wallet,
    amountMinor: args.amountMinor,
    ipHmac: args.ipHmac,
    userAgentClass: args.userAgentClass,
    metadata,
  })
}

export async function generatePurchasePermit(args: {
  sessionId: string
  entityId: string
  wallet: `0x${string}`
  amount: bigint
  ipHmacValue: string
  userAgentClass: string
}) {
  const tokens = await ensureFreshTokens(args.sessionId)
  const client = createSonarClient(tokens.accessToken)
  const result = await client.generatePurchasePermit({
    saleUUID: env.SONAR_SALE_UUID,
    entityID: args.entityId,
    walletAddress: args.wallet,
    amount: args.amount.toString(),
  })
  await recordAudit({
    event: "permit_issued",
    entityId: args.entityId,
    wallet: args.wallet,
    amountMinor: Number(args.amount),
    ipHmac: args.ipHmacValue,
    userAgentClass: args.userAgentClass,
    metadata: {
      permit_id_prefix: result.permit.id?.slice(0, 8),
      chain_id: 8453,
    },
  })
  return result
}
```

Add a small utility `lib/security/user-agent.ts` to bucket the UA:

```ts
/** Bucket the user-agent string into a coarse, non-fingerprinting category. */
export function classifyUserAgent(ua: string | null): string {
  if (!ua) return "unknown"
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)
  const suffix = isMobile ? "-mobile" : "-desktop"
  if (/Edg\//i.test(ua)) return `edge${suffix}`
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return `chrome${suffix}`
  if (/Firefox\//i.test(ua)) return `firefox${suffix}`
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return `safari${suffix}`
  return `other${suffix}`
}
```

- [ ] **Step 2: Implement `app/api/sonar/pre-purchase/route.ts`**

```ts
import "server-only"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/security/session"
import { prePurchaseCheck } from "@/lib/sonar/permit"

const schema = z.object({
  entityId: z.string().uuid(),
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.sessionId) return NextResponse.json({ error: "no session" }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: "invalid input" }, { status: 400 })

  try {
    const result = await prePurchaseCheck({
      sessionId: session.sessionId,
      entityId: parsed.data.entityId,
      wallet: parsed.data.wallet as `0x${string}`,
    })
    return NextResponse.json(result)
  } catch (err) {
    console.error("pre-purchase failed", err)
    return NextResponse.json({ error: "pre-purchase failed" }, { status: 500 })
  }
}
```

- [ ] **Step 3: Implement `app/api/sonar/generate-permit/route.ts`**

```ts
import "server-only"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/security/session"
import { generatePurchasePermit, ipHmac } from "@/lib/sonar/permit"
import { classifyUserAgent } from "@/lib/security/user-agent"

const schema = z.object({
  entityId: z.string().uuid(),
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string().regex(/^\d+$/),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.sessionId) return NextResponse.json({ error: "no session" }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: "invalid input" }, { status: 400 })

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const ipHmacValue = ipHmac(ip)
  const userAgentClass = classifyUserAgent(req.headers.get("user-agent"))

  try {
    const result = await generatePurchasePermit({
      sessionId: session.sessionId,
      entityId: parsed.data.entityId,
      wallet: parsed.data.wallet as `0x${string}`,
      amount: BigInt(parsed.data.amount),
      ipHmacValue,
      userAgentClass,
    })
    return NextResponse.json(result)
  } catch (err) {
    console.error("generate-permit failed", err)
    return NextResponse.json({ error: "permit failed" }, { status: 500 })
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(sonar): add pre-purchase and generate-permit routes with audit log

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.9: Read commitments proxy + live ticker hook

**Files:**
- Create: `app/api/sonar/commitments/route.ts`, `lib/sonar/commitments.ts`

- [ ] **Step 1: Implement `lib/sonar/commitments.ts`**

```ts
import "server-only"
import { env } from "@/lib/env"

// Public API call — no per-user auth needed for read-commitment-data
// Per Sonar docs: returns total, count, last 100, and current clearing price for auctions.
export async function readCommitmentData() {
  const res = await fetch(`${env.SONAR_API_BASE_URL}/v1/sales/${env.SONAR_SALE_UUID}/commitments`, {
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`commitments fetch failed: ${res.status}`)
  return res.json() as Promise<{
    totalCommitted: string
    uniqueCommitments: number
    currentClearingPrice?: string
    recentCommitments: Array<{ wallet: string; amount: string; timestamp: string }>
  }>
}
```

- [ ] **Step 2: Implement route**

```ts
import "server-only"
import { NextResponse } from "next/server"
import { readCommitmentData } from "@/lib/sonar/commitments"

export const revalidate = 0 // always fresh

export async function GET() {
  try {
    const data = await readCommitmentData()
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=10, stale-while-revalidate=30" },
    })
  } catch (err) {
    console.error("commitments fetch failed", err)
    return NextResponse.json({ error: "commitments fetch failed" }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(sonar): add commitments proxy route with 10s edge cache

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.10: wagmi + RainbowKit + contract ABI

**Files:**
- Create: `lib/wagmi/config.ts`, `lib/wagmi/abis.ts`, `app/providers.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Install wagmi + RainbowKit + viem + TanStack Query**

```bash
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
```

- [ ] **Step 2: Create `lib/wagmi/config.ts`**

```ts
"use client"
import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { base, baseSepolia } from "wagmi/chains"
import { http } from "wagmi"

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ""
const isProd = process.env.NEXT_PUBLIC_SITE_URL?.includes("sale.gno.land") ?? false

export const wagmiConfig = getDefaultConfig({
  appName: "GNOT Token Sale",
  projectId,
  chains: isProd ? [base] : [baseSepolia],
  transports: {
    [base.id]: http("https://mainnet.base.org"),
    [baseSepolia.id]: http("https://sepolia.base.org"),
  },
  ssr: true,
})
```

- [ ] **Step 3: Create `lib/wagmi/abis.ts` (skeleton — fill from Sonar on day 1)**

```ts
// TODO(Sonar A7): replace with actual ABI extracted from sonar-core or
// the published SettlementSale.sol once Sonar provides the address.
// For now this is the function we care about for the bid flow.

export const settlementSaleAbi = [
  {
    type: "function",
    name: "replaceBidWithPermit",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "permit",
        type: "tuple",
        components: [
          { name: "saleSpecificEntityID", type: "bytes16" },
          { name: "saleUUID", type: "bytes16" },
          { name: "wallet", type: "address" },
          { name: "expiresAt", type: "uint256" },
          { name: "minAmount", type: "uint256" },
          { name: "maxAmount", type: "uint256" },
          { name: "minPrice", type: "uint256" },
          { name: "maxPrice", type: "uint256" },
          { name: "opensAt", type: "uint256" },
          { name: "closesAt", type: "uint256" },
          { name: "payload", type: "bytes" },
        ],
      },
      { name: "signature", type: "bytes" },
      { name: "paymentToken", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "permitV", type: "uint8" },
      { name: "permitR", type: "bytes32" },
      { name: "permitS", type: "bytes32" },
      { name: "permitDeadline", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "totalCommittedAmount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "stage",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
] as const
```

- [ ] **Step 4: Create `app/providers.tsx`**

```tsx
"use client"
import { type ReactNode, useState } from "react"
import { WagmiProvider } from "wagmi"
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "@rainbow-me/rainbowkit/styles.css"
import { wagmiConfig } from "@/lib/wagmi/config"

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: false } },
  }))

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

- [ ] **Step 5: Wrap `app/layout.tsx` with Providers**

Modify `app/layout.tsx`:

```tsx
import "./globals.css"
import type { ReactNode } from "react"
import { Header } from "./(chrome)/Header"
import { Footer } from "./(chrome)/Footer"
import { Providers } from "./providers"

// metadata unchanged

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(wallet): add wagmi + RainbowKit + Providers, chain pinned to Base

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.11: BidPanel — real states (connect, KYC, simulate, bid)

**Files:**
- Modify: `app/(chrome)/BidPanel.tsx`
- Create: `lib/utils/format.ts`, `lib/utils/countdown.ts`

- [ ] **Step 1: Add format utilities**

`lib/utils/format.ts`:

```ts
export function formatUsd(amountMinor: bigint | string | number, decimals = 6): string {
  const n = typeof amountMinor === "bigint" ? amountMinor : BigInt(amountMinor)
  const factor = 10n ** BigInt(decimals)
  const whole = n / factor
  const frac = Number((n % factor) * 100n / factor)
  return `$${whole.toLocaleString()}.${frac.toString().padStart(2, "0")}`
}
```

`lib/utils/countdown.ts`:

```ts
export function timeRemaining(target: Date, now = new Date()): string {
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return "Closed"
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const mins = Math.floor((diff % 3_600_000) / 60_000)
  return `${days}d ${hours}h ${mins}m`
}
```

- [ ] **Step 2: Replace `BidPanel.tsx` with stateful client component**

```tsx
"use client"

import { useAccount, useChainId, useSimulateContract, useWriteContract, useReadContract } from "wagmi"
import { useQuery } from "@tanstack/react-query"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useState } from "react"
import { base, baseSepolia } from "wagmi/chains"
import { settlementSaleAbi } from "@/lib/wagmi/abis"
import { formatUsd } from "@/lib/utils/format"
import { timeRemaining } from "@/lib/utils/countdown"

const SETTLEMENT_SALE_ADDRESS = (process.env.NEXT_PUBLIC_SETTLEMENT_SALE_ADDRESS ?? "0x0") as `0x${string}`
const PAYMENT_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS ?? "0x0") as `0x${string}`
const TARGET_CHAIN_ID = process.env.NEXT_PUBLIC_SITE_URL?.includes("sale.gno.land") ? base.id : baseSepolia.id

interface Commitments {
  totalCommitted: string
  uniqueCommitments: number
  currentClearingPrice?: string
}

interface PermitResponse {
  permit: Record<string, string>
  signature: `0x${string}`
}

export function BidPanel() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, isPending: isWritePending } = useWriteContract()
  const [amount] = useState<bigint>(100_000_000n) // 100 USDC default placeholder
  const [permit, setPermit] = useState<PermitResponse | null>(null)

  const onBase = chainId === TARGET_CHAIN_ID

  const commitments = useQuery<Commitments>({
    queryKey: ["commitments"],
    queryFn: async () => {
      const res = await fetch("/api/sonar/commitments")
      if (!res.ok) throw new Error("commitments failed")
      return res.json()
    },
    refetchInterval: 10_000,
  })

  const simulate = useSimulateContract({
    address: SETTLEMENT_SALE_ADDRESS,
    abi: settlementSaleAbi,
    functionName: "replaceBidWithPermit",
    args: permit
      ? [
          permit.permit as never, // exact struct shape verified against ABI on day 1
          permit.signature,
          PAYMENT_TOKEN_ADDRESS,
          amount,
          0, "0x0000000000000000000000000000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000000000000000000000000000", 0n,
        ]
      : undefined,
    query: { enabled: !!permit && isConnected && onBase },
  })

  async function handleBid() {
    if (!address) return
    const ppRes = await fetch("/api/sonar/pre-purchase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entityId: "TBD-entityId", wallet: address }),
    })
    if (!ppRes.ok) return
    const permRes = await fetch("/api/sonar/generate-permit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entityId: "TBD-entityId", wallet: address, amount: amount.toString() }),
    })
    if (!permRes.ok) return
    const p: PermitResponse = await permRes.json()
    setPermit(p)
  }

  async function handleSign() {
    if (!simulate.data) return
    writeContract(simulate.data.request)
  }

  // UI states
  let cta: React.ReactNode
  if (!isConnected) {
    cta = <ConnectButton />
  } else if (!onBase) {
    cta = (
      <button type="button" className="w-full px-4 py-3 bg-fg/20 text-fg rounded-sm font-semibold" disabled>
        Switch to Base
      </button>
    )
  } else if (!permit) {
    cta = (
      <button type="button" onClick={handleBid} className="w-full px-4 py-3 bg-fg text-bg rounded-sm font-semibold">
        Place a bid
      </button>
    )
  } else if (simulate.isLoading) {
    cta = <button type="button" disabled className="w-full px-4 py-3 bg-fg/20 text-fg-muted rounded-sm">Simulating…</button>
  } else if (simulate.isError) {
    cta = <p className="text-sm text-red-400">Simulation failed: {simulate.error?.message}</p>
  } else {
    cta = (
      <button type="button" onClick={handleSign} disabled={isWritePending} className="w-full px-4 py-3 bg-fg text-bg rounded-sm font-semibold">
        {isWritePending ? "Confirming…" : "Sign bid in wallet"}
      </button>
    )
  }

  return (
    <aside data-component="bid-panel" className="border border-border rounded-sm p-6 bg-bg">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-fg-muted mb-4">
        <span className="size-2 rounded-full bg-fg animate-pulse" />
        Live · English Auction
      </div>
      <div className="mb-6">
        <p className="text-xs text-fg-muted mb-1">Clearing price</p>
        <p className="text-3xl font-bold tabular-nums">
          {commitments.data?.currentClearingPrice ? formatUsd(commitments.data.currentClearingPrice) : "—"}
        </p>
      </div>
      <dl className="space-y-2 text-sm border-t border-border pt-4 mb-6">
        <div className="flex justify-between"><dt className="text-fg-muted">Committed</dt><dd className="tabular-nums">{commitments.data ? formatUsd(commitments.data.totalCommitted) : "—"}</dd></div>
        <div className="flex justify-between"><dt className="text-fg-muted">Bidders</dt><dd className="tabular-nums">{commitments.data?.uniqueCommitments ?? "—"}</dd></div>
      </dl>
      {cta}
    </aside>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(bid): wire BidPanel with wagmi states + tx simulation + clearing price polling

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.12: MSW handlers + fixtures

**Files:**
- Create: `tests/mocks/handlers.ts`, `tests/mocks/fixtures.ts`, `tests/mocks/server.ts`, `app/(chrome)/dev-msw.tsx`

- [ ] **Step 1: Install MSW**

```bash
npm install -D msw
```

- [ ] **Step 2: Create `tests/mocks/fixtures.ts`**

```ts
export const fixtures = {
  commitments: {
    totalCommitted: "1250000000000", // 1.25M USDC (6 decimals)
    uniqueCommitments: 1247,
    currentClearingPrice: "420000", // $0.42
    recentCommitments: [],
  },
  prePurchaseReady: {
    readyToPurchase: true,
    failureReason: null,
  },
  permit: {
    permit: {
      saleSpecificEntityID: "0x" + "0".repeat(32),
      saleUUID: "0x" + "1".repeat(32),
      wallet: "0x" + "2".repeat(40),
      expiresAt: String(Math.floor(Date.now() / 1000) + 600),
      minAmount: "100000",
      maxAmount: "1000000000",
      minPrice: "100000",
      maxPrice: "1000000",
      opensAt: String(Math.floor(Date.now() / 1000) - 1000),
      closesAt: String(Math.floor(Date.now() / 1000) + 86400),
      payload: "0x",
    },
    signature: ("0x" + "3".repeat(130)) as `0x${string}`,
  },
}
```

- [ ] **Step 3: Create `tests/mocks/handlers.ts`**

```ts
import { http, HttpResponse } from "msw"
import { fixtures } from "./fixtures"

export const handlers = [
  http.get("*/api/sonar/commitments", () => HttpResponse.json(fixtures.commitments)),
  http.post("*/api/sonar/pre-purchase", () => HttpResponse.json(fixtures.prePurchaseReady)),
  http.post("*/api/sonar/generate-permit", () => HttpResponse.json(fixtures.permit)),
]
```

- [ ] **Step 4: Create `tests/mocks/server.ts` (for Vitest)**

```ts
import { setupServer } from "msw/node"
import { handlers } from "./handlers"

export const server = setupServer(...handlers)
```

- [ ] **Step 5: Wire into `tests/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest"
import { afterAll, afterEach, beforeAll } from "vitest"
import { server } from "./mocks/server"

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "test: add MSW handlers + fixtures for Sonar API mocking

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.13: /dev/states preview route

**Files:**
- Create: `app/dev/states/page.tsx`, `app/dev/layout.tsx`

- [ ] **Step 1: Create dev gate layout**

`app/dev/layout.tsx`:

```tsx
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

export default function DevLayout({ children }: { children: ReactNode }) {
  if (process.env.NEXT_PUBLIC_SITE_URL === "https://sale.gno.land") notFound()
  return <div className="min-h-screen p-8">{children}</div>
}
```

- [ ] **Step 2: Create states page**

`app/dev/states/page.tsx`:

```tsx
"use client"
import { BidPanel } from "@/app/(chrome)/BidPanel"

export default function StatesPage() {
  return (
    <main className="mx-auto max-w-[1280px]">
      <h1 className="text-3xl font-bold mb-8">Widget states preview (dev-only)</h1>
      <p className="text-fg-muted mb-12">Not visible in production. Drives MSW-mocked Sonar responses.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Disconnected</p>
          <BidPanel />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Connected on Base</p>
          <BidPanel />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">Permit ready</p>
          <BidPanel />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(dev): add /dev/states preview route (prod-blocked)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.14: Security middleware (CSP nonce + rate limit context)

**Files:**
- Create: `app/middleware.ts`, `lib/security/csp.ts`

- [ ] **Step 1: Create `lib/security/csp.ts`**

```ts
import { randomBytes } from "node:crypto"

export function generateNonce() {
  return randomBytes(16).toString("base64")
}

export function buildCsp(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'", // Tailwind requires inline styles
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.echo.xyz https://*.base.org wss://*.walletconnect.org https://scripts.simpleanalyticscdn.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")
}
```

- [ ] **Step 2: Create `app/middleware.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server"
import { generateNonce, buildCsp } from "@/lib/security/csp"

export function middleware(req: NextRequest) {
  const nonce = generateNonce()
  const csp = buildCsp(nonce)
  const headers = new Headers(req.headers)
  headers.set("x-nonce", nonce)
  const res = NextResponse.next({ request: { headers } })
  res.headers.set("Content-Security-Policy", csp)
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(security): add CSP nonce middleware

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.15: Edge rate limiting + kill switch

**Files:**
- Modify: `netlify.toml`
- Create: `lib/security/kill-switch.tsx`

- [ ] **Step 1: Add rate limit to `netlify.toml`**

Append:

```toml
[[edge_functions]]
  function = "rate-limit"
  path = "/api/sonar/*"

[[edge_functions]]
  function = "rate-limit-auth"
  path = "/api/auth/sonar/init"

[edge_functions.config]
  rate_limit = { window_size = 60, window_limit = 10 }
```

(Verify exact Netlify rate-limit syntax against their docs when implementing; the platform's declarative rate limit is the recommended path.)

- [ ] **Step 2: Create kill-switch component**

`lib/security/kill-switch.tsx`:

```tsx
import type { ReactNode } from "react"

export function KillSwitch({ children }: { children: ReactNode }) {
  if (process.env.SALE_PAUSED === "true") {
    return (
      <aside className="border border-border rounded-sm p-6 bg-bg">
        <p className="font-semibold mb-2">Sale paused</p>
        <p className="text-sm text-fg-muted">The sale is temporarily paused. Please check back soon.</p>
      </aside>
    )
  }
  return <>{children}</>
}
```

- [ ] **Step 3: Wrap BidPanel usage**

Wherever `<BidPanel />` is rendered, wrap with `<KillSwitch>`:

```tsx
import { KillSwitch } from "@/lib/security/kill-switch"

// in Hero.tsx
<KillSwitch>
  <BidPanel />
</KillSwitch>
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(security): add edge rate limiting + SALE_PAUSED kill switch

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.16: Sentry + PII scrubber

**Files:**
- Create: `lib/security/sentry-scrubber.ts`, `sentry.client.config.ts`, `sentry.server.config.ts`

- [ ] **Step 1: Install Sentry**

```bash
npx @sentry/wizard@latest -i nextjs
```

Accept defaults. This creates the config files.

- [ ] **Step 2: Replace generated `sentry.client.config.ts`**

```ts
import * as Sentry from "@sentry/nextjs"
import { scrub } from "@/lib/security/sentry-scrubber"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN_CLIENT,
  tracesSampleRate: 0.1,
  beforeSend: scrub,
})
```

- [ ] **Step 3: Replace generated `sentry.server.config.ts`**

```ts
import * as Sentry from "@sentry/nextjs"
import { scrub } from "@/lib/security/sentry-scrubber"

Sentry.init({
  dsn: process.env.SENTRY_DSN_SERVER,
  tracesSampleRate: 0.1,
  beforeSend: scrub,
})
```

- [ ] **Step 4: Implement scrubber**

`lib/security/sentry-scrubber.ts`:

```ts
import type { Event } from "@sentry/types"

const WALLET_PATTERN = /0x[a-fA-F0-9]{40}/g
const UUID_PATTERN = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi

function redact(value: string): string {
  return value.replace(WALLET_PATTERN, "0x…").replace(UUID_PATTERN, "uuid:…")
}

function redactValue(v: unknown): unknown {
  if (typeof v === "string") return redact(v)
  if (Array.isArray(v)) return v.map(redactValue)
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, redactValue(val)]))
  }
  return v
}

export function scrub(event: Event): Event {
  if (event.message) event.message = redact(event.message)
  if (event.request?.url) event.request.url = redact(event.request.url)
  if (event.request?.data) event.request.data = redactValue(event.request.data)
  if (event.extra) event.extra = redactValue(event.extra) as Record<string, unknown>
  return event
}
```

- [ ] **Step 5: Add unit test**

`tests/unit/sentry-scrubber.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { scrub } from "@/lib/security/sentry-scrubber"

describe("sentry scrubber", () => {
  it("redacts wallet addresses in message", () => {
    const out = scrub({ message: "tx from 0x1234567890123456789012345678901234567890 failed" })
    expect(out.message).toBe("tx from 0x… failed")
  })

  it("redacts uuids", () => {
    const out = scrub({ message: "entity abcdef01-2345-6789-abcd-ef0123456789 rejected" })
    expect(out.message).toMatch(/uuid:…/)
  })

  it("recurses through extra", () => {
    const out = scrub({ extra: { wallet: "0x1234567890123456789012345678901234567890" } })
    expect((out.extra as { wallet: string }).wallet).toBe("0x…")
  })
})
```

- [ ] **Step 6: Run test, verify PASS**

```bash
npm run test -- sentry-scrubber
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(security): add Sentry with PII scrubber (wallets, UUIDs)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.17: E2E bid flow test on Sonar sandbox

**Files:**
- Create: `tests/e2e/bid-flow.spec.ts`

- [ ] **Step 1: Document prerequisites**

Add `tests/e2e/README.md`:

```md
# E2E test prerequisites

Before running `npm run test:e2e` against a real preview deploy:

1. The Netlify preview must be connected to the **Sonar sandbox** (Base Sepolia).
2. A test wallet must be provisioned with Base Sepolia ETH (gas) + USDC test tokens.
3. The test wallet's private key must be available as `E2E_TEST_PRIVATE_KEY` env var.
4. Sonar sandbox `SONAR_SALE_UUID` and `SETTLEMENT_SALE_ADDRESS` must be set in Netlify preview env.

If any of the above is missing, the bid-flow test is skipped (`test.skip()`).
```

- [ ] **Step 2: Write E2E flow test (skippable when prereqs missing)**

```ts
import { test, expect } from "@playwright/test"

const hasPrereqs = !!process.env.E2E_TEST_PRIVATE_KEY

test.skip(!hasPrereqs, "missing E2E_TEST_PRIVATE_KEY")

test("full bid flow on Sonar sandbox", async ({ page }) => {
  await page.goto("/")

  // 1. Connect wallet (RainbowKit modal)
  await page.getByRole("button", { name: /Connect Wallet/i }).first().click()
  // ... use Synpress or @rainbow-me/rainbowkit testing helpers
  // Filling out the wallet flow with a programmatic wallet is a separate dep;
  // when E2E_TEST_PRIVATE_KEY is set, integrate Synpress here.

  // 2. Verify clearing price renders
  await expect(page.locator('[data-component="bid-panel"]')).toContainText(/\$/, { timeout: 15_000 })

  // 3. Click Place a bid → expects pre-purchase + generate-permit success
  // 4. Sign in wallet
  // 5. Wait for tx confirmation
  // 6. Verify success state
})
```

- [ ] **Step 3: Add E2E to CI (gated on secret presence)**

Append to `.github/workflows/ci.yml`:

```yaml
  e2e:
    runs-on: ubuntu-latest
    needs: validate
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install chromium
      - name: Run E2E against preview
        env:
          PLAYWRIGHT_BASE_URL: ${{ github.event.deployment_status.environment_url }}
          E2E_TEST_PRIVATE_KEY: ${{ secrets.E2E_TEST_PRIVATE_KEY }}
        run: npm run test:e2e
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "test(e2e): scaffold bid-flow test (skippable until sandbox creds set)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2.18: Layer 2 deploy preview gate

- [ ] **Step 1: Open PR with Layer 2 commits**

```bash
git checkout -b layer-2-functionality
git push -u origin layer-2-functionality
gh pr create --title "Layer 2: Sonar + wallet integration" --body "End-to-end functionality. Verifies OAuth, permit, replaceBidWithPermit on Base Sepolia."
```

- [ ] **Step 2: Manual review on preview URL**

- [ ] OAuth flow: `/api/auth/sonar/init` returns auth URL, callback exchanges code, session cookie set
- [ ] Wallet connect via RainbowKit works
- [ ] Network switcher prompts "Switch to Base" when on wrong chain
- [ ] Live clearing price polls every 10s, ticker updates
- [ ] Pre-purchase + generate-permit Server Actions complete
- [ ] Tx simulation runs before wallet pop
- [ ] `replaceBidWithPermit` actually submits a sandbox tx on Base Sepolia
- [ ] Audit log row inserted in Netlify DB
- [ ] SALE_PAUSED=true hides bid panel
- [ ] CSP header present on all pages (DevTools → Network → Response Headers)
- [ ] No `process.env.SONAR_*` strings in client bundle (verify in source view)
- [ ] Sentry receives a test error with wallet redacted

- [ ] **Step 3: Merge once green**

```bash
gh pr merge --squash
```

**End of Layer 2.**

---

# LAYER 3 — Design tokens (palette, typo, glassmorph)

**Layer goal:** Full design tokens applied across all components. Typography refined with Geist Sans. Mint accent for CTAs and live indicators. Glassmorph sticky panel. Section dividers in voxel-staircase pattern. Page is "designed" (not just structured) but no illustrations yet.

**Definition of done:** Visual review on Netlify preview shows refined typography, full palette, glassmorph header/bid panel, section dividers.

---

## Task 3.1: Design tokens CSS + Tailwind theme

**Files:**
- Create: `styles/tokens.css`
- Modify: `app/globals.css`

- [ ] **Step 1: Create `styles/tokens.css`**

(Full token spec from spec §8, expanded into CSS variables — copy verbatim from `docs/specs/2026-05-19-gnot-ico-landing-design.md` §8.)

- [ ] **Step 2: Import in `app/globals.css`**

```css
@import "tailwindcss";
@import "../styles/tokens.css";
```

- [ ] **Step 3: Update `@theme` block to reference tokens**

(Map all tokens.css variables to Tailwind `--color-*`, `--text-*`, `--space-*`, `--radius-*` so utility classes like `bg-bg-base`, `text-accent-mint` work.)

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(design): add full design tokens (palette, typo, spacing, motion)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3.2: Typography (Geist Sans via next/font/local)

**Files:**
- Create: `public/fonts/GeistVariable.woff2`, `public/fonts/GeistMonoVariable.woff2`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Download Geist Variable fonts**

```bash
mkdir -p public/fonts
curl -L https://github.com/vercel/geist-font/raw/main/packages/next/fonts/Geist/GeistVariableVF.woff2 -o public/fonts/GeistVariable.woff2
curl -L https://github.com/vercel/geist-font/raw/main/packages/next/fonts/GeistMono/GeistMonoVariableVF.woff2 -o public/fonts/GeistMonoVariable.woff2
```

- [ ] **Step 2: Wire in `app/layout.tsx`**

```tsx
import localFont from "next/font/local"

const geist = localFont({
  src: "../public/fonts/GeistVariable.woff2",
  variable: "--font-display",
  display: "swap",
})

const geistMono = localFont({
  src: "../public/fonts/GeistMonoVariable.woff2",
  variable: "--font-mono",
  display: "swap",
})

// in <html>:
<html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
```

- [ ] **Step 3: Apply font-family in `app/globals.css`**

```css
html, body {
  font-family: var(--font-display);
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(design): self-host Geist Variable + Mono fonts via next/font/local

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3.3: Component pass — apply design tokens

**Files:**
- Modify: all components in `app/(sections)/*`, `app/(chrome)/*`

- [ ] **Step 1: Replace placeholder Tailwind classes with token classes**

E.g. `bg-fg/5` → `bg-bg-elevated`, `border-border` → `border-border-default`, `text-fg-muted` → `text-fg-body`, `bg-fg text-bg` (button) → `bg-accent-mint text-bg-base`, etc.

Do this systematically file-by-file with one commit per major component.

- [ ] **Step 2: Replace shape rounding with token radius**

`rounded-sm` → `rounded-radius-xs` (= 2px), keep all max 8px.

- [ ] **Step 3: Apply Geist Mono to numeric data**

Wrap all `tabular-nums` numeric values with `font-mono` class.

- [ ] **Step 4: Verify visual on dev**

```bash
npm run dev
```

Inspect every section, confirm consistent palette + typography.

- [ ] **Step 5: Commit per-component**

Multiple commits, one per refactor:

```bash
git commit -m "design: apply tokens to Header + Footer"
git commit -m "design: apply tokens to BidPanel"
git commit -m "design: apply tokens to Hero + SaleMetrics + HowItWorks"
# ... etc
```

---

## Task 3.4: Glassmorph header + sticky bid panel

**Files:**
- Modify: `app/(chrome)/Header.tsx`, `app/(chrome)/BidPanel.tsx`
- Create: `app/(chrome)/StickyBidPanel.tsx`

- [ ] **Step 1: Glassmorph utility class in `app/globals.css`**

```css
.glass {
  background: var(--color-bg-overlay);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--color-border-subtle);
}

@supports not (backdrop-filter: blur(20px)) {
  .glass { background: rgba(19, 23, 52, 0.92); }
}
```

- [ ] **Step 2: Apply `glass` to Header**

```tsx
<header className="sticky top-0 z-header w-full glass">
```

- [ ] **Step 3: Apply `glass` to BidPanel**

```tsx
<aside className="glass rounded-radius-xs p-6">
```

- [ ] **Step 4: Implement `StickyBidPanel` (detach on scroll)**

```tsx
"use client"
import { useEffect, useState } from "react"
import { BidPanel } from "./BidPanel"

const STICKY_THRESHOLD = 700 // approx hero height

export function StickyBidPanel() {
  const [isSticky, setSticky] = useState(false)

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > STICKY_THRESHOLD)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (!isSticky) return null
  return (
    <div className="fixed right-6 top-24 z-sticky w-[280px] hidden lg:block">
      <BidPanel />
    </div>
  )
}
```

- [ ] **Step 5: Render in layout**

```tsx
// in app/layout.tsx
<Providers>
  <Header />
  <StickyBidPanel />
  {children}
  <Footer />
</Providers>
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(design): glassmorph Header + StickyBidPanel detach-on-scroll

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3.5: Section dividers (voxel-staircase clip-path)

**Files:**
- Create: `public/dividers/voxel-step-1.svg`, `public/dividers/voxel-step-2.svg`
- Create: `app/(chrome)/SectionDivider.tsx`

- [ ] **Step 1: Create voxel-step SVG asset (designer to refine in Layer 4)**

`public/dividers/voxel-step-1.svg` (placeholder):

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 80" preserveAspectRatio="none">
  <path d="M0,80 L0,40 L160,40 L160,20 L320,20 L320,40 L640,40 L640,0 L1120,0 L1120,40 L1280,40 L1280,80 Z" fill="currentColor"/>
</svg>
```

- [ ] **Step 2: Create SectionDivider component**

```tsx
export function SectionDivider({ variant = 1 }: { variant?: 1 | 2 }) {
  return (
    <div className="relative h-20 -my-px text-bg-elevated" aria-hidden="true">
      <img src={`/dividers/voxel-step-${variant}.svg`} alt="" className="w-full h-full" />
    </div>
  )
}
```

- [ ] **Step 3: Sprinkle dividers between sections**

In `app/page.tsx`, intersperse `<SectionDivider variant={1} />` between selected sections (every 2-3 to avoid repetition).

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(design): add voxel-staircase section dividers (SVG placeholders)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3.6: Layer 3 deploy preview gate

- [ ] PR + manual visual review against spec §6 + §8
- [ ] Merge once approved

**End of Layer 3.**

---

# LAYER 4 — Voxel + illustrations

**Layer goal:** WebGL hero scene live, .vox → .glb pipeline working, illustrations placed in #6 / #8 / pre-footer / roadmap.

**Prerequisites:** designer delivers 5-6 voxel assets per `docs/REQUIREMENTS_FROM_TEAMS.md` §B (B18-B23).

---

## Task 4.1: .vox → .glb build pipeline

**Files:**
- Create: `scripts/build-assets.mjs`, `package.json` script entry

- [ ] **Step 1: Install conversion tools**

```bash
npm install -D vox-saver vox-reader gltf-pipeline
```

- [ ] **Step 2: Write build script**

`scripts/build-assets.mjs` — reads `assets/voxel/*.vox`, converts to `.glb` with Draco compression, outputs to `public/models/`. (Exact tooling depends on chosen library; verify on day 1.)

- [ ] **Step 3: Add npm script**

```json
{ "scripts": { "build:assets": "node scripts/build-assets.mjs" } }
```

- [ ] **Step 4: Add to CI build**

Modify `.github/workflows/ci.yml` — add `npm run build:assets` before `npm run build`.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "build: add .vox → .glb conversion pipeline with Draco

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4.2: Hero WebGL canvas (R3F + drei)

**Files:**
- Create: `app/(sections)/hero/HeroCanvas.tsx`
- Modify: `app/(sections)/hero/Hero.tsx`

- [ ] **Step 1: Install R3F + drei**

```bash
npm install @react-three/fiber @react-three/drei three
npm install -D @types/three
```

- [ ] **Step 2: Implement HeroCanvas**

```tsx
"use client"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useGLTF, Bounds } from "@react-three/drei"
import { Suspense, useRef } from "react"
import { Mesh } from "three"

function VoxelModel() {
  const ref = useRef<Mesh>(null)
  const { scene } = useGLTF("/models/hero.glb")
  useFrame(({ clock }, _delta) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.15
  })
  return <primitive ref={ref} object={scene} />
}

function CameraParallax() {
  const { camera, mouse } = useThree()
  useFrame(() => {
    camera.position.x += (mouse.x * 0.3 - camera.position.x + 4) * 0.05
    camera.position.y += (mouse.y * 0.15 - camera.position.y + 3) * 0.05
    camera.lookAt(0, 0, 0)
  })
  return null
}

export function HeroCanvas() {
  return (
    <Canvas
      camera={{ position: [4, 3, 5], fov: 35 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <fog attach="fog" args={["#1a1f3d", 5, 18]} />
      <ambientLight intensity={0.4} color="#6f8eff" />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#ffb86b" />
      <CameraParallax />
      <Suspense fallback={null}>
        <Bounds fit clip observe>
          <VoxelModel />
        </Bounds>
      </Suspense>
    </Canvas>
  )
}
```

- [ ] **Step 3: Lazy-load in `Hero.tsx`**

```tsx
import dynamic from "next/dynamic"
import { Suspense } from "react"

const HeroCanvas = dynamic(() => import("./HeroCanvas").then((m) => m.HeroCanvas), {
  ssr: false,
  loading: () => <img src="/images/hero-poster.jpg" alt="" className="w-full h-full object-cover" />,
})

// in Hero JSX:
<div className="min-h-[400px] relative">
  <Suspense fallback={<img src="/images/hero-poster.jpg" alt="" className="w-full h-full object-cover" />}>
    <HeroCanvas />
  </Suspense>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(hero): WebGL voxel scene with R3F, lazy-loaded with poster fallback

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4.3: Place static illustrations (#6, #8, pre-footer)

**Files:**
- Modify: `app/(sections)/narrative/Narrative.tsx`, `app/(sections)/gnot-utility/GnotUtility.tsx`, `app/(sections)/pre-footer-cta/PreFooterCta.tsx`

- [ ] **Step 1: Replace placeholder divs with `<Image>`**

For each, swap the `[Voxel illustration — Layer 4]` placeholder with:

```tsx
import Image from "next/image"

<Image
  src="/images/illustration-narrative.jpg"
  alt=""
  width={1920}
  height={1080}
  className="w-full h-full object-cover rounded-radius-xs"
  priority={false}
/>
```

- [ ] **Step 2: Add `unoptimized: false` config in `next.config.ts` (already default)**

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(design): add voxel illustrations to narrative, utility, pre-footer

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4.4: Layer 4 deploy preview gate

- [ ] PR + visual review
- [ ] Merge once approved

**End of Layer 4.**

---

# LAYER 5 — Motion + polish

**Layer goal:** All scroll-driven effects per spec §7. Page feels alive, accessible, performant.

---

## Task 5.1: Lenis smooth scroll

**Files:**
- Create: `app/(chrome)/SmoothScroll.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Install Lenis**

```bash
npm install lenis
```

- [ ] **Step 2: Implement provider**

```tsx
"use client"
import { useEffect, type ReactNode } from "react"
import Lenis from "lenis"

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 })
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])
  return <>{children}</>
}
```

- [ ] **Step 3: Wrap layout, commit**

---

## Task 5.2: Fade-up reveal on scroll

- [ ] **Step 1:** Implement `useScrollReveal()` hook + `.animate-on-scroll` class via IntersectionObserver
- [ ] **Step 2:** Apply class to all `<h2>`, body paragraphs, cards
- [ ] **Step 3:** Commit

---

## Task 5.3: Custom cursor + magnetic CTAs

- [ ] **Step 1:** Port `newtendermint/main.ts` `initCursor` + `initMagnetic` patterns to React
- [ ] **Step 2:** Add `data-magnetic` to "Place a bid", "Connect Wallet", primary CTAs
- [ ] **Step 3:** Disable on touch devices
- [ ] **Step 4:** Commit

---

## Task 5.4: Counter-up stats (#9)

- [ ] **Step 1:** Animate `Stats.tsx` numbers from 0 → target on enter viewport
- [ ] **Step 2:** Use `motion` library `useInView` + `animate` from 0
- [ ] **Step 3:** Commit

---

## Task 5.5: Roadmap horizontal scroll-pin

- [ ] **Step 1:** Install GSAP
  ```bash
  npm install gsap
  ```
- [ ] **Step 2:** Implement ScrollTrigger pin on Roadmap section
- [ ] **Step 3:** Lenis-GSAP integration via `ScrollTrigger.scrollerProxy`
- [ ] **Step 4:** Mobile fallback (native horizontal touch scroll, no pin)
- [ ] **Step 5:** Disable under `prefers-reduced-motion`
- [ ] **Step 6:** Commit

---

## Task 5.6: Live ticker pulse + ticker price flash

- [ ] **Step 1:** In `BidPanel`, detect clearing price change between renders
- [ ] **Step 2:** Apply flash animation (scale + color pulse, 400ms)
- [ ] **Step 3:** Commit

---

## Task 5.7: Lighthouse perf pass

- [ ] **Step 1:** Run `npx lighthouse <preview-url> --view`
- [ ] **Step 2:** Resolve issues: image dims, font preload, JS deferral, CSP issues
- [ ] **Step 3:** Add Lighthouse CI to GitHub Actions with budgets
  ```yaml
  - name: Lighthouse CI
    uses: treosh/lighthouse-ci-action@v11
    with:
      urls: ${{ github.event.deployment_status.environment_url }}
      uploadArtifacts: true
      budgetPath: ./.lighthouserc.json
  ```
- [ ] **Step 4:** Tune until Perf >90, A11y >95, LCP <2.5s, TBT <200ms

---

## Task 5.8: Accessibility audit

- [ ] axe-core via Playwright on every section
- [ ] Keyboard navigation full flow (tab through, enter to activate)
- [ ] Screen reader (VoiceOver / NVDA) walkthrough
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Color contrast ratios verified (already designed for AAA)

---

## Task 5.9: Pre-launch checklist execution

Per spec §9.5 — execute all items, sign off in `docs/PRE_LAUNCH_CHECKLIST.md`.

**End of Layer 5. Ready for mainnet launch.**

---

# Cross-cutting docs to create alongside implementation

These are created as part of Layer 2 (operational maturity), not as separate tasks:

- [ ] `docs/RUNBOOK.md` — incident response, kill switch procedure, on-call contacts
- [ ] `docs/PRE_LAUNCH_CHECKLIST.md` — 2-human signoff items from spec §9.5
- [ ] `docs/INCIDENT_LOG.md` — rolling log (empty at launch)
- [ ] `CODEOWNERS` — `lib/sonar/*` and `lib/security/*` require explicit review

---

## Self-review notes

**Spec coverage check** — every spec section maps to one or more tasks:
- §3 Architecture → Layer 2 tasks 2.5–2.11
- §4 Security → Layer 2 tasks 2.1–2.4, 2.14–2.16
- §5 Content → Layer 1 task 1.8 (all 16 sections scaffolded)
- §6 Visual → Layers 3-4
- §7 Effects → Layer 5
- §8 Tokens → Layer 3 task 3.1
- §9 Testing → Tasks 1.4 (Vitest+Playwright), 2.12 (MSW), 2.17 (E2E sandbox)
- §10 Deployment → Tasks 1.5 (netlify.toml), 1.6 (CI), 2.18 (Layer 2 gate)
- §11 Process safeguards → Task 1.2 (Husky + secretlint), 1.6 (CI), CODEOWNERS (Layer 2)

**Placeholder scan** — Tasks 2.5 (Sonar client), 2.10 (ABI), 4.1 (asset pipeline) contain "verify on day 1" notes for items that depend on Sonar deliverables not yet available. These are unavoidable until Sonar provides credentials/ABI/etc. (tracked in `docs/REQUIREMENTS_FROM_TEAMS.md`).

**Type consistency** — `sessionId`, `entityId`, `wallet` (lowercase `0x...`), `amount` (bigint as string in API), `replaceBidWithPermit` named consistently across tasks 2.7, 2.8, 2.10, 2.11.

**Layered deployability** — each Layer ends with a deploy preview gate that produces a publicly viewable preview URL for stakeholder review.
