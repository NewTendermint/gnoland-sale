"use client"

import { useState } from "react"
import { Icon } from "../(ui)/Icon"
import { postNewsletterSubscribe } from "../../lib/newsletter/client"
import { markEmailOptInDone, newsletterEnabled } from "../../lib/newsletter/config"

const CAPSULE = {
  bar: "flex items-center gap-3 rounded-full border border-transparent bg-surface-contrast bg-clip-padding py-1 pl-5 pr-1 transition-colors",
  tile: "flex items-center gap-3 rounded-full border border-transparent bg-on-contrast bg-clip-padding py-1 pl-5 pr-1 transition-colors",
  inline:
    "flex items-center gap-2 rounded-full border border-transparent bg-surface-alt bg-clip-padding py-0.5 pl-3 pr-0.5 transition-colors",
} as const
const CAPSULE_BORDER = {
  bar: "hover:border-border-strong focus-within:border-border-strong",
  tile: "hover:border-on-contrast/40 focus-within:border-on-contrast/60",
  inline: "hover:border-border-strong focus-within:border-border-strong",
} as const
const FIELD_INPUT = {
  bar: "w-44 bg-transparent font-mono text-base text-on-contrast outline-none placeholder:text-on-contrast-muted sm:w-52",
  tile: "w-44 bg-transparent font-mono text-base text-surface-contrast outline-none placeholder:text-surface-contrast/50 sm:w-56",
  inline:
    "w-36 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted",
} as const
const SUBMIT = {
  bar: "btn-pan inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-on-contrast px-4 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-surface-contrast ring-1 ring-faint ring-inset before:bg-surface-contrast hover:text-on-contrast disabled:pointer-events-none disabled:opacity-40",
  tile: "btn-pan inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-contrast px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-on-contrast ring-1 ring-faint ring-inset before:bg-on-contrast hover:text-surface-contrast disabled:pointer-events-none disabled:opacity-40",
  inline:
    "btn-pan inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-faint bg-surface-contrast px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-on-contrast before:bg-on-contrast hover:text-surface-contrast disabled:pointer-events-none disabled:opacity-40",
} as const

// Client-side pre-check so a malformed email shows a clear inline error instead of the
// generic upstream failure; the server (zod email) stays the authoritative validator.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function NewsletterForm({
  variant,
  inputId,
  align = variant === "tile" ? "center" : "start",
  onSuccess,
}: {
  variant: "bar" | "tile" | "inline"
  inputId: string
  /** Block alignment; tiles center by default, "start" fits a left-aligned column. */
  align?: "center" | "start"
  /** Fires once the subscription POST succeeds (the form keeps rendering its own success row). */
  onSuccess?: () => void
}) {
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error" | "invalid">(
    "idle",
  )
  const [email, setEmail] = useState("")
  const [topic, setTopic] = useState("")
  if (!newsletterEnabled()) return null

  const onContrast = variant === "tile"
  const muted = onContrast ? "text-on-contrast-muted" : "text-muted"

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!EMAIL_RE.test(trimmed)) {
      setState("invalid")
      return
    }
    setState("submitting")
    try {
      await postNewsletterSubscribe(trimmed, topic)
      setState("success")
      // Every surface records the shared opt-in flag; the bid panel reads it for its check state.
      markEmailOptInDone()
      onSuccess?.()
    } catch {
      setState("error")
    }
  }

  return (
    <div className={`relative ${align === "center" ? "text-center" : ""}`}>
      {state === "success" ? (
        <div className="border border-transparent py-1">
          <div
            className={`flex h-9 items-center gap-2.5 ${align === "center" ? "justify-center" : ""}`}
          >
            <Icon name="shield-check" draw={false} className="h-5 w-5 shrink-0 text-mint" />
            <p className={`text-sm ${onContrast ? "text-on-contrast" : "text-foreground"}`}>
              Confirmation email sent - check your inbox.
            </p>
          </div>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          noValidate
          className={align === "center" ? "inline-flex" : "flex"}
        >
          <label htmlFor={inputId} className="sr-only">
            Email address
          </label>
          <div
            className={`${CAPSULE[variant]} ${
              state === "error" || state === "invalid" ? "border-danger" : CAPSULE_BORDER[variant]
            }`}
          >
            <input
              id={inputId}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (state === "error" || state === "invalid") setState("idle")
              }}
              aria-invalid={state === "error" || state === "invalid" || undefined}
              className={FIELD_INPUT[variant]}
            />
            <button type="submit" disabled={state === "submitting"} className={SUBMIT[variant]}>
              <span>{state === "submitting" ? "Subscribing..." : "Get notified"}</span>
            </button>
          </div>
          {/* Honeypot: hidden + out of tab order; server drops any submission that fills it. */}
          <div className="sr-only" aria-hidden="true">
            <label htmlFor={`${inputId}-topic`}>Topic</label>
            <input
              id={`${inputId}-topic`}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        </form>
      )}
      {/* bar/inline live in tight rows -> absolute (no layout shift). tile flows in-page -> the
          message pushes content down, but only reserves height when there IS a message (keeps
          adjacent CTAs vertically centered with the capsule when idle). */}
      <output
        className={`${
          variant === "tile"
            ? `${state === "idle" || state === "submitting" ? "hidden" : "mt-1.5 block"}`
            : `absolute top-full mt-1 whitespace-nowrap ${
                align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"
              }`
        } h-4 text-[10px] uppercase tracking-[0.2em] ${
          state === "error" || state === "invalid" ? "text-danger" : muted
        }`}
      >
        {state === "invalid" ? (
          "Please enter a valid email address."
        ) : state === "error" ? (
          "Could not subscribe. Please try again."
        ) : state === "success" ? (
          <span className="sr-only">Confirmation email sent - check your inbox.</span>
        ) : null}
      </output>
    </div>
  )
}
