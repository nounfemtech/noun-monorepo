'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { IconPlus, IconMinus, IconHome } from '@tabler/icons-react'

// ── Tile sources ────────────────────────────────────────────────────────────
const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
const DARK_TILES  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'

const BRAZIL_BOUNDS: L.LatLngBoundsLiteral = [[-33.74, -73.98], [5.27, -28.86]]

const REGION_BOUNDS: Record<string, L.LatLngBoundsLiteral> = {
  'Norte':         [[-10.0, -73.98], [5.27, -44.00]],
  'Nordeste':      [[-18.35, -48.00], [2.50,  -34.88]],
  'Centro-Oeste':  [[-24.00, -61.00], [-7.00, -45.00]],
  'Sudeste':       [[-25.00, -52.00], [-14.00, -39.00]],
  'Sul':           [[-33.74, -57.00], [-22.50, -48.00]],
}

interface CityPoint {
  city:        string
  state:       string
  count:       number
  coordinates: [number, number]
}

interface MapViewProps {
  visibleDots:     CityPoint[]
  scopeMax:        number
  level:           'default' | 'region' | 'state' | 'city'
  selectedRegion:  string | null
  selectedStateId: string | null
  selectedCity:    CityPoint | null
  hoveredCity:     CityPoint | null
  onCityClick:     (city: CityPoint) => void
  onCityHover:     (city: CityPoint | null) => void
  isFullscreen?:   boolean
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
  level,
  selectedRegion,
  selectedStateId,
  selectedCity,
  hoveredCity,
  onCityClick,
  onCityHover,
  isFullscreen,
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

    const dark = document.documentElement.classList.contains('dark')

    const map = L.map(el, {
      zoomControl:        false,
      scrollWheelZoom:    false,
      attributionControl: false,
    })

    const tile = L.tileLayer(dark ? DARK_TILES : LIGHT_TILES, {
      subdomains: 'abcd',
      maxZoom:    19,
    })
    tile.addTo(map)
    tileLayerRef.current = tile

    map.fitBounds(BRAZIL_BOUNDS)
    mapRef.current = map

    const lg = L.layerGroup().addTo(map)
    layerGroupRef.current = lg

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      tileLayerRef.current?.setUrl(isDark ? DARK_TILES : LIGHT_TILES)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current        = null
      tileLayerRef.current  = null
      layerGroupRef.current = null
    }
  }, [])

  // ── Fullscreen: recalculate container dimensions ───────────────────────────
  useEffect(() => {
    requestAnimationFrame(() => { mapRef.current?.invalidateSize() })
  }, [isFullscreen])

  // ── Rebuild markers ────────────────────────────────────────────────────────
  useEffect(() => {
    const lg = layerGroupRef.current
    if (!lg) return

    lg.clearLayers()

    const dots = visibleDots.filter(c => c.state !== 'INT')

    for (const city of dots) {
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

      marker.bindTooltip(
        `<div style="line-height:1.4"><strong>${city.city}</strong><br><span style="opacity:.72">${city.count} ${city.count === 1 ? 'usuário' : 'usuários'} · ${city.state}</span></div>`,
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

    if (level === 'default') {
      map.fitBounds(BRAZIL_BOUNDS, fitOpts)
    } else if (level === 'region' && selectedRegion) {
      const pts = visibleDots.filter(c => c.state !== 'INT')
      if (pts.length > 0) {
        const bounds = L.latLngBounds(pts.map(c => [c.coordinates[1], c.coordinates[0]] as L.LatLngTuple))
        map.fitBounds(bounds, { ...fitOpts, padding: [60, 60], maxZoom: 8 })
      } else {
        const fb = REGION_BOUNDS[selectedRegion]
        if (fb) map.fitBounds(fb, fitOpts)
      }
    } else if (level === 'state' && selectedStateId) {
      const pts = visibleDots.filter(c => c.state !== 'INT')
      if (pts.length > 0) {
        const bounds = L.latLngBounds(pts.map(c => [c.coordinates[1], c.coordinates[0]] as L.LatLngTuple))
        map.fitBounds(bounds, { ...fitOpts, padding: [80, 80], maxZoom: 11 })
      }
    } else if (level === 'city' && selectedCity && selectedCity.state !== 'INT') {
      map.setView([selectedCity.coordinates[1], selectedCity.coordinates[0]], 13, { animate: true, duration: 0.42 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, selectedRegion, selectedStateId, selectedCity])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

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
          <IconHome size={14} />
        </Button>
      </div>
    </div>
  )
}
