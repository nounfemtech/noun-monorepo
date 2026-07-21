'use client'

import * as React from 'react'
import type { Route } from 'next'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
  IconLayoutDashboard,
  IconUserCircle,
  IconCalendar,
  IconStethoscope,
  IconPrescription,
  IconUsers,
  IconCurrencyReal,
  IconSettings,
  IconLogout,
  IconSun,
  IconMoon,
  IconSelector,
} from '@tabler/icons-react'
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

const specialistNavItems = [
  { href: '/dashboard',      label: 'Dashboard',      icon: IconLayoutDashboard },
  { href: '/perfil',         label: 'Perfil',         icon: IconUserCircle },
  { href: '/agenda',         label: 'Agenda',         icon: IconCalendar },
  { href: '/prontuario',     label: 'Prontuario',     icon: IconStethoscope },
  { href: '/receitas',       label: 'Receitas',       icon: IconPrescription },
  { href: '/pacientes',      label: 'Pacientes',      icon: IconUsers },
  { href: '/financeiro',     label: 'Financeiro',     icon: IconCurrencyReal },
  { href: '/configuracoes',  label: 'Configuracoes',  icon: IconSettings },
]

const pharmacyNavItems = [
  { href: '/dashboard',      label: 'Dashboard',      icon: IconLayoutDashboard },
  { href: '/configuracoes',  label: 'Configuracoes',  icon: IconSettings },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  tenantType: 'specialist' | 'pharmacy'
  userName: string
  userEmail?: string | null
  userAvatar?: string | null
}

export function AppSidebar({
  tenantType,
  userName,
  userEmail,
  userAvatar,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { isMobile } = useSidebar()

  const navItems = tenantType === 'pharmacy' ? pharmacyNavItems : specialistNavItems
  const channelLabel = tenantType === 'pharmacy' ? 'Canal Farmacia' : 'Canal Especialista'

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

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
                  N
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Noun Connect</span>
                  <span className="truncate text-xs text-sidebar-foreground/60">{channelLabel}</span>
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
                    <AvatarImage src={userAvatar ?? undefined} className="object-cover" />
                    <AvatarFallback className="rounded-lg text-xs bg-sidebar-primary/10">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{userName}</span>
                    {userEmail && (
                      <span className="truncate text-xs text-sidebar-foreground/60">
                        {userEmail}
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
                      <AvatarImage src={userAvatar ?? undefined} className="object-cover" />
                      <AvatarFallback className="rounded-lg text-xs bg-sidebar-primary/10">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{userName}</span>
                      {userEmail && (
                        <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
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
