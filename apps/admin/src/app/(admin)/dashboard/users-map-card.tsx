'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { cn } from '@/lib/utils'
import brazilPaths from '@/data/brazil-states-paths.json'

// ─── Projeção ─────────────────────────────────────────────────────────────────
const W = 500, H = 420
const WEST = -73.98, EAST = -28.86, NORTH = 5.27, SOUTH = -33.74

function project(lng: number, lat: number): [number, number] {
  const x = ((lng - WEST) / (EAST - WEST)) * W
  const y = ((NORTH - lat) / (NORTH - SOUTH)) * H
  return [x, y]
}

// ─── Regiões ──────────────────────────────────────────────────────────────────
const REGIONS = [
  { id: 'Norte',          label: 'Norte',        states: ['AC','AM','AP','PA','RO','RR','TO'] },
  { id: 'Nordeste',       label: 'Nordeste',     states: ['AL','BA','CE','MA','PB','PE','PI','RN','SE'] },
  { id: 'Centro-Oeste',   label: 'Centro Oeste', states: ['DF','GO','MS','MT'] },
  { id: 'Sudeste',        label: 'Sudeste',      states: ['ES','MG','RJ','SP'] },
  { id: 'Sul',            label: 'Sul',          states: ['PR','RS','SC'] },
] as const

type RegionId = typeof REGIONS[number]['id']

const STATE_TO_REGION: Record<string, RegionId> = {}
for (const r of REGIONS) for (const s of r.states) STATE_TO_REGION[s] = r.id

const STATE_NAMES: Record<string, string> = {
  AC:'Acre',                AL:'Alagoas',             AP:'Amapá',
  AM:'Amazonas',            BA:'Bahia',               CE:'Ceará',
  DF:'Distrito Federal',    ES:'Espírito Santo',      GO:'Goiás',
  MA:'Maranhão',            MT:'Mato Grosso',         MS:'Mato Grosso do Sul',
  MG:'Minas Gerais',        PA:'Pará',                PB:'Paraíba',
  PR:'Paraná',              PE:'Pernambuco',          PI:'Piauí',
  RJ:'Rio de Janeiro',      RN:'Rio Grande do Norte', RS:'Rio Grande do Sul',
  RO:'Rondônia',            RR:'Roraima',             SC:'Santa Catarina',
  SP:'São Paulo',           SE:'Sergipe',             TO:'Tocantins',
}

// Tons do primary por região — mesmo matiz (hue), opacidade crescente por região.
// Opacidades altas o suficiente para garantir contraste mesmo com primaries claros.
//
// dim    → estados fora do filtro ativo (quase imperceptível)
// base   → estado padrão visível
// active → hover / selecionado
const REGION_TONES: Record<RegionId, { dim: string; base: string; active: string }> = {
  Norte:          { dim: 'hsl(var(--primary) / .10)', base: 'hsl(var(--primary) / .35)', active: 'hsl(var(--primary) / .62)' },
  Nordeste:       { dim: 'hsl(var(--primary) / .11)', base: 'hsl(var(--primary) / .45)', active: 'hsl(var(--primary) / .70)' },
  'Centro-Oeste': { dim: 'hsl(var(--primary) / .12)', base: 'hsl(var(--primary) / .55)', active: 'hsl(var(--primary) / .78)' },
  Sudeste:        { dim: 'hsl(var(--primary) / .12)', base: 'hsl(var(--primary) / .65)', active: 'hsl(var(--primary) / .86)' },
  Sul:            { dim: 'hsl(var(--primary) / .11)', base: 'hsl(var(--primary) / .50)', active: 'hsl(var(--primary) / .74)' },
}

const DOT_COLOR    = 'hsl(var(--primary))'
const DOT_SELECTED = 'hsl(var(--primary) / .90)'

