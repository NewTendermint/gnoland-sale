import { CtaArrow } from "./CtaArrow"

const VARIANTS = {
  ghost: "border border-border text-foreground before:bg-foreground hover:text-background",
  "ghost-contrast":
    "border border-on-contrast/25 text-on-contrast before:bg-on-contrast hover:text-surface-contrast",
  "solid-contrast":
    "border border-faint bg-on-contrast text-surface-contrast before:bg-surface-contrast hover:text-on-contrast",
} as const

const SIZES = {
  sm: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-xs",
} as const

type ArrowLinkProps = {
  href?: string
  onClick?: () => void
  label: string
  external?: boolean
  arrow?: "auto" | "diagonal" | "slide"
  ariaLabel?: string
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
  className?: string
}

export function ArrowLink({
  href,
  onClick,
  label,
  external = false,
  arrow = "auto",
  ariaLabel,
  variant = "ghost",
  size = "sm",
  className = "",
}: ArrowLinkProps) {
  const base =
    "btn-pan group inline-flex cursor-pointer items-center gap-2 rounded-full font-bold uppercase tracking-[0.2em]"
  const cls = `${base} ${SIZES[size]} ${VARIANTS[variant]} ${className}`
  const diagonal = arrow === "diagonal" || (arrow === "auto" && external)
  const inner = (
    <span className="inline-flex items-center gap-2">
      {label}
      {diagonal ? (
        <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
          ↗
        </span>
      ) : (
        <CtaArrow />
      )}
    </span>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={ariaLabel} className={cls}>
        {inner}
      </button>
    )
  }
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className={cls}
    >
      {inner}
    </a>
  )
}
