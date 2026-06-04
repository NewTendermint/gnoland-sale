import type { ReactNode } from "react"

const PATHS: Record<string, ReactNode> = {
  // Registration / identity verification step (HowItWorks).
  "shield-check": (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 9-8 9s-8-4-8-9V6l8-3z" />
      <polyline points="8 12 11 15 16 9" />
    </>
  ),
  // Commitment / wallet step (HowItWorks).
  wallet: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v2" />
      <circle cx="16" cy="14" r="1" />
    </>
  ),
  // Settlement / pro-rate balance step (HowItWorks).
  scale: (
    <>
      <path d="M12 3v18" />
      <path d="M6 21h12" />
      <path d="M3 8h18" />
      <path d="M6 8l-3 6c0 1.5 1.3 2.5 3 2.5s3-1 3-2.5L6 8z" />
      <path d="M18 8l-3 6c0 1.5 1.3 2.5 3 2.5s3-1 3-2.5L18 8z" />
    </>
  ),
  // Distribution / send step (HowItWorks).
  send: (
    <>
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22l-4-9-9-4z" />
    </>
  ),
  // Database cylinder, used for the commitment position metric (TokenDetails).
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2" />
      <path d="M5 6v6c0 1.1 3.1 2 7 2s7-.9 7-2V6" />
      <path d="M5 12v6c0 1.1 3.1 2 7 2s7-.9 7-2v-6" />
    </>
  ),
  // Progress ring, used for the filled position metric (TokenDetails).
  "progress-ring": (
    <>
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M12 3 A9 9 0 1 1 3 12" />
    </>
  ),
  // Line chart, used for the best-bid position metric (TokenDetails).
  "line-chart": (
    <>
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="14 7 21 7 21 14" />
    </>
  ),
  // Isometric cube, used for token estimate (TokenDetails) and Tendermint2 (Ecosystem).
  cube: (
    <>
      <polygon points="12 2 21 7 21 17 12 22 3 17 3 7" />
      <polyline points="3 7 12 12 21 7" />
      <path d="M12 12V22" />
    </>
  ),
  // Magnifier with text rows, used for the explorer project (Ecosystem).
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M16 16l5 5" />
      <path d="M8 9v4h4M12 7v4h4" />
    </>
  ),
  // Shield with up-arrow, used for the wallet project (Ecosystem).
  "shield-arrow": (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 9-8 9s-8-4-8-9V6l8-3z" />
      <path d="M12 9v6M10 11l2-2 2 2" />
    </>
  ),
  // Two-way swap arrows, used for the DEX project (Ecosystem).
  swap: (
    <>
      <path d="M4 9h14" />
      <path d="M4 15h14" />
      <path d="M15 6l3 3-3 3" />
      <path d="M7 12l-3 3 3 3" />
    </>
  ),
  // Window with text rows, used for the forum project (Ecosystem).
  forum: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 9h18" />
      <path d="M6 13h8M6 16h6" />
    </>
  ),
  // Globe, used for the world-building game project (Ecosystem).
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 010 18" />
      <path d="M12 3a14 14 0 000 18" />
    </>
  ),
  // Window with play button, used for the playground project (Ecosystem).
  play: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 8h18" />
      <polyline points="10 12 14 14 10 16 10 12" />
    </>
  ),
  // Plug, used for the studio-connect project (Ecosystem).
  plug: (
    <>
      <path d="M7 4v6h10V4" />
      <path d="M9 4V2M15 4V2" />
      <path d="M12 10v6a3 3 0 003 3v3" />
    </>
  ),
  // Node graph, used for the governance project (Ecosystem).
  network: (
    <>
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 7v3" />
      <path d="M11 13l-5 4M13 13l5 4" />
    </>
  ),
  // Key, used for the key-management project (Ecosystem).
  key: (
    <>
      <circle cx="8" cy="14" r="4" />
      <path d="M11 13l8-8M15 9l3 3M17 7l3 3" />
    </>
  ),
  // Terminal prompt, used for the local-dev project (Ecosystem).
  terminal: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <polyline points="7 9 10 12 7 15" />
      <path d="M13 15h5" />
    </>
  ),
  // Browser chrome, used for the web-interface project (Ecosystem).
  browser: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 9h18" />
      <circle cx="6" cy="6.5" r="0.5" />
      <circle cx="8" cy="6.5" r="0.5" />
      <circle cx="10" cy="6.5" r="0.5" />
    </>
  ),
  // People group, used for the consensus/community project (Ecosystem).
  "users-group": (
    <>
      <circle cx="12" cy="7" r="3" />
      <path d="M7 21v-1a5 5 0 0110 0v1" />
      <circle cx="5" cy="9" r="2" />
      <path d="M3 21v-.5a3.5 3.5 0 013-3.46" />
      <circle cx="19" cy="9" r="2" />
      <path d="M21 21v-.5a3.5 3.5 0 00-3-3.46" />
    </>
  ),
  // Coin with currency mark, used for the clearing-price metric (BidPanel).
  clearing: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9c-.5-1-1.7-1.5-3-1.5-1.5 0-3 .8-3 2s1.4 1.7 3 2 3 1 3 2-1.5 2-3 2c-1.4 0-2.5-.6-3-1.5" />
      <path d="M12 6v1.5M12 16.5V18" />
    </>
  ),
  // Clock face, used for the auction-close countdown metric (BidPanel).
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  // Question mark in a circle, used for inline field hints (BidFlow).
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.3a2.4 2.4 0 1 1 3.6 2.1c-.9.6-1.2 1-1.2 1.9" />
      <path d="M12 16.5h.01" />
    </>
  ),
}

/** Single inline-SVG icon keyed by name. */
export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name] ?? null}
    </svg>
  )
}
