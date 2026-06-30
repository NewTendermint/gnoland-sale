import type { Metadata } from "next"
import Link from "next/link"
import { LegalMarkdown } from "../(ui)/LegalMarkdown"
import { termsOfServiceMarkdown } from "../../content/legal/terms-of-service"

export const metadata: Metadata = {
  title: "Terms of Service | Gno.land",
  description:
    "The terms governing access to and use of Gno.land services, including risk disclosures, for the GNOT public token sale.",
  alternates: { canonical: "/terms-of-service" },
}

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p className="mt-3 text-muted text-sm">Last updated June 29, 2026</p>
        <div className="mt-8">
          <LegalMarkdown>{termsOfServiceMarkdown}</LegalMarkdown>
        </div>
      </div>
    </main>
  )
}
