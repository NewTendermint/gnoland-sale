/**
 * Content data for the Roadmap section.
 *
 * `content/sections.md` is the human source of truth for marketing/legal
 * copy. This module mirrors that copy for the build (dev-facing).
 */

export type RoadmapItem = { year: string; title?: string; body: string; highlight?: boolean }

export const items: RoadmapItem[] = [
  {
    year: "2021",
    body: "Jae Kwon bootstrapped the Gno Virtual Machine (GnoVM) and the Tendermint node, laying down the foundational VM, state persistence, the first Boards realm, and a fully functional running chain.",
  },
  {
    year: "2023",
    body: "The toolset matured with gnodev, the Playground, and GnoChess. Official documentation and the Gno Network Public License were published, formalizing how the network would be developed and shared.",
  },
  {
    year: "2024",
    body: "The first permanent multi-node testnet Test4 launched with GovDAO governance, followed by Test5 with an expanded validator set. The cycle delivered major VM fixes, performance upgrades, and broad stability improvements.",
  },
  {
    year: "2025",
    body: "Stabilization came with Test6 to Test8, GovDAO V3, token mechanics, and major GnoVM upgrades. Governance testing matured, dev updates shipped regularly, the community grew through events, and validator tooling reached production quality.",
  },
  {
    year: "Q1 2026",
    title: "Gno.land Beta Mainnet Launch",
    body: "GNOT distribution to bidders begins, and Gno.land Beta Mainnet goes live with the functional network and initial operating system layer ready for the first wave of real usage.",
    highlight: true,
  },
  {
    year: "Q2 2026",
    title: "Expanding the network",
    body: "AtomOne and Gno.land are bridged for shared security and interoperability with the broader Cosmos ecosystem, while Gno's core functionality and developer features continue to advance.",
  },
  {
    year: "Q3 2026",
    title: "Mainnet Launch",
    body: "Protocol-level token transfers are enabled, finalizing the path from beta to a fully interoperable, security-hardened mainnet ready for production-grade traffic.",
  },
  {
    year: "Q4 2026 - Beyond",
    title: "Ecosystem Growth",
    body: "With the network live, focus shifts to ecosystem growth. The team supports builders shipping the first meaningful applications on Gno.land and expands the developer toolkit.",
  },
]
