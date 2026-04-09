'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// Canvas + R3F scene — no SSR (WebGL requires browser)
const CelestialScene = dynamic(() => import('./CelestialScene'), { ssr: false })

const PLANE_THRESHOLDS = [0.33, 0.62]

const POPUP_TIER_STYLES = {
  1: { border: '#c0a860', glow: 'rgba(192,168,96,0.15)', glowHover: 'rgba(192,168,96,0.50)', text: '#f5f0e0', label: '#c0a860' },
  2: { border: '#daa520', glow: 'rgba(218,165,32,0.20)', glowHover: 'rgba(218,165,32,0.60)', text: '#fff8dc', label: '#daa520' },
  3: { border: '#f5e080', glow: 'rgba(245,224,128,0.30)', glowHover: 'rgba(245,224,128,0.70)', text: '#ffffff', label: '#f5e080' },
} as const

interface PopupData {
  title: string
  expandedDescription: string
  tech: string[]
  tier: 1 | 2 | 3
}

export function CelestialRealm() {
  const sectionRef   = useRef<HTMLDivElement>(null)
  const gateFlashRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [currentPlane, setCurrentPlane] = useState(1)
  const [hoveredPlane, setHoveredPlane] = useState<1 | 2 | 3 | null>(null)
  const [popup, setPopup] = useState<PopupData | null>(null)
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

  // Listen for popup open events from ProjectCard
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<PopupData>).detail
      setPopup(detail)
    }
    window.addEventListener('celestial-project-open', handler)
    return () => window.removeEventListener('celestial-project-open', handler)
  }, [])

  // Escape key closes popup
  useEffect(() => {
    if (!popup) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopup(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [popup])

  // Lock body scroll while popup is open
  useEffect(() => {
    if (popup) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [popup])

  const jumpToPlane = (plane: 1 | 2 | 3) => {
    const el = sectionRef.current
    if (!el) return
    const sectionTop = el.getBoundingClientRect().top + window.scrollY
    const scrollable = el.offsetHeight - window.innerHeight
    const progress = plane === 1 ? 0 : plane === 2 ? PLANE_THRESHOLDS[0] : PLANE_THRESHOLDS[1]
    window.scrollTo({ top: sectionTop + progress * scrollable, behavior: 'smooth' })
  }

  const popupStyle = popup ? POPUP_TIER_STYLES[popup.tier] : POPUP_TIER_STYLES[1]

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

        {/* ── Celestial Project Popup ─────────────────────────────────────── */}
        {popup && (
          <div
            onClick={() => setPopup(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 500,
              background: 'rgba(6,3,1,0.84)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              animation: 'popup-backdrop-in 0.35s ease both',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                cursor: 'default',
                position: 'relative',
                maxWidth: '520px',
                width: 'calc(100% - 48px)',
                background: 'linear-gradient(150deg, rgba(28,17,4,0.99) 0%, rgba(16,9,2,0.99) 100%)',
                border: `1px solid ${popupStyle.border}`,
                boxShadow: [
                  `0 0 0 1px rgba(0,0,0,0.95)`,
                  `0 0 90px ${popupStyle.glowHover}`,
                  `0 40px 120px rgba(0,0,0,0.95)`,
                  `inset 0 0 60px ${popupStyle.glow}`,
                ].join(', '),
                padding: '48px 52px 44px',
                animation: 'popup-modal-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
              }}
            >
              {/* Corner ornaments */}
              {['top:12px;left:14px', 'top:12px;right:14px', 'bottom:12px;left:14px', 'bottom:12px;right:14px'].map((pos, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    ...(Object.fromEntries(pos.split(';').map(p => p.split(':')))),
                    color: popupStyle.border,
                    fontSize: '12px',
                    opacity: 0.45,
                    userSelect: 'none',
                    lineHeight: 1,
                  }}
                >
                  ✦
                </span>
              ))}

              {/* Close button */}
              <button
                onClick={() => setPopup(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '20px',
                  background: 'none',
                  border: 'none',
                  color: popupStyle.label,
                  fontSize: '13px',
                  cursor: 'pointer',
                  opacity: 0.65,
                  fontFamily: 'var(--font-playfair)',
                  lineHeight: 1,
                  padding: '6px 10px',
                  letterSpacing: '0.15em',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.65' }}
              >
                ✕
              </button>

              {/* Tier label */}
              <div
                style={{
                  fontSize: '8px',
                  letterSpacing: '0.65em',
                  textTransform: 'uppercase',
                  color: popupStyle.label,
                  fontFamily: 'var(--font-playfair)',
                  marginBottom: '18px',
                  opacity: 0.7,
                }}
              >
                Plane {popup.tier} · Celestial Realm
              </div>

              {/* Title */}
              <h2
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: 'clamp(1.5rem, 4vw, 2.1rem)',
                  color: popupStyle.text,
                  lineHeight: 1.15,
                  margin: '0 0 22px',
                  textShadow: `0 0 40px ${popupStyle.glowHover}`,
                }}
              >
                {popup.title}
              </h2>

              {/* Divider */}
              <div
                style={{
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, ${popupStyle.border}, transparent)`,
                  marginBottom: '22px',
                  opacity: 0.5,
                }}
              />

              {/* Expanded description */}
              <p
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontStyle: 'italic',
                  fontSize: '13.5px',
                  color: '#cfc5ae',
                  lineHeight: 1.8,
                  margin: '0 0 28px',
                }}
              >
                {popup.expandedDescription}
              </p>

              {/* Tech pills */}
              {popup.tech.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {popup.tech.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: '9px',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: popupStyle.label,
                        border: `1px solid ${popupStyle.border}`,
                        padding: '5px 14px',
                        fontFamily: 'var(--font-playfair)',
                        opacity: 0.82,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Project Details */}
              <div
                style={{
                  marginTop: '28px',
                  paddingTop: '22px',
                  borderTop: `1px solid ${popupStyle.border}33`,
                }}
              >
                <div
                  style={{
                    fontSize: '8px',
                    letterSpacing: '0.45em',
                    textTransform: 'uppercase',
                    color: popupStyle.label,
                    fontFamily: 'var(--font-playfair)',
                    marginBottom: '14px',
                    opacity: 0.55,
                  }}
                >
                  Project Details
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px 20px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '7px',
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        color: popupStyle.label,
                        fontFamily: 'var(--font-playfair)',
                        opacity: 0.4,
                        marginBottom: '5px',
                      }}
                    >
                      Celestial Plane
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: popupStyle.text,
                        fontFamily: 'var(--font-playfair)',
                        fontStyle: 'italic',
                        opacity: 0.8,
                      }}
                    >
                      Plane {popup.tier}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '7px',
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        color: popupStyle.label,
                        fontFamily: 'var(--font-playfair)',
                        opacity: 0.4,
                        marginBottom: '5px',
                      }}
                    >
                      Technologies
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: popupStyle.text,
                        fontFamily: 'var(--font-playfair)',
                        fontStyle: 'italic',
                        opacity: 0.8,
                      }}
                    >
                      {popup.tech.length} in stack
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes celestial-bloom-in {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes popup-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes popup-modal-in {
          from { opacity: 0; transform: scale(0.90) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
