import { CtaArrow } from "./CtaArrow"

type ArrowLinkProps = {
  href?: string
  onClick?: () => void
  label: string
  external?: boolean
  className?: string
}

/** Uppercase CTA with a hover-sliding arrow. Renders an anchor for `href` navigation,
 * or a button when given an `onClick` action (e.g. opening the sticky bid bar).
 * `external` opens a new tab with a safe rel and uses the diagonal glyph. */
export function ArrowLink({
  href,
  onClick,
  label,
  external = false,
  className = "",
}: ArrowLinkProps) {
  const cls = `group inline-flex items-center gap-2 font-bold uppercase tracking-[0.2em] ${className}`
  const inner = (
    <>
      {label}
      {external ? (
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
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    )
  }
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className={cls}
    >
      {inner}
    </a>
  )
}
