/**
 * Content data for the Ecosystem section.
 *
 * `content/sections.md` is the human source of truth for marketing/legal
 * copy. This module mirrors that copy for the build (dev-facing).
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
    body: "Developed by the Onbloc team, Gnoscan is the official blockchain explorer for Gno.land. Use it to search wallet addresses, transaction hashes, blocks, and contracts, making on-chain data accessible and easy to navigate.",
    href: "https://gnoscan.io",
    icon: "search",
  },
  {
    name: "Adena",
    category: "Wallet",
    body: "An open-source, non-custodial wallet for Gno.land, developed by Onbloc. Built with an emphasis on user experience.",
    href: "https://adena.app",
    icon: "shield-arrow",
  },
  {
    name: "Gnoswap",
    category: "DEX",
    body: "The first decentralized exchange (DEX) on Gno.land. An automated market maker (AMM) protocol written in Gno, it enables permissionless token exchanges on the platform. Currently under development.",
    href: "https://beta.gnoswap.io",
    icon: "swap",
  },
  {
    name: "Boards",
    category: "Forum",
    body: "An on-chain forum application built natively on Gno.land. It enables structured, open dialogue and community-driven discussion, free from centralized moderation and external control. Designed to become a flagship social application for the network, Boards offers a decentralized alternative to traditional online forums.",
    icon: "forum",
  },
  {
    name: "Akkadia",
    category: "Game",
    body: "An on-chain world-building game inspired by the Library of Alexandria. Users can create their own realms to build in their own style, and explore worlds created by others. One of the earliest examples of a fully on-chain creative application on Gno.land.",
    icon: "globe",
  },
  {
    name: "Gno Playground",
    category: "Development",
    body: "A browser-based environment for writing, testing, and experimenting with Gno code. Share your code, run unit tests, deploy realms and packages, and execute functions directly from the interface with no local setup required.",
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
