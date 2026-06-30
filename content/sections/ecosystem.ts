/**
 * Content data for the Ecosystem section.
 *
 * Section copy for the build (dev-facing).
 */

export type Project = {
  name: string
  category: string
  body?: string
  href?: string
  icon: string
}

export const featured: Project[] = [
  {
    name: "Gnoscan",
    category: "Explorer",
    body: "Gnoscan is the official blockchain explorer for Gno.land. Use it to search wallet addresses, transaction hashes, blocks, and contracts.",
    href: "https://gnoscan.io",
    icon: "search",
  },
  {
    name: "Adena",
    category: "Wallet",
    body: "Adena is an open-source, non-custodial wallet for Gno.land built with an emphasis on user experience.",
    href: "https://adena.app",
    icon: "shield-arrow",
  },
  {
    name: "Gnoswap",
    category: "DEX",
    body: "GnoSwap is the first decentralized exchange on Gno.land built on the principles of security, community-ownership, and efficiency.",
    href: "https://beta.gnoswap.io",
    icon: "swap",
  },
  {
    name: "Boards",
    category: "Forum",
    body: "Boards is an on-chain forum built natively on Gno.land. It enables structured, open dialogue and community-driven discussion, free from centralized moderation and external control.",
    href: "https://gno.land/r/gnoland/boards2/v1:OpenDiscussions",
    icon: "forum",
  },
  {
    name: "Akkadia",
    category: "Game",
    body: "Akkadia is an on-chain sandbox game where players create their own worlds, expand them together, and leave their activities as persistent on-chain records.",
    href: "https://abp.akkadia.land",
    icon: "globe",
  },
  {
    name: "Gno Playground",
    category: "Development",
    body: "Gno Playground is a browser-based environment for writing, testing, and experimenting with Gno code. Share your code, run unit tests, deploy realms and packages, and execute functions directly from the interface with no local setup required.",
    href: "https://play.gno.land/",
    icon: "play",
  },
]

export const others: Project[] = [
  {
    name: "Gno Studio Connect",
    category: "Connection",
    body: "Direct access to Gno.land's smart contracts through function calls. Explore and interact with any realm's exposed functions.",
    icon: "plug",
  },
  {
    name: "Tendermint2",
    category: "Consensus",
    body: "The evolved consensus engine, redesigned from the ground up for simplicity, security, and performance.",
    icon: "cube",
  },
  {
    name: "Gnokey",
    category: "Key management",
    body: "Secure key management and transaction signing for interacting with Gno.land and related networks.",
    icon: "key",
  },
  {
    name: "Gnoweb",
    category: "Web interface",
    body: "The official web interface for browsing and interacting with Gno.land realms and packages.",
    icon: "browser",
  },
]
