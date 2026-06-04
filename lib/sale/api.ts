/**
 * Client-side API layer: typed fetchers to our own `/api/sonar/*` routes.
 *
 * The browser only ever talks to our server here, never Sonar directly; whether
 * the server answers from real Sonar or from fixtures (SONAR_MOCK) is invisible
 * to the caller. Each fetcher returns a UI-facing type from ./types, so the UI
 * contract is identical mock vs real.
 */
import type { CommitmentData, EntitySnapshot, MyBid, PrePurchaseResult, SalePermit } from "./types"

/**
 * Thrown by the JSON fetchers on a non-2xx response. Carries the HTTP status so
 * callers can branch on it (e.g. 401 means the Sonar session is gone, reconnect).
 */
export class HttpError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "HttpError"
    this.status = status
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { accept: "application/json" } })
  if (!res.ok) {
    throw new HttpError(res.status, `${path} responded ${res.status}`)
  }
  return res.json() as Promise<T>
}

/** Live auction metrics (total committed, clearing price, bidder count). */
export function getCommitments(): Promise<CommitmentData> {
  return getJson<CommitmentData>("/api/sonar/commitments")
}

/**
 * The session's Sonar entity (KYC + eligibility). Returns null when the user is
 * not connected to Sonar yet (401) or has no entity (404), both normal journey
 * states rather than errors.
 */
export async function getEntity(): Promise<EntitySnapshot | null> {
  const res = await fetch("/api/sonar/entity", { headers: { accept: "application/json" } })
  if (res.status === 401 || res.status === 404) {
    return null
  }
  if (!res.ok) {
    throw new HttpError(res.status, `/api/sonar/entity responded ${res.status}`)
  }
  return res.json() as Promise<EntitySnapshot>
}

/**
 * The session's current position (price + committed), or null when it has no
 * commitment yet or is not connected to Sonar (401/404), both normal states.
 */
export async function getMyPosition(): Promise<MyBid> {
  const res = await fetch("/api/sonar/my-position", { headers: { accept: "application/json" } })
  if (res.status === 401 || res.status === 404) {
    return null
  }
  if (!res.ok) {
    throw new HttpError(res.status, `/api/sonar/my-position responded ${res.status}`)
  }
  return res.json() as Promise<MyBid>
}

/**
 * Begin the Sonar OAuth login. Returns the URL to send the browser to: the real
 * Sonar authorization page, or (in mock) straight back home already logged in.
 * The caller performs the redirect.
 */
export async function startSonarLogin(): Promise<string> {
  const res = await fetch("/api/auth/sonar/init", { method: "POST" })
  if (!res.ok) {
    throw new Error(`/api/auth/sonar/init responded ${res.status}`)
  }
  const data = (await res.json()) as { authorizationUrl: string }
  return data.authorizationUrl
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new HttpError(res.status, `${path} responded ${res.status}`)
  }
  return res.json() as Promise<T>
}

/** Whether the session's entity may purchase for this wallet (KYC/region/risk). */
export function postPrePurchase(wallet: string): Promise<PrePurchaseResult> {
  return postJson<PrePurchaseResult>("/api/sonar/pre-purchase", { wallet })
}

/**
 * Request a Sonar purchase permit for this wallet. Returns { PermitJSON, Signature },
 * forwarded as-is to the on-chain replaceBidWithPermit step (lib/sale/onchain.ts).
 */
export function postGeneratePermit(wallet: string): Promise<SalePermit> {
  return postJson<SalePermit>("/api/sonar/generate-permit", { wallet })
}
