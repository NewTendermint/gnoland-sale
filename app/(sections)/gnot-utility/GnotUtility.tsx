import { Fragment } from "react"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { ParallaxBox } from "../../(ui)/ParallaxBox"
import { Reveal } from "../../(ui)/Reveal"
import { RevealGroup } from "../../(ui)/RevealGroup"
/**
 * GNOT utility. Spec-sheet / glossary layout: editorial lead at top,
 * then 7 entries as compact one-line rows with mono key on the left
 * and plain-text definition on the right, separated by hairlines.
 *   - First 4: operational uses (fees, storage, cross-chain, contracts)
 *   - Last 3: economic mechanisms (staking, governance, slashing)
 *
 * This section owns the full demand-side narrative of the token (what
 * GNOT does + how value accrues to holders). The Tokenomics section
 * above is supply-side only (allocation, vesting, treasury).
 *
 * Bodies for the 3 economic mechanisms are Lorem placeholders pending
 * team disclosure (B11 in docs/REQUIREMENTS_FROM_TEAMS.md).
 */
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { uses } from "../../../content/sections/gnot-utility"

export function GnotUtility() {
  return (
    <Section id="gnot-utility">
      <RevealGroup inline>
        <div className="col-span-12 lg:col-span-7 lg:col-start-1">
          <SectionHeading
            eyebrow="GNOT utility"
            title="The native utility token for all economic activity"
          />
        </div>

        <Reveal as="p" className="col-span-12 mb-16 text-3xl leading-snug text-muted lg:text-4xl">
          GNOT is the native gas token that makes the network usable. It pays the fees for every
          transaction and smart contract execution, and is locked as a refundable deposit to reserve
          on-chain storage. Demand for GNOT scales with demand for the network itself, tying the
          token to the activity it enables on Gno.land.
        </Reveal>
      </RevealGroup>

      <div className="col-span-12 lg:col-span-4 lg:col-start-4">
        <ParallaxBox className="aspect-[2/3]" strength={280} />
      </div>

      <dl className="col-span-12 mt-8 lg:col-span-5 lg:col-start-8 lg:mt-32">
        <DrawLine />
        {uses.map((u) => (
          <Fragment key={u.title}>
            <FadeIn as="div" className="grid grid-cols-12 gap-6 py-3 lg:grid-cols-5">
              <dt className="col-span-12 font-mono text-sm font-medium uppercase tracking-widest text-foreground lg:col-span-2">
                {u.title}
              </dt>
              <dd className="col-span-12 text-sm text-muted lg:col-span-3">{u.body}</dd>
            </FadeIn>
            <DrawLine />
          </Fragment>
        ))}
      </dl>
    </Section>
  )
}
