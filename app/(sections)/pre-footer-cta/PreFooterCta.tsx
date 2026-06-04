"use client"

/**
 * Last-chance CTA. Builds its own contrast tile inside a default Section (rather than
 * Section tone="contrast") for a taller vertical rhythm right before the footer.
 * Centered headline + 2 CTAs (inverted pill primary + text link secondary).
 */
import { useSale } from "../../(layout)/SaleProvider"
import { CtaArrow } from "../../(ui)/CtaArrow"
import { Section } from "../../(ui)/Section"

export function PreFooterCta() {
  const { setBidPanelOpen } = useSale()
  return (
    <Section id="pre-footer-cta">
      <div className="col-span-12">
        {/* py-20 lg:py-28 is taller than Section's default contrast tile (py-12 lg:py-16). */}
        <div className="rounded-[var(--frame-radius)] bg-surface-contrast py-20 text-on-contrast lg:py-28">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 flex flex-col items-center text-center lg:col-span-8 lg:col-start-3">
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-on-contrast-muted">
                Public sale
              </p>
              <h2 className="text-3xl font-bold uppercase leading-[1.05] tracking-tight text-on-contrast md:text-4xl lg:text-5xl">
                Ready to join the sale?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg text-on-contrast-muted md:text-xl">
                Connect your wallet, verify once with Sonar, and place your bid. The clearing price
                is the same for everyone.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setBidPanelOpen(true)}
                  className="group inline-flex items-center gap-2 rounded-full bg-on-contrast px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-surface-contrast transition-colors hover:bg-on-contrast/90"
                >
                  <span>Place a bid</span>
                  <CtaArrow />
                </button>
                <a
                  href="#how-it-works"
                  className="text-xs font-bold uppercase tracking-[0.2em] text-on-contrast-muted underline-offset-4 transition-colors hover:text-on-contrast hover:underline"
                >
                  How it works
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
