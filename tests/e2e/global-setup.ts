import { chromium, request } from "@playwright/test"
import { APP_URL, RPC_PORT } from "./support/constants"
import { startRpcStub } from "./support/rpc-stub/server"

/** One throwaway page load plus a hit on every API route the specs touch, so next dev compiles
 *  them all before any test's clock starts - without this, whichever test runs first eats a
 *  cold route compile (up to ~1min on a loaded machine) and times out. Response statuses are
 *  irrelevant; triggering the compile is the point. */
async function warmAppCompile(): Promise<void> {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(APP_URL, { waitUntil: "networkidle", timeout: 120_000 })
  } finally {
    await browser.close()
  }
  const api = await request.newContext({ baseURL: APP_URL, timeout: 120_000 })
  try {
    await api.post("/api/auth/sonar/init")
    await Promise.all([
      api.get("/api/sonar/commitments"),
      api.get("/api/sonar/entity"),
      api.get("/api/sonar/my-position"),
      api.post("/api/sonar/pre-purchase"),
      api.post("/api/sonar/generate-permit"),
    ])
  } finally {
    await api.dispose()
  }
}

/** Starts the sepolia RPC stub once for the whole run and warms the dev server; the returned
 *  function is Playwright's global teardown. */
export default async function globalSetup(): Promise<() => Promise<void>> {
  const server = startRpcStub(RPC_PORT)
  await warmAppCompile()
  return () =>
    new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()))
    })
}
