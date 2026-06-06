import { requireAdmin } from '@/lib/admin-auth'
import { Sidebar } from '@/components/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar adminName={profile.full_name ?? profile.email ?? 'Admin'} />
      <main className="flex-1 overflow-y-auto bg-muted/20">
        {children}
      </main>
    </div>
  )
}
