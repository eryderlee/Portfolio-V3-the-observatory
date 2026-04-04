'use client'

import { createContext, useContext, useState, useMemo } from 'react'

interface SceneContextValue {
  activeSection: string
  celestialProgress: number
  setActiveSection: (s: string) => void
  setCelestialProgress: (p: number) => void
}

const SceneContext = createContext<SceneContextValue>({
  activeSection: 'observatory',
  celestialProgress: 0,
  setActiveSection: () => {},
  setCelestialProgress: () => {},
})

export function useSceneContext() {
  return useContext(SceneContext)
}

export function SceneContextProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState('observatory')
  const [celestialProgress, setCelestialProgress] = useState(0)

  const value = useMemo(
    () => ({ activeSection, celestialProgress, setActiveSection, setCelestialProgress }),
    [activeSection, celestialProgress]
  )

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>
}
