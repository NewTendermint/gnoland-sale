import { stateOverridesEnabled } from "@/lib/sale/overrides"
import { setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

// Dev-only ad-creative gallery: reviews every exported banner (static PNG / animated GIF / MP4).
// Same gate as /dev/states -> local dev + staging branch-deploy only, 404 in production.
export const metadata = { title: "Ad creatives - dev", robots: { index: false, follow: false } }

type Kind = "png" | "gif" | "mp4"
type Variant = { kind: Kind; label: string; size: string }
type Banner = {
  file: string
  w: number
  h: number
  publisher: string
  name: string
  variants: Variant[]
}

const BANNERS: Banner[] = [
  {
    file: "01_coinbase_2400x436",
    w: 2400,
    h: 436,
    publisher: "Coinbase Wallet",
    name: "2400x436 Display Banner",
    variants: [
      { kind: "png", label: "PNG (static)", size: "735 KB" },
      { kind: "mp4", label: "MP4 (animated)", size: "376 KB" },
      { kind: "gif", label: "GIF (plays once)", size: "3.6 MB" },
    ],
  },
  {
    file: "02_bitget_750x500",
    w: 750,
    h: 500,
    publisher: "Bitget Wallet",
    name: "Spotlight Overlay",
    variants: [
      { kind: "png", label: "PNG (static)", size: "387 KB" },
      { kind: "mp4", label: "MP4 (animated)", size: "222 KB" },
      { kind: "gif", label: "GIF (plays once)", size: "1.7 MB" },
    ],
  },
  {
    file: "03_base_390x420",
    w: 390,
    h: 420,
    publisher: "The Base App (TBA)",
    name: "TBA Wallet Announcement V2",
    variants: [
      { kind: "png", label: "PNG (static)", size: "160 KB" },
      { kind: "mp4", label: "MP4 (animated)", size: "95 KB" },
      { kind: "gif", label: "GIF (plays once)", size: "671 KB" },
    ],
  },
  {
    file: "04_leaderboard_728x90",
    w: 728,
    h: 90,
    publisher: "KuCoin",
    name: "Banner 728x90",
    variants: [
      { kind: "png", label: "PNG (static)", size: "62 KB" },
      { kind: "mp4", label: "MP4 (animated)", size: "38 KB" },
      { kind: "gif", label: "GIF (plays once)", size: "217 KB" },
    ],
  },
  {
    file: "05_small_300x100",
    w: 300,
    h: 100,
    publisher: "KuCoin",
    name: "Banner 900x300",
    variants: [
      { kind: "png", label: "PNG (static)", size: "33 KB" },
      { kind: "mp4", label: "MP4 (animated)", size: "31 KB" },
      { kind: "gif", label: "GIF (plays once)", size: "114 KB" },
    ],
  },
  {
    file: "06_icon_48x48",
    w: 48,
    h: 48,
    publisher: "The Base App (TBA)",
    name: "TBA Wallet Announcement",
    variants: [{ kind: "png", label: "PNG (static)", size: "2 KB" }],
  },
]

function GallerySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border-t border-border pt-8">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-foreground">
        {title}
      </p>
      {children}
    </section>
  )
}

function Media({ b, v }: { b: Banner; v: Variant }) {
  const isVideo = v.kind === "mp4"
  const openHref = `/ads/${b.file}.${v.kind}`
  // Every slot is a plain <img> so it renders identically in every browser (no fragile <video>).
  // The MP4 slot shows its PNG poster with a play badge; "open" plays the real .mp4.
  const imgSrc = isVideo ? `/ads/${b.file}.png` : openHref
  return (
    <figure className="flex w-full flex-col gap-2" style={{ maxWidth: b.w }}>
      <div className="relative overflow-hidden rounded-md border border-border bg-surface-alt">
        <img
          className="block w-full"
          style={{ height: "auto", aspectRatio: `${b.w} / ${b.h}` }}
          width={b.w}
          height={b.h}
          src={imgSrc}
          alt={`${b.publisher} ${b.name}, ${v.label}`}
        />
        {isVideo && (
          <a
            href={openHref}
            target="_blank"
            rel="noreferrer"
            className="absolute inset-0 flex items-center justify-center"
            aria-label="Play MP4"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 pl-1 text-xl text-white backdrop-blur-sm">
              &#9654;
            </span>
          </a>
        )}
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium uppercase tracking-[0.2em] text-faint">
        {isVideo && (
          <span className="inline-flex items-center gap-1 rounded bg-foreground px-2 py-1 text-[11px] font-bold tracking-[0.15em] text-background">
            &#9654; Video (MP4)
          </span>
        )}
        <span className="text-muted">
          {b.w} &times; {b.h}
        </span>
        <span>{v.label}</span>
        <span>{v.size}</span>
        <a
          className="underline decoration-dotted underline-offset-2 hover:text-foreground"
          href={openHref}
          target="_blank"
          rel="noreferrer"
        >
          open
        </a>
      </figcaption>
    </figure>
  )
}

export default async function DevAdsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  if (!stateOverridesEnabled()) notFound()

  return (
    <main className="page-container py-10">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Dev harness</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Ad creatives - all formats
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Paid-placement banners in the OG voxel-vault style. Each format has a static PNG, an
          animated MP4, and an animated GIF. Animation plays once and rests on the open vault; the
          MP4 is set to loop here for review only. GIFs are non-looping in-file - macOS
          Finder/Preview force a loop, browsers play once.
        </p>
      </header>

      <div className="flex flex-col gap-14">
        {BANNERS.map((b) => (
          <GallerySection key={b.file} title={`${b.publisher} - ${b.name}`}>
            <div className="flex flex-col gap-8">
              {b.variants.map((v) => (
                <Media key={v.kind} b={b} v={v} />
              ))}
            </div>
          </GallerySection>
        ))}
      </div>
    </main>
  )
}
