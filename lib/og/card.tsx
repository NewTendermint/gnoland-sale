import "server-only"
// OG/Twitter social card SOURCE. Not shipped at runtime: baked once to public/og.jpg
// (the metadata references the static file). To re-bake after a copy/design change, hit a
// throwaway route that returns renderOgCardJpeg() and save it over public/og.jpg.
// Background = the crisp clean vault render; fonts = static Geist TTFs (Satori can't read woff2).
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import sharp from "sharp"

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_ALT = "GNOT Token Sale"

const CWD = process.cwd()
const TITLE = "GNOT Token Sale"
const DOMAIN = "sale.gno.land"
const toUri = (b: Buffer, m: string) => `data:${m};base64,${b.toString("base64")}`

export async function renderOgCardJpeg(): Promise<Uint8Array> {
  const [bg, wm, fontRegular, fontBold] = await Promise.all([
    readFile(join(CWD, "public/brand/og-bg-vault.jpg")),
    readFile(join(CWD, "public/brand/gno-wordmark-white.png")),
    readFile(join(CWD, "assets/fonts/Geist-Regular.ttf")),
    readFile(join(CWD, "assets/fonts/Geist-Bold.ttf")),
  ])
  const bgUri = toUri(bg, "image/jpeg")
  const wmUri = toUri(wm, "image/png")

  const png = await new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        fontFamily: "Geist",
      }}
    >
      <img
        src={bgUri}
        width={OG_SIZE.width}
        height={OG_SIZE.height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          objectFit: "cover",
        }}
        alt=""
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          display: "flex",
          backgroundImage:
            "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.12) 52%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      <div style={{ position: "absolute", top: 56, left: 60, display: "flex" }}>
        <img
          src={wmUri}
          width={248}
          height={59}
          style={{ width: 248, height: 59 }}
          alt="gno.land"
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 60,
          bottom: 60,
          display: "flex",
          fontSize: 72,
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.03,
        }}
      >
        {TITLE}
      </div>
      <div
        style={{
          position: "absolute",
          right: 56,
          bottom: 66,
          display: "flex",
          fontSize: 24,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        {DOMAIN}
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Geist", data: fontRegular, weight: 400, style: "normal" },
        { name: "Geist", data: fontBold, weight: 700, style: "normal" },
      ],
    },
  ).arrayBuffer()

  return new Uint8Array(
    await sharp(Buffer.from(png)).jpeg({ quality: 90, mozjpeg: true }).toBuffer(),
  )
}
