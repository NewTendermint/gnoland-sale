"use client"

import { LG_MEDIA_QUERY } from "../device/breakpoints"

/**
 * Shared guard for every scroll / entrance animation. Motion is desktop-only: it
 * is skipped on touch devices (no hover / coarse pointer), under reduced-motion,
 * and below Tailwind's lg (mobile, tablet, narrow windows) - matching the parallax
 * gate, so the whole page is static below lg and the simpler mobile layout never
 * depends on a reveal firing. When skipped, the reveal hooks early-return and the
 * content renders as-is (fail-safe: always visible). Kept in its own module so the
 * motion hooks and the RevealGroup coordinator can use it without a circular import.
 */
export function shouldAnimate(): boolean {
  const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const wide = window.matchMedia(LG_MEDIA_QUERY).matches
  return !touch && !reduced && wide
}
