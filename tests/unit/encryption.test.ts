import { describe, expect, it } from "vitest"
import { decrypt, encrypt } from "../../lib/security/encryption"

// The payload we actually encrypt in production: the OAuth token pair.
const payload = JSON.stringify({ accessToken: "access-123", refreshToken: "refresh-456" })

describe("encryption envelope", () => {
  it("round-trips a plaintext string", async () => {
    const ciphertext = await encrypt(payload)
    expect(await decrypt(ciphertext)).toBe(payload)
  })

  it("produces a different ciphertext on each call (random nonce)", async () => {
    const a = await encrypt(payload)
    const b = await encrypt(payload)
    expect(a).not.toBe(b)
    // Both still decrypt back to the same plaintext.
    expect(await decrypt(a)).toBe(payload)
    expect(await decrypt(b)).toBe(payload)
  })

  it("rejects a tampered ciphertext", async () => {
    const ciphertext = await encrypt(payload)
    // Flip the first base64 char (inside the nonce region, always content bits)
    // so the Poly1305 auth tag check fails on decrypt.
    const tampered = (ciphertext[0] === "A" ? "B" : "A") + ciphertext.slice(1)
    await expect(decrypt(tampered)).rejects.toThrow()
  })

  it("rejects a ciphertext shorter than the nonce", async () => {
    await expect(decrypt("AAAA")).rejects.toThrow()
  })
})
