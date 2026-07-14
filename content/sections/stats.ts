/**
 * Content data for the Stats section.
 *
 * `value` is the display number (kept here, formatting untouched); `id` keys
 * into the "Stats" message namespace for the translated `label`
 * (messages/*.json) and identifies the live Test13 row at render.
 */

export const stats: Array<{ value: string; id: string }> = [
  { value: "5+", id: "years-building" },
  { value: "150+", id: "contributors" },
  { value: "2,400+", id: "prs-merged" },
  { value: "1,100+", id: "issues-closed" },
  { value: "3M+", id: "total-wallets" },
  { value: "650K+", id: "active-wallets" },
  { value: "1,000+", id: "on-chain-packages" },
  // Value overridden at render by the live Test13 count (lib/stats/test13.ts); this is only a hint.
  { value: "680K+", id: "test13" },
]
