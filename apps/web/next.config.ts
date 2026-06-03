import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@noun/ui', '@noun/config'],
  experimental: {
    typedRoutes: true,
  },
}

export default nextConfig
