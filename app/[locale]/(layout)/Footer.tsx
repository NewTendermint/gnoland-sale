import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { DrawLine } from "../(ui)/DrawLine"
import { Stagger } from "../(ui)/Stagger"
import { ThemeToggle } from "./ThemeToggle"
import { communityLinks, externalLinks } from "./nav.data"

export async function Footer() {
  const t = await getTranslations("Footer")

  return (
    <footer className="bg-background pt-16 pb-48 text-foreground">
      <div className="page-container">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-6 lg:col-start-2">
            <p className="mb-4 text-xl font-semibold">Gno.land</p>
            <DrawLine />
            <div className="grid grid-cols-1 gap-6 pt-4 lg:grid-cols-6">
              <Stagger as="ul" className="space-y-2 text-lg text-muted lg:text-xl lg:col-span-2">
                <li>
                  <a
                    href="#token-details"
                    className="link-underline transition-colors hover:text-foreground"
                  >
                    {t("linkSale")}
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="link-underline transition-colors hover:text-foreground"
                  >
                    {t("linkHowItWorks")}
                  </a>
                </li>
                <li>
                  <a
                    href="#token-details"
                    className="link-underline transition-colors hover:text-foreground"
                  >
                    {t("linkToken")}
                  </a>
                </li>
                <li>
                  <a
                    href="#roadmap"
                    className="link-underline transition-colors hover:text-foreground"
                  >
                    {t("linkRoadmap")}
                  </a>
                </li>
              </Stagger>
              <Stagger
                as="ul"
                className="space-y-2 text-lg text-muted lg:text-xl lg:col-span-2 lg:col-start-5"
              >
                <li>
                  <Link
                    href="/terms-of-service"
                    className="link-underline transition-colors hover:text-foreground"
                  >
                    {t("linkTerms")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="link-underline transition-colors hover:text-foreground"
                  >
                    {t("linkPrivacy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service#risk-disclosures"
                    className="link-underline transition-colors hover:text-foreground"
                  >
                    {t("linkRiskDisclosure")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/us-investor-disclaimer"
                    className="link-underline transition-colors hover:text-foreground"
                  >
                    {t("linkUsDisclaimer")}
                  </Link>
                </li>
              </Stagger>
            </div>
          </div>

          <div className="col-span-6 sm:col-span-4 lg:col-span-2 lg:col-start-8">
            <p className="mb-4 text-xl font-semibold">{t("columnCommunity")}</p>
            <DrawLine />
            <Stagger as="ul" className="space-y-2 pt-4 text-lg text-muted lg:text-xl">
              {communityLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="link-underline transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </Stagger>
          </div>

          <div className="col-span-6 sm:col-span-4 lg:col-span-2 lg:col-start-10">
            <p className="mb-4 text-xl font-semibold">{t("columnLinks")}</p>
            <DrawLine />
            <Stagger as="ul" className="space-y-2 pt-4 text-lg text-muted lg:text-xl">
              {externalLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="link-underline transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </Stagger>
          </div>

          <div className="col-span-12 mt-16 flex flex-wrap items-center justify-between gap-4 lg:col-span-10 lg:col-start-2">
            <div className="flex flex-col leading-tight">
              <p className="text-xs text-muted">{t("disclaimer")}</p>
              <p className="text-xs text-muted">{t("copyright")}</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  )
}
