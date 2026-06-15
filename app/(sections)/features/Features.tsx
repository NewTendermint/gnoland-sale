/**
 * Five-pillar pitch (why gno.land), rendered as an editorial statement section.
 * Layout + animation live in the shared StatementList; this file only supplies the
 * eyebrow, title, and the feature data.
 */
import { StatementList } from "../../(ui)/StatementList"
import { features } from "../../../content/sections/features"

export function Features() {
  return (
    <StatementList
      id="features"
      eyebrow="Why Gno.land"
      title="Built for Developers, Designed for Eternity"
      items={features}
    />
  )
}
