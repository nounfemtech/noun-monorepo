import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarView } from './calendar-view'
import { RulesCard } from './rules-card'
import { BlocksCard } from './blocks-card'
import type { BlockRow, RuleRow } from './lib'

export const metadata = { title: 'Agenda | Noun Connect' }

export default async function AgendaPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: rules }, { data: blocks }] = await Promise.all([
    supabase
      .from('availability_rules')
      .select('id, weekday, start_time, end_time, slot_duration_minutes, consultation_type, is_active')
      .eq('doctor_id', user.id)
      .order('weekday')
      .order('start_time'),
    supabase
      .from('availability_blocks')
      .select('id, starts_at, ends_at, reason')
      .eq('doctor_id', user.id)
      .gte('ends_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('starts_at'),
  ])

  const ruleRows = (rules ?? []) as RuleRow[]
  const blockRows = (blocks ?? []) as BlockRow[]

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Agenda</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure sua disponibilidade recorrente e bloqueios pontuais.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visualizacao</CardTitle>
          <CardDescription>
            Horarios calculados a partir da sua disponibilidade, ja descontando bloqueios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarView rules={ruleRows} blocks={blockRows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Disponibilidade recorrente</CardTitle>
          <CardDescription>
            Faixas de horario que se repetem toda semana. Voce pode pausar sem excluir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RulesCard rules={ruleRows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bloqueios</CardTitle>
          <CardDescription>
            Feriados, ausencias e faixas de horario indisponiveis em datas especificas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BlocksCard blocks={blockRows} />
        </CardContent>
      </Card>
    </div>
  )
}
