/**
 * Content data for the Features section.
 *
 * `content/sections.md` is the human source of truth for marketing/legal
 * copy. This module mirrors that copy for the build (dev-facing). `icon` keys
 * into the shared Icon registry (app/(ui)/Icon.tsx) and is presentational.
 */

export const features = [
  {
    icon: "terminal",
    title: "Gno Programming Language",
    body: "Gno is derived from Go, a language used by millions of developers worldwide to build advanced, multi-user systems. This foundation provides immediate access to a large developer community and their tools, accelerating adoption and lowering the learning curve.",
  },
  {
    icon: "shield-check",
    title: "Source-level Determinism",
    body: "Programs are easily readable by humans and behave identically across all networks. Such consistency guarantees every node produces the same results for trustless consensus, while keeping code easy to read, audit, and maintain.",
  },
  {
    icon: "database",
    title: "Native Persistent State",
    body: "Applications and objects persist by default and do not require external databases. Eliminating external databases removes the need for manual state management and external database complexity, making applications simpler and more reliable.",
  },
  {
    icon: "users-group",
    title: "Multi-User Concurrency",
    body: "Shared state, parallel execution, and long-lived processes are built in. These features allow for scalable, interactive, and continuously running applications that support simultaneous multi-user engagement.",
  },
  {
    icon: "network",
    title: "OS-like Composability",
    body: "Applications interoperate as processes instead of isolated contracts. This interoperability allows them to work together seamlessly, similar to programs in an operating system, enabling greater reusability and a richer ecosystem.",
  },
]
