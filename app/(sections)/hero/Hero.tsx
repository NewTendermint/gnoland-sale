import { navLinks } from "../../(layout)/nav.data"
import { DrawLine } from "../../(ui)/DrawLine"
import { Entrance } from "../../(ui)/Entrance"
import { ParallaxBox } from "../../(ui)/ParallaxBox"
import { Reveal } from "../../(ui)/Reveal"
import { Stagger } from "../../(ui)/Stagger"
import { GridOverlay } from "./GridOverlay"

/**
 * Hero. Asymmetric composition on a 12-col grid: title cols 1-5 text-right starting
 * high, portrait image cols 6-7 starting lower, subtext + nav links cols 8-12
 * left-aligned and bottom-aligned with the image. Colors come from semantic theme
 * tokens so the section flips with the light/dark toggle.
 */
export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex h-[calc(100vh-32px)] items-center bg-background text-foreground"
    >
      <div className="mx-auto w-full max-w-[var(--max-width-container)] px-6 lg:px-8">
        <Entrance className="grid grid-cols-12 gap-6">
          <Reveal
            as="h1"
            immediate
            delayMs={200}
            type="words"
            className="col-span-12 text-left text-[clamp(2.5rem,6vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.04em] text-foreground lg:col-span-3 lg:col-start-2 lg:pt-[6vh] lg:text-right"
          >
            GNOT
            <br />
            Public
            <br />
            Sale
          </Reveal>

          <div className="col-span-12 grid grid-cols-1 gap-6 lg:col-span-8 lg:col-start-5 lg:-mt-[6vh] lg:grid-cols-8">
            <div className="lg:col-span-4">
              {/* WebGL HeroScene temporarily removed - the empty ParallaxBox renders
                  the grey surface-alt placeholder. Re-add <HeroScene /> as the child
                  (and its import) to restore the voxel scene. */}
              <ParallaxBox className="aspect-[2/3]" immediate direction="up" />
            </div>

            <div className="flex flex-col justify-end gap-6 lg:col-span-3 lg:col-start-5">
              <Stagger
                as="ul"
                immediate
                delayMs={450}
                className="flex flex-col gap-2 text-xl text-muted"
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
              <DrawLine immediate delayMs={200} />
              <Reveal
                as="p"
                immediate
                delayMs={650}
                className="max-w-md text-xl font-bold leading-snug text-foreground lg:text-2xl"
              >
                The native token of gno.land. A Layer 1 by the makers of Cosmos and Tendermint.
              </Reveal>
            </div>
          </div>
        </Entrance>
      </div>

      <GridOverlay />
    </section>
  )
}
