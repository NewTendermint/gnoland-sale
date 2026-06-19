import "./globals.css"
import { SALE_ECONOMICS, formatSaleDate } from "@/lib/sale/economics"
import localFont from "next/font/local"
import type { ReactNode } from "react"
import { Footer } from "./(layout)/Footer"
import { Header } from "./(layout)/Header"
import { Loader } from "./(layout)/Loader"
import { ThemeProvider } from "./(layout)/ThemeProvider"
import { Web3Provider } from "./(layout)/Web3Provider"

const geist = localFont({
  src: "../public/fonts/Geist.woff2",
  variable: "--font-display-var",
  weight: "300 700",
  display: "swap",
})

const geistMono = localFont({
  src: "../public/fonts/GeistMono.woff2",
  variable: "--font-mono-var",
  weight: "400 700",
  display: "swap",
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sale.gno.land"
const TITLE = "GNOT Token Sale | Gno.land"
const DESCRIPTION = `GNOT is the native token of Gno.land, a transparent, composable smart contract platform by the makers of Cosmos and Tendermint. Join the public token sale starting ${formatSaleDate(SALE_ECONOMICS.saleOpensIso)}.`

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "GNOT Public Token Sale",
    type: "website",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "GNOT Public Token Sale",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og.jpg", alt: "GNOT Public Token Sale" }],
  },
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

// Structured data (Organization + WebSite). Rendered as a <script> text child, never via
// dangerouslySetInnerHTML; values are clean (no HTML-special chars to escape).
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "NewTendermint",
      url: "https://newtendermint.org",
      subOrganization: { "@id": `${SITE_URL}/#product` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#product`,
      name: "gno.land",
      url: "https://gno.land",
      logo: `${SITE_URL}/icon-512x512.png`,
      parentOrganization: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: TITLE,
      url: SITE_URL,
      description: DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#org` },
    },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <noscript>
          <style>
            {
              "[data-entrance]{visibility:visible!important}.loader-cover{display:none!important}body{padding:var(--reveal-padding)!important}.screen{height:calc(100vh - var(--reveal-padding) * 2)!important}"
            }
          </style>
        </noscript>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </head>
      <body>
        <Loader />
        <ThemeProvider>
          <Web3Provider>
            <a href="#main" className="skip-link">
              Skip to content
            </a>
            <Header />
            <div className="screen">
              {children}
              <Footer />
            </div>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
