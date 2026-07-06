/**
 * Content data for the Partners section.
 *
 * Section copy for the build (dev-facing).
 */

export type PartnerTeamMember = { name: string; role: string }

export const partners = [
  {
    name: "Samourai Coop",
    body: "Samourai Coop is a development team focused on DAOs and sustainable, community-powered applications, building the governance and coordination tools that decentralized communities need to thrive.",
    href: "https://www.samourai.world",
    team: [
      { name: "Louis B.", role: "Senior Reliability Engineer & DevOps" },
      { name: "Miguel V.", role: "Senior Backend Engineer" },
      { name: "Omar S.", role: "Senior Blockchain & Gno VM Engineer" },
      { name: "Antoine B.", role: "Task Force Lead & Coordinator" },
      { name: "David G.", role: "Developer Relations & Technical Engineer" },
    ] as PartnerTeamMember[],
  },
  {
    name: "Berty",
    body: "Berty is a non-profit NGO specializing in secure, peer-to-peer mobile communication. Berty's work on privacy-first infrastructure aligns closely with Gno.land's mission to build a censorship-resistant internet.",
    href: "https://berty.tech",
    team: [
      { name: "Rémi Barbero", role: "Full Stack Developer" },
      { name: "Jeff Thompson", role: "Software Developer" },
    ] as PartnerTeamMember[],
  },
  {
    name: "Onbloc",
    body: "Onbloc is an engineering team building consumer-facing applications on Gno.land, including Adena Wallet, GnoSwap, and GnoScan, some of the ecosystem's most used tools today.",
    href: "https://www.onbloc.xyz",
    // TODO: team members pending
    team: [] as PartnerTeamMember[],
  },
  {
    name: "All in Bits",
    body: "All in Bits is the team behind Tendermint BFT and Cosmos, the foundational infrastructure of the Internet of Blockchains ecosystem and the organization building AtomOne, the next chapter of that vision.",
    href: "https://atom.one/",
    team: [
      { name: "Alexandros Megalokonomos", role: "Lead Software Engineer" },
      { name: "Giuseppe Natale", role: "Lead Blockchain Engineer" },
      { name: "Julien Robert", role: "Senior Blockchain Engineer" },
      { name: "Thomas Bruyelle", role: "Senior Blockchain Engineer" },
    ] as PartnerTeamMember[],
  },
]
