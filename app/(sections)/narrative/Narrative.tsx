/**
 * Long-form positioning block. Two columns at lg: prose on the left,
 * supporting illustration placeholder on the right.
 */
export function Narrative() {
  return (
    <section id="narrative" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">About gno.land</p>
        <h2 className="mb-12 text-3xl font-bold">The Open Knowledge Base for the New Millennium</h2>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-4 text-fg-muted">
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
          </div>
          <div
            aria-hidden="true"
            className="flex min-h-[320px] items-center justify-center rounded-sm bg-fg/5"
          >
            <p className="text-sm text-fg-faint">[Illustration, Layer 4]</p>
          </div>
        </div>
      </div>
    </section>
  )
}
