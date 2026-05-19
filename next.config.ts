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
}

export default config
