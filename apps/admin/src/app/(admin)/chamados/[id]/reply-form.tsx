'use client'

import { useRef, useTransition } from 'react'
import { IconSend } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { sendReply } from './actions'

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const content = ref.current?.value.trim()
    if (!content) return

    startTransition(async () => {
      await sendReply(ticketId, content)
      if (ref.current) ref.current.value = ''
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        ref={ref}
        required
        rows={3}
        placeholder="Escreva sua resposta..."
        disabled={pending}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 resize-none"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          <IconSend size={14} />
          {pending ? 'Enviando...' : 'Responder'}
        </Button>
      </div>
    </form>
  )
}
