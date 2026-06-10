"use client"

/**
 * How to Participate. Wrapped in a large dark tile with rounded corners.
 * The section is journey-aware: a `journeyState` drives the CTA (caption
 * + label + href) and the visual opacity of each step (done / current /
 * pending). The journey comes from `useSale()` (wallet + Sonar entity),
 * mapped onto this section's 6-state funnel vocabulary by `funnelState`.
 */
import { useSale } from "../../(layout)/SaleProvider"
import { ArrowLink } from "../../(ui)/ArrowLink"
import { FadeIn } from "../../(ui)/FadeIn"
import { Icon } from "../../(ui)/Icon"
import { Reveal } from "../../(ui)/Reveal"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { steps } from "../../../content/sections/how-it-works"
import type { JourneyState as SaleJourney, SalePhase } from "../../../lib/sale/types"

type JourneyState =
  | "disconnected"
  | "kyc-pending"
  | "kyc-complete"
  | "wallet-ready"
  | "bidding"
  | "ended"

const CTA_BY_STATE: Record<JourneyState, { caption: string; label: string }> = {
  disconnected: {
    caption: "Start by connecting your wallet.",
    label: "Connect your wallet",
  },
  "kyc-pending": {
    caption: "Verify your identity with Sonar.",
    label: "Verify with Sonar",
  },
  "kyc-complete": {
    caption: "Identity verified.",
    label: "Connect your wallet",
  },
  "wallet-ready": {
    caption: "Wallet connected.",
    label: "Place your bid",
  },
  bidding: {
    caption: "You have an active bid.",
    label: "Update your bid",
  },
  ended: {
    caption: "Auction closed.",
    label: "View your results",
  },
}

type StepStatus = "done" | "current" | "pending"

function getStepStatus(stepIndex: number, journey: JourneyState): StepStatus {
  const order: JourneyState[] = [
    "disconnected",
    "kyc-pending",
    "kyc-complete",
    "wallet-ready",
    "bidding",
    "ended",
  ]
  const j = order.indexOf(journey)
  // Step order: 0 Connect, 1 Verify, 2 Bid, 3 Distribution.
  if (stepIndex === 0) return j === 0 ? "current" : "done"
  if (stepIndex === 1) return j === 0 ? "pending" : j === 1 ? "current" : "done"
  if (stepIndex === 2) return j < 3 ? "pending" : j === 5 ? "done" : "current"
  if (stepIndex === 3) return j === 5 ? "current" : "pending"
  return "pending"
}

const STATUS_OPACITY: Record<StepStatus, string> = {
  done: "opacity-70",
  current: "opacity-100",
  pending: "opacity-50",
}

// Map the canonical sale journey (9 states) + phase onto this section's 6-state
// funnel vocabulary, choosing which step is current and which CTA shows.
function funnelState(journey: SaleJourney, phase: SalePhase): JourneyState {
  if (phase === "ended") return "ended"
  switch (journey) {
    case "ready":
      return "wallet-ready"
    case "has-bid-winning":
    case "has-bid-outbid":
      return "bidding"
    case "kyc-required":
    case "kyc-pending":
    case "kyc-failed":
    case "not-eligible":
      return "kyc-pending"
    default:
      // disconnected, wrong-network: no wallet connected yet
      return "disconnected"
  }
}

export function HowItWorks() {
  const { journey, phase, setBidPanelOpen } = useSale()
  const journeyState = funnelState(journey, phase)
  const cta = CTA_BY_STATE[journeyState]

  return (
    <Section id="how-it-works" tone="contrast" clip>
      <RevealGroup as="div" className="col-span-12 lg:col-span-6 lg:col-start-2">
        <SectionHeading tone="contrast" eyebrow="How it works" title="How to participate" />
        <FadeIn as="div" className="mt-8 mb-10">
          <p className="mb-2 text-base text-on-contrast-muted">{cta.caption}</p>
          <ArrowLink
            onClick={() => setBidPanelOpen(true)}
            label={cta.label}
            className="text-sm text-on-contrast transition-colors hover:text-on-contrast-muted"
          />
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
                className="mt-4 font-mono text-lg font-medium uppercase tracking-tight text-on-contrast lg:text-xl"
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
