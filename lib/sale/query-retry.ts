import { HttpError } from "./api"

// React Query retry policy for the authenticated Sonar queries. A 429 (edge rate limit) must not
// be retried inside the window that produced it - each immediate retry re-fills the bucket and
// keeps the client locked out - so wait past the window instead. Expected auth/absence answers
// (401, and the entity route's marked no_entity 404) resolve to values in the fetchers; what
// reaches here is genuine failure, including unmarked stray 404s.
const RATE_LIMIT_WINDOW_MS = 61_000

export function sonarQueryRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof HttpError && error.status === 429) return failureCount < 2
  return failureCount < 3
}

export function sonarQueryRetryDelay(failureCount: number, error: unknown): number {
  if (error instanceof HttpError && error.status === 429) return RATE_LIMIT_WINDOW_MS
  return Math.min(1_000 * 2 ** failureCount, 30_000)
}
