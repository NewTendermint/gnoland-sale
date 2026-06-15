"use client"

/**
 * Last-chance CTA. Builds its own full-bleed contrast band (rather than
 * Section tone="contrast") for a taller vertical rhythm right before the footer:
 * the inverted surface spans the whole .screen width with the content re-contained
 * on the shared grid. Centered headline + 2 CTAs (inverted pill primary + ghost
 * pill secondary).
 */
import { AddToCalendarButton } from "../../(layout)/AddToCalendarButton"
import { Countdown } from "../../(layout)/Countdown"
import { NewsletterForm } from "../../(layout)/NewsletterForm"
import { useSale } from "../../(layout)/SaleProvider"
import { ArrowLink } from "../../(ui)/ArrowLink"
import { ClipOpen } from "../../(ui)/ClipOpen"
import { FadeIn } from "../../(ui)/FadeIn"
import { Reveal } from "../../(ui)/Reveal"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { HEADING_TITLE } from "../../(ui)/SectionHeading"
import { newsletterEnabled } from "../../../lib/newsletter/config"
import { redirectToSonarLogin } from "../../../lib/sale/api"
import { SALE_ECONOMICS, formatSaleDate } from "../../../lib/sale/economics"
import { DESKTOP_ONLY } from "../../../lib/sale/labels"

export function PreFooterCta() {
  const { phase, preSaleStage, setBidPanelOpen } = useSale()
  const preSale = phase === "pre-sale"
  const ended = phase === "ended"
  const registrationOpen = preSaleStage === "registration-open"

  return (
    <section id="pre-footer-cta" className="bg-background py-10 text-foreground lg:py-20">
      {/* Full-bleed contrast band (same pattern as Section's contrast tile): the
          inverted surface spans the whole .screen width, the container nested inside
          keeps the content on the shared grid. py-20 lg:py-28 is taller than Section's
          default tile (py-12 lg:py-16). The tile LEADS the group (clip-open): it grows
          first, and the cluster below starts halfway through that growth - the panel
          never shows static content first. */}
      <RevealGroup as="div">
        <ClipOpen lead className="contrast-tile py-20 lg:py-28">
          <div className="page-container grid grid-cols-12 gap-6">
            <RevealGroup
              as="div"
              className="col-span-12 flex flex-col items-center text-center lg:col-span-8 lg:col-start-3"
            >
              <FadeIn as="p" className="mb-4 section-eyebrow text-on-contrast-muted">
                Public sale
              </FadeIn>
              <Reveal as="h2" type="words" className={`${HEADING_TITLE} text-on-contrast`}>
                Ready to Join the Sale?
              </Reveal>
              <Reveal
                as="p"
                className="mx-auto mt-6 max-w-xl text-lg text-on-contrast-muted md:text-xl"
              >
                {preSale ? (
                  registrationOpen ? (
                    // "Verify now" only makes sense where the Sonar CTA exists
                    // (funnel contexts); awareness ones read the desktop variant.
                    <>
                      <span className="hidden funnel:inline">
                        {`Registration is open - verify once with Sonar now, then bid when the sale opens ${formatSaleDate(SALE_ECONOMICS.saleOpensIso, false)}.`}
                      </span>
                      <span className="funnel:hidden">
                        {`Registration is open - register from a desktop browser, then bid when the sale opens ${formatSaleDate(SALE_ECONOMICS.saleOpensIso, false)}.`}
                      </span>
                    </>
                  ) : (
                    `Registration opens ${formatSaleDate(SALE_ECONOMICS.registrationOpensIso, false)} - the sale opens ${formatSaleDate(SALE_ECONOMICS.saleOpensIso)}.`
                  )
                ) : ended ? (
                  "The auction has closed. Final results and your position are above."
                ) : (
                  "Verify once with Sonar, connect your wallet, and place your bid."
                )}
              </Reveal>
              {preSale ? (
                <FadeIn as="div" className="mt-8 text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-on-contrast-muted">
                    {registrationOpen ? "Sale opens in" : "Registration opens in"}
                  </p>
                  <p className="mt-1 font-mono text-4xl font-medium tracking-tight tabular-nums text-on-contrast sm:text-5xl">
                    <Countdown
                      targetIso={
                        registrationOpen
                          ? SALE_ECONOMICS.saleOpensIso
                          : SALE_ECONOMICS.registrationOpensIso
                      }
                    />
                  </p>
                </FadeIn>
              ) : null}
              <FadeIn as="div" className="mt-10 flex flex-wrap items-center justify-center gap-4">
                {preSale ? (
                  registrationOpen ? (
                    // Stage B: Register stays the only primary; the capture row
                    // returns BELOW it as the fallback for visitors not ready to
                    // KYC yet (sole pre-sale surface where both asks coexist).
                    <div className="flex flex-col items-center gap-6">
                      {/* Sonar OAuth is desktop-only; awareness contexts already read
                          the desktop pointer in the body line above and keep the
                          capture row below as their ask. */}
                      <div className="hidden funnel:block">
                        <ArrowLink
                          onClick={redirectToSonarLogin}
                          label="Register now"
                          arrow="slide"
                          variant="solid-contrast"
                          size="lg"
                        />
                      </div>
                      {newsletterEnabled() ? (
                        <div className="flex flex-wrap items-start justify-center gap-6">
                          <NewsletterForm variant="tile" inputId="newsletter-email-tile" />
                          <AddToCalendarButton milestone="sale" variant="tile" />
                        </div>
                      ) : null}
                    </div>
                  ) : newsletterEnabled() ? (
                    // items-start: the form's status line below would pull a centered round down.
                    <div className="flex flex-wrap items-start justify-center gap-6">
                      <NewsletterForm variant="tile" inputId="newsletter-email-tile" />
                      <AddToCalendarButton milestone="registration" variant="tile" />
                    </div>
                  ) : (
                    // Capture flag off: state the next date, same fallback as the bar.
                    <p className="text-sm text-on-contrast-muted">
                      {`Sale opens ${formatSaleDate(SALE_ECONOMICS.saleOpensIso)}`}
                    </p>
                  )
                ) : ended ? (
                  // Closed: no bid ask anymore; route to the final numbers instead.
                  <ArrowLink
                    href="#token-details"
                    label="View results"
                    arrow="slide"
                    variant="solid-contrast"
                    size="lg"
                  />
                ) : (
                  // Live phase only: during pre-sale the tile stays single-ask.
                  // The bid CTA only exists on funnel-capable contexts; awareness
                  // ones read the desktop pointer. "How it works" (anchor) stays.
                  <>
                    <div className="hidden funnel:block">
                      <ArrowLink
                        onClick={() => setBidPanelOpen(true)}
                        label="Place a bid"
                        arrow="slide"
                        variant="solid-contrast"
                        size="lg"
                      />
                    </div>
                    <p className="w-full text-sm text-on-contrast-muted funnel:hidden">
                      {`${DESKTOP_ONLY.live.title}. ${DESKTOP_ONLY.live.body}`}
                    </p>
                    <ArrowLink
                      href="#how-it-works"
                      label="How it works"
                      arrow="slide"
                      variant="ghost-contrast"
                      size="lg"
                    />
                  </>
                )}
              </FadeIn>
            </RevealGroup>
          </div>
        </ClipOpen>
      </RevealGroup>
    </section>
  )
}
