"use client"

import { track } from "@/lib/analytics/track"
import { useEffect } from "react"

// Emits section_viewed once per section per pageload, keyed on the sections'
// existing anchor ids. Mounted only when analytics is enabled (see Analytics).
export function AnalyticsSectionViews() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return
    const sections = document.querySelectorAll("#main > section[id]")
    if (sections.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          track("section_viewed", { section: entry.target.id })
          observer.unobserve(entry.target)
        }
      },
      // Middle-band trigger: fires when a section crosses mid-viewport. A ratio
      // threshold would never fire for sections taller than the screen.
      { rootMargin: "-45% 0px -45% 0px" },
    )
    for (const section of sections) observer.observe(section)
    return () => observer.disconnect()
  }, [])
  return null
}
