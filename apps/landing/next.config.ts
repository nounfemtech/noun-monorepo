import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@noun/ui', '@noun/config'],
  typedRoutes: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
