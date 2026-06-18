// Typed fetchers to our own /api/sonar/* routes.
import type { CommitmentData, EntitySnapshot, MyBid, PrePurchaseResult, SalePermit } from "./types"

/** Thrown by the JSON fetchers on a non-2xx response; carries the HTTP status. */
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

/** The session's Sonar entity (KYC + eligibility); null on 401/404. */
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

/** The session's current position (price + committed); null on 401/404. */
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

async function startSonarLogin(): Promise<string> {
  const res = await fetch("/api/auth/sonar/init", { method: "POST" })
  if (!res.ok) {
    throw new Error(`/api/auth/sonar/init responded ${res.status}`)
  }
  const data = (await res.json()) as { authorizationUrl: string }
  return data.authorizationUrl
}

export function redirectToSonarLogin(): void {
  startSonarLogin().then(
    (url) => {
      window.location.href = url
    },
    () => {},
  )
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

export async function postSonarLogout(): Promise<void> {
  const res = await fetch("/api/auth/sonar/logout", { method: "POST" })
  if (!res.ok) {
    throw new HttpError(res.status, `/api/auth/sonar/logout responded ${res.status}`)
  }
}

/** Whether the session's entity may purchase for this wallet (KYC/region/risk). */
export function postPrePurchase(wallet: string): Promise<PrePurchaseResult> {
  return postJson<PrePurchaseResult>("/api/sonar/pre-purchase", { wallet })
}

/** Request a Sonar purchase permit for this wallet ({ PermitJSON, Signature }). */
export function postGeneratePermit(wallet: string): Promise<SalePermit> {
  return postJson<SalePermit>("/api/sonar/generate-permit", { wallet })
}
