// Single choke point for server-side error logging (PII policy: log the message, never the
// error object - upstream payloads/stacks can embed wallets or entity ids).
//
// The message alone is not safe either: viem prints DECODED call args inside err.message, so a
// failed contract read would log the caller's entity id; upstream errors echo UUIDs the same way.
// Redacting here means no call site has to remember. Addresses go too - a regex cannot tell a
// contract from a wallet. Short hex stays readable (selectors, "0x" revert data): it identifies
// nobody and is what makes a log actionable.
const IDENTIFIER = /0x[0-9a-fA-F]{16,}|[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}/g

export function errorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  return message.replace(IDENTIFIER, "[redacted]")
}
