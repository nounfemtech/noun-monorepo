'use client'

import * as React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconBrandGoogle, IconCircleCheck } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { iniciarConexaoGoogle, desconectarGoogle } from './google-actions'

export interface GoogleCalendarCardProps {
  connection: { googleEmail: string } | null
}

export function GoogleCalendarCard({ connection }: GoogleCalendarCardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const status = searchParams.get('google')
    if (status === 'connected') {
      toast.success('Google Calendar conectado.')
      router.replace('/perfil')
    } else if (status === 'error') {
      toast.error('Nao foi possivel conectar ao Google Calendar. Tente novamente.')
      router.replace('/perfil')
    }
  }, [searchParams, router])

  async function conectar() {
    setLoading(true)
    const result = await iniciarConexaoGoogle()
    setLoading(false)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    window.location.href = result.url
  }

  async function desconectar() {
    setLoading(true)
    const result = await desconectarGoogle()
    setLoading(false)
    if (result.error) {
      toast.error(`Erro ao desconectar: ${result.error}`)
      return
    }
    toast.success('Google Calendar desconectado.')
    router.refresh()
  }

  if (connection) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <IconCircleCheck size={18} className="text-emerald-600 shrink-0" />
          <span>
            Conectado como <span className="font-medium">{connection.googleEmail}</span>
          </span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={desconectar} disabled={loading}>
          {loading ? 'Desconectando...' : 'Desconectar'}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Conecte sua conta para gerar automaticamente o link do Google Meet ao confirmar consultas.
      </p>
      <Button type="button" onClick={conectar} disabled={loading} className="shrink-0">
        <IconBrandGoogle size={16} />
        {loading ? 'Conectando...' : 'Conectar Google Calendar'}
      </Button>
    </div>
  )
}
