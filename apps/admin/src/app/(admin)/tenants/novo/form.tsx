'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller, type UseFormReturn, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Alert, AlertTitle, AlertDescription, AlertActions, AlertClose } from '@/components/ui/alert'
import { IconAlertCircle } from '@tabler/icons-react'
import { createSupabaseBrowser } from '@/lib/supabase'

// ─── Constantes ────────────────────────────────────────────────────────────────

const TENANT_TYPES = [
  { value: 'farmacia',         label: 'Farmácia'                   },
  { value: 'clinico_geral',    label: 'Médico: Clínico Geral'      },
  { value: 'endocrinologista', label: 'Médico: Endocrinologista'   },
  { value: 'ginecologista',    label: 'Médico: Ginecologista'      },
  { value: 'urologista',       label: 'Médico: Urologista'         },
  { value: 'psiquiatra',       label: 'Médico: Psiquiatra'         },
  { value: 'nutrologo',        label: 'Médico: Nutrólogo'          },
  { value: 'psicologo',        label: 'Psicólogo'                  },
  { value: 'nutricionista',    label: 'Nutricionista'              },
]

const TYPE_ESPECIALIDADE: Record<string, string> = {
  endocrinologista: 'endocrinologia',
  ginecologista:    'ginecologia',
  urologista:       'urologia',
  psiquiatra:       'psiquiatria',
  nutrologo:        'nutrologia',
}

const ESPECIALIDADES = [
  { value: 'endocrinologia', label: 'Endocrinologia' },
  { value: 'ginecologia',    label: 'Ginecologia'    },
  { value: 'urologia',       label: 'Urologia'       },
  { value: 'psiquiatria',    label: 'Psiquiatria'    },
  { value: 'nutrologia',     label: 'Nutrologia'     },
]

const BANCOS = [
  { value: '001',   label: 'Banco do Brasil (001)'         },
  { value: '033',   label: 'Santander (033)'               },
  { value: '041',   label: 'Banrisul (041)'                },
  { value: '070',   label: 'BRB (070)'                     },
  { value: '077',   label: 'Inter (077)'                   },
  { value: '104',   label: 'Caixa Econômica Federal (104)' },
  { value: '208',   label: 'BTG Pactual (208)'             },
  { value: '237',   label: 'Bradesco (237)'                },
  { value: '260',   label: 'Nubank (260)'                  },
  { value: '341',   label: 'Itaú (341)'                    },
  { value: '389',   label: 'Mercantil do Brasil (389)'     },
  { value: '422',   label: 'Safra (422)'                   },
  { value: '633',   label: 'Rendimento (633)'              },
  { value: '655',   label: 'Votorantim (655)'              },
  { value: '756',   label: 'Sicoob (756)'                  },
  { value: 'outro', label: 'Outro'                         },
]

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO',
  'MA','MT','MS','MG','PA','PB','PR','PE','PI',
  'RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

const PIX_TIPOS = [
  { value: 'cpf',       label: 'CPF'             },
  { value: 'cnpj',      label: 'CNPJ'            },
  { value: 'email',     label: 'E-mail'          },
  { value: 'telefone',  label: 'Telefone'        },
  { value: 'aleatoria', label: 'Chave aleatória' },
]

// Mapeamento campo -> aba (para navegação de erro)
const TAB_FIELDS: Record<string, string[]> = {
  identificacao: [
    'tenantType', 'nomeFarmacia', 'razaoSocial', 'cnpj',
    'crfNumero', 'crfUf', 'afeCodigo', 'aeNumero',
    'nomeCompleto', 'crmNumero', 'crmUf', 'rqe', 'especialidade', 'crp', 'crn',
  ],
  fiscal:   ['fiscalType', 'cpf'],
  contato:  ['email', 'telefone', 'cep', 'logradouro', 'numeroLogradouro', 'bairro', 'cidade', 'uf'],
  bancario: ['banco', 'agencia', 'conta', 'tipoConta', 'titularNome', 'titularDocumento'],
  termos:   ['termosAceitos', 'lgpdAceita'],
}

// ─── Máscaras ──────────────────────────────────────────────────────────────────

function maskCNPJ(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2)  return d
  if (d.length <= 5)  return `${d.slice(0,2)}.${d.slice(2)}`
  if (d.length <= 8)  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`
}

function maskCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (!d) return ''
  if (d.length <= 2)  return `(${d}`
  if (d.length <= 6)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`
}

function maskCEP(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  return d.length <= 5 ? d : `${d.slice(0,5)}-${d.slice(5)}`
}

function maskCRP(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  return d.length <= 2 ? d : `${d.slice(0,2)}/${d.slice(2)}`
}

function maskDoc(v: string) {
  const d = v.replace(/\D/g, '')
  return d.length <= 11 ? maskCPF(v) : maskCNPJ(v)
}

// ─── Schema Zod ────────────────────────────────────────────────────────────────

