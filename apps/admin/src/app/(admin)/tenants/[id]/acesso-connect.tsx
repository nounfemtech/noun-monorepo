'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { IconSend, IconUserPlus } from '@tabler/icons-react'
import { gerarAcesso, reenviarConvite } from './actions'

interface AcessoConnectProps {
  tenantId: string
  tenantEmail: string | null
  hasAccess: boolean
}

export function AcessoConnect({ tenantId, tenantEmail, hasAccess }: AcessoConnectProps) {
  const [pending, startTransition] = useTransition()

  function handleGerarAcesso() {
    startTransition(async () => {
      const result = await gerarAcesso(tenantId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Convite enviado com sucesso')
      }
    })
  }

  function handleReenviar() {
    startTransition(async () => {
      const result = await reenviarConvite(tenantId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Convite reenviado com sucesso')
      }
    })
  }

  return (
    <Card>
      <CardHeader className="py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Acesso ao Noun Connect</CardTitle>
            <CardDescription>
              {hasAccess
                ? 'Tenant com acesso ao painel Connect'
                : 'Tenant ainda sem acesso ao painel Connect'}
            </CardDescription>
          </div>
          <Badge variant={hasAccess ? 'success' : 'warning'}>
            {hasAccess ? 'Acesso ativo' : 'Sem acesso'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {hasAccess ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {tenantEmail ?? 'E-mail nao cadastrado'}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={handleReenviar}
            >
              <IconSend className="size-4 mr-1.5" />
              {pending ? 'Reenviando...' : 'Reenviar convite'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {tenantEmail
                ? `Convite sera enviado para ${tenantEmail}`
                : 'Cadastre um e-mail antes de gerar acesso'}
            </span>
            <Button
              size="sm"
              disabled={pending || !tenantEmail}
              onClick={handleGerarAcesso}
            >
              <IconUserPlus className="size-4 mr-1.5" />
              {pending ? 'Gerando...' : 'Gerar Acesso'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
