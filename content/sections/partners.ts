/**
 * Content data for the Partners section.
 *
 * Section copy for the build (dev-facing).
 */

// body / role text lives in the i18n catalogs (namespace "Partners"), keyed by id
// (partner: `${id}.body`, member: `${id}.team.${id}.role`).
export type PartnerTeamMember = { id: string; name: string }

export const partners = [
  {
    id: "samourai-coop",
    name: "Samourai Coop",
    href: "https://www.samourai.world",
    team: [
      { id: "louis-b", name: "Louis B." },
      { id: "miguel-v", name: "Miguel V." },
      { id: "omar-s", name: "Omar S." },
      { id: "antoine-b", name: "Antoine B." },
      { id: "david-g", name: "David G." },
    ] as PartnerTeamMember[],
  },
  {
    id: "berty",
    name: "Berty",
    href: "https://berty.tech",
    team: [
      { id: "remi-barbero", name: "Rémi Barbero" },
      { id: "jeff-thompson", name: "Jeff Thompson" },
    ] as PartnerTeamMember[],
  },
  {
    id: "all-in-bits",
    name: "All in Bits",
    href: "https://atom.one/",
    team: [
      { id: "alexandros-megalokonomos", name: "Alexandros Megalokonomos" },
      { id: "giuseppe-natale", name: "Giuseppe Natale" },
      { id: "julien-robert", name: "Julien Robert" },
      { id: "thomas-bruyelle", name: "Thomas Bruyelle" },
    ] as PartnerTeamMember[],
  },
  {
    id: "onbloc",
    name: "Onbloc",
    href: "https://www.onbloc.xyz",
    // TODO: team members pending
    team: [] as PartnerTeamMember[],
  },
  {
    id: "oak-security",
    name: "Oak Security",
    href: "https://oaksecurity.io/",
    // TODO: team members pending
    team: [] as PartnerTeamMember[],
  },
]
