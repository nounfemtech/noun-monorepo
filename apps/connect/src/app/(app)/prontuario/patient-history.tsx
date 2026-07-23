import { createSupabaseServer } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'

interface RecordHistoryRow {
  id: string
  diagnosis: string | null
  is_finalized: boolean
  created_at: string
}

export async function PatientHistory({ patientId, excludeRecordId }: { patientId: string; excludeRecordId: string | null }) {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.rpc('list_patient_medical_records', { p_patient_id: patientId })

  if (error) {
    return <p className="text-sm text-destructive">Erro ao carregar historico: {error.message}</p>
  }

  const records = ((data ?? []) as RecordHistoryRow[]).filter((r) => r.id !== excludeRecordId)

  if (records.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum outro atendimento registrado com este paciente.</p>
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {records.map((record) => (
        <li key={record.id} className="px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {new Date(record.created_at).toLocaleDateString('pt-BR')}
            </p>
            {record.is_finalized && <Badge variant="success">Finalizado</Badge>}
          </div>
          <p className="text-sm mt-1">{record.diagnosis || 'Sem diagnostico registrado'}</p>
        </li>
      ))}
    </ul>
  )
}
