import "./globals.css"
import localFont from "next/font/local"
import type { ReactNode } from "react"
import { Footer } from "./(layout)/Footer"
import { Header } from "./(layout)/Header"
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

// OG image asset pending (REQUIREMENTS B23); add `images` to openGraph + twitter when it lands.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sale.gno.land"
const TITLE = "GNOT Public Token Sale - Gno.land"
const DESCRIPTION = "The native token for Gno.land - Layer 1 smart contract platform."

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
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <noscript>
          <style>{"[data-entrance]{visibility:visible!important}"}</style>
        </noscript>
      </head>
      <body>
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
