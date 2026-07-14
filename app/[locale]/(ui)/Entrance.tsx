"use client"

import { type ReactNode, type Ref, useEffect, useRef } from "react"

// Anti-FOUC gate for a coordinated page-load entrance. A <noscript> rule in the root layout un-hides it without JS.
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
