'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from '@/lib/gsap'
import { useSceneContext } from '@/components/providers/SceneContext'

const PLANE_THRESHOLDS = [0.32, 0.66] // progress bands for plane 1 → 2 → 3

export function CelestialRealm() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [currentPlane, setCurrentPlane] = useState(1)
  const [entered, setEntered] = useState(false)
  const { setActiveSection, setCelestialProgress } = useSceneContext()

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    // Activate / deactivate celestial scene in the shared canvas
    const stVisibility = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => { setActiveSection('celestial'); setEntered(true) },
      onLeave: () => setActiveSection('observatory'),
      onEnterBack: () => setActiveSection('celestial'),
      onLeaveBack: () => setActiveSection('observatory'),
    })

    // Scrub celestial camera progress 0 → 1
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
  }, [setActiveSection, setCelestialProgress])

  return (
    <div ref={sectionRef} style={{ position: 'relative', height: '400vh' }}>

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
          position: 'sticky',
          top: '10vh',
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

      {/* Fixed side navigation — plane indicator */}
      {entered && (
        <div
          style={{
            position: 'fixed',
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

      <style>{`
        @keyframes celestial-bloom-in {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
