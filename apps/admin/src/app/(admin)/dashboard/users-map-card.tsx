'use client'

import { useMemo, useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { IconChevronLeft, IconMaximize, IconMinimize, IconPlus, IconMinus, IconCurrentLocation } from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import brazilPaths from '@/data/brazil-states-paths.json'

// ─── Projeção equiretangular do Brasil ────────────────────────────────────────
const BR_W = 500, BR_H = 420
const BR_WEST = -73.96, BR_EAST = -24.65, BR_NORTH = 5.31, BR_SOUTH = -33.70

function brProject(lng: number, lat: number): [number, number] {
  return [
    ((lng - BR_WEST) / (BR_EAST - BR_WEST)) * BR_W,
    ((BR_NORTH - lat) / (BR_NORTH - BR_SOUTH)) * BR_H,
  ]
}

// ─── Regiões ──────────────────────────────────────────────────────────────────
const REGIONS = [
  { id: 'Norte',        label: 'Norte',        states: ['AC','AM','AP','PA','RO','RR','TO'] },
  { id: 'Nordeste',     label: 'Nordeste',     states: ['AL','BA','CE','MA','PB','PE','PI','RN','SE'] },
  { id: 'Centro-Oeste', label: 'Centro Oeste', states: ['DF','GO','MS','MT'] },
  { id: 'Sudeste',      label: 'Sudeste',      states: ['ES','MG','RJ','SP'] },
  { id: 'Sul',          label: 'Sul',          states: ['PR','RS','SC'] },
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

// ─── Cores ──────────────────────────────────────────────────────────────────────
const PRIMARY      = 'hsl(var(--primary))'
const LAND         = 'hsl(var(--map-land))'
const LAND_HOVER   = 'hsl(var(--map-land-hover))'
const LAND_ACTIVE  = 'hsl(var(--map-land-active))'
const MAP_BORDER   = 'hsl(var(--map-border))'
const MAP_LABEL    = 'hsl(var(--map-label))'

// ─── ViewBox ──────────────────────────────────────────────────────────────────
const MIN_W = 4
const DEFAULT_ASPECT = 760 / 392

interface Box { x: number; y: number; w: number; h: number }

function brazilFitW(aspect: number): number {
  return Math.max(BR_W, BR_H * aspect)
}

function fitBox(minX: number, minY: number, maxX: number, maxY: number, aspect: number, padFrac = 0.12): Box {
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  let w = (maxX - minX) * (1 + padFrac * 2)
  let h = (maxY - minY) * (1 + padFrac * 2)
  if (w / h > aspect) h = w / aspect
  else                w = h * aspect
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}

function clampVB(v: Box, aspect: number): Box {
  const maxW = brazilFitW(aspect)
  const w = Math.min(Math.max(v.w, MIN_W), maxW)
  const h = w / aspect
  let cx = v.x + v.w / 2, cy = v.y + v.h / 2
  cx = Math.min(Math.max(cx, 0), BR_W)
  cy = Math.min(Math.max(cy, 0), BR_H)
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

const BR_STATES = brazilPaths as { id: string; path: string }[]

// ─── Helpers de UI ──────────────────────────────────────────────────────────────
function BackBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-2"
    >
      <IconChevronLeft size={12} /> {label}
    </button>
  )
}

function MiniBar({ pct }: { pct: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: PRIMARY }} />
    </div>
  )
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function UsersMapCard({ cities }: { cities: CityPoint[] }) {
  const isMock = cities.length === 0
  const data   = isMock ? MOCK_CITIES : cities

  // ── Seleção Brasil ─────────────────────────────────────────────────────────
  const [selectedRegion,  setSelectedRegion]  = useState<RegionId | null>(null)
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null)
  const [selectedCity,    setSelectedCity]    = useState<CityPoint | null>(null)
  const [hoveredState,    setHoveredState]    = useState<string | null>(null)
  const [hoveredCity,     setHoveredCity]     = useState<CityPoint | null>(null)

  // ── Fullscreen (native API) ────────────────────────────────────────────────
  const cardRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) cardRef.current?.requestFullscreen().catch(() => {})
    else document.exitFullscreen().catch(() => {})
  }

  // ── Estado de navegação (níveis) ─────────────────────────────────────────────
  const level: 'default' | 'region' | 'state' | 'city' =
    selectedCity    ? 'city'
      : selectedStateId ? 'state'
      : selectedRegion  ? 'region'
      : 'default'

  // ── Agregações ────────────────────────────────────────────────────────────────
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
    REGIONS.map(r => ({ ...r, count: countByRegion[r.id] ?? 0 })).sort((a, b) => b.count - a.count)
  , [countByRegion])

  const statesOfRegion = useMemo(() => {
    if (!selectedRegion) return []
    const states = REGIONS.find(r => r.id === selectedRegion)?.states ?? []
    return states
      .map(s => ({ id: s, name: STATE_NAMES[s] ?? s, count: countByState[s] ?? 0 }))
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [selectedRegion, countByState])

  const citiesOfState = useMemo(() => {
    if (!selectedStateId) return []
    return data.filter(c => c.state === selectedStateId).sort((a, b) => b.count - a.count)
  }, [selectedStateId, data])

  const regionTotal = selectedRegion  ? (countByRegion[selectedRegion] ?? 0) : 0
  const stateTotal  = selectedStateId ? (countByState[selectedStateId] ?? 0) : 0

  // ── Dots visíveis ─────────────────────────────────────────────────────────────
  const visibleDots = useMemo(() => {
    if (selectedCity)    return data.filter(c => c.city === selectedCity.city && c.state === selectedCity.state)
    if (selectedStateId) return data.filter(c => c.state === selectedStateId)
    if (selectedRegion)  return data.filter(c => STATE_TO_REGION[c.state] === selectedRegion)
    return data
  }, [data, selectedCity, selectedRegion, selectedStateId])

  // ── Navegação ─────────────────────────────────────────────────────────────────
  const clearAll = () => {
    setSelectedRegion(null); setSelectedStateId(null); setSelectedCity(null)
    setHoveredCity(null); setHoveredState(null)
  }
  const selectRegion = (r: RegionId) => {
    setSelectedRegion(prev => prev === r ? null : r)
    setSelectedStateId(null); setSelectedCity(null); setHoveredCity(null)
  }
  const selectState = (s: string) => {
    setSelectedRegion(STATE_TO_REGION[s] ?? null)
    setSelectedStateId(s); setSelectedCity(null); setHoveredCity(null)
  }
  const selectCity = (c: CityPoint) => {
    setSelectedRegion(STATE_TO_REGION[c.state] ?? null)
    setSelectedStateId(c.state)
    setSelectedCity(c); setHoveredCity(null)
  }

  const backToRegion = () => { setSelectedStateId(null); setSelectedCity(null); setHoveredCity(null) }
  const backToState  = () => { setSelectedCity(null) }

  // ── Dimensões do container ─────────────────────────────────────────────────────
  const mapWrapRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 760, h: 392 })
  const dimsRef = useRef(dims)
  dimsRef.current = dims
  useEffect(() => {
    const el = mapWrapRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const cr = entries[0]?.contentRect
      if (cr && cr.width > 0 && cr.height > 0) setDims({ w: cr.width, h: cr.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const aspect = dims.w / dims.h
  const brazilTarget = useMemo(() => fitBox(0, 0, BR_W, BR_H, aspect, 0.08), [aspect])

  // ── ViewBox + tween ─────────────────────────────────────────────────────────
  const initialVB = useMemo(() => fitBox(0, 0, BR_W, BR_H, DEFAULT_ASPECT, 0.08), [])
  const [viewBox, setViewBox] = useState<Box>(initialVB)
  const vbRef    = useRef<Box>(initialVB)
  const rafRef   = useRef<number | undefined>(undefined)
  const brEls    = useRef<Record<string, SVGPathElement | null>>({})
  const svgRef   = useRef<SVGSVGElement>(null)

  const setVB = useCallback((v: Box) => { vbRef.current = v; setViewBox(v) }, [])
  const stopTween = useCallback(() => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

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

  function boxFromBrIds(ids: readonly string[], asp: number): Box | null {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const id of ids) {
      const el = brEls.current[id]
      if (!el) continue
      const b = el.getBBox()
      minX = Math.min(minX, b.x);          minY = Math.min(minY, b.y)
      maxX = Math.max(maxX, b.x + b.width); maxY = Math.max(maxY, b.y + b.height)
    }
    if (!isFinite(minX)) return null
    return fitBox(minX, minY, maxX, maxY, asp)
  }

  // Anima o viewBox conforme a seleção / filtro.
  useLayoutEffect(() => {
    const asp = dimsRef.current.w / dimsRef.current.h
    let target: Box | null

    if (selectedCity) {
      const [x, y] = brProject(selectedCity.coordinates[0], selectedCity.coordinates[1])
      const w = Math.max(MIN_W * 2.2, 44), h = w / asp
      target = { x: x - w / 2, y: y - h / 2, w, h }
    } else if (selectedStateId) {
      target = boxFromBrIds([selectedStateId], asp)
    } else if (selectedRegion) {
      const states = REGIONS.find(r => r.id === selectedRegion)?.states ?? []
      target = boxFromBrIds(states, asp)
    } else {
      target = brazilTarget
    }

    animateTo(clampVB(target ?? brazilTarget, asp))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion, selectedStateId, selectedCity])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  useEffect(() => {
    setVB(clampVB(vbRef.current, dims.w / dims.h))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims.w, dims.h])

  // ── Pan (arrastar) ─────────────────────────────────────────────────────────────
  const panRef = useRef<null | { sx: number; sy: number; vbx: number; vby: number; vbw: number; vbh: number; rectW: number; rectH: number; moved: boolean }>(null)
  const draggedRef = useRef(false)
  const [grabbing, setGrabbing] = useState(false)

  const onSvgPointerDown = (e: React.PointerEvent) => {
    stopTween()
    draggedRef.current = false
    const rect = svgRef.current!.getBoundingClientRect()
    const vb = vbRef.current
    panRef.current = {
      sx: e.clientX, sy: e.clientY,
      vbx: vb.x, vby: vb.y, vbw: vb.w, vbh: vb.h,
      rectW: rect.width, rectH: rect.height, moved: false,
    }
    setGrabbing(true)
  }

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const p = panRef.current
      if (!p) return
      const dx = e.clientX - p.sx, dy = e.clientY - p.sy
      if (!p.moved && Math.hypot(dx, dy) > 4) p.moved = true
      const asp = dimsRef.current.w / dimsRef.current.h
      const nx = p.vbx - (dx / p.rectW) * p.vbw
      const ny = p.vby - (dy / p.rectH) * p.vbh
      setVB(clampVB({ x: nx, y: ny, w: p.vbw, h: p.vbh }, asp))
    }
    const onUp = () => {
      if (panRef.current) draggedRef.current = panRef.current.moved
      panRef.current = null
      setGrabbing(false)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [setVB])

  // ── Zoom (scroll do mouse, no ponteiro) ─────────────────────────────────────────
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      stopTween()
      const rect = svg.getBoundingClientRect()
      const vb = vbRef.current
      const asp = dimsRef.current.w / dimsRef.current.h
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      const wx = vb.x + px * vb.w
      const wy = vb.y + py * vb.h
      const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15
      const nw = Math.min(Math.max(vb.w * factor, MIN_W), brazilFitW(asp))
      const nh = nw / asp
      setVB(clampVB({ x: wx - px * nw, y: wy - py * nh, w: nw, h: nh }, asp))
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [setVB, stopTween])

  // ── Zoom por botão + foco no Brasil ────────────────────────────────────────────
  const zoomByButton = (factor: number) => {
    stopTween()
    const vb = vbRef.current
    const asp = dimsRef.current.w / dimsRef.current.h
    const cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2
    const nw = Math.min(Math.max(vb.w * factor, MIN_W), brazilFitW(asp))
    const nh = nw / asp
    animateTo(clampVB({ x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh }, asp))
  }
  const focusBrazil = () => {
    clearAll()
    stopTween()
    animateTo(clampVB(brazilTarget, dimsRef.current.w / dimsRef.current.h))
  }

  // ── Medição de centroides/larguras (para rótulos de estado) ─────────────────────
  const stateMeta = useRef<Record<string, { cx: number; cy: number; w: number }>>({})
  const [metaReady, setMetaReady] = useState(false)
  useLayoutEffect(() => {
    for (const st of BR_STATES) {
      const el = brEls.current[st.id]
      if (!el) continue
      const b = el.getBBox()
      stateMeta.current[st.id] = { cx: b.x + b.width / 2, cy: b.y + b.height / 2, w: b.width }
    }
    setMetaReady(true)
  }, [])

  // ── Cores das terras ─────────────────────────────────────────────────────────
  function getStateFill(id: string): string {
    if (id === selectedStateId || hoveredState === id) return LAND_ACTIVE
    if (selectedRegion && STATE_TO_REGION[id] === selectedRegion) return LAND_HOVER
    return LAND
  }

  // ── Escala em pixels e helpers de rótulo ──────────────────────────────────────
  const pxPerUnit = dims.w / viewBox.w
  const fontWorld = (px: number) => px / pxPerUnit
  const inView = (x: number, y: number, m = 0) =>
    x >= viewBox.x - m && x <= viewBox.x + viewBox.w + m && y >= viewBox.y - m && y <= viewBox.y + viewBox.h + m

  const SHOW_STATE = viewBox.w < 550
  const SHOW_CITY  = viewBox.w < 250

  // ── Dots (uniformes e sutis, cor primary) ─────────────────────────────────────
  const DOT_R = 0.0062 * viewBox.w
  const renderDots = () =>
    visibleDots.map(city => {
      const [x, y] = brProject(city.coordinates[0], city.coordinates[1])
      const isHover = hoveredCity?.city === city.city && hoveredCity?.state === city.state
      const isSel   = selectedCity?.city === city.city && selectedCity?.state === city.state
      const pulse   = isHover || isSel
      return (
        <g
          key={`${city.state}-${city.city}`}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => { setHoveredCity(city); setHoveredState(city.state) }}
          onMouseLeave={() => { setHoveredCity(null); setHoveredState(null) }}
          onClick={() => { if (draggedRef.current) { draggedRef.current = false; return } selectCity(city) }}
        >
          <circle cx={x} cy={y} r={DOT_R * 3} fill="transparent" />
          {pulse && (
            <circle cx={x} cy={y} r={DOT_R * 1.3}
              style={{ fill: PRIMARY, transformBox: 'fill-box', transformOrigin: 'center' }}
              className="animate-ping" fillOpacity={0.4} />
          )}
          <circle cx={x} cy={y} r={isHover ? DOT_R * 1.7 : DOT_R * 1.5} style={{ fill: PRIMARY }} fillOpacity={isHover ? 0.2 : 0.1} />
          <circle cx={x} cy={y} r={isHover ? DOT_R * 1.15 : DOT_R}
            style={{ fill: PRIMARY, filter: `drop-shadow(0 0 ${DOT_R * 0.4}px hsl(var(--primary-foreground) / 0.4))` }}
            fillOpacity={1} />
        </g>
      )
    })

  // ── Tooltip (overlay HTML, nítido em qualquer zoom) ──────────────────────────────
  const tooltip = (() => {
    if (!hoveredCity) return null
    const [wx, wy] = brProject(hoveredCity.coordinates[0], hoveredCity.coordinates[1])
    const leftFrac = (wx - viewBox.x) / viewBox.w
    const topFrac  = (wy - viewBox.y) / viewBox.h
    if (leftFrac < 0 || leftFrac > 1 || topFrac < 0 || topFrac > 1) return null
    return (
      <div
        className="pointer-events-none absolute z-20 grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl whitespace-nowrap"
        style={{ left: `${leftFrac * 100}%`, top: `${topFrac * 100}%`, transform: `translate(-50%, calc(-100% - 10px))` }}
      >
        <div className="font-medium">{hoveredCity.city}, {hoveredCity.state}</div>
        <div className="flex w-full items-stretch gap-2">
          <div
            className="w-1 shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)"
            style={{ '--color-bg': PRIMARY, '--color-border': PRIMARY } as React.CSSProperties}
          />
          <div className="flex flex-1 justify-between items-center leading-none">
            <span className="text-muted-foreground">Usuários</span>
            <span className="font-mono font-medium tabular-nums text-foreground ml-auto pl-2">
              {hoveredCity.count.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    )
  })()

  // ─── Render ────────────────────────────────────────────────────────────────────
  return (
    <Card ref={cardRef} className={cn('map-fullscreen-card', isFullscreen && 'rounded-none flex flex-col')}>
      <CardHeader className="py-4 border-b shrink-0">
        <CardTitle className="text-base">Usuários por região</CardTitle>
        <p className="text-sm text-muted-foreground mt-0.5">
          Distribuição geográfica de usuários cadastrados
        </p>
      </CardHeader>

      <CardContent className={cn('px-6 pt-5 pb-6', isFullscreen && 'flex-1 flex flex-col overflow-hidden')}>

        {/* Filtro de escopo */}
        <div className="flex justify-end mb-4 shrink-0">
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
            {REGIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => selectRegion(r.id)}
                className={cn(
                  'px-3 h-8 text-sm font-medium transition-colors inline-flex items-center gap-2 shrink-0 border-r last:border-r-0',
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

        {/* Mapa + painel */}
        <div className={cn('flex border rounded-lg overflow-hidden', isFullscreen ? 'flex-1 min-h-0' : 'h-[400px]')}>

          {/* Mapa SVG */}
          <div ref={mapWrapRef} className="relative flex-1 overflow-hidden" style={{ background: 'hsl(var(--map-bg))' }}>
            {/* Fullscreen */}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-3 right-3 z-10 h-7 w-7 bg-background/90 backdrop-blur-sm shadow-sm"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <IconMinimize size={14} /> : <IconMaximize size={14} />}
            </Button>

            {/* Controles de zoom + foco */}
            <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5">
              <Button variant="outline" size="icon" className="h-7 w-7 bg-background/90 backdrop-blur-sm shadow-sm" onClick={() => zoomByButton(1 / 1.4)} title="Aproximar">
                <IconPlus size={14} />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 bg-background/90 backdrop-blur-sm shadow-sm" onClick={() => zoomByButton(1.4)} title="Afastar">
                <IconMinus size={14} />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 bg-background/90 backdrop-blur-sm shadow-sm" onClick={focusBrazil} title="Focar no Brasil">
                <IconCurrentLocation size={14} />
              </Button>
            </div>

            <svg
              ref={svgRef}
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-full touch-none select-none"
              style={{ cursor: grabbing ? 'grabbing' : 'grab' }}
              onPointerDown={onSvgPointerDown}
            >
              {/* Estados do Brasil */}
              {BR_STATES.map(st => (
                <path
                  key={st.id}
                  ref={el => { brEls.current[st.id] = el }}
                  d={st.path}
                  fillRule="evenodd"
                  stroke={MAP_BORDER}
                  strokeWidth={0.6}
                  vectorEffect="non-scaling-stroke"
                  className="transition-[fill] duration-200 cursor-pointer"
                  style={{ fill: getStateFill(st.id) }}
                  onMouseEnter={() => setHoveredState(st.id)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => { if (draggedRef.current) { draggedRef.current = false; return } selectState(st.id) }}
                />
              ))}

              {/* Rótulos: estados do Brasil */}
              {metaReady && SHOW_STATE && BR_STATES.map(st => {
                const m = stateMeta.current[st.id]
                if (!m) return null
                const screenW = m.w * pxPerUnit
                if (screenW < 24 || !inView(m.cx, m.cy)) return null
                const text = screenW > 58 ? (STATE_NAMES[st.id] ?? st.id) : st.id
                return (
                  <text key={`sl-${st.id}`} x={m.cx} y={m.cy} textAnchor="middle"
                    fontSize={fontWorld(11)} fontWeight={600} fontFamily="inherit" pointerEvents="none"
                    style={{ fill: MAP_LABEL, paintOrder: 'stroke', stroke: 'hsl(var(--map-bg))', strokeWidth: fontWorld(2) }}>
                    {text}
                  </text>
                )
              })}

              {renderDots()}

              {/* Rótulos: cidades (zoom aproximado) */}
              {SHOW_CITY && visibleDots.map(city => {
                const [x, y] = brProject(city.coordinates[0], city.coordinates[1])
                if (!inView(x, y)) return null
                return (
                  <text key={`city-${city.state}-${city.city}`}
                    x={x + DOT_R * 1.8} y={y + fontWorld(3.5)}
                    fontSize={fontWorld(10)} fontWeight={600} fontFamily="inherit" pointerEvents="none"
                    style={{ fill: 'hsl(var(--foreground))', paintOrder: 'stroke', stroke: 'hsl(var(--map-bg))', strokeWidth: fontWorld(2.5) }}>
                    {city.city}
                  </text>
                )
              })}
            </svg>

            {tooltip}
          </div>

          {/* Painel direito */}
          <div className="w-52 shrink-0 border-l bg-card flex flex-col overflow-hidden">

            {/* ── Default ── */}
            {level === 'default' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-5 pb-3 shrink-0">
                  <p className="text-3xl font-bold tabular-nums leading-none">{total.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isMock ? 'usuários (exemplo)' : 'usuários com endereço'}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto map-scroll px-5 pb-5 space-y-3">
                  {topRegions.map(r => (
                    <div key={r.id} className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => selectRegion(r.id)}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{r.label}</span>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                          {total > 0 ? Math.round((r.count / total) * 100) : 0}%
                        </span>
                      </div>
                      <MiniBar pct={total > 0 ? (r.count / total) * 100 : 0} />
                      <p className="text-[10px] text-muted-foreground">{r.count} {r.count === 1 ? 'usuário' : 'usuários'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Região ── */}
            {level === 'region' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b shrink-0">
                  <BackBtn onClick={clearAll} label="Brasil" />
                  <p className="text-sm font-semibold">{REGIONS.find(r => r.id === selectedRegion)?.label}</p>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1">{regionTotal.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{regionTotal === 1 ? 'usuário' : 'usuários'} na região</p>
                </div>
                <div className="flex-1 overflow-y-auto map-scroll px-5 py-4 space-y-3">
                  {statesOfRegion.length === 0
                    ? <p className="text-xs text-muted-foreground text-center pt-4">Nenhum usuário nessa região.</p>
                    : statesOfRegion.map(st => (
                      <div key={st.id} className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => selectState(st.id)}
                        onMouseEnter={() => setHoveredState(st.id)}
                        onMouseLeave={() => setHoveredState(null)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{st.name}</p>
                            <p className="text-[10px] text-muted-foreground">{st.id}</p>
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums shrink-0">{st.count}</span>
                        </div>
                        <MiniBar pct={regionTotal > 0 ? (st.count / regionTotal) * 100 : 0} />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ── Estado ── */}
            {level === 'state' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b shrink-0">
                  <BackBtn onClick={backToRegion} label={REGIONS.find(r => r.id === selectedRegion)?.label ?? 'Região'} />
                  <p className="text-xs text-muted-foreground font-medium">{selectedStateId}</p>
                  <p className="text-sm font-semibold">{STATE_NAMES[selectedStateId!] ?? selectedStateId}</p>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1">{stateTotal.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stateTotal === 1 ? 'usuário' : 'usuários'} no estado</p>
                </div>
                <div className="flex-1 overflow-y-auto map-scroll px-5 py-4 space-y-3">
                  {citiesOfState.map(city => (
                    <div
                      key={`${city.state}-${city.city}`}
                      className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => selectCity(city)}
                      onMouseEnter={() => setHoveredCity(city)}
                      onMouseLeave={() => setHoveredCity(null)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium truncate min-w-0">{city.city}</p>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{city.count}</span>
                      </div>
                      <MiniBar pct={stateTotal > 0 ? (city.count / stateTotal) * 100 : 0} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Cidade ── */}
            {level === 'city' && selectedCity && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b shrink-0">
                  <BackBtn onClick={backToState} label={STATE_NAMES[selectedCity.state] ?? selectedCity.state} />
                  <p className="text-xs text-muted-foreground font-medium">
                    {selectedCity.state} · {REGIONS.find(r => r.id === STATE_TO_REGION[selectedCity.state])?.label}
                  </p>
                  <p className="text-sm font-semibold">{selectedCity.city}</p>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1">{selectedCity.count.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedCity.count === 1 ? 'usuário' : 'usuários'} na cidade</p>
                </div>
                <div className="flex-1 overflow-y-auto map-scroll px-5 py-4">
                  {stateTotal > 0 && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {Math.round((selectedCity.count / stateTotal) * 100)}% dos usuários de {selectedCity.state}.
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </CardContent>
    </Card>
  )
}
