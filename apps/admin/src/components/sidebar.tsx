'use client'

import * as React from 'react'
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
  IconSun,
  IconMoon,
  IconSelector,
} from '@tabler/icons-react'
import { useSpacemanTheme } from '@space-man/react-theme-animation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { createSupabaseBrowser } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',     icon: IconLayoutDashboard },
  { href: '/usuarios',      label: 'Usuários',      icon: IconUsers },
  { href: '/tenants',       label: 'Tenants',       icon: IconBuilding },
  { href: '/financeiro',    label: 'Financeiro',    icon: IconCurrencyReal },
  { href: '/configuracoes', label: 'Configurações', icon: IconSettings },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  adminName: string
  adminEmail?: string | null
}

export function AppSidebar({ adminName, adminEmail, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toggleTheme, resolvedTheme } = useSpacemanTheme()
  const { isMobile } = useSidebar()

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
    <Sidebar collapsible="icon" {...props}>
      {/* ── Header ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
                  V
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Vaughan</span>
                  <span className="truncate text-xs text-sidebar-foreground/60">Admin</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Nav ── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href as Route}>
                        <item.icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer — user menu ── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg text-xs bg-sidebar-primary/10">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{adminName}</span>
                    {adminEmail && (
                      <span className="truncate text-xs text-sidebar-foreground/60">
                        {adminEmail}
                      </span>
                    )}
                  </div>
                  <IconSelector size={16} className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={toggleTheme}>
                  {resolvedTheme === 'dark'
                    ? <IconSun size={16} />
                    : <IconMoon size={16} />}
                  {resolvedTheme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <IconLogout size={16} />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
