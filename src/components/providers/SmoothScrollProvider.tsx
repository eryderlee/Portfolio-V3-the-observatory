'use client'

import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@/lib/gsap'

interface LenisContextValue {
  stop: () => void
  start: () => void
  scrollTo: (target: number | string | HTMLElement, options?: Record<string, unknown>) => void
}

const LenisContext = createContext<LenisContextValue | null>(null)

export function useLenis() {
  return useContext(LenisContext)
}

interface SmoothScrollProviderProps {
  children: React.ReactNode
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: false })
    lenisRef.current = lenis

    const update = (time: number) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(update)
    lenis.on('scroll', () => ScrollTrigger.update())
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(update)
      lenis.destroy()
    }
  }, [])

  const ctx = useMemo<LenisContextValue>(
    () => ({
      stop: () => lenisRef.current?.stop(),
      start: () => lenisRef.current?.start(),
      scrollTo: (target, options) =>
        lenisRef.current?.scrollTo(target as number, options as Parameters<Lenis['scrollTo']>[1]),
    }),
    []
  )

  return <LenisContext.Provider value={ctx}>{children}</LenisContext.Provider>
}
