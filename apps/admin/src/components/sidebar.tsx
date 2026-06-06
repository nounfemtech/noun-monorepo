'use client'

import type { Route } from 'next'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IconLayoutDashboard,
  IconUsers,
  IconBuilding,
  IconCurrencyReal,
  IconSettings,
  IconLogout,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { createSupabaseBrowser } from '@/lib/supabase'

interface NavItem {
  href: Route
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <IconLayoutDashboard size={18} />,
  },
  {
    href: '/usuarios',
    label: 'Usuários',
    icon: <IconUsers size={18} />,
  },
  {
    href: '/tenants',
    label: 'Tenants',
    icon: <IconBuilding size={18} />,
  },
  {
    href: '/financeiro',
    label: 'Financeiro',
    icon: <IconCurrencyReal size={18} />,
  },
  {
    href: '/configuracoes',
    label: 'Configurações',
    icon: <IconSettings size={18} />,
  },
]

interface SidebarProps {
  adminName: string
}

export function Sidebar({ adminName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const initials = adminName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function handleLogout() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="hidden md:flex flex-col w-60 min-h-screen border-r"
      style={{
        backgroundColor: 'hsl(var(--sidebar-background))',
        color: 'hsl(var(--sidebar-foreground))',
        borderColor: 'hsl(var(--sidebar-border))',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5">
        <img src="/logo.svg" width={32} height={32} alt="Noun" />
        <span
          className="text-lg font-semibold tracking-tight"
          style={{ color: 'hsl(var(--sidebar-foreground))' }}
        >
          Vaughan
        </span>
      </div>

      <Separator style={{ backgroundColor: 'hsl(var(--sidebar-border))' }} />

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'font-medium'
                  : 'hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]'
              )}
              style={
                isActive
                  ? {
                      backgroundColor: 'hsl(var(--sidebar-accent))',
                      color: 'hsl(var(--sidebar-primary))',
                    }
                  : {}
              }
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator style={{ backgroundColor: 'hsl(var(--sidebar-border))' }} />

      {/* Footer */}
      <div className="px-3 py-4 flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-violet-100 text-violet-700">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{adminName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-destructive hover:text-destructive/80 transition-colors p-1 rounded"
          title="Sair"
        >
          <IconLogout size={16} />
        </button>
      </div>
    </aside>
  )
}
