import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { IconArrowLeft } from '@tabler/icons-react'
import { TenantActions } from './tenant-actions'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface TenantRow {
  id: string
  name: string
  legal_name: string | null
  cnpj: string | null
  type: string
  status: string
  crm_number: string | null
  crf_number: string | null
  plan: string | null
  contract_signed_at: string | null
  settings: { commission_rate?: number } | null
  created_at: string
}

interface ProfileRow {
  id: string
  full_name: string | null
  role: string | null
  email: string | null
  is_active: boolean | null
}

function formatCNPJ(cnpj: string | null): string {
  if (!cnpj) return '—'
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14) return cnpj
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

function statusBadge(status: string) {
  switch (status) {
    case 'active': return <Badge className="bg-green-100 text-green-700 border-green-200">Ativo</Badge>
    case 'pending_approval': return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pendente aprovação</Badge>
    case 'suspended': return <Badge className="bg-red-100 text-red-700 border-red-200">Suspenso</Badge>
    default: return <Badge variant="secondary">{status}</Badge>
  }
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

function roleName(role: string | null): string {
  switch (role) {
    case 'doctor': return 'Médico(a)'
    case 'nutritionist': return 'Nutricionista'
    case 'psychologist': return 'Psicólogo(a)'
    case 'pharmacist': return 'Farmacêutico(a)'
    case 'attendant': return 'Atendente'
    default: return role ?? '—'
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TenantDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const { data: tenantData } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single()

  if (!tenantData) notFound()

  const tenant = tenantData as unknown as TenantRow

  const [professionalsRes, appointmentsRes, earningsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, email, is_active')
      .eq('tenant_id', id)
      .neq('role', 'patient'),
    supabase
      .from('appointments')
      .select('price')
      .eq('tenant_id', id)
      .eq('status', 'completed'),
    supabase
      .from('professional_earnings')
      .select('noun_fee')
      .eq('tenant_id', id),
  ])

  const professionals = (professionalsRes.data ?? []) as ProfileRow[]
  const gmvTotal = (appointmentsRes.data ?? []).reduce((s, r) => s + (r.price ?? 0), 0)
  const nounRevenue = (earningsRes.data ?? []).reduce((s, r) => s + (r.noun_fee ?? 0), 0)
  const appointmentsCount = appointmentsRes.data?.length ?? 0
  const avgTicket = appointmentsCount > 0 ? gmvTotal / appointmentsCount : 0

  const commissionRate = tenant.settings?.commission_rate ?? null

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Voltar */}
      <Link href="/tenants">
        <Button variant="ghost" className="gap-2">
          <IconArrowLeft size={16} />
          Voltar para Tenants
        </Button>
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-semibold">{tenant.name}</h2>
                <Badge
                  className={
                    tenant.type === 'clinic'
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-orange-100 text-orange-700 border-orange-200'
                  }
                >
                  {tenant.type === 'clinic' ? 'Clínica' : 'Farmácia'}
                </Badge>
                {statusBadge(tenant.status)}
              </div>
              {tenant.legal_name && (
                <p className="text-muted-foreground text-sm mt-1">{tenant.legal_name}</p>
              )}
            </div>
            <TenantActions tenantId={tenant.id} currentStatus={tenant.status} currentCommissionRate={commissionRate} />
          </div>
        </CardContent>
      </Card>

      {/* Grid de informações */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Dados cadastrais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados cadastrais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">CNPJ</p>
              <p className="text-sm font-mono">{formatCNPJ(tenant.cnpj)}</p>
            </div>
            <Separator />
            {tenant.crm_number && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">CRM</p>
                  <p className="text-sm">{tenant.crm_number}</p>
                </div>
                <Separator />
              </>
            )}
            {tenant.crf_number && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">CRF</p>
                  <p className="text-sm">{tenant.crf_number}</p>
                </div>
                <Separator />
              </>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Taxa de comissão</p>
              <p className="text-sm font-semibold">
                {commissionRate != null ? `${commissionRate}%` : '—'}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Contrato assinado em</p>
              <p className="text-sm">
                {tenant.contract_signed_at
                  ? new Date(tenant.contract_signed_at).toLocaleDateString('pt-BR')
                  : '—'}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Plano</p>
              <p className="text-sm">{tenant.plan ?? '—'}</p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Cadastrado em</p>
              <p className="text-sm">{new Date(tenant.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Métricas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Métricas financeiras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">GMV acumulado (consultas)</p>
              <p className="text-xl font-bold text-green-700">{brl.format(gmvTotal)}</p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Receita Noun</p>
              <p className="text-xl font-bold text-violet-700">{brl.format(nounRevenue)}</p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Nº de consultas concluídas</p>
              <p className="text-xl font-bold">{appointmentsCount}</p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Ticket médio</p>
              <p className="text-xl font-bold">{brl.format(avgTicket)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profissionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Profissionais ({professionals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {professionals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum profissional associado.</p>
          ) : (
            <div className="space-y-3">
              {professionals.map((pro) => (
                <div key={pro.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-muted">
                      {getInitials(pro.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{pro.full_name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{pro.email ?? '—'}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {roleName(pro.role)}
                  </Badge>
                  {pro.is_active === false && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Inativo</Badge>
                  )}
                  <Link href={`/usuarios/${pro.id}`}>
                    <Button variant="ghost" className="text-xs">Ver</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
