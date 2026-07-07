import type { ReactNode, Ref } from "react"
import { CtaArrow } from "./CtaArrow"

// Single source for every CTA pill. btn-pan owns the ::before panel-slide hover (Tailwind @apply can't pull it in).
const VARIANTS = {
  solid:
    "border border-faint bg-foreground text-background before:bg-background hover:text-foreground",
  "solid-contrast":
    "border border-faint bg-on-contrast text-surface-contrast before:bg-surface-contrast hover:text-on-contrast",
  ghost: "border border-border text-foreground before:bg-foreground hover:text-background",
  "ghost-contrast":
    "border border-on-contrast/25 text-on-contrast before:bg-on-contrast hover:text-surface-contrast",
} as const

const SIZES = {
  xs: "px-4 py-2 text-xs",
  sm: "px-5 py-2.5 text-sm",
  md: "px-6 py-3 text-xs",
  lg: "px-7 py-3.5 text-xs",
} as const

type CtaProps = {
  href?: string
  onClick?: () => void
  label?: string
  children?: ReactNode
  external?: boolean
  arrow?: boolean | "diagonal"
  ariaLabel?: string
  ariaExpanded?: boolean
  ariaControls?: string
  buttonRef?: Ref<HTMLButtonElement>
  disabled?: boolean
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
  className?: string
  title?: string
}

export function Cta({
  href,
  onClick,
  label,
  children,
  external = false,
  arrow = false,
  ariaLabel,
  ariaExpanded,
  ariaControls,
  buttonRef,
  disabled,
  variant = "solid",
  size = "md",
  className = "",
  title,
}: CtaProps) {
  const base =
    "btn-pan group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-bold uppercase tracking-[0.2em] disabled:pointer-events-none disabled:opacity-40"
  const cls = `${base} ${SIZES[size]} ${VARIANTS[variant]} ${className}`
  const diagonal = arrow === "diagonal" || (arrow === true && external)
  const inner = (
    <span className="inline-flex items-center gap-2">
      {children ?? label}
      {diagonal ? (
        // Inline SVG, not the U+2197 glyph: some Windows fonts promote it to emoji.
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-[0.85em] w-[0.85em] shrink-0 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        >
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      ) : arrow ? (
        <CtaArrow />
      ) : null}
    </span>
  )
  if (onClick) {
    return (
      <button
        type="button"
        ref={buttonRef}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        title={title}
        className={cls}
      >
        {inner}
      </button>
    )
  }
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      title={title}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className={cls}
    >
      {inner}
    </a>
  )
}
