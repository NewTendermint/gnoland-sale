"use client"

import { track } from "@/lib/analytics/track"
import { newsletterEnabled } from "@/lib/newsletter/config"
import { redirectToSonarLogin } from "@/lib/sale/api"
import { SALE_ECONOMICS, formatSaleDate } from "@/lib/sale/economics"
import { type SaleTranslator, verifyIncomplete } from "@/lib/sale/labels"
import { useLocale, useTranslations } from "next-intl"
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

export function PreFooterCta() {
  const t = useTranslations("PreFooterCta")
  const tSale = useTranslations("Sale")
  const locale = useLocale()
  const vi = verifyIncomplete(tSale as unknown as SaleTranslator)
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
                {t("eyebrow")}
              </FadeIn>
              <Reveal as="h2" type="words" className={`${HEADING_TITLE} text-on-contrast`}>
                {t("title")}
              </Reveal>
              <Reveal
                as="p"
                className="mx-auto mt-6 max-w-xl text-lg text-on-contrast-muted md:text-xl"
              >
                {preSale ? (
                  registrationOpen ? (
                    <>
                      <span className="hidden funnel:inline">
                        {t("leadRegOpenFunnel", {
                          date: formatSaleDate(SALE_ECONOMICS.saleOpensIso, false, locale),
                        })}
                      </span>
                      <span className="funnel:hidden">
                        {t("leadRegOpenDesktop", {
                          date: formatSaleDate(SALE_ECONOMICS.saleOpensIso, false, locale),
                        })}
                      </span>
                    </>
                  ) : (
                    t("leadRegClosed", {
                      regDate: formatSaleDate(SALE_ECONOMICS.registrationOpensIso, false, locale),
                      saleDate: formatSaleDate(SALE_ECONOMICS.saleOpensIso, true, locale),
                    })
                  )
                ) : ended ? (
                  t("leadEnded")
                ) : (
                  t("leadLive")
                )}
              </Reveal>
              {preSale ? (
                <FadeIn as="div" className="mt-8 text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-on-contrast-muted">
                    {registrationOpen ? t("countdownSaleCaption") : t("countdownRegCaption")}
                  </p>
                  <p className="mt-1 font-mono text-4xl font-medium tracking-tight tabular-nums text-on-contrast sm:text-5xl">
                    <Countdown
                      targetIso={
                        registrationOpen
                          ? SALE_ECONOMICS.saleOpensIso
                          : SALE_ECONOMICS.registrationOpensIso
                      }
                      label={
                        registrationOpen ? t("countdownSaleCaption") : t("countdownRegCaption")
                      }
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
                            onClick={() => track("sonar_setup_opened", { placement: "pre-footer" })}
                            external
                            label={vi.cta}
                            arrow
                            variant="solid-contrast"
                            size="lg"
                          />
                        ) : (
                          <Cta
                            onClick={redirectToSonarLogin}
                            label={t("registerNow")}
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
                      {t("saleOpens", {
                        date: formatSaleDate(SALE_ECONOMICS.saleOpensIso, true, locale),
                      })}
                    </p>
                  )
                ) : ended ? (
                  <Cta
                    href="#token-details"
                    label={t("viewResults")}
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
                      label={t("howItWorks")}
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
