/**
 * Last-chance conversion block before the footer. Inverted button style
 * pulls attention back to the bid path after the long content scroll.
 */
export function PreFooterCta() {
  return (
    <section id="pre-footer-cta" className="border-b border-border py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -z-10 h-full bg-fg/5"
      />
      <div className="mx-auto max-w-[1280px] px-6 text-center">
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Public sale</p>
        <h2 className="mb-6 text-4xl font-bold md:text-5xl">Ready to join the sale?</h2>
        <p className="mx-auto mb-10 max-w-xl text-fg-muted">
          Connect your wallet, verify once with Sonar, and place your bid. The clearing price is the
          same for everyone.
        </p>
        <a href="#hero" className="inline-block rounded-sm bg-fg px-8 py-4 font-semibold text-bg">
          Place a bid
        </a>
      </div>
    </section>
  )
}
