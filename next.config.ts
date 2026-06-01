import type { NextConfig } from "next"

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
    webpackConfig.resolve.fallback = {
      ...webpackConfig.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
    }
    return webpackConfig
  },
}

export default config
