/**
 * Content data for the Features section.
 *
 * `content/sections.md` is the human source of truth for marketing/legal
 * copy. This module mirrors that copy for the build (dev-facing). `icon` keys
 * into the shared Icon registry (app/(ui)/Icon.tsx) and is presentational.
 */

export const features = [
  {
    icon: "users-group",
    title: "The World's First General-Purpose, Language-Based, Multi-User OS",
    body: "More than just a typical smart contract platform, Gno.land is designed to be a general-purpose operating system where developer communities can collaboratively build and contribute to a single, shared, ever-evolving program.",
  },
  {
    icon: "terminal",
    title: "Built for Go Developers",
    body: "Gno.land is powered by Gno, a programming language that is 99% identical to Go. With millions of Go developers worldwide, anyone familiar with Go can start building on Gno.land immediately. No new language to learn, no unfamiliar tooling.",
  },
  {
    icon: "search",
    title: "Human-Readable Smart Contracts",
    body: "By running smart contracts as plain, readable source code rather than opaque bytecode, Gno.land lets anyone read, audit, fork, and improve any application on the network with complete transparency.",
  },
  {
    icon: "network",
    title: "Native Composability and Type Safety",
    body: "Gno.land uses Go-style packages with full type checking, so bugs are caught before deployment rather than on a live network. Developers can safely build on top of existing contracts, making complex applications easier to compose and maintain.",
  },
  {
    icon: "shield-check",
    title: "Fully Deterministic Execution",
    body: "Every smart contract on Gno.land behaves identically across the entire network, guaranteeing predictable, trustless consensus while keeping code simple, transparent, and straightforward to audit.",
  },
  {
    icon: "database",
    title: "Automatic Data Persistence",
    body: "Gno.land automatically saves and manages data for developers, eliminating some of the most repetitive and error-prone work in smart contract development. On Gno.land, developers can focus on the important stuff - building and shipping.",
  },
]
