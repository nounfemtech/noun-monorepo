import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'Prontuario | Noun Connect' }

const TIPO_LABELS: Record<string, string> = {
  first_visit: 'Primeira consulta',
  follow_up: 'Retorno',
  return: 'Retorno (reagendado)',
  telemedicine: 'Telemedicina',
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default async function ProntuarioPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: appointmentsRaw } = await supabase
    .from('appointments')
    .select(
      'id, type, status, availability_slots!inner(starts_at), patient:profiles!patient_id(full_name)'
    )
    .eq('doctor_id', user.id)
    .in('status', ['confirmed', 'in_progress', 'completed'])
    .order('created_at', { ascending: false })

  const appointments = (appointmentsRaw ?? []).map((row) => {
    const slot = row.availability_slots as unknown as { starts_at: string }
    const patient = row.patient as unknown as { full_name: string }
    return {
      id: row.id as string,
      type: row.type as string,
      startsAt: slot.starts_at,
      patientName: patient.full_name,
    }
  })

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Prontuario</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione uma consulta para preencher ou consultar o prontuario.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consultas</CardTitle>
          <CardDescription>Consultas confirmadas, em andamento ou concluidas.</CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma consulta confirmada ainda. Crie e confirme uma consulta na agenda primeiro.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {appointments.map((appt) => (
                <li key={appt.id}>
                  <Link
                    href={`/prontuario/${appt.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{appt.patientName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(appt.startsAt)} · {TIPO_LABELS[appt.type] ?? appt.type}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
