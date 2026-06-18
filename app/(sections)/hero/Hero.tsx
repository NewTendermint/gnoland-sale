import { heroNavLinks } from "../../(layout)/nav.data"
import { Entrance } from "../../(ui)/Entrance"
import { ParallaxBox } from "../../(ui)/ParallaxBox"
import { Reveal } from "../../(ui)/Reveal"
import { Stagger } from "../../(ui)/Stagger"
import { sceneVideos } from "../../../lib/scenes"
import { GridOverlay } from "./GridOverlay"

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[calc(100vh-32px)] flex-col items-center bg-background text-foreground"
    >
      {/* Fetch the hero scene poster (the largest first-paint asset) as early as possible.
          React 19 hoists this <link> into <head>, ahead of the deep <img> in the DOM. */}
      <link rel="preload" as="image" href={sceneVideos.hero.poster} fetchPriority="high" />

      <div className="page-container flex w-full flex-col items-center pt-28 lg:pt-[15vh]">
        <Entrance className="flex w-full flex-col items-center text-center">
          <Reveal
            as="h1"
            immediate
            delayMs={200}
            type="words"
            className="text-[clamp(2.75rem,8vw,6.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-foreground"
          >
            GNOT Public Sale
          </Reveal>

          <Reveal
            as="p"
            immediate
            delayMs={500}
            className="mt-6 max-w-4xl text-2xl font-bold leading-snug text-foreground lg:mt-8 lg:text-3xl"
          >
            The native token of Gno.land, the next-generation smart contract platform powered by
            Gno.
          </Reveal>

          <Stagger
            as="ul"
            immediate
            delayMs={700}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xl text-muted lg:mt-16"
          >
            {heroNavLinks.map((l) => (
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
        </Entrance>

        <div className="mt-10 w-full lg:mt-14">
          {/* Gate the scene slot against FOUC: hidden (opacity 0) on first paint until mount,
              so the grey slot bg never flashes before the clip-open reveal. */}
          <Entrance className="w-full">
            <ParallaxBox
              className="aspect-[2/1]"
              immediate
              delayMs={500}
              direction="up"
              strength={0}
              sceneVideo={sceneVideos.hero}
            />
          </Entrance>
        </div>
      </div>

      <GridOverlay />
    </section>
  )
}
