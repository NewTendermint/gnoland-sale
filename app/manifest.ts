import type { MetadataRoute } from "next"

// Web manifest. name/description reuse the approved strings (app/layout.tsx); theme/bg
// white per the charter light default. short_name "GNOT Sale" is the one new string (flagged).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GNOT Public Token Sale",
    short_name: "GNOT Sale",
    description: "The native token for Gno.land - Layer 1 smart contract platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
  }
}