// ─── Tipos públicos ───────────────────────────────────────────────────────────
export interface CityPoint {
  city:        string
  state:       string
  count:       number
  coordinates: [number, number] // [lng, lat]
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
const MOCK_CITIES: CityPoint[] = [
  { city:'São Paulo',      state:'SP', count:45, coordinates:[-46.63,-23.55] },
  { city:'Rio de Janeiro', state:'RJ', count:28, coordinates:[-43.17,-22.91] },
  { city:'Belo Horizonte', state:'MG', count:20, coordinates:[-43.94,-19.92] },
  { city:'Salvador',       state:'BA', count:15, coordinates:[-38.50,-12.97] },
  { city:'Fortaleza',      state:'CE', count:12, coordinates:[-38.54, -3.72] },
  { city:'Curitiba',       state:'PR', count:10, coordinates:[-49.27,-25.42] },
  { city:'Porto Alegre',   state:'RS', count: 9, coordinates:[-51.23,-30.03] },
  { city:'Recife',         state:'PE', count: 8, coordinates:[-34.88, -8.05] },
  { city:'Goiânia',        state:'GO', count: 7, coordinates:[-49.26,-16.69] },
  { city:'Manaus',         state:'AM', count: 5, coordinates:[-60.02, -3.10] },
  { city:'Belém',          state:'PA', count: 4, coordinates:[-48.50, -1.46] },
  { city:'Natal',          state:'RN', count: 3, coordinates:[-35.21, -5.79] },
]

// ─── Componente ───────────────────────────────────────────────────────────────
export function UsersMapCard({ cities }: { cities: CityPoint[] }) {
  const isMock = cities.length === 0
  const data   = isMock ? MOCK_CITIES : cities

  const [selectedRegion,  setSelectedRegion]  = useState<RegionId | null>(null)
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null)
  const [hoveredState,    setHoveredState]    = useState<string | null>(null)
  const [hoveredRegion,   setHoveredRegion]   = useState<RegionId | null>(null)
  const [hoveredCity,     setHoveredCity]     = useState<CityPoint | null>(null)

  const total    = useMemo(() => data.reduce((s, c) => s + c.count, 0), [data])
  const maxCount = useMemo(() => Math.max(...data.map(c => c.count)), [data])

