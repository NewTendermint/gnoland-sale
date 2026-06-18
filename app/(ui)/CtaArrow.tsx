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
