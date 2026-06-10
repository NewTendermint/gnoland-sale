"use client"

import { type ReactNode, type Ref, useEffect, useRef } from "react"

/**
 * Anti-FOUC gate for a coordinated page-load entrance. Renders its subtree
 * `data-entrance="pending"` (CSS: visibility hidden) so it is hidden from the
 * very first paint - server-rendered, so there is no flash before hydration.
 * The removal runs in an effect; React fires child effects before parent ones,
 * so every descendant `immediate` animation has already committed its hidden
 * start-state by the time the gate lifts. Revealing it therefore exposes the
 * cascade at frame 0, not the fully-laid-out page. `as` lets this BE the layout
 * element (carry its className) instead of adding a wrapper box that would break
 * grid/flex layout. Without JS the gate stays - a <noscript> rule in the root
 * layout un-hides it so crawlers and no-JS clients still see the content.
 */
export function Entrance({
  as = "div",
  className = "",
  children,
}: {
  as?: "div" | "section"
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    ref.current?.removeAttribute("data-entrance")
  }, [])
  const Tag = as as "div"
  return (
    <Tag ref={ref as Ref<HTMLDivElement>} data-entrance="pending" className={className}>
      {children}
    </Tag>
  )
}
