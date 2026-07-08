import { defineConfig, devices } from "@playwright/test"
import { APP_PORT, APP_URL, RPC_URL } from "./tests/e2e/support/constants"

export default defineConfig({
  testDir: "./tests/e2e/specs",
  fullyParallel: true,
  // next dev compiles routes on demand from a single process; too many workers hitting it at
  // once causes compile-queue contention and flaky timeouts, not real bugs.
  workers: 2,
  // A retried pass is reported as "flaky", never silently green. One local retry absorbs the
  // stone-cold first-run compile stall; CI runners are slower and shared, so they get two.
  retries: process.env.CI ? 2 : 1,
  reporter: "list",
  globalSetup: "./tests/e2e/global-setup.ts",
  // Headroom over the default 30s: next dev still compiles route chunks on demand mid-test,
  // and a compile can stall an otherwise-instant click past 30s on a loaded machine.
  timeout: 60_000,
  expect: {
    // next dev pacing (BidFlow's devStepPause) is slower than a production build.
    timeout: 15_000,
  },
  use: {
    baseURL: APP_URL,
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    // lib/motion/should-animate.ts gates every entrance/scroll-driven animation on
    // prefers-reduced-motion; disabling them here is the app's own escape hatch, not a workaround.
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `./node_modules/.bin/next dev --port ${APP_PORT}`,
    url: APP_URL,
    reuseExistingServer: !process.env.CI,
    // next dev cold compile, first request included.
    timeout: 180_000,
    env: {
      SONAR_MOCK: "1",
      SALE_CHAIN: "sepolia",
      NEXT_PUBLIC_SALE_CHAIN: "sepolia",
      NEXT_PUBLIC_SEPOLIA_RPC_URL: RPC_URL,
      // Hermetic: nothing here should ever reach real mainnet infra either.
      NEXT_PUBLIC_MAINNET_RPC_URL: RPC_URL,
      // Force the sale into its live phase regardless of the real Sonar-dashboard dates.
      NEXT_PUBLIC_REGISTRATION_OPENS: "2020-01-01T00:00:00Z",
      NEXT_PUBLIC_SALE_OPENS: "2020-01-01T00:00:00Z",
      NEXT_PUBLIC_SALE_CLOSES: "2099-01-01T00:00:00Z",
      // lib/env.ts boot vars - throwaway values, same pattern as vitest.config.ts.
      SONAR_CLIENT_UUID: "test-client-uuid",
      SONAR_REDIRECT_URI: "https://example.test/api/auth/sonar/callback",
      SONAR_SALE_UUID: "test-sale-uuid",
      SONAR_API_BASE_URL: "https://api.example.test",
      ENCRYPTION_KEY: "a".repeat(64),
      IP_HMAC_PEPPER: "b".repeat(64),
      SESSION_PASSWORD: "x".repeat(40),
    },
  },
})
