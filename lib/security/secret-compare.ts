import "server-only"
import { createHash, timingSafeEqual } from "node:crypto"

// Constant-time equality for shared secrets (cron bearer, etc.). Both sides are hashed to a fixed
// 32 bytes first: timingSafeEqual throws on a length mismatch, and that throw would itself leak the
// secret's length. Returns false for any missing input (fail closed).
export function timingSafeEqualStr(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false
  const ha = createHash("sha256").update(a).digest()
  const hb = createHash("sha256").update(b).digest()
  return timingSafeEqual(ha, hb)
}
