import "server-only"
import type {
  EntityDetails,
  GeneratePurchasePermitResponse,
  Hex,
  ListAvailableEntitiesResponse,
  PrePurchaseCheckResponse,
  ReadCommitmentDataResponse,
  TokenResponse,
} from "@echoxyz/sonar-core"
import { sonarCore } from "./server-only"

// Fixtures typed as the real SDK response shapes; the only mock data in the system.

const hex = (body: string): Hex => `0x${body}` as Hex
const FAR_FUTURE = 4_102_444_800 // 2100-01-01, so the mock permit never reads as expired

const MOCK_ENTITY: EntityDetails = {
  Label: "Mock investor",
  EntityID: "11111111-1111-1111-1111-111111111111",
  SaleSpecificEntityID: hex("11".repeat(16)),
  EntityType: sonarCore.EntityType.USER,
  EntitySetupState: sonarCore.EntitySetupState.COMPLETE,
  SaleEligibility: sonarCore.SaleEligibility.ELIGIBLE,
  InvestingRegion: sonarCore.InvestingRegion.OTHER,
}

export const mockFixtures = {
  token: {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
  } satisfies TokenResponse,

  // 1.2M USDC @ 6 decimals, clearing $0.12, 1247 bidders. The sample commitment is
  // ANOTHER bidder, so the session starts with no position.
  commitmentData: {
    TotalCommitmentAmount: "1200000000000",
    ClearingPriceMicroUSD: "120000",
    PaymentTokenDecimals: 6,
    UniqueCommitmentCount: 1247,
    // TODO(real-data): this commitment is a hand-shaped fixture. Re-verify the real
    // shape vs Sonar before launch: lockup source, price field (PriceMicroUSD vs
    // numerator/denominator), and multi-commitment aggregation per entity.
    Commitments: [
      {
        CommitmentID: hex("c0".repeat(16)),
        SaleSpecificEntityID: hex("99".repeat(16)),
        PriceNumerator: "150000",
        PriceDenominator: "1000000",
        PriceMicroUSD: "150000",
        Amounts: [
          { Wallet: hex("33".repeat(20)), Token: hex("44".repeat(20)), Amount: "3200000000" },
        ],
        CreatedAt: "2026-06-01T00:00:00Z",
        ExtraRaw: hex(""),
        ExtraDataParsed: null,
      },
    ],
  } satisfies ReadCommitmentDataResponse,

  prePurchase: {
    ReadyToPurchase: true,
    FailureReason: "",
    LivenessCheckURL: "",
  } satisfies PrePurchaseCheckResponse,

  permit: {
    PermitJSON: {
      SaleSpecificEntityID: hex("11".repeat(16)),
      SaleUUID: hex("22".repeat(16)),
      Wallet: hex("33".repeat(20)),
      ExpiresAt: FAR_FUTURE,
      MinAmount: "0",
      MaxAmount: "1000000000000",
      MinPrice: 0,
      MaxPrice: 1_000_000,
      OpensAt: 0,
      ClosesAt: FAR_FUTURE,
      Payload: hex(""),
    },
    Signature: hex("ab".repeat(32)),
  } satisfies GeneratePurchasePermitResponse,

  entities: { Entities: [MOCK_ENTITY] } satisfies ListAvailableEntitiesResponse,
}
