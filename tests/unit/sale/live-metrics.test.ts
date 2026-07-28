import { liveMetrics } from "@/app/[locale]/(layout)/BidBarShell"
import type { SaleTranslator } from "@/lib/sale/labels"
import type { CommitmentData } from "@/lib/sale/types"
import { describe, expect, it } from "vitest"

// liveMetrics is pure: it maps commitment data to bar cells. The translator only supplies labels,
// so an identity stub is enough to reach the Committed cell's formatted value.
const t = ((key: string) => key) as unknown as SaleTranslator

const commitment: CommitmentData = {
  totalCommittedUsd: 2_043_900,
  clearingPriceUsd: 0.0645,
  uniqueCommitmentCount: 9,
  paused: false,
}

// The Committed metric is always the last cell (icon "database").
const committedCell = (metrics: ReturnType<typeof liveMetrics>) => metrics.at(-1)

describe("liveMetrics Committed cell", () => {
  it("uses the compact floored figure with a + in the collapsed bar (default)", () => {
    expect(committedCell(liveMetrics(t, commitment))?.value).toBe("$2M+")
  })

  it("uses the exact full figure (no +) once the panel is expanded", () => {
    expect(committedCell(liveMetrics(t, commitment, undefined, true))?.value).toBe("$2,043,900")
  })
})
