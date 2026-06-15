'use client'

import { useMemo, useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { IconChevronLeft, IconMaximize, IconMinimize } from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import brazilPaths from '@/data/brazil-states-paths.json'
import worldPaths from '@/data/world-countries-paths.json'

// ─── Projeções equiretangulares ────────────────────────────────────────────────
// Brasil
const BR_W = 500, BR_H = 420
const BR_WEST = -73.98, BR_EAST = -28.86, BR_NORTH = 5.27, BR_SOUTH = -33.74
function brProject(lng: number, lat: number): [number, number] {
  return [
    ((lng - BR_WEST) / (BR_EAST - BR_WEST)) * BR_W,
    ((BR_NORTH - lat) / (BR_NORTH - BR_SOUTH)) * BR_H,
  ]
}

// Mundo (mesmos limites usados na geração de world-countries-paths.json)
const WD_W = 1000
const WD_WEST = -180, WD_EAST = 180, WD_NORTH = 83, WD_SOUTH = -56
const WD_H = (WD_W * (WD_NORTH - WD_SOUTH)) / (WD_EAST - WD_WEST) // 386.111
function wdProject(lng: number, lat: number): [number, number] {
  return [
    ((lng - WD_WEST) / (WD_EAST - WD_WEST)) * WD_W,
    ((WD_NORTH - lat) / (WD_NORTH - WD_SOUTH)) * WD_H,
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

// Tons do primary por região — mesmo matiz, opacidade crescente.
const REGION_TONES: Record<RegionId, { base: string; active: string }> = {
  Norte:          { base: 'hsl(var(--primary) / .35)', active: 'hsl(var(--primary) / .62)' },
  Nordeste:       { base: 'hsl(var(--primary) / .45)', active: 'hsl(var(--primary) / .70)' },
  'Centro-Oeste': { base: 'hsl(var(--primary) / .55)', active: 'hsl(var(--primary) / .78)' },
  Sudeste:        { base: 'hsl(var(--primary) / .65)', active: 'hsl(var(--primary) / .86)' },
  Sul:            { base: 'hsl(var(--primary) / .50)', active: 'hsl(var(--primary) / .74)' },
}

const DOT_COLOR     = 'hsl(var(--primary))'
const STATE_ACTIVE  = 'hsl(var(--primary) / .90)'
const COUNTRY_DATA  = 'hsl(var(--primary) / .30)'   // país com usuários
const COUNTRY_HOVER = 'hsl(var(--primary) / .55)'

// ─── ViewBox ──────────────────────────────────────────────────────────────────
interface Box { x: number; y: number; w: number; h: number }
const BR_FULL: Box = { x: 0, y: 0, w: BR_W, h: BR_H }
const WD_FULL: Box = { x: 0, y: 0, w: WD_W, h: WD_H }

// Normaliza um retângulo para o aspect ratio do escopo, com padding proporcional.
function fitBox(minX: number, minY: number, maxX: number, maxY: number, aspect: number, padFrac = 0.16): Box {
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  let w = (maxX - minX) * (1 + padFrac * 2)
  let h = (maxY - minY) * (1 + padFrac * 2)
  if (w / h > aspect) h = w / aspect
  else                w = h * aspect
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}

// ─── Tipos públicos ───────────────────────────────────────────────────────────
export interface CityPoint {
  city:        string
  state:       string
  country?:    string  // presente apenas em pontos internacionais
  count:       number
  coordinates: [number, number] // [lng, lat]
}

interface WorldCountry { name: string; path: string; labelLng: number | null; labelLat: number | null }

// ─── Mock ─────────────────────────────────────────────────────────────────────
const MOCK_CITIES: CityPoint[] = [
  // Brasil
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
  // Internacional — country obrigatório, state = estado/província do país
  { city:'Lisboa',       state:'Lisboa',     country:'Portugal',       count:2, coordinates:[-9.14, 38.72] },
  { city:'Porto',        state:'Porto',      country:'Portugal',       count:1, coordinates:[-8.61, 41.15] },
  { city:'Miami',        state:'Flórida',    country:'Estados Unidos', count:2, coordinates:[-80.19, 25.77] },
  { city:'Nova York',    state:'Nova York',  country:'Estados Unidos', count:2, coordinates:[-74.00, 40.71] },
  { city:'Los Angeles',  state:'Califórnia', country:'Estados Unidos', count:1, coordinates:[-118.24,34.05] },
]

const WORLD = worldPaths as WorldCountry[]

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
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: DOT_COLOR }} />
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

  // ── Seleção Internacional ──────────────────────────────────────────────────
  const [selectedInternacional, setSelectedInternacional] = useState(false)
  const [selectedCountry,       setSelectedCountry]       = useState<string | null>(null)
  const [selectedCountryState,  setSelectedCountryState]  = useState<string | null>(null)
  const [hoveredCountry,        setHoveredCountry]        = useState<string | null>(null)

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

  // ── Escopo ──────────────────────────────────────────────────────────────────
  const scope: 'brazil' | 'world' = selectedInternacional ? 'world' : 'brazil'
  const isBrazil = scope === 'brazil'
  const isInt    = scope === 'world'

  // Nível dentro do escopo Brasil
  const blevel: 'default' | 'region' | 'state' | 'city' =
    selectedCity && !selectedCity.country ? 'city'
      : selectedStateId ? 'state'
      : selectedRegion  ? 'region'
      : 'default'

  // Nível dentro do escopo Mundo
  const wlevel: 'internacional' | 'country' | 'countryState' | 'city' =
    selectedCity?.country ? 'city'
      : selectedCountryState ? 'countryState'
      : selectedCountry      ? 'country'
      : 'internacional'

  // ── Agregações Brasil ────────────────────────────────────────────────────────
  const brData = useMemo(() => data.filter(c => !c.country), [data])
  const total  = useMemo(() => data.reduce((s, c) => s + c.count, 0), [data])

  const countByState = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of brData) m[c.state] = (m[c.state] ?? 0) + c.count
    return m
  }, [brData])

  const countByRegion = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of brData) {
      const r = STATE_TO_REGION[c.state]
      if (r) m[r] = (m[r] ?? 0) + c.count
    }
    return m
  }, [brData])

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
    return brData.filter(c => c.state === selectedStateId).sort((a, b) => b.count - a.count)
  }, [selectedStateId, brData])

  const regionTotal = selectedRegion  ? (countByRegion[selectedRegion] ?? 0) : 0
  const stateTotal  = selectedStateId ? (countByState[selectedStateId] ?? 0) : 0

  // ── Agregações Internacional ──────────────────────────────────────────────────
  const intData            = useMemo(() => data.filter(c => c.country), [data])
  const internacionalCount = useMemo(() => intData.reduce((s, c) => s + c.count, 0), [intData])

  const countByCountry = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of intData) m[c.country!] = (m[c.country!] ?? 0) + c.count
    return m
  }, [intData])

  const dataCountries = useMemo(() => new Set(Object.keys(countByCountry)), [countByCountry])

  const topCountries = useMemo(() =>
    Object.entries(countByCountry).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  , [countByCountry])

  const citiesOfCountry = useMemo(
    () => selectedCountry ? intData.filter(c => c.country === selectedCountry) : [],
    [intData, selectedCountry],
  )

  const statesOfCountry = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of citiesOfCountry) m[c.state] = (m[c.state] ?? 0) + c.count
    return Object.entries(m).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [citiesOfCountry])

  const countryTotal = useMemo(() => citiesOfCountry.reduce((s, c) => s + c.count, 0), [citiesOfCountry])

  const citiesOfCountryState = useMemo(
    () => (selectedCountry && selectedCountryState)
      ? intData.filter(c => c.country === selectedCountry && c.state === selectedCountryState).sort((a, b) => b.count - a.count)
      : [],
    [intData, selectedCountry, selectedCountryState],
  )

  const countryStateTotal = useMemo(() => citiesOfCountryState.reduce((s, c) => s + c.count, 0), [citiesOfCountryState])

  // ── Dots visíveis no escopo atual ────────────────────────────────────────────
  const visibleDots = useMemo(() => {
    if (isInt) {
      if (selectedCity?.country) return [selectedCity]
      if (selectedCountryState)  return citiesOfCountryState
      if (selectedCountry)       return citiesOfCountry
      return intData
    }
    if (selectedCity)    return brData.filter(c => c.city === selectedCity.city && c.state === selectedCity.state)
    if (selectedStateId) return brData.filter(c => c.state === selectedStateId)
    if (selectedRegion)  return brData.filter(c => STATE_TO_REGION[c.state] === selectedRegion)
    return brData
  }, [isInt, brData, intData, selectedCountry, selectedCountryState, selectedCity,
      selectedRegion, selectedStateId, citiesOfCountry, citiesOfCountryState])

  const scopeMax = useMemo(() => Math.max(1, ...visibleDots.map(c => c.count)), [visibleDots])

  // ── Navegação ─────────────────────────────────────────────────────────────────
  const clearAll = () => {
    setSelectedRegion(null); setSelectedStateId(null); setSelectedCity(null); setHoveredCity(null); setHoveredState(null)
    setSelectedInternacional(false); setSelectedCountry(null); setSelectedCountryState(null); setHoveredCountry(null)
  }
  const selectRegion = (r: RegionId) => {
    setSelectedInternacional(false); setSelectedCountry(null); setSelectedCountryState(null)
    setSelectedRegion(prev => prev === r ? null : r)
    setSelectedStateId(null); setSelectedCity(null); setHoveredCity(null)
  }
  const selectState = (s: string) => {
    setSelectedInternacional(false); setSelectedCountry(null); setSelectedCountryState(null)
    setSelectedRegion(STATE_TO_REGION[s] ?? null)
    setSelectedStateId(s); setSelectedCity(null); setHoveredCity(null)
  }
  const selectCity = (c: CityPoint) => {
    if (c.country) {
      setSelectedInternacional(true)
      setSelectedCountry(c.country); setSelectedCountryState(c.state)
      setSelectedRegion(null); setSelectedStateId(null)
    } else {
      setSelectedInternacional(false)
      setSelectedCountry(null); setSelectedCountryState(null)
      setSelectedRegion(STATE_TO_REGION[c.state] ?? null)
      setSelectedStateId(c.state)
    }
    setSelectedCity(c); setHoveredCity(null)
  }
  const selectInternacional = () => {
    setSelectedInternacional(true)
    setSelectedRegion(null); setSelectedStateId(null); setSelectedCity(null); setHoveredCity(null); setHoveredState(null)
    setSelectedCountry(null); setSelectedCountryState(null)
  }
  const selectCountry = (name: string) => {
    setSelectedCountry(name); setSelectedCountryState(null); setSelectedCity(null); setHoveredCity(null)
  }
  const selectCountryState = (s: string) => {
    setSelectedCountryState(s); setSelectedCity(null); setHoveredCity(null)
  }

  const backToRegion        = () => { setSelectedStateId(null); setSelectedCity(null); setHoveredCity(null) }
  const backToState         = () => { setSelectedCity(null) }
  const backToInternacional = () => { setSelectedCountry(null); setSelectedCountryState(null); setSelectedCity(null); setHoveredCity(null) }
  const backToCountry       = () => { setSelectedCountryState(null); setSelectedCity(null); setHoveredCity(null) }
  const backToCountryState  = () => { setSelectedCity(null); setHoveredCity(null) }

  // ── Tween do viewBox ──────────────────────────────────────────────────────────
  const initialVB = scope === 'world' ? WD_FULL : BR_FULL
  const [viewBox, setViewBox] = useState<Box>(initialVB)
  const vbRef    = useRef<Box>(initialVB)
  const rafRef   = useRef<number | undefined>(undefined)
  const brEls    = useRef<Record<string, SVGPathElement | null>>({})
  const wdEls    = useRef<Record<string, SVGPathElement | null>>({})
  const prevScope = useRef(scope)

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

  function boxFromEls(els: Record<string, SVGPathElement | null>, ids: readonly string[], aspect: number): Box | null {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const id of ids) {
      const el = els[id]
      if (!el) continue
      const b = el.getBBox()
      minX = Math.min(minX, b.x);           minY = Math.min(minY, b.y)
      maxX = Math.max(maxX, b.x + b.width); maxY = Math.max(maxY, b.y + b.height)
    }
    if (!isFinite(minX)) return null
    return fitBox(minX, minY, maxX, maxY, aspect)
  }

  function boxFromDots(dots: CityPoint[], project: (lng: number, lat: number) => [number, number], w: number, h: number): Box | null {
    if (dots.length === 0) return null
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const d of dots) {
      const [x, y] = project(d.coordinates[0], d.coordinates[1])
      minX = Math.min(minX, x); minY = Math.min(minY, y)
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
    }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
    if (maxX - minX < w * 0.06) { minX = cx - w * 0.03; maxX = cx + w * 0.03 }
    if (maxY - minY < h * 0.06) { minY = cy - h * 0.03; maxY = cy + h * 0.03 }
    return fitBox(minX, minY, maxX, maxY, w / h)
  }

  useLayoutEffect(() => {
    const W = scope === 'world' ? WD_W : BR_W
    const Hh = scope === 'world' ? WD_H : BR_H
    const aspect = W / Hh
    let target: Box

    if (scope === 'brazil') {
      if (selectedCity && !selectedCity.country) {
        const [x, y] = brProject(selectedCity.coordinates[0], selectedCity.coordinates[1])
        const w = BR_W * 0.17, h = w / aspect
        target = { x: x - w / 2, y: y - h / 2, w, h }
      } else if (selectedStateId) {
        target = boxFromEls(brEls.current, [selectedStateId], aspect) ?? BR_FULL
      } else if (selectedRegion) {
        const states = REGIONS.find(r => r.id === selectedRegion)?.states ?? []
        target = boxFromEls(brEls.current, states, aspect) ?? BR_FULL
      } else {
        target = BR_FULL
      }
    } else {
      if (selectedCity?.country) {
        const [x, y] = wdProject(selectedCity.coordinates[0], selectedCity.coordinates[1])
        const w = WD_W * 0.09, h = w / aspect
        target = { x: x - w / 2, y: y - h / 2, w, h }
      } else if (selectedCountryState) {
        target = boxFromDots(citiesOfCountryState, wdProject, WD_W, WD_H) ?? WD_FULL
      } else if (selectedCountry) {
        target = boxFromEls(wdEls.current, [selectedCountry], aspect)
          ?? boxFromDots(citiesOfCountry, wdProject, WD_W, WD_H) ?? WD_FULL
      } else {
        target = boxFromDots(intData, wdProject, WD_W, WD_H) ?? WD_FULL
      }
    }

    if (prevScope.current !== scope) setVB(scope === 'world' ? WD_FULL : BR_FULL)
    prevScope.current = scope
    animateTo(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, selectedRegion, selectedStateId, selectedCity, selectedCountry, selectedCountryState])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  // Escala visual constante (referência fixa 500 para ambos os escopos).
  const s = viewBox.w / 500

  // ── Fill/opacidade dos estados (Brasil) ───────────────────────────────────────
  function inScope(stateId: string): boolean {
    if (blevel === 'default') return true
    if (blevel === 'region')  return STATE_TO_REGION[stateId] === selectedRegion
    return stateId === selectedStateId
  }
  function getStateFill(id: string): string {
    const region = STATE_TO_REGION[id]
    const t = region ? REGION_TONES[region] : null
    if (!t) return 'hsl(var(--muted))'
    if ((blevel === 'state' || blevel === 'city') && id === selectedStateId) return STATE_ACTIVE
    if (hoveredState === id && inScope(id)) return t.active
    return t.base
  }
  function getStateOpacity(id: string): number {
    if (blevel === 'city') return inScope(id) ? 0.4 : 0
    if (inScope(id))       return 1
    return 0.06
  }

  // ── Fill dos países (Mundo) ───────────────────────────────────────────────────
  function getCountryFill(name: string): string {
    if (name === selectedCountry)              return STATE_ACTIVE
    if (hoveredCountry === name)               return COUNTRY_HOVER
    if (dataCountries.has(name))               return COUNTRY_DATA
    return 'hsl(var(--muted))'
  }

  // Tooltip helper (compartilhado pelos dois mapas)
  const renderTooltip = (project: (lng: number, lat: number) => [number, number]) => {
    if (!hoveredCity) return null
    const [cx, cy] = project(hoveredCity.coordinates[0], hoveredCity.coordinates[1])
    const tW = 156 * s, tH = 46 * s
    const tx = Math.min(cx + 14 * s, viewBox.x + viewBox.w - tW - 4 * s)
    const ty = Math.max(cy - tH - 10 * s, viewBox.y + 4 * s)
    const sub = hoveredCity.country
      ? `${hoveredCity.count} ${hoveredCity.count === 1 ? 'usuário' : 'usuários'} · ${hoveredCity.country}`
      : `${hoveredCity.count} ${hoveredCity.count === 1 ? 'usuário' : 'usuários'} · ${hoveredCity.state}`
    return (
      <g pointerEvents="none">
        <rect x={tx + s} y={ty + 2 * s} width={tW} height={tH} rx={6 * s} fill="black" fillOpacity={0.08} />
        <rect x={tx}     y={ty}         width={tW} height={tH} rx={6 * s} className="fill-popover stroke-border" strokeWidth={0.5 * s} />
        <text x={tx + 10 * s} y={ty + 17 * s} className="fill-foreground"       fontSize={11 * s} fontWeight={700} fontFamily="inherit">{hoveredCity.city}</text>
        <text x={tx + 10 * s} y={ty + 33 * s} className="fill-muted-foreground" fontSize={10 * s}                  fontFamily="inherit">{sub}</text>
      </g>
    )
  }

  // ── Dots (compartilhado) ──────────────────────────────────────────────────────
  const renderDots = (project: (lng: number, lat: number) => [number, number], pulseAll: boolean) =>
    visibleDots.map(city => {
      const [x, y]  = project(city.coordinates[0], city.coordinates[1])
      const base    = 3 + (city.count / scopeMax) * 6
      const r       = base * s
      const isHover = hoveredCity?.city === city.city && hoveredCity?.state === city.state
      const pulse   = isHover || pulseAll
      return (
        <g
          key={`${city.country ?? 'BR'}-${city.state}-${city.city}`}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => { setHoveredCity(city); if (!city.country) setHoveredState(city.state) }}
          onMouseLeave={() => { setHoveredCity(null); setHoveredState(null) }}
          onClick={() => selectCity(city)}
        >
          <circle cx={x} cy={y} r={r * 3.5} fill="transparent" />
          {pulse && (
            <circle cx={x} cy={y} r={r * 1.4}
              style={{ fill: DOT_COLOR, transformBox: 'fill-box', transformOrigin: 'center' }}
              className="animate-ping" fillOpacity={0.45} />
          )}
          <circle cx={x} cy={y} r={r * 2.6} style={{ fill: DOT_COLOR }} fillOpacity={isHover ? 0.28 : 0.12} />
          <circle cx={x} cy={y} r={isHover ? r * 1.3 : r}
            style={{ fill: DOT_COLOR, filter: `drop-shadow(0 ${0.8 * s}px ${1.8 * s}px hsl(var(--primary-foreground) / 0.4))` }}
            fillOpacity={isHover ? 1 : 0.85} />
        </g>
      )
    })

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
                !selectedRegion && !selectedInternacional
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
                  'px-3 h-8 text-sm font-medium transition-colors inline-flex items-center gap-2 shrink-0 border-r',
                  selectedRegion === r.id
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                {r.label}
              </button>
            ))}
            <button
              onClick={selectInternacional}
              className={cn(
                'px-3 h-8 text-sm font-medium transition-colors inline-flex items-center shrink-0',
                selectedInternacional
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              Internacional
            </button>
          </div>
        </div>

        {/* Mapa + painel */}
        <div className={cn('flex border rounded-lg overflow-hidden', isFullscreen ? 'flex-1 min-h-0' : 'h-[400px]')}>

          {/* Mapa SVG */}
          <div className="relative flex-1 overflow-hidden p-2">
            <Button
              variant="outline"
              size="icon"
              className="absolute top-3 right-3 z-10 h-7 w-7 bg-background/90 backdrop-blur-sm shadow-sm"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <IconMinimize size={14} /> : <IconMaximize size={14} />}
            </Button>

            <svg viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`} className="w-full h-full">
              {isBrazil ? (
                <>
                  {(brazilPaths as { id: string; path: string }[]).map(st => {
                    const scoped = inScope(st.id)
                    return (
                      <path
                        key={st.id}
                        ref={el => { brEls.current[st.id] = el }}
                        d={st.path}
                        strokeWidth={(selectedStateId === st.id ? 1.5 : 1) * s}
                        className="stroke-background transition-[fill,opacity] duration-200 cursor-pointer"
                        style={{ fill: getStateFill(st.id), opacity: getStateOpacity(st.id) }}
                        pointerEvents={scoped ? 'auto' : 'none'}
                        onMouseEnter={() => scoped && setHoveredState(st.id)}
                        onMouseLeave={() => setHoveredState(null)}
                        onClick={() => scoped && selectState(st.id)}
                      />
                    )
                  })}
                  {renderDots(brProject, blevel === 'city')}
                  {renderTooltip(brProject)}
                </>
              ) : (
                <>
                  {WORLD.map(c => {
                    const hasData = dataCountries.has(c.name)
                    return (
                      <path
                        key={c.name}
                        ref={el => { wdEls.current[c.name] = el }}
                        d={c.path}
                        fillRule="evenodd"
                        strokeWidth={0.4 * s}
                        className="stroke-background transition-[fill] duration-200"
                        style={{ fill: getCountryFill(c.name), cursor: hasData ? 'pointer' : 'default' }}
                        pointerEvents={hasData ? 'auto' : 'none'}
                        onMouseEnter={() => hasData && setHoveredCountry(c.name)}
                        onMouseLeave={() => setHoveredCountry(null)}
                        onClick={() => hasData && selectCountry(c.name)}
                      />
                    )
                  })}

                  {/* Rótulos dos países com usuários */}
                  {WORLD.filter(c => dataCountries.has(c.name) && c.labelLng != null && c.labelLat != null).map(c => {
                    const [lx, ly] = wdProject(c.labelLng!, c.labelLat!)
                    return (
                      <text
                        key={`lbl-${c.name}`}
                        x={lx} y={ly}
                        textAnchor="middle"
                        className="fill-foreground"
                        fontSize={8 * s}
                        fontWeight={600}
                        fontFamily="inherit"
                        pointerEvents="none"
                      >
                        {c.name}
                      </text>
                    )
                  })}

                  {renderDots(wdProject, wlevel === 'city')}
                  {renderTooltip(wdProject)}
                </>
              )}
            </svg>
          </div>

          {/* Painel direito */}
          <div className="w-52 shrink-0 border-l bg-card flex flex-col overflow-hidden">

            {/* ── BRASIL: Default ── */}
            {isBrazil && blevel === 'default' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-5 pb-3 shrink-0">
                  <p className="text-3xl font-bold tabular-nums leading-none">{total.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isMock ? 'usuários (exemplo)' : 'usuários com endereço'}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
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

                  {internacionalCount > 0 && (
                    <>
                      <div className="border-t" />
                      <div className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={selectInternacional}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">Internacional</span>
                          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                            {total > 0 ? Math.round((internacionalCount / total) * 100) : 0}%
                          </span>
                        </div>
                        <MiniBar pct={total > 0 ? (internacionalCount / total) * 100 : 0} />
                        <p className="text-[10px] text-muted-foreground">{internacionalCount} {internacionalCount === 1 ? 'usuário' : 'usuários'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── BRASIL: Região ── */}
            {isBrazil && blevel === 'region' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b shrink-0">
                  <BackBtn onClick={clearAll} label="Brasil" />
                  <p className="text-sm font-semibold">{REGIONS.find(r => r.id === selectedRegion)?.label}</p>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1">{regionTotal.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{regionTotal === 1 ? 'usuário' : 'usuários'} na região</p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
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

            {/* ── BRASIL: Estado ── */}
            {isBrazil && blevel === 'state' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b shrink-0">
                  <BackBtn onClick={backToRegion} label={REGIONS.find(r => r.id === selectedRegion)?.label ?? 'Região'} />
                  <p className="text-xs text-muted-foreground font-medium">{selectedStateId}</p>
                  <p className="text-sm font-semibold">{STATE_NAMES[selectedStateId!] ?? selectedStateId}</p>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1">{stateTotal.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stateTotal === 1 ? 'usuário' : 'usuários'} no estado</p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
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

            {/* ── BRASIL: Cidade ── */}
            {isBrazil && blevel === 'city' && selectedCity && (
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
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {stateTotal > 0 && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {Math.round((selectedCity.count / stateTotal) * 100)}% dos usuários de {selectedCity.state}.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── INT: Países ── */}
            {isInt && !selectedCountry && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b shrink-0">
                  <BackBtn onClick={clearAll} label="Brasil" />
                  <p className="text-sm font-semibold">Internacional</p>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1">{internacionalCount.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{internacionalCount === 1 ? 'usuário' : 'usuários'} fora do Brasil</p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {topCountries.map(c => (
                    <div key={c.name} className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => selectCountry(c.name)}
                      onMouseEnter={() => setHoveredCountry(c.name)}
                      onMouseLeave={() => setHoveredCountry(null)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{c.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{c.count}</span>
                      </div>
                      <MiniBar pct={internacionalCount > 0 ? (c.count / internacionalCount) * 100 : 0} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── INT: Estados do país ── */}
            {isInt && selectedCountry && !selectedCountryState && !selectedCity && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b shrink-0">
                  <BackBtn onClick={backToInternacional} label="Internacional" />
                  <p className="text-sm font-semibold">{selectedCountry}</p>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1">{countryTotal.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{countryTotal === 1 ? 'usuário' : 'usuários'}</p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {statesOfCountry.map(st => (
                    <div key={st.name} className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => selectCountryState(st.name)}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium truncate min-w-0">{st.name}</p>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{st.count}</span>
                      </div>
                      <MiniBar pct={countryTotal > 0 ? (st.count / countryTotal) * 100 : 0} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── INT: Cidades do estado ── */}
            {isInt && selectedCountryState && !selectedCity && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b shrink-0">
                  <BackBtn onClick={backToCountry} label={selectedCountry ?? 'País'} />
                  <p className="text-sm font-semibold">{selectedCountryState}</p>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1">{countryStateTotal.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{countryStateTotal === 1 ? 'usuário' : 'usuários'}</p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {citiesOfCountryState.map(city => (
                    <div
                      key={city.city}
                      className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => selectCity(city)}
                      onMouseEnter={() => setHoveredCity(city)}
                      onMouseLeave={() => setHoveredCity(null)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium truncate min-w-0">{city.city}</p>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{city.count}</span>
                      </div>
                      <MiniBar pct={countryStateTotal > 0 ? (city.count / countryStateTotal) * 100 : 0} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── INT: Cidade ── */}
            {isInt && selectedCity?.country && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b shrink-0">
                  <BackBtn onClick={backToCountryState} label={selectedCity.state} />
                  <p className="text-xs text-muted-foreground font-medium">{selectedCity.country}</p>
                  <p className="text-sm font-semibold">{selectedCity.city}</p>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1">{selectedCity.count.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedCity.count === 1 ? 'usuário' : 'usuários'} na cidade</p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {countryStateTotal > 0 && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {Math.round((selectedCity.count / countryStateTotal) * 100)}% dos usuários de {selectedCity.state}.
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
