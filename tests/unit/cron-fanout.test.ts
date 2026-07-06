import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Netlify Scheduled Functions are plain ESM, excluded from tsconfig, and outside any test
// harness - imported here directly with the CRON_*/URL env stubbed and global fetch mocked,
// so the fan-out + failure-reporting behavior is covered without hitting the network. The
// path is a variable (not a literal import specifier) so tsc, which pulls the "excluded"
// netlify dir into the program once it's imported, doesn't try to type-check the .mts file
// under this project's module-resolution settings.
const modules = {
  "outbid-cron": {
    path: "../../netlify/functions/outbid-cron.mts",
    route: "/api/push/cron",
  },
  "db-cleanup": {
    path: "../../netlify/functions/db-cleanup.mts",
    route: "/api/db/cleanup",
  },
  "price-email-cron": {
    path: "../../netlify/functions/price-email-cron.mts",
    route: "/api/email/cron",
  },
} as const

async function importHandler(name: keyof typeof modules) {
  vi.resetModules()
  const mod = (await import(modules[name].path)) as { default: () => Promise<void> }
  return mod.default
}

const fetchSpy = vi.fn()

const okResponse = () => Promise.resolve(new Response(null, { status: 200 }))

// Pin every env var the target resolution reads (URL is injected on a real Netlify runner),
// so the suite behaves identically regardless of what the host environment exports.
beforeEach(() => {
  vi.unstubAllEnvs()
  vi.stubEnv("CRON_SECRET", "s3cret")
  vi.stubEnv("CRON_PROD_URL", "https://prod.example")
  vi.stubEnv("CRON_STAGING_URL", "https://staging.example")
  vi.stubEnv("URL", "https://netlify-injected.example")
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.example")
  fetchSpy.mockReset()
  vi.stubGlobal("fetch", fetchSpy)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("netlify scheduled function fan-out", () => {
  it.each(Object.keys(modules) as (keyof typeof modules)[])(
    "%s resolves and hits prod + staging when every target responds ok",
    async (name) => {
      fetchSpy.mockImplementation(okResponse)
      const handler = await importHandler(name)
      await expect(handler()).resolves.toBeUndefined()
      const route = modules[name].route
      expect(fetchSpy).toHaveBeenCalledWith(`https://prod.example${route}`, expect.anything())
      expect(fetchSpy).toHaveBeenCalledWith(`https://staging.example${route}`, expect.anything())
    },
  )

  it.each(Object.keys(modules) as (keyof typeof modules)[])(
    "%s throws so Netlify marks the run failed when the PROD leg fails",
    async (name) => {
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      fetchSpy.mockImplementation((url: RequestInfo | URL) =>
        String(url).startsWith("https://prod.example")
          ? Promise.reject(new Error("network down"))
          : okResponse(),
      )
      const handler = await importHandler(name)
      await expect(handler()).rejects.toThrow("prod.example -> unreachable")
      expect(errSpy).toHaveBeenCalledWith(
        expect.stringContaining(`${name}: https://prod.example -> unreachable`),
      )
    },
  )

  it.each(Object.keys(modules) as (keyof typeof modules)[])(
    "%s stays green when only the STAGING leg fails (a gated branch deploy must not fail the prod schedule)",
    async (name) => {
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      fetchSpy.mockImplementation((url: RequestInfo | URL) =>
        String(url).startsWith("https://staging.example")
          ? Promise.resolve(new Response(null, { status: 401 }))
          : okResponse(),
      )
      const handler = await importHandler(name)
      await expect(handler()).resolves.toBeUndefined()
      expect(errSpy).toHaveBeenCalledWith(
        expect.stringContaining(`${name}: staging https://staging.example -> 401`),
      )
    },
  )

  it("prefers CRON_PROD_URL over the Netlify-injected URL for the prod leg", async () => {
    fetchSpy.mockImplementation(okResponse)
    const handler = await importHandler("db-cleanup")
    await handler()
    const calledUrls = fetchSpy.mock.calls.map(([url]) => String(url))
    expect(calledUrls).toContain("https://prod.example/api/db/cleanup")
    expect(calledUrls).not.toContain("https://netlify-injected.example/api/db/cleanup")
  })

  it("falls back to URL when CRON_PROD_URL is set but EMPTY (blanked-not-deleted var)", async () => {
    vi.stubEnv("CRON_PROD_URL", "")
    fetchSpy.mockImplementation(okResponse)
    const handler = await importHandler("db-cleanup")
    await handler()
    const calledUrls = fetchSpy.mock.calls.map(([url]) => String(url))
    expect(calledUrls).toContain("https://netlify-injected.example/api/db/cleanup")
  })

  it("throws when no prod target resolves at all (must not report a green no-op)", async () => {
    vi.stubEnv("CRON_PROD_URL", "")
    vi.stubEnv("URL", "")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "")
    fetchSpy.mockImplementation(okResponse)
    const handler = await importHandler("db-cleanup")
    await expect(handler()).rejects.toThrow("no production target")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("skips the staging leg when it resolves to the same URL as prod", async () => {
    vi.stubEnv("CRON_STAGING_URL", "https://prod.example")
    fetchSpy.mockImplementation(okResponse)
    const handler = await importHandler("db-cleanup")
    await handler()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it("no-ops without a CRON_SECRET", async () => {
    vi.stubEnv("CRON_SECRET", "")
    const handler = await importHandler("db-cleanup")
    await expect(handler()).resolves.toBeUndefined()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
