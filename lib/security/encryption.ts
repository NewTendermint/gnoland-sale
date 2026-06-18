import "server-only"
import sodium from "libsodium-wrappers"
import { env } from "../env"

// libsodium secretbox (XSalsa20-Poly1305) for OAuth tokens at rest; nonce prepended per call.

async function encryptionKey(): Promise<Uint8Array> {
  await sodium.ready
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
