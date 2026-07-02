import "server-only"
import {
  APIError,
  type GeneratePurchasePermitResponse,
  type PrePurchaseCheckResponse,
} from "@echoxyz/sonar-core"
import { mainnet, sepolia } from "viem/chains"
import { db } from "../db/client"
import { type AuditMetadata, auditLog, auditMetadataSchema } from "../db/schema"
import { env } from "../env"
import type { PrePurchaseFailureReason, PrePurchaseResult } from "../sale/types"
import { createSonarClient } from "./client"
import { sonarMockEnabled } from "./mock-config"
import { type StoredTokens, deleteTokens, loadTokens, storeTokens } from "./tokens"

const REFRESH_SKEW_MS = 5 * 60 * 1000 // refresh when <5min of life remains
const DEDUP_WINDOW_MS = 5 * 1000 // refuse repeat permits for a wallet inside 5s

/** True when the access token is within the refresh skew of expiry. */
export function needsRefresh(expiresAt: Date, now: number = Date.now()): boolean {
  return expiresAt.getTime() - now < REFRESH_SKEW_MS
}

/** Thrown when a wallet requests permits faster than the dedup window allows. */
export class PermitDedupError extends Error {}

// Server-side replay guard, keyed by wallet. Per-instance only:
// a best-effort fast-path, not cluster-wide; on-chain controls are authoritative.
const lastPermitAt = new Map<string, number>()
export function checkPermitDedup(wallet: string, now: number = Date.now()): void {
  // Opportunistic eviction so the Map cannot grow unbounded over a long sale.
  if (lastPermitAt.size > 1000) {
    for (const [key, at] of lastPermitAt) {
      if (now - at >= DEDUP_WINDOW_MS) {
        lastPermitAt.delete(key)
      }
    }
  }
  const last = lastPermitAt.get(wallet)
  if (last !== undefined && now - last < DEDUP_WINDOW_MS) {
    throw new PermitDedupError("Permit recently issued for this wallet; retry shortly")
  }
  lastPermitAt.set(wallet, now)
}

/** Thrown when the Sonar session is absent or rejected; the client must re-authenticate. */
export class SonarAuthError extends Error {}

// Coalesce refreshes per session: two parallel refreshes would rotate and invalidate each other's
// refresh token (token-refresh race). Per-instance only; a cross-instance race is still possible
// and then surfaces as invalid_grant -> a clean reconnect, never a hang.
const refreshInFlight = new Map<string, Promise<StoredTokens>>()

function refreshOnce(sessionId: string): Promise<StoredTokens> {
  let inflight = refreshInFlight.get(sessionId)
  if (!inflight) {
    inflight = rotateTokens(sessionId).finally(() => refreshInFlight.delete(sessionId))
    refreshInFlight.set(sessionId, inflight)
  }
  return inflight
}

// Rotate via the stored refresh token (reloaded inside the coalesced op so a concurrent rotation
// is picked up, not replayed). Only a rejected refresh (invalid_grant: 400 per RFC 6749 5.2, or
// 401) kills the session; a transient failure (network, 5xx) keeps it.
async function rotateTokens(sessionId: string): Promise<StoredTokens> {
  const current = await loadTokens(sessionId)
  if (!current) {
    throw new SonarAuthError("No Sonar session; reconnect required")
  }
  try {
    const res = await createSonarClient().refreshToken({ refreshToken: current.refreshToken })
    const fresh: StoredTokens = {
      accessToken: res.access_token,
      // Refresh-token rotation is optional (RFC 6749 6); keep the existing one if none returned.
      refreshToken: res.refresh_token ?? current.refreshToken,
      expiresAt: new Date(Date.now() + res.expires_in * 1000),
    }
    await storeTokens(sessionId, fresh)
    return fresh
  } catch (err) {
    if (err instanceof APIError && (err.status === 400 || err.status === 401)) {
      // invalid_grant can mean a concurrent instance already rotated this (single-use) refresh
      // token - the in-flight guard is per-instance only. If the stored pair changed since our
      // read, adopt the winner's tokens instead of ending a healthy session.
      const latest = await loadTokens(sessionId)
      if (latest && latest.refreshToken !== current.refreshToken) {
        return latest
      }
      await deleteTokens(sessionId)
      throw new SonarAuthError("Sonar session expired; reconnect required")
    }
    throw err
  }
}

