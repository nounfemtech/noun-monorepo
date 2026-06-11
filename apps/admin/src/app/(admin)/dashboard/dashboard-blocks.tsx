'use client'

import { useState } from 'react'
import { StatsCard } from '@/components/stats-card'
import { PeriodoFilter } from '@/components/periodo-filter'
import { Card, CardContent } from '@/components/ui/card'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export interface PharmacyRank {
  pharmacy_id: string
  pharmacy_name: string
  order_count: number
}

export interface BlockMetrics {
  new_patients: number
  active_patients: number
  scheduled: number
  completed: number
  cancelled: number
  avg_days_to_first: number | null
  orders_total: number
  orders_delivered: number
  avg_ticket: number
  top_pharmacies: PharmacyRank[]
  active_tenants: number
  earn_gmv: number
  earn_fee: number
}

export interface BlocksData {
  mes: BlockMetrics
  '3meses': BlockMetrics
  '6meses': BlockMetrics
  ano: BlockMetrics
  retention_rate: number
  churned_tenants: number
}

type PeriodKey = 'mes' | '3meses' | '6meses' | 'ano'

export function DashboardBlocks({
  data,
  monthProjection,
  daysElapsed,
  daysInMonth,
}: {
  data: BlocksData
  monthProjection: number
  daysElapsed: number
  daysInMonth: number
}) {
  const [p1, setP1] = useState<PeriodKey>('mes')
  const [p2, setP2] = useState<PeriodKey>('mes')
  const [p3, setP3] = useState<PeriodKey>('mes')
  const [p4, setP4] = useState<PeriodKey>('mes')
  const [p5, setP5] = useState<PeriodKey>('mes')

  const b1 = data[p1]
  const b2 = data[p2]
  const b3 = data[p3]
  const b4 = data[p4]
  const b5 = data[p5]

  const conversionRate = b2.scheduled > 0
    ? Math.round((b2.completed / b2.scheduled) * 1000) / 10
    : 0
  const takeRate = b5.earn_gmv > 0
    ? Math.round((b5.earn_fee / b5.earn_gmv) * 1000) / 10
    : 0

  return (
    <>
      {/* BLOCO 1 — Crescimento e engajamento */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Crescimento e engajamento</h2>
          <p className="text-sm text-muted-foreground">Evolução da base de pacientes e engajamento com a plataforma</p>
          <PeriodoFilter value={p1} onChange={(v) => setP1(v as PeriodKey)} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard title="Novos pacientes"  value={b1.new_patients.toLocaleString('pt-BR')}    description="Pacientes que se cadastraram no período" />
          <StatsCard title="Taxa de retenção" value={`${data.retention_rate}%`}                  description="Pacientes com pelo menos 2 consultas concluídas" />
          <StatsCard title="Pacientes ativos" value={b1.active_patients.toLocaleString('pt-BR')} description="Com consulta ou pedido registrado no período" />
        </div>
      </div>

      {/* BLOCO 2 — Funil clínico */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Funil clínico</h2>
          <p className="text-sm text-muted-foreground">Acompanhamento do processo de agendamento e realização de consultas</p>
          <PeriodoFilter value={p2} onChange={(v) => setP2(v as PeriodKey)} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard title="Consultas agendadas"   value={b2.scheduled.toLocaleString('pt-BR')} description="Agendamentos criados no período" />
          <StatsCard title="Consultas realizadas"  value={b2.completed.toLocaleString('pt-BR')} description="Agendamentos concluídos com sucesso" />
          <StatsCard title="Consultas canceladas"  value={b2.cancelled.toLocaleString('pt-BR')} description="Canceladas ou ausência confirmada" />
          <StatsCard title="Taxa de conversão"     value={`${conversionRate}%`}                 description="Consultas realizadas sobre agendadas" />
          <StatsCard
            title="Tempo até 1a consulta"
            value={b2.avg_days_to_first !== null
              ? `${b2.avg_days_to_first.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias`
              : '0 dias'}
            description="Média de dias entre cadastro e primeira consulta"
          />
        </div>
      </div>

      {/* BLOCO 3 — Farmácia */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Farmácia</h2>
          <p className="text-sm text-muted-foreground">Volume de pedidos e performance das farmácias parceiras</p>
          <PeriodoFilter value={p3} onChange={(v) => setP3(v as PeriodKey)} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Pedidos realizados" value={b3.orders_total.toLocaleString('pt-BR')}     description="Pedidos feitos nas farmácias parceiras" />
          <StatsCard title="Pedidos entregues"  value={b3.orders_delivered.toLocaleString('pt-BR')} description="Com confirmação de entrega ao paciente" />
          <StatsCard title="Ticket médio"       value={brl.format(b3.avg_ticket)}                   description="Valor médio por pedido no período" />
          <Card className="overflow-hidden flex flex-col">
            <CardContent className="px-4 pt-4 pb-4 flex-1">
              <p className="text-sm text-muted-foreground">Farmácias mais ativas</p>
              {b3.top_pharmacies.length === 0 ? (
                <p className="text-2xl font-bold tabular-nums mt-2">0</p>
              ) : (
                <ol className="mt-3 space-y-2">
                  {b3.top_pharmacies.map((ph, i) => (
                    <li key={ph.pharmacy_id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground shrink-0 w-3">{i + 1}</span>
                        <span className="truncate font-medium">{ph.pharmacy_name}</span>
                      </span>
                      <span className="font-semibold tabular-nums shrink-0">{ph.order_count}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
            <div className="border-t bg-muted/40 px-4 py-3">
              <p className="text-sm font-semibold">Classificadas por volume de pedidos</p>
            </div>
          </Card>
        </div>
      </div>

      {/* BLOCO 4 — Saúde da plataforma */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Saúde da plataforma</h2>
          <p className="text-sm text-muted-foreground">Atividade e engajamento dos tenants cadastrados na plataforma</p>
          <PeriodoFilter value={p4} onChange={(v) => setP4(v as PeriodKey)} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard title="Tenants ativos"           value={b4.active_tenants.toLocaleString('pt-BR')}     description="Com consulta ou pedido gerado no período" />
          <StatsCard title="Profissionais com agenda" value="0"                                             description="Com horários configurados para agendamento" />
          <StatsCard title="Churn de tenants"         value={data.churned_tenants.toLocaleString('pt-BR')}  description="Inativos nos últimos 30 dias" />
        </div>
      </div>

      {/* BLOCO 5 — Financeiro avançado */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Financeiro avançado</h2>
          <p className="text-sm text-muted-foreground">Análise detalhada de receita, take rate e projeções financeiras</p>
          <PeriodoFilter value={p5} onChange={(v) => setP5(v as PeriodKey)} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Take rate médio"        value={`${takeRate}%`}           description="Proporção da receita Noun sobre o GMV clínico" />
          <StatsCard title="Receita canal clínico"  value={brl.format(b5.earn_fee)}  description="Noun fee acumulado em consultas" />
          <StatsCard title="Receita canal farmácia" value={brl.format(0)}            description="Noun fee acumulado em pedidos de farmácia" />
          <StatsCard title="Projeção do mês"        value={brl.format(monthProjection)} description={`Estimativa de receita ao final do mês, dia ${daysElapsed} de ${daysInMonth}`} />
        </div>
      </div>
    </>
  )
}
