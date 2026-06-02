import "server-only"
import { env } from "../env"
import type { EntitySetupState, EntitySnapshot, SaleEligibility } from "../sale/types"
import { createSonarClient } from "./client"
import { ensureFreshTokens } from "./permit"

// Our union mirrors the sonar-core enum values 1:1 (see lib/sale/types.ts), but
// the SDK field is typed `string`, so we validate at the boundary and default
// safely rather than casting blindly.
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

/**
 * Resolve the session's entity for this sale: its id (server-derived from the
 * token, never client-supplied), KYC setup state, and eligibility. Returns null
 * if the session has no entity yet.
 */
export async function getEntity(sessionId: string): Promise<EntitySnapshot | null> {
  const tokens = await ensureFreshTokens(sessionId)
  const res = await createSonarClient(tokens.accessToken).listAvailableEntities({
    saleUUID: env.SONAR_SALE_UUID,
  })
  const entity = res.Entities[0]
  if (!entity) {
    return null
  }
  return {
    entityId: entity.EntityID,
    setupState: normalizeSetup(entity.EntitySetupState),
    eligibility: normalizeEligibility(entity.SaleEligibility),
  }
}
