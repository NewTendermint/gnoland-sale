import { beforeEach, describe, expect, it, vi } from "vitest"

const readCommitmentData = vi.fn()
vi.mock("../../lib/sonar/client", () => ({
  createSonarClient: () => ({ readCommitmentData }),
}))

const RES = {
  TotalCommitmentAmount: "12000000",
  PaymentTokenDecimals: 6,
  ClearingPriceMicroUSD: "64500",
  UniqueCommitmentCount: 3,
  Commitments: [],
}

async function importCached() {
  vi.resetModules()
  const { readCommitmentsCached, COMMITMENTS_CACHE_MS } = await import(
    "../../lib/sonar/commitments"
  )
  return { cached: readCommitmentsCached, windowMs: COMMITMENTS_CACHE_MS }
}

const T0 = 1_000

beforeEach(() => {
  readCommitmentData.mockReset()
})

describe("readCommitmentsCached", () => {
  it("serves repeat reads inside the window from cache (one upstream call)", async () => {
    const { cached, windowMs } = await importCached()
    readCommitmentData.mockResolvedValue(RES)
    const a = await cached(T0)
    const b = await cached(T0 + windowMs - 1)
    expect(a.clearingPriceUsd).toBe(0.0645)
    expect(b).toEqual(a)
    expect(readCommitmentData).toHaveBeenCalledTimes(1)
  })

  it("refreshes once the window has elapsed", async () => {
    const { cached, windowMs } = await importCached()
    readCommitmentData.mockResolvedValue(RES)
    await cached(T0)
    await cached(T0 + windowMs)
    expect(readCommitmentData).toHaveBeenCalledTimes(2)
  })

  it("does not cache failures - the next read retries upstream", async () => {
    const { cached } = await importCached()
    readCommitmentData.mockRejectedValueOnce(new Error("sonar down"))
    await expect(cached(T0)).rejects.toThrow("sonar down")
    readCommitmentData.mockResolvedValue(RES)
    const res = await cached(T0 + 1)
    expect(res.clearingPriceUsd).toBe(0.0645)
    expect(readCommitmentData).toHaveBeenCalledTimes(2)
  })
})
