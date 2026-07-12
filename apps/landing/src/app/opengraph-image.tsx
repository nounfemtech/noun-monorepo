import { ImageResponse } from 'next/og'
import { siteTitle } from '@/lib/site'

export const alt = siteTitle
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fef9c3 0%, #fce7f3 55%, #fecdd3 100%)',
          padding: '80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#facc15' }} />
          <span style={{ fontSize: 40, fontWeight: 700, color: '#171717' }}>Noun</span>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 700,
            color: '#171717',
            lineHeight: 1.15,
            maxWidth: 920,
          }}
        >
          Saúde hormonal, do seu jeito.
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            color: '#525252',
            marginTop: 28,
            maxWidth: 820,
          }}
        >
          Especialistas e farmácias parceiras para mulheres cis, mulheres trans, homens trans e
          todas as identidades femininas.
        </div>
      </div>
    ),
    { ...size }
  )
}
