import { notFound, redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RecordForm, type RecordFormInitial, type EvolutionRow } from '../record-form'
import { PatientHistory } from '../patient-history'

export const metadata = { title: 'Prontuario da consulta | Noun Connect' }

interface MedicalRecordRow {
  id: string | null
  chief_complaint: string | null
  history_of_illness: string | null
  past_medical_history: string | null
  family_history: string | null
  social_history: string | null
  gynecological_history: string | null
  current_medications: string | null
  allergies: string | null
  physical_exam: string | null
  diagnosis: string | null
  icd10_codes: string[] | null
  therapeutic_plan: string | null
  is_finalized: boolean | null
}

interface EvolutionRowDb {
  id: string
  notes: string
  created_at: string
}

export default async function ProntuarioConsultaPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const { appointmentId } = await params
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: appointment } = await supabase
    .from('appointments')
    .select(
      'id, patient_id, type, availability_slots!inner(starts_at), patient:profiles!patient_id(full_name)'
    )
    .eq('id', appointmentId)
    .eq('doctor_id', user.id)
    .maybeSingle()

  if (!appointment) notFound()

  const slot = appointment.availability_slots as unknown as { starts_at: string }
  const patient = appointment.patient as unknown as { full_name: string }

  const { data: recordData } = await supabase.rpc('get_medical_record', {
    p_appointment_id: appointmentId,
  })
  const record = recordData as MedicalRecordRow | null

  let evolutions: EvolutionRow[] = []
  if (record?.id) {
    const { data: evoData } = await supabase.rpc('list_record_evolutions', { p_record_id: record.id })
    evolutions = ((evoData ?? []) as EvolutionRowDb[]).map((e) => ({
      id: e.id,
      notes: e.notes,
      createdAt: e.created_at,
    }))
  }

  const initial: RecordFormInitial = {
    chiefComplaint: record?.chief_complaint ?? null,
    historyOfIllness: record?.history_of_illness ?? null,
    pastMedicalHistory: record?.past_medical_history ?? null,
    familyHistory: record?.family_history ?? null,
    socialHistory: record?.social_history ?? null,
    gynecologicalHistory: record?.gynecological_history ?? null,
    currentMedications: record?.current_medications ?? null,
    allergies: record?.allergies ?? null,
    physicalExam: record?.physical_exam ?? null,
    diagnosis: record?.diagnosis ?? null,
    icd10Codes: record?.icd10_codes ?? null,
    therapeuticPlan: record?.therapeutic_plan ?? null,
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Prontuario · {patient.full_name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Consulta em {new Date(slot.starts_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registro da consulta</CardTitle>
          <CardDescription>
            Sem hard delete: apos finalizar, novas informacoes entram como evolucao (retencao CFM de 20 anos).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecordForm
            appointmentId={appointmentId}
            patientId={appointment.patient_id}
            recordId={record?.id ?? null}
            isFinalized={record?.is_finalized ?? false}
            initial={initial}
            initialEvolutions={evolutions}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historico com este paciente</CardTitle>
          <CardDescription>Outros prontuarios registrados por voce para este paciente.</CardDescription>
        </CardHeader>
        <CardContent>
          <PatientHistory patientId={appointment.patient_id} excludeRecordId={record?.id ?? null} />
        </CardContent>
      </Card>
    </div>
  )
}
