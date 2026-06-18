export type NavLink = { label: string; href: string }

export const navLinks: NavLink[] = [
  { label: "Sale", href: "#token-details" },
  { label: "Tokenomics", href: "#tokenomics" },
  { label: "How it works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
  { label: "Project", href: "#narrative" },
  { label: "Team", href: "#team" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Ecosystem", href: "#ecosystem" },
]

export const heroNavLinks: NavLink[] = [
  ...navLinks.filter((l) => l.href !== "#faq"),
  ...navLinks.filter((l) => l.href === "#faq"),
]

export const communityLinks: NavLink[] = [
  { label: "X / Twitter", href: "https://x.com/_gnoland" },
  { label: "Discord", href: "https://discord.gg/gnoland" },
  { label: "Telegram", href: "https://t.me/join_gnoland" },
  { label: "YouTube", href: "https://youtube.com/@gnoland" },
]

export const externalLinks: NavLink[] = [
  { label: "gno.land", href: "https://gno.land" },
  { label: "Adena", href: "https://adena.app" },
  { label: "GitHub", href: "https://github.com/gnolang" },
  { label: "NewTendermint", href: "https://newtendermint.org" },
]
