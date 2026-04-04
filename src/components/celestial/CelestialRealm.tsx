'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { ScrollTrigger } from '@/lib/gsap'

const PLANE_THRESHOLDS = [0.32, 0.66]

const CelestialCanvas = dynamic(() => import('./CelestialCanvas'), {
  ssr: false,
  loading: () => null,
})

export function CelestialRealm() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [currentPlane, setCurrentPlane] = useState(1)
  const [entered, setEntered] = useState(false)
  const [celestialProgress, setCelestialProgress] = useState(0)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const stVisibility = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => setEntered(true),
    })

    const stScrub = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.4,
      onUpdate: (self) => {
        const p = self.progress
        setCelestialProgress(p)
        setCurrentPlane(p < PLANE_THRESHOLDS[0] ? 1 : p < PLANE_THRESHOLDS[1] ? 2 : 3)
      },
    })

    return () => {
      stVisibility.kill()
      stScrub.kill()
    }
  }, [])

  return (
    <div ref={sectionRef} style={{ position: 'relative', height: '400vh' }}>
      {/* Sticky viewport panel — canvas + all overlays scroll together */}
      <div style={{ position: 'sticky', top: 0, height: '100vh' }}>

        {/* 3D Canvas backdrop */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: '#1e1004',
          }}
        >
          <CelestialCanvas celestialProgress={celestialProgress} />
        </div>

        {/* Golden entrance bloom overlay — plays once on first enter */}
        {entered && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(218,165,32,0.18) 0%, transparent 70%)',
              animation: 'celestial-bloom-in 1.6s ease-out both',
              zIndex: 5,
            }}
          />
        )}

        {/* Sticky section heading */}
        <div
          style={{
            position: 'absolute',
            top: '10vh',
            left: 0,
            right: 0,
            padding: '0 6vw',
            pointerEvents: 'none',
            zIndex: 20,
            opacity: entered ? 1 : 0,
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
              textShadow: '0 0 60px rgba(218,165,32,0.45)',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Where craft
            <br />
            becomes art
          </h2>
        </div>

        {/* Side navigation — plane indicator */}
        {entered && (
          <div
            style={{
              position: 'absolute',
              right: '3.5vw',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              zIndex: 50,
              pointerEvents: 'none',
            }}
          >
            {([3, 2, 1] as const).map((plane) => {
              const active = currentPlane === plane
              return (
                <div
                  key={plane}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <div
                    style={{
                      width: active ? '11px' : '7px',
                      height: active ? '11px' : '7px',
                      borderRadius: '50%',
                      background: active ? '#daa520' : 'rgba(218,165,32,0.25)',
                      border: `1px solid ${active ? '#f5e080' : 'rgba(218,165,32,0.18)'}`,
                      boxShadow: active ? '0 0 10px rgba(218,165,32,0.9)' : 'none',
                      transition: 'all 0.35s ease',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '8px',
                      letterSpacing: '0.15em',
                      color: active ? '#daa520' : 'rgba(218,165,32,0.28)',
                      fontFamily: 'var(--font-playfair)',
                      transition: 'color 0.35s ease',
                    }}
                  >
                    {plane}
                  </span>
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
