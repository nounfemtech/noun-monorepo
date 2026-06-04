import type { Config } from 'tailwindcss'
import nounPreset from '@noun/config/tailwind'

const config: Config = {
  presets: [nounPreset as Config],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
