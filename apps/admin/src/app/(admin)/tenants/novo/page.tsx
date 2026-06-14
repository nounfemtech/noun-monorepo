import { requireAdmin } from '@/lib/admin-auth'
import { NovoTenantForm } from './form'

export default async function NovoTenantPage() {
  const { profile, session } = await requireAdmin()
  const adminName =
    profile.full_name ?? profile.email ?? session.user.email ?? 'Admin'
  return <NovoTenantForm adminName={adminName} />
}
