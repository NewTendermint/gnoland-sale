/**
 * Signature pixel-transition band. Renders as an OVERLAY on top of the voxel
 * background image: each cell decides whether to mask the image with bg-base
 * (opaque cell) or reveal the image through (transparent cell). At the top
 * of the voxel zone the band has dense bg-base coverage that thins out as
 * we descend; at the bottom of the voxel zone the `reverse` flip does the
 * opposite. This makes the voxel "appear" pixel-by-pixel through the mask,
 * mirroring the source inspiration image.
 *
 * Cells are kept square via `aspectRatio: "1 / 1"` inline (independent of any
 * grid auto-row behavior).
 *
 * Two noise layers + cosine easing + column wave keep the silhouette
 * organic, not banded.
 */

/**
 * Palette of navy/blue tints sampled from the voxel illustration character.
 * These are NOT pixel-perfect samples of the source image; they are picked
 * to feel analogous (mid navy, denim, slate). When Layer 4 brings the real
 * voxel render we can refine this palette or implement a canvas-based
 * sampling step at build time.
 */
const OPAQUE_SHADES = ["var(--bg-base)", "#080c25", "#0c1230", "#0e1535"]

const TINT_SHADES = [
  "#152340",
  "#1c2d54",
  "#243763",
  "#2d4374",
  "#1a3552",
  "#234168",
  "#2e527d",
  "#3a6892",
]

const presenceNoise = (r: number, c: number) => {
  const a = ((r * 73 + c * 17 + (r * c + 1) * 5) % 100) / 100
  const b = ((c * 41 + r * 29 + (r + c) * 11) % 100) / 100
  const d = ((r * 11 + c * 7 + (r * r + c * c) * 3) % 100) / 100
  return (a + b + d) / 3
}

const tintNoise = (r: number, c: number) => ((r * 19 + c * 47 + (r + c * c) * 7) % 100) / 100

const colorNoise = (r: number, c: number) => ((r * 17 + c * 53 + (r * c + 7) * 3) % 100) / 100

const tintColor = (r: number, c: number) => {
  const idx = Math.floor(colorNoise(r, c) * TINT_SHADES.length)
  return TINT_SHADES[Math.min(idx, TINT_SHADES.length - 1)]
}

const opaqueShade = (r: number, c: number) => {
  const n = ((r * 31 + c * 11 + (r + c) * 7) % 100) / 100
  const idx = Math.floor(n * OPAQUE_SHADES.length)
  return OPAQUE_SHADES[Math.min(idx, OPAQUE_SHADES.length - 1)]
}

/**
 * Per-column vertical shift on the effective row index. Two modes:
 *  - default (sinusoidal): organic small variation that breaks horizontal
 *    lines without changing the average row.
 *  - `concave: true`: parabolic arc that pushes the center columns DOWNWARD
 *    (more opaque rows extend further down) while the edges stay higher,
 *    creating an inverted-arc silhouette ("dip in the middle").
 */
const shiftFor = (c: number, cols: number, concave: boolean) => {
  if (concave) {
    const centerC = (cols - 1) / 2
    const dist = (c - centerC) / centerC
    const arc = 1 - dist * dist
    return -arc * 4.0 + (1 - arc) * 2.5
  }
  return (Math.sin(c * 0.62) + Math.cos(c * 0.41)) * 0.8
}

const opacityFor = (
  r: number,
  c: number,
  totalRows: number,
  cols: number,
  reverse: boolean,
  concave: boolean,
) => {
  const effectiveR = r + shiftFor(c, cols, concave)
  const t = Math.max(0, Math.min(1, effectiveR / Math.max(totalRows - 1, 1)))
  const base = reverse ? t : 1 - t
  const eased = 0.5 - 0.5 * Math.cos(base * Math.PI)
  return eased * 0.95
}

const tintFor = (r: number, c: number, totalRows: number, cols: number, concave: boolean) => {
  const effectiveR = r + shiftFor(c, cols, concave) * 0.5
  const t = Math.max(0, Math.min(1, effectiveR / Math.max(totalRows - 1, 1)))
  return Math.exp(-(((t - 0.5) * 2.5) ** 2)) * 0.85
}

export function PixelTransitionBand({
  cols = 32,
  rows = 8,
  reverse = false,
  concave = false,
}: { cols?: number; rows?: number; reverse?: boolean; concave?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none grid w-full"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => {
        const r = Math.floor(i / cols)
        const c = i % cols
        const opaque = presenceNoise(r, c) < opacityFor(r, c, rows, cols, reverse, concave)
        const tinted = !opaque && tintNoise(r, c) < tintFor(r, c, rows, cols, concave)
        const bg = opaque ? "var(--bg-base)" : tinted ? tintColor(r, c) : "transparent"
        return <div key={`${r}-${c}`} style={{ aspectRatio: "1 / 1", backgroundColor: bg }} />
      })}
    </div>
  )
}
