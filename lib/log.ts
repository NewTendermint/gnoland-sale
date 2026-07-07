// Single choke point for server-side error logging (PII policy: log the message, never the
// error object - upstream payloads/stacks can embed wallets or entity ids).
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
