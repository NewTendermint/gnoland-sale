import "../globals.css"
import { LOCALE_SWITCH_ENABLED, languageAlternates, routing } from "@/i18n/routing"
import { SALE_ECONOMICS, formatSaleDate } from "@/lib/sale/economics"
import type { Metadata } from "next"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import localFont from "next/font/local"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { Analytics } from "./(layout)/Analytics"
import { Footer } from "./(layout)/Footer"
import { Header } from "./(layout)/Header"
import { Loader } from "./(layout)/Loader"
import { LocaleSwitch } from "./(layout)/LocaleSwitch"
import { ThemeProvider } from "./(layout)/ThemeProvider"
import { Web3Provider } from "./(layout)/Web3Provider"

const geist = localFont({
  src: "../../public/fonts/Geist.woff2",
  variable: "--font-display-var",
  weight: "300 700",
  display: "swap",
})

const geistMono = localFont({
  src: "../../public/fonts/GeistMono.woff2",
  variable: "--font-mono-var",
  weight: "400 700",
  display: "swap",
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sale.gno.land"

// hreflang map, derived from the shipped locales (i18n/routing.ts): the default locale is served
// at "/" (as-needed prefix) and x-default points there for unmatched languages. A disabled locale
// is absent by construction, so nothing advertises a URL we do not serve.
const LANGUAGE_ALTERNATES = languageAlternates()
// OG locale tags, one per catalog; only the shipped ones are ever emitted (see below).
const OG_LOCALE: Record<string, string> = { en: "en_US", ko: "ko_KR" }

type LocaleParams = { params: Promise<{ locale: string }> }

// Statically render every shipped locale at build time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Metadata" })
  const title = t("title")
  const description = t("description", {
    date: formatSaleDate(SALE_ECONOMICS.saleOpensIso, true, locale),
  })
  const canonical = locale === routing.defaultLocale ? "/" : `/${locale}`

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical, languages: LANGUAGE_ALTERNATES },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: t("siteName"),
      type: "website",
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: [
        { url: "/og.jpg", width: 1200, height: 630, type: "image/jpeg", alt: t("ogImageAlt") },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "/og.jpg", alt: t("ogImageAlt") }],
    },
  }
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default async function RootLayout({
  children,
  params,
}: { children: ReactNode } & LocaleParams) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  // Enable static rendering for this locale.
  setRequestLocale(locale)

  const tMeta = await getTranslations({ locale, namespace: "Metadata" })
  const tA11y = await getTranslations({ locale, namespace: "A11y" })
  const title = tMeta("title")
  const description = tMeta("description", {
    date: formatSaleDate(SALE_ECONOMICS.saleOpensIso, true, locale),
  })

  // Structured data (Organization + WebSite). Rendered as a <script> text child, never via
  // dangerouslySetInnerHTML; values are clean (no HTML-special chars to escape). inLanguage
  // tracks the active locale.
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
        name: title,
        url: SITE_URL,
        description,
        inLanguage: locale,
        publisher: { "@id": `${SITE_URL}/#org` },
      },
    ],
  }

  return (
    <html
      lang={locale}
      translate="no"
      className={`${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
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
        <NextIntlClientProvider>
          <Loader />
          <ThemeProvider>
            <Web3Provider>
              <a href="#main" className="skip-link">
                {tA11y("skipToContent")}
              </a>
              <Header />
              {/* Sticky language switch: a circular button pinned top-right that opens a menu of
                  the other locales. Desktop only; mobile gets the switch inside the burger menu.
                  Dropped entirely (wrapper included) while a single locale ships. */}
              {LOCALE_SWITCH_ENABLED ? (
                <div className="locale-pill fixed right-[var(--reveal-padding)] top-[var(--reveal-padding)] z-[var(--z-header)] mr-6 mt-2 hidden lg:block">
                  <LocaleSwitch />
                </div>
              ) : null}
              <div className="screen">
                {children}
                <Footer />
              </div>
            </Web3Provider>
          </ThemeProvider>
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
