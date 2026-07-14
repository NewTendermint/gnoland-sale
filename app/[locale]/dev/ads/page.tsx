import { statSync } from "node:fs"
import { join } from "node:path"
import { stateOverridesEnabled } from "@/lib/sale/overrides"
import { setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

// Dev-only ad-creative gallery: reviews every exported static banner (JPG; icon PNG) across
// both campaign versions. Same gate as /dev/states -> local dev + staging only, 404 in prod.
export const metadata = { title: "Ad creatives - dev", robots: { index: false, follow: false } }

type Format = {
  file: string
  w: number
  h: number
  ext: "jpg" | "png"
  publisher: string
  name: string
}
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
    ext: "jpg",
    publisher: "Coinbase Wallet",
    name: "2400x436 Display Banner",
  },
  {
    file: "02_bitget_750x500",
    w: 750,
    h: 500,
    ext: "jpg",
    publisher: "Bitget Wallet",
    name: "Spotlight Overlay",
  },
  {
    file: "03_base_390x420",
    w: 390,
    h: 420,
    ext: "jpg",
    publisher: "The Base App (TBA)",
    name: "TBA Wallet Announcement V2",
  },
  {
    file: "04_leaderboard_728x90",
    w: 728,
    h: 90,
    ext: "jpg",
    publisher: "KuCoin",
    name: "Banner 728x90",
  },
  {
    file: "05_small_300x100",
    w: 300,
    h: 100,
    ext: "jpg",
    publisher: "KuCoin",
    name: "Banner 900x300",
  },
  {
    file: "06_icon_48x48",
    w: 48,
    h: 48,
    ext: "png",
    publisher: "The Base App (TBA)",
    name: "TBA Wallet Announcement",
  },
]

function fileSize(rel: string): string {
  try {
    return `${Math.round(statSync(join(process.cwd(), "public", rel)).size / 1024)} KB`
  } catch {
    return ""
  }
}

// Append the file mtime so the browser always fetches the current asset (creatives are
// regenerated often; a plain URL would serve a stale cached copy).
function assetHref(rel: string): string {
  try {
    return `/${rel}?v=${Math.round(statSync(join(process.cwd(), "public", rel)).mtimeMs)}`
  } catch {
    return `/${rel}`
  }
}

function GallerySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-foreground">
        {title}
      </p>
      {children}
    </section>
  )
}

function Banner({ dir, f }: { dir: string; f: Format }) {
  const rel = `ads/${dir}/${f.file}.${f.ext}`
  const href = assetHref(rel)
  const size = fileSize(rel)
  return (
    <figure className="flex w-full flex-col gap-2" style={{ maxWidth: f.w }}>
      <img
        className="block rounded-md border border-border bg-surface-alt"
        style={{ maxWidth: "100%", height: "auto" }}
        width={f.w}
        height={f.h}
        src={href}
        alt={`${f.publisher} ${f.name}`}
      />
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium uppercase tracking-[0.2em] text-faint">
        <span className="text-muted">
          {f.w} &times; {f.h}
        </span>
        <span>{f.ext.toUpperCase()}</span>
        {size && <span>{size}</span>}
        <a
          className="underline decoration-dotted underline-offset-2 hover:text-foreground"
          href={href}
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
          Static paid-placement banners in the OG voxel-vault style, in two campaign versions (sale
          / pre-sale).
        </p>
      </header>

      <div className="flex flex-col gap-20">
        {VERSIONS.map((v) => (
          <div key={v.dir} className="flex flex-col gap-8">
            <div className="rounded-md bg-surface-alt px-5 py-4">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{v.title}</h2>
              <p className="mt-0.5 text-sm text-muted">{v.note}</p>
            </div>
            <div className="flex flex-col gap-12">
              {FORMATS.map((f) => (
                <GallerySection key={f.file} title={`${f.publisher} - ${f.name}`}>
                  <Banner dir={v.dir} f={f} />
                </GallerySection>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
