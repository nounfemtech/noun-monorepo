'use client'

import * as React from 'react'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { criarRegra, alternarRegra, removerRegra } from './actions'
import { WEEKDAY_LABELS, MODALITY_LABELS, formatTime, type RuleRow } from './lib'

const DURACOES = [15, 20, 30, 45, 60, 90, 120]

// Form: segunda a domingo (ordem de exibicao brasileira; valor segue getDay(), 0 = domingo)
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function RulesCard({ rules }: { rules: RuleRow[] }) {
  const [weekday, setWeekday] = React.useState('1')
  const [startTime, setStartTime] = React.useState('08:00')
  const [endTime, setEndTime] = React.useState('12:00')
  const [duration, setDuration] = React.useState('30')
  const [modality, setModality] = React.useState('telemedicine')
  const [saving, setSaving] = React.useState(false)
  const [busyRule, setBusyRule] = React.useState<string | null>(null)

  async function handleAdd() {
    setSaving(true)
    const result = await criarRegra({
      weekday: Number(weekday),
      startTime,
      endTime,
      slotDurationMinutes: Number(duration),
      consultationType: modality,
    })
    setSaving(false)
    if (result.error) {
      toast.error(`Erro ao adicionar horario: ${result.error}`)
      return
    }
    toast.success('Horario adicionado.')
  }

  async function handleToggle(rule: RuleRow) {
    setBusyRule(rule.id)
    const result = await alternarRegra(rule.id, !rule.is_active)
    setBusyRule(null)
    if (result.error) toast.error(`Erro ao atualizar: ${result.error}`)
  }

  async function handleRemove(rule: RuleRow) {
    setBusyRule(rule.id)
    const result = await removerRegra(rule.id)
    setBusyRule(null)
    if (result.error) toast.error(`Erro ao remover: ${result.error}`)
  }

  const grouped = WEEKDAY_ORDER
    .map((wd) => ({ wd, items: rules.filter((r) => r.weekday === wd) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6">
      {/* Form de nova regra */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <div className="space-y-1.5">
          <Label>Dia da semana</Label>
          <Select value={weekday} onValueChange={setWeekday}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WEEKDAY_ORDER.map((wd) => (
                <SelectItem key={wd} value={String(wd)}>{WEEKDAY_LABELS[wd]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rule-start">Inicio</Label>
          <Input id="rule-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rule-end">Fim</Label>
          <Input id="rule-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Duracao</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DURACOES.map((d) => (
                <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de consulta</Label>
          <Select value={modality} onValueChange={setModality}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="telemedicine">Telemedicina</SelectItem>
              <SelectItem value="in_person">Presencial</SelectItem>
              <SelectItem value="both">Ambos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="button" onClick={handleAdd} disabled={saving}>
        <IconPlus size={16} />
        {saving ? 'Adicionando...' : 'Adicionar horario'}
      </Button>

      {/* Regras existentes agrupadas por dia */}
      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum horario recorrente configurado ainda.</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ wd, items }) => (
            <div key={wd}>
              <p className="text-sm font-medium mb-2">{WEEKDAY_LABELS[wd]}</p>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {items.map((rule) => (
                  <li key={rule.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="text-sm font-medium tabular-nums">
                      {formatTime(rule.start_time)} as {formatTime(rule.end_time)}
                    </span>
                    <Badge variant="outline">{rule.slot_duration_minutes} min</Badge>
                    <Badge variant="secondary">{MODALITY_LABELS[rule.consultation_type]}</Badge>
                    {!rule.is_active && <Badge variant="warning">Pausado</Badge>}
                    <div className="ml-auto flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        disabled={busyRule === rule.id}
                        onCheckedChange={() => handleToggle(rule)}
                        aria-label={rule.is_active ? 'Pausar horario' : 'Reativar horario'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={busyRule === rule.id}
                        onClick={() => handleRemove(rule)}
                        aria-label="Remover horario"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <IconTrash size={16} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
