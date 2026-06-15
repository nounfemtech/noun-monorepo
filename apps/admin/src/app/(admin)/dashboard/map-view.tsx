'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { IconPlus, IconMinus, IconCurrentLocation, IconMaximize, IconMinimize } from '@tabler/icons-react'

// ── Tile source (Esri World Street Map — English labels) ──────────────────────
// CartoDB usa nomes locais do OSM (Africa → Afrika). Esri usa inglês.
// Dark mode tratado via CSS filter em globals.css (.dark .leaflet-tile-pane).
const TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'

const BRAZIL_BOUNDS: L.LatLngBoundsLiteral = [[-33.74, -73.98], [5.27, -28.86]]

const REGION_BOUNDS: Record<string, L.LatLngBoundsLiteral> = {
  'Norte':        [[-10.0, -73.98], [5.27,  -44.00]],
  'Nordeste':     [[-18.35, -48.00], [2.50,  -34.88]],
  'Centro-Oeste': [[-24.00, -61.00], [-7.00, -45.00]],
  'Sudeste':      [[-25.00, -52.00], [-14.00, -39.00]],
  'Sul':          [[-33.74, -57.00], [-22.50, -48.00]],
}

export type MapLevel =
  | 'default' | 'region' | 'state' | 'city'
  | 'internacional' | 'country' | 'countryState'

interface CityPoint {
  city:        string
  state:       string
  country?:    string
  count:       number
  coordinates: [number, number]
}

interface MapViewProps {
  visibleDots:         CityPoint[]
  scopeMax:            number
  mapLevel:            MapLevel
  selectedRegion:      string | null
  selectedStateId:     string | null
  selectedCity:        CityPoint | null
  hoveredCity:         CityPoint | null
  onCityClick:         (city: CityPoint) => void
  onCityHover:         (city: CityPoint | null) => void
  isFullscreen?:       boolean
  onToggleFullscreen?: () => void
}

function createDotIcon(size: number, pulsing: boolean): L.DivIcon {
  const r     = size / 2
  const inner = Math.round(r * 0.38)
  const ping  = pulsing
    ? `<div class="map-dot-ping" style="position:absolute;inset:0;border-radius:50%;background:hsl(var(--primary));opacity:.32;"></div>`
    : ''
  return L.divIcon({
    html: `<div style="position:relative;width:${size}px;height:${size}px">
      <div style="position:absolute;inset:0;border-radius:50%;background:hsl(var(--primary));opacity:.14;"></div>
      ${ping}
      <div style="position:absolute;inset:${inner}px;border-radius:50%;background:hsl(var(--primary));opacity:.92;box-shadow:0 1px 4px hsl(var(--primary)/.28);"></div>
    </div>`,
    className:  '',
    iconSize:   [size, size],
    iconAnchor: [r, r],
  })
}