const formSchema = z
  .object({
    tenantType: z.string().min(1, 'Selecione o tipo de tenant'),

    // Farmácia (aba 1)
    nomeFarmacia:           z.string(),
    razaoSocial:            z.string(),
    cnpj:                   z.string(),
    crfNumero:              z.string(),
    crfUf:                  z.string(),
    afeCodigo:              z.string(),
    possuiManipulacao:      z.boolean(),
    aeNumero:               z.string(),
    responsavelTecnicoNome: z.string(),
    responsavelTecnicoCrf:  z.string(),

    // Profissional (aba 1)
    nomeCompleto:  z.string(),
    crmNumero:     z.string(),
    crmUf:         z.string(),
    rqe:           z.string(),
    especialidade: z.string(),
    crp:           z.string(),
    crn:           z.string(),

    // Fiscal (aba 2)
    fiscalType: z.string(),
    cpf:        z.string(),

    // Contato (aba 3)
    email:            z.string(),
    telefone:         z.string(),
    cep:              z.string(),
    logradouro:       z.string(),
    numeroLogradouro: z.string(),
    complemento:      z.string(),
    bairro:           z.string(),
    cidade:           z.string(),
    uf:               z.string(),

    // Bancário (aba 4)
    banco:            z.string(),
    agencia:          z.string(),
    conta:            z.string(),
    tipoConta:        z.string(),
    titularNome:      z.string(),
    titularDocumento: z.string(),
    pixTipo:          z.string(),
    pixValor:         z.string(),

    // Termos (aba 5)
    termosAceitos: z.boolean(),
    lgpdAceita:    z.boolean(),
  })
  .superRefine((data, ctx) => {
    const t = data.tenantType
    if (!t) return

    const req = (path: string, msg: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: [path] })
    const dig = (v?: string) => (v ?? '').replace(/\D/g, '')

    // Aba 1: Identificação
    if (t === 'farmacia') {
      if (!data.nomeFarmacia.trim())    req('nomeFarmacia', 'Nome Fantasia é obrigatório')
      if (!data.razaoSocial.trim())     req('razaoSocial',  'Razão Social é obrigatória')
      if (dig(data.cnpj).length !== 14) req('cnpj',         'CNPJ inválido')
      if (!data.crfNumero.trim())       req('crfNumero',    'Número do CRF é obrigatório')
      if (!data.crfUf)                  req('crfUf',        'UF do CRF é obrigatória')
      if (!data.afeCodigo.trim())       req('afeCodigo',    'Código AFE é obrigatório')
      if (data.possuiManipulacao && !data.aeNumero.trim())
        req('aeNumero', 'Número AE é obrigatório quando há manipulação')
    } else {
      if (!data.nomeCompleto.trim()) req('nomeCompleto', 'Nome completo é obrigatório')

      if (t === 'psicologo') {
        if (dig(data.crp).length < 5) req('crp', 'CRP inválido')
      } else if (t === 'nutricionista') {
        if (!data.crn.trim()) req('crn', 'CRN é obrigatório')
      } else {
        // Médicos
        if (!data.crmNumero.trim()) req('crmNumero', 'Número do CRM é obrigatório')
        if (!data.crmUf)            req('crmUf',     'UF do CRM é obrigatória')
        if (t !== 'clinico_geral') {
          if (!data.especialidade) req('especialidade', 'Especialidade é obrigatória')
          if (!data.rqe.trim())    req('rqe',           'RQE é obrigatório')
        }
      }

      // Aba 2: Fiscal (profissionais)
      if (!data.fiscalType) req('fiscalType', 'Tipo de faturamento é obrigatório')
      if (data.fiscalType === 'pf') {
        if (dig(data.cpf).length !== 11) req('cpf', 'CPF inválido')
      } else if (data.fiscalType === 'pj') {
        if (dig(data.cnpj).length !== 14) req('cnpj', 'CNPJ inválido')
        if (!data.razaoSocial.trim())     req('razaoSocial', 'Razão Social é obrigatória')
      }
    }

    // Aba 3: Contato
    if (!data.email.trim())
      req('email', 'E-mail é obrigatório')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
      req('email', 'E-mail inválido')
    if (dig(data.telefone).length < 10)  req('telefone',         'Telefone inválido')
    if (dig(data.cep).length !== 8)       req('cep',              'CEP inválido')
    if (!data.logradouro.trim())          req('logradouro',       'Logradouro é obrigatório')
    if (!data.numeroLogradouro.trim())    req('numeroLogradouro', 'Número é obrigatório')
    if (!data.bairro.trim())              req('bairro',           'Bairro é obrigatório')
    if (!data.cidade.trim())              req('cidade',           'Cidade é obrigatória')
    if (!data.uf)                         req('uf',               'UF é obrigatória')

    // Aba 4: Bancário
    if (!data.banco)                req('banco',             'Banco é obrigatório')
    if (!data.agencia.trim())       req('agencia',           'Agência é obrigatória')
    if (!data.conta.trim())         req('conta',             'Conta é obrigatória')
    if (!data.tipoConta)            req('tipoConta',         'Tipo de conta é obrigatório')
    if (!data.titularNome.trim())   req('titularNome',       'Nome do titular é obrigatório')
    if (!dig(data.titularDocumento)) req('titularDocumento', 'CPF/CNPJ do titular é obrigatório')

    // Aba 5: Termos
    if (!data.termosAceitos) req('termosAceitos', 'Aceite os Termos de Parceria Noun')
    if (!data.lgpdAceita)    req('lgpdAceita',    'Aceite a Política de Privacidade e LGPD')
  })

type FormData = z.infer<typeof formSchema>

// ─── Componentes auxiliares ────────────────────────────────────────────────────

function Field({
  label, error, className, children,
}: {
  label: string
  error?: { message?: string }
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error?.message && (
        <p className="text-xs text-destructive">{error.message}</p>
      )}
    </div>
  )
}

