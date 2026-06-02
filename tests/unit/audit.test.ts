import type { AuditMetadata } from "@/lib/db/schema"
import { sonarMockEnabled } from "@/lib/sonar/mock-config"
import { recordAudit } from "@/lib/sonar/permit"
import { afterEach, describe, expect, it, vi } from "vitest"

// Stable insert/values spies (hoisted so the vi.mock factory can close over them).
const { insertMock, valuesMock } = vi.hoisted(() => {
  const valuesMock = vi.fn()
  const insertMock = vi.fn(() => ({ values: valuesMock }))
  return { insertMock, valuesMock }
})

vi.mock("@/lib/db/client", () => ({ db: { insert: insertMock } }))
vi.mock("@/lib/sonar/mock-config", () => ({ sonarMockEnabled: vi.fn() }))

const mockedSonarMock = vi.mocked(sonarMockEnabled)
const goodMeta: AuditMetadata = { permit_id_prefix: "0xabab", chain_id: 84532 }

afterEach(() => {
  vi.clearAllMocks()
})

describe("recordAudit", () => {
  it("in mock mode, validates metadata but does NOT write to the database", async () => {
    mockedSonarMock.mockReturnValue(true)
    await recordAudit("permit_issued", { wallet: "0xabc", metadata: goodMeta })
    expect(insertMock).not.toHaveBeenCalled()
  })

  it("still enforces the PII allow-list in mock mode (rejects unlisted fields like email)", async () => {
    mockedSonarMock.mockReturnValue(true)
    await expect(
      recordAudit("permit_issued", {
        wallet: "0xabc",
        metadata: { email: "leak@example.com" } as unknown as AuditMetadata,
      }),
    ).rejects.toThrow()
    expect(insertMock).not.toHaveBeenCalled()
  })

  it("in real mode, inserts the audit row with the validated fields", async () => {
    mockedSonarMock.mockReturnValue(false)
    await recordAudit("permit_issued", {
      wallet: "0xabc",
      entityId: "11111111-1111-1111-1111-111111111111",
      metadata: goodMeta,
    })
    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "permit_issued",
        wallet: "0xabc",
        entityId: "11111111-1111-1111-1111-111111111111",
        metadata: goodMeta,
      }),
    )
  })
})
