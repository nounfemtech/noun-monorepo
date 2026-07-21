'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { IconPlus, IconX } from '@tabler/icons-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { atualizarPerfil } from './actions'

// ── Mascara de moeda (BRL) ───────────────────────────────────────────────────

function maskMoney(v: string): string {
  const digits = v.replace(/\D/g, '').slice(0, 9)
  if (!digits) return ''
  const cents = digits.padStart(3, '0')
  const int = cents.slice(0, -2).replace(/^0+(?=\d)/, '')
  const frac = cents.slice(-2)
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${frac}`
}

function moneyToNumber(v: string): number | null {
  if (!v) return null
  return Number(v.replace(/\./g, '').replace(',', '.'))
}

function numberToMoney(n: number | null): string {
  if (n == null) return ''
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Schema ───────────────────────────────────────────────────────────────────

const perfilSchema = z.object({
  bio: z.string().max(2000, 'Maximo de 2000 caracteres'),
  price: z.string(),
  acceptsInsurance: z.boolean(),
  insurancePlans: z.array(z.string()),
})

type PerfilFormValues = z.infer<typeof perfilSchema>

// ── Helpers de layout (padrao FormRow/FieldError do admin) ───────────────────

function FormRow({
  label, description, children, htmlFor,
}: {
  label: string
  description?: string
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[220px_1fr] sm:gap-8">
      <div>
        <Label htmlFor={htmlFor} className="text-sm font-medium">{label}</Label>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="max-w-md">{children}</div>
    </div>
  )
}

function FieldError({ error }: { error?: { message?: string } }) {
  if (!error?.message) return null
  return <p className="text-xs text-destructive mt-1.5">{error.message}</p>
}

// ── Form ─────────────────────────────────────────────────────────────────────

export interface PerfilFormProps {
  initial: {
    bio: string | null
    default_consultation_price: number | null
    accepts_insurance: boolean
    accepted_insurance_plans: string[]
  }
}

export function PerfilForm({ initial }: PerfilFormProps) {
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [planInput, setPlanInput] = React.useState('')

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      bio: initial.bio ?? '',
      price: numberToMoney(initial.default_consultation_price),
      acceptsInsurance: initial.accepts_insurance,
      insurancePlans: initial.accepted_insurance_plans,
    },
  })

  const acceptsInsurance = watch('acceptsInsurance')
  const insurancePlans = watch('insurancePlans')

  function addPlan() {
    const value = planInput.trim()
    if (!value) return
    if (insurancePlans.some((p) => p.toLowerCase() === value.toLowerCase())) {
      setPlanInput('')
      return
    }
    setValue('insurancePlans', [...insurancePlans, value], { shouldDirty: true })
    setPlanInput('')
  }

  function removePlan(plan: string) {
    setValue('insurancePlans', insurancePlans.filter((p) => p !== plan), { shouldDirty: true })
  }

  async function onSubmit(values: PerfilFormValues) {
    setSaving(true)
    setFeedback(null)

    const result = await atualizarPerfil({
      bio: values.bio || null,
      default_consultation_price: moneyToNumber(values.price),
      accepts_insurance: values.acceptsInsurance,
      accepted_insurance_plans: values.insurancePlans,
    })

    setSaving(false)

    if (result.error) {
      setFeedback({ kind: 'err', msg: `Erro ao salvar: ${result.error}` })
      return
    }

    setFeedback({ kind: 'ok', msg: 'Alteracoes salvas.' })
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="divide-y divide-border">
      <FormRow
        label="Bio"
        description="Apresentacao profissional exibida no seu perfil."
        htmlFor="bio"
      >
        <Controller
          control={control}
          name="bio"
          render={({ field }) => (
            <Textarea
              id="bio"
              rows={5}
              placeholder="Conte sobre sua formacao, experiencia e abordagem de cuidado."
              {...field}
            />
          )}
        />
        <FieldError error={errors.bio} />
      </FormRow>

      <FormRow
        label="Valor de consulta"
        description="Valor padrao. Horarios especificos podem ter valor proprio na agenda."
        htmlFor="price"
      >
        <Controller
          control={control}
          name="price"
          render={({ field }) => (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                id="price"
                inputMode="numeric"
                placeholder="0,00"
                className="pl-9"
                value={field.value}
                onChange={(e) => field.onChange(maskMoney(e.target.value))}
              />
            </div>
          )}
        />
        <FieldError error={errors.price} />
      </FormRow>

      <FormRow
        label="Aceita convenio"
        description="Informe se voce atende por planos de saude."
      >
        <Controller
          control={control}
          name="acceptsInsurance"
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </FormRow>

      {acceptsInsurance && (
        <FormRow
          label="Convenios aceitos"
          description="Adicione os planos de saude que voce atende."
          htmlFor="plan-input"
        >
          <div className="flex gap-2">
            <Input
              id="plan-input"
              placeholder="Ex.: Unimed"
              value={planInput}
              onChange={(e) => setPlanInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addPlan()
                }
              }}
            />
            <Button type="button" variant="outline" size="icon-sm" onClick={addPlan} aria-label="Adicionar convenio">
              <IconPlus size={16} />
            </Button>
          </div>
          {insurancePlans.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {insurancePlans.map((plan) => (
                <Badge key={plan} variant="secondary" className="gap-1 pr-1">
                  {plan}
                  <button
                    type="button"
                    onClick={() => removePlan(plan)}
                    aria-label={`Remover ${plan}`}
                    className="rounded-sm hover:text-foreground"
                  >
                    <IconX size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </FormRow>
      )}

      <div className="flex items-center gap-3 pt-5">
        <Button type="submit" disabled={saving || !isDirty}>
          {saving ? 'Salvando...' : 'Salvar alteracoes'}
        </Button>
        {feedback && (
          <p className={feedback.kind === 'ok' ? 'text-sm text-muted-foreground' : 'text-sm text-destructive'}>
            {feedback.msg}
          </p>
        )}
      </div>
    </form>
  )
}
