/**
 * Narrative. No card: title + 2 prose paragraphs + stats inline as text on
 * the section bg. Mint CTA at the bottom.
 */
export function Narrative() {
  return (
    <section id="narrative" className="bg-bg-base py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <h2 className="mb-16 max-w-4xl text-4xl font-bold uppercase leading-[1.05] tracking-tight text-fg-hi md:text-5xl lg:text-6xl">
          The Open Knowledge Base
          <br />
          for the New Millennium
        </h2>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-5 text-base text-fg-body lg:col-span-7 lg:text-lg">
            <p>
              Gno.land is a next-generation Layer 1 smart contract platform based on Gno, a
              deterministic, interpreted version of the Go programming language. Founded by Jae
              Kwon, co-founder of Cosmos and Tendermint, Gno.land represents a paradigm shift in
              multi-user programming. Our technology empowers developer communities to iteratively
              and interactively build a single shared program, enabling Gno.land to serve as the
              "GitHub" of the blockchain ecosystem.
            </p>
            <p>
              With its familiar language and intuitive building processes, Gno.land reduces barriers
              for millions of Go developers, making Web3 more accessible while supporting
              applications that anyone can trust and use. In addition to its developer-friendliness,
              Gno.land is built with decentralization and censorship-resistance at its core. Under
              the leadership of GovDAO, the main decentralized governing body, and adhering to its
              Constitution, Gno.land is positioned to be the decentralized global knowledge base for
              the new millennium.
            </p>

            <div className="pt-6">
              <a
                href="https://docs.gno.land"
                className="inline-flex items-center gap-2 rounded-sm bg-mint px-5 py-3 text-sm font-semibold uppercase tracking-wider text-bg-base transition-colors hover:bg-mint-soft"
              >
                Discover gno.land
              </a>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-x-4 gap-y-6 lg:col-span-5">
            <div className="border-t border-border-subtle pt-4">
              <dd className="font-mono text-3xl font-bold tabular-nums text-fg-hi md:text-4xl">
                5+
              </dd>
              <dt className="mt-2 text-xs uppercase tracking-widest text-fg-muted">Years</dt>
            </div>
            <div className="border-t border-border-subtle pt-4">
              <dd className="font-mono text-3xl font-bold tabular-nums text-fg-hi md:text-4xl">
                150+
              </dd>
              <dt className="mt-2 text-xs uppercase tracking-widest text-fg-muted">Contributors</dt>
            </div>
            <div className="border-t border-border-subtle pt-4">
              <dd className="font-mono text-3xl font-bold tabular-nums text-fg-hi md:text-4xl">
                100+
              </dd>
              <dt className="mt-2 text-xs uppercase tracking-widest text-fg-muted">Packages</dt>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