function ReadonlyField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="h-9 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        {value || '—'}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-1">
      {children}
    </p>
  )
}

function UfSelect({
  name, form, error,
}: {
  name: keyof FormData
  form: UseFormReturn<FormData>
  error?: { message?: string }
}) {
  return (
    <Field label="UF *" error={error}>
      <Controller
        name={name}
        control={form.control}
        render={({ field }) => (
          <Select value={field.value as string} onValueChange={field.onChange}>
            <SelectTrigger className={cn(error && 'border-destructive')}>
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((uf) => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  )
}

// ─── Aba 1: Identificação ──────────────────────────────────────────────────────

function IdentificacaoTab({ form }: { form: UseFormReturn<FormData> }) {
  const { control, watch, formState: { errors } } = form
  const tenantType        = watch('tenantType')
  const possuiManipulacao = watch('possuiManipulacao')

  const isFarmacia      = tenantType === 'farmacia'
  const isPsicologo     = tenantType === 'psicologo'
  const isNutricionista = tenantType === 'nutricionista'
  const isEspecialista  = ['endocrinologista','ginecologista','urologista','psiquiatra','nutrologo'].includes(tenantType)
  const isMedico        = isEspecialista || tenantType === 'clinico_geral'

  return (
    <div className="space-y-6">

        <Field label="Tipo de tenant *" error={errors.tenantType}>
          <Controller
            name="tenantType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={cn(errors.tenantType && 'border-destructive')}>
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {TENANT_TYPES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {/* ── Farmácia ── */}
        {isFarmacia && (
          <>
            <Separator />
            <SectionLabel>Dados da farmácia</SectionLabel>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome Fantasia *" error={errors.nomeFarmacia}>
                <Controller name="nomeFarmacia" control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Farmácia Saúde"
                      className={cn(errors.nomeFarmacia && 'border-destructive')} />
                  )}
                />
              </Field>
              <Field label="Razão Social *" error={errors.razaoSocial}>
                <Controller name="razaoSocial" control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Farmácia Saúde LTDA"
                      className={cn(errors.razaoSocial && 'border-destructive')} />
                  )}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="CNPJ *" error={errors.cnpj}>
                <Controller name="cnpj" control={control}
                  render={({ field }) => (
                    <Input {...field}
                      onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                      placeholder="00.000.000/0001-00"
                      className={cn(errors.cnpj && 'border-destructive')}
                    />
                  )}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="CRF *" error={errors.crfNumero}>
                  <Controller name="crfNumero" control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="000000"
                        className={cn(errors.crfNumero && 'border-destructive')} />
                    )}
                  />
                </Field>
                <UfSelect name="crfUf" form={form} error={errors.crfUf} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <Field label="Código AFE *" error={errors.afeCodigo}>
                <Controller name="afeCodigo" control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="000000"
                      className={cn(errors.afeCodigo && 'border-destructive')} />
                  )}
                />
              </Field>
              <div className="flex items-center gap-2 pb-0.5">
                <Controller name="possuiManipulacao" control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="possui_manipulacao"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="possui_manipulacao" className="cursor-pointer text-sm font-normal">
                  Possui laboratório de manipulação
                </Label>
              </div>
            </div>

            {possuiManipulacao && (
              <Field label="Número AE *" error={errors.aeNumero} className="max-w-xs">
                <Controller name="aeNumero" control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="000000"
                      className={cn(errors.aeNumero && 'border-destructive')} />
                  )}
                />
              </Field>
            )}

            <Separator />
            <SectionLabel>Responsável Técnico (opcional)</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome do responsável" error={errors.responsavelTecnicoNome}>
                <Controller name="responsavelTecnicoNome" control={control}
                  render={({ field }) => <Input {...field} />}
                />
              </Field>
              <Field label="CRF do responsável" error={errors.responsavelTecnicoCrf}>
                <Controller name="responsavelTecnicoCrf" control={control}
                  render={({ field }) => <Input {...field} placeholder="CRF-SP 00000" />}
                />
              </Field>
            </div>
          </>
        )}

        {/* ── Médico ── */}
        {isMedico && (
          <>
            <Separator />
            <SectionLabel>Dados do médico</SectionLabel>

            <Field label="Nome completo *" error={errors.nomeCompleto}>
              <Controller name="nomeCompleto" control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Dr. João Silva"
                    className={cn(errors.nomeCompleto && 'border-destructive')} />
                )}
              />
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Número CRM *" error={errors.crmNumero} className="col-span-2">
                <Controller name="crmNumero" control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="123456"
                      className={cn(errors.crmNumero && 'border-destructive')} />
                  )}
                />
              </Field>
              <UfSelect name="crmUf" form={form} error={errors.crmUf} />
            </div>

            {isEspecialista && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Especialidade *" error={errors.especialidade}>
                  <Controller name="especialidade" control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={cn(errors.especialidade && 'border-destructive')}>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ESPECIALIDADES.map((e) => (
                            <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="RQE *" error={errors.rqe}>
                  <Controller name="rqe" control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="12345"
                        className={cn(errors.rqe && 'border-destructive')} />
                    )}
                  />
                </Field>
              </div>
            )}
          </>
        )}

        {/* ── Psicólogo ── */}
        {isPsicologo && (
          <>
            <Separator />
            <SectionLabel>Dados do psicólogo</SectionLabel>
            <Field label="Nome completo *" error={errors.nomeCompleto}>
              <Controller name="nomeCompleto" control={control}
                render={({ field }) => (
                  <Input {...field}
                    className={cn(errors.nomeCompleto && 'border-destructive')} />
                )}
              />
            </Field>
            <Field label="CRP *" error={errors.crp} className="max-w-xs">
              <Controller name="crp" control={control}
                render={({ field }) => (
                  <Input {...field}
                    onChange={(e) => field.onChange(maskCRP(e.target.value))}
                    placeholder="06/123456"
                    className={cn(errors.crp && 'border-destructive')}
                  />
                )}
              />
            </Field>
          </>
        )}

        {/* ── Nutricionista ── */}
        {isNutricionista && (
          <>
            <Separator />
            <SectionLabel>Dados da nutricionista</SectionLabel>
            <Field label="Nome completo *" error={errors.nomeCompleto}>
              <Controller name="nomeCompleto" control={control}
                render={({ field }) => (
                  <Input {...field}
                    className={cn(errors.nomeCompleto && 'border-destructive')} />
                )}
              />
            </Field>
            <Field label="CRN *" error={errors.crn} className="max-w-xs">
              <Controller name="crn" control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="CRN-3 12345"
                    className={cn(errors.crn && 'border-destructive')} />
                )}
              />
            </Field>
          </>
        )}
      </div>
  )
}

