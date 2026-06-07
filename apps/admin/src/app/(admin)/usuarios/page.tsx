import { Suspense } from 'react'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { IconUsers } from '@tabler/icons-react'

const PAGE_SIZE = 20

interface ProfileRow {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  is_active: boolean | null
  created_at: string
  tenants: { name: string } | null
}

function roleBadge(role: string | null) {
  switch (role) {
    case 'patient':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Paciente</Badge>
    case 'doctor':
      return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Médico(a)</Badge>
    case 'nutritionist':
      return <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-xs">Nutricionista</Badge>
    case 'psychologist':
      return <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">Psicólogo(a)</Badge>
    case 'pharmacist':
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">Farmacêutico(a)</Badge>
    case 'attendant':
      return <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">Atendente</Badge>
    case 'noun_admin':
      return <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs">Admin Noun</Badge>
    default:
      return <Badge variant="secondary" className="text-xs">{role ?? '—'}</Badge>
  }
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

interface PageProps {
  searchParams: Promise<{ page?: string; role?: string; search?: string }>
}

async function UsuariosContent({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const role = params.role === 'all' ? '' : (params.role ?? '')
  const search = params.search ?? ''

  const supabase = await createSupabaseServer()

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at, tenants(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (role) {
    query = query.eq('role', role)
  }

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, count } = await query

  const profiles = (data ?? []) as unknown as ProfileRow[]
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const roles = [
    { value: 'all', label: 'Todos os perfis' },
    { value: 'patient', label: 'Paciente' },
    { value: 'doctor', label: 'Médico(a)' },
    { value: 'nutritionist', label: 'Nutricionista' },
    { value: 'psychologist', label: 'Psicólogo(a)' },
    { value: 'pharmacist', label: 'Farmacêutico(a)' },
    { value: 'attendant', label: 'Atendente' },
    { value: 'noun_admin', label: 'Admin Noun' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Usuários</h1>
          <p className="text-muted-foreground text-sm">
            {total.toLocaleString('pt-BR')} usuário{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <Input
            name="search"
            placeholder="Buscar por nome ou e-mail..."
            defaultValue={search}
          />
        </div>
        <div>
          <Select name="role" defaultValue={role || 'all'}>
            <SelectTrigger className="h-10 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {(role || search) && (
          <Link href="/usuarios">
            <Button variant="ghost" type="button">
              Limpar
            </Button>
          </Link>
        )}
      </form>

      {/* Tabela */}
      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <IconUsers size={40} className="mb-3 opacity-40" />
          <p className="text-sm">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-muted">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{profile.full_name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{profile.email ?? '—'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{roleBadge(profile.role)}</TableCell>
                  <TableCell>
                    {profile.is_active !== false ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Ativo</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {profile.tenants?.name ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/usuarios/${profile.id}`}>
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
                href={`/usuarios?page=${page - 1}${role ? `&role=${role}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
              >
                <Button variant="outline" size="sm">
                  Anterior
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/usuarios?page=${page + 1}${role ? `&role=${role}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
              >
                <Button variant="outline" size="sm">
                  Próxima
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function UsuariosPage(props: PageProps) {
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
      <UsuariosContent {...props} />
    </Suspense>
  )
}
