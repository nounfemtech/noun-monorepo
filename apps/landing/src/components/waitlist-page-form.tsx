'use client'

import { useActionState, useId } from 'react'
import { useFormStatus } from 'react-dom'
import { IconArrowRight, IconCheck, IconLoader2 } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { joinWaitlist, type WaitlistState, type WaitlistTipo } from '@/app/actions'

const initialState: WaitlistState = { status: 'idle' }

const ESTADOS = [
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' },
  { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' },
  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' },
  { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' },
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" className="group w-full" disabled={pending}>
      {pending ? (
        <IconLoader2 className="animate-spin" stroke={2} />
      ) : (
        <>
          Entrar na lista de espera
          <IconArrowRight className="transition-transform group-hover:translate-x-0.5" stroke={2} />
        </>
      )}
    </Button>
  )
}

export function WaitlistPageForm({ tipo }: { tipo: WaitlistTipo }) {
  const [state, formAction] = useActionState(joinWaitlist, initialState)
  const id = useId()

  if (state.status === 'success') {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-foreground" role="status">
        <IconCheck className="text-green-500" stroke={2} />
        {state.message}
      </p>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="tipo" value={tipo} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-nome`} className="text-sm font-medium text-foreground/90">
          Nome
        </label>
        <Input id={`${id}-nome`} name="nome" type="text" required placeholder="Seu nome completo" autoComplete="name" className="h-11" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-email`} className="text-sm font-medium text-foreground/90">
          E-mail
        </label>
        <Input id={`${id}-email`} name="email" type="email" required placeholder="seu@email.com" autoComplete="email" className="h-11" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-telefone`} className="text-sm font-medium text-foreground/90">
            Telefone
          </label>
          <Input id={`${id}-telefone`} name="telefone" type="tel" required placeholder="(00) 00000-0000" autoComplete="tel" className="h-11" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-whatsapp`} className="text-sm font-medium text-foreground/90">
            WhatsApp
          </label>
          <Input id={`${id}-whatsapp`} name="whatsapp" type="tel" required placeholder="(00) 00000-0000" autoComplete="tel" className="h-11" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-cidade`} className="text-sm font-medium text-foreground/90">
            Cidade
          </label>
          <Input id={`${id}-cidade`} name="cidade" type="text" required placeholder="Sua cidade" autoComplete="address-level2" className="h-11" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-estado`} className="text-sm font-medium text-foreground/90">
            Estado
          </label>
          <Select name="estado" required>
            <SelectTrigger id={`${id}-estado`} className="h-11">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {ESTADOS.map(({ uf }) => (
                <SelectItem key={uf} value={uf}>
                  {uf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {state.status === 'error' && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
