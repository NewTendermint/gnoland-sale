import "server-only"

// Single, guarded entry point for sonar-core. Every server module reaches the
// Sonar SDK through this namespace so the `server-only` guard is enforced in
// one place: sonar-core must never enter the client bundle (CLAUDE.md pitfall
// #1). Client code uses our own proxy routes and client-safe type mirrors, not
// this module.
export * as sonarCore from "@echoxyz/sonar-core"
