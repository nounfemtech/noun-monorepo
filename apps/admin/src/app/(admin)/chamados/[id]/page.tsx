import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { IconArrowLeft, IconUser, IconRobot } from '@tabler/icons-react'
import { StatusSelect } from './status-select'
import { ReplyForm } from './reply-form'

const CATEGORY_LABELS: Record<string, string> = {
  financeiro: 'Financeiro',
  tecnico:    'Técnico',
  duvida:     'Dúvida',
  outro:      'Outro',
}

const PRIORITY_LABELS: Record<string, string> = {
  baixa:   'Baixa',
  media:   'Média',
  alta:    'Alta',
  urgente: 'Urgente',
}

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    baixa:   'bg-slate-100 text-slate-700 border-slate-200',
    media:   'bg-blue-100 text-blue-700 border-blue-200',
    alta:    'bg-orange-100 text-orange-700 border-orange-200',
    urgente: 'bg-red-100 text-red-700 border-red-200',
  }
  return <Badge className={`text-xs ${map[priority] ?? 'bg-muted'}`}>{PRIORITY_LABELS[priority] ?? priority}</Badge>
}

interface TicketDetail {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  source: string
  created_at: string
  profiles: { full_name: string | null; email: string | null } | null
  tenants:   { name: string } | null
}

interface MessageRow {
  id: string
  content: string
  is_admin: boolean
  created_at: string
  profiles: { full_name: string | null } | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

async function ChamadoContent({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const [{ data: ticket }, { data: messages }] = await Promise.all([
    supabase
      .from('support_tickets')
      .select('id, title, description, category, priority, status, source, created_at, profiles(full_name, email), tenants(name)')
      .eq('id', id)
      .single(),
    supabase
      .from('support_ticket_messages')
      .select('id, content, is_admin, created_at, profiles(full_name)')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!ticket) notFound()

  const t = ticket as unknown as TicketDetail
  const msgs = (messages ?? []) as unknown as MessageRow[]
  const opener = t.tenants?.name ?? t.profiles?.full_name ?? t.profiles?.email ?? 'Desconhecido'

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Back */}
      <Link
        href={`/chamados?tab=${t.source}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <IconArrowLeft size={14} />
        Chamados
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{t.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[t.category] ?? t.category}</Badge>
            {priorityBadge(t.priority)}
            <span className="text-xs text-muted-foreground">
              Aberto por <span className="font-medium text-foreground">{opener}</span> em {new Date(t.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <StatusSelect ticketId={t.id} current={t.status} />
        </div>
      </div>

      {/* Descrição */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Descrição</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{t.description}</p>
        </CardContent>
      </Card>

      {/* Thread de mensagens */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {msgs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma mensagem ainda.</p>
          ) : (
            msgs.map((msg, i) => (
              <div key={msg.id}>
                {i > 0 && <Separator className="mb-4" />}
                <div className={`flex gap-3 ${msg.is_admin ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs ${msg.is_admin ? 'bg-primary' : 'bg-muted'}`}>
                    {msg.is_admin
                      ? <IconRobot size={14} className="text-primary-foreground" />
                      : <IconUser size={14} className="text-muted-foreground" />
                    }
                  </div>
                  <div className={`flex-1 space-y-1 ${msg.is_admin ? 'items-end' : ''}`}>
                    <div className={`flex items-center gap-2 ${msg.is_admin ? 'justify-end' : ''}`}>
                      <span className="text-xs font-medium">
                        {msg.is_admin ? 'Suporte Noun' : (msg.profiles?.full_name ?? opener)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`rounded-lg px-3 py-2 text-sm inline-block max-w-full text-left ${msg.is_admin ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          <Separator />

          {/* Reply form */}
          <div>
            <p className="text-sm font-medium mb-3">Responder</p>
            <ReplyForm ticketId={t.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ChamadoPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4 max-w-3xl">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <ChamadoContent {...props} />
    </Suspense>
  )
}
