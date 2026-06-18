import { DrawLine } from "../(ui)/DrawLine"
import { Stagger } from "../(ui)/Stagger"
import { ThemeToggle } from "./ThemeToggle"
import { communityLinks, externalLinks } from "./nav.data"

export function Footer() {
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
                    Sale
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="link-underline transition-colors hover:text-foreground"
                  >
                    How it works
                  </a>
                </li>
                <li>
                  <a
                    href="#token-details"
                    className="link-underline transition-colors hover:text-foreground"
                  >
                    Token
                  </a>
                </li>
                <li>
                  <a
                    href="#roadmap"
                    className="link-underline transition-colors hover:text-foreground"
                  >
                    Roadmap
                  </a>
                </li>
              </Stagger>
              <Stagger
                as="ul"
                className="space-y-2 text-lg text-muted lg:text-xl lg:col-span-2 lg:col-start-5"
              >
                <li>
                  <a
                    href="https://docs.gno.land"
                    className="link-underline transition-colors hover:text-foreground"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  {/* biome-ignore lint/a11y/useValidAnchor: legal page URL not yet provided */}
                  <a href="#" className="link-underline transition-colors hover:text-foreground">
                    Terms of Service
                  </a>
                </li>
                <li>
                  {/* biome-ignore lint/a11y/useValidAnchor: legal page URL not yet provided */}
                  <a href="#" className="link-underline transition-colors hover:text-foreground">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  {/* biome-ignore lint/a11y/useValidAnchor: legal page URL not yet provided */}
                  <a href="#" className="link-underline transition-colors hover:text-foreground">
                    Risk Disclosure
                  </a>
                </li>
              </Stagger>
            </div>
          </div>

          <div className="col-span-6 sm:col-span-4 lg:col-span-2 lg:col-start-8">
            <p className="mb-4 text-xl font-semibold">Community</p>
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
            <p className="mb-4 text-xl font-semibold">External</p>
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
              <p className="text-xs text-muted">
                Not available in restricted jurisdictions. High-risk investment. You may lose your
                entire commitment. Token transferability begins at mainnet launch (Q3 2026).
              </p>
              <p className="text-xs text-muted">(c) 2026 Gno.land. All rights reserved.</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  )
}
