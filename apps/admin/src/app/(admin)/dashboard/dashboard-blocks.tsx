'use client'

import { useState, type ReactNode } from 'react'
import { IconArrowRight, IconArrowUpRight } from '@tabler/icons-react'
import { PeriodoFilter } from '@/components/periodo-filter'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

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
type StatusLevel = 'healthy' | 'warning' | 'critical' | 'inactive'

// ---------- helpers ----------

const STATUS: Record<StatusLevel, { dot: string; badge: string; label: string }> = {
  healthy:  {
    dot:   'bg-green-500',
    badge: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400',
    label: 'Saudável',
  },
  warning:  {
    dot:   'bg-yellow-400',
    badge: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-400',
    label: 'Atenção',
  },
  critical: {
    dot:   'bg-red-500',
    badge: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400',
    label: 'Crítico',
  },
  inactive: {
    dot:   'bg-border',
    badge: '',
    label: 'Inativo',
  },
}

function BlockHeader({ title, description, filter }: { title: string; description: string; filter: ReactNode }) {
  return (
    <div className="space-y-1">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      {filter}
    </div>
  )
}

// Gauge de arco — semicírculo de 180°, percorrido de esquerda para direita pelo topo
function ArcGauge({ pct }: { pct: number }) {
  const c = Math.min(100, Math.max(0, pct))
  // ângulo em radianos: 180° no início, 0° no fim (para converter: θ = π*(1−c/100))
  const θ = Math.PI * (1 - c / 100)
  const ex = (60 + 50 * Math.cos(θ)).toFixed(2)
  const ey = (60 - 50 * Math.sin(θ)).toFixed(2)
  return (
    <svg viewBox="0 0 120 68" className="w-36 h-20" aria-hidden>
      {/* trilha de fundo */}
      <path
        d="M 10,60 A 50,50 0 0,1 110,60"
        fill="none"
        strokeLinecap="round"
        strokeWidth="10"
        style={{ stroke: 'hsl(var(--border))' }}
      />
      {/* arco preenchido */}
      {c > 0.5 && (
        <path
          d={`M 10,60 A 50,50 0 0,1 ${ex},${ey}`}
          fill="none"
          strokeLinecap="round"
          strokeWidth="10"
          style={{ stroke: 'hsl(var(--primary))' }}
        />
      )}
    </svg>
  )
}

function SemaphoreItem({ value, label, status }: { value: string; label: string; status: StatusLevel }) {
  const s = STATUS[status]
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card px-5 py-4">
      <div className={cn('h-3.5 w-3.5 shrink-0 rounded-full', s.dot)} />
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      {s.badge
        ? <Badge variant="outline" className={cn('shrink-0 text-xs', s.badge)}>{s.label}</Badge>
        : <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">{s.label}</Badge>
      }
    </div>
  )
}

