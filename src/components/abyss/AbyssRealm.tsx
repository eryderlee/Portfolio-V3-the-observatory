'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// Canvas + R3F scene — no SSR (WebGL requires browser)
const AbyssScene = dynamic(() => import('./AbyssScene'), { ssr: false })

const DEPTH_THRESHOLDS = [0.33, 0.66]

const DEPTH_LABELS = ['Twilight Zone', 'Midnight Zone', 'The Abyss'] as const

export function AbyssRealm() {
  const sectionRef    = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible]       = useState(false)
  const [currentDepth, setCurrentDepth] = useState<1 | 2 | 3>(1)
  const [hoveredDepth, setHoveredDepth] = useState<1 | 2 | 3 | null>(null)
  const progressRef = useRef(0)

  // Mount/unmount canvas when section enters/leaves viewport
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Scroll progress 0→1, drives camera path
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      const scrollable = el.offsetHeight - window.innerHeight
      if (scrollable <= 0) { progressRef.current = 0; return }
      const p = Math.max(0, Math.min(1, -rect.top / scrollable))
      progressRef.current = p
      setCurrentDepth(p < DEPTH_THRESHOLDS[0] ? 1 : p < DEPTH_THRESHOLDS[1] ? 2 : 3)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  const jumpToDepth = (depth: 1 | 2 | 3) => {
    const el = sectionRef.current
    if (!el) return
    const sectionTop = el.getBoundingClientRect().top + window.scrollY
    const scrollable = el.offsetHeight - window.innerHeight
    const progress = depth === 1 ? 0 : depth === 2 ? DEPTH_THRESHOLDS[0] : DEPTH_THRESHOLDS[1]
    window.scrollTo({ top: sectionTop + progress * scrollable, behavior: 'smooth' })
  }

  return (
    <div ref={sectionRef} style={{ position: 'relative', height: '800vh' }}>
      {/* Sticky viewport — canvas + overlay */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          background: '#0a1628',
        }}
      >
        {/* 3D Canvas — only mounted when section is on screen */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {isVisible && <AbyssScene progressRef={progressRef} />}
        </div>

        {/* Bioluminescent entrance bloom */}
        {isVisible && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'radial-gradient(ellipse 55% 35% at 50% 65%, rgba(0,200,180,0.07) 0%, transparent 70%)',
              animation: 'abyss-bloom-in 2.2s ease-out both',
              zIndex: 5,
            }}
          />
        )}

        {/* Heading overlay */}
        <div
          style={{
            position: 'absolute',
            top: '10vh',
            left: 0,
            right: 0,
            padding: '0 6vw',
            pointerEvents: 'none',
            zIndex: 20,
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.9s',
          }}
        >
          <p
            style={{
              fontSize: '10px',
              letterSpacing: '0.55em',
              textTransform: 'uppercase',
              color: '#00c8b4',
              fontFamily: 'var(--font-sofia-condensed)',
              marginBottom: '10px',
              opacity: 0.5,
            }}
          >
            Descend Into
          </p>
          <h2
            style={{
              fontSize: 'clamp(3rem, 7vw, 6rem)',
              fontFamily: 'var(--font-sofia-condensed)',
              fontWeight: 700,
              color: '#d8f5f2',
              textShadow:
                '0 2px 16px rgba(0,0,0,0.97), 0 0 80px rgba(0,200,180,0.28)',
              lineHeight: 1.0,
              letterSpacing: '0.14em',
              margin: 0,
            }}
          >
            THE ABYSS
          </h2>
        </div>

        {/* Current depth zone label */}
        {isVisible && (
          <div
            style={{
              position: 'absolute',
              bottom: '8vh',
              left: 0,
              right: 0,
              textAlign: 'center',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          >
            <span
              style={{
                fontSize: '9px',
                letterSpacing: '0.5em',
                textTransform: 'uppercase',
                color: '#00c8b4',
                fontFamily: 'var(--font-sofia-condensed)',
                opacity: 0.4,
              }}
            >
              {DEPTH_LABELS[currentDepth - 1]}
            </span>
          </div>
        )}

        {/* Teal depth nav dots */}
        {isVisible && (
          <div
            style={{
              position: 'absolute',
              right: '1.5vw',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '18px',
              zIndex: 50,
            }}
          >
            {([1, 2, 3] as const).map((depth) => {
              const active  = currentDepth === depth
              const hovered = hoveredDepth === depth
              return (
                <button
                  key={depth}
                  onClick={() => jumpToDepth(depth)}
                  onMouseEnter={() => setHoveredDepth(depth)}
                  onMouseLeave={() => setHoveredDepth(null)}
                  aria-label={`Jump to ${DEPTH_LABELS[depth - 1]}`}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    border: `1.5px solid ${
                      active  ? '#00c8b4'
                      : hovered ? 'rgba(0,200,180,0.6)'
                      : 'rgba(0,200,180,0.22)'
                    }`,
                    background: active ? '#00c8b4' : 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                    boxShadow: active
                      ? '0 0 12px rgba(0,200,180,0.95), 0 0 26px rgba(0,200,180,0.40)'
                      : hovered
                      ? '0 0 8px rgba(0,200,180,0.50)'
                      : 'none',
                    transition: 'all 0.3s ease',
                  }}
                />
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes abyss-bloom-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
