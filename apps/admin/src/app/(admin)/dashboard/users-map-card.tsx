'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { IconChevronLeft } from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CityPoint {
  city:        string
  state:       string
  count:       number
  coordinates: [number, number] // [lng, lat]
}

type Level    = 'default' | 'region' | 'state' | 'city'
type RegionId = typeof REGIONS[number]['id']

// ─── Regiões ──────────────────────────────────────────────────────────────────
const REGIONS = [
  { id: 'Norte',          label: 'Norte',        states: ['AC','AM','AP','PA','RO','RR','TO'] },
  { id: 'Nordeste',       label: 'Nordeste',     states: ['AL','BA','CE','MA','PB','PE','PI','RN','SE'] },
  { id: 'Centro-Oeste',   label: 'Centro Oeste', states: ['DF','GO','MS','MT'] },
  { id: 'Sudeste',        label: 'Sudeste',      states: ['ES','MG','RJ','SP'] },
  { id: 'Sul',            label: 'Sul',          states: ['PR','RS','SC'] },
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
  { city:'Portugal',       state:'INT', count: 3, coordinates:[-8.22, 39.40] },
  { city:'Estados Unidos', state:'INT', count: 2, coordinates:[-95.71, 37.09] },
]

// ─── Dynamic import — Leaflet precisa de window ───────────────────────────────
const MapView = dynamic(() => import('./map-view'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted" />,
})

