'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { buscarPacientes } from './consultas-actions'
import type { PatientSearchResult } from '@noun/types'

// Busca restrita a pacientes com historico de consulta neste tenant (RPC search_tenant_patients,
// decisao do Prompt 3) — nao e busca livre em toda a base de pacientes da Noun.
export function PatientSearch({
  selected,
  onSelect,
}: {
  selected: PatientSearchResult | null
  onSelect: (patient: PatientSearchResult | null) => void
}) {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<PatientSearchResult[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (selected) return
    if (query.trim().length < 3) {
      setResults([])
      return
    }
    const handle = setTimeout(async () => {
      setLoading(true)
      const result = await buscarPacientes(query.trim())
      setLoading(false)
      if (!('error' in result)) setResults(result.data)
    }, 400)
    return () => clearTimeout(handle)
  }, [query, selected])

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{selected.fullName}</p>
          {selected.email && <p className="text-xs text-muted-foreground truncate">{selected.email}</p>}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(null)}>
          Trocar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <Input
        placeholder="Buscar por nome, e-mail ou CPF (minimo 3 caracteres)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <p className="text-xs text-muted-foreground">Buscando...</p>}
      {!loading && results.length > 0 && (
        <ul className="max-h-48 divide-y divide-border overflow-y-auto rounded-md border border-border">
          {results.map((patient) => (
            <li key={patient.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => onSelect(patient)}
              >
                <p className="font-medium">{patient.fullName}</p>
                {patient.email && <p className="text-xs text-muted-foreground">{patient.email}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!loading && query.trim().length >= 3 && results.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum paciente com historico neste consultorio encontrado.
        </p>
      )}
    </div>
  )
}
