/**
 * GNOT utility (demand side of the token: what GNOT does), rendered as an editorial
 * statement section. Layout + animation live in the shared StatementList; this file
 * only supplies the eyebrow, title, and the utility data. The Tokenomics section
 * above is supply-side only (allocation, vesting, treasury).
 */
import { StatementList } from "../../(ui)/StatementList"
import { uses } from "../../../content/sections/gnot-utility"

export function GnotUtility() {
  return (
    <StatementList
      id="gnot-utility"
      eyebrow="GNOT utility"
      title="The native utility token for all economic activity"
      items={uses}
    />
  )
}
