import "server-only"
import { createHmac } from "node:crypto"
import { env } from "../env"

/**
 * Irreversible HMAC of a client IP for the audit log. The IP is the one piece
 * of audit data that is NOT already public on chain, so it is never stored raw:
 * HMAC-SHA256 under the server-only IP_HMAC_PEPPER cannot be reversed without
 * the pepper, while still letting us correlate events from the same source.
 */
export function ipHmac(ip: string): string {
  return createHmac("sha256", env.IP_HMAC_PEPPER).update(ip).digest("hex")
}

/**
 * Extract the originating client IP from an X-Forwarded-For value: the first
 * (left-most) hop. Returns null when absent so callers handle a missing IP
 * explicitly instead of hashing an empty string.
 */
export function parseForwardedFor(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }
  const first = value.split(",")[0]?.trim()
  return first ? first : null
}
