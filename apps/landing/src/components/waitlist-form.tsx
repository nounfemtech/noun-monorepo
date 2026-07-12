'use client'

import { useActionState, useId } from 'react'
import { useFormStatus } from 'react-dom'
import { IconArrowRight, IconCheck, IconLoader2 } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { joinWaitlist, type WaitlistState, type WaitlistTipo } from '@/app/actions'

const initialState: WaitlistState = { status: 'idle' }

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="lg" className="group h-11 shrink-0" disabled={pending}>
      {pending ? (
        <IconLoader2 className="animate-spin" stroke={2} />
      ) : (
        <>
          Entrar na lista de espera
          <IconArrowRight
            className="transition-transform group-hover:translate-x-0.5"
            stroke={2}
          />
        </>
      )}
    </Button>
  )
}

export function WaitlistForm({
  tipo,
  className,
  successClassName,
}: {
  tipo: WaitlistTipo
  className?: string
  successClassName?: string
}) {
  const [state, formAction] = useActionState(joinWaitlist, initialState)
  const id = useId()

  if (state.status === 'success') {
    return (
      <p
        className={cn(
          'flex items-center gap-2 text-sm font-medium text-foreground',
          successClassName
        )}
        role="status"
      >
        <IconCheck className="text-green-500" stroke={2} />
        {state.message}
      </p>
    )
  }

  return (
    <form action={formAction} className={cn('flex flex-col gap-2', className)} noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={id} className="sr-only">
          E-mail
        </label>
        <Input
          id={id}
          name="email"
          type="email"
          required
          placeholder="seu@email.com"
          autoComplete="email"
          className="h-11 sm:w-64"
        />
        <input type="hidden" name="tipo" value={tipo} />
        <SubmitButton />
      </div>
      {state.status === 'error' && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
    </form>
  )
}
