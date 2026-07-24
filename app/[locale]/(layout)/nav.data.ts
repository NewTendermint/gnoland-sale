// Section nav entries carry a `key` into the "Nav" message namespace (translated per locale).
// Community/external link labels are proper nouns (brand/platform names), identical across
// locales, so they stay inline.
export type NavLink = { key: string; href: string }
export type ExternalNavLink = { label: string; href: string }

export const navLinks: NavLink[] = [
  { key: "sale", href: "#token-details" },
  { key: "tokenomics", href: "#tokenomics" },
  { key: "howItWorks", href: "#how-it-works" },
  { key: "faq", href: "#faq" },
  { key: "project", href: "#narrative" },
  { key: "team", href: "#team" },
  { key: "roadmap", href: "#roadmap" },
  { key: "ecosystem", href: "#ecosystem" },
]

export const heroNavLinks: NavLink[] = [
  ...navLinks.filter((l) => l.href !== "#faq"),
  ...navLinks.filter((l) => l.href === "#faq"),
]

export const communityLinks: ExternalNavLink[] = [
  { label: "X / Twitter", href: "https://x.com/_gnoland" },
  { label: "Discord", href: "https://discord.gg/gnoland" },
  { label: "Telegram", href: "https://t.me/join_gnoland" },
  { label: "YouTube", href: "https://www.youtube.com/@_gnoland" },
]

export const externalLinks: ExternalNavLink[] = [
  { label: "Gno.land", href: "https://gno.land" },
  { label: "NewTendermint", href: "https://newtendermint.org" },
  { label: "GitHub", href: "https://github.com/gnolang" },
  { label: "Adena", href: "https://adena.app" },
]

// Sub-pages that render the minimal "Legal" header title (locale prefix already stripped by the
// i18n usePathname the Header uses).
export const LEGAL_PATHS = new Set([
  "/us-investor-disclaimer",
  "/privacy-policy",
  "/terms-of-service",
])
