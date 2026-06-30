// Maps the Sonar permit (BasicPermitV3 JSON) to the SettlementSale `PurchasePermitV3` struct
// forwarded to replaceBidWithPermit. Field order + types verified against
// contracts/src/permits/PurchasePermitV3.sol (l.20-32) and sonar-core dist/index.d.ts (l.75-87).
import type { SonarPermitV3 } from "./types"

type Hex = `0x${string}`

/** UUID (dashed or 0x-hex) -> bytes16. Verified vs the on-chain saleUUID(): strip dashes, 0x-prefix. */
export function uuidToBytes16(uuid: string): Hex {
  const hex = uuid.replace(/^0x/i, "").replace(/-/g, "").toLowerCase()
  if (!/^[0-9a-f]{32}$/.test(hex)) {
    throw new Error(`uuidToBytes16: expected a 16-byte UUID/hex, got "${uuid}"`)
  }
  return `0x${hex}`
}

/** Narrow an arbitrary 0x string to Hex, rejecting a malformed field before it reaches calldata. */
function asHex(value: string, label: string): Hex {
  if (!/^0x[0-9a-fA-F]*$/.test(value)) {
    throw new Error(`${label}: expected a 0x-hex string, got "${value}"`)
  }
  return value as Hex
}

export type PurchasePermitV3 = {
  saleSpecificEntityID: Hex
  saleUUID: Hex
  wallet: Hex
  expiresAt: bigint
  minAmount: bigint
  maxAmount: bigint
  minPrice: bigint
  maxPrice: bigint
  opensAt: bigint
  closesAt: bigint
  payload: Hex
}

export function toPurchasePermitV3(permit: SonarPermitV3): PurchasePermitV3 {
  return {
    saleSpecificEntityID: uuidToBytes16(permit.SaleSpecificEntityID),
    saleUUID: uuidToBytes16(permit.SaleUUID),
    wallet: asHex(permit.Wallet, "wallet"),
    expiresAt: BigInt(permit.ExpiresAt),
    minAmount: BigInt(permit.MinAmount),
    maxAmount: BigInt(permit.MaxAmount),
    minPrice: BigInt(permit.MinPrice),
    maxPrice: BigInt(permit.MaxPrice),
    opensAt: BigInt(permit.OpensAt),
    closesAt: BigInt(permit.ClosesAt),
    payload: asHex(permit.Payload, "payload"),
  }
}
