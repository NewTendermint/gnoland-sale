import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

// Guards the versioned chain config in netlify.toml: the SALE_CHAIN pair must exist and be
// IDENTICAL inside each context block (a half-edited pair = client and server on different
// chains), production must be the only mainnet context, and every other block stays sepolia.
// String-level on purpose: no TOML parser dependency, and the file is flat key = "value".

const toml = readFileSync(join(__dirname, "../../../netlify.toml"), "utf8")

function contextBlock(name: string): string {
  const header = `[context.${name}.environment]`
  const start = toml.indexOf(header)
  expect(start, `${header} block missing`).toBeGreaterThan(-1)
  const rest = toml.slice(start + header.length)
  const next = rest.search(/^\[/m)
  return next === -1 ? rest : rest.slice(0, next)
}

function chainPair(block: string): { server?: string; client?: string } {
  return {
    server: block.match(/^\s*SALE_CHAIN\s*=\s*"([^"]+)"/m)?.[1],
    client: block.match(/^\s*NEXT_PUBLIC_SALE_CHAIN\s*=\s*"([^"]+)"/m)?.[1],
  }
}

describe("netlify.toml SALE_CHAIN pairs", () => {
  it("production is pinned to mainnet, both halves identical", () => {
    const pair = chainPair(contextBlock("production"))
    expect(pair).toEqual({ server: "mainnet", client: "mainnet" })
  })

  it.each(["deploy-preview", "branch-deploy"])(
    "%s is pinned to sepolia, both halves identical",
    (ctx) => {
      const pair = chainPair(contextBlock(ctx))
      expect(pair).toEqual({ server: "sepolia", client: "sepolia" })
    },
  )

  it("no context other than production ever declares mainnet", () => {
    const production = contextBlock("production")
    const withoutProd = toml.replace(production, "")
    expect(withoutProd).not.toMatch(/^\s*(NEXT_PUBLIC_)?SALE_CHAIN\s*=\s*"mainnet"/m)
  })
})
