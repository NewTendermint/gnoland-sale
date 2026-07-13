"use client"

import { useEffect, useState } from "react"

const COLUMNS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10", "c11", "c12"] as const

// Debug 12-column grid overlay, toggled via the `?grid` URL query.
export function GridOverlay() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(new URLSearchParams(window.location.search).has("grid"))
  }, [])

  if (!show) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <div className="mx-auto h-full max-w-[1400px] px-6 lg:px-8">
        <div className="grid h-full grid-cols-12 gap-6">
          {COLUMNS.map((col) => (
            <div
              key={col}
              className="h-full bg-pink-500/[0.06] outline outline-1 outline-pink-500/30"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
