// Five-pillar pitch (why gno.land), rendered via the shared StatementList.
import { StatementList } from "../../(ui)/StatementList"
import { features } from "../../../content/sections/features"
import { sceneVideos } from "../../../lib/scenes"

export function Features() {
  return (
    <StatementList
      id="features"
      eyebrow="Why Gno.land"
      title="Built for Developers, Designed for Eternity"
      items={features}
      sceneVideo={sceneVideos.features}
    />
  )
}
