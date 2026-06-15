'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { IconChevronLeft } from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { MapLevel } from './map-view'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CityPoint {
  city:        string
  state:       string
  country?:    string  // presente apenas em pontos internacionais
  count:       number
  coordinates: [number, number] // [lng, lat]
}

type RegionId = typeof REGIONS[number]['id']

// ─── Regiões ──────────────────────────────────────────────────────────────────
const REGIONS = [
  { id: 'Norte',        label: 'Norte',        states: ['AC','AM','AP','PA','RO','RR','TO'] },
  { id: 'Nordeste',     label: 'Nordeste',     states: ['AL','BA','CE','MA','PB','PE','PI','RN','SE'] },
  { id: 'Centro-Oeste', label: 'Centro Oeste', states: ['DF','GO','MS','MT'] },
  { id: 'Sudeste',      label: 'Sudeste',      states: ['ES','MG','RJ','SP'] },
  { id: 'Sul',          label: 'Sul',          states: ['PR','RS','SC'] },
] as const

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
  { city:'Lisboa',       state:'Lisboa',    country:'Portugal',       count:2, coordinates:[-9.14, 38.72] },
  { city:'Porto',        state:'Porto',     country:'Portugal',       count:1, coordinates:[-8.61, 41.15] },
  { city:'Miami',        state:'Flórida',   country:'Estados Unidos', count:2, coordinates:[-80.19, 25.77] },
  { city:'Nova York',    state:'Nova York', country:'Estados Unidos', count:2, coordinates:[-74.00, 40.71] },
  { city:'Los Angeles',  state:'Califórnia',country:'Estados Unidos', count:1, coordinates:[-118.24,34.05] },
]

// ─── Dynamic import ───────────────────────────────────────────────────────────
const MapView = dynamic(() => import('./map-view'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted" />,
})

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: 'hsl(var(--primary))' }} />
    </div>
  )
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function UsersMapCard({ cities }: { cities: CityPoint[] }) {
  const isMock = cities.length === 0
  const data   = isMock ? MOCK_CITIES : cities

  // ── Seleção Brasil ───────────────────────────────────────────────────────
  const [selectedRegion,  setSelectedRegion]  = useState<RegionId | null>(null)
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null)
  const [selectedCity,    setSelectedCity]    = useState<CityPoint | null>(null)
  const [hoveredCity,     setHoveredCity]     = useState<CityPoint | null>(null)

  // ── Seleção Internacional ────────────────────────────────────────────────
  const [selectedInternacional,  setSelectedInternacional]  = useState(false)
  const [selectedCountry,        setSelectedCountry]        = useState<string | null>(null)
  const [selectedCountryState,   setSelectedCountryState]   = useState<string | null>(null)

  // ── Fullscreen (native API) ──────────────────────────────────────────────
  const cardRef      = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      cardRef.current?.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  // ── mapLevel ─────────────────────────────────────────────────────────────
  const mapLevel: MapLevel =
    selectedCity
      ? 'city'
      : selectedCountryState ? 'countryState'
      : selectedCountry      ? 'country'
      : selectedInternacional ? 'internacional'
      : selectedStateId      ? 'state'
      : selectedRegion       ? 'region'
      : 'default'

  // ── Agregações Brasil ────────────────────────────────────────────────────
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
    REGIONS.map(r => ({ ...r, count: countByRegion[r.id] ?? 0 }))
      .sort((a, b) => b.count - a.count)
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

  const regionTotal = selectedRegion   ? (countByRegion[selectedRegion] ?? 0) : 0
  const stateTotal  = selectedStateId  ? (countByState[selectedStateId] ?? 0) : 0

  // ── Agregações Internacional ──────────────────────────────────────────────
  const intData            = useMemo(() => data.filter(c => c.country), [data])
  const internacionalCount = useMemo(() => intData.reduce((s, c) => s + c.count, 0), [intData])

  const countByCountry = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of intData) m[c.country!] = (m[c.country!] ?? 0) + c.count
    return m
  }, [intData])

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

  // ── visibleDots ──────────────────────────────────────────────────────────
  const visibleDots = useMemo(() => {
    // INT drill-down
    if (selectedCity?.country) return [selectedCity]
    if (selectedCountryState)  return citiesOfCountryState
    if (selectedCountry)       return citiesOfCountry
    if (selectedInternacional) return intData
    // Brasil drill-down
    if (selectedCity)     return brData.filter(c => c.city === selectedCity.city && c.state === selectedCity.state)
    if (selectedStateId)  return brData.filter(c => c.state === selectedStateId)
    if (selectedRegion)   return brData.filter(c => STATE_TO_REGION[c.state] === selectedRegion)
    return data
  }, [data, brData, intData, selectedInternacional, selectedCountry, selectedCountryState,
      selectedCity, selectedRegion, selectedStateId, citiesOfCountry, citiesOfCountryState])

  const scopeMax = useMemo(() => Math.max(1, ...visibleDots.map(c => c.count)), [visibleDots])

  // ── Navegação ─────────────────────────────────────────────────────────────
  const clearAll = () => {
    setSelectedRegion(null); setSelectedStateId(null); setSelectedCity(null); setHoveredCity(null)
    setSelectedInternacional(false); setSelectedCountry(null); setSelectedCountryState(null)
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
    setSelectedRegion(null); setSelectedStateId(null); setSelectedCity(null); setHoveredCity(null)
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

  // ── Shortcuts ─────────────────────────────────────────────────────────────
  const isInt     = selectedInternacional
  const isBrazil  = !selectedInternacional

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Card
      ref={cardRef}
      className={cn('map-fullscreen-card', isFullscreen && 'rounded-none flex flex-col')}
    >
      <CardHeader className="py-4 border-b shrink-0">
        <CardTitle className="text-base">Usuários por região</CardTitle>
        <p className="text-sm text-muted-foreground mt-0.5">
          Distribuição geográfica de usuários cadastrados
        </p>
      </CardHeader>

      <CardContent className={cn('px-6 pt-5 pb-6', isFullscreen && 'flex-1 flex flex-col overflow-hidden')}>

        {/* Region filter (Brasil only) */}
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

          {/* Tile map */}
          <div className="flex-1 overflow-hidden">
            <MapView
              visibleDots={visibleDots}
              scopeMax={scopeMax}
              mapLevel={mapLevel}
              selectedRegion={selectedRegion}
              selectedStateId={selectedStateId}
              selectedCity={selectedCity}
              hoveredCity={hoveredCity}
              onCityClick={selectCity}
              onCityHover={setHoveredCity}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
            />
          </div>

          {/* Painel direito */}
          <div className="w-52 shrink-0 border-l bg-card flex flex-col overflow-hidden">

            {/* ── BRASIL: Default ── */}
            {isBrazil && mapLevel === 'default' && (
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
            {isBrazil && mapLevel === 'region' && (
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
                      <div key={st.id} className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => selectState(st.id)}>
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
            {isBrazil && mapLevel === 'state' && (
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
            {isBrazil && mapLevel === 'city' && selectedCity && (
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
                    <div key={c.name} className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => selectCountry(c.name)}>
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
                  {statesOfCountry.map(s => (
                    <div key={s.name} className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => selectCountryState(s.name)}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium truncate min-w-0">{s.name}</p>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{s.count}</span>
                      </div>
                      <MiniBar pct={countryTotal > 0 ? (s.count / countryTotal) * 100 : 0} />
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
