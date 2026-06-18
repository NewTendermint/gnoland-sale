"use client"

import { LG_MEDIA_QUERY } from "../device/breakpoints"

// Shared gate: motion runs desktop-only (skipped on touch, reduced-motion, and below lg).
export function shouldAnimate(): boolean {
  const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const wide = window.matchMedia(LG_MEDIA_QUERY).matches
  return !touch && !reduced && wide
}
