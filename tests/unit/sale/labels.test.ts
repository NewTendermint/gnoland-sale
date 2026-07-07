import { describe, expect, it } from "vitest"
import {
  SUPPORT_CONTACT_HREF,
  SUPPORT_VERIFY_FAILED_HREF,
  punctuate,
  supportMailtoHref,
} from "../../../lib/sale/labels"

describe("punctuate", () => {
  it("appends a period when the sentence has no terminal punctuation", () => {
    expect(punctuate("You cancelled the transaction")).toBe("You cancelled the transaction.")
  })

  it("is idempotent and keeps existing terminal punctuation", () => {
    expect(punctuate("Could not place bid.")).toBe("Could not place bid.")
    expect(punctuate("Really?")).toBe("Really?")
    expect(punctuate("Stop!")).toBe("Stop!")
    expect(punctuate(punctuate("no double"))).toBe("no double.")
  })

  it("trims surrounding whitespace before punctuating", () => {
    expect(punctuate("  spaced out  ")).toBe("spaced out.")
  })
})

describe("supportMailtoHref", () => {
  const decodeBody = (href: string) =>
    decodeURIComponent(new URL(href).searchParams.get("body") ?? "")

  it("targets the support address with an encoded subject", () => {
    const href = supportMailtoHref("bid error - Could not place bid.", [])
    expect(href).not.toBeNull()
    expect(href?.startsWith(`${SUPPORT_CONTACT_HREF}?subject=`)).toBe(true)
    expect(new URL(href ?? "").searchParams.get("subject")).toBe("bid error - Could not place bid.")
  })

  it("keeps the query context sealed against metacharacters in details", () => {
    const href = supportMailtoHref("a&b=c?d", ["Wallet: Evil&bcc=x@y.z", "line\r\nbreak"])
    const raw = href ?? ""
    expect(raw.match(/\?/g)).toHaveLength(1)
    expect(raw.slice(raw.indexOf("?"))).not.toContain("bcc=x@y.z")
    expect(new URL(raw).searchParams.get("subject")).toBe("a&b=c?d")
    expect(decodeBody(raw)).toContain("Wallet: Evil&bcc=x@y.z")
  })

  it("drops falsy detail lines but keeps the scaffold blank lines", () => {
    const href = supportMailtoHref("s", ["Kept: yes", false, null, undefined, "Also: kept"])
    const body = decodeBody(href ?? "")
    expect(body).not.toContain("false")
    expect(body).not.toContain("undefined")
    expect(body.split("\r\n").slice(0, 3)).toEqual(["Kept: yes", "Also: kept", ""])
    expect(body).toContain("Please describe what happened")
    expect(body).toContain("Privacy: no personal info needed")
  })

  it("prefills the shared failed-verification link from the status copy", () => {
    expect(SUPPORT_VERIFY_FAILED_HREF).not.toBeNull()
    const body = decodeBody(SUPPORT_VERIFY_FAILED_HREF ?? "")
    expect(body).toContain('My verification status shows: "Verification didn\'t pass."')
  })
})
