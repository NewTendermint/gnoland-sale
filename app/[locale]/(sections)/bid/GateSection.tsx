"use client"

import { track } from "@/lib/analytics/track"
import { SALE_CHAIN } from "@/lib/sale/contracts"
import {
  type SaleTranslator,
  supportVerifyFailedHref,
  verifyIncomplete,
  verifyStatus,
  welcomeBack,
} from "@/lib/sale/labels"
import type { JourneyState } from "@/lib/sale/types"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import { useSwitchChain } from "wagmi"
import { Cta } from "../../(ui)/Cta"
import { Icon } from "../../(ui)/Icon"
import { ConnectChoices } from "./ConnectChoices"
import { ManageEntityCta, SonarSignOutButton } from "./ManageEntity"

// What the funnel shows before a visitor can bid, one gate per journey state. KYC and eligibility
// states share GateRow's layout; wrong-network and connect carry their own (SwitchNetworkGate
// below, ./ConnectChoices). The form past these gates is ./BidFlow.

type GateProps = {
  journey: JourneyState
  returning?: boolean
  onConnectSonar?: () => void
  onSignOut: () => void
  setupHref: string
  entityLabel?: string | null
}

/** GateContent in the funnel's gate-row layout. Shared by the live bid flow (StateContent) and the
 *  ended-phase panel, which swaps the position terminal for the settlement view. */
export function GateSection(props: GateProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <div className="min-w-0 flex-1">
        <GateContent {...props} />
      </div>
    </div>
  )
}

function GateContent({
  journey,
  returning,
  onConnectSonar,
  onSignOut,
  setupHref,
  entityLabel,
}: GateProps) {
  const t = useTranslations("Bid")
  const st = useTranslations("Sale") as unknown as SaleTranslator
  const vs = verifyStatus(st)
  const vi = verifyIncomplete(st)
  const wb = welcomeBack(st)
  const failedHref = supportVerifyFailedHref(st)
  // Dark-capsule variant of the pre-sale bar's manage CTA (same states, same destination).
  const manageCta = (
    <ManageEntityCta
      href={setupHref}
      label={entityLabel}
      variant="ghost-contrast"
      onSignOut={onSignOut}
    />
  )
  switch (journey) {
    case "wrong-network":
      return <SwitchNetworkGate />
    case "kyc-incomplete":
      return (
        <GateRow
          icon={vi.icon}
          title={vi.title}
          cta={vi.cta}
          ctaHref={setupHref}
          secondary={<SonarSignOutButton onSignOut={onSignOut} variant="tile" />}
        />
      )
    case "kyc-required":
      return returning ? (
        <GateRow
          icon={wb.icon}
          title={wb.title}
          body={wb.body}
          cta={wb.cta}
          onCta={onConnectSonar}
        />
      ) : (
        <GateRow
          icon="shield-check"
          title={t("verifyIdentityTitle")}
          body={t("verifyIdentityBody")}
          cta={t("verifyWithSonar")}
          onCta={onConnectSonar}
        />
      )
    case "kyc-pending":
      return (
        <GateRow
          icon={vs.pending.icon}
          title={vs.pending.title}
          body={vs.pending.body}
          secondary={manageCta}
        />
      )
    case "kyc-failed":
      return (
        <GateRow
          icon={vs.failed.icon}
          tone={vs.failed.tone}
          title={vs.failed.title}
          body={vs.failed.body}
          cta={failedHref ? t("contactSupport") : undefined}
          ctaHref={failedHref ?? undefined}
          secondary={manageCta}
        />
      )
    case "not-eligible":
      return (
        <GateRow
          icon={vs["not-eligible"].icon}
          tone={vs["not-eligible"].tone}
          title={vs["not-eligible"].title}
          body={vs["not-eligible"].body}
          secondary={manageCta}
        />
      )
    default:
      return <ConnectChoices />
  }
}

function GateRow({
  icon,
  title,
  body,
  cta,
  onCta,
  ctaHref,
  secondary,
  tone = "default",
}: {
  icon: string
  title: string
  body?: string
  cta?: string
  onCta?: () => void
  ctaHref?: string
  secondary?: ReactNode
  tone?: "default" | "danger"
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <div className="flex items-center gap-3">
        <Icon
          name={icon}
          draw={false}
          className={`h-5 w-5 shrink-0 ${tone === "danger" ? "text-danger" : "text-foreground"}`}
        />
        <p className="text-sm">
          <span className="font-medium text-foreground">{title}.</span>
          {body ? <span className="ml-1.5 text-muted">{body}</span> : null}
        </p>
      </div>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
        {ctaHref && cta ? (
          <Cta
            variant="solid-contrast"
            href={ctaHref}
            onClick={() => track("sonar_setup_opened", { placement: "bid-panel" })}
            external
          >
            {cta}
          </Cta>
        ) : cta ? (
          <Cta variant="solid-contrast" onClick={onCta}>
            {cta}
          </Cta>
        ) : null}
        {secondary}
      </div>
    </div>
  )
}

function SwitchNetworkGate() {
  const t = useTranslations("Bid")
  const { switchChain, isPending, error } = useSwitchChain()
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <div className="flex items-center gap-3">
        <Icon name="network" draw={false} className="h-5 w-5 shrink-0 text-foreground" />
        <p className="text-sm">
          <span className="font-medium text-foreground">{t("wrongNetwork")}</span>
          <span className={`ml-1.5 ${error ? "text-danger" : "text-muted"}`}>
            {error ? t("switchFailed") : t("switchNetworkPrompt", { chain: SALE_CHAIN.name })}
          </span>
        </p>
      </div>
      <Cta
        variant="solid-contrast"
        className="ml-auto"
        onClick={() => switchChain({ chainId: SALE_CHAIN.id })}
        disabled={isPending}
      >
        {isPending ? t("switching") : t("switchToChain", { chain: SALE_CHAIN.name })}
      </Cta>
    </div>
  )
}
