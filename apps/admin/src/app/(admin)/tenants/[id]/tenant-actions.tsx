'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { IconClockPause, IconDotsVertical, IconLockOpen, IconPencil, IconTrash } from '@tabler/icons-react'

interface TenantActionsProps {
  tenantId: string
  currentStatus: string
}

// ─── Gestão zones ─────────────────────────────────────────────────────────────

export function TenantGestaoZones({ tenantId, currentStatus }: TenantActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function updateStatus(status: string) {
    setLoading(true)
    const supabase = createSupabaseBrowser()
    await supabase.from('tenants').update({ status }).eq('id', tenantId)
    setLoading(false)
    router.refresh()
  }

  async function deleteTenant() {
    setLoading(true)
    const supabase = createSupabaseBrowser()
    await supabase.from('tenants').delete().eq('id', tenantId)
    setLoading(false)
    setDeleteOpen(false)
    router.push('/tenants')
  }

  const isSuspended = currentStatus === 'suspended'

  return (
    <div className="space-y-4 py-6">
      {/* Zona de atenção */}
      <div className="rounded-lg border border-amber-200 dark:border-amber-900 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
          Zona de atenção
        </p>
        <div className="mt-4 flex items-start justify-between gap-8 border-t pt-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">{isSuspended ? 'Reativar tenant' : 'Suspender tenant'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isSuspended
                ? 'Reativa o acesso do tenant à plataforma. Profissionais e pacientes voltam a ter acesso normalmente.'
                : 'Suspende temporariamente o acesso do tenant à plataforma. Profissionais e pacientes não conseguirão acessar os serviços enquanto o tenant estiver suspenso.'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className={isSuspended ? '' : 'border-amber-400 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950'}
            onClick={() => updateStatus(isSuspended ? 'active' : 'suspended')}
            disabled={loading}
          >
            {isSuspended
              ? <><IconLockOpen className="h-4 w-4 mr-1.5" />Reativar</>
              : <><IconClockPause className="h-4 w-4 mr-1.5" />Suspender</>}
          </Button>
        </div>
      </div>

      {/* Zona de perigo */}
      <div className="rounded-lg border border-destructive/30 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
          Zona de perigo
        </p>
        <div className="mt-4 flex items-start justify-between gap-8 border-t pt-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Excluir tenant</p>
            <p className="text-sm text-muted-foreground mt-1">
              Exclui permanentemente o tenant e todos os dados associados, incluindo profissionais, pacientes e consultas. Esta ação não pode ser desfeita.
            </p>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={loading}
          >
            <IconTrash className="h-4 w-4 mr-1.5" />
            Excluir
          </Button>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir tenant</DialogTitle>
            <DialogDescription>
              Esta ação é irreversível e removerá todos os dados associados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={deleteTenant} disabled={loading}>
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Header dropdown ──────────────────────────────────────────────────────────

interface TenantHeaderActionsProps {
  tenantId: string
  currentStatus: string
}

export function TenantHeaderActions({ tenantId, currentStatus }: TenantHeaderActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function updateStatus(status: string) {
    setLoading(true)
    const supabase = createSupabaseBrowser()
    await supabase.from('tenants').update({ status }).eq('id', tenantId)
    setLoading(false)
    router.refresh()
  }

  async function deleteTenant() {
    setLoading(true)
    const supabase = createSupabaseBrowser()
    await supabase.from('tenants').delete().eq('id', tenantId)
    setLoading(false)
    setDeleteOpen(false)
    router.push('/tenants')
  }

  const canSuspend    = currentStatus === 'active' || currentStatus === 'pending'
  const canReactivate = currentStatus === 'suspended'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DropdownMenuItem asChild>
            <Link href={`/tenants/${tenantId}/editar`} className="flex items-center gap-2">
              <IconPencil className="h-4 w-4" />
              Editar
            </Link>
          </DropdownMenuItem>

          {canSuspend && (
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => updateStatus('suspended')}
              disabled={loading}
            >
              <IconClockPause className="h-4 w-4" />
              Suspender
            </DropdownMenuItem>
          )}

          {canReactivate && (
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => updateStatus('active')}
              disabled={loading}
            >
              <IconLockOpen className="h-4 w-4" />
              Reativar
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            className="flex items-center gap-2"
            onClick={() => setDeleteOpen(true)}
          >
            <IconTrash className="h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir tenant</DialogTitle>
            <DialogDescription>
              Esta ação é irreversível e removerá todos os dados associados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteTenant} disabled={loading}>
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
