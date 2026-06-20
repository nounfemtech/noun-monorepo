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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { IconClockPause, IconDotsVertical, IconLockOpen, IconPencil, IconTrash } from '@tabler/icons-react'

interface TenantActionsProps {
  tenantId: string
  currentStatus: string
}

// ─── Gestão zones ─────────────────────────────────────────────────────────────

export function TenantGestaoZones({ tenantId, currentStatus }: TenantActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function updateStatus(status: string) {
    setLoading(true)
    const supabase = createSupabaseBrowser()
    await supabase.from('tenants').update({ status }).eq('id', tenantId)
    setLoading(false)
    setSuspendOpen(false)
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
    <div className="py-6 space-y-8">

      {/* Zona de atenção */}
      <div className="grid grid-cols-[220px_580px] gap-8 mx-auto">
        <div className="pt-1">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Zona de atenção</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ações que afetam temporariamente o acesso do tenant à plataforma.
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 dark:border-amber-900 p-4 flex items-center justify-between gap-8">
          <div>
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
            className={isSuspended ? 'shrink-0' : 'shrink-0 border-amber-400 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950'}
            onClick={() => setSuspendOpen(true)}
            disabled={loading}
          >
            {isSuspended
              ? <><IconLockOpen className="h-4 w-4 mr-1.5" />Reativar</>
              : <><IconClockPause className="h-4 w-4 mr-1.5" />Suspender</>}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Zona de perigo */}
      <div className="grid grid-cols-[220px_580px] gap-8 mx-auto">
        <div className="pt-1">
          <p className="text-sm font-medium text-destructive">Zona de perigo</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ações irreversíveis que afetam permanentemente os dados do tenant.
          </p>
        </div>
        <div className="rounded-lg border border-destructive/30 p-4 flex items-center justify-between gap-8">
          <div>
            <p className="text-sm font-medium">Excluir tenant</p>
            <p className="text-sm text-muted-foreground mt-1">
              Exclui permanentemente o tenant e todos os dados associados, incluindo profissionais, pacientes e consultas. Esta ação não pode ser desfeita.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-red-400 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
            onClick={() => setDeleteOpen(true)}
            disabled={loading}
          >
            <IconTrash className="h-4 w-4 mr-1.5" />
            Excluir
          </Button>
        </div>
      </div>

      {/* AlertDialog: Suspender / Reativar */}
      <AlertDialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isSuspended ? 'Reativar tenant' : 'Suspender tenant'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isSuspended
                ? 'O tenant voltará a ter acesso à plataforma. Profissionais e pacientes poderão utilizar os serviços normalmente.'
                : 'O tenant será suspenso e perderá o acesso à plataforma temporariamente. Profissionais e pacientes não conseguirão acessar os serviços.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              size="sm"
              variant={isSuspended ? 'default' : 'destructive'}
              onClick={() => updateStatus(isSuspended ? 'active' : 'suspended')}
              disabled={loading}
            >
              {loading
                ? (isSuspended ? 'Reativando...' : 'Suspendendo...')
                : (isSuspended ? 'Reativar' : 'Suspender')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Excluir */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível e removerá todos os dados associados, incluindo profissionais, pacientes e consultas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              size="sm"
              variant="destructive"
              onClick={deleteTenant}
              disabled={loading}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isSuspended = currentStatus === 'suspended'

  async function updateStatus(status: string) {
    setLoading(true)
    const supabase = createSupabaseBrowser()
    await supabase.from('tenants').update({ status }).eq('id', tenantId)
    setLoading(false)
    setSuspendOpen(false)
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

  const canSuspend    = currentStatus === 'active'
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
              onClick={() => setSuspendOpen(true)}
              disabled={loading}
            >
              <IconClockPause className="h-4 w-4" />
              Suspender
            </DropdownMenuItem>
          )}

          {canReactivate && (
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => setSuspendOpen(true)}
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

      {/* AlertDialog: Suspender / Reativar */}
      <AlertDialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isSuspended ? 'Reativar tenant' : 'Suspender tenant'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isSuspended
                ? 'O tenant voltará a ter acesso à plataforma. Profissionais e pacientes poderão utilizar os serviços normalmente.'
                : 'O tenant será suspenso e perderá o acesso à plataforma temporariamente. Profissionais e pacientes não conseguirão acessar os serviços.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              size="sm"
              variant={isSuspended ? 'default' : 'destructive'}
              onClick={() => updateStatus(isSuspended ? 'active' : 'suspended')}
              disabled={loading}
            >
              {loading
                ? (isSuspended ? 'Reativando...' : 'Suspendendo...')
                : (isSuspended ? 'Reativar' : 'Suspender')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Excluir */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível e removerá todos os dados associados, incluindo profissionais, pacientes e consultas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              size="sm"
              variant="destructive"
              onClick={deleteTenant}
              disabled={loading}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
