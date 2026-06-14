'use client'

import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const STATIC_LABELS: Record<string, string> = {
  dashboard:     'Dashboard',
  tenants:       'Tenants',
  chamados:      'Chamados',
  financeiro:    'Financeiro',
  configuracoes: 'Configurações',
  new:           'Novo',
  novo:          'Novo Tenant',
  theme:         'Tema',
}

// Labels para segmentos dinâmicos (ID), indexados pelo segmento pai
const DYNAMIC_LABELS: Record<string, string> = {
  tenants:  'Detalhes',
  chamados: 'Chamado',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getLabel(segment: string, parentSegment?: string): string {
  if (STATIC_LABELS[segment]) return STATIC_LABELS[segment]
  if (UUID_RE.test(segment) && parentSegment && DYNAMIC_LABELS[parentSegment]) {
    return DYNAMIC_LABELS[parentSegment]
  }
  return segment
}

export function NavBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  const isLeaf = (i: number) => i === segments.length - 1

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, i) => {
          const href = '/' + segments.slice(0, i + 1).join('/')
          const label = getLabel(segment, segments[i - 1])

          return (
            <span key={href} className="flex items-center gap-1.5">
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLeaf(i) ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
