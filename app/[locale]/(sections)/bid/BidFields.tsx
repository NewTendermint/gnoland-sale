"use client"

import { fmtUsd } from "@/lib/sale/format"
import { useTranslations } from "next-intl"
import { type ReactNode, useEffect, useRef, useState } from "react"
import { Icon } from "../../(ui)/Icon"

// Form primitives of the bid row: amount/price cells with their steppers, the payment-token picker,
// the field hint and the raise delta pill. `sanitizeDecimal` rewrites the typed money string before
// any caller sees it; every other validation and money rule lives in ./BidFlow or lib/sale/calc.ts.

/** Small "+amount" pill shown on the bid CTAs when a raise adds USDC over the prior commitment. */
export function DeltaCapsule({ added }: { added: number }) {
  if (!Number.isFinite(added) || added <= 0) return null
  return (
    <span className="rounded-full border border-current px-1.5 py-px text-[0.65em] font-bold tracking-normal opacity-70">
      +{fmtUsd(added)}
    </span>
  )
}

function sanitizeDecimal(v: string): string {
  // Commas stay visible as typed (EU decimal key / US grouping); parseDecimal disambiguates.
  const cleaned = v.replace(/[^0-9.,]/g, "")
  const [head, ...rest] = cleaned.split(".")
  return rest.length > 0 ? `${head}.${rest.join("")}` : head
}

const STEP_BTN =
  "flex shrink-0 cursor-pointer items-center justify-center rounded-md px-3 py-2 font-mono text-base leading-none disabled:pointer-events-none disabled:opacity-30"

export function InputCell({
  id,
  label,
  value,
  onChange,
  readOnly = false,
  prefix,
  suffix,
  trailing,
  error,
  invalid,
  placeholder,
  hint,
  stepper,
  className = "",
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  readOnly?: boolean
  prefix?: string
  suffix?: ReactNode
  /** Interactive node after the input (e.g. the payment-token picker) - rendered without the
   *  decorative suffix's aria-hidden. */
  trailing?: ReactNode
  error?: string | null
  invalid: boolean
  placeholder?: string
  hint?: string
  stepper?: {
    onUp: () => void
    onDown: () => void
    upDisabled?: boolean
    downDisabled?: boolean
    upLabel: string
    downLabel: string
  }
  className?: string
}) {
  const [hintFlash, setHintFlash] = useState(false)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    },
    [],
  )
  function flashStepper() {
    if (!stepper) return
    setHintFlash(true)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setHintFlash(false), 400)
  }
  const stepBtnCls = `${STEP_BTN} ${
    hintFlash
      ? "bg-on-contrast text-surface-contrast"
      : "bg-border text-muted hover:bg-border-strong hover:text-foreground"
  }`
  return (
    <div className="relative flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-[10px] uppercase tracking-[0.2em] text-muted">
          {label}
        </label>
        {hint ? <FieldHint text={hint} /> : null}
      </div>
      <div
        className={`flex h-12 items-center rounded-[var(--radius-md)] border bg-surface-alt ${
          stepper ? "pl-2" : "pl-3.5"
        } pr-3.5 transition-colors ${
          invalid
            ? "border-danger"
            : readOnly
              ? "border-border"
              : "border-border focus-within:border-faint"
        }`}
      >
        {stepper ? (
          <div className="mr-2 flex items-center gap-0.5">
            <button
              type="button"
              aria-label={stepper.downLabel}
              onClick={stepper.onDown}
              disabled={stepper.downDisabled}
              className={stepBtnCls}
            >
              -
            </button>
            <button
              type="button"
              aria-label={stepper.upLabel}
              onClick={stepper.onUp}
              disabled={stepper.upDisabled}
              className={stepBtnCls}
            >
              +
            </button>
          </div>
        ) : null}
        {prefix ? (
          <span aria-hidden="true" className="mr-1 font-mono text-lg text-muted">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={(e) => onChange(sanitizeDecimal(e.target.value))}
          onFocus={flashStepper}
          onKeyDown={
            stepper
              ? (e) => {
                  if (e.key === "ArrowUp") {
                    e.preventDefault()
                    stepper.onUp()
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault()
                    stepper.onDown()
                  }
                }
              : undefined
          }
          aria-invalid={invalid || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${className} bg-transparent font-mono text-lg tabular-nums text-foreground outline-none`}
        />
        {suffix ? (
          <span aria-hidden="true" className="ml-1 whitespace-nowrap font-mono text-sm text-muted">
            {suffix}
          </span>
        ) : null}
        {trailing ?? null}
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-0.5 w-0 min-w-full truncate text-xs font-medium text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Per-transaction funding token picker (the "USDC ▾" suffix of the Amount field); rendered only
 *  once the sale accepts several tokens. Native select: keyboard + screen reader for free. */
export function TokenSelect({
  tokens,
  value,
  onChange,
}: {
  tokens: readonly { address: `0x${string}`; symbol: string }[]
  value?: `0x${string}`
  onChange: (address: `0x${string}`) => void
}) {
  const t = useTranslations("Bid")
  return (
    <span className="relative ml-1 inline-flex items-center whitespace-nowrap font-mono text-sm text-muted transition-colors focus-within:text-foreground hover:text-foreground">
      <select
        aria-label={t("paymentToken")}
        value={value}
        onChange={(e) => onChange(e.target.value as `0x${string}`)}
        className="cursor-pointer appearance-none bg-transparent pr-[15px] outline-none"
      >
        {tokens.map((t) => (
          <option key={t.address} value={t.address}>
            {t.symbol}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 10 6"
        className="pointer-events-none absolute right-0 top-1/2 h-[6px] w-[9px] -translate-y-1/2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export function FieldHint({ text }: { text: string }) {
  return (
    <span className="group/hint relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground focus-visible:text-foreground"
      >
        <Icon name="help" draw={false} className="h-3.5 w-3.5" />
      </button>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-full z-[var(--z-modal)] mt-2 w-max max-w-[22rem] rounded-[var(--radius-md)] bg-on-contrast px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-surface-contrast opacity-0 shadow-lg transition-opacity duration-100 group-hover/hint:opacity-100 group-focus-within/hint:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}
