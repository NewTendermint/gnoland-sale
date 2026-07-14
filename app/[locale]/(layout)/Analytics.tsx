import { analyticsEnabled } from "@/lib/analytics/track"
import Script from "next/script"
import { AnalyticsSectionViews } from "./AnalyticsSectionViews"

// Simple Analytics: cookieless pageviews + UTM, no consent banner needed. Only the
// production mainnet build emits data. Served first-party via the Netlify proxy
// (/sgl.js + /sgl/*, netlify.toml); data-collect-dnt counts DNT visitors too - the
// pipeline is cookieless, IP-less (proxied) and PII-free.
export function Analytics() {
  if (!analyticsEnabled()) return null
  return (
    <>
      <Script src="/sgl.js" strategy="afterInteractive" data-collect-dnt="true" />
      <noscript>
        <img src="/sgl/noscript.gif" alt="" referrerPolicy="no-referrer-when-downgrade" />
      </noscript>
      <AnalyticsSectionViews />
    </>
  )
}
