"use client"

import { NewsletterForm } from "../../(layout)/NewsletterForm"
import { useSale } from "../../(layout)/SaleProvider"
import { Cta } from "../../(ui)/Cta"
import { FadeIn } from "../../(ui)/FadeIn"
import { Icon } from "../../(ui)/Icon"
import { Reveal } from "../../(ui)/Reveal"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { steps } from "../../../content/sections/how-it-works"
import { track } from "../../../lib/analytics/track"
import { redirectToSonarLogin } from "../../../lib/sale/api"
import { SALE_ECONOMICS, formatSaleDate } from "../../../lib/sale/economics"
import { isSonarVerified } from "../../../lib/sale/journey"
import { DESKTOP_ONLY, VERIFY_INCOMPLETE, VERIFY_STATUS } from "../../../lib/sale/labels"
import type { PreSaleStage, JourneyState as SaleJourney, SalePhase } from "../../../lib/sale/types"

type FunnelStep =
  | "locked"
  | "needs-verify"
  | "registered"
  | "needs-connect"
  | "wallet-ready"
  | "bidding"
  | "ended"

function liveCtaLabel(state: FunnelStep, journey: SaleJourney): string {
  switch (state) {
    case "needs-connect":
      return "Connect your wallet"
    case "wallet-ready":
      return "Place your bid"
    case "bidding":
      return "Update your bid"
    case "ended":
      return "View your results"
    default:
      // The needed action differs behind the same Verify step: OAuth for a fresh visitor,
      // finishing setup on Sonar for a kyc-incomplete one (the panel gate links there).
      return journey === "kyc-incomplete" ? VERIFY_INCOMPLETE.title : "Verify with Sonar"
  }
}

const PRESALE_STATUS: Partial<Record<SaleJourney, string>> = {
  "kyc-incomplete": `${VERIFY_INCOMPLETE.title}.`,
  "kyc-pending": `${VERIFY_STATUS.pending.title}. ${VERIFY_STATUS.pending.body}`,
  "kyc-failed": `${VERIFY_STATUS.failed.title}. ${VERIFY_STATUS.failed.body}`,
  "not-eligible": `${VERIFY_STATUS["not-eligible"].title}. ${VERIFY_STATUS["not-eligible"].body}`,
}

type StepStatus = "done" | "current" | "pending" | "plain"

function getStepStatus(stepIndex: number, journey: FunnelStep): StepStatus {
  if (journey === "locked") return "plain"
  if (journey === "registered") return stepIndex === 0 ? "done" : "pending"
  const order: FunnelStep[] = ["needs-verify", "needs-connect", "wallet-ready", "bidding", "ended"]
  const j = order.indexOf(journey)
  if (stepIndex === 0) return j === 0 ? "current" : "done"
  if (stepIndex === 1) return j === 0 ? "pending" : j === 1 ? "current" : "done"
  if (stepIndex === 2) return j < 2 ? "pending" : j === 4 ? "done" : "current"
  if (stepIndex === 3) return j === 4 ? "current" : "pending"
  return "pending"
}

const STATUS_OPACITY: Record<StepStatus, string> = {
  done: "opacity-70",
  current: "opacity-100",
  pending: "opacity-50",
  plain: "opacity-100",
}

function funnelState(journey: SaleJourney, phase: SalePhase, stage: PreSaleStage): FunnelStep {
  if (phase === "ended") return "ended"
  const verified = isSonarVerified(journey)
  if (phase === "pre-sale") {
    if (verified) return "registered"
    return stage === "registration-open" ? "needs-verify" : "locked"
  }
  switch (journey) {
    case "ready":
      return "wallet-ready"
    case "has-bid-winning":
    case "has-bid-outbid":
    case "has-bid-pending":
      return "bidding"
    case "disconnected":
    case "wrong-network":
      return "needs-connect"
    default:
      return "needs-verify"
  }
}

