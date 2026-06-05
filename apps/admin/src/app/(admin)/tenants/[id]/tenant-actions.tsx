'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TenantActionsProps {
  tenantId: string
  currentStatus: string
  currentCommissionRate: number | null
}

export function TenantActions({ tenantId, currentStatus, currentCommissionRate }: TenantActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newRate, setNewRate] = useState(String(currentCommissionRate ?? ''))
  const [error, setError] = useState<string | null>(null)

  async function updateStatus(status: string) {
    setLoading(true)
    const supabase = createSupabaseBrowser()
    await supabase.from('tenants').update({ status }).eq('id', tenantId)
    setLoading(false)
    router.refresh()
  }

  async function updateCommissionRate() {
    const rate = parseFloat(newRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError('Taxa inválida.')
      return
    }
    setLoading(true)
    const supabase = createSupabaseBrowser()
    await supabase
      .from('tenants')
      .update({ settings: { commission_rate: rate } })
      .eq('id', tenantId)
    setLoading(false)
    setDialogOpen(false)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === 'pending_approval' && (
        <Button
          onClick={() => updateStatus('active')}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white"
          size="sm"
        >
          Aprovar
        </Button>
      )}
      {currentStatus === 'active' && (
        <Button
          onClick={() => updateStatus('suspended')}
          disabled={loading}
          variant="destructive"
          size="sm"
        >
          Suspender
        </Button>
      )}
      {currentStatus === 'suspended' && (
        <Button
          onClick={() => updateStatus('active')}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white"
          size="sm"
        >
          Reativar
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
      >
        Editar taxa de comissão
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar taxa de comissão</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="rate">Nova taxa (%)</Label>
              <Input
                id="rate"
                type="number"
                step="0.5"
                min={0}
                max={100}
                value={newRate}
                onChange={(e) => { setNewRate(e.target.value); setError(null) }}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={updateCommissionRate} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
