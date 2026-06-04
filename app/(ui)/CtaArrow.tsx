/** Forward arrow shared by every call-to-action: a horizontal stroke arrow that
 * slides on the parent's group-hover. Single source so all CTAs match the sticky
 * bid bar - place the trigger inside a `group` for the hover slide. */
export function CtaArrow({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`${className} transition-transform duration-300 group-hover:translate-x-1`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M2 6h8M7 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
