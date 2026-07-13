/**
 * Content data for the Ecosystem section.
 *
 * Section copy for the build (dev-facing).
 */

// category / body text lives in the i18n catalogs (namespace "Ecosystem"), keyed by id.
// hasBody marks items that render a body line.
export type Project = {
  id: string
  name: string
  hasBody?: boolean
  href?: string
  icon: string
}

export const featured: Project[] = [
  { id: "gnoscan", name: "Gnoscan", hasBody: true, href: "https://gnoscan.io", icon: "search" },
  { id: "adena", name: "Adena", hasBody: true, href: "https://adena.app", icon: "shield-arrow" },
  { id: "gnoswap", name: "Gnoswap", hasBody: true, href: "https://beta.gnoswap.io", icon: "swap" },
  {
    id: "boards",
    name: "Boards",
    hasBody: true,
    href: "https://gno.land/r/gnoland/boards2/v1:OpenDiscussions",
    icon: "forum",
  },
  {
    id: "akkadia",
    name: "Akkadia",
    hasBody: true,
    href: "https://abp.akkadia.land",
    icon: "globe",
  },
  {
    id: "gno-playground",
    name: "Gno Playground",
    hasBody: true,
    href: "https://play.gno.land/",
    icon: "play",
  },
]

export const others: Project[] = [
  { id: "gno-studio-connect", name: "Gno Studio Connect", hasBody: true, icon: "plug" },
  { id: "tendermint2", name: "Tendermint2", hasBody: true, icon: "cube" },
  { id: "gnokey", name: "Gnokey", hasBody: true, icon: "key" },
  { id: "gnoweb", name: "Gnoweb", hasBody: true, icon: "browser" },
]
