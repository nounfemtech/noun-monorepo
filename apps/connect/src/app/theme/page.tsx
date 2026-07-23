import { ThemeSwitcher } from '@noun/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'Design System | Noun Connect' }

export default function ThemePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Noun Connect Design System</h1>
            <p className="text-sm text-muted-foreground">Theme Preview</p>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-6 py-12">

        {/* Dual-theme demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Dual Theme Preview</h2>
          <p className="text-sm text-muted-foreground">
            Cada canal tem sua paleta primaria. Os blocos abaixo simulam o data-tenant-type ativo.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div data-tenant-type="specialist">
              <Card>
                <CardHeader>
                  <CardTitle>Canal Especialista</CardTitle>
                  <CardDescription>data-tenant-type=&quot;specialist&quot;</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full">Botao Primario</Button>
                  <Button variant="secondary" className="w-full">Secundario</Button>
                  <Button variant="outline" className="w-full">Outline</Button>
                </CardContent>
              </Card>
            </div>
            <div data-tenant-type="pharmacy">
              <Card>
                <CardHeader>
                  <CardTitle>Canal Farmacia</CardTitle>
                  <CardDescription>data-tenant-type=&quot;pharmacy&quot;</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full">Botao Primario</Button>
                  <Button variant="secondary" className="w-full">Secundario</Button>
                  <Button variant="outline" className="w-full">Outline</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Cores por canal: fixas via [data-tenant-type] no globals.css.
            O connect nao monta o ColorThemeProvider (sem picker de cor em runtime):
            ver apps/connect/CLAUDE.md, secao 6. */}

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Form Inputs</h2>
          <div className="grid gap-6 sm:grid-cols-2 max-w-lg">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input placeholder="Ex.: Ana Souza" />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" placeholder="ana@email.com" />
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Cards</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Consultas</CardTitle>
                <CardDescription>Ultimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">127</p>
                <p className="text-sm text-muted-foreground mt-1">+8% vs mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Faturamento</CardTitle>
                <CardDescription>Ultimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">R$ 31.750</p>
                <p className="text-sm text-muted-foreground mt-1">+12% vs mes anterior</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground pb-8">
          Noun Connect Design System
        </p>
      </main>
    </div>
  )
}
