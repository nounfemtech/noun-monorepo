'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return false
  // Rejeita CNPJs com todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(digits)) return false
  const calc = (mod: number) => {
    let sum = 0
    let weight = mod - 7
    for (let i = 0; i < mod; i++) {
      sum += parseInt(digits[i] ?? '0') * weight
      weight = weight === 2 ? 9 : weight - 1
    }
    const rem = sum % 11
    return rem < 2 ? 0 : 11 - rem
  }
  return calc(12) === parseInt(digits[12] ?? '0') && calc(13) === parseInt(digits[13] ?? '0')
}

function maskCNPJ(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

export default function NewTenantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [type, setType] = useState<'specialist' | 'pharmacy'>('specialist')
  const [crmNumber, setCrmNumber] = useState('')
  const [crfNumber, setCrfNumber] = useState('')
  const [commissionRate, setCommissionRate] = useState('25')
  const [plan, setPlan] = useState('')
  const [contractSignedAt, setContractSignedAt] = useState('')

  function handleTypeChange(newType: 'specialist' | 'pharmacy') {
    setType(newType)
    setCommissionRate(newType === 'specialist' ? '25' : '10.5')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Nome é obrigatório.')
      return
    }
    if (!legalName.trim()) {
      setError('Razão social é obrigatória.')
      return
    }
    if (!validateCNPJ(cnpj)) {
      setError('CNPJ inválido. Verifique os dígitos.')
      return
    }

    const rate = parseFloat(commissionRate)
    if (type === 'specialist' && (rate < 20 || rate > 30)) {
      setError('Taxa de comissão para especialista deve estar entre 20% e 30%.')
      return
    }
    if (type === 'pharmacy' && (rate < 8 || rate > 13)) {
      setError('Taxa de comissão para farmácia deve estar entre 8% e 13%.')
      return
    }

    setLoading(true)

    const supabase = createSupabaseBrowser()

    const payload: Record<string, unknown> = {
      name: name.trim(),
      legal_name: legalName.trim(),
      cnpj: cnpj.replace(/\D/g, ''),
      type,
      status: 'active',
      settings: { commission_rate: rate },
    }

    if (type === 'specialist' && crmNumber.trim()) payload.crm_number = crmNumber.trim()
    if (type === 'pharmacy' && crfNumber.trim()) payload.crf_number = crfNumber.trim()
    if (plan.trim()) payload.plan = plan.trim()
    if (contractSignedAt) payload.contract_signed_at = contractSignedAt

    const { data, error: insertError } = await supabase
      .from('tenants')
      .insert(payload)
      .select()
      .single()

    if (insertError) {
      setError(`Erro ao criar tenant: ${insertError.message}`)
      setLoading(false)
      return
    }

    router.push(`/tenants/${data.id}`)
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Clínica Saúde da Mulher"
                required
              />
            </div>

            {/* Razão social */}
            <div className="space-y-2">
              <Label htmlFor="legalName">Razão social *</Label>
              <Input
                id="legalName"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Ex: Saúde da Mulher Ltda."
                required
              />
            </div>

            {/* CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select value={type} onValueChange={(v) => handleTypeChange(v as 'specialist' | 'pharmacy')}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="specialist">Especialista</SelectItem>
                  <SelectItem value="pharmacy">Farmácia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* CRM ou CRF */}
            {type === 'specialist' ? (
              <div className="space-y-2">
                <Label htmlFor="crmNumber">Número do CRM</Label>
                <Input
                  id="crmNumber"
                  value={crmNumber}
                  onChange={(e) => setCrmNumber(e.target.value)}
                  placeholder="Ex: CRM/SP 123456"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="crfNumber">Número do CRF</Label>
                <Input
                  id="crfNumber"
                  value={crfNumber}
                  onChange={(e) => setCrfNumber(e.target.value)}
                  placeholder="Ex: CRF/SP 12345"
                />
              </div>
            )}

            {/* Taxa de comissão */}
            <div className="space-y-2">
              <Label htmlFor="commissionRate">
                Taxa de comissão (%)
                {type === 'specialist' ? ': entre 20% e 30%' : ': entre 8% e 13%'}
              </Label>
              <Input
                id="commissionRate"
                type="number"
                step="0.5"
                min={type === 'specialist' ? 20 : 8}
                max={type === 'specialist' ? 30 : 13}
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
              />
            </div>

            {/* Plano */}
            <div className="space-y-2">
              <Label htmlFor="plan">Plano / Observações</Label>
              <Textarea
                id="plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="Descreva o plano ou condições especiais..."
                rows={3}
              />
            </div>

            {/* Data assinatura contrato */}
            <div className="space-y-2">
              <Label htmlFor="contractSignedAt">Data de assinatura do contrato</Label>
              <Input
                id="contractSignedAt"
                type="date"
                value={contractSignedAt}
                onChange={(e) => setContractSignedAt(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar tenant'}
              </Button>
              <Link href="/tenants">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
