import { privacyPolicyMarkdown } from "@/content/legal/privacy-policy"
import { Link } from "@/i18n/navigation"
import { languageAlternates, routing } from "@/i18n/routing"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { LegalMarkdown } from "../(ui)/LegalMarkdown"

type LocaleParams = { params: Promise<{ locale: string }> }

const LANGUAGES = languageAlternates("/privacy-policy")

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Metadata" })
  return {
    title: t("privacyTitle"),
    description: t("privacyDescription"),
    alternates: {
      canonical: locale === routing.defaultLocale ? "/privacy-policy" : `/${locale}/privacy-policy`,
      languages: LANGUAGES,
    },
  }
}

export default async function PrivacyPolicyPage({ params }: LocaleParams) {
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
          {t("privacyHeading")}
        </h1>
        <p className="mt-3 text-muted text-sm">{t("privacyDates")}</p>
        {locale !== routing.defaultLocale ? (
          <p className="mt-4 rounded-md bg-muted/10 p-3 text-muted text-sm">
            {t("authoritativeNotice")}
          </p>
        ) : null}
        <div className="mt-8">
          <LegalMarkdown>{privacyPolicyMarkdown}</LegalMarkdown>
        </div>
      </div>
    </main>
  )
}
