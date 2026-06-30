// GNOT utility - demand side: what GNOT does.
import { StatementList } from "../../(ui)/StatementList"
import { uses } from "../../../content/sections/gnot-utility"
import { sceneVideos } from "../../../lib/scenes"

export function GnotUtility() {
  return (
    <StatementList
      id="gnot-utility"
      eyebrow="GNOT utility"
      title="GNOT, the Native Token Powering Gno.land"
      items={uses}
      sceneVideo={sceneVideos.gnotUtility}
    />
  )
}
