import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/sidebar'
import { NavBreadcrumb } from '@/components/nav-breadcrumb'
import { AppointmentsRealtime } from '@/components/appointments-realtime'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/sonner'

async function getProfile(userId: string) {
  const supabase = await createSupabaseServer()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, full_name, email, avatar_url')
    .eq('id', userId)
    .single()

  if (!profile?.tenant_id) {
    return { tenantType: 'specialist' as const, profile }
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('type')
    .eq('id', profile.tenant_id)
    .single()

  const tenantType = tenant?.type === 'pharmacy' ? 'pharmacy' as const : 'specialist' as const

  return { tenantType, profile }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { tenantType, profile } = await getProfile(user.id)
  const userEmail = profile?.email ?? user.email ?? null

  return (
    <div data-tenant-type={tenantType}>
      <SidebarProvider>
        <AppSidebar
          tenantType={tenantType}
          userName={profile?.full_name ?? userEmail ?? 'Usuario'}
          userEmail={userEmail}
          userAvatar={profile?.avatar_url ?? null}
        />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b sticky top-0 z-10 bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
            <NavBreadcrumb />
          </header>
          <div className="mx-auto w-full max-w-6xl px-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <AppointmentsRealtime userId={user.id} />
      <Toaster position="top-right" />
    </div>
  )
}
