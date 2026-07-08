import { chromium, request } from "@playwright/test"
import { APP_URL, RPC_PORT } from "./support/constants"
import { startRpcStub } from "./support/rpc-stub/server"
import { sonarLogin } from "./support/sonar"

/** One throwaway run of the journey the specs drive - login, land on the auto-opened bid panel,
 *  wait for the picker - plus a hit on every API route, so next dev compiles everything before
 *  any test's clock starts. dev compiles routes and chunks lazily on first use; a URL fetch of
 *  "/" alone leaves the post-login client path cold, and whichever test hits it first eats a
 *  cold compile (up to ~1min on a loaded CI runner) and times out. Response statuses on the API
 *  warms are irrelevant; triggering the compile is the point. */
async function warmAppCompile(): Promise<void> {
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ baseURL: APP_URL })
    const page = await context.newPage()
    page.setDefaultTimeout(120_000)
    await sonarLogin(page)
    // The ?auth=ok landing auto-opens the bid panel; the picker copy rendering means the whole
    // logged-in client path (panel content, journey gates, connectors) has compiled.
    await page.getByText("Connect your wallet.").waitFor({ timeout: 120_000 })
  } finally {
    await browser.close()
  }
  const api = await request.newContext({ baseURL: APP_URL, timeout: 120_000 })
  try {
    await Promise.all([
      api.get("/api/sonar/commitments"),
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
