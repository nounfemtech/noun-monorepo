import { createSupabaseServer } from '@/lib/supabase-server'

export default async function DashboardPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, full_name')
    .eq('id', user!.id)
    .single()

  const { data: tenant } = profile?.tenant_id
    ? await supabase.from('tenants').select('name, type').eq('id', profile.tenant_id).single()
    : { data: null }

  const channelLabel = tenant?.type === 'pharmacy' ? 'Canal Farmacia' : 'Canal Especialista'

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">{channelLabel}</h1>
      <p className="text-muted-foreground mt-1">
        {tenant?.name ? `${tenant.name}` : 'Dashboard em construcao.'}
      </p>
    </div>
  )
}
