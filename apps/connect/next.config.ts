import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@noun/ui', '@noun/config'],
  typedRoutes: true,
  experimental: {
    viewTransition: true,
    staleTimes: {
      dynamic: 30,
    },
  },
}

export default nextConfig
