/**
 * Five-step explainer for the sale flow. Numbers act as anchors so readers
 * can scan the path without reading every line of body copy.
 */
export function HowItWorks() {
  const steps = [
    {
      title: "Connect your wallet",
      body: "MetaMask, Coinbase Wallet, WalletConnect or Rainbow. We use wagmi standard, any EVM wallet on Base works.",
    },
    {
      title: "Verify with Sonar (one-click for existing users)",
      body: "Sonar handles KYC/KYB. ~100k users already verified can participate in one click. New users complete identity verification (typical: 5-15 min).",
    },
    {
      title: "Place your bid",
      body: "Set the price you are willing to pay (up to your max) and the commitment amount in USDC/USDT. Bids can only be increased, never decreased.",
    },
    {
      title: "Wait for the auction to close",
      body: "A single clearing price is determined when the sale ends. Everyone who bid at or above the clearing price pays the same final price.",
    },
    {
      title: "Receive tokens",
      body: "Excess funds are auto-refunded. GNOT tokens are distributed after mainnet launch per the unlock schedule.",
    },
  ]
  return (
    <section id="how-it-works" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">How the sale works</p>
        <h2 className="mb-12 text-3xl font-bold">Five steps to participate</h2>
        <ol className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-sm border border-border p-5">
              <p className="mb-3 text-3xl font-bold tabular-nums text-fg-muted">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mb-2 font-semibold">{s.title}</h3>
              <p className="text-sm text-fg-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
