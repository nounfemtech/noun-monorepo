// ============================================================
// Tailwind Config — NativeWind v4 (CommonJS)
// Consome o preset compartilhado de packages/config
// ============================================================

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind usa preset próprio + nosso preset de marca
  presets: [
    require('nativewind/preset'),
    require('@noun/config/tailwind').default,
  ],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
