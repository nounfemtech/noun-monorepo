'use client'

import * as React from 'react'
import { PrimaryColorPicker, ShadeColorPicker, NeutralColorPicker, useColorTheme, colors } from '@noun/ui'
import { useSpacemanTheme } from '@space-man/react-theme-animation'
import type { Theme } from '@space-man/react-theme-animation'
import { IconCheck, IconHelp } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// ---------------------------------------------------------------------------
// Mini dashboard mockups (hardcoded colors — não mudam com o tema)
// ---------------------------------------------------------------------------

function MockupLight({ primary }: { primary: string }) {
  return (
    <div className="flex w-full h-full" style={{ background: '#fafafa' }}>
      <div className="w-8 h-full flex flex-col gap-1.5 p-1.5 pt-3" style={{ background: '#f0f0f2' }}>
        <div className="h-1 rounded-full w-full" style={{ background: '#c4c4c8' }} />
        <div className="h-1 rounded-full w-4/5" style={{ background: '#c4c4c8' }} />
        <div className="h-1 rounded-full w-3/5" style={{ background: '#c4c4c8' }} />
        <div className="mt-1 h-1 rounded-full w-4/5" style={{ background: primary, opacity: 0.85 }} />
        <div className="h-1 rounded-full w-3/5" style={{ background: '#c4c4c8' }} />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="px-2 py-1.5 flex items-center gap-1" style={{ background: '#ffffff', borderBottom: '1px solid #e4e4e7' }}>
          <div className="h-1 w-10 rounded-full" style={{ background: '#d4d4d8' }} />
          <div className="ml-auto h-1.5 w-5 rounded-full" style={{ background: primary }} />
        </div>
        <div className="flex-1 p-2">
          <svg viewBox="0 0 80 40" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad-light" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primary} stopOpacity="0.25" />
                <stop offset="100%" stopColor={primary} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,35 L10,28 L20,30 L30,18 L40,22 L50,12 L60,16 L70,8 L80,10 L80,40 L0,40 Z" fill="url(#grad-light)" />
            <path d="M0,35 L10,28 L20,30 L30,18 L40,22 L50,12 L60,16 L70,8 L80,10" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function MockupDark({ primary }: { primary: string }) {
  return (
    <div className="flex w-full h-full" style={{ background: '#09090b' }}>
      <div className="w-8 h-full flex flex-col gap-1.5 p-1.5 pt-3" style={{ background: '#18181b' }}>
        <div className="h-1 rounded-full w-full" style={{ background: '#3f3f46' }} />
        <div className="h-1 rounded-full w-4/5" style={{ background: '#3f3f46' }} />
        <div className="h-1 rounded-full w-3/5" style={{ background: '#3f3f46' }} />
        <div className="mt-1 h-1 rounded-full w-4/5" style={{ background: primary, opacity: 0.9 }} />
        <div className="h-1 rounded-full w-3/5" style={{ background: '#3f3f46' }} />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="px-2 py-1.5 flex items-center gap-1" style={{ background: '#18181b', borderBottom: '1px solid #27272a' }}>
          <div className="h-1 w-10 rounded-full" style={{ background: '#3f3f46' }} />
          <div className="ml-auto h-1.5 w-5 rounded-full" style={{ background: primary }} />
        </div>
        <div className="flex-1 p-2">
          <svg viewBox="0 0 80 40" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad-dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primary} stopOpacity="0.3" />
                <stop offset="100%" stopColor={primary} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,35 L10,28 L20,30 L30,18 L40,22 L50,12 L60,16 L70,8 L80,10 L80,40 L0,40 Z" fill="url(#grad-dark)" />
            <path d="M0,35 L10,28 L20,30 L30,18 L40,22 L50,12 L60,16 L70,8 L80,10" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function MockupSystem({ primary }: { primary: string }) {
  return (
    <div className="relative w-full h-full flex overflow-hidden">
      <div className="w-1/2 h-full overflow-hidden">
        <MockupDark primary={primary} />
      </div>
      <div className="w-1/2 h-full overflow-hidden">
        <MockupLight primary={primary} />
      </div>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent 48%, rgba(255,255,255,0.15) 50%, transparent 52%)' }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// ThemeCard — cartão selecionável com mini-mockup
// ---------------------------------------------------------------------------

const THEME_CARDS: { value: Theme; label: string; Mockup: React.FC<{ primary: string }> }[] = [
  { value: 'system', label: 'Sistema',  Mockup: MockupSystem },
  { value: 'light',  label: 'Claro',    Mockup: MockupLight },
  { value: 'dark',   label: 'Escuro',   Mockup: MockupDark },
]

function ThemeModeSwitcher() {
  const { theme, switchThemeFromElement } = useSpacemanTheme()
  const { primary } = useColorTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const primaryHex = colors[primary.palette][primary.shade]

  return (
    <div className="flex gap-4">
      {THEME_CARDS.map(({ value, label, Mockup }) => {
        const active = theme === value
        return (
          <button
            key={value}
            onClick={(e) => switchThemeFromElement(value, e.currentTarget)}
            className="flex flex-col items-start gap-2 focus-visible:outline-none group"
          >
            <div
              className={cn(
                'relative w-36 h-24 rounded-xl overflow-hidden transition-all',
                active
                  ? 'outline outline-2 outline-primary outline-offset-[-1px]'
                  : 'outline outline-1 outline-border group-hover:outline-muted-foreground/40',
              )}
            >
              <Mockup primary={primaryHex} />
              {active && (
                <div className="absolute bottom-2 left-2 size-4 shrink-0 aspect-square rounded-full bg-primary flex items-center justify-center">
                  <IconCheck size={9} className="text-primary-foreground" strokeWidth={3} />
                </div>
              )}
            </div>
            <span className={cn('text-xs font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AvatarUpload
// ---------------------------------------------------------------------------

function AvatarUpload() {
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)
  const [storagePath, setStoragePath] = React.useState<string | null>(null)
  const [initials, setInitials] = React.useState('...')
  const [uploading, setUploading] = React.useState(false)
  const [removing, setRemoving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    async function load() {
      const sb = createSupabaseBrowser()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data: profile } = await sb
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()
      const name = profile?.full_name ?? user.email ?? ''
      setInitials(
        name.split(/\s+/).map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || '?',
      )
      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url)
        const match = profile.avatar_url.match(/\/avatares\/(.+?)(\?|$)/)
        if (match) setStoragePath(match[1])
      }
    }
    load()
  }, [])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 2MB.')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const sb = createSupabaseBrowser()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) throw new Error('Não autenticado')
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/avatar.${ext}`
      const { error: upErr } = await sb.storage
        .from('avatares')
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = sb.storage.from('avatares').getPublicUrl(path)
      await sb.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      setAvatarUrl(`${publicUrl}?t=${Date.now()}`)
      setStoragePath(path)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleRemove() {
    setError(null)
    setRemoving(true)
    try {
      const sb = createSupabaseBrowser()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) throw new Error('Não autenticado')
      if (storagePath) {
        await sb.storage.from('avatares').remove([storagePath])
      }
      await sb.from('profiles').update({ avatar_url: null }).eq('id', user.id)
      setAvatarUrl(null)
      setStoragePath(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao remover imagem.')
    } finally {
      setRemoving(false)
    }
  }

  const busy = uploading || removing

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 rounded-xl shrink-0">
        <AvatarImage src={avatarUrl ?? undefined} className="object-cover" />
        <AvatarFallback className="rounded-xl text-base bg-muted">{initials}</AvatarFallback>
      </Avatar>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Enviando…' : 'Alterar foto'}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={handleRemove}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {removing ? 'Removendo…' : 'Remover'}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG, GIF ou WebP. Máximo 2MB.</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Popover de dicas de tonalidade
// ---------------------------------------------------------------------------

function ShadeHintPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
          aria-label="Dicas de tonalidade"
        >
          <IconHelp size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-76 p-4 space-y-3.5 text-xs" side="right" align="start">
        <p className="text-sm font-semibold leading-none">Guia de tonalidades</p>

        <div className="space-y-1.5">
          <p className="font-medium text-foreground">Tema claro</p>
          <ul className="space-y-1 text-muted-foreground">
            <li><span className="font-medium text-foreground">500–700</span> — melhor equilíbrio entre contraste e vivacidade.</li>
            <li><span className="font-medium text-foreground">100–200</span> — tons muito claros ficam quase invisíveis em botões, barras de progresso e outros componentes sobre fundo branco.</li>
          </ul>
        </div>

        <div className="space-y-1.5">
          <p className="font-medium text-foreground">Tema escuro</p>
          <ul className="space-y-1 text-muted-foreground">
            <li><span className="font-medium text-foreground">300–500</span> — se destacam sobre fundos escuros sem forçar a vista.</li>
            <li><span className="font-medium text-foreground">800–900</span> — escuros demais para se distinguir do fundo, prejudicando a visibilidade de componentes.</li>
          </ul>
        </div>

        <div className="space-y-1.5">
          <p className="font-medium text-foreground">Tons versáteis</p>
          <p className="text-muted-foreground"><span className="font-medium text-foreground">400–600</span> — funcionam bem em ambos os modos. A escolha mais segura se você alterna entre claro e escuro.</p>
        </div>

        <div className="space-y-1.5">
          <p className="font-medium text-foreground">Cores quentes (yellow, amber, orange, lime)</p>
          <p className="text-muted-foreground">Naturalmente claras e de alto brilho. No modo claro, prefira tons <span className="font-medium text-foreground">500–600</span> para garantir contraste suficiente em texto e ícones sobre o primary.</p>
        </div>

        <div className="space-y-1.5">
          <p className="font-medium text-foreground">Cores frias (blue, indigo, violet, purple)</p>
          <p className="text-muted-foreground">Naturalmente mais escuras. Funcionam bem em tons <span className="font-medium text-foreground">400–500</span> em ambos os modos sem perder legibilidade.</p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SettingsRow({
  title,
  description,
  titleExtra,
  children,
}: {
  title: string
  description: string
  titleExtra?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-8 py-6">
      <div className="w-64 shrink-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium">{title}</p>
          {titleExtra}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="py-12 text-center text-sm text-muted-foreground">
      {label} — em breve.
    </div>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="pt-6 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {children}
    </p>
  )
}

function RegiaoTab() {
  const [autoTimezone, setAutoTimezone] = React.useState(true)
  const [timezone, setTimezone] = React.useState('America/Sao_Paulo')
  const [autoDST, setAutoDST] = React.useState(true)
  const [showClock, setShowClock] = React.useState(false)
  const [country, setCountry] = React.useState('BR')
  const [language, setLanguage] = React.useState('pt-BR')
  const [dateFormat, setDateFormat] = React.useState('dd/mm/yyyy')
  const [timeFormat, setTimeFormat] = React.useState('24h')
  const [currency, setCurrency] = React.useState('BRL')
  const [decimalSep, setDecimalSep] = React.useState('comma')
  const [thousandSep, setThousandSep] = React.useState('period')
  const [weekStart, setWeekStart] = React.useState('monday')

  return (
    <div className="mt-6">
      <h2 className="text-base font-medium">Região</h2>
      <p className="text-sm text-muted-foreground mt-0.5">
        Configure fuso horário, idioma e preferências regionais do painel.
      </p>

      {/* ── Fuso Horário ── */}
      <Separator className="mt-6" />
      <GroupLabel>Fuso Horário</GroupLabel>

      <SettingsRow
        title="Fuso automático"
        description="Detecta o fuso horário pelo dispositivo."
      >
        <Switch checked={autoTimezone} onCheckedChange={setAutoTimezone} />
      </SettingsRow>

      {!autoTimezone && (
        <>
          <Separator />
          <SettingsRow
            title="Fuso horário"
            description="Fuso horário manual para exibição de datas e horários."
          >
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Noronha">Fernando de Noronha (UTC-2)</SelectItem>
                <SelectItem value="America/Sao_Paulo">Brasília (UTC-3)</SelectItem>
                <SelectItem value="America/Fortaleza">Fortaleza (UTC-3)</SelectItem>
                <SelectItem value="America/Manaus">Manaus (UTC-4)</SelectItem>
                <SelectItem value="America/Porto_Velho">Porto Velho (UTC-4)</SelectItem>
                <SelectItem value="America/Rio_Branco">Rio Branco (UTC-5)</SelectItem>
                <SelectItem value="America/New_York">Nova York (UTC-5)</SelectItem>
                <SelectItem value="America/Chicago">Chicago (UTC-6)</SelectItem>
                <SelectItem value="America/Los_Angeles">Los Angeles (UTC-8)</SelectItem>
                <SelectItem value="Europe/Lisbon">Lisboa (UTC+0)</SelectItem>
                <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                <SelectItem value="Europe/Madrid">Madrid (UTC+1)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (UTC+1)</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>
        </>
      )}

      <Separator />

      <SettingsRow
        title="Horário de verão"
        description="Ajusta automaticamente o relógio para o horário de verão."
      >
        <Switch checked={autoDST} onCheckedChange={setAutoDST} />
      </SettingsRow>

      <Separator />

      <SettingsRow
        title="Relógio no Dashboard"
        description="Exibe hora e data na tela inicial do painel."
      >
        <Switch checked={showClock} onCheckedChange={setShowClock} />
      </SettingsRow>

      {/* ── Idioma e Região ── */}
      <Separator />
      <GroupLabel>Idioma e Região</GroupLabel>

      <SettingsRow
        title="País ou região"
        description="Afeta formatos padrão e conteúdo regional."
      >
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BR">Brasil</SelectItem>
            <SelectItem value="PT">Portugal</SelectItem>
            <SelectItem value="US">Estados Unidos</SelectItem>
            <SelectItem value="ES">Espanha</SelectItem>
            <SelectItem value="FR">França</SelectItem>
            <SelectItem value="GB">Reino Unido</SelectItem>
            <SelectItem value="AR">Argentina</SelectItem>
            <SelectItem value="MX">México</SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>

      <Separator />

      <SettingsRow
        title="Idioma"
        description="Idioma da interface do painel."
      >
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
            <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Español</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>

      <Separator />

      <SettingsRow
        title="Formato de data"
        description="Como as datas são exibidas no painel."
      >
        <Select value={dateFormat} onValueChange={setDateFormat}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dd/mm/yyyy">DD/MM/AAAA — 25/06/2025</SelectItem>
            <SelectItem value="mm/dd/yyyy">MM/DD/AAAA — 06/25/2025</SelectItem>
            <SelectItem value="yyyy-mm-dd">AAAA-MM-DD — 2025-06-25</SelectItem>
            <SelectItem value="dd-mmm-yyyy">DD Mês AAAA — 25 jun 2025</SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>

      <Separator />

      <SettingsRow
        title="Formato de hora"
        description="Preferência de exibição de horários."
      >
        <Select value={timeFormat} onValueChange={setTimeFormat}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24 horas — 14:30</SelectItem>
            <SelectItem value="12h">12 horas — 2:30 PM</SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>

      {/* ── Moeda e Números ── */}
      <Separator />
      <GroupLabel>Moeda e Números</GroupLabel>

      <SettingsRow
        title="Moeda principal"
        description="Moeda usada para exibir valores financeiros."
      >
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BRL">BRL — Real brasileiro</SelectItem>
            <SelectItem value="USD">USD — Dólar americano</SelectItem>
            <SelectItem value="EUR">EUR — Euro</SelectItem>
            <SelectItem value="GBP">GBP — Libra esterlina</SelectItem>
            <SelectItem value="ARS">ARS — Peso argentino</SelectItem>
            <SelectItem value="MXN">MXN — Peso mexicano</SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>

      <Separator />

      <SettingsRow
        title="Separador decimal"
        description="Símbolo para separar casas decimais."
      >
        <Select value={decimalSep} onValueChange={setDecimalSep}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="comma">Vírgula — 1.234,56</SelectItem>
            <SelectItem value="period">Ponto — 1,234.56</SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>

      <Separator />

      <SettingsRow
        title="Separador de milhar"
        description="Símbolo para agrupar milhares."
      >
        <Select value={thousandSep} onValueChange={setThousandSep}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="period">Ponto — 1.000</SelectItem>
            <SelectItem value="comma">Vírgula — 1,000</SelectItem>
            <SelectItem value="space">Espaço — 1 000</SelectItem>
            <SelectItem value="none">Nenhum — 1000</SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>

      {/* ── Calendário ── */}
      <Separator />
      <GroupLabel>Calendário</GroupLabel>

      <SettingsRow
        title="Início da semana"
        description="Dia considerado o primeiro da semana em calendários e relatórios."
      >
        <Select value={weekStart} onValueChange={setWeekStart}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monday">Segunda-feira</SelectItem>
            <SelectItem value="sunday">Domingo</SelectItem>
            <SelectItem value="saturday">Sábado</SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ConfiguracoesPage() {
  return (
    <div className="p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as preferências do seu workspace.
        </p>
      </div>

      <Tabs defaultValue="aparencia" className="mt-6">
        <TabsList variant="underline">
          <TabsTrigger value="geral"         variant="underline">Geral</TabsTrigger>
          <TabsTrigger value="time"          variant="underline">Time</TabsTrigger>
          <TabsTrigger value="aparencia"     variant="underline">Aparência</TabsTrigger>
          <TabsTrigger value="notificacoes"  variant="underline">Notificações</TabsTrigger>
          <TabsTrigger value="seguranca"     variant="underline">Segurança</TabsTrigger>
          <TabsTrigger value="regiao"        variant="underline">Região</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <PlaceholderTab label="Geral" />
        </TabsContent>

        <TabsContent value="time">
          <PlaceholderTab label="Time" />
        </TabsContent>

        <TabsContent value="aparencia">
          <div className="mt-6">
            <h2 className="text-base font-medium">Aparência</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Mude a aparência e a experiência do painel.
            </p>

            <Separator className="mt-6" />

            <SettingsRow
              title="Foto de perfil"
              description="Foto exibida na sidebar e no perfil do usuário."
            >
              <AvatarUpload />
            </SettingsRow>

            <Separator />

            <SettingsRow
              title="Tema"
              description="Tema claro, escuro ou sincronizado com o sistema."
            >
              <ThemeModeSwitcher />
            </SettingsRow>

            <Separator />

            <SettingsRow
              title="Cor primária"
              description="Define a cor de destaque em botões, links e elementos interativos."
            >
              <PrimaryColorPicker />
            </SettingsRow>

            <Separator />

            <SettingsRow
              title="Tonalidade"
              description="Intensidade da cor primária selecionada."
              titleExtra={<ShadeHintPopover />}
            >
              <ShadeColorPicker />
            </SettingsRow>

            <Separator />

            <SettingsRow
              title="Tons neutros"
              description="Controla bordas, fundos secundários e textos auxiliares."
            >
              <NeutralColorPicker />
            </SettingsRow>
          </div>
        </TabsContent>

        <TabsContent value="notificacoes">
          <PlaceholderTab label="Notificações" />
        </TabsContent>

        <TabsContent value="seguranca">
          <PlaceholderTab label="Segurança" />
        </TabsContent>

        <TabsContent value="regiao">
          <RegiaoTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
