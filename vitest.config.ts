import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    // Server-only modules (lib/env, lib/security/*) validate these at import
    // time. Provide well-formed throwaway values so any server unit test can
    // import them under jsdom without tripping the startup guard. These are
    // not real secrets; they are built with .repeat() so no literal secret
    // pattern lands in the file.
    env: {
      SONAR_CLIENT_UUID: "test-client-uuid",
      SONAR_REDIRECT_URI: "https://example.test/api/auth/sonar/callback",
      SONAR_SALE_UUID: "test-sale-uuid",
      SONAR_API_BASE_URL: "https://api.example.test",
      ENCRYPTION_KEY: "a".repeat(64),
      IP_HMAC_PEPPER: "b".repeat(64),
      SESSION_PASSWORD: "x".repeat(40),
      DATABASE_URL: "postgres://user:pass@localhost:5432/test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      // `import "server-only"` throws outside an RSC bundle, and `client-only`
      // throws inside one; neither condition exists in the test runner, so map
      // both to an empty module.
      "server-only": path.resolve(__dirname, "./tests/stubs/empty.ts"),
      "client-only": path.resolve(__dirname, "./tests/stubs/empty.ts"),
    },
  },
})
