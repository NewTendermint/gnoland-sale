"use client"

import { useQueryClient } from "@tanstack/react-query"
import { type ReactNode, useState } from "react"
import { ManageEntityCta, SonarSignOutButton } from "../(sections)/bid/ManageEntity"
import { Cta } from "../(ui)/Cta"
import { DrawLine } from "../(ui)/DrawLine"
import { track } from "../../lib/analytics/track"
import { newsletterEnabled } from "../../lib/newsletter/config"
import { postSonarLogout, redirectToSonarLogin } from "../../lib/sale/api"
import { SALE_ECONOMICS, formatSaleDate } from "../../lib/sale/economics"
import { derivePreSaleBar } from "../../lib/sale/journey"
import {
  SUPPORT_VERIFY_FAILED_HREF,
  VERIFY_INCOMPLETE,
  VERIFY_STATUS,
  WELCOME_BACK,
} from "../../lib/sale/labels"
import { clearPendingBid } from "../../lib/sale/pending-bid"
import { clearBidSeen, clearSonarSeen, useSonarSeen } from "../../lib/sale/returning"
import type { PreSaleBarState } from "../../lib/sale/types"
import { AddToCalendarButton } from "./AddToCalendarButton"
import { BarCountdown, BarShell, BarStatus } from "./BidBarShell"
import { NewsletterForm } from "./NewsletterForm"
import { useSale } from "./SaleProvider"

/** Sonar session actions shared by the desktop panel and the mobile pre-sale bar. */
export function useSonarSessionActions() {
  const queryClient = useQueryClient()

  function signOut() {
    postSonarLogout().then(
      () => {
        clearSonarSeen()
        clearBidSeen()
        clearPendingBid()
        queryClient.invalidateQueries({ queryKey: ["sale", "entity"] })
        queryClient.invalidateQueries({ queryKey: ["sale", "my-bid"] })
      },
      // Fail-honest: on a failed logout the caches stay, so the UI keeps showing the still-live
      // session instead of pretending the user signed out.
      () => console.warn("sonar-signout: logout request failed"),
    )
  }

  // Returns the refetch promise so RefreshButton can show a discreet pending state.
  function refresh() {
    return queryClient.invalidateQueries({ queryKey: ["sale", "entity"] })
  }

  return { signOut, refresh }
}

/** Narrow-width pre-sale bar: full registration/KYC funnel, no wallet and no calendar control.
 *  Served on funnel-incapable devices during the pre-sale phase only; live/ended stay on the
 *  awareness bar (bidding remains desktop-only). */
export function PreSaleBarMobile() {
  const { preSaleStage, journey, sonarReturn, sonarSetupUrl, entityLabel } = useSale()
  const sonarSeen = useSonarSeen()
  const { signOut, refresh } = useSonarSessionActions()
  const barState = derivePreSaleBar(preSaleStage, journey, sonarReturn)
  const countToSale = preSaleStage === "registration-open" || barState === "registered"
  return (
    <BarShell>
      <DrawLine immediate />
      <div className="flex flex-col gap-4 py-4 sm:py-5">
        <BarCountdown
          targetIso={
            countToSale ? SALE_ECONOMICS.saleOpensIso : SALE_ECONOMICS.registrationOpensIso
          }
          caption={
            countToSale
              ? `Opens ${formatSaleDate(SALE_ECONOMICS.saleOpensIso)}`
              : `Registration opens ${formatSaleDate(SALE_ECONOMICS.registrationOpensIso, false)}`
          }
        />
        <PreSaleRight
          state={barState}
          returning={sonarSeen}
          setupHref={sonarSetupUrl}
          entityLabel={entityLabel}
          compact
          onRegister={redirectToSonarLogin}
          onSignOut={signOut}
          onRefresh={refresh}
        />
      </div>
    </BarShell>
  )
}

function RefreshButton({ onRefresh }: { onRefresh: () => void | Promise<void> }) {
  const [pending, setPending] = useState(false)
  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      onClick={async () => {
        setPending(true)
        try {
          await onRefresh()
        } finally {
          setPending(false)
        }
      }}
      className="text-[11px] text-muted underline underline-offset-2 transition-colors hover:text-foreground disabled:opacity-60"
    >
      {pending ? "Refreshing…" : "Refresh"}
    </button>
  )
}

