import { resolveSalePhase } from "@/lib/sale/phase"
import { sonarSetupUrl } from "@/lib/sale/setup-url"
import { faq, faqAnswerText } from "../content/sections/faq"
import { BidPanel } from "./(layout)/BidPanel"
import { PushLimitSync } from "./(layout)/PushLimitSync"
import { SaleProvider } from "./(layout)/SaleProvider"
import { TabAlert } from "./(layout)/TabAlert"
import { Backers } from "./(sections)/backers/Backers"
import { Ecosystem } from "./(sections)/ecosystem/Ecosystem"
import { Faq } from "./(sections)/faq/Faq"
import { Features } from "./(sections)/features/Features"
import { GnotUtility } from "./(sections)/gnot-utility/GnotUtility"
import { Hero } from "./(sections)/hero/Hero"
import { HowItWorks } from "./(sections)/how-it-works/HowItWorks"
import { Narrative } from "./(sections)/narrative/Narrative"
import { Partners } from "./(sections)/partners/Partners"
import { PreFooterCta } from "./(sections)/pre-footer-cta/PreFooterCta"
import { Roadmap } from "./(sections)/roadmap/Roadmap"
import { Stats } from "./(sections)/stats/Stats"
import { Team } from "./(sections)/team/Team"
import { TokenDetails } from "./(sections)/token-details/TokenDetails"
import { Tokenomics } from "./(sections)/tokenomics/Tokenomics"

// Server-resolved phase from the sale clock; ISR revalidate flips it within ~30s of a boundary.
export const revalidate = 30

// FAQPage structured data, sourced from content/sections/faq.ts so it stays in sync with the
// rendered FAQ. Answers are flattened to plain text (Google requires plain text/limited HTML in
// acceptedAnswer.text). Rendered as a <script> text child, matching the Organization/WebSite block
// in app/layout.tsx (never dangerouslySetInnerHTML).
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faqAnswerText(item.a),
    },
  })),
}

export default function Home() {
  const initialPhase = resolveSalePhase(Date.now())
  // Read directly from process.env because mocked dev runs without SONAR_* and lib/env would
  // fail the boot. Missing in production = misconfiguration: the CTA would open Echo's homepage
  // with no path to this sale, so make it loud without breaking the render.
  const saleUUID = process.env.SONAR_SALE_UUID
  if (!saleUUID && process.env.NODE_ENV === "production") {
    console.warn(
      "SONAR_SALE_UUID is not set: the Complete-on-Sonar CTA falls back to Echo's homepage",
    )
  }
  return (
    <SaleProvider initialPhase={initialPhase} sonarSetupUrl={sonarSetupUrl(saleUUID)}>
      <TabAlert />
      <PushLimitSync />
      <main id="main">
        <Hero />
        <TokenDetails />
        <Tokenomics />
        <HowItWorks />
        <Narrative />
        <Features />
        <GnotUtility />
        <Stats />
        <Team />
        <Roadmap />
        <Ecosystem />
        <Partners />
        <Backers />
        <Faq />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        <PreFooterCta />
      </main>
      <BidPanel />
    </SaleProvider>
  )
}
