'use client'

import { Button } from '@/components/ui/button'
import { IconDownload } from '@tabler/icons-react'

interface TenantBreakdown {
  id: string
  name: string
  type: string
  gmv: number
  commission: number
  nounRevenue: number
  transactions: number
}

interface ExportCSVButtonProps {
  data: TenantBreakdown[]
}

export function ExportCSVButton({ data }: ExportCSVButtonProps) {
  function handleExport() {
    const header = 'Tenant,Tipo,GMV,Receita Noun,Take Rate,Transações'
    const rows = data.map((t) => {
      const takeRate = t.gmv > 0 ? ((t.nounRevenue / t.gmv) * 100).toFixed(1) + '%' : '0%'
      const tipo = t.type === 'clinic' ? 'Clínica' : 'Farmácia'
      return [
        `"${t.name}"`,
        tipo,
        t.gmv.toFixed(2),
        t.nounRevenue.toFixed(2),
        takeRate,
        t.transactions,
      ].join(',')
    })

    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `noun-financeiro-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" className="gap-2" onClick={handleExport}>
      <IconDownload size={16} />
      Exportar CSV
    </Button>
  )
}
