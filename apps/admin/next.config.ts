import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@noun/ui', '@noun/config'],
  typedRoutes: true,
  experimental: {
    viewTransition: true,
    // mantém páginas dinâmicas no cache do client router por 30s:
    // voltar a uma página já visitada não refaz o roundtrip ao servidor
    staleTimes: {
      dynamic: 30,
    },
  },
}

export default nextConfig
