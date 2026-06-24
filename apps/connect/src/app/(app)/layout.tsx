import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

async function getTenantType(userId: string): Promise<'specialist' | 'pharmacy'> {
  const supabase = await createSupabaseServer()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .single()

  if (!profile?.tenant_id) return 'specialist'

  const { data: tenant } = await supabase
    .from('tenants')
    .select('type')
    .eq('id', profile.tenant_id)
    .single()

  return tenant?.type === 'pharmacy' ? 'pharmacy' : 'specialist'
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tenantType = await getTenantType(user.id)
  const channelLabel = tenantType === 'pharmacy' ? 'Canal Farmacia' : 'Canal Especialista'

  return (
    <div data-tenant-type={tenantType} className="min-h-svh flex">
      <aside className="w-64 border-r border-sidebar-border bg-sidebar p-4">
        <p className="text-sm font-semibold text-sidebar-foreground">{channelLabel}</p>
      </aside>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
