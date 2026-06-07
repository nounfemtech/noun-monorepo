'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'

export async function updateTicketStatus(ticketId: string, status: string) {
  const { session } = await requireAdmin()
  const supabase = await createSupabaseServer()

  await supabase
    .from('support_tickets')
    .update({ status })
    .eq('id', ticketId)

  revalidatePath(`/chamados/${ticketId}`)
  revalidatePath('/chamados')
}

export async function sendReply(ticketId: string, content: string) {
  const { session } = await requireAdmin()
  const supabase = await createSupabaseServer()

  await supabase.from('support_ticket_messages').insert({
    ticket_id: ticketId,
    sender_id: session.user.id,
    is_admin:  true,
    content:   content.trim(),
  })

  revalidatePath(`/chamados/${ticketId}`)
}
