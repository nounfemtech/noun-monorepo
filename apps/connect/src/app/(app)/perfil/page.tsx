import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { formatCRM, formatCRP, formatCRN, formatRQE } from '@noun/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PerfilForm } from './form'
import { AvatarUpload } from './avatar-upload'
import { DocumentosCard } from './documentos'

export const metadata = { title: 'Perfil | Noun Connect' }

const SUBTYPE_LABELS: Record<string, string> = {
  clinico_geral: 'Clinico Geral',
  endocrinologista: 'Endocrinologista',
  urologista: 'Urologista',
  ginecologista: 'Ginecologista',
  psiquiatra: 'Psiquiatra',
  psicologo: 'Psicologo(a)',
  nutricionista: 'Nutricionista',
}

// CRM/CRP/CRN conforme o role do profissional (canal specialist cobre os tres).
function formatCouncil(role: string, uf: string | null, numero: string | null): string {
  if (role === 'psychologist') return formatCRP(uf, numero)
  if (role === 'nutritionist') return formatCRN(uf, numero)
  return formatCRM(uf, numero)
}

function RoValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  )
}

export default async function PerfilPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, council_id, council_state, medical_specialty, bio, default_consultation_price, accepts_insurance, accepted_insurance_plans, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/dashboard')

  const { data: tenant } = profile.tenant_id
    ? await supabase
        .from('tenants')
        .select('code, name, subtype, rqe')
        .eq('id', profile.tenant_id)
        .single()
    : { data: null }

  const especialidade =
    (tenant?.subtype && SUBTYPE_LABELS[tenant.subtype]) ??
    profile.medical_specialty ??
    'Nao informada'

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Seus dados profissionais no Noun Connect.
        </p>
      </div>

      {/* Registro profissional: somente leitura no connect. CRM/UF/RQE sao dados
          validados no credenciamento; correcoes passam pelo time Noun via admin
          (decisao registrada em apps/connect/CLAUDE.md, secao 8). */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registro profissional</CardTitle>
          <CardDescription>
            Dados validados no credenciamento. Para corrigir, fale com o time Noun.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <RoValue label="Conselho" value={formatCouncil(profile.role, profile.council_state, profile.council_id)} />
          <RoValue label="RQE" value={formatRQE(tenant?.rqe)} />
          <RoValue label="Especialidade" value={especialidade} />
          <RoValue label="E-mail" value={profile.email ?? user.email ?? '—'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Foto de perfil</CardTitle>
          <CardDescription>Exibida na sidebar e, futuramente, para pacientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            userId={profile.id}
            userName={profile.full_name}
            initialUrl={profile.avatar_url}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados de atendimento</CardTitle>
          <CardDescription>Informacoes que voce mesmo(a) gerencia.</CardDescription>
        </CardHeader>
        <CardContent>
          <PerfilForm
            initial={{
              bio: profile.bio,
              default_consultation_price: profile.default_consultation_price,
              accepts_insurance: profile.accepts_insurance ?? false,
              accepted_insurance_plans: profile.accepted_insurance_plans ?? [],
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentos</CardTitle>
          <CardDescription>Diploma, registro profissional e certificacoes.</CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentosCard userId={profile.id} />
        </CardContent>
      </Card>
    </div>
  )
}
