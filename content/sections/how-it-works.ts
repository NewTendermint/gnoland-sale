/**
 * Content data for the How it works section.
 *
 * `content/sections.md` is the human source of truth for marketing/legal
 * copy. This module mirrors that copy for the build (dev-facing).
 */

export const steps: Array<{ title: string; body: string; icon: string }> = [
  {
    title: "Registration",
    body: "Complete identity verification with Sonar.",
    icon: "shield-check",
  },
  {
    title: "Commitment",
    body: "Connect your wallet and submit a bid amount.",
    icon: "wallet",
  },
  {
    title: "Settlement",
    body: "Pro-rate results are finalized at auction close.",
    icon: "scale",
  },
  {
    title: "Distribution",
    body: "Tokens are sent to your address with lockup applied.",
    icon: "send",
  },
]
