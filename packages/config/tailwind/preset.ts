import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'

// ============================================================
// Noun Design System — Tailwind Preset compartilhado
// Consumir em apps/web e apps/admin:
//   import nounPreset from '@noun/config/tailwind'
//   export default { presets: [nounPreset], content: [...] }
// ============================================================

const preset: Omit<Config, 'content'> = {
  darkMode: ['class'],
  theme: {
    extend: {
      // ------------------------------------------------------------------
      // Cores semânticas do Shadcn/UI (CSS variables)
      // ------------------------------------------------------------------
      colors: {
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Sidebar (para apps/admin)
        sidebar: {
          DEFAULT:            'hsl(var(--sidebar-background))',
          foreground:         'hsl(var(--sidebar-foreground))',
          primary:            'hsl(var(--sidebar-primary))',
          'primary-foreground':'hsl(var(--sidebar-primary-foreground))',
          accent:             'hsl(var(--sidebar-accent))',
          'accent-foreground':'hsl(var(--sidebar-accent-foreground))',
          border:             'hsl(var(--sidebar-border))',
          ring:               'hsl(var(--sidebar-ring))',
        },
      },

      // ------------------------------------------------------------------
      // Border Radius — baseado em --radius CSS variable
      // ------------------------------------------------------------------
      borderRadius: {
        sm:   'calc(var(--radius) * 0.6)',
        md:   'calc(var(--radius) * 0.8)',
        lg:   'var(--radius)',
        xl:   'calc(var(--radius) * 1.4)',
        '2xl':'calc(var(--radius) * 1.8)',
        '3xl':'calc(var(--radius) * 2.2)',
        '4xl':'calc(var(--radius) * 2.6)',
        // Numérico (0 a 1rem em 0.125rem)
        'r-0': '0',
        'r-1': '0.125rem',
        'r-2': '0.25rem',
        'r-3': '0.375rem',
        'r-4': '0.5rem',
        'r-5': '0.625rem',
        'r-6': '0.75rem',
        'r-7': '0.875rem',
        'r-8': '1rem',
      },

      // ------------------------------------------------------------------
      // Border Width
      // ------------------------------------------------------------------
      borderWidth: {
        thin:   '0.5px',
        medium: '1.5px',
        '3':    '3px',
        '4':    '4px',
      },

      // ------------------------------------------------------------------
      // Fontes — Reddit Sans e Reddit Mono
      // ------------------------------------------------------------------
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
        mono: ['var(--font-mono)', ...fontFamily.mono],
      },

      // ------------------------------------------------------------------
      // Font Weights explícitos
      // ------------------------------------------------------------------
      fontWeight: {
        thin:       '100',
        extralight: '200',
        light:      '300',
        normal:     '400',
        medium:     '500',
        semibold:   '600',
        bold:       '700',
        extrabold:  '800',
        black:      '900',
      },

      // ------------------------------------------------------------------
      // Animations Shadcn
      // ------------------------------------------------------------------
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fade-in 0.2s ease-out',
      },
    },
  },
}

export default preset
