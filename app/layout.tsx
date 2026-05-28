import "./globals.css"
import localFont from "next/font/local"
import type { ReactNode } from "react"
import { Footer } from "./(layout)/Footer"
import { Header } from "./(layout)/Header"
import { ThemeProvider } from "./(layout)/ThemeProvider"

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

export const metadata = {
  title: "GNOT Public Token Sale - gno.land",
  description: "The native token for gno.land - Layer 1 smart contract platform.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Header />
          <div className="screen">
            {children}
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
