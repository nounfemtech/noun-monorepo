'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { salvarProntuario, adicionarEvolucao, finalizarProntuario } from './actions'
import type { SaveMedicalRecordInput } from '@noun/types'

export interface RecordFormInitial {
  chiefComplaint: string | null
  historyOfIllness: string | null
  pastMedicalHistory: string | null
  familyHistory: string | null
  socialHistory: string | null
  gynecologicalHistory: string | null
  currentMedications: string | null
  allergies: string | null
  physicalExam: string | null
  diagnosis: string | null
  icd10Codes: string[] | null
  therapeuticPlan: string | null
}

export interface EvolutionRow {
  id: string
  notes: string
  createdAt: string
}

function FormField({
  label,
  value,
  onChange,
  disabled,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
  rows?: number
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </div>
  )
}

export function RecordForm({
  appointmentId,
  patientId,
  recordId,
  isFinalized,
  initial,
  initialEvolutions,
}: {
  appointmentId: string
  patientId: string
  recordId: string | null
  isFinalized: boolean
  initial: RecordFormInitial
  initialEvolutions: EvolutionRow[]
}) {
  const [fields, setFields] = React.useState({
    chiefComplaint: initial.chiefComplaint ?? '',
    historyOfIllness: initial.historyOfIllness ?? '',
    pastMedicalHistory: initial.pastMedicalHistory ?? '',
    familyHistory: initial.familyHistory ?? '',
    socialHistory: initial.socialHistory ?? '',
    gynecologicalHistory: initial.gynecologicalHistory ?? '',
    currentMedications: initial.currentMedications ?? '',
    allergies: initial.allergies ?? '',
    physicalExam: initial.physicalExam ?? '',
    diagnosis: initial.diagnosis ?? '',
    icd10Codes: (initial.icd10Codes ?? []).join(', '),
    therapeuticPlan: initial.therapeuticPlan ?? '',
  })
  const [saving, setSaving] = React.useState(false)
  const [finalizing, setFinalizing] = React.useState(false)
  const [finalized, setFinalized] = React.useState(isFinalized)
  const [evolutions, setEvolutions] = React.useState(initialEvolutions)
  const [evolutionNote, setEvolutionNote] = React.useState('')
  const [addingEvolution, setAddingEvolution] = React.useState(false)

  function set<K extends keyof typeof fields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSalvar() {
    setSaving(true)
    const input: SaveMedicalRecordInput = {
      appointmentId,
      patientId,
      chiefComplaint: fields.chiefComplaint || undefined,
      historyOfIllness: fields.historyOfIllness || undefined,
      pastMedicalHistory: fields.pastMedicalHistory || undefined,
      familyHistory: fields.familyHistory || undefined,
      socialHistory: fields.socialHistory || undefined,
      gynecologicalHistory: fields.gynecologicalHistory || undefined,
      currentMedications: fields.currentMedications || undefined,
      allergies: fields.allergies || undefined,
      physicalExam: fields.physicalExam || undefined,
      diagnosis: fields.diagnosis || undefined,
      icd10Codes: fields.icd10Codes
        ? fields.icd10Codes.split(',').map((c) => c.trim()).filter(Boolean)
        : undefined,
      therapeuticPlan: fields.therapeuticPlan || undefined,
    }

    const result = await salvarProntuario(input)
    setSaving(false)

    if (result.error) {
      toast.error(`Erro ao salvar: ${result.error}`)
      return
    }
    toast.success('Prontuario salvo.')
  }

  async function handleFinalizar() {
    if (!recordId) {
      toast.error('Salve o prontuario antes de finalizar.')
      return
    }
    setFinalizing(true)
    const result = await finalizarProntuario(recordId, appointmentId)
    setFinalizing(false)

    if (result.error) {
      toast.error(`Erro ao finalizar: ${result.error}`)
      return
    }
    setFinalized(true)
    toast.success('Prontuario finalizado. Novas alteracoes exigem uma evolucao.')
  }

  async function handleAdicionarEvolucao() {
    if (!recordId) {
      toast.error('Salve o prontuario antes de adicionar uma evolucao.')
      return
    }
    if (!evolutionNote.trim()) {
      toast.error('Escreva a evolucao antes de adicionar.')
      return
    }

    setAddingEvolution(true)
    const result = await adicionarEvolucao(recordId, evolutionNote.trim())
    setAddingEvolution(false)

    if (result.error) {
      toast.error(`Erro ao adicionar evolucao: ${result.error}`)
      return
    }

    setEvolutions((prev) => [
      { id: crypto.randomUUID(), notes: evolutionNote.trim(), createdAt: new Date().toISOString() },
      ...prev,
    ])
    setEvolutionNote('')
    toast.success('Evolucao adicionada.')
  }

  const disabled = finalized

  return (
    <div className="space-y-6">
      {finalized && (
        <Badge variant="success" className="w-fit">
          Prontuario finalizado
        </Badge>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Queixa principal" value={fields.chiefComplaint} onChange={(v) => set('chiefComplaint', v)} disabled={disabled} />
        <FormField label="Historia da doenca atual" value={fields.historyOfIllness} onChange={(v) => set('historyOfIllness', v)} disabled={disabled} />
        <FormField label="Historico patologico pregresso" value={fields.pastMedicalHistory} onChange={(v) => set('pastMedicalHistory', v)} disabled={disabled} />
        <FormField label="Historico familiar" value={fields.familyHistory} onChange={(v) => set('familyHistory', v)} disabled={disabled} />
        <FormField label="Historico social" value={fields.socialHistory} onChange={(v) => set('socialHistory', v)} disabled={disabled} />
        <FormField label="Historico ginecologico" value={fields.gynecologicalHistory} onChange={(v) => set('gynecologicalHistory', v)} disabled={disabled} />
        <FormField label="Medicacoes em uso" value={fields.currentMedications} onChange={(v) => set('currentMedications', v)} disabled={disabled} />
        <FormField label="Alergias" value={fields.allergies} onChange={(v) => set('allergies', v)} disabled={disabled} />
      </div>

      <FormField label="Exame fisico" value={fields.physicalExam} onChange={(v) => set('physicalExam', v)} disabled={disabled} rows={4} />
      <FormField label="Diagnostico" value={fields.diagnosis} onChange={(v) => set('diagnosis', v)} disabled={disabled} rows={2} />

      <div className="space-y-1.5">
        <Label>Codigos CID-10 (separados por virgula)</Label>
        <Input
          value={fields.icd10Codes}
          onChange={(e) => set('icd10Codes', e.target.value)}
          disabled={disabled}
          placeholder="Ex.: E66.9, I10"
        />
      </div>

      <FormField label="Plano terapeutico" value={fields.therapeuticPlan} onChange={(v) => set('therapeuticPlan', v)} disabled={disabled} rows={4} />

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSalvar} disabled={saving || disabled}>
          {saving ? 'Salvando...' : 'Salvar prontuario'}
        </Button>
        {!finalized && (
          <Button type="button" variant="outline" onClick={handleFinalizar} disabled={finalizing}>
            {finalizing ? 'Finalizando...' : 'Finalizar prontuario'}
          </Button>
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <Label>Evolucao</Label>
        <p className="text-xs text-muted-foreground">
          Registro incremental, disponivel mesmo apos o prontuario finalizado. Nao substitui os
          campos acima.
        </p>
        <div className="flex gap-2">
          <Textarea
            rows={2}
            value={evolutionNote}
            onChange={(e) => setEvolutionNote(e.target.value)}
            placeholder="Descreva a evolucao do paciente..."
          />
          <Button type="button" onClick={handleAdicionarEvolucao} disabled={addingEvolution} className="shrink-0">
            {addingEvolution ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </div>

        {evolutions.length > 0 && (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {evolutions.map((evo) => (
              <li key={evo.id} className="px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  {new Date(evo.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{evo.notes}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
