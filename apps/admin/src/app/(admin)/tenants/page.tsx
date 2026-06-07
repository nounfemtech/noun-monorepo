import { Suspense } from 'react'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

const PAGE_SIZE = 20

interface TenantRow {
  id: string
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
    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Clínica</Badge>
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
  searchParams: Promise<{ page?: string; type?: string; status?: string }>
}

async function TenantsContent({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const type = params.type === 'all' ? '' : (params.type ?? '')
  const status = params.status === 'all' ? '' : (params.status ?? '')

  const supabase = await createSupabaseServer()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('tenants')
    .select('id, name, legal_name, cnpj, type, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)

  const { data, count } = await query

  const tenants = (data ?? []) as TenantRow[]
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-muted-foreground text-sm">
            {total.toLocaleString('pt-BR')} tenant{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/tenants/new">
          <Button className="gap-2">
            <IconPlus size={16} />
            Novo tenant
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3 items-end">
        <div>
          <Select name="type" defaultValue={type || 'all'}>
            <SelectTrigger className="h-10 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="clinic">Clínica</SelectItem>
              <SelectItem value="pharmacy">Farmácia</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select name="status" defaultValue={status || 'all'}>
            <SelectTrigger className="h-10 w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="pending_approval">Pendente</SelectItem>
              <SelectItem value="suspended">Suspenso</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {(type || status) && (
          <Link href="/tenants">
            <Button variant="ghost" type="button">
              Limpar
            </Button>
          </Link>
        )}
      </form>

      {/* Tabela */}
      {tenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <IconBuilding size={40} className="mb-3 opacity-40" />
          <p className="text-sm">Nenhum tenant encontrado</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
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
                      <Button variant="ghost" size="sm" className="text-xs">
                        Ver
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/tenants?page=${page - 1}${type ? `&type=${type}` : ''}${status ? `&status=${status}` : ''}`}
              >
                <Button variant="outline" size="sm">Anterior</Button>
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/tenants?page=${page + 1}${type ? `&type=${type}` : ''}${status ? `&status=${status}` : ''}`}
              >
                <Button variant="outline" size="sm">Próxima</Button>
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
