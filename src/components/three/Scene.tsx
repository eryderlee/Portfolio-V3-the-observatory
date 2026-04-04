'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ParticleField } from './ParticleField'
import { useSceneContext } from '@/components/providers/SceneContext'
import { CelestialScene } from '@/components/celestial/CelestialScene'

// Context is read here, outside the R3F Canvas, to avoid reconciler boundary issues
function SceneContent({ activeSection, celestialProgress }: { activeSection: string; celestialProgress: number }) {
  return (
    <Suspense fallback={null}>
      {activeSection === 'celestial'
        ? <CelestialScene celestialProgress={celestialProgress} />
        : <ParticleField />}
    </Suspense>
  )
}

export default function Scene() {
  const { activeSection, celestialProgress } = useSceneContext()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60, near: 0.1, far: 120 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <SceneContent activeSection={activeSection} celestialProgress={celestialProgress} />
      </Canvas>
    </div>
  )
}
