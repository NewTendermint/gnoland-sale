/**
 * Client-side API layer: typed fetchers to our own `/api/sonar/*` routes.
 *
 * This is the single, consistent shape the front uses to read sale data. The
 * browser only ever talks to our server here (never Sonar directly); whether the
 * server answers from real Sonar or from fixtures (SONAR_MOCK) is invisible to
 * the caller. Each fetcher returns one of the UI-facing types in ./types, so the
 * UI contract is identical mock vs real.
 */
import type { CommitmentData, EntitySnapshot, PrePurchaseResult, SalePermit } from "./types"

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { accept: "application/json" } })
  if (!res.ok) {
    throw new Error(`${path} responded ${res.status}`)
  }
  return res.json() as Promise<T>
}

/** Live auction metrics (total committed, clearing price, bidder count). */
export function getCommitments(): Promise<CommitmentData> {
  return getJson<CommitmentData>("/api/sonar/commitments")
}

/**
 * The session's Sonar entity (KYC + eligibility). Returns null when the user is
 * not connected to Sonar yet (401) or has no entity (404) - both are normal
 * journey states, not errors.
 */
export async function getEntity(): Promise<EntitySnapshot | null> {
  const res = await fetch("/api/sonar/entity", { headers: { accept: "application/json" } })
  if (res.status === 401 || res.status === 404) {
    return null
  }
  if (!res.ok) {
    throw new Error(`/api/sonar/entity responded ${res.status}`)
  }
  return res.json() as Promise<EntitySnapshot>
}

/**
 * Begin the Sonar OAuth login. Returns the URL to send the browser to: the real
 * Sonar authorization page, or - in mock - straight back home already logged in.
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
    throw new Error(`${path} responded ${res.status}`)
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
