import Link from 'next/link'
import { IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export function TenantNewButton() {
  return (
    <Link href="/tenants/novo">
      <Button className="gap-2">
        <IconPlus size={16} />
        Novo tenant
      </Button>
    </Link>
  )
}
