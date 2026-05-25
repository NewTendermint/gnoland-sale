/**
 * Ecosystem. Compact grid (no list, no cards): logo placeholder + name +
 * short body. 13 projects in 2/3/4 cols. Body truncated to 2 lines.
 */

const ACCENT_BLOCKS = [
  "var(--mint)",
  "var(--info)",
  "var(--amber)",
  "var(--mint-soft)",
  "var(--danger)",
]

export function Ecosystem() {
  const projects = [
    {
      name: "Gnoscan",
      body: "Developed by the Onbloc team, Gnoscan is the official blockchain explorer for Gno.land. Use it to search wallet addresses, transaction hashes, blocks, and contracts, making on-chain data accessible and easy to navigate.",
    },
    {
      name: "Adena",
      body: "An open-source, non-custodial wallet for Gno.land, developed by Onbloc. Built with an emphasis on user experience.",
    },
    {
      name: "Gnoswap",
      body: "The first decentralized exchange (DEX) on Gno.land. An automated market maker (AMM) protocol written in Gno, it enables permissionless token exchanges on the platform.",
    },
    {
      name: "Boards",
      body: "An on-chain forum application built natively on Gno.land. It enables structured, open dialogue and community-driven discussion, free from centralized moderation and external control. Designed to become a flagship social application for the network, Boards offers a decentralized alternative to traditional online forums.",
    },
    {
      name: "Akkadia",
      body: "An on-chain world-building game inspired by the Library of Alexandria. Users can create their own realms to build in their own style, and explore worlds created by others. One of the earliest examples of a fully on-chain creative application on Gno.land.",
    },
    {
      name: "Gno Playground",
      body: "A browser-based environment for writing, testing, and experimenting with Gno code. Share your code, run unit tests, deploy realms and packages, and execute functions directly from the interface with no local setup required.",
    },
    {
      name: "Gno Studio Connect",
      body: "Connect provides direct access to Gno.land's smart contracts through function calls. Use it to explore, interact with, and engage any realm's exposed functions on the network.",
    },
    {
      name: "CommonDAO",
      body: "A modular, on-chain governance framework built for Gno.land applications. It introduces a hierarchical structure of parent DAOs and subDAOs, enabling structured proposal management, voting procedures, and membership control.",
    },
    {
      name: "Tendermint2",
      body: "The evolved consensus engine, redesigned from the ground up for simplicity, security, and performance.",
    },
    {
      name: "Gnokey",
      body: "Secure key management and transaction signing for interacting with Gno.land and related networks.",
    },
    {
      name: "Gnodev",
      body: "A local development environment for building and testing Gno applications with hot reload.",
    },
    {
      name: "Gnoweb",
      body: "The official web interface for browsing and interacting with Gno.land realms and packages.",
    },
    {
      name: "Gnoverse",
      body: "A community-led GitHub organization for builders in the Gno.land ecosystem. A home for ecosystem projects, shared tooling, and open collaboration maintained by and for the developer community.",
    },
  ]
  return (
    <section id="ecosystem" className="bg-bg-base py-20 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-12 flex max-w-3xl gap-6">
          <div aria-hidden="true" className="w-0.5 shrink-0 bg-fg-hi/40" />
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-fg-muted">
              Ecosystem
            </p>
            <h2 className="text-3xl font-bold uppercase leading-[1.05] tracking-tight text-fg-hi md:text-4xl lg:text-5xl">
              Apps, tools, and infrastructure
            </h2>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {projects.map((p, i) => (
            <li key={p.name}>
              <div
                aria-hidden="true"
                className="mb-4 size-10 rounded-md"
                style={{ backgroundColor: ACCENT_BLOCKS[i % ACCENT_BLOCKS.length] }}
              />
              <h3 className="mb-1 text-base font-semibold tracking-tight text-fg-hi">{p.name}</h3>
              <p className="line-clamp-3 text-sm text-fg-body">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
