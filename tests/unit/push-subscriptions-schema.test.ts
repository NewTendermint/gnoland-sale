import { describe, expect, it } from "vitest"
import { pushSubscriptionInsertSchema } from "../../lib/db/schema"

const base = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  p256dh: "BFooo",
  auth: "Baaar",
  bidLimitUsd: 0.1,
}

describe("pushSubscriptionInsertSchema", () => {
  it("accepts a well-formed subscription", () => {
    expect(pushSubscriptionInsertSchema.safeParse(base).success).toBe(true)
  })

  it("rejects a non-https endpoint", () => {
    expect(
      pushSubscriptionInsertSchema.safeParse({ ...base, endpoint: "http://evil.test/x" }).success,
    ).toBe(false)
  })

  it("rejects a valid https endpoint on a non-provider host (SSRF/amplification guard)", () => {
    expect(
      pushSubscriptionInsertSchema.safeParse({ ...base, endpoint: "https://evil.test/x" }).success,
    ).toBe(false)
  })

  it("accepts the major push-service hosts", () => {
    for (const endpoint of [
      "https://updates.push.services.mozilla.com/wpush/v2/abc",
      "https://wns2-by3p.notify.windows.com/w/?token=abc",
      "https://web.push.apple.com/abc",
    ]) {
      expect(pushSubscriptionInsertSchema.safeParse({ ...base, endpoint }).success).toBe(true)
    }
  })

  it("rejects a negative bid limit", () => {
    expect(pushSubscriptionInsertSchema.safeParse({ ...base, bidLimitUsd: -1 }).success).toBe(false)
  })

  it("rejects unknown fields (strict, no PII smuggling)", () => {
    expect(pushSubscriptionInsertSchema.safeParse({ ...base, wallet: "0xabc" }).success).toBe(false)
  })
})
