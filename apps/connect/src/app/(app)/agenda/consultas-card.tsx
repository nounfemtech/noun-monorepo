'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { IconCalendarPlus, IconVideo, IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PatientSearch } from './patient-search'
import { slotsForDay, MODALITY_LABELS } from './lib'
import type { RuleRow, BlockRow, ComputedSlot } from './lib'
import { criarConsulta, confirmarConsulta, cancelarConsulta } from './consultas-actions'
import type { PatientSearchResult } from '@noun/types'

export interface AppointmentRow {
  id: string
  status: string
  type: string
  telemedicine_url: string | null
  starts_at: string
  ends_at: string
  patient_name: string
  patient_email: string | null
}

const TIPO_LABELS: Record<string, string> = {
  first_visit: 'Primeira consulta',
  follow_up: 'Retorno',
  return: 'Retorno (reagendado)',
  telemedicine: 'Telemedicina',
}

const STATUS_BADGE: Record<string, { label: string; variant: 'warning' | 'info' | 'success' | 'secondary' }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  confirmed: { label: 'Confirmada', variant: 'info' },
  in_progress: { label: 'Em andamento', variant: 'info' },
  completed: { label: 'Concluida', variant: 'success' },
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function ConsultasCard({
  appointments,
  rules,
  blocks,
}: {
  appointments: AppointmentRow[]
  rules: RuleRow[]
  blocks: BlockRow[]
}) {
  const [open, setOpen] = React.useState(false)
  const [patient, setPatient] = React.useState<PatientSearchResult | null>(null)
  const [date, setDate] = React.useState('')
  const [selectedTime, setSelectedTime] = React.useState('')
  const [type, setType] = React.useState('first_visit')
  const [saving, setSaving] = React.useState(false)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const daySlots: ComputedSlot[] = React.useMemo(() => {
    if (!date) return []
    return slotsForDay(new Date(`${date}T00:00:00`), rules, blocks).filter((s) => !s.blocked)
  }, [date, rules, blocks])

  function resetForm() {
    setPatient(null)
    setDate('')
    setSelectedTime('')
    setType('first_visit')
  }

  async function handleCriar() {
    if (!patient) {
      toast.error('Selecione um paciente.')
      return
    }
    const slot = daySlots.find((s) => s.time === selectedTime)
    if (!date || !slot) {
      toast.error('Selecione uma data e um horario disponivel.')
      return
    }

    setSaving(true)
    const result = await criarConsulta({
      patientId: patient.id,
      date,
      time: slot.time,
      durationMinutes: slot.durationMinutes,
      type,
    })
    setSaving(false)

    if (result.error) {
      toast.error(`Erro ao criar consulta: ${result.error}`)
      return
    }

    toast.success('Consulta criada. Confirme para gerar o link do Meet.')
    setOpen(false)
    resetForm()
  }

  async function handleConfirmar(id: string) {
    setBusyId(id)
    const result = await confirmarConsulta(id)
    setBusyId(null)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Consulta confirmada. Evento criado no Google Calendar.')
  }

  async function handleCancelar(id: string) {
    setBusyId(id)
    const result = await cancelarConsulta(id)
    setBusyId(null)
    if (result.error) {
      toast.error(`Erro ao cancelar: ${result.error}`)
      return
    }
    toast.success('Consulta cancelada.')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setOpen(true)}>
          <IconCalendarPlus size={16} />
          Nova consulta
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) resetForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova consulta</DialogTitle>
            <DialogDescription>
              O horario precisa estar dentro da sua disponibilidade configurada e sem bloqueio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Paciente</Label>
              <PatientSearch selected={patient} onSelect={setPatient} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="consulta-date">Data</Label>
                <Input
                  id="consulta-date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value)
                    setSelectedTime('')
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Horario</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!date || daySlots.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={date ? 'Escolha o horario' : 'Escolha a data'} />
                  </SelectTrigger>
                  <SelectContent>
                    {daySlots.map((s) => (
                      <SelectItem key={s.time} value={s.time}>
                        {s.time} ({MODALITY_LABELS[s.consultationType]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {date && daySlots.length === 0 && (
                  <p className="text-xs text-muted-foreground">Sem horarios disponiveis nesta data.</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de consulta</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_visit">Primeira consulta</SelectItem>
                  <SelectItem value="follow_up">Retorno</SelectItem>
                  <SelectItem value="return">Retorno (reagendado)</SelectItem>
                  <SelectItem value="telemedicine">Telemedicina</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={handleCriar} disabled={saving}>
              {saving ? 'Criando...' : 'Criar consulta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {appointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma consulta pendente ou confirmada.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {appointments.map((appt) => {
            const badge = STATUS_BADGE[appt.status] ?? { label: appt.status, variant: 'secondary' as const }
            return (
              <li key={appt.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{appt.patient_name}</p>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateTime(appt.starts_at)} · {TIPO_LABELS[appt.type] ?? appt.type}
                  </p>
                  {appt.telemedicine_url && (
                    <a
                      href={appt.telemedicine_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <IconVideo size={12} />
                      Entrar na chamada
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {appt.status === 'pending' && (
                    <Button type="button" size="sm" disabled={busyId === appt.id} onClick={() => handleConfirmar(appt.id)}>
                      {busyId === appt.id ? 'Confirmando...' : 'Confirmar'}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={busyId === appt.id}
                    onClick={() => handleCancelar(appt.id)}
                    aria-label="Cancelar consulta"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <IconX size={16} />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
