"use client"

// Round cross button shared by the bid panel header and the post-bid opt-in views.
export function CloseButton({
  onClick,
  label = "Close",
  className = "",
}: {
  onClick: () => void
  label?: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-muted transition-colors duration-300 hover:border-surface-contrast hover:bg-surface-contrast hover:text-on-contrast ${className}`}
    >
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
      </svg>
    </button>
  )
}
