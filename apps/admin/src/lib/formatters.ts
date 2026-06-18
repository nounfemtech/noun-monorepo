// CRM/UF NÚMERO  →  CRM/SP 123456
export function formatCRM(uf?: string | null, numero?: string | null): string {
  if (!uf || !numero) return '—'
  return `CRM/${uf} ${numero}`
}

// RQE NÚMERO  →  RQE 12345
export function formatRQE(rqe?: string | null): string {
  if (!rqe) return '—'
  return `RQE ${rqe}`
}

// CRP REGIÃO/NÚMERO  →  CRP 06/123456
export function formatCRP(regiao?: string | null, numero?: string | null): string {
  if (!regiao || !numero) return '—'
  return `CRP ${regiao}/${numero}`
}

// CRN-REGIÃO NÚMERO  →  CRN-3 12345
export function formatCRN(regiao?: string | null, numero?: string | null): string {
  if (!regiao || !numero) return '—'
  return `CRN-${regiao} ${numero}`
}

// CRF/UF NÚMERO  →  CRF/AP 12345
export function formatCRF(uf?: string | null, numero?: string | null): string {
  if (!uf || !numero) return '—'
  return `CRF/${uf} ${numero}`
}
