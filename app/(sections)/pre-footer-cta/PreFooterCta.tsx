"use client"

import { AddToCalendarButton } from "../../(layout)/AddToCalendarButton"
import { Countdown } from "../../(layout)/Countdown"
import { NewsletterForm } from "../../(layout)/NewsletterForm"
import { useSale } from "../../(layout)/SaleProvider"
import { ClipOpen } from "../../(ui)/ClipOpen"
import { Cta } from "../../(ui)/Cta"
import { FadeIn } from "../../(ui)/FadeIn"
import { Reveal } from "../../(ui)/Reveal"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { HEADING_TITLE } from "../../(ui)/SectionHeading"
import { newsletterEnabled } from "../../../lib/newsletter/config"
import { redirectToSonarLogin } from "../../../lib/sale/api"
import { SALE_ECONOMICS, formatSaleDate } from "../../../lib/sale/economics"
import { VERIFY_INCOMPLETE } from "../../../lib/sale/labels"

export function PreFooterCta() {
  const { phase, preSaleStage, journey, sonarSetupUrl } = useSale()
  const preSale = phase === "pre-sale"
  const ended = phase === "ended"
  const registrationOpen = preSaleStage === "registration-open"

  return (
    <section id="pre-footer-cta" className="bg-background py-10 text-foreground lg:py-20">
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
                      label={registrationOpen ? "Sale opens in" : "Registration opens in"}
                    />
                  </p>
                </FadeIn>
              ) : null}
              <FadeIn as="div" className="mt-10 flex flex-wrap items-center justify-center gap-4">
                {preSale ? (
                  registrationOpen ? (
                    <div className="flex flex-col items-center gap-6">
                      <div className="hidden funnel:block">
                        {journey === "kyc-incomplete" ? (
                          // Re-running OAuth cannot advance an unfinished setup - link to Echo's
                          // hosted setup page instead (same destination as the sticky-bar CTA).
                          <Cta
                            href={sonarSetupUrl}
                            external
                            label={VERIFY_INCOMPLETE.cta}
                            arrow
                            variant="solid-contrast"
                            size="lg"
                          />
                        ) : (
                          <Cta
                            onClick={redirectToSonarLogin}
                            label="Register now"
                            arrow
                            variant="solid-contrast"
                            size="lg"
                          />
                        )}
                      </div>
                      {newsletterEnabled() ? (
                        <div className="flex flex-wrap items-start justify-center gap-6">
                          <NewsletterForm variant="tile" inputId="newsletter-email-tile" />
                          <AddToCalendarButton milestone="sale" variant="tile" />
                        </div>
                      ) : null}
                    </div>
                  ) : newsletterEnabled() ? (
                    <div className="flex flex-wrap items-start justify-center gap-6">
                      <NewsletterForm variant="tile" inputId="newsletter-email-tile" />
                      <AddToCalendarButton milestone="registration" variant="tile" />
                    </div>
                  ) : (
                    <p className="text-sm text-on-contrast-muted">
                      {`Sale opens ${formatSaleDate(SALE_ECONOMICS.saleOpensIso)}`}
                    </p>
                  )
                ) : ended ? (
                  <Cta
                    href="#token-details"
                    label="View results"
                    arrow
                    variant="solid-contrast"
                    size="lg"
                  />
                ) : (
                  <>
                    {/* Live phase: the bid entry point stays the panel; this slot promotes the
                        price-update email instead (decision 2026-07-05). */}
                    {newsletterEnabled() ? (
                      <NewsletterForm variant="tile" inputId="newsletter-email-live" />
                    ) : null}
                    <Cta
                      href="#how-it-works"
                      label="How it works"
                      arrow
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
