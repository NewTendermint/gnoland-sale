import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

// Wires next-intl's request config (./i18n/request.ts) into the build.
const withNextIntl = createNextIntlPlugin()

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Silence benign "module not found" warnings for OPTIONAL deps the wallet libs
  // reference but a web build never uses: MetaMask SDK's React Native storage and
  // WalletConnect logger's pino-pretty.
  webpack: (webpackConfig) => {
    webpackConfig.externals.push("pino-pretty")
    // wagmi 3's connector barrel dynamically import()s every connector's optional SDK; the ones
    // we don't install must resolve to false so the bundler treats them as absent (each
    // connector's own .catch handles the runtime miss). We ship Coinbase + WalletConnect + EIP-6963.
    webpackConfig.resolve.fallback = {
      ...webpackConfig.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
      accounts: false,
      "@base-org/account": false,
      "@metamask/connect-evm": false,
      "@safe-global/safe-apps-provider": false,
      "@safe-global/safe-apps-sdk": false,
      porto: false,
      "porto/internal": false,
    }
    return webpackConfig
  },
}

export default withNextIntl(config)
