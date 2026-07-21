'use client'

import * as React from 'react'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { criarBloqueio, removerBloqueio } from './actions'
import type { BlockRow } from './lib'

function formatBlockPeriod(block: BlockRow): string {
  const starts = new Date(block.starts_at)
  const ends = new Date(block.ends_at)
  const sameDay = starts.toDateString() === ends.toDateString()
  const date = starts.toLocaleDateString('pt-BR')
  const fullDay =
    starts.getHours() === 0 && starts.getMinutes() === 0 &&
    ends.getHours() === 23 && ends.getMinutes() === 59

  if (sameDay && fullDay) return `${date} (dia inteiro)`
  const hm = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return `${date}, ${hm(starts)} as ${hm(ends)}`
  return `${date} ${hm(starts)} ate ${ends.toLocaleDateString('pt-BR')} ${hm(ends)}`
}

export function BlocksCard({ blocks }: { blocks: BlockRow[] }) {
  const [date, setDate] = React.useState('')
  const [fullDay, setFullDay] = React.useState(true)
  const [startTime, setStartTime] = React.useState('08:00')
  const [endTime, setEndTime] = React.useState('12:00')
  const [reason, setReason] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [busyBlock, setBusyBlock] = React.useState<string | null>(null)

  async function handleAdd() {
    if (!date) {
      toast.error('Escolha a data do bloqueio.')
      return
    }
    const startsAt = new Date(`${date}T${fullDay ? '00:00' : startTime}`)
    const endsAt = new Date(`${date}T${fullDay ? '23:59' : endTime}`)

    setSaving(true)
    const result = await criarBloqueio({
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      reason: reason || null,
    })
    setSaving(false)
    if (result.error) {
      toast.error(`Erro ao bloquear: ${result.error}`)
      return
    }
    setReason('')
    toast.success('Bloqueio adicionado.')
  }

  async function handleRemove(id: string) {
    setBusyBlock(id)
    const result = await removerBloqueio(id)
    setBusyBlock(null)
    if (result.error) toast.error(`Erro ao remover: ${result.error}`)
  }

  const upcoming = [...blocks].sort((a, b) => a.starts_at.localeCompare(b.starts_at))

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="block-date">Data</Label>
          <Input id="block-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Dia inteiro</Label>
          <div className="h-8 flex items-center">
            <Switch checked={fullDay} onCheckedChange={setFullDay} />
          </div>
        </div>
        {!fullDay && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="block-start">Inicio</Label>
              <Input id="block-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-end">Fim</Label>
              <Input id="block-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </>
        )}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="block-reason">Motivo (opcional)</Label>
          <Input
            id="block-reason"
            placeholder="Ex.: feriado, congresso, ferias"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>
      <Button type="button" onClick={handleAdd} disabled={saving}>
        <IconPlus size={16} />
        {saving ? 'Bloqueando...' : 'Bloquear periodo'}
      </Button>

      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum bloqueio cadastrado.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {upcoming.map((block) => (
            <li key={block.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{formatBlockPeriod(block)}</p>
                {block.reason && <p className="text-xs text-muted-foreground mt-0.5">{block.reason}</p>}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={busyBlock === block.id}
                onClick={() => handleRemove(block.id)}
                aria-label="Remover bloqueio"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <IconTrash size={16} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
