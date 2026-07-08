import { analyticsEnabled } from "@/lib/analytics/track"
import Script from "next/script"
import { AnalyticsSectionViews } from "./AnalyticsSectionViews"

// Simple Analytics: cookieless pageviews + UTM, no consent banner needed.
// Only the production mainnet build emits data; staging/previews (sepolia)
// and local dev render nothing at all.
export function Analytics() {
  if (!analyticsEnabled()) return null
  return (
    <>
      <Script src="https://scripts.simpleanalyticscdn.com/latest.js" strategy="afterInteractive" />
      <noscript>
        <img
          src="https://queue.simpleanalyticscdn.com/noscript.gif"
          alt=""
          referrerPolicy="no-referrer-when-downgrade"
        />
      </noscript>
      <AnalyticsSectionViews />
    </>
  )
}
