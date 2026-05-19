/**
 * Static token sale terms. Several values await sign-off from tokenomics
 * and legal, so unresolved fields fall back to "TBD" instead of a number.
 */
export function TokenDetails() {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Token", value: "GNOT" },
    { label: "Minimum price", value: "TBD" },
    { label: "Total raise", value: "TBD" },
    { label: "Min commitment", value: "TBD" },
    { label: "Max commitment", value: "TBD" },
    { label: "FDV (when raise met)", value: "TBD" },
    { label: "Unlock schedule", value: "TBD" },
    { label: "Allocation", value: "TBD" },
    { label: "Contribution window", value: "TBD" },
    { label: "Accepted currencies", value: "USDC, USDT (on Base)" },
    { label: "Mainnet launch", value: "Q1 2026 Beta, Q3 2026 Mainnet (transferable)" },
    { label: "Auction format", value: "Uniform Price Auction (English Auction)" },
  ]
  return (
    <section id="token-details" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Token sale details</p>
        <h2 className="mb-12 text-3xl font-bold">The terms, at a glance</h2>
        <dl className="grid grid-cols-1 gap-x-12 gap-y-4 md:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 border-b border-border pb-3"
            >
              <dt className="text-sm text-fg-muted">{row.label}</dt>
              <dd className="text-right font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
