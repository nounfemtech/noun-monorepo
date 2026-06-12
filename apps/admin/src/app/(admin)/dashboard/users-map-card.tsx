'use client'

import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { IconChevronLeft } from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { cn } from '@/lib/utils'
import brazilPaths from '@/data/brazil-states-paths.json'

// ─── Projeção ─────────────────────────────────────────────────────────────────
const W = 500, H = 420
const WEST = -73.98, EAST = -28.86, NORTH = 5.27, SOUTH = -33.74
const ASPECT = W / H

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
const REGION_TONES: Record<RegionId, { dim: string; base: string; active: string }> = {
  Norte:          { dim: 'hsl(var(--primary) / .10)', base: 'hsl(var(--primary) / .35)', active: 'hsl(var(--primary) / .62)' },
  Nordeste:       { dim: 'hsl(var(--primary) / .11)', base: 'hsl(var(--primary) / .45)', active: 'hsl(var(--primary) / .70)' },
  'Centro-Oeste': { dim: 'hsl(var(--primary) / .12)', base: 'hsl(var(--primary) / .55)', active: 'hsl(var(--primary) / .78)' },
  Sudeste:        { dim: 'hsl(var(--primary) / .12)', base: 'hsl(var(--primary) / .65)', active: 'hsl(var(--primary) / .86)' },
  Sul:            { dim: 'hsl(var(--primary) / .11)', base: 'hsl(var(--primary) / .50)', active: 'hsl(var(--primary) / .74)' },
}

const DOT_COLOR    = 'hsl(var(--primary))'              // núcleo do ponto
const DOT_SELECTED = 'hsl(var(--primary) / .90)'        // fill do estado selecionado

// ─── ViewBox ──────────────────────────────────────────────────────────────────
interface Box { x: number; y: number; w: number; h: number }
const FULL_BOX: Box = { x: 0, y: 0, w: W, h: H }

// Normaliza um retângulo para o aspect ratio do mapa, com padding proporcional.
function fitBox(minX: number, minY: number, maxX: number, maxY: number, padFrac = 0.14): Box {
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  let w = (maxX - minX) * (1 + padFrac * 2)
  let h = (maxY - minY) * (1 + padFrac * 2)
  if (w / h > ASPECT) h = w / ASPECT
  else                w = h * ASPECT
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}

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
  { city:'Campinas',       state:'SP', count:18, coordinates:[-47.06,-22.91] },
  { city:'Santos',         state:'SP', count:11, coordinates:[-46.33,-23.96] },
  { city:'Rio de Janeiro', state:'RJ', count:28, coordinates:[-43.17,-22.91] },
  { city:'Niterói',        state:'RJ', count: 9, coordinates:[-43.10,-22.88] },
  { city:'Belo Horizonte', state:'MG', count:20, coordinates:[-43.94,-19.92] },
  { city:'Uberlândia',     state:'MG', count: 8, coordinates:[-48.28,-18.92] },
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

type Level = 'default' | 'region' | 'state' | 'city'

