"use client"

/**
 * Last-chance CTA. Builds its own contrast tile inside a default Section (rather than
 * Section tone="contrast") for a taller vertical rhythm right before the footer.
 * Centered headline + 2 CTAs (inverted pill primary + ghost pill secondary).
 */
import { useSale } from "../../(layout)/SaleProvider"
import { ArrowLink } from "../../(ui)/ArrowLink"
import { ClipOpen } from "../../(ui)/ClipOpen"
import { FadeIn } from "../../(ui)/FadeIn"
import { Reveal } from "../../(ui)/Reveal"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { CONTRAST_TILE, Section } from "../../(ui)/Section"
import { HEADING_TITLE } from "../../(ui)/SectionHeading"

export function PreFooterCta() {
  const { setBidPanelOpen } = useSale()
  return (
    <Section id="pre-footer-cta">
      <RevealGroup as="div" className="col-span-12">
        {/* py-20 lg:py-28 is taller than Section's default contrast tile (py-12 lg:py-16).
            The tile LEADS the group (clip-open): it grows first, and the cluster below
            starts halfway through that growth - the panel never shows static content first. */}
        <ClipOpen lead className={`${CONTRAST_TILE} py-20 lg:py-28`}>
          <div className="grid grid-cols-12 gap-6">
            <RevealGroup
              as="div"
              className="col-span-12 flex flex-col items-center text-center lg:col-span-8 lg:col-start-3"
            >
              <FadeIn
                as="p"
                className="mb-4 font-mono text-xs uppercase tracking-widest text-on-contrast-muted"
              >
                Public sale
              </FadeIn>
              <Reveal as="h2" type="words" className={`${HEADING_TITLE} text-on-contrast`}>
                Ready to join the sale?
              </Reveal>
              <Reveal
                as="p"
                className="mx-auto mt-6 max-w-xl text-lg text-on-contrast-muted md:text-xl"
              >
                Connect your wallet, verify once with Sonar, and place your bid. The clearing price
                is the same for everyone.
              </Reveal>
              <FadeIn as="div" className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <ArrowLink
                  onClick={() => setBidPanelOpen(true)}
                  label="Place a bid"
                  arrow="slide"
                  variant="solid-contrast"
                  size="lg"
                />
                <ArrowLink
                  href="#how-it-works"
                  label="How it works"
                  arrow="slide"
                  variant="ghost-contrast"
                  size="lg"
                />
              </FadeIn>
            </RevealGroup>
          </div>
        </ClipOpen>
      </RevealGroup>
    </Section>
  )
}
