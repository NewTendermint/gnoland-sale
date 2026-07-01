import { describe, expect, it } from "vitest"
import { parseEnv } from "../../lib/env"

// A complete, well-formed server environment. Individual tests clone and
// corrupt one field to assert the guard rejects it.
const valid = {
  SONAR_CLIENT_UUID: "client-uuid",
  SONAR_REDIRECT_URI: "https://sale.gno.land/api/auth/sonar/callback",
  SONAR_SALE_UUID: "sale-uuid",
  SONAR_API_BASE_URL: "https://api.echo.xyz",
  ENCRYPTION_KEY: "a".repeat(64),
  IP_HMAC_PEPPER: "b".repeat(64),
  SESSION_PASSWORD: "x".repeat(40),
}

describe("parseEnv", () => {
  it("returns the parsed env for a well-formed source", () => {
    const env = parseEnv(valid)
    expect(env.SONAR_CLIENT_UUID).toBe("client-uuid")
  })

  it('defaults SALE_PAUSED to "false" when absent', () => {
    expect(parseEnv(valid).SALE_PAUSED).toBe("false")
  })

  it("rejects an ENCRYPTION_KEY that is not 32 bytes of hex (64 chars)", () => {
    expect(() => parseEnv({ ...valid, ENCRYPTION_KEY: "tooshort" })).toThrow(
      "Invalid environment variables",
    )
  })

  it("rejects an IP_HMAC_PEPPER shorter than 64 chars", () => {
    expect(() => parseEnv({ ...valid, IP_HMAC_PEPPER: "b".repeat(32) })).toThrow(
      "Invalid environment variables",
    )
  })

  it("rejects a SESSION_PASSWORD shorter than 32 chars", () => {
    expect(() => parseEnv({ ...valid, SESSION_PASSWORD: "short" })).toThrow(
      "Invalid environment variables",
    )
  })

  it("rejects a malformed URL field", () => {
    expect(() => parseEnv({ ...valid, SONAR_API_BASE_URL: "not-a-url" })).toThrow(
      "Invalid environment variables",
    )
  })

  it("never echoes the offending value in the error message", () => {
    const secret = "supersecretvalue"
    expect(() => parseEnv({ ...valid, ENCRYPTION_KEY: secret })).toThrow(
      /^Invalid environment variables$/,
    )
  })
})
