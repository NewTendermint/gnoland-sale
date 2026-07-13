import { uses } from "@/content/sections/gnot-utility"
import { sceneVideos } from "@/lib/scenes"
// GNOT utility - demand side: what GNOT does.
import { useTranslations } from "next-intl"
import { StatementList } from "../../(ui)/StatementList"

export function GnotUtility() {
  const t = useTranslations("GnotUtility")
  const items = uses.map((u) => ({
    icon: u.icon,
    title: t(`${u.id}.title`),
    body: t(`${u.id}.body`),
  }))
  return (
    <StatementList
      id="gnot-utility"
      eyebrow={t("eyebrow")}
      title={t("title")}
      items={items}
      sceneVideo={sceneVideos.gnotUtility}
    />
  )
}
