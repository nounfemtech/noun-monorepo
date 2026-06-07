declare module 'react-simple-maps' {
  import { ReactNode, CSSProperties, SVGProps } from 'react'

  export interface ProjectionConfig {
    center?:  [number, number]
    scale?:   number
    rotate?:  [number, number, number]
    parallels?: [number, number]
  }

  export interface ComposableMapProps {
    projection?:       string
    projectionConfig?: ProjectionConfig
    width?:            number
    height?:           number
    style?:            CSSProperties
    className?:        string
    children?:         ReactNode
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element

  export interface GeographiesProps {
    geography: string | object
    children:  (args: { geographies: Geography[] }) => ReactNode
  }

  export interface Geography {
    rsmKey:     string
    properties: Record<string, unknown>
    [key: string]: unknown
  }

  export interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: Geography
    style?: {
      default?: CSSProperties
      hover?:   CSSProperties
      pressed?: CSSProperties
    }
  }

  export function Geographies(props: GeographiesProps): JSX.Element
  export function Geography(props: GeographyProps): JSX.Element

  export interface MarkerProps {
    coordinates: [number, number]
    children?:   ReactNode
    className?:  string
  }

  export function Marker(props: MarkerProps): JSX.Element
}