// ─── Aba 2: Fiscal ─────────────────────────────────────────────────────────────

function FiscalTab({ form }: { form: UseFormReturn<FormData> }) {
  const { control, watch, formState: { errors } } = form
  const tenantType = watch('tenantType')
  const fiscalType = watch('fiscalType')
  const cnpjVal    = watch('cnpj')
  const razaoVal   = watch('razaoSocial')
  const isFarmacia = tenantType === 'farmacia'

  return (
    <div className="space-y-6">

        {isFarmacia ? (
          <>
            <ReadonlyField
              label="Tipo de faturamento"
              value="PJ: Pessoa Jurídica (definido automaticamente para farmácias)"
            />
            <div className="grid grid-cols-2 gap-4">
              <ReadonlyField label="CNPJ" value={cnpjVal || undefined} />
              <ReadonlyField label="Razão Social" value={razaoVal || undefined} />
            </div>
            <p className="text-xs text-muted-foreground">
              Dados preenchidos na aba Identificação. Para alterar, volte à aba anterior.
            </p>
          </>
        ) : tenantType ? (
          <>
            <Field label="Tipo de faturamento *" error={errors.fiscalType} className="max-w-sm">
              <Controller name="fiscalType" control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={cn(errors.fiscalType && 'border-destructive')}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pf">PF: Pessoa Física</SelectItem>
                      <SelectItem value="pj">PJ: Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            {fiscalType === 'pf' && (
              <Field label="CPF *" error={errors.cpf} className="max-w-xs">
                <Controller name="cpf" control={control}
                  render={({ field }) => (
                    <Input {...field}
                      onChange={(e) => field.onChange(maskCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      className={cn(errors.cpf && 'border-destructive')}
                    />
                  )}
                />
              </Field>
            )}

            {fiscalType === 'pj' && (
              <div className="space-y-4">
                <Field label="CNPJ *" error={errors.cnpj} className="max-w-xs">
                  <Controller name="cnpj" control={control}
                    render={({ field }) => (
                      <Input {...field}
                        onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                        placeholder="00.000.000/0001-00"
                        className={cn(errors.cnpj && 'border-destructive')}
                      />
                    )}
                  />
                </Field>
                <Field label="Razão Social *" error={errors.razaoSocial}>
                  <Controller name="razaoSocial" control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Clínica Saúde LTDA"
                        className={cn(errors.razaoSocial && 'border-destructive')} />
                    )}
                  />
                </Field>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Selecione o tipo de tenant na aba Identificação para continuar.
          </p>
        )}
      </div>
  )
}

// ─── Aba 3: Contato ────────────────────────────────────────────────────────────

function ContatoTab({
  form,
  cepError,
  setCepError,
}: {
  form: UseFormReturn<FormData>
  cepError: boolean
  setCepError: (v: boolean) => void
}) {
  const { control, setValue, watch, formState: { errors } } = form
  const cep = watch('cep')

  async function fetchViaCEP(raw: string, opts?: { showError?: boolean }) {
    const digits = raw.replace(/\D/g, '')
    if (digits.length !== 8) {
      if (opts?.showError) setCepError(true)
      return
    }
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepError(true)
        return
      }
      setCepError(false)
      setValue('logradouro', data.logradouro || '', { shouldValidate: true })
      setValue('bairro',     data.bairro     || '', { shouldValidate: true })
      setValue('cidade',     data.localidade || '', { shouldValidate: true })
      setValue('uf',         data.uf         || '', { shouldValidate: true })
    } catch {
      setCepError(true)
    }
  }

  return (
    <div className="space-y-6">

        <div className="grid grid-cols-2 gap-4">
          <Field label="E-mail *" error={errors.email}>
            <Controller name="email" control={control}
              render={({ field }) => (
                <Input {...field} type="email" placeholder="contato@clinica.com.br"
                  className={cn(errors.email && 'border-destructive')} />
              )}
            />
          </Field>
          <Field label="Telefone *" error={errors.telefone}>
            <Controller name="telefone" control={control}
              render={({ field }) => (
                <Input {...field}
                  onChange={(e) => field.onChange(maskPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className={cn(errors.telefone && 'border-destructive')}
                />
              )}
            />
          </Field>
        </div>

        <Separator />
        <SectionLabel>Endereço</SectionLabel>

        <Field label="CEP *" error={errors.cep} className="w-52">
          <Controller name="cep" control={control}
            render={({ field }) => (
              <InputGroup className="shadow-none">
                <InputGroupInput
                  {...field}
                  onChange={(e) => {
                    field.onChange(maskCEP(e.target.value))
                    if (cepError) setCepError(false)
                  }}
                  onBlur={(e) => fetchViaCEP(e.target.value)}
                  placeholder="00000-000"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    variant="secondary"
                    onClick={() => fetchViaCEP(field.value, { showError: true })}
                  >
                    Buscar
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            )}
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Logradouro *" error={errors.logradouro} className="col-span-2">
            <Controller name="logradouro" control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Rua, Avenida..."
                  className={cn(errors.logradouro && 'border-destructive')} />
              )}
            />
          </Field>
          <Field label="Número *" error={errors.numeroLogradouro}>
            <Controller name="numeroLogradouro" control={control}
              render={({ field }) => (
                <Input {...field} placeholder="123"
                  className={cn(errors.numeroLogradouro && 'border-destructive')} />
              )}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Complemento" error={undefined}>
            <Controller name="complemento" control={control}
              render={({ field }) => <Input {...field} placeholder="Sala 201, Apto..." />}
            />
          </Field>
          <Field label="Bairro *" error={errors.bairro}>
            <Controller name="bairro" control={control}
              render={({ field }) => (
                <Input {...field}
                  className={cn(errors.bairro && 'border-destructive')} />
              )}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Cidade *" error={errors.cidade} className="col-span-2">
            <Controller name="cidade" control={control}
              render={({ field }) => (
                <Input {...field}
                  className={cn(errors.cidade && 'border-destructive')} />
              )}
            />
          </Field>
          <Field label="UF *" error={errors.uf}>
            <Controller name="uf" control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={cn(errors.uf && 'border-destructive')}>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
      </div>
  )
}

