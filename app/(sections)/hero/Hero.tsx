import { BidPanel } from "../../(chrome)/BidPanel"

/**
 * Top-of-page hero. Left column holds the future WebGL voxel scene; right
 * column anchors the conversion path (badge + headline + live BidPanel).
 * The 60/40 split keeps the bid surface above the fold on standard desktops.
 */
export function Hero() {
  return (
    <section id="hero" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1440px] px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-12">
          <div
            aria-hidden="true"
            className="flex min-h-[420px] items-center justify-center rounded-sm bg-fg/5 lg:col-span-3"
          >
            <p className="text-sm text-fg-faint">[WebGL voxel scene, Layer 4]</p>
          </div>
          <div className="flex flex-col gap-6 lg:col-span-2">
            <p className="inline-flex w-fit items-center gap-2 rounded-sm border border-border px-3 py-1 text-xs uppercase tracking-wide text-fg-muted">
              <span className="size-2 rounded-full bg-fg" />
              GNOT Public Sale, live on Sonar
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">GNOT Public Sale</h1>
            <p className="text-lg text-fg-muted">
              The native token for gno.land, a next-generation Layer 1 smart contract platform based
              on Gno. Uniform Price Auction on Base mainnet.
            </p>
            <BidPanel />
          </div>
        </div>
      </div>
    </section>
  )
}
