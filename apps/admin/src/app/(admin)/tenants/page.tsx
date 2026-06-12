import { Suspense } from 'react'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IconBuilding, IconPlus } from '@tabler/icons-react'
import { StatsCard } from '@/components/stats-card'
import { StatusFilter } from './status-filter'
import { SearchInput } from './search-input'

const PAGE_SIZE = 20

interface TenantRow {
  id: string
  code: string
  name: string
  legal_name: string | null
  cnpj: string | null
  type: string
  status: string
  created_at: string
}

function formatCNPJ(cnpj: string | null): string {
  if (!cnpj) return '—'
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14) return cnpj
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

function typeBadge(type: string) {
  return type === 'clinic' ? (
    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs whitespace-nowrap">Profissional de saúde</Badge>
  ) : (
    <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">Farmácia</Badge>
  )
}

function statusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Ativo</Badge>
    case 'pending_approval':
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Pendente</Badge>
    case 'suspended':
      return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Suspenso</Badge>
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>
  }
}

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>
}

async function TenantsContent({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const status = params.status === 'all' ? '' : (params.status ?? '')
  const q = (params.q ?? '').trim()

  const supabase = await createSupabaseServer()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('tenants')
    .select('id, code, name, legal_name, cnpj, type, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  if (q) {
    // Data no formato dd/mm/yyyy filtra pelo dia de cadastro
    const dateMatch = q.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (dateMatch) {
      const [, d, m, y] = dateMatch
      const start = Date.UTC(Number(y), Number(m) - 1, Number(d))
      const end = start + 24 * 60 * 60 * 1000
      query = query
        .gte('created_at', new Date(start).toISOString())
        .lt('created_at', new Date(end).toISOString())
    } else {
      // Texto busca em ID (code), nome, razão social e CNPJ
      const term = q.replace(/[,()%]/g, '')
      const conditions = [
        `code.ilike.%${term}%`,
        `name.ilike.%${term}%`,
        `legal_name.ilike.%${term}%`,
        `cnpj.ilike.%${term}%`,
      ]
      const digits = term.replace(/\D/g, '')
      if (digits && digits !== term) conditions.push(`cnpj.ilike.%${digits}%`)
      query = query.or(conditions.join(','))
    }
  }

  const { data, count } = await query

  // Contagens de monitoramento (toda a base, independente do filtro)
  const statusCount = (st: string) =>
    supabase
      .from('tenants')
      .select('id', { count: 'exact', head: true })
      .eq('status', st)

  const [ativosRes, pendentesRes, suspensosRes] = await Promise.all([
    statusCount('active'),
    statusCount('pending_approval'),
    statusCount('suspended'),
  ])

  const ativos = ativosRes.count ?? 0
  const pendentes = pendentesRes.count ?? 0
  const suspensos = suspensosRes.count ?? 0

  const tenants = (data ?? []) as TenantRow[]
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tenants</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie cadastros, aprovações e status dos profissionais de saúde e farmácias parceiros
          </p>
        </div>
        <Link href="/tenants/new">
          <Button className="gap-2">
            <IconPlus size={16} />
            Novo tenant
          </Button>
        </Link>
      </div>

      {/* Cards de monitoramento */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard title="Ativos" value={ativos} description="Operando normalmente" />
        <StatsCard title="Pendentes" value={pendentes} description="Aguardando aprovação" />
        <StatsCard title="Suspensos" value={suspensos} description="Acesso bloqueado" />
      </div>

      {/* Tabela */}
      <Card className="overflow-hidden">
        <CardHeader className="space-y-1 border-b py-4">
          <CardTitle className="text-base">Tenants cadastrados</CardTitle>
          <CardDescription>
            Profissionais de saúde e farmácias parceiros da plataforma
          </CardDescription>
        </CardHeader>

        {/* Action section: filtros */}
        <div className="border-b px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <StatusFilter current={status} q={q} />
          <SearchInput initial={q} status={status} />
        </div>

        {tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <IconBuilding size={40} className="mb-3 opacity-40" />
            <p className="text-sm">Nenhum tenant encontrado</p>
          </div>
        ) : (
          <Table className="[&_tr>*:first-child]:pl-6 [&_tr>*:last-child]:pr-6">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <span className="text-sm font-mono text-muted-foreground">
                      {tenant.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{tenant.name}</p>
                      {tenant.legal_name && (
                        <p className="text-xs text-muted-foreground">{tenant.legal_name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono text-muted-foreground">
                      {formatCNPJ(tenant.cnpj)}
                    </span>
                  </TableCell>
                  <TableCell>{typeBadge(tenant.type)}</TableCell>
                  <TableCell>{statusBadge(tenant.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/tenants/${tenant.id}`}>
                      <Button variant="ghost" className="text-xs">
                        Ver
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/tenants?page=${page - 1}${status ? `&status=${status}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              >
                <Button variant="outline">Anterior</Button>
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/tenants?page=${page + 1}${status ? `&status=${status}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              >
                <Button variant="outline">Próxima</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TenantsPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <TenantsContent {...props} />
    </Suspense>
  )
}
