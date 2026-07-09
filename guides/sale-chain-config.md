# Sale chain and contract configuration - single reference

Where every chain-related value lives, why it lives there, and how to change it safely.
The rule in one line: **the contract addresses are code, the chain selection is versioned in
`netlify.toml`, the dashboard only holds secrets, and every fallback resolves to Sepolia.**

## The four storage locations

| Value | Lives in | Why there |
|---|---|---|
| Mainnet SettlementSale address | `lib/sale/contracts.ts` (`CONTRACTS[mainnet.id]`) | A prod address change must be a reviewed commit, never a silent env edit. NOT env-overridable. |
| Sepolia SettlementSale address | `lib/sale/contracts.ts` (default) + `NEXT_PUBLIC_SEPOLIA_SETTLEMENT_SALE` env override | The Sonar sandbox redeploys occasionally; the override avoids a commit each time. Sepolia only. |
| Chain selection (`SALE_CHAIN` + `NEXT_PUBLIC_SALE_CHAIN`) | `netlify.toml`, one block per deploy context | Versioned, reviewed in PR, and netlify.toml ALWAYS wins over the dashboard, so dashboard drift cannot flip a chain. |
| Secrets (Sonar creds, `ENCRYPTION_KEY`, `SESSION_PASSWORD`, DB, VAPID...) | Netlify dashboard, scoped per context | Never committed. Nothing chain-related is a secret. |

Local dev reads `.env.local` (pair set to `sepolia`; `.env.example` documents it).

## Chain per context (all versioned in netlify.toml)

| Context | `SALE_CHAIN` pair | Contract resolved |
|---|---|---|
| production (sale.gno.land) | `mainnet` | `0x959f2ceE7B6C2095d228692eCb2E4744f2D3fDb4` |
| branch-deploy (staging) | `sepolia` | sandbox (`0x96e532...46B2` or the env override) |
| deploy-preview | `sepolia` | sandbox |
| local / anything unset | `sepolia` (code default) | sandbox |

The same pair also exists in the Netlify dashboard for every context. That is intentional
redundancy, not the source of truth: the toml overrides it. Do not delete either side without
updating this doc.

## The three safety layers

1. **Fail-safe default.** Client (`lib/sale/contracts.ts`) and server (`lib/env.ts` z.enum)
   both default to `sepolia` when the env is unset or empty. Mainnet is opt-in only. Losing the
   prod env pair degrades prod to Sepolia (sale stops working, visibly) - it can never make a
   non-prod context hit the mainnet contract.
2. **Build-time rejection.** Any value other than `mainnet`/`sepolia` throws at module scope on
   the client and fails the z.enum parse on the server: a typo fails the build instead of
   silently picking a chain.
3. **Runtime chain gate.** Every on-chain read/write is pinned to `SALE_CHAIN.id`
   (`lib/sale/onchain.ts` blocks bids when the wallet chain differs), so even with both
   addresses present in the code map, a Sepolia build physically cannot transact against the
   mainnet contract and vice versa.

Unit tests pin all of this: `tests/unit/sale/contracts.test.ts` (default, empty value, unknown
value, prototype-key rejection) and `tests/unit/sale/economics.test.ts` (mainnet floor guard).

## How to change things

- **New mainnet contract (redeploy):** edit `CONTRACTS[mainnet.id]` in `lib/sale/contracts.ts`,
  then verify before merging: `node scripts/probe-sale.mjs <address> <rpc1,rpc2>` must show the
  expected `saleUUID` (= prod `SONAR_SALE_UUID`), `paymentTokens` (USDC + USDT on mainnet) and
  stage. Cross-check at least two independent RPCs.
- **New sandbox contract:** `netlify env:set NEXT_PUBLIC_SEPOLIA_SETTLEMENT_SALE <address>`
  (all non-prod contexts), no commit needed.
- **Chain flip for a context:** edit the context block in `netlify.toml`, PR it. Env vars are
  baked at build time - the change is live at the NEXT deploy of that context, never before.
- **Sonar sale identifiers** (`SONAR_SALE_UUID`, `SONAR_CLIENT_UUID`, callback URI): dashboard,
  per context (prod = prod sale, others = sandbox sale). The on-chain `saleUUID()` of the
  configured contract must equal the context's `SONAR_SALE_UUID`; the probe script prints it.

## Verification commands

```bash
# What a context will use (dashboard side; remember the toml overrides these)
netlify env:get SALE_CHAIN --context production
netlify env:get NEXT_PUBLIC_SALE_CHAIN --context branch:staging

# What the code resolves for a given env (chain + contract)
NEXT_PUBLIC_SALE_CHAIN=mainnet npx tsx -e \
  "import {SALE_CHAIN, saleContractsFor} from './lib/sale/contracts'; \
   console.log(SALE_CHAIN.name, saleContractsFor(SALE_CHAIN.id)?.settlementSale)"

# Probe a deployed sale contract (stage, saleUUID, payment tokens, refund toggle)
node scripts/probe-sale.mjs 0x959f2ceE7B6C2095d228692eCb2E4744f2D3fDb4 \
  https://ethereum-rpc.publicnode.com,https://eth.drpc.org
```

Note: the secret scanner is told these keys are not secrets via `SECRETS_SCAN_OMIT_KEYS` in
`netlify.toml` (public network names and public contract addresses). Never add a real secret to
that list or to this file.
