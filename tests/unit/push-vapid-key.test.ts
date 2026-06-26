import { describe, expect, it } from "vitest"
import { urlBase64ToUint8Array } from "../../lib/push/subscribe"

describe("urlBase64ToUint8Array", () => {
  it("decodes a url-safe base64 key to bytes (padding restored)", () => {
    // "aGVsbG8" is url-safe base64 for "hello" without the trailing "=".
    expect(Array.from(urlBase64ToUint8Array("aGVsbG8"))).toEqual([104, 101, 108, 108, 111])
  })

  it("maps url-safe chars (- _) back to (+ /)", () => {
    // 0xFB 0xFF 0xBF encodes to "+/+/" in standard base64, "-_-_" url-safe.
    expect(Array.from(urlBase64ToUint8Array("-_-_"))).toEqual([251, 255, 191])
  })
})
