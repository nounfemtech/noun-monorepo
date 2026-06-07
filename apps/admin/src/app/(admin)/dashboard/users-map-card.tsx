'use client'

import { useMemo } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const GEO_URL = '/brazil-states.json'

export interface CityPoint {
  city:        string
  state:       string
  count:       number
  coordinates: [number, number] // [lng, lat]
}

interface UsersMapCardProps {
  cities: CityPoint[]
}

// Dados de exemplo exibidos enquanto nenhum usuário cadastrou endereço
const MOCK_CITIES: CityPoint[] = [
  { city: 'São Paulo',      state: 'SP', count: 45, coordinates: [-46.63, -23.55] },
  { city: 'Rio de Janeiro', state: 'RJ', count: 28, coordinates: [-43.17, -22.91] },
  { city: 'Belo Horizonte', state: 'MG', count: 20, coordinates: [-43.94, -19.92] },
  { city: 'Salvador',       state: 'BA', count: 15, coordinates: [-38.50, -12.97] },
  { city: 'Fortaleza',      state: 'CE', count: 12, coordinates: [-38.54,  -3.72] },
  { city: 'Curitiba',       state: 'PR', count: 10, coordinates: [-49.27, -25.42] },
  { city: 'Porto Alegre',   state: 'RS', count:  9, coordinates: [-51.23, -30.03] },
  { city: 'Recife',         state: 'PE', count:  8, coordinates: [-34.88,  -8.05] },
  { city: 'Goiânia',        state: 'GO', count:  7, coordinates: [-49.26, -16.69] },
  { city: 'Manaus',         state: 'AM', count:  5, coordinates: [-60.02,  -3.10] },
  { city: 'Belém',          state: 'PA', count:  4, coordinates: [-48.50,  -1.46] },
  { city: 'Natal',          state: 'RN', count:  3, coordinates: [-35.21,  -5.79] },
]

export function UsersMapCard({ cities }: UsersMapCardProps) {
  const isMock    = cities.length === 0
  const data      = isMock ? MOCK_CITIES : cities
  const total     = useMemo(() => data.reduce((s, c) => s + c.count, 0), [data])
  const maxCount  = useMemo(() => Math.max(...data.map(c => c.count)), [data])

  // Agrupa por estado para o painel lateral
  const byState = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of data) {
      map[c.state] = (map[c.state] ?? 0) + c.count
    }
    return Object.entries(map)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [data])

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
          {isMock && (
            <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
              Dados de exemplo
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex min-h-[300px]">
          {/* Mapa */}
          <div className="flex-1 overflow-hidden">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ center: [-54, -15], scale: 700 }}
              width={520}
              height={400}
              style={{ width: '100%', height: '100%' }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="hsl(var(--muted))"
                      stroke="hsl(var(--background))"
                      strokeWidth={1}
                      style={{
                        default: { outline: 'none' },
                        hover:   { fill: 'hsl(var(--muted-foreground) / 0.25)', outline: 'none' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>

              {data.map(city => {
                const radius = 3 + (city.count / maxCount) * 6
                return (
                  <Marker key={`${city.state}-${city.city}`} coordinates={city.coordinates}>
                    {/* Glow */}
                    <circle r={radius * 2.8} fill="hsl(var(--primary))" fillOpacity={0.12} />
                    {/* Dot */}
                    <circle r={radius}        fill="hsl(var(--primary))" fillOpacity={0.85} />
                  </Marker>
                )
              })}
            </ComposableMap>
          </div>

          {/* Painel lateral */}
          <div className="w-52 shrink-0 border-l px-5 py-5 flex flex-col gap-5">
            {/* Total */}
            <div>
              <p className="text-3xl font-bold tabular-nums leading-none">
                {total.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isMock ? 'usuários (exemplo)' : 'usuários com endereço'}
              </p>
            </div>

            {/* Top estados */}
            <div className="space-y-3">
              {byState.map(({ state, count }) => (
                <div key={state} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{state}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {Math.round((count / total) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(count / total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
