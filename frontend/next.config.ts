import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,

  // Turbopack configuration
  experimental: {
    turbo: {
      root: process.cwd(),
    },
  },

  // Proxy API requests to backend during development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/:path*',
      },
    ]
  },

  // Image optimization config (if needed)
  images: {
    domains: [],
  },
}

export default nextConfig
