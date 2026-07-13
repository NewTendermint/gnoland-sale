// Theme-aware gno.land logo lockup, swapped by the `.dark` class in pure CSS.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <>
      {/* ?v busts the cache when the asset is re-exported */}
      <img
        src="/gnoland-logo-light.svg?v=3"
        alt=""
        width={600}
        height={143}
        className={`${className} dark:hidden`}
      />
      <img
        src="/gnoland-logo-dark.svg?v=3"
        alt=""
        width={600}
        height={143}
        className={`hidden dark:block ${className}`}
      />
    </>
  )
}
