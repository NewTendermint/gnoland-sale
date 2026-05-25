/**
 * Throwaway dev page. Lists every design token wired in styles/tokens.css
 * so we can eyeball what's already on the table before designing further.
 * Safe to delete in one shot: rm -r app/design-system.
 */

type Token = readonly [name: string, cssVar: string, value: string, twClass: string]

const bg: readonly Token[] = [
  ["bg-base", "--bg-base", "#0a0e2a", "bg-bg-base"],
  ["bg-elevated", "--bg-elevated", "#131734", "bg-bg-elevated"],
  ["bg-overlay", "--bg-overlay", "rgba(19,23,52,0.72)", "bg-bg-overlay"],
]

const fg: readonly Token[] = [
  ["fg-hi", "--fg-hi", "#ffffff", "text-fg-hi"],
  ["fg-body", "--fg-body", "rgba(255,255,255,0.85)", "text-fg-body"],
  ["fg-muted", "--fg-muted", "rgba(255,255,255,0.6)", "text-fg-muted"],
  ["fg-faint", "--fg-faint", "rgba(255,255,255,0.4)", "text-fg-faint"],
]

const accents: readonly Token[] = [
  ["mint", "--mint", "#8ec5b2", "text-mint"],
  ["mint-soft", "--mint-soft", "#a8d2c4", "text-mint-soft"],
  ["mint-glow", "--mint-glow", "rgba(142,197,178,0.25)", "bg-mint-glow"],
  ["amber", "--amber", "#f4b942", "text-amber"],
  ["amber-glow", "--amber-glow", "rgba(244,185,66,0.2)", "bg-amber-glow"],
  ["danger", "--danger", "#e8556a", "text-danger"],
  ["danger-glow", "--danger-glow", "rgba(232,85,106,0.2)", "bg-danger-glow"],
  ["info", "--info", "#8db4e8", "text-info"],
  ["info-glow", "--info-glow", "rgba(141,180,232,0.18)", "bg-info-glow"],
]

const borders: readonly Token[] = [
  ["border-subtle", "--border-subtle", "rgba(255,255,255,0.06)", "border-border-subtle"],
  ["border-default", "--border-default", "rgba(255,255,255,0.12)", "border-border-default"],
  ["border-strong", "--border-strong", "rgba(255,255,255,0.24)", "border-border-strong"],
]

const radii = [
  ["none", "0"],
  ["xs", "2px"],
  ["sm", "4px"],
  ["md", "8px"],
  ["full", "9999px"],
] as const

const typeScale = [
  ["text-6xl", "60px"],
  ["text-5xl", "48px"],
  ["text-4xl", "36px"],
  ["text-3xl", "30px"],
  ["text-2xl", "24px"],
  ["text-xl", "20px"],
  ["text-lg", "18px"],
  ["text-base", "16px"],
  ["text-sm", "14px"],
  ["text-xs", "12px"],
] as const

const weights = [
  ["font-light", 300],
  ["font-normal", 400],
  ["font-medium", 500],
  ["font-semibold", 600],
  ["font-bold", 700],
] as const

const motionDurations = [150, 300, 500, 800, 1500] as const

function Row({ token }: { token: Token }) {
  const [name, cssVar, value, tw] = token
  return (
    <li className="grid grid-cols-[2.5rem_1fr_1.5fr_1.5fr] items-center gap-4 border-b border-border-subtle py-2">
      <span
        className="size-10 rounded-sm border border-border-subtle"
        style={{ background: value }}
        aria-label={name}
      />
      <code className="font-mono text-sm text-fg-hi">{name}</code>
      <code className="font-mono text-xs text-fg-muted">{cssVar}</code>
      <code className="font-mono text-xs text-mint">{tw}</code>
    </li>
  )
}

export const metadata = { title: "Design system (dev)" }

