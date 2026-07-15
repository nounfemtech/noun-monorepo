import Image from 'next/image'
import {
  IconActivity,
  IconApple,
  IconBrain,
  IconDroplet,
  IconEye,
  IconFileText,
  IconGenderFemale,
  IconHeartHandshake,
  IconPill,
  IconStethoscope,
  IconTarget,
  IconUsers,
  type Icon,
} from '@tabler/icons-react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { Button } from '@/components/ui/button'

type DropdownItem = {
  label: string
  href: string
  description: string
  icon: Icon
}

const inicioItem = { label: 'Início', href: '/' }

const trailingItems = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Blog', href: '/blog' },
]

const sobreItems: DropdownItem[] = [
  {
    label: 'Quem Somos',
    href: '/sobre/quem-somos',
    description: 'A equipe e a história por trás do Noun.',
    icon: IconUsers,
  },
  {
    label: 'Nossa missão',
    href: '/sobre/missao',
    description: 'Por que existimos e para quem trabalhamos.',
    icon: IconTarget,
  },
  {
    label: 'Visão do Noun',
    href: '/sobre/visao',
    description: 'Onde queremos chegar com a saúde hormonal.',
    icon: IconEye,
  },
  {
    label: 'Princípios e valores',
    href: '/sobre/valores',
    description: 'O que guia cada decisão que tomamos.',
    icon: IconHeartHandshake,
  },
]

const servicosItems: DropdownItem[] = [
  {
    label: 'Ginecologia',
    href: '/servicos/ginecologia',
    description: 'Cuidado ginecológico para todas as identidades.',
    icon: IconGenderFemale,
  },
  {
    label: 'Endocrinologia',
    href: '/servicos/endocrinologia',
    description: 'Acompanhamento hormonal especializado.',
    icon: IconDroplet,
  },
  {
    label: 'Nutrição',
    href: '/servicos/nutricao',
    description: 'Orientação nutricional para sua jornada hormonal.',
    icon: IconApple,
  },
  {
    label: 'Psicologia',
    href: '/servicos/psicologia',
    description: 'Suporte emocional em cada etapa do cuidado.',
    icon: IconBrain,
  },
  {
    label: 'Urologia',
    href: '/servicos/urologia',
    description: 'Cuidado urológico especializado.',
    icon: IconStethoscope,
  },
  {
    label: 'Farmácia e medicamento',
    href: '/servicos/farmacia',
    description: 'Farmácias parceiras e acompanhamento de pedidos.',
    icon: IconPill,
  },
  {
    label: 'Receitas e documentos',
    href: '/servicos/receitas',
    description: 'Receita digital e documentos direto no app.',
    icon: IconFileText,
  },
  {
    label: 'Status de saúde',
    href: '/servicos/status-saude',
    description: 'Linha do tempo da sua saúde hormonal.',
    icon: IconActivity,
  },
]

function DropdownList({ items, className }: { items: DropdownItem[]; className?: string }) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.label}>
          <NavigationMenuLink asChild>
            <a
              href={item.href}
              className="flex flex-row items-start gap-3 rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
            >
              <item.icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" stroke={1.75} />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium leading-none">{item.label}</span>
                <span className="text-sm text-muted-foreground">{item.description}</span>
              </span>
            </a>
          </NavigationMenuLink>
        </li>
      ))}
    </ul>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-4">
        <a href="/" className="justify-self-start">
          <Image src="/logoNoun.svg" alt="Noun" width={32} height={32} priority />
        </a>

        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <a href={inicioItem.href}>{inicioItem.label}</a>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>Sobre</NavigationMenuTrigger>
              <NavigationMenuContent>
                <DropdownList items={sobreItems} className="grid w-80 gap-1 p-2" />
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>Serviços</NavigationMenuTrigger>
              <NavigationMenuContent>
                <DropdownList items={servicosItems} className="grid w-[520px] grid-cols-2 gap-1 p-2" />
              </NavigationMenuContent>
            </NavigationMenuItem>

            {trailingItems.map((item) => (
              <NavigationMenuItem key={item.label}>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <a href={item.href}>{item.label}</a>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="justify-self-end">
          <Button asChild size="sm">
            <a href="/lista-de-espera?tipo=paciente">Entrar na lista de espera</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
