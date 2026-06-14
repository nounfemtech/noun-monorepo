import { ThemeSwitcher, ColorPicker } from '@noun/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  IconUser, IconHeart, IconBell, IconSettings, IconSearch,
  IconPlus, IconTrash, IconEdit, IconCheck, IconX,
  IconStar, IconDownload, IconUpload, IconEye,
} from '@tabler/icons-react'

// ============================================================
// /theme — Preview Visual do Design System
// ============================================================

export const metadata = { title: 'Design System | Noun' }

export default function ThemePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Noun Design System</h1>
            <p className="text-sm text-muted-foreground">NOUN-24 · Theme Preview</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-16 px-6 py-12">

        {/* ── Color Picker ── */}
        <Section title="Color Theme" description="Escolha a paleta primária, persiste no localStorage">
          <Card className="p-6">
            <ColorPicker />
          </Card>
        </Section>

        {/* ── Typography ── */}
        <Section title="Tipografia" description="Reddit Sans (sans) · Reddit Mono (mono)">
          <div className="space-y-4">
            {[
              { cls: 'text-5xl font-black',     label: 'font-black 900',    text: 'Noun, Saúde Feminina' },
              { cls: 'text-4xl font-bold',       label: 'font-bold 700',     text: 'Noun, Saúde Feminina' },
              { cls: 'text-3xl font-semibold',   label: 'font-semibold 600', text: 'Noun, Saúde Feminina' },
              { cls: 'text-2xl font-medium',     label: 'font-medium 500',   text: 'Noun, Saúde Feminina' },
              { cls: 'text-xl font-normal',      label: 'font-normal 400',   text: 'Noun, Saúde Feminina' },
              { cls: 'text-base font-light',     label: 'font-light 300',    text: 'Noun, Saúde Feminina' },
              { cls: 'text-sm text-muted-foreground', label: 'muted-foreground', text: 'Texto secundário e legendas' },
              { cls: 'font-mono text-sm',        label: 'font-mono',         text: 'const supabase = createClient()' },
            ].map(({ cls, label, text }) => (
              <div key={label} className="flex items-baseline gap-4">
                <span className="w-40 shrink-0 font-mono text-xs text-muted-foreground">{label}</span>
                <span className={cls}>{text}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Colors ── */}
        <Section title="Paleta Completa" description="Todas as cores disponíveis em 50–950">
          <div className="grid gap-3">
            {(['violet','purple','fuchsia','pink','rose','red','orange','amber','yellow','lime','green','emerald','teal','cyan','sky','blue','indigo','slate','gray','zinc','neutral','stone'] as const).map((color) => (
              <div key={color} className="flex items-center gap-1">
                <span className="w-20 font-mono text-xs text-muted-foreground capitalize">{color}</span>
                {([50,100,200,300,400,500,600,700,800,900,950] as const).map((shade) => (
                  <div
                    key={shade}
                    title={`${color}-${shade}`}
                    className="h-8 w-8 rounded-md border border-black/5 shadow-sm"
                    style={{ backgroundColor: `var(--color-${color}-${shade}, currentColor)` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </Section>

        {/* ── Buttons ── */}
        <Section title="Buttons" description="Variantes e tamanhos">
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Button size="sm"><IconPlus size={14} className="mr-1" /> Small</Button>
            <Button><IconUser size={16} className="mr-2" /> Default</Button>
            <Button size="lg"><IconHeart size={18} className="mr-2" /> Large</Button>
            <Button disabled>Disabled</Button>
            <Button variant="outline" size="icon"><IconSettings size={16} /></Button>
          </div>
        </Section>

        {/* ── Badges ── */}
        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </Section>

        {/* ── Inputs ── */}
        <Section title="Form Inputs" description="Input, Textarea, Select, Checkbox, Switch, RadioGroup">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <div className="relative">
                <IconUser size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Ex.: Ana Souza" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Busca</Label>
              <div className="relative">
                <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gynecology">Ginecologia</SelectItem>
                  <SelectItem value="obstetrics">Obstetrícia</SelectItem>
                  <SelectItem value="endocrinology">Endocrinologia</SelectItem>
                  <SelectItem value="psychiatry">Psiquiatria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Descreva os sintomas..." rows={3} />
            </div>
            <div className="space-y-3">
              <Label>Opções</Label>
              <div className="flex items-center gap-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms" className="font-normal cursor-pointer">Aceito os termos de uso</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="notifications" />
                <Label htmlFor="notifications" className="font-normal cursor-pointer">Receber notificações</Label>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Tipo de consulta</Label>
              <RadioGroup defaultValue="telemedicine">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="in_person" id="in_person" />
                  <Label htmlFor="in_person" className="font-normal cursor-pointer">Presencial</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="telemedicine" id="telemedicine" />
                  <Label htmlFor="telemedicine" className="font-normal cursor-pointer">Telemedicina</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </Section>

        {/* ── Cards ── */}
        <Section title="Cards">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Avatar>
                    <AvatarImage src="" alt="Dr. Carlos" />
                    <AvatarFallback>CA</AvatarFallback>
                  </Avatar>
                  <Badge>Ativo</Badge>
                </div>
                <CardTitle className="mt-3">Dr. Carlos Alves</CardTitle>
                <CardDescription>Ginecologia · CRM 12345/SP</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <IconStar size={14} className="text-amber-500 fill-amber-500" />
                  <span className="font-medium text-foreground">4.9</span>
                  <span>· 237 consultas</span>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm" className="flex-1">Agendar</Button>
                <Button size="sm" variant="outline" size-icon="icon"><IconEye size={14} /></Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total de Pacientes</CardTitle>
                <CardDescription>Últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">2.847</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-600 font-medium">+12%</span> vs mês anterior
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Importar Dados</CardTitle>
                <CardDescription>Arraste um arquivo CSV ou clique para selecionar</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button variant="outline" className="gap-2">
                  <IconUpload size={16} /> Selecionar arquivo
                </Button>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* ── Tabs ── */}
        <Section title="Tabs">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="appointments">Consultas</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescrições</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Conteúdo da aba Visão Geral.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="appointments" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Lista de consultas agendadas.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="prescriptions" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Histórico de prescrições.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Section>

        {/* ── Table ── */}
        <Section title="Table">
          <Table>
            <TableCaption>Consultas recentes</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { patient: 'Ana Souza',     doctor: 'Dr. Carlos Alves',  date: '03/06/2026', type: 'Telemedicina', status: 'Confirmada',  value: 'R$ 250' },
                { patient: 'Beatriz Lima',  doctor: 'Dra. Marina Costa', date: '04/06/2026', type: 'Presencial',   status: 'Pendente',    value: 'R$ 180' },
                { patient: 'Clara Mendes',  doctor: 'Dr. Carlos Alves',  date: '05/06/2026', type: 'Telemedicina', status: 'Concluída',   value: 'R$ 250' },
              ].map((row) => (
                <TableRow key={row.patient}>
                  <TableCell className="font-medium">{row.patient}</TableCell>
                  <TableCell>{row.doctor}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'Concluída' ? 'default' : row.status === 'Pendente' ? 'secondary' : 'outline'}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{row.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        {/* ── Skeletons ── */}
        <Section title="Skeletons" description="Estado de carregamento">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </Section>

        {/* ── Icons ── */}
        <Section title="Icons (@tabler/icons-react)" description="Nunca usar Lucide, apenas Tabler">
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            {[IconUser, IconHeart, IconBell, IconSettings, IconSearch, IconPlus, IconTrash, IconEdit, IconCheck, IconX, IconStar, IconDownload, IconUpload, IconEye].map((Icon, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="rounded-lg border border-border p-3 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Icon size={20} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Separator />
        <p className="text-center text-xs text-muted-foreground pb-8">
          Noun Design System · NOUN-24 · Reddit Sans + Reddit Mono · Shadcn/UI + Tailwind · Tabler Icons
        </p>
      </main>
    </div>
  )
}

// ── Helper component ──

function Section({
  title, description, children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <Separator />
      {children}
    </section>
  )
}
