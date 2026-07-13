import { describe, expect, it } from "vitest"
import {
  type FaqBlock,
  type FaqTranslator,
  buildFaq,
  faqAnswerText,
} from "../../content/sections/faq"

// Stub translator: returns the key path itself (interpolation values ignored). Enough to exercise
// buildFaq's block assembly and faqAnswerText flattening without loading a real message catalog.
const stubT = ((key: string) => key) as unknown as FaqTranslator

describe("faqAnswerText", () => {
  it("passes a plain-string answer through unchanged", () => {
    expect(faqAnswerText("Bids settle at the clearing price.")).toBe(
      "Bids settle at the clearing price.",
    )
  })

  it("collapses strong blocks to their label", () => {
    const blocks: FaqBlock[] = ["Before:", { strong: "only the difference is charged" }, "after."]
    expect(faqAnswerText(blocks)).toBe("Before: only the difference is charged after.")
  })

  it("keeps link labels and drops hrefs", () => {
    const blocks: FaqBlock[] = [
      { parts: ["Read the ", { label: "disclosure", href: "https://example.com/doc" }, " first."] },
    ]
    const text = faqAnswerText(blocks)
    expect(text).toBe("Read the disclosure first.")
    expect(text).not.toContain("example.com")
  })

  it("normalizes whitespace across joined blocks", () => {
    const blocks: FaqBlock[] = ["  Two   spaced ", { strong: " words " }]
    expect(faqAnswerText(blocks)).toBe("Two spaced words")
  })

  it("yields non-empty plain text for every live FAQ entry", () => {
    for (const item of buildFaq(stubT, "en")) {
      const text = faqAnswerText(item.a)
      expect(text.length).toBeGreaterThan(0)
      expect(text).not.toMatch(/\s{2,}/)
    }
  })
})