// ─── Aba 4: Dados Bancários ────────────────────────────────────────────────────

function BancarioTab({ form }: { form: UseFormReturn<FormData> }) {
  const { control, watch, formState: { errors } } = form
  const pixTipo = watch('pixTipo')

  return (
    <div className="space-y-6">

        <div className="grid grid-cols-2 gap-4">
          <Field label="Banco *" error={errors.banco}>
            <Controller name="banco" control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={cn(errors.banco && 'border-destructive')}>
                    <SelectValue placeholder="Selecione o banco..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BANCOS.map((b) => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Tipo de conta *" error={errors.tipoConta}>
            <Controller name="tipoConta" control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={cn(errors.tipoConta && 'border-destructive')}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Conta Corrente</SelectItem>
                    <SelectItem value="poupanca">Conta Poupança</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Agência *" error={errors.agencia}>
            <Controller name="agencia" control={control}
              render={({ field }) => (
                <Input {...field} placeholder="0000"
                  className={cn(errors.agencia && 'border-destructive')} />
              )}
            />
          </Field>
          <Field label="Conta *" error={errors.conta}>
            <Controller name="conta" control={control}
              render={({ field }) => (
                <Input {...field} placeholder="00000-0"
                  className={cn(errors.conta && 'border-destructive')} />
              )}
            />
          </Field>
        </div>

        <Separator />
        <SectionLabel>Titular da conta</SectionLabel>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome do titular *" error={errors.titularNome}>
            <Controller name="titularNome" control={control}
              render={({ field }) => (
                <Input {...field}
                  className={cn(errors.titularNome && 'border-destructive')} />
              )}
            />
          </Field>
          <Field label="CPF / CNPJ do titular *" error={errors.titularDocumento}>
            <Controller name="titularDocumento" control={control}
              render={({ field }) => (
                <Input {...field}
                  onChange={(e) => field.onChange(maskDoc(e.target.value))}
                  placeholder="000.000.000-00"
                  className={cn(errors.titularDocumento && 'border-destructive')}
                />
              )}
            />
          </Field>
        </div>

        <Separator />
        <SectionLabel>PIX (opcional)</SectionLabel>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo de chave" error={undefined}>
            <Controller name="pixTipo" control={control}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    {PIX_TIPOS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          {pixTipo && (
            <Field label="Chave PIX" error={errors.pixValor}>
              <Controller name="pixValor" control={control}
                render={({ field }) => (
                  <Input {...field}
                    placeholder={
                      pixTipo === 'cpf'      ? '000.000.000-00'     :
                      pixTipo === 'cnpj'     ? '00.000.000/0001-00' :
                      pixTipo === 'email'    ? 'email@dominio.com'  :
                      pixTipo === 'telefone' ? '(11) 99999-9999'    :
                      'Chave aleatória (UUID)'
                    }
                  />
                )}
              />
            </Field>
          )}
        </div>
      </div>
  )
}

// ─── Aba 5: Termos ─────────────────────────────────────────────────────────────

function TermosTab({
  form, adminName,
}: {
  form: UseFormReturn<FormData>
  adminName: string
}) {
  const { control, formState: { errors } } = form
  const today = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="space-y-6">

        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-start gap-3">
            <Controller name="termosAceitos" control={control}
              render={({ field }) => (
                <Checkbox
                  id="termos"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5"
                />
              )}
            />
            <div className="space-y-1">
              <Label htmlFor="termos" className="cursor-pointer font-medium">
                Termos de Parceria Noun
              </Label>
              <p className="text-sm text-muted-foreground">
                O tenant declara estar ciente e de acordo com os Termos de Parceria da plataforma Noun,
                incluindo regras de operação, repasses e obrigações contratuais.
              </p>
            </div>
          </div>
          {errors.termosAceitos?.message && (
            <p className="text-xs text-destructive pl-7">{errors.termosAceitos.message}</p>
          )}
        </div>

        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-start gap-3">
            <Controller name="lgpdAceita" control={control}
              render={({ field }) => (
                <Checkbox
                  id="lgpd"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5"
                />
              )}
            />
            <div className="space-y-1">
              <Label htmlFor="lgpd" className="cursor-pointer font-medium">
                Política de Privacidade e LGPD
              </Label>
              <p className="text-sm text-muted-foreground">
                O tenant confirma o tratamento de dados conforme a Lei Geral de Proteção de Dados (LGPD),
                autorizando a Noun a processar as informações necessárias para o funcionamento da plataforma.
              </p>
            </div>
          </div>
          {errors.lgpdAceita?.message && (
            <p className="text-xs text-destructive pl-7">{errors.lgpdAceita.message}</p>
          )}
        </div>

        <div className="rounded-lg bg-muted/40 border border-dashed p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Registro de aceite
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Data e hora</p>
              <p className="text-sm font-mono">{today}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Cadastrado por</p>
              <p className="text-sm">{adminName}</p>
            </div>
          </div>
        </div>

      </div>
  )
}

