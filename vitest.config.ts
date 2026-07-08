import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  // Next's tsconfig sets jsx: "preserve" (its own compiler owns that step), which the test
  // runner's transform inherits and then rejects when a test imports a component. The React
  // plugin compiles JSX regardless, opening component files to the unit suite.
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // Restore every vi.spyOn spy before each test: a console spy left behind by a mid-test
    // assertion failure must not bleed into the file's remaining tests. Module-scope vi.fn
    // mocks are NOT touched - each suite still owns its beforeEach resets.
    restoreMocks: true,
    // Same hygiene for vi.stubEnv: every suite re-stubs what it needs per test, so stubs
    // must never outlive the test that made them.
    unstubEnvs: true,
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
