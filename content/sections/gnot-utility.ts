/**
 * Content data for the GNOT utility section.
 *
 * `content/sections.md` is the human source of truth for marketing/legal
 * copy. This module mirrors that copy for the build (dev-facing).
 */

export const uses: Array<{ icon: string; title: string; body: string }> = [
  {
    icon: "clearing",
    title: "Transaction fees",
    body: "GNOT is the fuel that enables every transaction on the gno.land network. Whether transferring tokens or calling a contract, each transaction is paid for in GNOT, so demand for the token rises with use of the network itself.",
  },
  {
    icon: "database",
    title: "Storage deposits",
    body: "Owning GNOT means reserving ownership of persistent storage on Gno.land. Because applications and their state persist on-chain by default, holding GNOT is what secures the space they occupy over time.",
  },
  {
    icon: "swap",
    title: "IBC/ICS interactions",
    body: "GNOT is used to pay for all cross-chain interactions over IBC and ICS. Moving value and messages between Gno.land and the broader Cosmos ecosystem settles in GNOT, extending the token's utility beyond the chain itself.",
  },
  {
    icon: "cube",
    title: "Contract execution",
    body: "GNOT functions as the gas token that powers smart contract execution. Every computation a contract runs is metered and settled in GNOT, keeping resources fairly priced and the network resistant to spam.",
  },
]