const TABS = ['identificacao', 'fiscal', 'contato', 'bancario', 'termos'] as const

// ─── Tipo para edição ──────────────────────────────────────────────────────────

export interface TenantEditData {
  id: string
  status: string
  tenant_type: string | null
  nome_fantasia: string | null
  razao_social: string | null
  cnpj: string | null
  crf_numero: string | null
  crf_uf: string | null
  afe_codigo: string | null
  possui_manipulacao: boolean | null
  ae_numero: string | null
  responsavel_tecnico_nome: string | null
  responsavel_tecnico_crf: string | null
  crm_numero: string | null
  crm_uf: string | null
  rqe: string | null
  especialidade: string | null
  crp: string | null
  crn: string | null
  fiscal_type: string | null
  cpf: string | null
  email: string | null
  telefone: string | null
  cep: string | null
  logradouro: string | null
  numero_logradouro: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  banco: string | null
  agencia: string | null
  conta: string | null
  tipo_conta: string | null
  titular_nome: string | null
  titular_documento: string | null
  pix_tipo: string | null
  pix_valor: string | null
  termos_aceitos_em: string | null
}

// ─── Componente principal ──────────────────────────────────────────────────────

export function NovoTenantForm({ adminName, initialData }: { adminName: string; initialData?: TenantEditData }) {
  const router = useRouter()
  const isEdit = !!initialData

  const [loading, setLoading]         = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [draftId, setDraftId]         = useState<string | null>(initialData?.id ?? null)
  const [activeTab, setActiveTab]     = useState('identificacao')
  const [cepError, setCepError]       = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      tenantType:             initialData.tenant_type || '',
      nomeFarmacia:           initialData.tenant_type === 'farmacia' ? (initialData.nome_fantasia || '') : '',
      nomeCompleto:           initialData.tenant_type !== 'farmacia' ? (initialData.nome_fantasia || '') : '',
      razaoSocial:            initialData.razao_social || '',
      cnpj:                   initialData.cnpj ? maskCNPJ(initialData.cnpj) : '',
      crfNumero:              initialData.crf_numero || '',
      crfUf:                  initialData.crf_uf || '',
      afeCodigo:              initialData.afe_codigo || '',
      possuiManipulacao:      initialData.possui_manipulacao ?? false,
      aeNumero:               initialData.ae_numero || '',
      responsavelTecnicoNome: initialData.responsavel_tecnico_nome || '',
      responsavelTecnicoCrf:  initialData.responsavel_tecnico_crf || '',
      crmNumero:              initialData.crm_numero || '',
      crmUf:                  initialData.crm_uf || '',
      rqe:                    initialData.rqe || '',
      especialidade:          initialData.especialidade || '',
      crp:                    initialData.crp || '',
      crn:                    initialData.crn || '',
      fiscalType:             initialData.fiscal_type || '',
      cpf:                    initialData.cpf ? maskCPF(initialData.cpf) : '',
      email:                  initialData.email || '',
      telefone:               initialData.telefone ? maskPhone(initialData.telefone) : '',
      cep:                    initialData.cep ? maskCEP(initialData.cep) : '',
      logradouro:             initialData.logradouro || '',
      numeroLogradouro:       initialData.numero_logradouro || '',
      complemento:            initialData.complemento || '',
      bairro:                 initialData.bairro || '',
      cidade:                 initialData.cidade || '',
      uf:                     initialData.uf || '',
      banco:                  initialData.banco || '',
      agencia:                initialData.agencia || '',
      conta:                  initialData.conta || '',
      tipoConta:              initialData.tipo_conta || '',
      titularNome:            initialData.titular_nome || '',
      titularDocumento:       initialData.titular_documento ? maskDoc(initialData.titular_documento) : '',
      pixTipo:                initialData.pix_tipo || '',
      pixValor:               initialData.pix_valor || '',
      termosAceitos:          !!initialData.termos_aceitos_em,
      lgpdAceita:             !!initialData.termos_aceitos_em,
    } : {
      tenantType: '', nomeFarmacia: '', razaoSocial: '', cnpj: '',
      crfNumero: '', crfUf: '', afeCodigo: '', possuiManipulacao: false,
      aeNumero: '', responsavelTecnicoNome: '', responsavelTecnicoCrf: '',
      nomeCompleto: '', crmNumero: '', crmUf: '', rqe: '', especialidade: '',
      crp: '', crn: '', fiscalType: '', cpf: '',
      email: '', telefone: '', cep: '', logradouro: '', numeroLogradouro: '',
      complemento: '', bairro: '', cidade: '', uf: '',
      banco: '', agencia: '', conta: '', tipoConta: '',
      titularNome: '', titularDocumento: '', pixTipo: '', pixValor: '',
      termosAceitos: false, lgpdAceita: false,
    },
  })

  // Pré-preenche especialidade ao selecionar tipo especialista
  const tenantType = form.watch('tenantType')
  useEffect(() => {
    const esp = TYPE_ESPECIALIDADE[tenantType]
    if (esp) form.setValue('especialidade', esp, { shouldValidate: false })
  }, [tenantType]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const isFarmacia  = data.tenantType === 'farmacia'
      const displayName = isFarmacia ? data.nomeFarmacia : data.nomeCompleto
      const legalName   = isFarmacia
        ? data.razaoSocial
        : data.fiscalType === 'pj'
          ? data.razaoSocial
          : data.nomeCompleto
      const cnpjDigits  = data.cnpj.replace(/\D/g, '') || null

      const supabase = createSupabaseBrowser()
      const targetStatus = isEdit
        ? (initialData!.status === 'draft' ? 'pending' : initialData!.status)
        : 'pending'
      const insertPayload = {
        name:       displayName,
        legal_name: legalName,
        cnpj:       isFarmacia
          ? cnpjDigits
          : data.fiscalType === 'pj' ? cnpjDigits : null,
        type:     isFarmacia ? 'pharmacy' : 'clinic',
        status:   targetStatus,
        settings: {},

        tenant_type:              data.tenantType,
        fiscal_type:              isFarmacia ? 'pj' : (data.fiscalType || null),
        cpf:                      data.cpf.replace(/\D/g, '') || null,
        nome_fantasia:            isFarmacia ? data.nomeFarmacia : data.nomeCompleto,
        razao_social:             data.razaoSocial  || null,
        crm_numero:               data.crmNumero    || null,
        crm_uf:                   data.crmUf        || null,
        rqe:                      data.rqe          || null,
        especialidade:            data.especialidade || null,
        crf_numero:               data.crfNumero    || null,
        crf_uf:                   data.crfUf        || null,
        afe_codigo:               data.afeCodigo    || null,
        possui_manipulacao:       data.possuiManipulacao,
        ae_numero:                data.aeNumero     || null,
        crp:                      data.crp          || null,
        crn:                      data.crn          || null,
        responsavel_tecnico_nome: data.responsavelTecnicoNome || null,
        responsavel_tecnico_crf:  data.responsavelTecnicoCrf  || null,
        email:                    data.email,
        telefone:                 data.telefone.replace(/\D/g, '') || null,
        cep:                      data.cep.replace(/\D/g, '')      || null,
        logradouro:               data.logradouro,
        numero_logradouro:        data.numeroLogradouro,
        complemento:              data.complemento  || null,
        bairro:                   data.bairro,
        cidade:                   data.cidade,
        uf:                       data.uf,
        banco:                    data.banco,
        agencia:                  data.agencia,
        conta:                    data.conta,
        tipo_conta:               data.tipoConta,
        titular_nome:             data.titularNome,
        titular_documento:        data.titularDocumento.replace(/\D/g, '') || null,
        pix_tipo:                 data.pixTipo  || null,
        pix_valor:                data.pixValor || null,
        termos_aceitos_em:        new Date().toISOString(),
        termos_cadastrado_por:    adminName,
      }

      const { error } = draftId
        ? await supabase.from('tenants').update(insertPayload).eq('id', draftId)
        : await supabase.from('tenants').insert(insertPayload)

      if (error) throw error

      toast.success(isEdit ? 'Tenant atualizado com sucesso!' : 'Tenant cadastrado com sucesso!')
      router.push('/tenants')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error(isEdit ? 'Erro ao atualizar. Verifique os dados e tente novamente.' : 'Erro ao cadastrar. Verifique os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function onInvalid(errors: FieldErrors<FormData>) {
    const keys = Object.keys(errors)
    for (const [tab, fields] of Object.entries(TAB_FIELDS)) {
      if (fields.some((f) => keys.includes(f))) {
        setActiveTab(tab)
        break
      }
    }
    toast.error('Corrija os erros destacados e tente novamente')
  }

  async function saveDraft() {
    setSavingDraft(true)
    try {
      const data = form.getValues()
      const isFarmacia  = data.tenantType === 'farmacia'
      const displayName = isFarmacia
        ? (data.nomeFarmacia || 'Rascunho')
        : (data.nomeCompleto || 'Rascunho')
      const legalName   = isFarmacia
        ? data.razaoSocial
        : data.fiscalType === 'pj'
          ? data.razaoSocial
          : data.nomeCompleto
      const cnpjDigits  = data.cnpj.replace(/\D/g, '') || null

      const draftPayload = {
        name:       displayName,
        legal_name: legalName || null,
        cnpj:       isFarmacia
          ? cnpjDigits
          : data.fiscalType === 'pj' ? cnpjDigits : null,
        type:     isFarmacia ? 'pharmacy' : 'clinic',
        status:   'draft',
        settings: {},

        tenant_type:              data.tenantType || null,
        fiscal_type:              isFarmacia ? 'pj' : (data.fiscalType || null),
        cpf:                      data.cpf.replace(/\D/g, '') || null,
        nome_fantasia:            displayName,
        razao_social:             data.razaoSocial  || null,
        crm_numero:               data.crmNumero    || null,
        crm_uf:                   data.crmUf        || null,
        rqe:                      data.rqe          || null,
        especialidade:            data.especialidade || null,
        crf_numero:               data.crfNumero    || null,
        crf_uf:                   data.crfUf        || null,
        afe_codigo:               data.afeCodigo    || null,
        possui_manipulacao:       data.possuiManipulacao,
        ae_numero:                data.aeNumero     || null,
        crp:                      data.crp          || null,
        crn:                      data.crn          || null,
        responsavel_tecnico_nome: data.responsavelTecnicoNome || null,
        responsavel_tecnico_crf:  data.responsavelTecnicoCrf  || null,
        email:                    data.email || null,
        telefone:                 data.telefone.replace(/\D/g, '') || null,
        cep:                      data.cep.replace(/\D/g, '')      || null,
        logradouro:               data.logradouro      || null,
        numero_logradouro:        data.numeroLogradouro || null,
        complemento:              data.complemento  || null,
        bairro:                   data.bairro       || null,
        cidade:                   data.cidade       || null,
        uf:                       data.uf           || null,
        banco:                    data.banco        || null,
        agencia:                  data.agencia      || null,
        conta:                    data.conta        || null,
        tipo_conta:               data.tipoConta    || null,
        titular_nome:             data.titularNome  || null,
        titular_documento:        data.titularDocumento.replace(/\D/g, '') || null,
        pix_tipo:                 data.pixTipo  || null,
        pix_valor:                data.pixValor || null,
      }

      const supabase = createSupabaseBrowser()

      if (draftId) {
        const { error } = await supabase.from('tenants').update(draftPayload).eq('id', draftId)
        if (error) throw error
      } else {
        const { data: inserted, error } = await supabase
          .from('tenants')
          .insert(draftPayload)
          .select('id')
          .single()
        if (error) throw error
        setDraftId(inserted!.id)
      }

      toast.success('Rascunho salvo')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar rascunho')
    } finally {
      setSavingDraft(false)
    }
  }

  function goToNextTab() {
    const idx = TABS.findIndex((t) => t === activeTab)
    if (idx !== -1 && idx < TABS.length - 1) setActiveTab(TABS[idx + 1]!)
  }

  return (
    <>
      {cepError && (
        <Alert variant="destructive" shape="banner">
          <IconAlertCircle size={16} />
          <AlertTitle>CEP não encontrado</AlertTitle>
          <AlertDescription>Verifique o número digitado ou preencha o endereço manualmente.</AlertDescription>
          <AlertActions>
            <AlertClose onClick={() => setCepError(false)} />
          </AlertActions>
        </Alert>
      )}
      <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{isEdit ? 'Editar Tenant' : 'Novo Tenant'}</h1>
        <p className="text-sm text-muted-foreground">
          {isEdit
            ? 'Edite os dados do parceiro na plataforma Noun'
            : 'Preencha os dados para cadastrar um novo parceiro na plataforma Noun'}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList variant="underline">
            <TabsTrigger value="identificacao" variant="underline">Identificação</TabsTrigger>
            <TabsTrigger value="fiscal"         variant="underline">Fiscal</TabsTrigger>
            <TabsTrigger value="contato"        variant="underline">Contato</TabsTrigger>
            <TabsTrigger value="bancario"       variant="underline">Dados Bancários</TabsTrigger>
            <TabsTrigger value="termos"         variant="underline">Termos</TabsTrigger>
          </TabsList>

          <TabsContent value="identificacao">
            <IdentificacaoTab form={form} />
          </TabsContent>
          <TabsContent value="fiscal">
            <FiscalTab form={form} />
          </TabsContent>
          <TabsContent value="contato">
            <ContatoTab form={form} cepError={cepError} setCepError={setCepError} />
          </TabsContent>
          <TabsContent value="bancario">
            <BancarioTab form={form} />
          </TabsContent>
          <TabsContent value="termos">
            <TermosTab form={form} adminName={adminName} />
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/tenants')}
            disabled={loading || savingDraft}
          >
            Cancelar
          </Button>
          <div className="flex items-center gap-2">
            {!isEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={saveDraft}
                disabled={loading || savingDraft}
              >
                {savingDraft ? 'Salvando...' : 'Salvar rascunho'}
              </Button>
            )}
            {activeTab === 'termos' ? (
              <Button type="submit" disabled={loading || savingDraft}>
                {loading ? 'Salvando...' : isEdit ? 'Atualizar e salvar' : 'Cadastrar Tenant'}
              </Button>
            ) : (
              <Button type="button" onClick={goToNextTab} disabled={loading || savingDraft}>
                Continuar
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
    </>
  )
}
