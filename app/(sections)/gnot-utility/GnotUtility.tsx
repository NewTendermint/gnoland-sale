/**
 * Utility section: explains what GNOT does on the network. Two-column layout
 * mirrors Narrative so readers register the pattern (text + illustration).
 */
export function GnotUtility() {
  const uses = [
    {
      title: "Transaction fees",
      body: "GNOT is the fuel that enables each and every transaction.",
    },
    {
      title: "Storage deposits",
      body: "Owning GNOT means reserving ownership of storage on Gno.land.",
    },
    {
      title: "IBC/ICS interactions",
      body: "GNOT is used to pay for all cross-chain interactions.",
    },
    {
      title: "Contract execution",
      body: "GNOT functions as the gas token that powers smart contract execution.",
    },
  ]
  return (
    <section id="gnot-utility" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">GNOT utility</p>
        <h2 className="mb-12 text-3xl font-bold">
          GNOT is the native utility token for all economic activity
        </h2>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div
            aria-hidden="true"
            className="order-last flex min-h-[320px] items-center justify-center rounded-sm bg-fg/5 lg:order-first"
          >
            <p className="text-sm text-fg-faint">[GNOT flow illustration, Layer 4]</p>
          </div>
          <div>
            <p className="mb-6 text-fg-muted">GNOT is used for</p>
            <ul className="space-y-4">
              {uses.map((u) => (
                <li key={u.title} className="border-b border-border pb-4 last:border-b-0">
                  <h3 className="mb-1 font-semibold">{u.title}</h3>
                  <p className="text-sm text-fg-muted">{u.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
