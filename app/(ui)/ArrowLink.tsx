type ArrowLinkProps = {
  href: string
  label: string
  external?: boolean
  className?: string
}

/** Uppercase CTA link with a hover-sliding arrow. `external` opens a new tab with a safe rel and uses the diagonal glyph. */
export function ArrowLink({ href, label, external = false, className = "" }: ArrowLinkProps) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className={`group inline-flex items-baseline gap-2 font-bold uppercase tracking-[0.2em] ${className}`}
    >
      {label}
      <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
        {external ? "↗" : "→"}
      </span>
    </a>
  )
}
