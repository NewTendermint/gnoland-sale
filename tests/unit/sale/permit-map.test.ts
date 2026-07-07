import { describe, expect, it } from "vitest"
import { toPurchasePermitV3, uuidToBytes16 } from "../../../lib/sale/permit-map"
import { mockFixtures } from "../../../lib/sonar/mock-fixtures"

describe("uuidToBytes16", () => {
  it("strips dashes and 0x-prefixes a dashed UUID (verified vs on-chain saleUUID())", () => {
    expect(uuidToBytes16("c4b494ad-2f27-46fa-bbd2-c6b0bdd74887")).toBe(
      "0xc4b494ad2f2746fabbd2c6b0bdd74887",
    )
  })
  it("is idempotent on an already-0x 16-byte hex", () => {
    expect(uuidToBytes16("0xc4b494ad2f2746fabbd2c6b0bdd74887")).toBe(
      "0xc4b494ad2f2746fabbd2c6b0bdd74887",
    )
  })
  it("lowercases hex", () => {
    expect(uuidToBytes16("C4B494AD-2F27-46FA-BBD2-C6B0BDD74887")).toBe(
      "0xc4b494ad2f2746fabbd2c6b0bdd74887",
    )
  })
  it("rejects anything that is not exactly 16 bytes of hex", () => {
    expect(() => uuidToBytes16("c4b494ad-2f27-46fa-bbd2")).toThrow()
    expect(() => uuidToBytes16("0xnothex")).toThrow()
    expect(() => uuidToBytes16("")).toThrow()
  })
})

describe("toPurchasePermitV3", () => {
  const SAMPLE = {
    SaleSpecificEntityID: "0x1111111111111111111111111111aaaa",
    SaleUUID: "c4b494ad-2f27-46fa-bbd2-c6b0bdd74887",
    Wallet: "0x0000000000000000000000000000000000000001",
    ExpiresAt: 1893456000,
    MinAmount: "100000000",
    MaxAmount: "100000000000",
    MinPrice: 10,
    MaxPrice: 20,
    OpensAt: 1752000000,
    ClosesAt: 1752600000,
    Payload: "0x0000000000000000000000000000000000000000000000000000000000000001",
  }

  it("maps BasicPermitV3 to the PurchasePermitV3 struct (order, bytes16, bigints, hex passthrough)", () => {
    expect(toPurchasePermitV3(SAMPLE)).toEqual({
      saleSpecificEntityID: "0x1111111111111111111111111111aaaa",
      saleUUID: "0xc4b494ad2f2746fabbd2c6b0bdd74887",
      wallet: "0x0000000000000000000000000000000000000001",
      expiresAt: 1893456000n,
      minAmount: 100000000n,
      maxAmount: 100000000000n,
      minPrice: 10n,
      maxPrice: 20n,
      opensAt: 1752000000n,
      closesAt: 1752600000n,
      payload: "0x0000000000000000000000000000000000000000000000000000000000000001",
    })
  })

  it("throws on a malformed UUID instead of forwarding bad calldata", () => {
    expect(() => toPurchasePermitV3({ ...SAMPLE, SaleUUID: "not-a-uuid" })).toThrow()
  })

  it("accepts the SONAR_MOCK permit fixture (bytes16 ids, matching the on-chain ABI)", () => {
    expect(() => toPurchasePermitV3(mockFixtures.permit.PermitJSON)).not.toThrow()
  })
})
