import type { Metadata } from "next"
import Link from "next/link"
import { LegalMarkdown } from "../(ui)/LegalMarkdown"
import { privacyPolicyMarkdown } from "../../content/legal/privacy-policy"

export const metadata: Metadata = {
  title: "Privacy Policy | Gno.land",
  description:
    "How NewTendermint collects, uses, and discloses personal information for the GNOT public token sale.",
  alternates: { canonical: "/privacy-policy" },
}

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-3 text-muted text-sm">
          Effective June 29, 2024 · Last updated June 29, 2026
        </p>
        <div className="mt-8">
          <LegalMarkdown>{privacyPolicyMarkdown}</LegalMarkdown>
        </div>
      </div>
    </main>
  )
}
