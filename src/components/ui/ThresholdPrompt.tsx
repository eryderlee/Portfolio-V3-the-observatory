'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from '@/lib/gsap'
import { useLenis } from '@/components/providers/SmoothScrollProvider'

interface ThresholdPromptProps {
  label: string
  heading: string
  description: string
  dimensionId: string
}

export function ThresholdPrompt({ label, heading, description, dimensionId }: ThresholdPromptProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const savedScrollY = useRef(0)
  const hasEntered = useRef(false)
  const lenis = useLenis()

  useEffect(() => {
    const el = triggerRef.current
    if (!el) return

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      onEnter: () => {
        if (hasEntered.current) return
        savedScrollY.current = window.scrollY
        setIsOpen(true)
        lenis?.stop()
      },
    })

    return () => st.kill()
  }, [lenis])

  const handleEnter = useCallback(() => {
    hasEntered.current = true
    setIsOpen(false)
    lenis?.start()
    if (triggerRef.current) {
      const target = triggerRef.current.offsetTop + triggerRef.current.offsetHeight
      lenis?.scrollTo(target, { duration: 1.2 } as Record<string, unknown>)
    }
  }, [lenis])

  const handleBack = useCallback(() => {
    setIsOpen(false)
    lenis?.start()
    // Scroll back before the trigger point so the section exits the viewport
    const target = Math.max(0, savedScrollY.current - window.innerHeight * 0.5)
    lenis?.scrollTo(target, { duration: 0.9 } as Record<string, unknown>)
  }, [lenis])

  return (
    <>
      {/* Trigger sentinel — occupies full section height so scroll distance is preserved */}
      <div
        ref={triggerRef}
        className="relative flex flex-col items-center justify-center w-full min-h-screen px-8 py-24 text-center"
        aria-hidden="true"
      >
        {/* Ghost text — visible through the overlay as subtle texture */}
        <p
          className="text-xs tracking-[0.65em] uppercase select-none pointer-events-none"
          style={{
            color: 'var(--dim-accent)',
            fontFamily: 'var(--dim-font-secondary)',
            opacity: 0.08,
          }}
        >
          {label}
        </p>
      </div>

      {/* Scroll-blocking overlay — fixed, covers full viewport */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          data-theme={dimensionId}
          style={{ touchAction: 'none' }}
          aria-modal="true"
          role="dialog"
          aria-label={`Enter ${heading}`}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 120% 100% at 50% 50%,
                color-mix(in srgb, var(--dim-bg) 90%, transparent) 0%,
                rgba(0,0,0,0.88) 100%)`,
              backdropFilter: 'blur(6px)',
            }}
          />

          {/* Animated border frame */}
          <div
            className="absolute inset-8 pointer-events-none"
            style={{
              border: '1px solid var(--dim-accent)',
              opacity: 0.12,
              animation: 'threshold-frame-in 0.6s ease-out both',
            }}
            aria-hidden="true"
          />

          {/* Content */}
          <div
            className="relative z-10 flex flex-col items-center justify-center gap-7 text-center px-8 max-w-2xl w-full"
            style={{ animation: 'threshold-content-in 0.5s ease-out 0.1s both' }}
          >
            {/* Label */}
            <p
              className="text-xs tracking-[0.65em] uppercase"
              style={{
                color: 'var(--dim-accent)',
                fontFamily: 'var(--dim-font-secondary)',
                opacity: 0.65,
              }}
            >
              {label}
            </p>

            {/* Accent line */}
            <div
              className="w-12 h-px"
              style={{ background: 'var(--dim-accent)', opacity: 0.35 }}
              aria-hidden="true"
            />

            {/* Main heading */}
            <h2
              className="text-4xl md:text-6xl font-light leading-tight text-center"
              style={{
                color: 'var(--dim-text)',
                fontFamily: 'var(--dim-font-primary)',
                textShadow: '0 0 48px var(--dim-accent)',
                letterSpacing: '-0.01em',
              }}
            >
              {heading}
            </h2>

            {/* Description */}
            <p
              className="text-xs tracking-[0.3em] uppercase text-center"
              style={{
                color: 'var(--dim-text-muted)',
                fontFamily: 'var(--dim-font-secondary)',
                maxWidth: '28ch',
              }}
            >
              {description}
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-8 mt-3">
              <button
                onClick={handleBack}
                className="text-xs tracking-[0.3em] uppercase transition-opacity duration-200 hover:opacity-100"
                style={{
                  color: 'var(--dim-text-muted)',
                  fontFamily: 'var(--dim-font-secondary)',
                  opacity: 0.5,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 0',
                }}
              >
                ← Back
              </button>

              <button
                onClick={handleEnter}
                className="px-8 py-3 text-xs tracking-[0.35em] uppercase transition-all duration-200"
                style={{
                  background: 'var(--dim-accent)',
                  color: 'var(--dim-bg)',
                  fontFamily: 'var(--dim-font-secondary)',
                  fontWeight: 700,
                  border: '1px solid var(--dim-accent)',
                  cursor: 'pointer',
                  letterSpacing: '0.35em',
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget
                  btn.style.background = 'transparent'
                  btn.style.color = 'var(--dim-accent)'
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget
                  btn.style.background = 'var(--dim-accent)'
                  btn.style.color = 'var(--dim-bg)'
                }}
              >
                Enter
              </button>
            </div>
          </div>

          <style>{`
            @keyframes threshold-frame-in {
              from { opacity: 0; transform: scale(1.04); }
              to   { opacity: 0.12; transform: scale(1); }
            }
            @keyframes threshold-content-in {
              from { opacity: 0; transform: translateY(16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
