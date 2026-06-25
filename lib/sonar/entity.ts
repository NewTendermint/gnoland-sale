import "server-only"
import { env } from "../env"
import type {
  EntitySetupState,
  EntitySnapshot,
  InvestingRegion,
  SaleEligibility,
} from "../sale/types"
import { createSonarClient } from "./client"
import { ensureFreshTokens, withSonarAuth } from "./permit"

// Mirrors sonar-core enum values 1:1; the SDK types them `string`, so validate at the boundary.
const SETUP_STATES: readonly EntitySetupState[] = [
  "not-started",
  "in-progress",
  "ready-for-review",
  "in-review",
  "failure",
  "failure-final",
  "technical-issue",
  "complete",
]
const ELIGIBILITIES: readonly SaleEligibility[] = [
  "eligible",
  "not-eligible",
  "unknown-setup-incomplete",
]

function normalizeSetup(value: string): EntitySetupState {
  return (SETUP_STATES as readonly string[]).includes(value)
    ? (value as EntitySetupState)
    : "not-started"
}
function normalizeEligibility(value: string): SaleEligibility {
  return (ELIGIBILITIES as readonly string[]).includes(value)
    ? (value as SaleEligibility)
    : "unknown-setup-incomplete"
}

const REGIONS: readonly InvestingRegion[] = ["unknown", "other", "us", "eu"]
function normalizeRegion(value: string): InvestingRegion {
  return (REGIONS as readonly string[]).includes(value) ? (value as InvestingRegion) : "unknown"
}

/** Resolve the session's entity (id server-derived, never client-supplied); null if none. */
export async function getEntity(sessionId: string): Promise<EntitySnapshot | null> {
  const tokens = await ensureFreshTokens(sessionId)
  const res = await withSonarAuth(sessionId, () =>
    createSonarClient(tokens.accessToken).listAvailableEntities({
      saleUUID: env.SONAR_SALE_UUID,
    }),
  )
  const entity = res.Entities[0]
  if (!entity) {
    return null
  }
  return {
    entityId: entity.EntityID,
    setupState: normalizeSetup(entity.EntitySetupState),
    eligibility: normalizeEligibility(entity.SaleEligibility),
    investingRegion: normalizeRegion(entity.InvestingRegion),
  }
}
