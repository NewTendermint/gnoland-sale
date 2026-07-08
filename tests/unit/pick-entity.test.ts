import { type EntityDetails, EntitySetupState, SaleEligibility } from "@echoxyz/sonar-core"
import { describe, expect, it } from "vitest"
import { pickEntity } from "../../lib/sonar/entity"

const entity = (over: Partial<EntityDetails>): EntityDetails =>
  ({
    Label: "test",
    EntityID: "AUX-default",
    SaleSpecificEntityID: "0x1111111111111111111111111111aaaa",
    EntityType: "user",
    EntitySetupState: "complete",
    SaleEligibility: "eligible",
    InvestingRegion: "other",
    ...over,
  }) as EntityDetails

describe("pickEntity (multi-entity accounts: the journey must not flap on list order)", () => {
  const complete = entity({ EntityID: "AUX-complete", EntitySetupState: EntitySetupState.COMPLETE })
  const inProgress = entity({
    EntityID: "AUX-inprogress",
    EntitySetupState: EntitySetupState.IN_PROGRESS,
  })
  const failed = entity({ EntityID: "AUX-failed", EntitySetupState: EntitySetupState.FAILURE })

  it("prefers the complete entity regardless of list order", () => {
    // The bug this pins: Sonar's list order is not guaranteed, and [0] used to win - a verified
    // user intermittently saw "Finish your verification" from an abandoned duplicate setup.
    expect(pickEntity([inProgress, complete])?.EntityID).toBe("AUX-complete")
    expect(pickEntity([complete, inProgress])?.EntityID).toBe("AUX-complete")
    expect(pickEntity([failed, inProgress, complete])?.EntityID).toBe("AUX-complete")
  })

  it("falls back to the most advanced setup when none is complete", () => {
    expect(pickEntity([failed, inProgress])?.EntityID).toBe("AUX-inprogress")
  })

  it("prefers the eligible entity among equals", () => {
    const notEligible = entity({
      EntityID: "AUX-a-noteligible",
      SaleEligibility: SaleEligibility.NOT_ELIGIBLE,
    })
    const eligible = entity({ EntityID: "AUX-z-eligible" })
    expect(pickEntity([notEligible, eligible])?.EntityID).toBe("AUX-z-eligible")
  })

  it("tie-breaks deterministically so the same account always resolves the same entity", () => {
    const a = entity({ EntityID: "AUX-aaa" })
    const b = entity({ EntityID: "AUX-bbb" })
    expect(pickEntity([b, a])?.EntityID).toBe("AUX-aaa")
    expect(pickEntity([a, b])?.EntityID).toBe("AUX-aaa")
  })

  it("ranks an unrecognized setup state with the pending states, never above complete", () => {
    const weird = entity({
      EntityID: "AUX-weird",
      EntitySetupState: "brand-new-state" as EntityDetails["EntitySetupState"],
    })
    expect(pickEntity([weird, complete])?.EntityID).toBe("AUX-complete")
    // But above the not-started/failed tail.
    expect(pickEntity([failed, weird])?.EntityID).toBe("AUX-weird")
  })

  it("returns undefined on an empty list", () => {
    expect(pickEntity([])).toBeUndefined()
  })

  it("survives a tie where an entity is missing its EntityID", () => {
    const broken = entity({ EntityID: undefined as unknown as string })
    const ok = entity({ EntityID: "AUX-ok" })
    expect(() => pickEntity([broken, ok])).not.toThrow()
    expect(pickEntity([broken, ok])?.EntityID).toBe("AUX-ok")
    expect(pickEntity([ok, broken])?.EntityID).toBe("AUX-ok")
  })

  it("is immune to setup states colliding with Object.prototype keys", () => {
    const hostile = entity({
      EntityID: "AUX-hostile",
      EntitySetupState: "toString" as EntityDetails["EntitySetupState"],
    })
    expect(pickEntity([hostile, complete])?.EntityID).toBe("AUX-complete")
  })
})
