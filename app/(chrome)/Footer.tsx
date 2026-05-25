/**
 * Site footer with resource links, community channels, and risk disclaimers.
 */
export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-base py-16">
      <div className="relative mx-auto max-w-[1280px] px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <p className="mb-4 font-bold">gno.land</p>
            <p className="text-sm text-fg-muted">
              The native token for gno.land, a Layer 1 smart contract platform.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Resources</p>
            <ul className="space-y-2 text-sm text-fg-muted">
              <li>
                <a href="https://docs.gno.land">Documentation</a>
              </li>
              {/* Legal documents pending from counsel. Placeholder hrefs kept until URLs land. */}
              <li>
                {/* biome-ignore lint/a11y/useValidAnchor: legal page URL not yet provided */}
                <a href="#">Terms of Service</a>
              </li>
              <li>
                {/* biome-ignore lint/a11y/useValidAnchor: legal page URL not yet provided */}
                <a href="#">Privacy Policy</a>
              </li>
              <li>
                {/* biome-ignore lint/a11y/useValidAnchor: legal page URL not yet provided */}
                <a href="#">Risk Disclosure</a>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Community</p>
            <ul className="space-y-2 text-sm text-fg-muted">
              <li>
                <a href="https://x.com/_gnoland">X / Twitter</a>
              </li>
              <li>
                <a href="https://discord.gg/gnoland">Discord</a>
              </li>
              <li>
                <a href="https://t.me/join_gnoland">Telegram</a>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Disclaimer</p>
            <p className="text-xs text-fg-faint">
              Not available in restricted jurisdictions. High-risk investment. You may lose your
              entire commitment. Token transferability begins at mainnet launch (Q3 2026).
            </p>
          </div>
        </div>
        <p className="mt-12 text-center text-xs text-fg-faint">
          (c) 2026 gno.land. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
