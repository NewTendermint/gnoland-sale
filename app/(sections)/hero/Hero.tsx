import { navLinks } from "../../(layout)/nav.data"
import { DrawLine } from "../../(ui)/DrawLine"
import { Entrance } from "../../(ui)/Entrance"
import { ParallaxBox } from "../../(ui)/ParallaxBox"
import { Reveal } from "../../(ui)/Reveal"
import { Stagger } from "../../(ui)/Stagger"
import { GridOverlay } from "./GridOverlay"

/**
 * Hero. Desktop (>= lg): asymmetric composition on a 12-col grid - title cols 1-5
 * text-right starting high, portrait image cols 6-7 starting lower, subtext + nav
 * links cols 8-12 left-aligned and bottom-aligned with the image. Mobile (< lg): a
 * top-aligned stack - title, then the tagline, then a compact landscape poster; the
 * inline nav links are dropped (the header burger covers nav) and the column is NOT
 * vertically centred, so the oversized portrait can never push the title off-screen.
 * Colors come from semantic theme tokens so the section flips with the light/dark toggle.
 */
export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex items-start bg-background text-foreground lg:h-[calc(100vh-32px)] lg:items-center"
    >
      <div className="page-container w-full pt-24 pb-10 lg:py-0">
        <Entrance className="grid grid-cols-12 gap-6">
          <Reveal
            as="h1"
            immediate
            delayMs={200}
            type="words"
            className="col-span-12 text-left text-[clamp(2.5rem,calc((100vw_-_4rem)/4.5),9rem)] font-semibold leading-[0.92] tracking-[-0.04em] text-foreground lg:col-span-3 lg:col-start-2 lg:pt-[6vh] lg:text-right lg:text-[clamp(2.5rem,6vw,6.5rem)]"
          >
            GNOT
            <br />
            Public
            <br />
            Sale
          </Reveal>

          <div className="col-span-12 grid grid-cols-1 gap-6 lg:col-span-8 lg:col-start-5 lg:-mt-[6vh] lg:grid-cols-8">
            {/* Mobile: order-2 puts the poster BELOW the tagline; a compact 16:9
                landscape instead of the desktop 2:3 portrait so it never dominates
                the fold. Desktop restores the portrait + grid position. */}
            <div className="order-2 lg:order-none lg:col-span-4">
              {/* WebGL HeroScene temporarily removed - the empty ParallaxBox renders
                  the grey surface-alt placeholder. Re-add <HeroScene /> as the child
                  (and its import) to restore the voxel scene. */}
              <ParallaxBox className="aspect-[16/9] lg:aspect-[2/3]" immediate direction="up" />
            </div>

            <div className="order-1 flex flex-col justify-end gap-6 lg:order-none lg:col-span-3 lg:col-start-5">
              {/* Inline nav dropped on mobile (the header burger covers it); shown on
                  desktop as part of the asymmetric composition. */}
              <Stagger
                as="ul"
                immediate
                delayMs={450}
                className="hidden flex-col gap-2 text-xl text-muted lg:flex"
              >
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="link-underline inline-block transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </Stagger>
              <DrawLine immediate delayMs={200} className="hidden lg:block" />
              <Reveal
                as="p"
                immediate
                delayMs={650}
                className="max-w-md text-xl font-bold leading-snug text-foreground lg:text-2xl"
              >
                The native token of Gno.land, the next-generation smart contract platform powered by
                Gno.
              </Reveal>
            </div>
          </div>
        </Entrance>
      </div>

      <GridOverlay />
    </section>
  )
}
