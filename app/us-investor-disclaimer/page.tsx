import type { Metadata } from "next"
import Link from "next/link"
import { LegalMarkdown } from "../(ui)/LegalMarkdown"
import { usInvestorDisclaimerMarkdown } from "../../content/legal/us-investor-disclaimer"

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
        <h1 className="mt-6 font-semibold text-3xl text-foreground tracking-tight md:text-4xl">
          U.S. Investor Disclaimer
        </h1>
        <div className="mt-8">
          <LegalMarkdown>{usInvestorDisclaimerMarkdown}</LegalMarkdown>
        </div>
      </div>
    </main>
  )
}
