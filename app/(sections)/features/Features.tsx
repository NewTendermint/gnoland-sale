/**
 * Five-pillar technical pitch. Each card maps to a differentiator that
 * Gno.land sells against generic EVM L1s.
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
    <section id="features" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Why Gno.land</p>
        <h2 className="mb-4 text-3xl font-bold">Built for Developers, Designed for Eternity</h2>
        <p className="mb-12 max-w-2xl text-fg-muted">
          Gno.land fundamentally changes the programming paradigm for blockchain.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article key={f.title} className="rounded-sm border border-border p-6">
              <h3 className="mb-3 font-semibold">{f.title}</h3>
              <p className="text-sm text-fg-muted">{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
