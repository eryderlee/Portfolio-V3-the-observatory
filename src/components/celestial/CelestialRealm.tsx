'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// Canvas + R3F scene — no SSR (WebGL requires browser)
const CelestialScene = dynamic(() => import('./CelestialScene'), { ssr: false })

const PLANE_THRESHOLDS = [0.33, 0.62]

export function CelestialRealm() {
  const sectionRef   = useRef<HTMLDivElement>(null)
  const gateFlashRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [currentPlane, setCurrentPlane] = useState(1)
  const [hoveredPlane, setHoveredPlane] = useState<1 | 2 | 3 | null>(null)
  const progressRef = useRef(0)

  // Mount/unmount canvas when section enters/leaves viewport
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Scroll progress 0→1 through this section, drives camera path
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      const scrollable = el.offsetHeight - window.innerHeight
      if (scrollable <= 0) {
        progressRef.current = 0
        return
      }
      const p = Math.max(0, Math.min(1, -rect.top / scrollable))
      progressRef.current = p
      setCurrentPlane(p < PLANE_THRESHOLDS[0] ? 1 : p < PLANE_THRESHOLDS[1] ? 2 : 3)

      // Gate flash overlay — peaks as gates fully open (p=0.12), gone by p=0.20
      if (gateFlashRef.current) {
        const gp = Math.min(1, p / 0.12)
        const fade = p > 0.12 ? Math.max(0, 1 - (p - 0.12) / 0.08) : 1
        gateFlashRef.current.style.opacity = String(gp * fade * 0.38)
      }
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  const jumpToPlane = (plane: 1 | 2 | 3) => {
    const el = sectionRef.current
    if (!el) return
    const sectionTop = el.getBoundingClientRect().top + window.scrollY
    const scrollable = el.offsetHeight - window.innerHeight
    const progress = plane === 1 ? 0 : plane === 2 ? PLANE_THRESHOLDS[0] : PLANE_THRESHOLDS[1]
    window.scrollTo({ top: sectionTop + progress * scrollable, behavior: 'smooth' })
  }

  return (
    <div ref={sectionRef} style={{ position: 'relative', height: '1000vh' }}>
      {/* Sticky viewport — canvas + overlay both live here, scroll through the 400vh outer div */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>

        {/* 3D Canvas — only mounted when section is on screen */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {isVisible && <CelestialScene progressRef={progressRef} />}
        </div>

        {/* Golden entrance bloom — CSS only, plays once when section mounts */}
        {isVisible && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(218,165,32,0.14) 0%, transparent 70%)',
              animation: 'celestial-bloom-in 1.6s ease-out both',
              zIndex: 5,
            }}
          />
        )}

        {/* Gate light-flood overlay — driven by scroll, no React re-renders */}
        <div
          ref={gateFlashRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(ellipse 80% 55% at 50% 50%, rgba(245,224,128,0.9) 0%, rgba(218,165,32,0.4) 45%, transparent 72%)',
            opacity: 0,
            zIndex: 4,
            mixBlendMode: 'screen',
          }}
        />

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
              color: '#c0a860',
              fontFamily: 'var(--font-playfair)',
              marginBottom: '14px',
              opacity: 0.65,
            }}
          >
            The Celestial Realm
          </p>
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              fontFamily: 'var(--font-playfair)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#f5f0e0',
              textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 60px rgba(218,165,32,0.45)',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Where craft
            <br />
            becomes art
          </h2>
        </div>

        {/* Side plane indicator — diamond-framed numbers, clickable to jump to tier */}
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
              gap: '16px',
              zIndex: 50,
            }}
          >
            {([3, 2, 1] as const).map((plane) => {
              const active = currentPlane === plane
              const hovered = hoveredPlane === plane
              return (
                <div
                  key={plane}
                  onClick={() => jumpToPlane(plane)}
                  onMouseEnter={() => setHoveredPlane(plane)}
                  onMouseLeave={() => setHoveredPlane(null)}
                  style={{ cursor: 'pointer', padding: '6px' }}
                >
                  {/* Outer diamond */}
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      transform: 'rotate(45deg)',
                      border: `1px solid ${active ? '#daa520' : hovered ? 'rgba(218,165,32,0.55)' : 'rgba(218,165,32,0.22)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: active
                        ? '0 0 16px rgba(218,165,32,0.85), inset 0 0 8px rgba(218,165,32,0.18)'
                        : hovered ? '0 0 8px rgba(218,165,32,0.4)' : 'none',
                      background: active ? 'rgba(218,165,32,0.07)' : 'transparent',
                      transition: 'all 0.35s ease',
                    }}
                  >
                    {/* Inner diamond */}
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        border: `1px solid ${active ? 'rgba(218,165,32,0.5)' : hovered ? 'rgba(218,165,32,0.35)' : 'rgba(218,165,32,0.14)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'border-color 0.35s ease',
                      }}
                    >
                      {/* Number — counter-rotated to stay upright */}
                      <span
                        style={{
                          display: 'block',
                          transform: 'rotate(-45deg)',
                          fontSize: '12px',
                          fontFamily: 'var(--font-playfair)',
                          fontWeight: 400,
                          color: active ? '#daa520' : hovered ? 'rgba(218,165,32,0.65)' : 'rgba(218,165,32,0.28)',
                          lineHeight: 1,
                          textShadow: active ? '0 0 10px rgba(218,165,32,0.9)' : 'none',
                          transition: 'color 0.35s ease, text-shadow 0.35s ease',
                          userSelect: 'none',
                        }}
                      >
                        {plane}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes celestial-bloom-in {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