function StatusRow({
  icon,
  tone = "default",
  title,
  body,
  action,
  manage,
  onSignOut,
  onRefresh,
  withCalendar = false,
  contactHref,
}: {
  icon: string
  tone?: "default" | "danger" | "ok"
  title: string
  body?: string
  action?: ReactNode
  /** The entity manage link, shown across every KYC state that has a Sonar entity. It carries
   *  its own sign-out control; onSignOut here only backs the manage-less states (incomplete). */
  manage?: ReactNode
  onSignOut?: () => void
  onRefresh?: () => void | Promise<void>
  withCalendar?: boolean
  contactHref?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <BarStatus icon={icon} tone={tone} title={title} body={body} />
        {contactHref ? (
          <a
            href={contactHref}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-semibold text-foreground underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            Contact support
          </a>
        ) : null}
        {onRefresh ? <RefreshButton onRefresh={onRefresh} /> : null}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {manage}
        {action}
        {withCalendar ? <AddToCalendarButton milestone="sale" variant="bar" /> : null}
        {manage || !onSignOut ? null : <SonarSignOutButton onSignOut={onSignOut} />}
      </div>
    </div>
  )
}

export function PreSaleRight({
  state,
  returning,
  setupHref,
  entityLabel,
  compact = false,
  onRegister = () => {},
  onSignOut = () => {},
  onRefresh = () => {},
}: {
  state: PreSaleBarState
  returning: boolean
  setupHref: string
  entityLabel?: string | null
  /** Narrow-width rendering (mobile bar): drops the add-to-calendar control. */
  compact?: boolean
  onRegister?: () => void
  onSignOut?: () => void
  onRefresh?: () => void | Promise<void>
}) {
  switch (state) {
    case "notify":
      return newsletterEnabled() ? (
        <div className="flex flex-wrap items-center gap-5">
          <NewsletterForm variant="bar" inputId="newsletter-email-bar" />
          {compact ? null : <AddToCalendarButton milestone="registration" variant="bar" />}
        </div>
      ) : (
        <p className="text-sm text-muted">{`Sale opens ${formatSaleDate(SALE_ECONOMICS.saleOpensIso)}`}</p>
      )
    case "register":
      return returning ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <BarStatus
            icon={WELCOME_BACK.icon}
            title={`${WELCOME_BACK.title}.`}
            body={WELCOME_BACK.body}
          />
          <Cta variant="solid" arrow onClick={onRegister}>
            <span>{WELCOME_BACK.cta}</span>
          </Cta>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <p className="text-sm text-muted">Registration is open</p>
          <Cta variant="solid" arrow onClick={onRegister}>
            <span>Register now</span>
          </Cta>
        </div>
      )
    case "incomplete":
      return (
        <StatusRow
          icon={VERIFY_INCOMPLETE.icon}
          title={`${VERIFY_INCOMPLETE.title}.`}
          action={
            <Cta
              variant="solid"
              arrow
              href={setupHref}
              onClick={() => track("sonar_setup_opened", { placement: "pre-sale-bar" })}
              external
            >
              <span>{VERIFY_INCOMPLETE.cta}</span>
            </Cta>
          }
          onSignOut={onSignOut}
        />
      )
    case "pending":
      return (
        <StatusRow
          icon={VERIFY_STATUS.pending.icon}
          tone={VERIFY_STATUS.pending.tone}
          title={`${VERIFY_STATUS.pending.title}.`}
          body={VERIFY_STATUS.pending.body}
          manage={<ManageEntityCta href={setupHref} label={entityLabel} onSignOut={onSignOut} />}
          onRefresh={onRefresh}
          withCalendar={!compact}
        />
      )
    case "failed":
      return (
        <StatusRow
          icon={VERIFY_STATUS.failed.icon}
          tone={VERIFY_STATUS.failed.tone}
          title={`${VERIFY_STATUS.failed.title}.`}
          body={VERIFY_STATUS.failed.body}
          manage={<ManageEntityCta href={setupHref} label={entityLabel} onSignOut={onSignOut} />}
          withCalendar={!compact}
          contactHref={SUPPORT_VERIFY_FAILED_HREF ?? undefined}
        />
      )
    case "not-eligible":
      return (
        <StatusRow
          icon={VERIFY_STATUS["not-eligible"].icon}
          tone={VERIFY_STATUS["not-eligible"].tone}
          title={`${VERIFY_STATUS["not-eligible"].title}.`}
          body={VERIFY_STATUS["not-eligible"].body}
          manage={<ManageEntityCta href={setupHref} label={entityLabel} onSignOut={onSignOut} />}
          withCalendar={!compact}
        />
      )
    case "registered":
      return (
        <StatusRow
          icon={VERIFY_STATUS.verified.icon}
          tone={VERIFY_STATUS.verified.tone}
          title={`${VERIFY_STATUS.verified.title}.`}
          body="Nothing more to do until the sale opens."
          manage={<ManageEntityCta href={setupHref} label={entityLabel} onSignOut={onSignOut} />}
          withCalendar={!compact}
        />
      )
    case "auth-error":
      return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <BarStatus
            icon="shield-check"
            tone="danger"
            title="Could not connect to Sonar."
            body="Please try again."
          />
          <Cta variant="solid" arrow onClick={onRegister}>
            <span>Try again</span>
          </Cta>
        </div>
      )
    default:
      return state satisfies never
  }
}