// ─── Componente ───────────────────────────────────────────────────────────────
export function UsersMapCard({ cities }: { cities: CityPoint[] }) {
  const isMock = cities.length === 0
  const data   = isMock ? MOCK_CITIES : cities

  // Seleção hierárquica
  const [selectedRegion,  setSelectedRegion]  = useState<RegionId | null>(null)
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null)
  const [selectedCity,    setSelectedCity]    = useState<CityPoint | null>(null)

  // Hover
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [hoveredCity,  setHoveredCity]  = useState<CityPoint | null>(null)

  const level: Level =
    selectedCity ? 'city' : selectedStateId ? 'state' : selectedRegion ? 'region' : 'default'

  // ─── Agregações ───────────────────────────────────────────────────────────
  const total = useMemo(() => data.reduce((s, c) => s + c.count, 0), [data])

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

  // Estados (com usuários) da região selecionada
  const statesOfRegion = useMemo(() => {
    if (!selectedRegion) return []
    const states = REGIONS.find(r => r.id === selectedRegion)?.states ?? []
    return states
      .map(s => ({ id: s, name: STATE_NAMES[s] ?? s, count: countByState[s] ?? 0 }))
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [selectedRegion, countByState])

  // Cidades (com usuários) do estado selecionado
  const citiesOfState = useMemo(() => {
    if (!selectedStateId) return []
    return data.filter(c => c.state === selectedStateId).sort((a, b) => b.count - a.count)
  }, [selectedStateId, data])

  const regionTotal = selectedRegion ? (countByRegion[selectedRegion] ?? 0) : 0
  const stateTotal  = selectedStateId ? (countByState[selectedStateId] ?? 0) : 0

  // ─── Escopo de renderização ─────────────────────────────────────────────────
  function inScope(stateId: string): boolean {
    if (level === 'default') return true
    if (level === 'region')  return STATE_TO_REGION[stateId] === selectedRegion
    return stateId === selectedStateId // state | city
  }

  const visibleDots = useMemo(() => {
    return data.filter(c => {
      if (level === 'default') return true
      if (level === 'region')  return STATE_TO_REGION[c.state] === selectedRegion
      if (level === 'state')   return c.state === selectedStateId
      return selectedCity ? (c.city === selectedCity.city && c.state === selectedCity.state) : false
    })
  }, [data, level, selectedRegion, selectedStateId, selectedCity])

  const scopeMax = useMemo(
    () => Math.max(1, ...visibleDots.map(c => c.count)),
    [visibleDots],
  )

  // ─── Navegação ───────────────────────────────────────────────────────────────
  const selectRegion = (r: RegionId) => {
    setSelectedRegion(prev => prev === r ? null : r)
    setSelectedStateId(null)
    setSelectedCity(null)
    setHoveredCity(null)
  }
  const selectState = (s: string) => {
    setSelectedRegion(STATE_TO_REGION[s] ?? null)
    setSelectedStateId(s)
    setSelectedCity(null)
    setHoveredCity(null)
  }
  const selectCity = (c: CityPoint) => {
    setSelectedRegion(STATE_TO_REGION[c.state] ?? null)
    setSelectedStateId(c.state)
    setSelectedCity(c)
  }
  const clearAll      = () => { setSelectedRegion(null); setSelectedStateId(null); setSelectedCity(null); setHoveredCity(null) }
  const backToRegion  = () => { setSelectedStateId(null); setSelectedCity(null); setHoveredCity(null) }
  const backToState   = () => { setSelectedCity(null) }

  // ─── Tween do viewBox ─────────────────────────────────────────────────────────
  const [viewBox, setViewBox] = useState<Box>(FULL_BOX)
  const vbRef  = useRef<Box>(FULL_BOX)
  const rafRef = useRef<number | undefined>(undefined)
  const pathEls = useRef<Record<string, SVGPathElement | null>>({})

  const setVB = useCallback((v: Box) => { vbRef.current = v; setViewBox(v) }, [])

  const animateTo = useCallback((target: Box) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const start = vbRef.current
    const t0 = performance.now()
    const dur = 480
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      const e = ease(p)
      setVB({
        x: start.x + (target.x - start.x) * e,
        y: start.y + (target.y - start.y) * e,
        w: start.w + (target.w - start.w) * e,
        h: start.h + (target.h - start.h) * e,
      })
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [setVB])

  function boxFromStates(ids: readonly string[]): Box | null {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const id of ids) {
      const el = pathEls.current[id]
      if (!el) continue
      const b = el.getBBox()
      minX = Math.min(minX, b.x);            minY = Math.min(minY, b.y)
      maxX = Math.max(maxX, b.x + b.width);  maxY = Math.max(maxY, b.y + b.height)
    }
    if (!isFinite(minX)) return null
    return fitBox(minX, minY, maxX, maxY)
  }

  useEffect(() => {
    let target: Box = FULL_BOX
    if (level === 'city' && selectedCity) {
      const [px, py] = project(selectedCity.coordinates[0], selectedCity.coordinates[1])
      const w = W * 0.17
      const h = w / ASPECT
      target = { x: px - w / 2, y: py - h / 2, w, h }
    } else if (level === 'state' && selectedStateId) {
      target = boxFromStates([selectedStateId]) ?? FULL_BOX
    } else if (level === 'region' && selectedRegion) {
      const states = REGIONS.find(r => r.id === selectedRegion)?.states ?? []
      target = boxFromStates(states) ?? FULL_BOX
    }
    animateTo(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, selectedRegion, selectedStateId, selectedCity])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  // Fator de escala inverso ao zoom — mantém pontos/traços com tamanho visual constante.
  const k = viewBox.w / W

  // ─── Fill / opacidade dos estados ─────────────────────────────────────────────
  function getStateFill(id: string): string {
    const region = STATE_TO_REGION[id]
    const t = region ? REGION_TONES[region] : null
    if (!t) return 'hsl(var(--muted))'
    if ((level === 'state' || level === 'city') && id === selectedStateId) return DOT_SELECTED
    if (hoveredState === id && inScope(id)) return t.active
    return t.base
  }
  function getStateOpacity(id: string): number {
    if (level === 'city')  return inScope(id) ? 0.4 : 0
    if (inScope(id))       return 1
    return level === 'region' ? 0.06 : 0.06
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="py-4 border-b">
        <CardTitle className="text-base">Usuários por região</CardTitle>
        <p className="text-sm text-muted-foreground mt-0.5">
          Distribuição geográfica de usuários cadastrados
        </p>
      </CardHeader>

      <CardContent className="px-6 pt-6 pb-6">

        <div className="flex justify-end mb-4">
          <div className="inline-flex border rounded-md overflow-hidden whitespace-nowrap shrink-0">
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
                onClick={() => selectRegion(r.id)}
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
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
              className="w-full h-full"
              style={{ maxHeight: 400 }}
            >
              {/* Estados — sempre renderizados (necessário p/ medir bbox); escopo via opacidade */}
              {(brazilPaths as { id: string; path: string }[]).map(s => {
                const scoped = inScope(s.id)
                return (
                  <path
                    key={s.id}
                    ref={el => { pathEls.current[s.id] = el }}
                    d={s.path}
                    strokeWidth={(selectedStateId === s.id ? 1.5 : 1) * k}
                    className="stroke-background transition-[fill,opacity] duration-200 cursor-pointer"
                    style={{ fill: getStateFill(s.id), opacity: getStateOpacity(s.id) }}
                    pointerEvents={scoped ? 'auto' : 'none'}
                    onMouseEnter={() => scoped && setHoveredState(s.id)}
                    onMouseLeave={() => setHoveredState(null)}
                    onClick={() => scoped && selectState(s.id)}
                  />
                )
              })}

              {/* Dots de cidade (apenas dentro do escopo atual) */}
              {visibleDots.map(city => {
                const [x, y]  = project(city.coordinates[0], city.coordinates[1])
                const base    = 3 + (city.count / scopeMax) * 6
                const r       = base * k
                const isHover = hoveredCity?.city === city.city && hoveredCity?.state === city.state
                const pulse   = isHover || (level === 'city')

                return (
                  <g
                    key={`${city.state}-${city.city}`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => { setHoveredCity(city); setHoveredState(city.state) }}
                    onMouseLeave={() => { setHoveredCity(null); setHoveredState(null) }}
                    onClick={() => selectCity(city)}
                  >
                    {/* Área de hit invisível */}
                    <circle cx={x} cy={y} r={r * 3.5} fill="transparent" />

                    {/* Pulso animado */}
                    {pulse && (
                      <circle
                        cx={x} cy={y} r={r * 1.4}
                        style={{ fill: DOT_COLOR, transformBox: 'fill-box', transformOrigin: 'center' }}
                        className="animate-ping"
                        fillOpacity={0.45}
                      />
                    )}

                    {/* Glow estático */}
                    <circle cx={x} cy={y} r={r * 2.6} style={{ fill: DOT_COLOR }} fillOpacity={isHover ? 0.28 : 0.12} />

                    {/* Dot principal + sombra leve para descolar do mapa */}
                    <circle
                      cx={x} cy={y} r={isHover ? r * 1.3 : r}
                      style={{
                        fill: DOT_COLOR,
                        filter: `drop-shadow(0 ${0.8 * k}px ${1.8 * k}px hsl(var(--primary-foreground) / 0.4))`,
                      }}
                      fillOpacity={isHover ? 1 : 0.85}
                    />
                  </g>
                )
              })}

              {/* Tooltip */}
              {hoveredCity && (() => {
                const [cx, cy] = project(hoveredCity.coordinates[0], hoveredCity.coordinates[1])
                const tW = 148 * k, tH = 46 * k
                const tx = Math.min(cx + 14 * k, viewBox.x + viewBox.w - tW - 4 * k)
                const ty = Math.max(cy - tH - 10 * k, viewBox.y + 4 * k)
                return (
                  <g pointerEvents="none">
                    <rect x={tx + k} y={ty + 2 * k} width={tW} height={tH} rx={6 * k} fill="black" fillOpacity={0.08} />
                    <rect x={tx}     y={ty}         width={tW} height={tH} rx={6 * k} className="fill-popover stroke-border" strokeWidth={0.5 * k} />
                    <text x={tx + 10 * k} y={ty + 17 * k} className="fill-foreground"       fontSize={11 * k} fontWeight={700} fontFamily="inherit">{hoveredCity.city}</text>
                    <text x={tx + 10 * k} y={ty + 33 * k} className="fill-muted-foreground" fontSize={10 * k}                  fontFamily="inherit">
                      {hoveredCity.count} {hoveredCity.count === 1 ? 'usuário' : 'usuários'} · {hoveredCity.state}
                    </text>
                  </g>
                )
              })()}
            </svg>
          </div>

          {/* ── Painel direito ────────────────────────────────────────────────── */}
          <div className="w-52 shrink-0 border-l flex flex-col overflow-hidden">

            {/* MODO GERAL — lista de regiões */}
            {level === 'default' && (
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
                      className="space-y-1 cursor-pointer transition-opacity duration-150 hover:opacity-100"
                      onClick={() => selectRegion(r.id)}
                      onMouseEnter={() => setHoveredState(null)}
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
                          style={{ width: `${total > 0 ? (r.count / total) * 100 : 0}%`, background: DOT_COLOR, opacity: 0.8 }}
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

            {/* MODO REGIÃO — lista de estados */}
            {level === 'region' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b shrink-0">
                  <button
                    onClick={clearAll}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-2"
                  >
                    <IconChevronLeft size={12} /> Brasil
                  </button>
                  <p className="text-sm font-semibold leading-snug">
                    {REGIONS.find(r => r.id === selectedRegion)?.label}
                  </p>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1">{regionTotal.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {regionTotal === 1 ? 'usuário' : 'usuários'} na região
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {statesOfRegion.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center pt-4">
                      Nenhum usuário com endereço nessa região.
                    </p>
                  ) : statesOfRegion.map(st => (
                    <div
                      key={st.id}
                      className="space-y-1 cursor-pointer"
                      onClick={() => selectState(st.id)}
                      onMouseEnter={() => setHoveredState(st.id)}
                      onMouseLeave={() => setHoveredState(null)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate leading-tight">{st.name}</p>
                          <p className="text-[10px] text-muted-foreground">{st.id}</p>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{st.count}</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${regionTotal > 0 ? (st.count / regionTotal) * 100 : 0}%`, background: DOT_COLOR }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODO ESTADO — lista de cidades */}
            {level === 'state' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b shrink-0">
                  <button
                    onClick={backToRegion}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-2"
                  >
                    <IconChevronLeft size={12} /> {REGIONS.find(r => r.id === selectedRegion)?.label}
                  </button>
                  <p className="text-xs text-muted-foreground font-medium">{selectedStateId}</p>
                  <p className="text-sm font-semibold leading-snug">{STATE_NAMES[selectedStateId!] ?? selectedStateId}</p>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1">{stateTotal.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stateTotal === 1 ? 'usuário' : 'usuários'} no estado
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {citiesOfState.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center pt-4">
                      Nenhum usuário com endereço aqui.
                    </p>
                  ) : citiesOfState.map(city => (
                    <div
                      key={`${city.state}-${city.city}`}
                      className="space-y-1 cursor-pointer"
                      onClick={() => selectCity(city)}
                      onMouseEnter={() => setHoveredCity(city)}
                      onMouseLeave={() => setHoveredCity(null)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium truncate min-w-0">{city.city}</p>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{city.count}</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${stateTotal > 0 ? (city.count / stateTotal) * 100 : 0}%`, background: DOT_COLOR }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODO CIDADE — detalhe */}
            {level === 'city' && selectedCity && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b shrink-0">
                  <button
                    onClick={backToState}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-2"
                  >
                    <IconChevronLeft size={12} /> {STATE_NAMES[selectedCity.state] ?? selectedCity.state}
                  </button>
                  <p className="text-xs text-muted-foreground font-medium">
                    {selectedCity.state} · {REGIONS.find(r => r.id === STATE_TO_REGION[selectedCity.state])?.label}
                  </p>
                  <p className="text-sm font-semibold leading-snug">{selectedCity.city}</p>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1">{selectedCity.count.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedCity.count === 1 ? 'usuário' : 'usuários'} na cidade
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {stateTotal > 0
                      ? `${Math.round((selectedCity.count / stateTotal) * 100)}% dos usuários de ${selectedCity.state}.`
                      : null}
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </CardContent>
    </Card>
  )
}
