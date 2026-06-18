import "server-only"
import { createHmac } from "node:crypto"
import { env } from "../env"

// Irreversible HMAC of a client IP for the audit log (never stored raw).
export function ipHmac(ip: string): string {
  return createHmac("sha256", env.IP_HMAC_PEPPER).update(ip).digest("hex")
}

// Left-most X-Forwarded-For hop, or null when absent.
export function parseForwardedFor(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }
  const first = value.split(",")[0]?.trim()
  return first ? first : null
}
