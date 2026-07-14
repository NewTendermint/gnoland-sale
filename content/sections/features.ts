/**
 * Content data for the Features section.
 *
 * Presentational fields only. `icon` keys into the shared Icon registry
 * (app/(ui)/Icon.tsx); `id` keys into the "Features" message namespace for
 * the translated `title`/`body` (messages/*.json).
 */

export const features: Array<{ icon: string; id: string }> = [
  { icon: "users-group", id: "general-purpose-os" },
  { icon: "terminal", id: "built-for-go-developers" },
  { icon: "search", id: "human-readable-contracts" },
  { icon: "network", id: "composability-type-safety" },
  { icon: "shield-check", id: "deterministic-execution" },
  { icon: "database", id: "data-persistence" },
]
