/**
 * How to Participate. 4 steps as plain text on section bg, with numbered
 * eyebrow above each title.
 */
export function HowItWorks() {
  const steps = [
    {
      title: "Registration",
      body: "Complete identity verification with Sonar.",
    },
    {
      title: "Commitment",
      body: "Connect your wallet and submit your bid.",
    },
    {
      title: "Settlement",
      body: "Pro-rate results are finalized once the auction is over.",
    },
    {
      title: "Distribution",
      body: "Tokens are distributed to your address. Token lockup is applied according to schedule.",
    },
  ]
  return (
    <section id="how-it-works" className="bg-bg-base py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-20 max-w-3xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-fg-muted">
            How it works
          </p>
          <h2 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight text-fg-hi md:text-5xl lg:text-6xl">
            How to participate
          </h2>
        </div>
        <ol className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title}>
              <p className="font-mono text-xs uppercase tracking-widest text-fg-faint">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-fg-hi md:text-2xl">
                {s.title}
              </h3>
              <p className="mt-4 text-base text-fg-body">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
