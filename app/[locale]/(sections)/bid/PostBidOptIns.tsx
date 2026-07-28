"use client"

import { clearEmailOptInDone, emailOptInDone, newsletterEnabled } from "@/lib/newsletter/config"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { NewsletterForm } from "../../(layout)/NewsletterForm"
import { CloseButton } from "../../(ui)/CloseButton"
import { Cta } from "../../(ui)/Cta"
import { Icon } from "../../(ui)/Icon"
import { usePushAlerts } from "./PushOptIn"

// Channel pitches (validated copy) live in the Bid namespace: the compact menu is CTAs only, each
// dedicated view shows its own channel pitch (the CTA label already names the channel, so the
// email pitch carries only the privacy promise). pushHint is the settings tooltip for granted.

/** Post-bid opt-in row. Compact menu: one explainer + two icon CTAs (check icon once a channel
 *  is active). Clicking a CTA switches the slot to that channel's dedicated view; success and
 *  error copy lives ONLY in the dedicated views. */
export function PostBidOptIns({
  bidLimitUsd,
  onDetailChange,
}: {
  bidLimitUsd: number
  /** Fires when the slot enters/leaves a dedicated view, so the row can free horizontal space. */
  onDetailChange?: (detail: boolean) => void
}) {
  const t = useTranslations("Bid")
  const { supported, status, enable } = usePushAlerts(bidLimitUsd)
  const [view, setViewRaw] = useState<"menu" | "email" | "push">("menu")
  const setView = (v: "menu" | "email" | "push") => {
    setViewRaw(v)
    onDetailChange?.(v !== "menu")
  }
  const [emailDone, setEmailDone] = useState(false)
  const emailEnabled = newsletterEnabled()

  // The flag is written by ANY NewsletterForm instance (footer, tiles, this panel).
  useEffect(() => {
    setEmailDone(emailOptInDone())
  }, [])

  const pushGranted = status === "granted"
  const pushOffered = supported && status !== "unsupported"

  if (view === "email") {
    return (
      <div className="ml-auto flex min-w-0 items-center justify-end gap-x-4">
        <div aria-hidden="true" className="h-8 w-px shrink-0 bg-border" />
        {emailDone ? (
          // Re-opened from the checked CTA: the subscription already happened, show the state,
          // with an escape hatch for a mistyped address (clears the browser flag only).
          <>
            <p className="flex items-center gap-2 whitespace-nowrap text-xs text-mint">
              <Icon name="shield-check" draw={false} className="h-4 w-4 shrink-0" />
              {t("confirmationSent")}
            </p>
            <button
              type="button"
              onClick={() => {
                clearEmailOptInDone()
                setEmailDone(false)
              }}
              className="cursor-pointer whitespace-nowrap text-xs text-muted underline underline-offset-2 hover:text-foreground"
            >
              {t("useAnotherEmail")}
            </button>
          </>
        ) : (
          <>
            <p className="min-w-0 max-w-[36ch] shrink text-right text-xs text-muted">
              {t("emailPitch")}
            </p>
            <span className="shrink-0">
              <NewsletterForm
                variant="inline"
                inputId="bid-panel-email"
                onSuccess={() => setEmailDone(true)}
              />
            </span>
          </>
        )}
        <CloseButton label={t("backToNotifications")} onClick={() => setView("menu")} />
      </div>
    )
  }

  if (view === "push") {
    return (
      <div className="ml-auto flex min-w-0 items-center justify-end gap-x-4">
        <div aria-hidden="true" className="h-8 w-px shrink-0 bg-border" />
        {status === "working" ? (
          <p className="min-w-0 max-w-[36ch] shrink text-right text-xs text-muted">
            {t("pushPitch")}
          </p>
        ) : status === "error" ? (
          <p className="min-w-0 max-w-[44ch] shrink text-right text-xs text-muted">
            {t("pushError")}
          </p>
        ) : null}
        {status === "working" ? (
          <Cta variant="ghost-contrast" size="sm" className="shrink-0 whitespace-nowrap" disabled>
            {t("enabling")}
          </Cta>
        ) : status === "granted" ? (
          <p
            className="flex items-center gap-2 whitespace-nowrap text-xs text-mint"
            title={t("pushHint")}
          >
            <Icon name="shield-check" draw={false} className="h-4 w-4 shrink-0" />
            {t("pushGranted")}
          </p>
        ) : status === "denied" ? (
          <p className="text-xs text-muted">{t("pushDenied")}</p>
        ) : status === "unsupported" ? (
          <p className="text-xs text-muted">{t("pushUnsupported")}</p>
        ) : (
          <Cta
            variant="ghost-contrast"
            size="sm"
            className="shrink-0 whitespace-nowrap"
            onClick={enable}
          >
            {t("retry")}
          </Cta>
        )}
        {status !== "working" ? (
          <CloseButton label={t("backToNotifications")} onClick={() => setView("menu")} />
        ) : null}
      </div>
    )
  }

  return (
    <div className="ml-auto flex min-w-0 items-center justify-end gap-x-3">
      {emailEnabled ? (
        <Cta
          variant="ghost-contrast"
          size="sm"
          className="shrink-0 whitespace-nowrap"
          onClick={() => setView("email")}
        >
          <Icon
            name={emailDone ? "shield-check" : "send"}
            draw={false}
            className={`h-4 w-4 shrink-0 ${emailDone ? "text-mint" : ""}`}
          />
          {emailDone ? t("priceUpdatesOn") : t("priceUpdates")}
        </Cta>
      ) : null}
      {pushOffered ? (
        <Cta
          variant="ghost-contrast"
          size="sm"
          className="shrink-0 whitespace-nowrap"
          title={pushGranted ? t("pushHint") : undefined}
          onClick={() => {
            setView("push")
            if (status === "idle" || status === "error") enable()
          }}
        >
          <Icon
            name={pushGranted ? "shield-check" : "browser"}
            draw={false}
            className={`h-4 w-4 shrink-0 ${pushGranted ? "text-mint" : ""}`}
          />
          {pushGranted ? t("outbidAlertsOn") : t("outbidAlerts")}
        </Cta>
      ) : null}
    </div>
  )
}
