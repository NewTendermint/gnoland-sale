import { features } from "@/content/sections/features"
import { sceneVideos } from "@/lib/scenes"
// Five-pillar pitch for why gno.land.
import { useTranslations } from "next-intl"
import { StatementList } from "../../(ui)/StatementList"

export function Features() {
  const t = useTranslations("Features")
  const items = features.map((f) => ({
    icon: f.icon,
    title: t(`${f.id}.title`),
    body: t(`${f.id}.body`),
  }))
  return (
    <StatementList
      id="features"
      eyebrow={t("eyebrow")}
      title={t("title")}
      items={items}
      sceneVideo={sceneVideos.features}
    />
  )
}
