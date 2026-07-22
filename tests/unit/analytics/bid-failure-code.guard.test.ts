import { describe, expect, it } from "vitest"
import { bidFailureCode } from "../../../lib/analytics/track"
import {
  bidPreflightReason,
  bidRevertReason,
  interpretBidReceipt,
  replacementFailure,
} from "../../../lib/sale/onchain"

// Drift alarm: bidFailureCode classifies by matching the exact human lines the failure producers
// emit. If a producer's wording is edited without updating the classifier, the reason would
// silently fall to "generic". This test drives the REAL producers and asserts every line still
// maps to a specific code, so such a desync fails the build instead of leaking a blind spot.

// A live, unbounded permit (all caps 0 = deferred to the contract); only the sale-window guard is
// exercised here, the other preflight lines are shared with bidRevertReason.
const PERMIT = {
  SaleSpecificEntityID: "0x1111111111111111111111111111aaaa",
  SaleUUID: "0xc4b494ad2f2746fabbd2c6b0bdd74887",
  Wallet: "0x0000000000000000000000000000000000000001",
  ExpiresAt: 0,
  MinAmount: "0",
  MaxAmount: "0",
  MinPrice: 0,
  MaxPrice: 0,
  OpensAt: 0,
  ClosesAt: 4_102_444_800,
  Payload: "0x",
}
const NOW = 1_000_000
const BID = { price: 5n, amount: 100_000_000n }

function expectClassified(reason: string) {
  expect(bidFailureCode(reason), `unclassified producer line: "${reason}"`).not.toBe("generic")
}

describe("bidFailureCode guard - bidRevertReason branches stay classified", () => {
  it.each([
    "does not match the target chain",
    "rejected",
    "insufficient funds for gas * price + value",
    "ERC20: transfer amount exceeds balance",
    "BidPriceBelowMinPrice",
    "BidBelowMinAmount",
    "BidMustHaveLockup",
    "CannotBeLowered",
    "PurchasePermitExpired",
    "BidOutsideAllowedWindow",
    "SalePaused",
    "WalletTiedToAnotherEntity",
    "WalletNotAssociatedWithEntity",
  ])("classifies the line produced for %s", (message) => {
    expectClassified(bidRevertReason(new Error(message)))
  })

  it("leaves only the genuine unknown as generic", () => {
    expect(bidFailureCode(bidRevertReason(new Error("some unmapped revert")))).toBe("generic")
  })
})

describe("bidFailureCode guard - other producers stay classified", () => {
  it("classifies the preflight-only sale-window line", () => {
    const reason = bidPreflightReason({ ...PERMIT, OpensAt: NOW + 300 }, BID, 0n, 0n, NOW)
    expect(reason).not.toBeNull()
    expectClassified(reason as string)
  })

  it("classifies replacement outcomes", () => {
    expectClassified(replacementFailure("cancelled") as string)
    expectClassified(replacementFailure("replaced") as string)
  })

  it("classifies a reverted receipt", () => {
    const res = interpretBidReceipt({ status: "reverted", transactionHash: "0xdead" }, null)
    expect(res.status).toBe("reverted")
    if (res.status === "reverted") expectClassified(res.reason)
  })
})
