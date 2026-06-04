import type { Config } from 'tailwindcss'
import nounPreset from '@noun/config/tailwind'

const config: Config = {
  presets: [nounPreset as Config],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  // Qualquer override específico do apps/web (raramente necessário)
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
