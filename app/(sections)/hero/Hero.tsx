import { PixelTransitionBand } from "./PixelTransitionBand"
import { VoxelScenePlaceholder } from "./VoxelScenePlaceholder"

/**
 * Hero composition: title block sits at ~1/3 of the viewport (pt-12vh).
 * Voxel scene + pixel-transition bands sit below with a margin gap, so the
 * voxel does not start at the top of the section but lower in the page.
 *
 * Placeholders: countdown is static "04d 12h" (Layer 2 wires the live
 * timer); voxel scene is a stand-in image (Layer 4 swaps in the real
 * render). The sticky BidPanel tile is rendered separately at page level.
 */
export function Hero() {
  return (
    <section id="hero" className="relative">
      <div className="relative z-30 pt-[12vh]">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="flex flex-col items-center gap-6 text-center">
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-fg-hi sm:text-6xl md:text-7xl lg:text-9xl">
              GNOT Public Sale
            </h1>
            <p className="max-w-3xl text-xl text-fg-muted md:text-2xl lg:text-4xl">
              The native token of gno.land,
              <br className="hidden sm:inline" />
              <span className="sm:hidden"> </span>a multi-user OS written in Go.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className="inline-flex items-center rounded-sm bg-mint px-8 py-4 text-base font-semibold uppercase tracking-wider text-bg-base transition-colors hover:bg-mint-soft md:px-10 md:py-5 md:text-lg"
              >
                Place a bid
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center rounded-sm border border-border-strong bg-transparent px-8 py-4 text-base font-semibold uppercase tracking-wider text-fg-hi transition-colors hover:bg-bg-base/40 md:px-10 md:py-5 md:text-lg"
              >
                How it works
              </a>
            </div>
            <img
              src="/gnocoin.png"
              alt=""
              aria-hidden="true"
              className="relative z-30 mt-22 h-64 w-auto md:h-96 lg:h-[32rem]"
            />
          </div>
        </div>
      </div>

      <div className="relative -mt-[70vh]">
        <VoxelScenePlaceholder />

        <div className="pointer-events-none absolute inset-x-0 top-0">
          <PixelTransitionBand rows={8} concave />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <PixelTransitionBand rows={3} reverse />
        </div>
      </div>
    </section>
  )
}
