/**
 * Ecosystem showcase. Card descriptions are reused from newtendermint.org
 * so the messaging stays consistent across the Gno marketing surface.
 */
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
      body: "An on-chain forum application built natively on Gno.land. It enables structured, open dialogue and community-driven discussion, free from centralized moderation and external control.",
    },
    {
      name: "Akkadia",
      body: "An on-chain world-building game inspired by the Library of Alexandria. Users can create their own realms to build in their own style, and explore worlds created by others.",
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
    <section id="ecosystem" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Ecosystem</p>
        <h2 className="mb-12 text-3xl font-bold">Apps, tools, and infrastructure</h2>
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.name} className="rounded-sm border border-border p-6">
              <h3 className="mb-2 font-semibold">{p.name}</h3>
              <p className="text-sm text-fg-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
