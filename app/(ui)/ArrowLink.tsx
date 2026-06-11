import { CtaArrow } from "./CtaArrow"

/**
 * Per-surface colour variants (pick one instead of passing raw colours). The "pan"
 * hover (Codrops button--pan, via `.btn-pan`) slides a panel up to fill the pill and
 * the label colour swaps to read on it - so each variant sets its border, resting
 * fill/text, the panel colour (`before:bg-*`), and the hovered text (`hover:text-*`).
 * Colour-swap, not the demo's mix-blend-difference, so it's predictable on every
 * surface/theme. `ghost` = light surface; the `*-contrast` ones sit on a dark tile;
 * `solid-contrast` uses the mid-tone `border-faint` (a grey that reads on both the
 * fill and the surface, where a pure-b/w opposite-colour border would vanish).
 */
const VARIANTS = {
  ghost: "border border-border text-foreground before:bg-foreground hover:text-background",
  "ghost-contrast":
    "border border-on-contrast/25 text-on-contrast before:bg-on-contrast hover:text-surface-contrast",
  "solid-contrast":
    "border border-faint bg-on-contrast text-surface-contrast before:bg-surface-contrast hover:text-on-contrast",
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
  // Pan hover lives in the `.btn-pan` class (the ::before panel + its motion + the
  // label's z-index/colour transition); here we only declare the pill shape and the
  // colours it pans between - `before:bg-*` (panel) and `text-* hover:text-*` (label).
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
