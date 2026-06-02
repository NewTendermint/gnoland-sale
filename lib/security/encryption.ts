import "server-only"
import sodium from "libsodium-wrappers"
import { env } from "../env"

/**
 * Authenticated symmetric encryption for OAuth tokens at rest.
 *
 * Scheme: libsodium secretbox (XSalsa20-Poly1305). A fresh 24-byte random
 * nonce is generated per call and prepended to the ciphertext, so encrypting
 * the same plaintext twice yields different output and decryption is fully
 * self-contained. The Poly1305 tag makes tampering fail closed: a modified
 * ciphertext throws on decrypt rather than returning corrupt plaintext.
 */

// libsodium runs from WASM and must finish initializing before any call.
// `sodium.ready` resolves once and is safe to await on every call.
async function encryptionKey(): Promise<Uint8Array> {
  await sodium.ready
  // env.ENCRYPTION_KEY is validated as 64 hex chars (32 bytes) at startup.
  return sodium.from_hex(env.ENCRYPTION_KEY)
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await encryptionKey()
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
  const cipher = sodium.crypto_secretbox_easy(plaintext, nonce, key)
  const combined = new Uint8Array(nonce.length + cipher.length)
  combined.set(nonce)
  combined.set(cipher, nonce.length)
  return sodium.to_base64(combined, sodium.base64_variants.URLSAFE_NO_PADDING)
}

export async function decrypt(token: string): Promise<string> {
  const key = await encryptionKey()
  const combined = sodium.from_base64(token, sodium.base64_variants.URLSAFE_NO_PADDING)
  const nonceBytes = sodium.crypto_secretbox_NONCEBYTES
  if (combined.length < nonceBytes) {
    throw new Error("Ciphertext too short")
  }
  const nonce = combined.subarray(0, nonceBytes)
  const cipher = combined.subarray(nonceBytes)
  // Throws if the Poly1305 tag does not verify (tampered or wrong key).
  const plain = sodium.crypto_secretbox_open_easy(cipher, nonce, key)
  return sodium.to_string(plain)
}