export default function DesignSystemPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-16 px-6 py-16">
      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-fg-faint">
          /design-system (dev, throwaway)
        </p>
        <h1 className="text-4xl font-semibold text-fg-hi">Tokens, fonts and primitives</h1>
        <p className="text-fg-muted">
          Single-file inventory of what styles/tokens.css and next/font currently expose.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-sm">
          <a href="#colors" className="text-mint hover:underline">
            colors
          </a>
          <a href="#typography" className="text-mint hover:underline">
            typography
          </a>
          <a href="#radius" className="text-mint hover:underline">
            radius
          </a>
          <a href="#borders" className="text-mint hover:underline">
            borders
          </a>
          <a href="#motion" className="text-mint hover:underline">
            motion
          </a>
        </nav>
      </header>

      <section id="colors" className="space-y-8">
        <h2 className="text-2xl font-semibold text-fg-hi">Colors</h2>

        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wider text-fg-muted">Background layers</h3>
          <ul>
            {bg.map((t) => (
              <Row key={t[0]} token={t} />
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wider text-fg-muted">Foreground (text)</h3>
          <ul>
            {fg.map((t) => (
              <Row key={t[0]} token={t} />
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wider text-fg-muted">Accents & glows</h3>
          <ul>
            {accents.map((t) => (
              <Row key={t[0]} token={t} />
            ))}
          </ul>
        </div>
      </section>

      <section id="typography" className="space-y-10">
        <h2 className="text-2xl font-semibold text-fg-hi">Typography</h2>

        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-fg-muted">
            Geist (display) - scale
          </h3>
          <div className="space-y-1">
            {typeScale.map(([cls, px]) => (
              <div
                key={cls}
                className="flex items-baseline gap-6 border-b border-border-subtle py-2"
              >
                <span className="w-32 font-mono text-xs text-fg-faint">
                  {cls} / {px}
                </span>
                <span className={`${cls} text-fg-hi`}>GNOT public sale</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-fg-muted">Geist - weights</h3>
          <div className="space-y-1">
            {weights.map(([cls, w]) => (
              <div
                key={cls}
                className="flex items-baseline gap-6 border-b border-border-subtle py-2"
              >
                <span className="w-32 font-mono text-xs text-fg-faint">
                  {cls} / {w}
                </span>
                <span className={`text-2xl text-fg-hi ${cls}`}>GNOT public sale</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-fg-muted">Geist Mono</h3>
          <div className="space-y-2 rounded-sm border border-border-subtle bg-bg-elevated p-4">
            <p className="font-mono text-base text-fg-body">
              const clearing = await sonar.computeClearingPrice(bids)
            </p>
            <p className="font-mono text-sm text-fg-muted">0x8ec5b2 (mint)</p>
            <p className="font-mono text-xs tabular-nums text-fg-faint">
              $1,234,567.89 USDC committed
            </p>
          </div>
        </div>
      </section>

      <section id="radius" className="space-y-4">
        <h2 className="text-2xl font-semibold text-fg-hi">Radius</h2>
        <p className="text-sm text-fg-muted">Spec cap: 8px (rounded-md). Never exceed.</p>
        <div className="flex flex-wrap gap-6">
          {radii.map(([name, value]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div
                className="size-20 border border-border-default bg-bg-elevated"
                style={{ borderRadius: value }}
              />
              <code className="font-mono text-xs text-fg-muted">{name}</code>
              <code className="font-mono text-xs text-fg-faint">{value}</code>
            </div>
          ))}
        </div>
      </section>

      <section id="borders" className="space-y-4">
        <h2 className="text-2xl font-semibold text-fg-hi">Borders</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {borders.map(([name, cssVar, value]) => (
            <div
              key={name}
              className="rounded-sm border bg-bg-elevated p-6"
              style={{ borderColor: value }}
            >
              <code className="block font-mono text-xs text-fg-hi">{name}</code>
              <code className="block font-mono text-xs text-fg-muted">{cssVar}</code>
              <code className="block font-mono text-xs text-fg-faint">{value}</code>
            </div>
          ))}
        </div>
      </section>

      <section id="motion" className="space-y-4">
        <h2 className="text-2xl font-semibold text-fg-hi">Motion</h2>
        <p className="text-sm text-fg-muted">
          Hover each tile to play the corresponding duration with the default ease.
        </p>
        <div className="flex flex-wrap gap-6">
          {motionDurations.map((ms) => (
            <div key={ms} className="group flex flex-col items-center gap-2">
              <div className="relative h-20 w-32 overflow-hidden rounded-sm border border-border-default bg-bg-elevated">
                <div
                  className="absolute left-1 top-1 size-[72px] rounded-sm bg-mint transition-transform group-hover:translate-x-[48px]"
                  style={{
                    transitionDuration: `${ms}ms`,
                    transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)",
                  }}
                />
              </div>
              <code className="font-mono text-xs text-fg-muted">{ms}ms</code>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
