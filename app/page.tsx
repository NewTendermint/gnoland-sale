import { resolveSalePhase } from "@/lib/sale/phase"
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

export default function Home() {
  const initialPhase = resolveSalePhase(Date.now())
  return (
    <SaleProvider initialPhase={initialPhase}>
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
        <PreFooterCta />
      </main>
      <BidPanel />
    </SaleProvider>
  )
}
