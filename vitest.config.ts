import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    // Server-only modules (lib/env, lib/security/*) validate these at import time.
    // Throwaway non-secret values (built with .repeat() so no literal secret pattern
    // lands here) let server unit tests import them under jsdom.
    env: {
      SONAR_CLIENT_UUID: "test-client-uuid",
      SONAR_REDIRECT_URI: "https://example.test/api/auth/sonar/callback",
      SONAR_SALE_UUID: "test-sale-uuid",
      SONAR_API_BASE_URL: "https://api.example.test",
      ENCRYPTION_KEY: "a".repeat(64),
      IP_HMAC_PEPPER: "b".repeat(64),
      SESSION_PASSWORD: "x".repeat(40),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      // `import "server-only"` throws outside an RSC bundle (and `client-only`
      // inside one); the test runner is neither, so stub both to an empty module.
      "server-only": path.resolve(__dirname, "./tests/stubs/empty.ts"),
      "client-only": path.resolve(__dirname, "./tests/stubs/empty.ts"),
    },
  },
})
