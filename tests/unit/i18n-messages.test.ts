import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { ALL_LOCALES, DEFAULT_LOCALE } from "../../i18n/locales"

/**
 * Guards the "no holes in the UI" invariant across EVERY catalog in the repo: each locale catalog
 * must expose the exact same key paths as the default-locale catalog, with no empty values. Adding
 * a new locale (e.g. fr) is automatically covered - drop messages/fr.json and add "fr" to
 * ALL_LOCALES, and this test enforces parity without any edit here.
 *
 * Deliberately iterates ALL_LOCALES, not the shipped ones: a locale kept in the repo while disabled
 * (Korean today) must stay in sync with en.json, or re-enabling it would ship holes.
 */

type Json = Record<string, unknown>

const MESSAGES_DIR = join(__dirname, "../../messages")

function load(locale: string): Json {
  return JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), "utf8"))
}

function keyPaths(obj: Json, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return value && typeof value === "object" && !Array.isArray(value)
      ? keyPaths(value as Json, path)
      : [path]
  })
}

function emptyValues(obj: Json, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return emptyValues(value as Json, path)
    }
    return typeof value === "string" && value.trim() === "" ? [path] : []
  })
}

describe("i18n message catalogs", () => {
  const defaultLocale = DEFAULT_LOCALE
  const basePaths = keyPaths(load(defaultLocale)).sort()

  it("every declared locale has a catalog file", () => {
    const present = new Set(readdirSync(MESSAGES_DIR).map((f) => f.replace(/\.json$/, "")))
    for (const locale of ALL_LOCALES) {
      expect(present.has(locale), `missing messages/${locale}.json`).toBe(true)
    }
  })

  for (const locale of ALL_LOCALES) {
    if (locale === defaultLocale) continue

    it(`"${locale}" exposes the exact same key paths as "${defaultLocale}"`, () => {
      const paths = keyPaths(load(locale)).sort()
      const missing = basePaths.filter((p) => !paths.includes(p))
      const extra = paths.filter((p) => !basePaths.includes(p))
      expect({ locale, missing, extra }).toEqual({ locale, missing: [], extra: [] })
    })
  }

  for (const locale of ALL_LOCALES) {
    it(`"${locale}" has no empty string values`, () => {
      expect(emptyValues(load(locale))).toEqual([])
    })
  }
})