export default function MapView({
  visibleDots,
  scopeMax,
  mapLevel,
  selectedRegion,
  selectedStateId,
  selectedCity,
  hoveredCity,
  onCityClick,
  onCityHover,
  isFullscreen,
  onToggleFullscreen,
}: MapViewProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<L.Map | null>(null)
  const tileLayerRef  = useRef<L.TileLayer | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const callbacksRef  = useRef({ onCityClick, onCityHover })

  useEffect(() => { callbacksRef.current = { onCityClick, onCityHover } }, [onCityClick, onCityHover])

  // ── Init map ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const map = L.map(el, {
      zoomControl:        false,
      scrollWheelZoom:    false,
      attributionControl: false,
    })

    const tile = L.tileLayer(TILES, { maxZoom: 19 })
    tile.addTo(map)
    tileLayerRef.current = tile

    map.fitBounds(BRAZIL_BOUNDS)
    mapRef.current = map

    const lg = L.layerGroup().addTo(map)
    layerGroupRef.current = lg

    return () => {
      map.remove()
      mapRef.current        = null
      tileLayerRef.current  = null
      layerGroupRef.current = null
    }
  }, [])

  // ── Fullscreen: toggle scroll-wheel zoom + recalculate size ───────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (isFullscreen) {
      map.scrollWheelZoom.enable()
    } else {
      map.scrollWheelZoom.disable()
    }
    requestAnimationFrame(() => { map.invalidateSize() })
  }, [isFullscreen])

  // ── Rebuild markers ────────────────────────────────────────────────────────
  useEffect(() => {
    const lg = layerGroupRef.current
    if (!lg) return

    lg.clearLayers()

    for (const city of visibleDots) {
      const ratio   = Math.sqrt(city.count / Math.max(1, scopeMax))
      const size    = Math.round(8 + ratio * 10)
      const r       = size / 2
      const isHover = hoveredCity?.city === city.city && hoveredCity?.state === city.state
      const isSel   = selectedCity?.city === city.city && selectedCity?.state === city.state
      const pulsing = isHover || isSel

      const marker = L.marker(
        [city.coordinates[1], city.coordinates[0]],
        { icon: createDotIcon(size, pulsing), zIndexOffset: pulsing ? 1000 : 0 },
      )

      const label = city.country
        ? `${city.city} · ${city.country}`
        : city.state

      marker.bindTooltip(
        `<div style="line-height:1.4"><strong>${city.city}</strong><br><span style="opacity:.72">${city.count} ${city.count === 1 ? 'usuário' : 'usuários'} · ${label}</span></div>`,
        { className: 'map-tooltip', direction: 'top', offset: [0, -r - 4] },
      )

      marker.on('click',     () => callbacksRef.current.onCityClick(city))
      marker.on('mouseover', () => callbacksRef.current.onCityHover(city))
      marker.on('mouseout',  () => callbacksRef.current.onCityHover(null))

      lg.addLayer(marker)
    }
  }, [visibleDots, scopeMax, hoveredCity, selectedCity])

  // ── Zoom / pan on level changes ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const fitOpts: L.FitBoundsOptions = { animate: true, duration: 0.42 }

    const fitDots = (dots: CityPoint[], maxZoom: number, pad: number) => {
      if (dots.length === 0) return
      if (dots.length === 1) {
        const d = dots[0]!
        map.setView([d.coordinates[1], d.coordinates[0]], Math.min(maxZoom, 10), { animate: true, duration: 0.42 })
      } else {
        map.fitBounds(
          L.latLngBounds(dots.map(c => [c.coordinates[1], c.coordinates[0]] as L.LatLngTuple)),
          { ...fitOpts, padding: [pad, pad], maxZoom },
        )
      }
    }

    if (mapLevel === 'default') {
      map.fitBounds(BRAZIL_BOUNDS, fitOpts)
    } else if (mapLevel === 'internacional') {
      fitDots(visibleDots, 6, 60)
    } else if (mapLevel === 'region' && selectedRegion) {
      if (visibleDots.length > 0) fitDots(visibleDots, 8, 60)
      else { const fb = REGION_BOUNDS[selectedRegion]; if (fb) map.fitBounds(fb, fitOpts) }
    } else if (mapLevel === 'state') {
      fitDots(visibleDots, 11, 80)
    } else if (mapLevel === 'country') {
      fitDots(visibleDots, 9, 80)
    } else if (mapLevel === 'countryState') {
      fitDots(visibleDots, 13, 100)
    } else if (mapLevel === 'city' && selectedCity) {
      const zoom = selectedCity.country ? 9 : 13
      map.setView([selectedCity.coordinates[1], selectedCity.coordinates[0]], zoom, { animate: true, duration: 0.42 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLevel, selectedRegion, selectedStateId, selectedCity, visibleDots])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Fullscreen button */}
      {onToggleFullscreen && (
        <div className="absolute top-3 right-3 z-[1000]">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 bg-background/90 backdrop-blur-sm shadow-sm"
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? <IconMinimize size={14} /> : <IconMaximize size={14} />}
          </Button>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 bg-background/90 backdrop-blur-sm shadow-sm"
          onClick={() => mapRef.current?.zoomIn()}
        >
          <IconPlus size={14} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 bg-background/90 backdrop-blur-sm shadow-sm"
          onClick={() => mapRef.current?.zoomOut()}
        >
          <IconMinus size={14} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 bg-background/90 backdrop-blur-sm shadow-sm"
          onClick={() => mapRef.current?.fitBounds(BRAZIL_BOUNDS, { paddingTopLeft: [20, 20], paddingBottomRight: [20, 20] })}
        >
          <IconCurrentLocation size={14} />
        </Button>
      </div>
    </div>
  )
}
