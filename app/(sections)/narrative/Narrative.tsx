/**
 * Narrative. Default section on a 12-col grid (cols 2-11). Title spans
 * cols 2-11 top, prose paragraphs in cols 2-7 below (with the CTA link),
 * key stats in cols 9-11 right column. Colors flow from semantic theme
 * tokens so the section flips with the page theme.
 */
import { ArrowLink } from "../../(ui)/ArrowLink"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"

export function Narrative() {
  return (
    <Section id="narrative" gridClassName="mb-20 lg:mb-24">
      <div className="col-span-12 lg:col-span-6 lg:col-start-1">
        <div className="aspect-[4/5] w-full rounded-[var(--frame-radius)] bg-surface-alt" />
        <p className="mt-28 text-3xl leading-snug text-muted lg:text-4xl">
          Gno.land is a next-generation Layer 1 smart contract platform based on Gno, a
          deterministic, interpreted version of the Go programming language. Founded by Jae Kwon,
          co-founder of Cosmos and Tendermint, Gno.land represents a paradigm shift in multi-user
          programming. Our technology empowers developer communities to iteratively and
          interactively build a single shared program, enabling Gno.land to serve as the "GitHub" of
          the blockchain ecosystem.
        </p>
        <dl className="mt-12 grid grid-cols-3 gap-x-4 gap-y-6 lg:max-w-md">
          <div>
            <dd className="font-mono text-2xl font-bold tabular-nums text-foreground md:text-3xl lg:text-4xl">
              150+
            </dd>
            <dt className="mt-2 text-xs uppercase tracking-widest text-muted">Contributors</dt>
          </div>
          <div className="border-l border-border pl-4">
            <dd className="font-mono text-2xl font-bold tabular-nums text-foreground md:text-3xl lg:text-4xl">
              100+
            </dd>
            <dt className="mt-2 text-xs uppercase tracking-widest text-muted">Packages</dt>
          </div>
          <div className="border-l border-border pl-4">
            <dd className="font-mono text-2xl font-bold tabular-nums text-foreground md:text-3xl lg:text-4xl">
              5+
            </dd>
            <dt className="mt-2 text-xs uppercase tracking-widest text-muted">Years building</dt>
          </div>
        </dl>
      </div>
      <div className="col-span-12 lg:col-span-4 lg:col-start-8 lg:pt-32">
        <SectionHeading eyebrow="About" title="The Open Knowledge Base for the New Millennium" />
        <div className="mt-12 aspect-[4/5] w-full rounded-[var(--frame-radius)] bg-surface-alt" />
        <div aria-hidden="true" className="mt-80 h-px w-full bg-border" />
        <p className="mt-6 text-2xl text-muted">
          With its familiar language and intuitive building processes, Gno.land reduces barriers for
          millions of Go developers, making Web3 more accessible while supporting applications that
          anyone can trust and use. In addition to its developer-friendliness, Gno.land is built
          with decentralization and censorship-resistance at its core. Under the leadership of
          GovDAO, the main decentralized governing body, and adhering to its Constitution, Gno.land
          is positioned to be the decentralized global knowledge base for the new millennium.
        </p>
        <div className="mt-8">
          <ArrowLink
            href="https://docs.gno.land"
            label="Discover gno.land"
            className="text-sm text-foreground transition-colors hover:text-muted"
          />
        </div>
      </div>
    </Section>
  )
}
