/**
 * Last-chance CTA. Monumental headline + mint CTA + ghost secondary. No
 * card wrapper, sober.
 */
export function PreFooterCta() {
  return (
    <section
      id="pre-footer-cta"
      className="border-t border-border-subtle bg-bg-base py-24 lg:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-6 text-center lg:px-8">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-fg-muted">
          Public sale
        </p>
        <h2 className="mx-auto max-w-4xl text-4xl font-bold uppercase leading-[1.05] tracking-tight text-fg-hi md:text-5xl lg:text-7xl">
          Ready to join the sale?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-fg-muted md:text-xl">
          Connect your wallet, verify once with Sonar, and place your bid. The clearing price is the
          same for everyone.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#hero"
            className="inline-flex items-center rounded-sm bg-mint px-8 py-4 text-base font-semibold uppercase tracking-wider text-bg-base transition-colors hover:bg-mint-soft md:px-10 md:py-5 md:text-lg"
          >
            Place a bid
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center rounded-sm border border-border-strong bg-transparent px-8 py-4 text-base font-semibold uppercase tracking-wider text-fg-hi transition-colors hover:bg-bg-elevated md:px-10 md:py-5 md:text-lg"
          >
            How it works
          </a>
        </div>
      </div>
    </section>
  )
}
