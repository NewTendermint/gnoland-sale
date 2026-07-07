import "server-only"
import type { EntityDetails } from "@echoxyz/sonar-core"
import { env } from "../env"
import type {
  EntitySetupState,
  EntitySnapshot,
  InvestingRegion,
  SaleEligibility,
} from "../sale/types"
import { createSonarClient } from "./client"
import { withSonarAuth } from "./permit"

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
  // Unrecognized values normalize to the "unknown" sentinel, never to an actionable state:
  // sonar-core is pre-1.0 and a renamed/new state must not tell a verified user to redo setup.
  return (SETUP_STATES as readonly string[]).includes(value)
    ? (value as EntitySetupState)
    : "unknown"
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

// Most-advanced-first setup ranking for entity selection. Unlisted values sit with the pending
// states (same caution as normalizeSetup: never rank an unknown state as actionable).
const SETUP_RANK: Record<string, number> = {
  complete: 0,
  "ready-for-review": 1,
  "in-review": 1,
  unknown: 2,
  "in-progress": 3,
  "not-started": 4,
  "technical-issue": 5,
  failure: 6,
  "failure-final": 7,
}

/** Pick the account's entity for this sale. An account can hold SEVERAL entities (abandoned or
 *  duplicate setups) and the list order is not guaranteed, so taking [0] blindly makes the whole
 *  journey flap between refetches - a verified user intermittently sees "finish your setup".
 *  Most advanced setup wins (eligible first among equals), with a deterministic tie-break so the
 *  same account always resolves to the same entity. */
export function pickEntity(entities: readonly EntityDetails[]): EntityDetails | undefined {
  // Own-property lookup: an upstream value colliding with an Object.prototype key ("toString")
  // would return a function, poison the comparator with NaN and bring the nondeterminism back.
  const rank = (s: string) => (Object.hasOwn(SETUP_RANK, s) ? SETUP_RANK[s] : 2)
  return [...entities].sort(
    (a, b) =>
      rank(a.EntitySetupState) - rank(b.EntitySetupState) ||
      Number(b.SaleEligibility === "eligible") - Number(a.SaleEligibility === "eligible") ||
      a.EntityID.localeCompare(b.EntityID),
  )[0]
}

/** Resolve the session's entity (id server-derived, never client-supplied); null if none. */
export async function getEntity(sessionId: string): Promise<EntitySnapshot | null> {
  const res = await withSonarAuth(sessionId, (accessToken) =>
    createSonarClient(accessToken).listAvailableEntities({
      saleUUID: env.SONAR_SALE_UUID,
    }),
  )
  // Count only, no identity: multi-entity accounts are the case pickEntity exists for, and this
  // is the trace that says whether a flapping journey came from list order or from an upstream
  // empty/degraded answer.
  if (res.Entities.length !== 1) {
    console.info(`sonar-entity: account holds ${res.Entities.length} entities for this sale`)
  }
  const entity = pickEntity(res.Entities)
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
