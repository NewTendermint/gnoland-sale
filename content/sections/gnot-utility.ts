/**
 * Content data for the GNOT utility section.
 *
 * Presentational fields only. `icon` keys into the shared Icon registry;
 * `id` keys into the "GnotUtility" message namespace for the translated
 * `title`/`body` (messages/*.json).
 */

export const uses: Array<{ icon: string; id: string }> = [
  { icon: "database", id: "storage-deposits" },
  { icon: "clearing", id: "transaction-fees" },
  { icon: "swap", id: "ibc-ics" },
  { icon: "cube", id: "contract-execution" },
]
