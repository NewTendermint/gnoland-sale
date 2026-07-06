import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Netlify Scheduled Functions are plain ESM, excluded from tsconfig, and outside any test
// harness - imported here directly with CRON_SECRET/CRON_PROD_URL/CRON_STAGING_URL/URL
// stubbed and global fetch mocked, so the fan-out + failure-reporting behavior is covered
// without hitting the network. The path is a variable (not a literal import specifier) so
// tsc, which pulls the "excluded" netlify dir into the program once it's imported, doesn't
// try to type-check the .mts file under this project's module-resolution settings.
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

beforeEach(() => {
  vi.unstubAllEnvs()
  vi.stubEnv("CRON_SECRET", "s3cret")
  fetchSpy.mockReset()
  vi.stubGlobal("fetch", fetchSpy)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("netlify scheduled function fan-out", () => {
  it("db-cleanup prefers CRON_PROD_URL over the Netlify-injected URL, like its siblings", async () => {
    vi.stubEnv("CRON_PROD_URL", "https://prod.example")
    vi.stubEnv("URL", "https://unreachable.example")
    fetchSpy.mockResolvedValue(new Response(null, { status: 200 }))
    const handler = await importHandler("db-cleanup")
    await handler()
    const calledUrls = fetchSpy.mock.calls.map(([url]) => String(url))
    expect(calledUrls).toContain("https://prod.example/api/db/cleanup")
    expect(calledUrls).not.toContain("https://unreachable.example/api/db/cleanup")
  })

  it.each(Object.keys(modules) as (keyof typeof modules)[])(
    "%s resolves when every target responds ok",
    async (name) => {
      vi.stubEnv("CRON_PROD_URL", "https://prod.example")
      vi.stubEnv("CRON_STAGING_URL", "https://staging.example")
      fetchSpy.mockResolvedValue(new Response(null, { status: 200 }))
      const handler = await importHandler(name)
      await expect(handler()).resolves.toBeUndefined()
      const route = modules[name].route
      expect(fetchSpy).toHaveBeenCalledWith(`https://prod.example${route}`, expect.anything())
      expect(fetchSpy).toHaveBeenCalledWith(`https://staging.example${route}`, expect.anything())
    },
  )

  it.each(Object.keys(modules) as (keyof typeof modules)[])(
    "%s throws so Netlify marks the run failed when a target fails",
    async (name) => {
      vi.stubEnv("CRON_PROD_URL", "https://prod.example")
      vi.stubEnv("CRON_STAGING_URL", "https://staging.example")
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      fetchSpy.mockImplementation((url: RequestInfo | URL) =>
        String(url).startsWith("https://prod.example")
          ? Promise.resolve(new Response(null, { status: 200 }))
          : Promise.reject(new Error("network down")),
      )
      const handler = await importHandler(name)
      await expect(handler()).rejects.toThrow("staging.example")
      expect(errSpy).toHaveBeenCalledWith(
        expect.stringContaining(`${name}: https://staging.example -> unreachable`),
      )
      errSpy.mockRestore()
    },
  )
})
