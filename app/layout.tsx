import "./globals.css"
import type { ReactNode } from "react"
import { Footer } from "./(chrome)/Footer"
import { Header } from "./(chrome)/Header"

export const metadata = {
  title: "GNOT Public Token Sale - gno.land",
  description: "The native token for gno.land - Layer 1 smart contract platform.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
