/**
 * Content data for the GNOT utility section.
 *
 * Section copy for the build (dev-facing).
 */

export const uses: Array<{ icon: string; title: string; body: string }> = [
  {
    icon: "database",
    title: "Storage Deposits",
    body: "GNOT is locked as a storage deposit whenever data is persisted in a realm. Holding GNOT means reserving ownership of storage on Gno.land.",
  },
  {
    icon: "clearing",
    title: "Transaction Fees",
    body: "GNOT is the fuel that enables every transaction on Gno.land. Each transaction is paid for in GNOT, so demand for the token rises as network activity increases.",
  },
  {
    icon: "swap",
    title: "IBC/ICS",
    body: "GNOT is used for all IBC and ICS cross-chain interactions. The transfer of value between Gno.land and other chains requires GNOT, extending the token's utility beyond Gno.land itself.",
  },
  {
    icon: "cube",
    title: "Contract Execution",
    body: "GNOT functions as the gas token that powers smart contract execution. Every computation a contract runs is metered and settled in GNOT, keeping resources fairly priced and the network resistant to spam.",
  },
]
