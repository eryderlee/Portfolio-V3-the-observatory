'use client'

import { useState } from 'react'
import { Html } from '@react-three/drei'

interface ProjectCardProps {
  position: [number, number, number]
  title: string
  tier: 1 | 2 | 3
  description?: string
  expandedDescription?: string
  tech?: string[]
  minimal?: boolean
  url?: string
}

const TIER_STYLES = {
  1: {
    border: '#c0a860',
    glow: 'rgba(192,168,96,0.20)',
    glowHover: 'rgba(192,168,96,0.55)',
    text: '#f5f0e0',
    label: 'rgba(192,168,96,0.65)',
    labelHover: '#c0a860',
    gradientA: '#1e1505',
    gradientB: '#332108',
  },
  2: {
    border: '#daa520',
    glow: 'rgba(218,165,32,0.30)',
    glowHover: 'rgba(218,165,32,0.65)',
    text: '#fff8dc',
    label: 'rgba(218,165,32,0.70)',
    labelHover: '#daa520',
    gradientA: '#241908',
    gradientB: '#42280a',
  },
  3: {
    border: '#f5e080',
    glow: 'rgba(245,224,128,0.45)',
    glowHover: 'rgba(245,224,128,0.80)',
    text: '#ffffff',
    label: 'rgba(245,224,128,0.80)',
    labelHover: '#f5e080',
    gradientA: '#29200a',
    gradientB: '#504010',
  },
}

export function ProjectCard({ position, title, tier, description, expandedDescription, tech, minimal, url }: ProjectCardProps) {
  const s = TIER_STYLES[tier]
  const [hovered, setHovered] = useState(false)
  const initial = title.charAt(0).toUpperCase()
  const href = url && url !== '#' ? url : null
  const hasPopup = !href && (expandedDescription || description)

  const openPopup = () => {
    window.dispatchEvent(new CustomEvent('celestial-project-open', {
      detail: {
        title,
        expandedDescription: expandedDescription || description || '',
        tech: tech || [],
        tier,
      },
    }))
  }

  if (minimal) {
    return (
      <Html position={position} center distanceFactor={10} zIndexRange={[100, 0]}>
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
    <Html position={position} center distanceFactor={10} zIndexRange={[100, 0]}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'rgba(20,13,4,0.92)',
          border: `1px solid ${s.border}`,
          boxShadow: hovered
            ? `0 0 42px ${s.glowHover}, 0 0 18px ${s.glow}, inset 0 0 18px ${s.glow}`
            : `0 0 24px ${s.glow}, inset 0 0 12px ${s.glow}`,
          backdropFilter: 'blur(10px)',
          minWidth: '170px',
          maxWidth: '220px',
          userSelect: 'none',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          overflow: 'hidden',
        }}
      >
        {/* Thumbnail — hidden at rest, fades in on hover */}
        <div
          style={{
            maxHeight: hovered ? '80px' : '0px',
            opacity: hovered ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.35s ease, opacity 0.28s ease',
          }}
        >
          <div
            style={{
              height: '64px',
              background: `linear-gradient(135deg, ${s.gradientA} 0%, ${s.gradientB} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: `1px solid ${s.border}`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(ellipse at center, ${s.glow} 0%, transparent 68%)`,
              }}
            />
            <span
              style={{
                fontSize: '30px',
                fontFamily: 'var(--font-playfair)',
                fontStyle: 'italic',
                fontWeight: 700,
                color: s.labelHover,
                textShadow: `0 0 18px ${s.border}, 0 0 38px ${s.glow}`,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {initial}
            </span>
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding: '11px 16px 13px' }}>
          {/* Tier label */}
          <div
            style={{
              fontSize: '8px',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: s.label,
              fontFamily: 'var(--font-playfair)',
              marginBottom: '5px',
              whiteSpace: 'nowrap',
            }}
          >
            Plane {tier}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '14px',
              color: s.text,
              fontFamily: 'var(--font-playfair)',
              fontStyle: 'italic',
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {title}
          </div>

          {/* Tech pills */}
          {tech && tech.length > 0 && (
            <div
              style={{
                marginTop: '9px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
              }}
            >
              {tech.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: '8px',
                    letterSpacing: '0.08em',
                    color: s.label,
                    border: `1px solid ${s.border}`,
                    padding: '2px 6px',
                    opacity: 0.85,
                    fontFamily: 'var(--font-playfair)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* View Project — anchor for real URLs, button for popup */}
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: `1px solid rgba(192,168,96,0.18)`,
                fontSize: '9px',
                letterSpacing: '0.25em',
                color: hovered ? s.labelHover : s.label,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
                fontFamily: 'var(--font-playfair)',
                cursor: 'pointer',
              }}
            >
              View Project →
            </a>
          ) : (
            <div
              onClick={hasPopup ? openPopup : undefined}
              style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: `1px solid rgba(192,168,96,0.18)`,
                fontSize: '9px',
                letterSpacing: '0.25em',
                color: hovered && hasPopup ? s.labelHover : s.label,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                cursor: hasPopup ? 'pointer' : 'default',
                opacity: hasPopup ? 1 : 0.45,
                transition: 'color 0.2s ease',
                fontFamily: 'var(--font-playfair)',
              }}
            >
              View Project →
            </div>
          )}
        </div>
      </div>
    </Html>
  )
}
