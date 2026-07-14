import { usInvestorDisclaimerMarkdown } from "@/content/legal/us-investor-disclaimer"
import { Link } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { LegalMarkdown } from "../(ui)/LegalMarkdown"

type LocaleParams = { params: Promise<{ locale: string }> }

const LANGUAGES = {
  en: "/us-investor-disclaimer",
  ko: "/ko/us-investor-disclaimer",
  "x-default": "/us-investor-disclaimer",
} as const

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Metadata" })
  return {
    title: t("disclaimerTitle"),
    description: t("disclaimerDescription"),
    alternates: {
      canonical:
        locale === routing.defaultLocale
          ? "/us-investor-disclaimer"
          : `/${locale}/us-investor-disclaimer`,
      languages: LANGUAGES,
    },
  }
}

export default async function UsInvestorDisclaimerPage({ params }: LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "Legal" })

  return (
    <main id="main" className="page-container py-24 lg:py-32">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="link-underline text-sm text-muted transition-colors hover:text-foreground"
        >
          {t("backToSale")}
        </Link>
        <h1 className="mt-6 font-semibold text-3xl text-foreground tracking-tight md:text-4xl">
          {t("disclaimerHeading")}
        </h1>
        {locale !== routing.defaultLocale ? (
          <p className="mt-4 rounded-md bg-muted/10 p-3 text-muted text-sm">
            {t("authoritativeNotice")}
          </p>
        ) : null}
        <div className="mt-8">
          <LegalMarkdown>{usInvestorDisclaimerMarkdown}</LegalMarkdown>
        </div>
      </div>
    </main>
  )
}
