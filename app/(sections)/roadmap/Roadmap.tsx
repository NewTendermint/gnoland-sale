/**
 * Vertical roadmap timeline. The Q1 2026 Beta Mainnet item is intentionally
 * highlighted (full-opacity border) because it anchors the sale narrative;
 * it is the milestone the token is buying into.
 */
export function Roadmap() {
  const items: Array<{ year: string; title?: string; body: string; highlight?: boolean }> = [
    {
      year: "2021",
      body: "Jae Kwon bootstraps Gno Virtual Machine (GnoVM) and Tendermint node. Foundational VM, state persistence, first Boards realm, and functional chain.",
    },
    {
      year: "2022",
      body: "Test1 to Test3 with improved usability and example realms. GnoVM safety, initial community workshops.",
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
    <section id="roadmap" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Roadmap</p>
        <h2 className="mb-12 text-3xl font-bold">From bootstrap to mainnet</h2>
        <ol className="space-y-6">
          {items.map((item) => (
            <li
              key={item.year}
              className={`rounded-sm border p-6 ${item.highlight ? "border-fg" : "border-border"}`}
            >
              <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">{item.year}</p>
              {item.title ? <h3 className="mb-2 font-semibold">{item.title}</h3> : null}
              <p className="text-sm text-fg-muted">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
