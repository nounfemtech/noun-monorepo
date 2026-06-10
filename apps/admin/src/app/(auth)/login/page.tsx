'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useColorTheme, colors, hexToHsl, COLOR_SHADES } from '@noun/ui'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { primary } = useColorTheme()

  const coverGradient = useMemo(() => {
    const idx = COLOR_SHADES.indexOf(primary.shade)
    const fromShade = COLOR_SHADES[Math.min(idx + 2, COLOR_SHADES.length - 1)] ?? primary.shade
    const toShade   = COLOR_SHADES[Math.max(idx - 2, 0)] ?? primary.shade
    const from = hexToHsl(colors[primary.palette][fromShade])
    const mid  = hexToHsl(colors[primary.palette][primary.shade])
    const to   = hexToHsl(colors[primary.palette][toShade])
    return `linear-gradient(135deg, hsl(${from}) 0%, hsl(${mid}) 50%, hsl(${to}) 100%)`
  }, [primary])

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
        setError('E-mail ou senha inválidos.')
        setLoading(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Erro ao obter usuário.')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'noun_admin') {
        await supabase.auth.signOut()
        setError('Acesso restrito ao time Noun.')
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('[Vaughan] login error:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Erro inesperado. Tente novamente.',
      )
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Coluna esquerda — wordmark + formulário */}
      <div className="flex flex-col gap-6 p-8 md:p-12">
        {/* Wordmark */}
        <div className="flex items-center">
          <span className="text-xl font-semibold tracking-tight">Vaughan</span>
        </div>

        {/* Formulário centralizado verticalmente */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Acesso ao painel
              </h1>
              <p className="text-sm text-muted-foreground">
                Entre com suas credenciais do time Noun
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@noun.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
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

        {/* Quote no canto inferior */}
        <div className="p-10 text-primary-foreground space-y-2">
          <blockquote className="text-sm leading-relaxed opacity-90">
            &ldquo;Nomeada a primeira supervisora negra da NASA, Dorothy Vaughan
            foi pioneira na computação científica.&rdquo;
          </blockquote>
          <p className="text-xs opacity-60 font-medium">
            Dorothy Vaughan, 1910 &mdash; 2008
          </p>
        </div>
      </div>
    </div>
  )
}
