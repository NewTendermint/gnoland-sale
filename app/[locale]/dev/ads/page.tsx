import { statSync } from "node:fs"
import { join } from "node:path"
import { stateOverridesEnabled } from "@/lib/sale/overrides"
import { setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

// Dev-only ad-creative gallery: reviews every exported banner (static PNG / animated GIF / MP4)
// across both campaign versions. Same gate as /dev/states -> local dev + staging only, 404 in prod.
export const metadata = { title: "Ad creatives - dev", robots: { index: false, follow: false } }

type Kind = "png" | "gif" | "mp4"
type Format = { file: string; w: number; h: number; publisher: string; name: string; kinds: Kind[] }
type Version = { dir: string; title: string; note: string }

const VERSIONS: Version[] = [
  {
    dir: "sale",
    title: "Sale version (live)",
    note: 'CTA "Place your bid" - use once the sale is open',
  },
  {
    dir: "presale",
    title: "Pre-sale version",
    note: 'CTA "Registration Open" - use before the sale',
  },
]

const FORMATS: Format[] = [
  {
    file: "01_coinbase_2400x436",
    w: 2400,
    h: 436,
    publisher: "Coinbase Wallet",
    name: "2400x436 Display Banner",
    kinds: ["png", "mp4", "gif"],
  },
  {
    file: "02_bitget_750x500",
    w: 750,
    h: 500,
    publisher: "Bitget Wallet",
    name: "Spotlight Overlay",
    kinds: ["png", "mp4", "gif"],
  },
  {
    file: "03_base_390x420",
    w: 390,
    h: 420,
    publisher: "The Base App (TBA)",
    name: "TBA Wallet Announcement V2",
    kinds: ["png", "mp4", "gif"],
  },
  {
    file: "04_leaderboard_728x90",
    w: 728,
    h: 90,
    publisher: "KuCoin",
    name: "Banner 728x90",
    kinds: ["png", "mp4", "gif"],
  },
  {
    file: "05_small_300x100",
    w: 300,
    h: 100,
    publisher: "KuCoin",
    name: "Banner 900x300",
    kinds: ["png", "mp4", "gif"],
  },
  {
    file: "06_icon_48x48",
    w: 48,
    h: 48,
    publisher: "The Base App (TBA)",
    name: "TBA Wallet Announcement",
    kinds: ["png"],
  },
]

const LABEL: Record<Kind, string> = {
  png: "PNG (static)",
  mp4: "MP4 (animated)",
  gif: "GIF (plays once)",
}

function fileSize(rel: string): string {
  try {
    return `${Math.round(statSync(join(process.cwd(), "public", rel)).size / 1024)} KB`
  } catch {
    return ""
  }
}

// Append the file mtime as a version so the browser always fetches the current asset
// (these creatives are regenerated often; a plain URL would serve a stale cached copy).
function assetHref(rel: string): string {
  try {
    return `/${rel}?v=${Math.round(statSync(join(process.cwd(), "public", rel)).mtimeMs)}`
  } catch {
    return `/${rel}`
  }
}

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

function Media({ dir, f, kind }: { dir: string; f: Format; kind: Kind }) {
  const isVideo = kind === "mp4"
  // Every slot is a plain <img> so it renders identically in every browser (no fragile <video>).
  // The MP4 slot shows its PNG poster with a play badge; "open" plays the real .mp4.
  const openHref = assetHref(`ads/${dir}/${f.file}.${kind}`)
  const imgSrc = assetHref(`ads/${dir}/${f.file}.${isVideo ? "png" : kind}`)
  const size = fileSize(`ads/${dir}/${f.file}.${kind}`)
  return (
    <figure className="flex w-full flex-col gap-2" style={{ maxWidth: f.w }}>
      <div
        className="relative w-full overflow-hidden rounded-md border border-border bg-surface-alt"
        style={{ paddingTop: `${((f.h / f.w) * 100).toFixed(4)}%` }}
      >
        <img
          className="absolute inset-0 block h-full w-full object-cover"
          width={f.w}
          height={f.h}
          src={imgSrc}
          alt={`${f.publisher} ${f.name}, ${LABEL[kind]}`}
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
          {f.w} &times; {f.h}
        </span>
        <span>{LABEL[kind]}</span>
        {size && <span>{size}</span>}
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
          Paid-placement banners in the OG voxel-vault style. Two campaign versions (sale /
          pre-sale). Each format has a static PNG, an animated MP4 (poster shown, press play to
          view), and an animated GIF that plays once and rests on the open vault. GIFs are
          non-looping in-file; macOS Finder/Preview force a loop, browsers play once.
        </p>
      </header>

      <div className="flex flex-col gap-20">
        {VERSIONS.map((v) => (
          <div key={v.dir} className="flex flex-col gap-8">
            <div className="rounded-md bg-surface-alt px-5 py-4">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{v.title}</h2>
              <p className="mt-0.5 text-sm text-muted">{v.note}</p>
            </div>
            <div className="flex flex-col gap-14">
              {FORMATS.map((f) => (
                <GallerySection key={f.file} title={`${f.publisher} - ${f.name}`}>
                  <div className="flex flex-col gap-8">
                    {f.kinds.map((kind) => (
                      <Media key={kind} dir={v.dir} f={f} kind={kind} />
                    ))}
                  </div>
                </GallerySection>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