  const countByState = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of data) m[c.state] = (m[c.state] ?? 0) + c.count
    return m
  }, [data])

  const countByRegion = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of data) {
      const r = STATE_TO_REGION[c.state]
      if (r) m[r] = (m[r] ?? 0) + c.count
    }
    return m
  }, [data])

  const topRegions = useMemo(() =>
    REGIONS.map(r => ({ ...r, count: countByRegion[r.id] ?? 0 }))
      .sort((a, b) => b.count - a.count)
  , [countByRegion])

  // ─── Fill de cada estado ─────────────────────────────────────────────────
  function getStateFill(id: string): string {
    const region = STATE_TO_REGION[id]
    const t = region ? REGION_TONES[region] : null
    if (!t) return 'hsl(var(--muted))'

    if (selectedStateId === id) return DOT_SELECTED

    const inFilter = !selectedRegion || STATE_TO_REGION[id] === selectedRegion
    if (!inFilter) return t.dim

    // Hover sobre linha de região no painel geral — acende toda a região
    if (hoveredRegion) {
      return STATE_TO_REGION[id] === hoveredRegion ? t.active : t.dim
    }

    if (hoveredState === id) return t.active
    return t.base
  }

  // ─── Handlers ────────────────────────────────────────────────────────────
  function handleStateClick(id: string) {
    setSelectedStateId(prev => prev === id ? null : id)
    setHoveredCity(null)
  }

  function handleRegionClick(regionId: RegionId) {
    if (selectedRegion === regionId) {
      setSelectedRegion(null)
      setSelectedStateId(null)
    } else {
      setSelectedRegion(regionId)
      if (selectedStateId && STATE_TO_REGION[selectedStateId] !== regionId) {
        setSelectedStateId(null)
      }
    }
  }

  function clearAll() {
    setSelectedRegion(null)
    setSelectedStateId(null)
  }

  // ─── Modo do painel ───────────────────────────────────────────────────────
  const panelMode: 'default' | 'region' | 'state' =
    selectedStateId ? 'state' : selectedRegion ? 'region' : 'default'

  const panelCities = useMemo(() => {
    if (panelMode === 'state') {
      return data.filter(c => c.state === selectedStateId).sort((a, b) => b.count - a.count)
    }
    if (panelMode === 'region') {
      const set = new Set<string>(REGIONS.find(r => r.id === selectedRegion)?.states ?? [])
      return data.filter(c => set.has(c.state)).sort((a, b) => b.count - a.count)
    }
    return []
  }, [panelMode, selectedStateId, selectedRegion, data])

  const panelTotal = panelCities.reduce((s, c) => s + c.count, 0)
  const panelMax   = panelCities.length > 0 ? Math.max(...panelCities.map(c => c.count)) : 1

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Usuários por região</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Distribuição geográfica de endereços cadastrados
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">

        {/* ── Filtro por região — ButtonGroup ───────────────────────────────── */}
        <div className="px-4 pt-3 pb-2 border-b overflow-x-auto">
          <div className="inline-flex border rounded-md overflow-hidden whitespace-nowrap">
            <button
              onClick={clearAll}
              className={cn(
                'px-3 h-8 text-sm font-medium transition-colors border-r shrink-0',
                !selectedRegion
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              Todas
            </button>

            {REGIONS.map((r, i) => (
              <button
                key={r.id}
                onClick={() => handleRegionClick(r.id)}
                className={cn(
                  'px-3 h-8 text-sm font-medium transition-colors inline-flex items-center gap-2 shrink-0',
                  i < REGIONS.length - 1 && 'border-r',
                  selectedRegion === r.id
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-[320px]">

          {/* ── Mapa SVG ─────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-hidden p-2">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-full"
              style={{ maxHeight: 400 }}
            >
              {/* Estados */}
              {(brazilPaths as { id: string; path: string }[]).map(s => (
                <path
                  key={s.id}
                  d={s.path}
                  strokeWidth={selectedStateId === s.id ? 1.5 : 1}
                  className="stroke-background transition-colors duration-100 cursor-pointer"
                  style={{ fill: getStateFill(s.id) }}
                  onMouseEnter={() => setHoveredState(s.id)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => handleStateClick(s.id)}
                />
              ))}

              {/* Dots de cidade */}
              {data.map(city => {
                const [x, y]  = project(city.coordinates[0], city.coordinates[1])
                const r        = 3 + (city.count / maxCount) * 6
                const isHover  = hoveredCity?.city === city.city
                const inFilter = !selectedRegion || STATE_TO_REGION[city.state] === selectedRegion

                return (
                  <g
                    key={`${city.state}-${city.city}`}
                    style={{ cursor: 'pointer', opacity: inFilter ? 1 : 0.12 }}
                    onMouseEnter={() => { setHoveredCity(city); setHoveredState(city.state) }}
                    onMouseLeave={() => { setHoveredCity(null); setHoveredState(null) }}
                    onClick={() => handleStateClick(city.state)}
                  >
                    {/* Área de hit invisível */}
                    <circle cx={x} cy={y} r={r * 3.5} fill="transparent" />

                    {/* Pulso animado no hover */}
                    {isHover && (
                      <circle
                        cx={x} cy={y} r={r * 1.4}
                        style={{ fill: DOT_COLOR, transformBox: 'fill-box', transformOrigin: 'center' }}
                        className="animate-ping"
                        fillOpacity={0.45}
                      />
                    )}

                    {/* Glow estático */}
                    <circle cx={x} cy={y} r={r * 2.6} style={{ fill: DOT_COLOR }} fillOpacity={isHover ? 0.28 : 0.12} />
                    {/* Dot principal */}
                    <circle cx={x} cy={y} r={isHover ? r * 1.3 : r} style={{ fill: DOT_COLOR }} fillOpacity={isHover ? 1 : 0.82} />
                  </g>
                )
              })}

              {/* Tooltip */}
              {hoveredCity && (() => {
                const [cx, cy] = project(hoveredCity.coordinates[0], hoveredCity.coordinates[1])
                const tW = 148, tH = 46
                const tx = Math.min(cx + 14, W - tW - 4)
                const ty = Math.max(cy - tH - 10, 4)
                return (
                  <g pointerEvents="none">
                    <rect x={tx+1} y={ty+2} width={tW} height={tH} rx={6} fill="black" fillOpacity={0.08} />
                    <rect x={tx}   y={ty}   width={tW} height={tH} rx={6} className="fill-popover stroke-border" strokeWidth={0.5} />
                    <text x={tx+10} y={ty+17} className="fill-foreground"       fontSize={11} fontWeight={700} fontFamily="inherit">{hoveredCity.city}</text>
                    <text x={tx+10} y={ty+33} className="fill-muted-foreground" fontSize={10}                  fontFamily="inherit">
                      {hoveredCity.count} {hoveredCity.count === 1 ? 'usuário' : 'usuários'} · {hoveredCity.state}
                    </text>
                  </g>
                )
              })()}
            </svg>
          </div>

          {/* ── Painel direito ────────────────────────────────────────────────── */}
          <div className="w-52 shrink-0 border-l flex flex-col overflow-hidden">

            {/* MODO GERAL */}
            {panelMode === 'default' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-5 pb-3 shrink-0">
                  <p className="text-3xl font-bold tabular-nums leading-none">
                    {total.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isMock ? 'usuários (exemplo)' : 'usuários com endereço'}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
                  {topRegions.map(r => (
                    <div
                      key={r.id}
                      className={cn(
                        'space-y-1 transition-opacity duration-150 cursor-pointer',
                        hoveredRegion && hoveredRegion !== r.id ? 'opacity-30' : 'opacity-100',
                      )}
                      onClick={() => handleRegionClick(r.id)}
                      onMouseEnter={() => setHoveredRegion(r.id)}
                      onMouseLeave={() => setHoveredRegion(null)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{r.label}</span>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                          {total > 0 ? Math.round((r.count / total) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${total > 0 ? (r.count / total) * 100 : 0}%`,
                            background: DOT_COLOR,
                            opacity: 0.8,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {r.count} {r.count === 1 ? 'usuário' : 'usuários'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODO REGIÃO */}
            {panelMode === 'region' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-5 pb-3 border-b shrink-0">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                    {REGIONS.find(r => r.id === selectedRegion)?.label}
                  </p>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1">{panelTotal.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {panelTotal === 1 ? 'usuário' : 'usuários'} nessa região
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {panelCities.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center pt-4">
                      Nenhum usuário com endereço cadastrado aqui.
                    </p>
                  ) : panelCities.map(city => (
                    <div key={`${city.state}-${city.city}`} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate leading-tight">{city.city}</p>
                          <p className="text-[10px] text-muted-foreground">{city.state}</p>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{city.count}</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${(city.count / panelTotal) * 100}%`, background: DOT_COLOR }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODO ESTADO */}
            {panelMode === 'state' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-5 pb-3 border-b shrink-0">
                  <p className="text-xs text-muted-foreground font-medium">{selectedStateId}</p>
                  <p className="text-sm font-semibold leading-snug">{STATE_NAMES[selectedStateId!] ?? selectedStateId}</p>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1">{panelTotal.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {panelTotal === 1 ? 'usuário' : 'usuários'} nesse estado
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {panelCities.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center pt-4">
                      Nenhum usuário com endereço cadastrado aqui.
                    </p>
                  ) : panelCities.map(city => (
                    <div key={`${city.state}-${city.city}`} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium truncate min-w-0">{city.city}</p>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{city.count}</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${(city.count / panelTotal) * 100}%`, background: DOT_COLOR }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </CardContent>
    </Card>
  )
}
