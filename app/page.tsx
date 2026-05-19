import { Ecosystem } from "./(sections)/ecosystem/Ecosystem"
import { Features } from "./(sections)/features/Features"
import { GnotUtility } from "./(sections)/gnot-utility/GnotUtility"
import { Hero } from "./(sections)/hero/Hero"
import { HowItWorks } from "./(sections)/how-it-works/HowItWorks"
import { Investors } from "./(sections)/investors/Investors"
import { Media } from "./(sections)/media/Media"
import { Narrative } from "./(sections)/narrative/Narrative"
import { Partners } from "./(sections)/partners/Partners"
import { PreFooterCta } from "./(sections)/pre-footer-cta/PreFooterCta"
import { Roadmap } from "./(sections)/roadmap/Roadmap"
import { SaleMetrics } from "./(sections)/sale-metrics/SaleMetrics"
import { Stats } from "./(sections)/stats/Stats"
import { Team } from "./(sections)/team/Team"
import { TokenDetails } from "./(sections)/token-details/TokenDetails"
import { Transparency } from "./(sections)/transparency/Transparency"

export default function Home() {
  return (
    <main>
      <Hero />
      <Narrative />
      <SaleMetrics />
      <HowItWorks />
      <TokenDetails />
      <Transparency />
      <Features />
      <GnotUtility />
      <Stats />
      <Roadmap />
      <Ecosystem />
      <Partners />
      <Team />
      <Investors />
      <Media />
      <PreFooterCta />
    </main>
  )
}
