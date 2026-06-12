/**
 * Content data for the How it works section.
 *
 * `content/sections.md` is the human source of truth for marketing/legal
 * copy. This module mirrors that copy for the build (dev-facing).
 */

export const steps: Array<{ title: string; body: string; icon: string }> = [
  {
    title: "Verify",
    body: "Complete identity verification with Sonar, Echo's compliance platform.",
    icon: "shield-check",
  },
  {
    title: "Connect",
    body: "Connect your wallet to join the sale.",
    icon: "wallet",
  },
  {
    title: "Bid",
    body: "Set your max price and commit USDC or USDT.",
    icon: "scale",
  },
  {
    title: "Distribution",
    body: "Tokens are sent to your address with lockup applied.",
    icon: "send",
  },
]
