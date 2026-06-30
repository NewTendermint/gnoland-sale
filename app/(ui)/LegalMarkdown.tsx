import Markdown from "markdown-to-jsx"
import type { ReactNode } from "react"

function Anchor({ href = "", children }: { href?: string; children?: ReactNode }) {
  const external = /^https?:/.test(href)
  return (
    <a
      href={href}
      className="link-underline text-foreground"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  )
}

// Cleans up Google Docs markdown exports before parsing.
function normalizeLegalMarkdown(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      const t = line.replace(/^[ \t]+/, "").replace(/\\([.#$-])/g, "$1")
      // "**1. Title**" / "**10.1 Title**" (whole-line bold, numbered) -> H2
      const header = t.match(/^\*\*(\d+(?:\.\d+)*\.?\s+.+?)\*\*$/)
      return header ? `## ${header[1]}` : t
    })
    .join("\n")
}

const MD_OPTIONS = {
  forceBlock: true,
  disableParsingRawHTML: true,
  // Strip the leading section number so anchors are clean (e.g. "10. Risk Disclosures" ->
  // "risk-disclosures", which the footer "Risk Disclosure" link targets).
  slugify: (str: string) =>
    str
      .replace(/^\d+(?:\.\d+)*\.?\s+/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  overrides: {
    h2: {
      props: {
        className: "mt-10 font-semibold text-foreground text-xl tracking-tight md:text-2xl",
      },
    },
    h3: { props: { className: "mt-6 font-semibold text-foreground text-lg" } },
    p: { props: { className: "mt-4 text-base text-muted leading-relaxed" } },
    ul: {
      props: { className: "mt-4 ml-5 list-disc space-y-2 text-base text-muted leading-relaxed" },
    },
    ol: {
      props: { className: "mt-4 ml-5 list-decimal space-y-2 text-base text-muted leading-relaxed" },
    },
    li: { props: { className: "pl-1" } },
    strong: { props: { className: "font-semibold text-foreground" } },
    a: { component: Anchor },
  },
}

// Renders verbatim legal markdown as themed nodes. No dangerouslySetInnerHTML; server component.
export function LegalMarkdown({ children }: { children: string }) {
  return <Markdown options={MD_OPTIONS}>{normalizeLegalMarkdown(children)}</Markdown>
}
