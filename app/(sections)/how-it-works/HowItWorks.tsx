/**
 * How to Participate. Wrapped in a large dark tile with rounded corners.
 * The section is journey-aware: a `journeyState` drives the CTA (caption
 * + label + href) and the visual opacity of each step (done / current /
 * pending). Layer 2 wires journeyState from wagmi (wallet connection) +
 * Sonar (KYC SetupState + Commitments).
 */
import { ArrowLink } from "../../(ui)/ArrowLink"
import { Icon } from "../../(ui)/Icon"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { steps } from "../../../content/sections/how-it-works"

type JourneyState =
  | "disconnected"
  | "kyc-pending"
  | "kyc-complete"
  | "wallet-ready"
  | "bidding"
  | "ended"

const CTA_BY_STATE: Record<JourneyState, { caption: string; label: string; href: string }> = {
  disconnected: {
    caption: "Start by verifying your identity.",
    label: "Register with Sonar",
    href: "#register",
  },
  "kyc-pending": {
    caption: "Your verification is in progress.",
    label: "Continue verification",
    href: "#register",
  },
  "kyc-complete": {
    caption: "Identity verified.",
    label: "Connect your wallet",
    href: "#bid",
  },
  "wallet-ready": {
    caption: "Wallet connected.",
    label: "Place your bid",
    href: "#bid",
  },
  bidding: {
    caption: "You have an active bid.",
    label: "Update your bid",
    href: "#bid",
  },
  ended: {
    caption: "Auction closed.",
    label: "View your results",
    href: "#results",
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
  if (stepIndex === 0) return j <= 1 ? "current" : "done"
  if (stepIndex === 1) return j <= 1 ? "pending" : j <= 3 ? "current" : "done"
  if (stepIndex === 2) return j <= 4 ? "pending" : "done"
  if (stepIndex === 3) return j === 5 ? "current" : "pending"
  return "pending"
}

const STATUS_OPACITY: Record<StepStatus, string> = {
  done: "opacity-50",
  current: "opacity-100",
  pending: "opacity-70",
}

export function HowItWorks() {
  // Layer 2 derives journeyState from wagmi + Sonar API responses.
  const journeyState: JourneyState = "disconnected"
  const cta = CTA_BY_STATE[journeyState]

  return (
    <Section id="how-it-works" tone="contrast">
      <div className="col-span-12 lg:col-span-6 lg:col-start-2">
        <SectionHeading tone="contrast" eyebrow="How it works" title="How to participate" />
        <div className="mt-8 mb-16">
          <p className="mb-2 text-base text-on-contrast-muted">{cta.caption}</p>
          <ArrowLink
            href={cta.href}
            label={cta.label}
            className="text-sm text-on-contrast transition-colors hover:text-on-contrast-muted"
          />
        </div>
      </div>

      <ol className="col-span-12 grid grid-cols-1 gap-x-0 gap-y-12 md:grid-cols-2 lg:col-span-7 lg:col-start-5 lg:grid-cols-4 lg:self-end">
        {steps.map((s, i) => {
          const status = getStepStatus(i, journeyState)
          return (
            <li
              key={s.title}
              className={`${STATUS_OPACITY[status]} transition-opacity ${
                i > 0 ? "lg:border-l lg:border-on-contrast/15 lg:pl-6" : "lg:pr-6"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon name={s.icon} className="h-6 w-6 text-on-contrast-muted" />
                <p className="font-mono text-lg font-medium text-on-contrast tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </p>
              </div>
              <h3 className="mt-4 font-mono text-lg font-medium uppercase tracking-tight text-on-contrast lg:text-xl">
                {s.title}
              </h3>
              <p className="mt-3 text-base text-on-contrast-muted">{s.body}</p>
            </li>
          )
        })}
      </ol>
    </Section>
  )
}
