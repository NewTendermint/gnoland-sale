/**
 * Content data for the Roadmap section.
 *
 * Section copy for the build (dev-facing).
 */

// year / title / body text lives in the i18n catalogs (namespace "Roadmap"), keyed by id.
// hasTitle marks items that render a title line.
export type RoadmapItem = { id: string; hasTitle?: boolean; highlight?: boolean }

export const items: RoadmapItem[] = [
  { id: "2021" },
  { id: "2023" },
  { id: "2024" },
  { id: "2025" },
  { id: "q1-2026", hasTitle: true },
  { id: "q2-2026", hasTitle: true },
  { id: "q3-2026", hasTitle: true, highlight: true },
  { id: "q4-2026", hasTitle: true },
]
