"use client"

/**
 * Shared guard for every scroll / entrance animation: skip motion on touch
 * devices (no hover / coarse pointer) and when the user asked for reduced motion.
 * Kept in its own module so both the motion hooks and the RevealGroup coordinator
 * can use it without a circular import.
 */
export function shouldAnimate(): boolean {
  const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  return !touch && !reduced
}
