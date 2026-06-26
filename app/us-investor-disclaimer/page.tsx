import type { Metadata } from "next"
import Link from "next/link"
import { usInvestorDisclaimer } from "../../content/sections/legal"

export const metadata: Metadata = {
  title: "U.S. Investor Disclaimer | Gno.land",
  description: "Regulation S notice and U.S. person restrictions for the GNOT public token sale.",
  alternates: { canonical: "/us-investor-disclaimer" },
}

export default function UsInvestorDisclaimerPage() {
  return (
    <main id="main" className="page-container py-24 lg:py-32">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="link-underline text-sm text-muted transition-colors hover:text-foreground"
        >
          Back to the sale
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {usInvestorDisclaimer.title}
        </h1>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-muted md:text-lg">
          {usInvestorDisclaimer.paragraphs.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>
      </div>
    </main>
  )
}
