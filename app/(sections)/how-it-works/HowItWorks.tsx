"use client"

/**
 * How to Participate, in the large contrast tile. Journey-aware: `funnelState`
 * maps the canonical journey (useSale) onto the section's four-step ladder
 * (done / current / pending opacity) and drives which CTA or status line shows.
 */
import { NewsletterForm } from "../../(layout)/NewsletterForm"
import { useSale } from "../../(layout)/SaleProvider"
import { ArrowLink } from "../../(ui)/ArrowLink"
import { FadeIn } from "../../(ui)/FadeIn"
import { Icon } from "../../(ui)/Icon"
import { Reveal } from "../../(ui)/Reveal"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { steps } from "../../../content/sections/how-it-works"
import { redirectToSonarLogin } from "../../../lib/sale/api"
import { SALE_ECONOMICS, formatSaleDate } from "../../../lib/sale/economics"
import { isSonarVerified } from "../../../lib/sale/journey"
import { VERIFY_STATUS } from "../../../lib/sale/labels"
import type { PreSaleStage, JourneyState as SaleJourney, SalePhase } from "../../../lib/sale/types"

// Section-local funnel vocabulary: which of the four steps is current. Verify-first,
// matching deriveJourney: Verify -> Connect -> Bid -> Distribution. "locked" is
// pre-sale before registration opens (nothing actionable, plain roadmap);
// "registered" is the pre-sale parking state (verified, wallet + bid open with the
// sale, the CTA gives way to a confirmation).
type FunnelStep =
  | "locked"
  | "needs-verify"
  | "registered"
  | "needs-connect"
  | "wallet-ready"
  | "bidding"
  | "ended"

// Live/ended CTA label. Total over FunnelStep so no cast is needed at the call
// site; "registered" and "locked" render dedicated lines before this is consulted.
function liveCtaLabel(state: FunnelStep): string {
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
      return "Verify with Sonar"
  }
}

// Pre-sale mirror of the sticky bar's status copy: a user who already engaged
// Sonar sees their verification status here, never a generic Register CTA.
const PRESALE_STATUS: Partial<Record<SaleJourney, string>> = {
  "kyc-pending": `${VERIFY_STATUS.pending.title}. ${VERIFY_STATUS.pending.body}`,
  "kyc-failed": `${VERIFY_STATUS.failed.title}. ${VERIFY_STATUS.failed.body}`,
  "not-eligible": `${VERIFY_STATUS["not-eligible"].title}. ${VERIFY_STATUS["not-eligible"].body}`,
}

type StepStatus = "done" | "current" | "pending" | "plain"

function getStepStatus(stepIndex: number, journey: FunnelStep): StepStatus {
  // Pre-sale, registration not open yet: no ladder position exists, so the four
  // steps read as a plain full-strength roadmap and the not-open-yet line above
  // the CTA carries the meaning.
  if (journey === "locked") return "plain"
  // Pre-sale parking state: Verify is done, nothing else is actionable yet.
  if (journey === "registered") return stepIndex === 0 ? "done" : "pending"
  const order: FunnelStep[] = ["needs-verify", "needs-connect", "wallet-ready", "bidding", "ended"]
  const j = order.indexOf(journey)
  // Step order: 0 Verify, 1 Connect, 2 Bid, 3 Distribution.
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

// Map the canonical sale journey (9 states) + phase + pre-sale stage onto this
// section's funnel vocabulary, choosing which step is current and which CTA shows.
function funnelState(journey: SaleJourney, phase: SalePhase, stage: PreSaleStage): FunnelStep {
  if (phase === "ended") return "ended"
  const verified = isSonarVerified(journey)
  if (phase === "pre-sale") {
    // Pre-sale: registration is the only actionable step (wallet connect / bid would
    // be dead CTAs - the pre-sale bar has no expanded panel). A verified user parks
    // on "registered"; before registration even opens, the whole ladder is locked.
    if (verified) return "registered"
    return stage === "registration-open" ? "needs-verify" : "locked"
  }
  switch (journey) {
    case "ready":
      return "wallet-ready"
    case "has-bid-winning":
    case "has-bid-outbid":
      return "bidding"
    case "disconnected":
    case "wrong-network":
      // verified + eligible, wallet not connected yet
      return "needs-connect"
    default:
      // kyc-required, kyc-pending, kyc-failed, not-eligible: verify not done
      return "needs-verify"
  }
}

export function HowItWorks() {
  const { journey, phase, preSaleStage, setBidPanelOpen } = useSale()
  const journeyState = funnelState(journey, phase, preSaleStage)
  const registrationOpen = preSaleStage === "registration-open"
  // Pre-sale verification status (pending / failed / not-eligible), if any.
  const preSaleStatus = phase === "pre-sale" ? PRESALE_STATUS[journey] : undefined

  return (
    <Section id="how-it-works" tone="contrast" clip>
      <RevealGroup as="div" className="col-span-12 lg:col-span-6 lg:col-start-2">
        <SectionHeading tone="contrast" eyebrow="How it works" title="How to participate" />
        <FadeIn as="div" className="mt-8 mb-10">
          {journeyState === "registered" ? (
            <p className="text-base text-on-contrast-muted">
              You're registered - the sale opens {formatSaleDate(SALE_ECONOMICS.saleOpensIso)}.
            </p>
          ) : preSaleStatus ? (
            <p className="text-base text-on-contrast-muted">{preSaleStatus}</p>
          ) : phase === "pre-sale" ? (
            registrationOpen ? (
              <ArrowLink
                onClick={redirectToSonarLogin}
                label="Register now"
                variant="ghost-contrast"
              />
            ) : (
              // Stage A: an explicit not-open-yet line, then the same all-in-one
              // capture capsule as the bar/pre-footer, left-aligned to the column.
              <div>
                <p className="mb-4 text-base text-on-contrast-muted">
                  Registration is not open yet - it opens{" "}
                  {formatSaleDate(SALE_ECONOMICS.registrationOpensIso)}.
                </p>
                <NewsletterForm variant="tile" inputId="newsletter-email-howto" align="start" />
              </div>
            )
          ) : (
            <ArrowLink
              onClick={() => setBidPanelOpen(true)}
              label={liveCtaLabel(journeyState)}
              variant="ghost-contrast"
            />
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
              {/* Fixed slots (3/4/5) shared by every step, so the four columns start
                  TOGETHER (after the title block, which cascades from the slots above)
                  while each step still reveals its own rows top to bottom. The whole
                  thing starts at half the clip's growth (the panel lead). */}
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