// ─── Componente ───────────────────────────────────────────────────────────────
export function UsersMapCard({ cities }: { cities: CityPoint[] }) {
  const isMock = cities.length === 0
  const data   = isMock ? MOCK_CITIES : cities

  // Seleção hierárquica Brasil
  const [selectedRegion,       setSelectedRegion]       = useState<RegionId | null>(null)
  const [selectedStateId,      setSelectedStateId]      = useState<string | null>(null)
  const [selectedCity,         setSelectedCity]         = useState<CityPoint | null>(null)
  const [hoveredCity,          setHoveredCity]          = useState<CityPoint | null>(null)
  const [selectedInternacional, setSelectedInternacional] = useState(false)

  // Tela cheia
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!isFullscreen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isFullscreen])

  const level: Level =
    selectedCity ? 'city' : selectedStateId ? 'state' : selectedRegion ? 'region' : 'default'

  // ─── Agregações ─────────────────────────────────────────────────────────────
  const total = useMemo(() => data.reduce((s, c) => s + c.count, 0), [data])

  const countByState = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of data) if (c.state !== 'INT') m[c.state] = (m[c.state] ?? 0) + c.count
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

  const internacionalCount = useMemo(
    () => data.filter(c => c.state === 'INT').reduce((s, c) => s + c.count, 0),
    [data],
  )

  const internacionalCities = useMemo(
    () => data.filter(c => c.state === 'INT').sort((a, b) => b.count - a.count),
    [data],
  )

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

  const regionTotal = selectedRegion ? (countByRegion[selectedRegion] ?? 0) : 0
  const stateTotal  = selectedStateId ? (countByState[selectedStateId] ?? 0) : 0

  // INT nunca vai para o mapa — filtrado também em map-view.tsx como segurança
  const visibleDots = useMemo(() => {
    return data.filter(c => {
      if (c.state === 'INT') return false
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
  const clearAll = () => {
    setSelectedRegion(null); setSelectedStateId(null)
    setSelectedCity(null);   setHoveredCity(null)
    setSelectedInternacional(false)
  }
  const selectRegion = (r: RegionId) => {
    setSelectedInternacional(false)
    setSelectedRegion(prev => prev === r ? null : r)
    setSelectedStateId(null); setSelectedCity(null); setHoveredCity(null)
  }
  const selectState = (s: string) => {
    setSelectedInternacional(false)
    setSelectedRegion(STATE_TO_REGION[s] ?? null)
    setSelectedStateId(s); setSelectedCity(null); setHoveredCity(null)
  }
  const selectCity = (c: CityPoint) => {
    setSelectedInternacional(false)
    setSelectedRegion(STATE_TO_REGION[c.state] ?? null)
    setSelectedStateId(c.state); setSelectedCity(c)
  }
  const selectInternacional = () => {
    setSelectedInternacional(true)
    setSelectedRegion(null); setSelectedStateId(null)
    setSelectedCity(null);   setHoveredCity(null)
  }
  const backToRegion = () => { setSelectedStateId(null); setSelectedCity(null); setHoveredCity(null) }
  const backToState  = () => { setSelectedCity(null) }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <Card className={cn(isFullscreen && 'fixed inset-0 z-50 rounded-none bg-background flex flex-col')}>

      <CardHeader className="py-4 border-b shrink-0">
        <CardTitle className="text-base">Usuários por região</CardTitle>
        <p className="text-sm text-muted-foreground mt-0.5">
          Distribuição geográfica de usuários cadastrados
        </p>
      </CardHeader>

      <CardContent className={cn('px-6 pt-5 pb-6', isFullscreen && 'flex-1 flex flex-col overflow-hidden')}>

        {/* Region filter */}
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

        {/* Map + panel */}
        <div className={cn('flex border rounded-lg overflow-hidden', isFullscreen ? 'flex-1 min-h-0' : 'h-[400px]')}>

          {/* Tile map */}
          <div className="flex-1 overflow-hidden">
            <MapView
              visibleDots={visibleDots}
              scopeMax={scopeMax}
              level={level}
              selectedRegion={selectedRegion}
              selectedStateId={selectedStateId}
              selectedCity={selectedCity}
              hoveredCity={hoveredCity}
              onCityClick={selectCity}
              onCityHover={setHoveredCity}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(v => !v)}
            />
          </div>

          {/* Right panel */}
          <div className="w-52 shrink-0 border-l bg-card flex flex-col overflow-hidden">

            {/* MODO GERAL */}
            {level === 'default' && !selectedInternacional && (
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
                          style={{ width: `${total > 0 ? (r.count / total) * 100 : 0}%`, background: 'hsl(var(--primary))', opacity: 0.8 }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {r.count} {r.count === 1 ? 'usuário' : 'usuários'}
                      </p>
                    </div>
                  ))}

                  {internacionalCount > 0 && (
                    <>
                      <div className="border-t" />
                      <div
                        className="space-y-1 cursor-pointer transition-opacity duration-150 hover:opacity-100"
                        onClick={selectInternacional}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">Internacional</span>
                          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                            {total > 0 ? Math.round((internacionalCount / total) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${total > 0 ? (internacionalCount / total) * 100 : 0}%`, background: 'hsl(var(--primary))', opacity: 0.8 }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {internacionalCount} {internacionalCount === 1 ? 'usuário' : 'usuários'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* MODO INTERNACIONAL */}
            {selectedInternacional && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b shrink-0">
                  <button
                    onClick={clearAll}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-2"
                  >
                    <IconChevronLeft size={12} /> Brasil
                  </button>
                  <p className="text-sm font-semibold leading-snug">Internacional</p>
                  <p className="text-2xl font-bold tabular-nums leading-none mt-1">{internacionalCount.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {internacionalCount === 1 ? 'usuário' : 'usuários'} fora do Brasil
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {internacionalCities.map(c => (
                    <div key={c.city} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium truncate min-w-0">{c.city}</p>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{c.count}</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${internacionalCount > 0 ? (c.count / internacionalCount) * 100 : 0}%`, background: 'hsl(var(--primary))' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODO REGIÃO */}
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
                          style={{ width: `${regionTotal > 0 ? (st.count / regionTotal) * 100 : 0}%`, background: 'hsl(var(--primary))' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODO ESTADO */}
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
                          style={{ width: `${stateTotal > 0 ? (city.count / stateTotal) * 100 : 0}%`, background: 'hsl(var(--primary))' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODO CIDADE */}
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
