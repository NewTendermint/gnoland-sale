import { Icon } from "../(ui)/Icon"

/**
 * BidPanel refactored to match the newtendermint.org keynumber bar:
 * hairline border-top, line-style icon + font-mono number on top row,
 * uppercase tracking label underneath. Vertical 1px dividers between
 * stats. CTA on the right as a solid button. Fixed at the bottom of the
 * .screen frame, content inset by 1 col on each side (cols 2-11 of the
 * 12-col grid). Colors come from semantic theme tokens; a full border keeps
 * the card distinct from the equally-tinted sections behind it in both themes.
 *
 * Placeholders: $0.12, 04d 12h, 1,247, $1.2M hardcoded; Layer 2 wires
 * live data from Sonar.
 */
export function BidPanel() {
  return (
    <aside
      aria-label="Live bid panel"
      data-component="bid-panel"
      className="fixed bottom-[var(--reveal-padding)] left-[var(--reveal-padding)] right-[var(--reveal-padding)] z-[var(--z-sticky)] rounded-[var(--frame-radius)] border border-border bg-background"
    >
      <div className="mx-auto max-w-[var(--max-width-container)] px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-10 lg:col-start-2">
            <div className="border-t border-border pb-6 pt-4 sm:pb-8 sm:pt-6">
              <div className="flex flex-wrap items-end justify-between gap-8">
                <div className="flex flex-wrap items-center gap-8 sm:gap-10">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon name="clearing" className="h-[18px] w-[18px]" />
                      <p className="font-mono text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">
                        $0.12
                      </p>
                    </div>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">
                      Clearing
                    </p>
                  </div>

                  <div aria-hidden="true" className="hidden h-8 w-px bg-border sm:block" />

                  <div>
                    <div className="flex items-center gap-2">
                      <Icon name="clock" className="h-[18px] w-[18px]" />
                      <p className="font-mono text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">
                        04d 12h
                      </p>
                    </div>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">
                      Closes
                    </p>
                  </div>

                  <div aria-hidden="true" className="hidden h-8 w-px bg-border sm:block" />

                  <div>
                    <div className="flex items-center gap-2">
                      <Icon name="users-group" className="h-[18px] w-[18px]" />
                      <p className="font-mono text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">
                        1,247
                      </p>
                    </div>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">
                      Bidders
                    </p>
                  </div>

                  <div aria-hidden="true" className="hidden h-8 w-px bg-border sm:block" />

                  <div>
                    <div className="flex items-center gap-2">
                      <Icon name="database" className="h-[18px] w-[18px]" />
                      <p className="font-mono text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">
                        $1.2M
                      </p>
                    </div>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">
                      Committed
                    </p>
                  </div>
                </div>

                <a
                  href="#bid"
                  className="group inline-flex items-center gap-2 rounded-full bg-surface-contrast px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-on-contrast transition-colors hover:bg-surface-contrast/80"
                >
                  <span>Place a bid</span>
                  <svg
                    viewBox="0 0 12 12"
                    className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M2 6h8M7 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