// ---------- componente principal ----------

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

  const conversionRate =
    b2.scheduled > 0 ? Math.round((b2.completed / b2.scheduled) * 1000) / 10 : 0

  const takeRate =
    b5.earn_gmv > 0 ? Math.round((b5.earn_fee / b5.earn_gmv) * 1000) / 10 : 0

  // status do semáforo
  const tenantsStatus: StatusLevel  = b4.active_tenants > 0 ? 'healthy' : 'inactive'
  const churnStatus: StatusLevel     = data.churned_tenants > 0 ? 'critical' : 'healthy'

  // barras horizontais (canal clínico vs farmácia)
  const farmaciaRevenue  = 0 // dados de fee de farmácia ainda não implementados
  const maxRevenue       = Math.max(b5.earn_fee, farmaciaRevenue, 0.01)
  const clinicoPctBar    = (b5.earn_fee / maxRevenue) * 100
  const farmaciaPctBar   = (farmaciaRevenue / maxRevenue) * 100

  return (
    <>
      {/* ================================================================
          BLOCO 1 — Crescimento e engajamento
          Stat row horizontal: 3 números sem card, separadores verticais
      ================================================================ */}
      <div className="space-y-4">
        <BlockHeader
          title="Crescimento e engajamento"
          description="Evolução da base de pacientes e engajamento com a plataforma"
          filter={<PeriodoFilter value={p1} onChange={(v) => setP1(v as PeriodKey)} />}
        />
        <div className="flex items-stretch">
          <div className="flex-1 py-7 text-center">
            <p className="text-4xl font-bold tabular-nums">{b1.new_patients.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-muted-foreground mt-1.5">Novos pacientes</p>
          </div>
          <Separator orientation="vertical" />
          <div className="flex-1 py-7 text-center">
            <p className="text-4xl font-bold tabular-nums">{data.retention_rate}%</p>
            <p className="text-sm text-muted-foreground mt-1.5">Taxa de retenção</p>
          </div>
          <Separator orientation="vertical" />
          <div className="flex-1 py-7 text-center">
            <p className="text-4xl font-bold tabular-nums">{b1.active_patients.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-muted-foreground mt-1.5">Pacientes ativos</p>
          </div>
        </div>
      </div>

      {/* ================================================================
          BLOCO 2 — Funil clínico
          Visual horizontal: Agendadas →(taxa%)→ Realizadas | Canceladas
      ================================================================ */}
      <div className="space-y-4">
        <BlockHeader
          title="Funil clínico"
          description="Acompanhamento do processo de agendamento e realização de consultas"
          filter={<PeriodoFilter value={p2} onChange={(v) => setP2(v as PeriodKey)} />}
        />
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="flex items-stretch">
            {/* Agendadas */}
            <div className="flex-1 flex flex-col items-center justify-center py-7 px-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Agendadas
              </p>
              <p className="text-4xl font-bold tabular-nums">{b2.scheduled.toLocaleString('pt-BR')}</p>
            </div>

            {/* Conector com taxa de conversão */}
            <div className="shrink-0 flex flex-col items-center justify-center gap-1.5 px-3">
              <span className="text-xs font-bold text-primary leading-none">{conversionRate}%</span>
              <IconArrowRight size={16} className="text-muted-foreground" />
            </div>

            {/* Realizadas */}
            <div className="flex-1 flex flex-col items-center justify-center py-7 px-4 bg-primary/5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Realizadas
              </p>
              <p className="text-4xl font-bold tabular-nums">{b2.completed.toLocaleString('pt-BR')}</p>
            </div>

            {/* Divisor vertical */}
            <Separator orientation="vertical" className="mx-2" />

            {/* Canceladas */}
            <div className="flex-1 flex flex-col items-center justify-center py-7 px-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Canceladas
              </p>
              <p className="text-4xl font-bold tabular-nums text-destructive">{b2.cancelled.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          {/* Tempo até 1ª consulta */}
          <div className="border-t bg-muted/40 px-5 py-3 flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Tempo médio até a 1ª consulta:</p>
            <p className="text-sm font-semibold">
              {b2.avg_days_to_first !== null
                ? `${b2.avg_days_to_first.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias`
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================
          BLOCO 3 — Farmácia
          2 stats acima (totais) + tabela de farmácias por volume
      ================================================================ */}
      <div className="space-y-4">
        <BlockHeader
          title="Farmácia"
          description="Volume de pedidos e performance das farmácias parceiras"
          filter={<PeriodoFilter value={p3} onChange={(v) => setP3(v as PeriodKey)} />}
        />

        {/* Stats globais do período */}
        <div className="flex items-stretch">
          <div className="flex-1 py-6 text-center">
            <p className="text-3xl font-bold tabular-nums">{b3.orders_total.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-muted-foreground mt-1">Pedidos realizados</p>
          </div>
          <Separator orientation="vertical" />
          <div className="flex-1 py-6 text-center">
            <p className="text-3xl font-bold tabular-nums">{brl.format(b3.avg_ticket)}</p>
            <p className="text-sm text-muted-foreground mt-1">Ticket médio</p>
          </div>
        </div>

        {/* Tabela de farmácias */}
        {b3.top_pharmacies.length === 0 ? (
          <div className="rounded-lg border bg-card px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma farmácia ativa no período</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmácia</TableHead>
                  <TableHead className="text-right">Pedidos realizados</TableHead>
                  <TableHead className="text-right">Pedidos entregues</TableHead>
                  <TableHead className="text-right">Ticket médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {b3.top_pharmacies.map((ph) => (
                  <TableRow key={ph.pharmacy_id}>
                    <TableCell className="font-medium">{ph.pharmacy_name}</TableCell>
                    <TableCell className="text-right tabular-nums">{ph.order_count}</TableCell>
                    <TableCell className="text-right text-muted-foreground">—</TableCell>
                    <TableCell className="text-right text-muted-foreground">—</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ================================================================
          BLOCO 4 — Saúde da plataforma
          Semáforos: indicadores com badge de status colorido
      ================================================================ */}
      <div className="space-y-4">
        <BlockHeader
          title="Saúde da plataforma"
          description="Atividade e engajamento dos tenants cadastrados na plataforma"
          filter={<PeriodoFilter value={p4} onChange={(v) => setP4(v as PeriodKey)} />}
        />
        <div className="grid gap-3">
          <SemaphoreItem
            value={b4.active_tenants.toLocaleString('pt-BR')}
            label="Tenants ativos"
            status={tenantsStatus}
          />
          <SemaphoreItem
            value="0"
            label="Profissionais com agenda"
            status="inactive"
          />
          <SemaphoreItem
            value={data.churned_tenants.toLocaleString('pt-BR')}
            label="Churn de tenants"
            status={churnStatus}
          />
        </div>
      </div>

      {/* ================================================================
          BLOCO 5 — Financeiro avançado
          Esquerda: take rate com arco | Direita: barras canal clínico vs farmácia
          Abaixo: projeção do mês com seta de tendência
      ================================================================ */}
      <div className="space-y-4">
        <BlockHeader
          title="Financeiro avançado"
          description="Análise detalhada de receita, take rate e projeções financeiras"
          filter={<PeriodoFilter value={p5} onChange={(v) => setP5(v as PeriodKey)} />}
        />

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Coluna esquerda: arco de take rate */}
          <div className="rounded-lg border bg-card flex flex-col items-center justify-center py-8 gap-1 text-center">
            <p className="text-sm font-medium text-muted-foreground">Take rate médio</p>
            <ArcGauge pct={takeRate} />
            <p className="text-4xl font-bold tabular-nums -mt-2">{takeRate}%</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Proporção da receita Noun sobre o GMV clínico
            </p>
          </div>

          {/* Coluna direita: barras horizontais por canal */}
          <div className="rounded-lg border bg-card px-6 py-6 flex flex-col justify-center gap-5">
            <p className="text-sm font-medium text-muted-foreground">Receita por canal</p>

            {/* Canal clínico */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium">Canal clínico</span>
                <span className="font-semibold tabular-nums">{brl.format(b5.earn_fee)}</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${clinicoPctBar}%` }}
                />
              </div>
            </div>

            {/* Canal farmácia */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium">Canal farmácia</span>
                <span className="font-semibold tabular-nums">{brl.format(farmaciaRevenue)}</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden bg-muted">
                <div
                  className="h-full rounded-full bg-primary/40 transition-all duration-500"
                  style={{ width: `${farmaciaPctBar}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Projeção do mês */}
        <div className="rounded-lg border bg-card px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Projeção do mês</p>
            <p className="text-xs text-muted-foreground">
              Estimativa ao final do mês, dia {daysElapsed} de {daysInMonth}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <p className="text-3xl font-bold tabular-nums">{brl.format(monthProjection)}</p>
            {monthProjection > 0
              ? <IconArrowUpRight size={22} className="text-primary" />
              : <IconArrowRight   size={22} className="text-muted-foreground" />}
          </div>
        </div>
      </div>
    </>
  )
}
