import { requireAdmin } from '@/lib/admin-auth'
import { AppSidebar } from '@/components/sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin()

  return (
    <SidebarProvider>
      <AppSidebar
        adminName={profile.full_name ?? profile.email ?? 'Admin'}
        adminEmail={profile.email}
      />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b sticky top-0 z-10 bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
