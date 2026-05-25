/**
 * GNOT utility: 4 use cases as plain text on the section bg.
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
    <section id="gnot-utility" className="bg-bg-base py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-20 max-w-4xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-fg-muted">
            GNOT utility
          </p>
          <h2 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight text-fg-hi md:text-5xl lg:text-6xl">
            GNOT is the native utility token for all economic activity
          </h2>
        </div>
        <ul className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2">
          {uses.map((u, i) => (
            <li key={u.title}>
              <p className="font-mono text-xs uppercase tracking-widest text-fg-faint">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-fg-hi md:text-2xl">
                {u.title}
              </h3>
              <p className="mt-4 text-base text-fg-body">{u.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
