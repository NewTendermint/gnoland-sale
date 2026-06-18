import "server-only"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/client"
import { oauthTokens } from "../db/schema"
import { decrypt, encrypt } from "../security/encryption"

export interface StoredTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

// Decrypted token envelope; parsed (not cast) on load so schema skew fails loudly.
const tokenPayloadSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

/** Encrypt and upsert the OAuth token pair; only ciphertext + expiry are persisted. */
export async function storeTokens(sessionId: string, tokens: StoredTokens): Promise<void> {
  const encryptedTokens = await encrypt(
    JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
  )
  const now = new Date()
  await db
    .insert(oauthTokens)
    .values({
      sessionId,
      encryptedTokens,
      expiresAt: tokens.expiresAt,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: oauthTokens.sessionId,
      set: { encryptedTokens, expiresAt: tokens.expiresAt, updatedAt: now },
    })
}

/** Load and decrypt the OAuth token pair for a session, or null if none stored. */
export async function loadTokens(sessionId: string): Promise<StoredTokens | null> {
  const rows = await db
    .select()
    .from(oauthTokens)
    .where(eq(oauthTokens.sessionId, sessionId))
    .limit(1)
  const row = rows[0]
  if (!row) {
    return null
  }
  const { accessToken, refreshToken } = tokenPayloadSchema.parse(
    JSON.parse(await decrypt(row.encryptedTokens)),
  )
  return { accessToken, refreshToken, expiresAt: row.expiresAt }
}

/** Delete a session's stored tokens (used after a Sonar 401). */
export async function deleteTokens(sessionId: string): Promise<void> {
  await db.delete(oauthTokens).where(eq(oauthTokens.sessionId, sessionId))
}
