import type { Page } from "@playwright/test"
import { z } from "zod"

const initResponseSchema = z.object({ authorizationUrl: z.string() })

/** Mock Sonar login (SONAR_MOCK=1): POST /api/auth/sonar/init sets the session cookie and answers
 *  {authorizationUrl:"/?auth=ok"} (app/api/auth/sonar/init/route.ts); visiting that URL
 *  auto-opens the bid panel (SaleProvider consumes ?auth=ok). The mock entity is
 *  COMPLETE/ELIGIBLE, so the panel lands straight on the wallet picker. */
export async function sonarLogin(page: Page): Promise<void> {
  // Bounded retry: next dev sheds keep-alive connections mid-compile (ECONNRESET) - a transport
  // hiccup, not an app failure. A non-2xx response still fails immediately.
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    let response: Awaited<ReturnType<typeof page.request.post>>
    try {
      response = await page.request.post("/api/auth/sonar/init")
    } catch (err) {
      lastError = err
      await page.waitForTimeout(500)
      continue
    }
    if (!response.ok()) {
      throw new Error(`sonarLogin: /api/auth/sonar/init responded ${response.status()}`)
    }
    const { authorizationUrl } = initResponseSchema.parse(await response.json())
    await page.goto(authorizationUrl)
    return
  }
  throw new Error(`sonarLogin: /api/auth/sonar/init unreachable after 3 attempts: ${lastError}`)
}
