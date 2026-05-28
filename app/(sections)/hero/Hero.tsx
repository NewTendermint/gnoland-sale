import { navLinks } from "../../(layout)/nav.data"
import { GridOverlay } from "./GridOverlay"

/**
 * Hero v2 (editorial). Asymmetric composition on a 12-col grid: title cols 1-5
 * text-right starting high, portrait image cols 6-7 starting lower, subtext +
 * CTAs cols 8-12 left-aligned and bottom-aligned with the image. Colors come
 * from semantic theme tokens so the section flips with the light/dark toggle.
 */
export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex h-[calc(100vh-32px)] items-center bg-background text-foreground"
    >
      <div className="mx-auto w-full max-w-[var(--max-width-container)] px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-6">
          <h1 className="col-span-12 text-left text-[clamp(2.5rem,6vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.04em] text-foreground lg:col-span-3 lg:col-start-2 lg:pt-[6vh] lg:text-right">
            GNOT
            <br />
            Public
            <br />
            Sale
          </h1>

          <div className="col-span-12 grid grid-cols-1 gap-6 lg:col-span-8 lg:col-start-5 lg:-mt-[6vh] lg:grid-cols-8">
            <div className="lg:col-span-4">
              <div className="aspect-[2/3] w-full rounded-[var(--frame-radius)] bg-surface-alt" />
            </div>

            <div className="flex flex-col justify-end gap-6 lg:col-span-3 lg:col-start-5">
              <ul className="flex flex-col gap-2 text-xl text-muted">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="transition-colors hover:text-foreground">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div aria-hidden="true" className="h-px w-full bg-border" />
              <p className="max-w-md text-xl leading-snug text-muted lg:text-2xl">
                The native token of gno.land. A Layer 1 by the makers of Cosmos and Tendermint.
              </p>
            </div>
          </div>
        </div>
      </div>

      <GridOverlay />
    </section>
  )
}
