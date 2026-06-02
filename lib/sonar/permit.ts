import "server-only"
import {
  APIError,
  type GeneratePurchasePermitResponse,
  type PrePurchaseCheckResponse,
} from "@echoxyz/sonar-core"
import { base, baseSepolia } from "viem/chains"
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

// Server-side replay guard (ADR threat model). The SDK's generatePurchasePermit
// no longer takes an amount, so the dedup key is the wallet alone.
//
// Operational caveat: this Map is per server instance. On Netlify (Lambda,
// horizontal scaling) it is a best-effort fast-path, NOT a cluster-wide
// guarantee. The authoritative replay controls are on chain (permit single-use
// + expiry + ECDSA); a durable cross-instance limiter (Blobs/DB) plus the Edge
// rate-limit (netlify.toml, ADR 4.5) are tracked for the pre-launch hardening.
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

// Coalesce the whole load-and-maybe-refresh per session. A refresh rotates the
// refresh token, so two parallel refreshes would invalidate each other (ADR
// threat: "race condition on token refresh"); coalescing the entire resolve
// also avoids redundant loads/decrypts during a burst on one session. Same
// per-instance caveat as the dedup Map above.
const ensureInFlight = new Map<string, Promise<StoredTokens>>()

/** Thrown when Sonar rejects the token (401); the session must re-authenticate. */
export class SonarAuthError extends Error {}

/**
 * Run a Sonar SDK call, converting a 401 (token revoked / expired beyond refresh)
 * into a typed SonarAuthError after clearing the dead token, so route handlers can
 * emit 401 -> the client re-auths, instead of masking it as a generic 502 (which
 * makes the UI loop "try again" forever). Non-401 errors pass through untouched.
 */
export async function withSonarAuth<T>(sessionId: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (err instanceof APIError && err.status === 401) {
      await deleteTokens(sessionId)
      throw new SonarAuthError("Sonar session expired; reconnect required")
    }
    throw err
  }
}

async function resolveTokens(sessionId: string): Promise<StoredTokens> {
  const current = await loadTokens(sessionId)
  if (!current) {
    throw new Error("No tokens for session")
  }
  if (!needsRefresh(current.expiresAt)) {
    return current
  }
  const res = await withSonarAuth(sessionId, () =>
    createSonarClient().refreshToken({ refreshToken: current.refreshToken }),
  )
  const fresh: StoredTokens = {
    accessToken: res.access_token,
    refreshToken: res.refresh_token,
    expiresAt: new Date(Date.now() + res.expires_in * 1000),
  }
  await storeTokens(sessionId, fresh)
  return fresh
}

export async function ensureFreshTokens(sessionId: string): Promise<StoredTokens> {
  if (sonarMockEnabled()) {
    // Mock: skip the DB token store entirely; the mock fetch ignores the token.
    return {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      expiresAt: new Date(Date.now() + 60 * 60_000),
    }
  }
  let inflight = ensureInFlight.get(sessionId)
  if (!inflight) {
    inflight = resolveTokens(sessionId).finally(() => ensureInFlight.delete(sessionId))
    ensureInFlight.set(sessionId, inflight)
  }
  return inflight
}

function auditChainId(): number {
  return env.SALE_CHAIN === "base" ? base.id : baseSepolia.id
}

/**
 * Append an audit row. Metadata is validated against the strict allow-list
 * (auditMetadataSchema) before it can be persisted, so no PII can leak into the
 * jsonb column even if a caller passes extra fields.
 */
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
    // Mock: no database. Metadata is still validated above (the PII allow-list
    // runs), but the row is not persisted.
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

/**
 * Normalize Sonar's PascalCase PrePurchaseCheckResponse into the app's camelCase
 * discriminated union (lib/sale/types.ts), the shape the client consumes. Pure
 * and exported for unit testing.
 */
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
  const tokens = await ensureFreshTokens(args.sessionId)
  const res = await withSonarAuth(args.sessionId, () =>
    createSonarClient(tokens.accessToken).prePurchaseCheck({
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
  const tokens = await ensureFreshTokens(args.sessionId)
  const response = await withSonarAuth(args.sessionId, () =>
    createSonarClient(tokens.accessToken).generatePurchasePermit({
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
    // A short, non-sensitive correlator (signature prefix), not the full sig.
    metadata: { permit_id_prefix: response.Signature.slice(0, 10), chain_id: auditChainId() },
  })
  return response
}
