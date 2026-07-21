// Typed fetchers to our own /api/sonar/* routes.
import { track } from "../analytics/track"
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

/** Entity read result. 401 and 404 are different states, not one "null": with no session (401)
 *  reconnecting via OAuth is the right ask; with a live session and no entity yet (404) only
 *  Echo's hosted setup page can advance the user. */
export type EntityRead =
  | { status: "no-session" }
  | { status: "no-entity" }
  | { status: "entity"; entity: EntitySnapshot }

/** The session's Sonar entity (KYC + eligibility), discriminated by session/entity presence. */
export async function getEntity(): Promise<EntityRead> {
  const res = await fetch("/api/sonar/entity", { headers: { accept: "application/json" } })
  if (res.status === 401) {
    return { status: "no-session" }
  }
  if (res.status === 404) {
    // Only OUR route's marker counts as "no entity yet": a stray 404 (deploy window, rewrite,
    // CDN) must not classify a possibly-verified user as "session live, setup not started".
    const body: unknown = await res.json().catch(() => null)
    if (
      typeof body === "object" &&
      body !== null &&
      (body as { error?: unknown }).error === "no_entity"
    ) {
      return { status: "no-entity" }
    }
    throw new HttpError(res.status, "/api/sonar/entity responded 404 without no_entity")
  }
  if (!res.ok) {
    throw new HttpError(res.status, `/api/sonar/entity responded ${res.status}`)
  }
  return { status: "entity", entity: (await res.json()) as EntitySnapshot }
}

/** The session's current position (price + committed); null when signed out or without a bid.
 *  The route answers "no bid" as a 200 null body and never emits a 404, so a 404 here is stray
 *  infrastructure and must error rather than show a live bidder the fresh bid form. */
export async function getMyPosition(): Promise<MyBid> {
  const res = await fetch("/api/sonar/my-position", { headers: { accept: "application/json" } })
  if (res.status === 401) {
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
  track("sonar_auth_started")
  startSonarLogin().then(
    (url) => {
      window.location.href = url
    },
    // Only the pre-redirect init failure is observable here; abandonment on the hosted login page
    // happens off-app and cannot be seen client-side.
    () => track("sonar_auth_failed", { stage: "init" }),
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
