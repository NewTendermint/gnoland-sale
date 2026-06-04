import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { readCommitments } from "../../lib/sonar/commitments"
import { getEntity } from "../../lib/sonar/entity"
import { generatePurchasePermit } from "../../lib/sonar/permit"

// These tests exercise the mock seam, so enable it here only (not globally, so
// the permit tests still cover the real refresh/coalescing path).
beforeAll(() => {
  vi.stubEnv("SONAR_MOCK", "1")
})
afterAll(() => {
  vi.unstubAllEnvs()
})

// End-to-end through the REAL plumbing: readCommitments -> real sonar-core SDK
// (createClient) -> injected mock fetch (SONAR_MOCK=1 in the test env) -> fixture
// -> mapCommitmentData. Proves the fixture seam works through the actual SDK and
// mapper, not a stub of our own code.
describe("Sonar mock-fetch seam (real SDK + fixtures)", () => {
  it("readCommitments returns mapped fixture data via the SDK", async () => {
    // Pin the clock so the throwaway "live" mock (time-based growth) sits at its base.
    const now = vi.spyOn(Date, "now").mockReturnValue(0)
    const data = await readCommitments()
    expect(data).toEqual({
      totalCommittedUsd: 1_200_000,
      clearingPriceUsd: 0.12,
      uniqueCommitmentCount: 1247,
    })
    now.mockRestore()
  })

  it("getEntity returns the mapped fixture entity via the SDK (dummy token in mock)", async () => {
    const entity = await getEntity("mock-session")
    expect(entity).toEqual({
      entityId: "11111111-1111-1111-1111-111111111111",
      setupState: "complete",
      eligibility: "eligible",
    })
  })

  it("generatePurchasePermit returns the fixture permit (audit skips the DB in mock)", async () => {
    const res = await generatePurchasePermit({
      sessionId: "mock-session",
      entityId: "11111111-1111-1111-1111-111111111111",
      wallet: "0xmockpermitwallet",
    })
    expect(res.Signature).toMatch(/^0x[0-9a-f]+$/i)
    expect(res.PermitJSON).toBeTruthy()
  })
})
