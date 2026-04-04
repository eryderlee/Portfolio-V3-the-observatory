'use client'

import { Html } from '@react-three/drei'

interface ProjectCardProps {
  position: [number, number, number]
  title: string
  tier: 1 | 2 | 3
  description?: string
  minimal?: boolean
}

const TIER_STYLES = {
  1: {
    border: '#c0a860',
    glow: 'rgba(192,168,96,0.20)',
    text: '#f5f0e0',
    label: 'rgba(192,168,96,0.65)',
  },
  2: {
    border: '#daa520',
    glow: 'rgba(218,165,32,0.30)',
    text: '#fff8dc',
    label: 'rgba(218,165,32,0.70)',
  },
  3: {
    border: '#f5e080',
    glow: 'rgba(245,224,128,0.45)',
    text: '#ffffff',
    label: 'rgba(245,224,128,0.80)',
  },
}

export function ProjectCard({ position, title, tier, description, minimal }: ProjectCardProps) {
  const s = TIER_STYLES[tier]

  if (minimal) {
    return (
      <Html position={position} center distanceFactor={10} zIndexRange={[10, 20]}>
        <div
          style={{
            fontSize: '9px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: s.label,
            fontFamily: 'var(--font-playfair)',
            fontStyle: 'italic',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            textShadow: `0 0 10px ${s.border}`,
            userSelect: 'none',
            opacity: 0.85,
          }}
        >
          {title}
        </div>
      </Html>
    )
  }

  return (
    <Html position={position} center distanceFactor={10} zIndexRange={[10, 20]}>
      <div
        style={{
          padding: '14px 22px',
          background: 'rgba(20,13,4,0.88)',
          border: `1px solid ${s.border}`,
          boxShadow: `0 0 24px ${s.glow}, inset 0 0 12px ${s.glow}`,
          backdropFilter: 'blur(10px)',
          minWidth: '170px',
          textAlign: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            fontSize: '9px',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: s.label,
            fontFamily: 'var(--font-playfair)',
            marginBottom: '8px',
          }}
        >
          Plane {tier}
        </div>

        <div
          style={{
            fontSize: '14px',
            color: s.text,
            fontFamily: 'var(--font-playfair)',
            fontStyle: 'italic',
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>

        {description && (
          <div
            style={{
              marginTop: '8px',
              fontSize: '10px',
              color: s.text,
              fontFamily: 'var(--font-playfair)',
              fontStyle: 'italic',
              opacity: 0.75,
              lineHeight: 1.4,
              maxWidth: '200px',
              whiteSpace: 'normal',
            }}
          >
            {description}
          </div>
        )}

        <div
          style={{
            marginTop: '10px',
            fontSize: '9px',
            letterSpacing: '0.25em',
            color: s.label,
            textTransform: 'uppercase',
          }}
        >
          View Project →
        </div>
      </div>
    </Html>
  )
}
