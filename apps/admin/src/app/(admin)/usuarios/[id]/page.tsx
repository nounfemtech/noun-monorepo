import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { IconArrowLeft, IconCalendarCheck } from '@tabler/icons-react'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface TenantRow {
  id: string
  name: string
  type: string
  status: string
  cnpj: string | null
}

interface ProfileRow {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  is_active: boolean | null
  created_at: string
  tenant_id: string | null
  tenants: TenantRow | null
}

interface AppointmentRow {
  id: string
  price: number | null
  status: string | null
  type: string | null
  created_at: string
}

function roleBadge(role: string | null) {
  switch (role) {
    case 'patient': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Paciente</Badge>
    case 'doctor': return <Badge className="bg-green-100 text-green-700 border-green-200">Médico(a)</Badge>
    case 'nutritionist': return <Badge className="bg-teal-100 text-teal-700 border-teal-200">Nutricionista</Badge>
    case 'psychologist': return <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Psicólogo(a)</Badge>
    case 'pharmacist': return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Farmacêutico(a)</Badge>
    case 'attendant': return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Atendente</Badge>
    case 'noun_admin': return <Badge className="bg-violet-100 text-violet-700 border-violet-200">Admin Noun</Badge>
    default: return <Badge variant="secondary">{role ?? '—'}</Badge>
  }
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

function formatCNPJ(cnpj: string | null): string {
  if (!cnpj) return '—'
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14) return cnpj
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function UsuarioDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at, tenant_id, tenants(id, name, type, status, cnpj)')
    .eq('id', id)
    .single()

  if (!profileData) notFound()

  const profile = profileData as unknown as ProfileRow

  const isPatient = profile.role === 'patient'
  const isProfessional = ['doctor', 'nutritionist', 'psychologist', 'pharmacist'].includes(profile.role ?? '')

  let appointments: AppointmentRow[] = []
  try {
    if (isPatient) {
      const { data } = await supabase
        .from('appointments')
        .select('id, price, status, type, created_at')
        .eq('patient_id', id)
        .order('created_at', { ascending: false })
        .limit(10)
      appointments = (data ?? []) as AppointmentRow[]
    } else if (isProfessional) {
      const { data } = await supabase
        .from('appointments')
        .select('id, price, status, type, created_at')
        .eq('doctor_id', id)
        .order('created_at', { ascending: false })
        .limit(10)
      appointments = (data ?? []) as AppointmentRow[]
    }
  } catch {
    // sem dados
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Voltar */}
      <Link href="/usuarios">
        <Button variant="ghost" className="gap-2">
          <IconArrowLeft size={16} />
          Voltar para Usuários
        </Button>
      </Link>

      {/* Header do perfil */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-violet-100 text-violet-700">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-semibold">{profile.full_name ?? 'Sem nome'}</h2>
                {roleBadge(profile.role)}
                {profile.is_active !== false ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">Ativo</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 border-red-200">Inativo</Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">{profile.email ?? '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Cadastrado em {new Date(profile.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de informações */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Dados básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">ID</p>
              <p className="text-sm font-mono">{profile.id}</p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">E-mail</p>
              <p className="text-sm">{profile.email ?? '—'}</p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Perfil</p>
              <div className="mt-1">{roleBadge(profile.role)}</div>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <div className="mt-1">
                {profile.is_active !== false ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">Ativo</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 border-red-200">Inativo</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenant info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tenant associado</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.tenants ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="text-sm font-medium">{profile.tenants.name}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">CNPJ</p>
                  <p className="text-sm font-mono">{formatCNPJ(profile.tenants.cnpj)}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <Badge
                    className={
                      profile.tenants.type === 'clinic'
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-orange-100 text-orange-700 border-orange-200'
                    }
                  >
                    {profile.tenants.type === 'clinic' ? 'Clínica' : 'Farmácia'}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    className={
                      profile.tenants.status === 'active'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : profile.tenants.status === 'suspended'
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                    }
                  >
                    {profile.tenants.status === 'active'
                      ? 'Ativo'
                      : profile.tenants.status === 'suspended'
                      ? 'Suspenso'
                      : 'Pendente'}
                  </Badge>
                </div>
                <div className="pt-2">
                  <Link href={`/tenants/${profile.tenants.id}`}>
                    <Button variant="outline">
                      Ver tenant
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum tenant associado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consultas */}
      {(isPatient || isProfessional) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IconCalendarCheck size={16} />
              {isPatient ? 'Últimas consultas (como paciente)' : 'Últimas consultas (como profissional)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma consulta encontrada.</p>
            ) : (
              <div className="space-y-2">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{appt.type ?? 'Consulta'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appt.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {brl.format(appt.price ?? 0)}
                      </p>
                      <Badge
                        className={
                          appt.status === 'completed'
                            ? 'bg-green-100 text-green-700 border-green-200 text-xs'
                            : appt.status === 'cancelled'
                            ? 'bg-red-100 text-red-700 border-red-200 text-xs'
                            : 'bg-blue-100 text-blue-700 border-blue-200 text-xs'
                        }
                      >
                        {appt.status === 'completed'
                          ? 'Concluída'
                          : appt.status === 'cancelled'
                          ? 'Cancelada'
                          : 'Agendada'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