export function HowItWorks() {
  const { journey, phase, preSaleStage, setBidPanelOpen, sonarSetupUrl } = useSale()
  const journeyState = funnelState(journey, phase, preSaleStage)
  const registrationOpen = preSaleStage === "registration-open"
  const preSaleStatus = phase === "pre-sale" ? PRESALE_STATUS[journey] : undefined

  return (
    <Section id="how-it-works" tone="contrast" clip>
      <RevealGroup as="div" className="col-span-12 lg:col-span-6 lg:col-start-2">
        <SectionHeading tone="contrast" eyebrow="How it works" title="How to Participate" />
        <FadeIn as="div" className="mt-8 mb-10">
          {journeyState === "registered" ? (
            <p className="text-base text-on-contrast-muted">
              You're registered - the sale opens {formatSaleDate(SALE_ECONOMICS.saleOpensIso)}.
            </p>
          ) : preSaleStatus ? (
            <div>
              <p className="text-base text-on-contrast-muted">{preSaleStatus}</p>
              {journey === "kyc-incomplete" ? (
                <div className="mt-4">
                  <Cta
                    href={sonarSetupUrl}
                    onClick={() => track("sonar_setup_opened", { placement: "how-it-works" })}
                    external
                    label={VERIFY_INCOMPLETE.cta}
                    arrow
                    variant="ghost-contrast"
                    size="sm"
                  />
                </div>
              ) : null}
            </div>
          ) : phase === "pre-sale" ? (
            registrationOpen ? (
              <>
                <div className="hidden funnel:block">
                  <Cta
                    onClick={redirectToSonarLogin}
                    label="Register now"
                    arrow
                    variant="ghost-contrast"
                    size="sm"
                  />
                </div>
                <p className="text-base text-on-contrast-muted funnel:hidden">
                  {`${DESKTOP_ONLY.register.title}. ${DESKTOP_ONLY.register.body}`}
                </p>
              </>
            ) : (
              <div>
                <p className="mb-4 text-base text-on-contrast-muted">
                  Registration is not open yet - it opens{" "}
                  {formatSaleDate(SALE_ECONOMICS.registrationOpensIso)}.
                </p>
                <NewsletterForm variant="tile" inputId="newsletter-email-howto" align="start" />
              </div>
            )
          ) : (
            <>
              <div className="hidden funnel:block">
                <Cta
                  onClick={() => setBidPanelOpen(true)}
                  label={liveCtaLabel(journeyState, journey)}
                  arrow
                  variant="ghost-contrast"
                  size="sm"
                />
              </div>
              <p className="text-base text-on-contrast-muted funnel:hidden">
                {journeyState === "ended"
                  ? `${DESKTOP_ONLY.ended.title}. ${DESKTOP_ONLY.ended.body}`
                  : `${DESKTOP_ONLY.live.title}. ${DESKTOP_ONLY.live.body}`}
              </p>
            </>
          )}
        </FadeIn>
      </RevealGroup>

      <ol className="col-span-12 grid grid-cols-1 gap-x-0 gap-y-12 md:grid-cols-2 lg:col-span-7 lg:col-start-5 lg:grid-cols-4 lg:self-end">
        {steps.map((s, i) => {
          const status = getStepStatus(i, journeyState)
          return (
            <RevealGroup
              as="li"
              key={s.title}
              className={`${STATUS_OPACITY[status]} transition-opacity ${
                i > 0 ? "lg:border-l lg:border-on-contrast/15 lg:px-6" : "lg:pr-6"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon name={s.icon} index={3} className="h-6 w-6 text-on-contrast-muted" />
                <FadeIn
                  as="p"
                  index={3}
                  className="font-mono text-lg font-medium text-on-contrast tabular-nums"
                >
                  {String(i + 1).padStart(2, "0")}
                </FadeIn>
              </div>
              <Reveal
                as="h3"
                index={4}
                className="mt-1 font-mono text-lg font-medium uppercase tracking-tight text-on-contrast lg:text-xl"
              >
                {s.title}
              </Reveal>
              <Reveal as="p" index={5} className="mt-3 text-base text-on-contrast-muted">
                {s.body}
              </Reveal>
            </RevealGroup>
          )
        })}
      </ol>
    </Section>
  )
}
