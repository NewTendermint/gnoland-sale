/**
 * Five-pillar pitch. No cards: items live as text on the section bg with
 * generous spacing. Numbered eyebrow ("01") above each title.
 */
export function Features() {
  const features = [
    {
      title: "Gno Programming Language",
      body: "Gno is derived from Go, a language used by millions of developers worldwide to build advanced, multi-user systems. This foundation provides immediate access to a large developer community and their tools, accelerating adoption and lowering the learning curve.",
    },
    {
      title: "Deterministic, Source-level Execution",
      body: "Programs are easily readable by humans and behave identically across all networks. Such consistency guarantees every node produces the same results for trustless consensus, while keeping code easy to read, audit, and maintain.",
    },
    {
      title: "Native Persistent State",
      body: "Applications and objects persist by default and do not require external databases. Eliminating external databases removes the need for manual state management and external database complexity, making applications simpler and more reliable.",
    },
    {
      title: "Multi-User Concurrency",
      body: "Shared state, parallel execution, and long-lived processes are built in. These features allow for scalable, interactive, and continuously running applications that support simultaneous multi-user engagement.",
    },
    {
      title: "OS-like Composability",
      body: "Applications interoperate as processes instead of isolated contracts. This interoperability allows them to work together seamlessly, similar to programs in an operating system, enabling greater reusability and a richer ecosystem.",
    },
  ]
  return (
    <section id="features" className="bg-bg-base py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-20 flex max-w-3xl gap-6">
          <div aria-hidden="true" className="w-0.5 shrink-0 bg-fg-hi/40" />
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-fg-muted">
              Why gno.land
            </p>
            <h2 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight text-fg-hi md:text-5xl lg:text-6xl">
              Built for developers, designed for eternity
            </h2>
            <p className="mt-6 text-lg text-fg-muted md:text-xl">
              Gno.land fundamentally changes the programming paradigm for blockchain.
            </p>
          </div>
        </div>
        <ul className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <li key={f.title}>
              <p className="font-mono text-xs uppercase tracking-widest text-fg-faint">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-fg-hi md:text-2xl">
                {f.title}
              </h3>
              <p className="mt-4 text-base text-fg-body">{f.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
