'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import brazilPaths from '@/data/brazil-states-paths.json'

// Bounding box do Brasil para projeção linear
const W = 500, H = 420
const WEST = -73.98, EAST = -28.86, NORTH = 5.27, SOUTH = -33.74

function project(lng: number, lat: number): [number, number] {
  const x = ((lng - WEST) / (EAST - WEST)) * W
  const y = ((NORTH - lat) / (NORTH - SOUTH)) * H
  return [x, y]
}

export interface CityPoint {
  city:        string
  state:       string
  count:       number
  coordinates: [number, number] // [lng, lat]
}

interface UsersMapCardProps {
  cities: CityPoint[]
}

// Dados de exemplo exibidos enquanto nenhum usuário cadastrar endereço
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
  const isMock   = cities.length === 0
  const data     = isMock ? MOCK_CITIES : cities
  const total    = useMemo(() => data.reduce((s, c) => s + c.count, 0), [data])
  const maxCount = useMemo(() => Math.max(...data.map(c => c.count)), [data])

  const byState = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of data) map[c.state] = (map[c.state] ?? 0) + c.count
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
          {/* Mapa SVG */}
          <div className="flex-1 overflow-hidden p-2">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-full"
              style={{ maxHeight: 380 }}
            >
              {/* Estados */}
              {(brazilPaths as { id: string; path: string }[]).map(state => (
                <path
                  key={state.id}
                  d={state.path}
                  className="fill-muted stroke-background"
                  strokeWidth={1}
                />
              ))}

              {/* Pontos por cidade */}
              {data.map(city => {
                const [x, y] = project(city.coordinates[0], city.coordinates[1])
                const r      = 3 + (city.count / maxCount) * 6
                return (
                  <g key={`${city.state}-${city.city}`}>
                    {/* Glow */}
                    <circle cx={x} cy={y} r={r * 2.6} className="fill-primary" fillOpacity={0.12} />
                    {/* Dot */}
                    <circle cx={x} cy={y} r={r}       className="fill-primary" fillOpacity={0.85} />
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Painel lateral */}
          <div className="w-52 shrink-0 border-l px-5 py-5 flex flex-col gap-5">
            <div>
              <p className="text-3xl font-bold tabular-nums leading-none">
                {total.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isMock ? 'usuários (exemplo)' : 'usuários com endereço'}
              </p>
            </div>

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
