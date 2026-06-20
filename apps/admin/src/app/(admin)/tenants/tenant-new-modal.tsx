'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconLoader2, IconSearch } from '@tabler/icons-react'
import { createSupabaseBrowser } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

// ---- Types & constants ----

export type Specialty =
  | 'clinico_geral'
  | 'endocrinologista'
  | 'urologista'
  | 'ginecologista'
  | 'psicologo'
  | 'psiquiatra'
  | 'nutrologo'
  | 'nutricionista'
  | 'farmacia'

export const SPECIALTY_OPTIONS: { value: Specialty; label: string }[] = [
  { value: 'clinico_geral',    label: 'Clínico Geral'    },
  { value: 'endocrinologista', label: 'Endocrinologista' },
  { value: 'urologista',       label: 'Urologista'       },
  { value: 'ginecologista',    label: 'Ginecologista'    },
  { value: 'psicologo',        label: 'Psicólogo'        },
  { value: 'psiquiatra',       label: 'Psiquiatra'       },
  { value: 'nutrologo',        label: 'Nutrólogo'        },
  { value: 'nutricionista',    label: 'Nutricionista'    },
  { value: 'farmacia',         label: 'Farmácia'         },
]

const COUNTRY_CODES = [
  { code: '+55',  flag: '🇧🇷', label: 'BR' },
  { code: '+1',   flag: '🇺🇸', label: 'US' },
  { code: '+351', flag: '🇵🇹', label: 'PT' },
  { code: '+54',  flag: '🇦🇷', label: 'AR' },
  { code: '+52',  flag: '🇲🇽', label: 'MX' },
  { code: '+57',  flag: '🇨🇴', label: 'CO' },
  { code: '+56',  flag: '🇨🇱', label: 'CL' },
  { code: '+595', flag: '🇵🇾', label: 'PY' },
  { code: '+598', flag: '🇺🇾', label: 'UY' },
]

type CredentialType = 'crm' | 'crm_rqe' | 'crp' | 'crn' | 'crf'

function getCredentialType(s: Specialty): CredentialType {
  if (s === 'clinico_geral') return 'crm'
  if (s === 'psicologo') return 'crp'
  if (s === 'nutricionista') return 'crn'
  if (s === 'farmacia') return 'crf'
  return 'crm_rqe'
}

function getTenantType(s: Specialty): 'specialist' | 'pharmacy' {
  return s === 'farmacia' ? 'pharmacy' : 'specialist'
}

// ---- Masks / Validators ----

function maskCNPJ(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

function validateCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false
  const calc = (len: number) => {
    let s = 0; let w = len - 7
    for (let i = 0; i < len; i++) { s += parseInt(d[i]!) * w; w = w === 2 ? 9 : w - 1 }
    const r = s % 11; return r < 2 ? 0 : 11 - r
  }
  return calc(12) === parseInt(d[12]!) && calc(13) === parseInt(d[13]!)
}

// ---- Small reusable pieces ----

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  )
}

