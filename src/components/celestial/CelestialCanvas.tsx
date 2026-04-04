'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { CelestialScene } from './CelestialScene'

export default function CelestialCanvas({ celestialProgress }: { celestialProgress: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60, near: 0.1, far: 120 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <CelestialScene celestialProgress={celestialProgress} />
      </Suspense>
    </Canvas>
  )
}
