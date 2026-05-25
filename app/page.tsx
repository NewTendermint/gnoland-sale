import { BidPanel } from "./(chrome)/BidPanel"
import { Ecosystem } from "./(sections)/ecosystem/Ecosystem"
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

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <TokenDetails />
        <HowItWorks />
        <Narrative />
        <Features />
        <GnotUtility />
        <Stats />
        <Team />
        <Roadmap />
        <Ecosystem />
        <Partners />
        <PreFooterCta />
      </main>
      <BidPanel />
    </>
  )
}
