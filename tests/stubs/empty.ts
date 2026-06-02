// Stub for `server-only` / `client-only` under Vitest.
// Those packages throw when imported outside their intended bundle (RSC vs
// client). In the node/jsdom test runner there is no such bundle, so we alias
// them to this no-op module (see vitest.config.ts `resolve.alias`).
export {}
