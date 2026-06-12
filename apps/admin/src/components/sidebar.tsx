'use client'

import * as React from 'react'
import type { Route } from 'next'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IconLayoutDashboard,
  IconBuilding,
  IconCurrencyReal,
  IconTicket,
  IconSettings,
  IconLogout,
  IconSun,
  IconMoon,
  IconSelector,
} from '@tabler/icons-react'
import { useSpacemanTheme } from '@space-man/react-theme-animation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  { href: '/tenants',       label: 'Tenants',       icon: IconBuilding },
  { href: '/financeiro',    label: 'Financeiro',    icon: IconCurrencyReal },
  { href: '/chamados',      label: 'Chamados',      icon: IconTicket },
  { href: '/configuracoes', label: 'Configurações', icon: IconSettings },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  adminName: string
  adminEmail?: string | null
  adminAvatar?: string | null
}

export function AppSidebar({ adminName, adminEmail, adminAvatar, ...props }: AppSidebarProps) {
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
            <SidebarMenuButton size="lg" asChild className="hover:bg-muted hover:text-foreground active:bg-muted active:text-foreground">
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
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className="hover:bg-muted hover:text-foreground"
                    >
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
                  className="hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={adminAvatar ?? undefined} className="object-cover" />
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
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={adminAvatar ?? undefined} className="object-cover" />
                      <AvatarFallback className="rounded-lg text-xs bg-sidebar-primary/10">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{adminName}</span>
                      {adminEmail && (
                        <span className="truncate text-xs text-muted-foreground">{adminEmail}</span>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
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
