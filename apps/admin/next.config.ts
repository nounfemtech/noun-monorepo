import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@noun/ui', '@noun/config'],
  typedRoutes: true,
  experimental: {
    viewTransition: true,
  },
}

export default nextConfig
