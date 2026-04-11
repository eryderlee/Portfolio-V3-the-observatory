'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// Canvas + R3F scene — no SSR (WebGL requires browser)
const AbyssScene = dynamic(() => import('./AbyssScene'), { ssr: false })

const DEPTH_THRESHOLDS = [0.33, 0.66]

const DEPTH_LABELS = ['Twilight Zone', 'Midnight Zone', 'The Abyss'] as const

const DEPTH_MARKERS = [
  { depth: 0,    label: '0m'    },
  { depth: 200,  label: '200m'  },
  { depth: 500,  label: '500m'  },
  { depth: 1000, label: '1000m' },
  { depth: 2000, label: '2000m' },
  { depth: 5000, label: '5000m' },
] as const

const LOG_MAX = Math.log10(5001)
const logPos = (depth: number) => Math.log10(depth + 1) / LOG_MAX

export function AbyssRealm() {
  const sectionRef    = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible]       = useState(false)
  const [currentDepth, setCurrentDepth] = useState<1 | 2 | 3>(1)
  const [progress, setProgress]         = useState(0)
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
      setProgress(p)
      setCurrentDepth(p < DEPTH_THRESHOLDS[0] ? 1 : p < DEPTH_THRESHOLDS[1] ? 2 : 3)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

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

        {/* Entrance ripples — expanding radial rings with blur pulse */}
        {isVisible && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '50%',
              top: '58%',
              width: '60vw',
              height: '28vw',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            {([0, 0.38, 0.76] as number[]).map((delay, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: `radial-gradient(ellipse at center,
                    rgba(0,200,180,${0.11 - i * 0.025}) 0%,
                    rgba(0,160,148,${0.06 - i * 0.015}) 42%,
                    transparent 68%)`,
                  animation: `abyss-ripple 2.9s cubic-bezier(0.15,0,0.85,1) ${delay}s both`,
                }}
              />
            ))}
          </div>
        )}

        {/* Depth vignette — edges darken as we plunge */}
        {isVisible && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `radial-gradient(ellipse 68% 68% at 50% 50%, transparent 32%, rgba(0,0,0,${Math.min(0.84, 0.28 + progress * 0.72)}) 100%)`,
              zIndex: 8,
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

        {/* Depth gauge */}
        {isVisible && (
          <div
            style={{
              position: 'absolute',
              right: '2vw',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '12px',
            }}
          >
            {/* Large depth readout */}
            <div
              style={{
                fontFamily: 'var(--font-sofia-condensed)',
                color: '#00c8b4',
                textAlign: 'right',
                lineHeight: 1,
              }}
            >
              <div style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                {Math.round(progress * 5000).toLocaleString()}
              </div>
              <div style={{ fontSize: '9px', letterSpacing: '0.4em', opacity: 0.45, textTransform: 'uppercase' }}>
                meters
              </div>
            </div>

            {/* Gauge */}
            <div style={{ position: 'relative', height: '50vh', width: '72px' }}>
              {/* Thin vertical line */}
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '1.5px',
                  background:
                    'linear-gradient(to bottom, rgba(0,200,180,0.08), rgba(0,200,180,0.35), rgba(0,200,180,0.08))',
                }}
              />

              {/* Depth markers */}
              {DEPTH_MARKERS.map(({ depth, label }) => (
                <div
                  key={depth}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: `${logPos(depth) * 100}%`,
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '8px',
                      letterSpacing: '0.08em',
                      color: 'rgba(0,200,180,0.45)',
                      fontFamily: 'var(--font-sofia-condensed)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </span>
                  <div style={{ width: '6px', height: '1px', background: 'rgba(0,200,180,0.3)' }} />
                </div>
              ))}

              {/* Glowing indicator */}
              <div
                style={{
                  position: 'absolute',
                  right: '-4px',
                  top: `${logPos(progress * 5000) * 100}%`,
                  transform: 'translateY(-50%)',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#00c8b4',
                  boxShadow:
                    '0 0 8px rgba(0,200,180,1), 0 0 20px rgba(0,200,180,0.7), 0 0 40px rgba(0,200,180,0.35)',
                  transition: 'top 0.15s ease-out',
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes abyss-ripple {
          0%   { transform: scale(0.08); opacity: 1;    filter: blur(0px);  }
          45%  {                         opacity: 0.45; filter: blur(2px);  }
          100% { transform: scale(2.6);  opacity: 0;    filter: blur(5px);  }
        }
      `}</style>
    </div>
  )
}
