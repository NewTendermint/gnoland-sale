import { describe, expect, it } from "vitest"
import { HttpError } from "../../../lib/sale/api"
import { sonarQueryRetry, sonarQueryRetryDelay } from "../../../lib/sale/query-retry"

const rateLimited = new HttpError(429, "throttled")
const serverError = new HttpError(502, "bad gateway")

describe("sonarQueryRetry", () => {
  it("retries a 429 at most twice", () => {
    expect(sonarQueryRetry(0, rateLimited)).toBe(true)
    expect(sonarQueryRetry(1, rateLimited)).toBe(true)
    expect(sonarQueryRetry(2, rateLimited)).toBe(false)
  })
  it("retries other failures up to three times", () => {
    expect(sonarQueryRetry(2, serverError)).toBe(true)
    expect(sonarQueryRetry(3, serverError)).toBe(false)
    expect(sonarQueryRetry(2, new TypeError("network"))).toBe(true)
  })
})

describe("sonarQueryRetryDelay", () => {
  it("waits past the rate-limit window on a 429 instead of hammering it", () => {
    expect(sonarQueryRetryDelay(0, rateLimited)).toBe(61_000)
    expect(sonarQueryRetryDelay(1, rateLimited)).toBe(61_000)
  })
  it("uses capped exponential backoff for other failures", () => {
    expect(sonarQueryRetryDelay(0, serverError)).toBe(1_000)
    expect(sonarQueryRetryDelay(1, serverError)).toBe(2_000)
    expect(sonarQueryRetryDelay(10, serverError)).toBe(30_000)
  })
})
