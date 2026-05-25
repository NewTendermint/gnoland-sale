/**
 * Roadmap. Grid 3x3 (not a list). Year eyebrow + title + body. Q1 2026 in
 * mint to signal the launch the sale buys into.
 */
export function Roadmap() {
  const items: Array<{ year: string; title?: string; body: string; highlight?: boolean }> = [
    {
      year: "2021",
      body: "Jae Kwon bootstraps Gno Virtual Machine (GnoVM) and Tendermint node. Foundational VM, state persistence, first Boards realm, and functional chain.",
    },
    {
      year: "2023",
      body: "Introduced tools like gnodev, Playground, and GnoChess. Released official docs and Gno Network Public License.",
    },
    {
      year: "2024",
      body: "Permanent multi-node Test4 (with GovDAO) and Test5 with expanded validators. Major VM fixes, performance upgrades, and stability improvements.",
    },
    {
      year: "2025",
      body: "Stabilization with Test6 to Test8, GovDAO V3, token mechanics, and major GnoVM upgrades. Governance testing, dev updates, community events, and validator tooling improvements.",
    },
    {
      year: "Q1 2026",
      title: "Gno.land Beta Mainnet Launch",
      body: "Token distribution. Release of functional network and initial operating system.",
      highlight: true,
    },
    {
      year: "Q2 2026",
      title: "Expanding the network",
      body: "Bridging AtomOne and Gno.land for security and interoperability. Advancing Gno's functionality and features.",
    },
    {
      year: "Q3 2026",
      title: "Mainnet Launch",
      body: "Protocol-level transfers enabled. Fully interoperable, security-hardened network.",
    },
    {
      year: "Q4 2026 - Beyond",
      title: "Ecosystem Growth",
      body: "Major focus on building killer apps on Gno.land. Develop tooling.",
    },
  ]
  return (
    <section id="roadmap" className="bg-bg-base py-20 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-12 flex max-w-3xl gap-6">
          <div aria-hidden="true" className="w-0.5 shrink-0 bg-fg-hi/40" />
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-fg-muted">
              Roadmap
            </p>
            <h2 className="text-3xl font-bold uppercase leading-[1.05] tracking-tight text-fg-hi md:text-4xl lg:text-5xl">
              From bootstrap to mainnet
            </h2>
          </div>
        </div>
        <ol className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.year}>
              <p
                className={`mb-3 font-mono text-xs uppercase tracking-widest ${
                  item.highlight ? "text-mint" : "text-fg-muted"
                }`}
              >
                {item.year}
              </p>
              {item.title ? (
                <h3 className="mb-2 text-base font-semibold tracking-tight text-fg-hi md:text-lg">
                  {item.title}
                </h3>
              ) : null}
              <p className="line-clamp-4 text-sm text-fg-body">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
