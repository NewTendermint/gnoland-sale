import { CtaArrow } from "./CtaArrow"

/** Color variants, decoupled from callers: pick one per surface instead of passing
 * the full color string. `ghost` = light surface; `ghost-contrast` / `solid-contrast`
 * = on a dark contrast tile (outline vs inverted fill). */
const VARIANTS = {
  ghost: "border-border text-foreground hover:bg-foreground hover:text-background",
  "ghost-contrast":
    "border-on-contrast/25 text-on-contrast hover:bg-on-contrast hover:text-surface-contrast",
  "solid-contrast":
    "border-transparent bg-on-contrast text-surface-contrast hover:bg-on-contrast/90",
} as const

/** Pill sizes. `sm` is the default editorial CTA; `lg` matches the hero/pre-footer cluster. */
const SIZES = {
  sm: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-xs",
} as const

type ArrowLinkProps = {
  href?: string
  onClick?: () => void
  label: string
  external?: boolean
  /** Glyph override, decoupled from `external`: "diagonal" forces ↗, "slide" forces
   * the hover-sliding arrow. Defaults to "auto" (↗ when external, slide otherwise). */
  arrow?: "auto" | "diagonal" | "slide"
  /** Accessible name when the visible label is generic/repeated (e.g. several
   * "Explore" CTAs), so screen-reader users get the distinct target. */
  ariaLabel?: string
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
  /** Escape hatch for layout only (margins / width). Colors must come from `variant`. */
  className?: string
}

/** Ghost-pill CTA with a hover-sliding arrow. Renders an anchor for `href` navigation,
 * or a button when given an `onClick` action (e.g. opening the sticky bid bar).
 * `external` opens a new tab with a safe rel; `arrow` picks the glyph independently
 * of that. `variant` + `size` own the color and padding so call sites stay declarative. */
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
    "group inline-flex items-center gap-2 rounded-full border font-bold uppercase tracking-[0.2em] transition-colors"
  const cls = `${base} ${SIZES[size]} ${VARIANTS[variant]} ${className}`
  const diagonal = arrow === "diagonal" || (arrow === "auto" && external)
  const inner = (
    <>
      {label}
      {diagonal ? (
        <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
          ↗
        </span>
      ) : (
        <CtaArrow />
      )}
    </>
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