export async function ensureFreshTokens(sessionId: string): Promise<StoredTokens> {
  if (sonarMockEnabled()) {
    return {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      expiresAt: new Date(Date.now() + 60 * 60_000),
    }
  }
  const current = await loadTokens(sessionId)
  if (!current) {
    // No tokens = not authenticated: SonarAuthError so routes answer 401, not a 502.
    throw new SonarAuthError("No Sonar session; reconnect required")
  }
  if (!needsRefresh(current.expiresAt)) {
    return current
  }
  return refreshOnce(sessionId)
}

/** Run an authenticated Sonar call. On a 401, refresh the token once and retry once; only a
 *  rejected refresh or a second 401 ends the session (SonarAuthError -> reconnect). A 401 means
 *  the call was rejected before doing any work, so the single retry is side-effect safe. */
export async function withSonarAuth<T>(
  sessionId: string,
  fn: (accessToken: string) => Promise<T>,
): Promise<T> {
  const tokens = await ensureFreshTokens(sessionId)
  try {
    return await fn(tokens.accessToken)
  } catch (err) {
    if (!(err instanceof APIError) || err.status !== 401) {
      throw err
    }
    const fresh = await refreshOnce(sessionId)
    try {
      return await fn(fresh.accessToken)
    } catch (retryErr) {
      if (retryErr instanceof APIError && retryErr.status === 401) {
        await deleteTokens(sessionId)
        throw new SonarAuthError("Sonar session expired; reconnect required")
      }
      throw retryErr
    }
  }
}

function auditChainId(): number {
  return env.SALE_CHAIN === "mainnet" ? mainnet.id : sepolia.id
}

/** Append an audit row. Metadata is validated against the PII allow-list before persist. */
export async function recordAudit(
  event: string,
  row: {
    entityId?: string | null
    wallet?: string | null
    amountMinor?: number | null
    ipHmac?: string | null
    userAgentClass?: string | null
    metadata?: AuditMetadata
  },
): Promise<void> {
  const metadata = row.metadata ? auditMetadataSchema.parse(row.metadata) : null
  if (sonarMockEnabled()) {
    return
  }
  await db.insert(auditLog).values({
    event,
    entityId: row.entityId ?? null,
    wallet: row.wallet ?? null,
    amountMinor: row.amountMinor ?? null,
    ipHmac: row.ipHmac ?? null,
    userAgentClass: row.userAgentClass ?? null,
    metadata,
  })
}

const FAILURE_REASONS: readonly PrePurchaseFailureReason[] = [
  "unknown",
  "wallet-risk",
  "max-wallets-used",
  "requires-liveness",
  "sale-not-active",
  "wallet-not-linked",
  "outside-time-window",
]

function normalizeFailureReason(reason: string): PrePurchaseFailureReason {
  return (FAILURE_REASONS as readonly string[]).includes(reason)
    ? (reason as PrePurchaseFailureReason)
    : "unknown"
}

/** Normalize Sonar's PrePurchaseCheckResponse into the app's camelCase union. */
export function mapPrePurchase(res: PrePurchaseCheckResponse): PrePurchaseResult {
  if (res.ReadyToPurchase) {
    return { readyToPurchase: true }
  }
  return {
    readyToPurchase: false,
    failureReason: normalizeFailureReason(res.FailureReason),
    livenessCheckUrl: res.LivenessCheckURL || undefined,
  }
}

export async function prePurchaseCheck(args: {
  sessionId: string
  entityId: string
  wallet: string
}): Promise<PrePurchaseResult> {
  const res = await withSonarAuth(args.sessionId, (accessToken) =>
    createSonarClient(accessToken).prePurchaseCheck({
      saleUUID: env.SONAR_SALE_UUID,
      entityID: args.entityId,
      walletAddress: args.wallet,
    }),
  )
  return mapPrePurchase(res)
}

export async function generatePurchasePermit(args: {
  sessionId: string
  entityId: string
  wallet: string
  ipHmac?: string | null
  userAgentClass?: string | null
}): Promise<GeneratePurchasePermitResponse> {
  checkPermitDedup(args.wallet)
  const response = await withSonarAuth(args.sessionId, (accessToken) =>
    createSonarClient(accessToken).generatePurchasePermit({
      saleUUID: env.SONAR_SALE_UUID,
      entityID: args.entityId,
      walletAddress: args.wallet,
    }),
  )
  await recordAudit("permit_issued", {
    entityId: args.entityId,
    wallet: args.wallet,
    ipHmac: args.ipHmac ?? null,
    userAgentClass: args.userAgentClass ?? null,
    // Short correlator (signature prefix), never the full sig.
    metadata: { permit_id_prefix: response.Signature.slice(0, 10), chain_id: auditChainId() },
  })
  return response
}
