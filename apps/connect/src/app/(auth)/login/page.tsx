'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { colors, hexToHsl, COLOR_SHADES } from '@noun/ui'
import { IconEye, IconEyeOff } from '@tabler/icons-react'

// Cor primaria fixa desta pagina: rose no mesmo tom (400) usado como amarelo/400
// no login do admin (packages/ui DEFAULT_PRIMARY). Nao usa useColorTheme() porque
// o tema dinamico do connect e por canal (specialist=azul, pharmacy=teal, ver
// apps/connect/CLAUDE.md secao 6) — o login fica fora dessa arvore, entao a cor
// aqui e fixa via override local de --primary/--primary-foreground/--ring.
const PRIMARY_PALETTE = 'rose' as const
const PRIMARY_SHADE = 400 as const

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const primaryHsl = useMemo(
    () => hexToHsl(colors[PRIMARY_PALETTE][PRIMARY_SHADE]),
    [],
  )

  const coverGradient = useMemo(() => {
    const idx = COLOR_SHADES.indexOf(PRIMARY_SHADE)
    const fromShade = COLOR_SHADES[Math.min(idx + 2, COLOR_SHADES.length - 1)] ?? PRIMARY_SHADE
    const toShade   = COLOR_SHADES[Math.max(idx - 2, 0)] ?? PRIMARY_SHADE
    const from = hexToHsl(colors[PRIMARY_PALETTE][fromShade])
    const mid  = hexToHsl(colors[PRIMARY_PALETTE][PRIMARY_SHADE])
    const to   = hexToHsl(colors[PRIMARY_PALETTE][toShade])
    return `linear-gradient(135deg, hsl(${from}) 0%, hsl(${mid}) 50%, hsl(${to}) 100%)`
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createSupabaseBrowser()

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('E-mail ou senha invalidos.')
        setLoading(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Erro ao obter usuario.')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const partnerRoles = ['doctor', 'nutritionist', 'psychologist', 'pharmacist', 'attendant']

      if (!profile || !partnerRoles.includes(profile.role)) {
        await supabase.auth.signOut()
        setError('Acesso restrito a parceiros Noun.')
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('[Connect] login error:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Erro inesperado. Tente novamente.',
      )
      setLoading(false)
    }
  }

  return (
    <div
      className="grid min-h-svh lg:grid-cols-2"
      style={{
        // Tokens do connect guardam cores completas (nao triplets HSL como no admin)
        '--primary': `hsl(${primaryHsl})`,
        '--primary-foreground': 'hsl(0 0% 100%)',
        '--ring': `hsl(${primaryHsl})`,
      } as React.CSSProperties}
    >
      {/* Coluna esquerda — wordmark + formulario */}
      <div className="flex flex-col gap-6 p-8 md:p-12">
        {/* Wordmark */}
        <div className="flex items-center">
          <span className="text-xl font-semibold tracking-tight">Noun Connect</span>
        </div>

        {/* Formulario centralizado verticalmente */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Acesso ao portal
              </h1>
              <p className="text-sm text-muted-foreground">
                Entre com suas credenciais para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Coluna direita — visual de capa (hidden em mobile) */}
      <div
        className="relative hidden lg:flex flex-col"
        style={{ background: coverGradient }}
      >
        <div className="flex-1" />

        {/* Tagline no canto inferior */}
        <div className="p-10 text-primary-foreground space-y-2">
          <blockquote className="text-sm leading-relaxed opacity-90">
            &ldquo;Saude hormonal, do seu jeito.&rdquo;
          </blockquote>
          <p className="text-xs opacity-60 font-medium">
            Noun
          </p>
        </div>
      </div>
    </div>
  )
}
