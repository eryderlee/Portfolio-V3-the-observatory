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

        {/* Surface water overlay — breaking through the surface (progress 0–0.05) */}
        {isVisible && progress < 0.06 && (() => {
          const rippleOpacity = Math.max(0, 1 - progress / 0.05)
          return (
            <>
              {/* Blur lens: backdrop-filter clipped to wavy top portion */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  zIndex: 11,
                  opacity: rippleOpacity,
                  backdropFilter: 'blur(3px) brightness(1.12) saturate(1.35)',
                  WebkitBackdropFilter: 'blur(3px) brightness(1.12) saturate(1.35)',
                  animation: 'surface-wave 3s ease-in-out infinite',
                }}
              />
              {/* Light-blue color tint fading downward */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  zIndex: 10,
                  opacity: rippleOpacity,
                  background:
                    'linear-gradient(to bottom, rgba(80,160,220,0.22) 0%, rgba(40,120,180,0.08) 40%, transparent 65%)',
                }}
              />
            </>
          )
        })()}

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
        @keyframes abyss-bloom-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes surface-wave {
          0% {
            clip-path: polygon(
              0% 0%, 100% 0%, 100% 58%,
              88% 62%, 75% 57%, 63% 62%, 50% 57%,
              37% 61%, 25% 56%, 12% 61%, 0% 57%
            );
          }
          50% {
            clip-path: polygon(
              0% 0%, 100% 0%, 100% 60%,
              88% 56%, 75% 61%, 63% 56%, 50% 61%,
              37% 57%, 25% 61%, 12% 56%, 0% 61%
            );
          }
          100% {
            clip-path: polygon(
              0% 0%, 100% 0%, 100% 58%,
              88% 62%, 75% 57%, 63% 62%, 50% 57%,
              37% 61%, 25% 56%, 12% 61%, 0% 57%
            );
          }
        }
      `}</style>
    </div>
  )
}