function Field({
  label, required, children, className,
}: {
  label: string; required?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

interface PhoneState { countryCode: string; number: string }
const DEFAULT_PHONE: PhoneState = { countryCode: '+55', number: '' }

function PhoneInput({
  value, onChange, placeholder,
}: { value: PhoneState; onChange: (v: PhoneState) => void; placeholder?: string }) {
  return (
    <div className="flex gap-2">
      <Select
        value={value.countryCode}
        onValueChange={(cc) => onChange({ ...value, countryCode: cc })}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.flag} {c.label} {c.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={value.number}
        onChange={(e) => onChange({ ...value, number: e.target.value })}
        placeholder={placeholder}
        className="flex-1"
      />
    </div>
  )
}

// ---- Modal ----

interface TenantNewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSpecialty?: Specialty
}

export function TenantNewModal({
  open,
  onOpenChange,
  initialSpecialty = 'clinico_geral',
}: TenantNewModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)

  const [name, setName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [specialty, setSpecialty] = useState<Specialty>(initialSpecialty)

  const [crmNumber, setCrmNumber] = useState('')
  const [rqeNumber, setRqeNumber] = useState('')
  const [crpNumber, setCrpNumber] = useState('')
  const [crnNumber, setCrnNumber] = useState('')
  const [crfNumber, setCrfNumber] = useState('')

  const [commissionRate, setCommissionRate] = useState('25')
  const [contractSignedAt, setContractSignedAt] = useState('')

  const [email, setEmail] = useState('')
  const [phoneLandline, setPhoneLandline] = useState<PhoneState>(DEFAULT_PHONE)
  const [phoneMobile, setPhoneMobile] = useState<PhoneState>(DEFAULT_PHONE)

  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [streetNumber, setStreetNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [addressState, setAddressState] = useState('')

  const [notes, setNotes] = useState('')

  // Sync specialty when modal opens with a different type
  useEffect(() => {
    if (open) setSpecialty(initialSpecialty)
  }, [open, initialSpecialty])

  const credentialType = getCredentialType(specialty)

  function resetForm() {
    setName(''); setLegalName(''); setCnpj(''); setSpecialty(initialSpecialty)
    setCrmNumber(''); setRqeNumber(''); setCrpNumber(''); setCrnNumber(''); setCrfNumber('')
    setCommissionRate('25'); setContractSignedAt('')
    setEmail(''); setPhoneLandline(DEFAULT_PHONE); setPhoneMobile(DEFAULT_PHONE)
    setCep(''); setStreet(''); setStreetNumber(''); setComplement('')
    setNeighborhood(''); setCity(''); setAddressState(''); setNotes('')
  }

  async function handleCepLookup() {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) { toast.error('CEP deve ter 8 dígitos.'); return }
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json() as {
        erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string
      }
      if (data.erro) {
        toast.error('CEP não encontrado.')
      } else {
        setStreet(data.logradouro ?? '')
        setNeighborhood(data.bairro ?? '')
        setCity(data.localidade ?? '')
        setAddressState(data.uf ?? '')
      }
    } catch {
      toast.error('Não foi possível consultar o CEP.')
    } finally {
      setCepLoading(false)
    }
  }

  function formatPhone(p: PhoneState): string | null {
    return p.number.trim() ? `${p.countryCode} ${p.number.trim()}` : null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Nome é obrigatório.'); return }
    if (!legalName.trim()) { toast.error('Razão social é obrigatória.'); return }
    if (!validateCNPJ(cnpj)) { toast.error('CNPJ inválido.'); return }

    const rate = parseFloat(commissionRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Taxa de comissão inválida.')
      return
    }

    setLoading(true)
    const supabase = createSupabaseBrowser()
    const tenantType = getTenantType(specialty)

    const payload: Record<string, unknown> = {
      name: name.trim(),
      legal_name: legalName.trim(),
      cnpj: cnpj.replace(/\D/g, ''),
      type: tenantType,
      specialty: tenantType === 'pharmacy' ? null : specialty,
      status: 'active',
      settings: { commission_rate: rate },
    }

    if ((credentialType === 'crm' || credentialType === 'crm_rqe') && crmNumber.trim())
      payload.crm_number = crmNumber.trim()
    if (credentialType === 'crm_rqe' && rqeNumber.trim())
      payload.rqe_number = rqeNumber.trim()
    if (credentialType === 'crp' && crpNumber.trim())
      payload.crp_number = crpNumber.trim()
    if (credentialType === 'crn' && crnNumber.trim())
      payload.crn_number = crnNumber.trim()
    if (credentialType === 'crf' && crfNumber.trim())
      payload.crf_number = crfNumber.trim()

    if (contractSignedAt) payload.contract_signed_at = contractSignedAt
    if (email.trim()) payload.email = email.trim()
    const lp = formatPhone(phoneLandline)
    const mp = formatPhone(phoneMobile)
    if (lp) payload.phone_landline = lp
    if (mp) payload.phone_mobile = mp

    const addr: Record<string, string> = {}
    const cepDigits = cep.replace(/\D/g, '')
    if (cepDigits) addr.cep = cepDigits
    if (street.trim()) addr.street = street.trim()
    if (streetNumber.trim()) addr.number = streetNumber.trim()
    if (complement.trim()) addr.complement = complement.trim()
    if (neighborhood.trim()) addr.neighborhood = neighborhood.trim()
    if (city.trim()) addr.city = city.trim()
    if (addressState.trim()) addr.state = addressState.trim()
    if (Object.keys(addr).length > 0) payload.address = addr

    if (notes.trim()) payload.notes = notes.trim()

    const { data, error } = await supabase
      .from('tenants')
      .insert(payload)
      .select()
      .single()

    if (error) {
      toast.error(`Erro ao criar tenant: ${error.message}`)
      setLoading(false)
      return
    }

    toast.success('Tenant criado com sucesso!')
    onOpenChange(false)
    resetForm()
    router.refresh()
    router.push(`/tenants/${data.id}`)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!loading) { onOpenChange(v); if (!v) resetForm() }
      }}
    >
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Novo Tenant</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 min-h-0 px-6 py-5">
          <form id="new-tenant-form" onSubmit={handleSubmit} className="space-y-6">

            <FormSection title="Dados básicos">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nome" required>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Clínica Saúde da Mulher"
                  />
                </Field>
                <Field label="Razão Social" required>
                  <Input
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="Ex: Saúde da Mulher Ltda."
                  />
                </Field>
              </div>
              <Field label="CNPJ" required className="max-w-[260px]">
                <Input
                  value={cnpj}
                  onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </Field>
            </FormSection>

            <Separator />

            <FormSection title="Especialidade e credencial">
              <Field label="Tipo" className="max-w-[280px]">
                <Select
                  value={specialty}
                  onValueChange={(v) => setSpecialty(v as Specialty)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {(credentialType === 'crm' || credentialType === 'crm_rqe') && (
                <div className={credentialType === 'crm_rqe' ? 'grid grid-cols-2 gap-4' : 'max-w-[280px]'}>
                  <Field label="CRM">
                    <Input
                      value={crmNumber}
                      onChange={(e) => setCrmNumber(e.target.value)}
                      placeholder="123456/SP"
                    />
                  </Field>
                  {credentialType === 'crm_rqe' && (
                    <Field label="RQE">
                      <Input
                        value={rqeNumber}
                        onChange={(e) => setRqeNumber(e.target.value)}
                        placeholder="12345"
                      />
                    </Field>
                  )}
                </div>
              )}

              {credentialType === 'crp' && (
                <Field label="CRP" className="max-w-[280px]">
                  <Input
                    value={crpNumber}
                    onChange={(e) => setCrpNumber(e.target.value)}
                    placeholder="12345/SP"
                  />
                </Field>
              )}
              {credentialType === 'crn' && (
                <Field label="CRN" className="max-w-[280px]">
                  <Input
                    value={crnNumber}
                    onChange={(e) => setCrnNumber(e.target.value)}
                    placeholder="12345/SP"
                  />
                </Field>
              )}
              {credentialType === 'crf' && (
                <Field label="CRF" className="max-w-[280px]">
                  <Input
                    value={crfNumber}
                    onChange={(e) => setCrfNumber(e.target.value)}
                    placeholder="12345/SP"
                  />
                </Field>
              )}
            </FormSection>

            <Separator />

            <FormSection title="Comercial">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Taxa de comissão (%)">
                  <Input
                    type="number"
                    step="0.5"
                    min={0}
                    max={100}
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    placeholder="Entre 20% e 30%"
                  />
                </Field>
                <Field label="Assinatura do contrato">
                  <Input
                    type="date"
                    value={contractSignedAt}
                    onChange={(e) => setContractSignedAt(e.target.value)}
                  />
                </Field>
              </div>
            </FormSection>

            <Separator />

            <FormSection title="Contato">
              <Field label="E-mail">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@clinica.com.br"
                />
              </Field>
              <Field label="Telefone fixo">
                <PhoneInput
                  value={phoneLandline}
                  onChange={setPhoneLandline}
                  placeholder="(11) 3333-4444"
                />
              </Field>
              <Field label="Celular">
                <PhoneInput
                  value={phoneMobile}
                  onChange={setPhoneMobile}
                  placeholder="(11) 9 9999-9999"
                />
              </Field>
            </FormSection>

            <Separator />

            <FormSection title="Endereço">
              <div className="flex items-end gap-2">
                <Field label="CEP" className="w-[160px]">
                  <Input
                    value={cep}
                    onChange={(e) => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="00000000"
                    maxLength={8}
                  />
                </Field>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCepLookup}
                  disabled={cepLoading}
                  className="gap-1.5 mb-px"
                >
                  {cepLoading
                    ? <IconLoader2 size={14} className="animate-spin" />
                    : <IconSearch size={14} />}
                  Buscar
                </Button>
              </div>

              <div className="grid grid-cols-[1fr_100px] gap-4">
                <Field label="Rua">
                  <Input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Nome da rua"
                  />
                </Field>
                <Field label="Número">
                  <Input
                    value={streetNumber}
                    onChange={(e) => setStreetNumber(e.target.value)}
                    placeholder="123"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Complemento">
                  <Input
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Sala 42, apto 101..."
                  />
                </Field>
                <Field label="Bairro">
                  <Input
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Centro"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-[1fr_80px] gap-4">
                <Field label="Cidade">
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Paulo"
                  />
                </Field>
                <Field label="UF">
                  <Input
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="SP"
                    maxLength={2}
                  />
                </Field>
              </div>
            </FormSection>

            <Separator />

            <FormSection title="Observações">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações adicionais sobre o tenant..."
                rows={3}
              />
            </FormSection>

          </form>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 sm:justify-start">
          <Button type="submit" form="new-tenant-form" disabled={loading}>
            {loading && <IconLoader2 size={14} className="animate-spin mr-1.5" />}
            {loading ? 'Criando...' : 'Criar tenant'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => { resetForm(); onOpenChange(false) }}
            disabled={loading}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
