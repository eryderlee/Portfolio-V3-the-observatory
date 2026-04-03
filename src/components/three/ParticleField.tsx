'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 2000
const SPREAD_XY = 22
const SPREAD_Z = 12
const FALL_SPEED_MIN = 0.003
const FALL_SPEED_RANGE = 0.004

export function ParticleField() {
  const meshRef = useRef<THREE.Points>(null)

  const { positions, speeds, sizes } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const speeds = new Float32Array(PARTICLE_COUNT)
    const sizes = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * SPREAD_XY
      positions[i3 + 1] = (Math.random() - 0.5) * SPREAD_XY
      positions[i3 + 2] = (Math.random() - 0.5) * SPREAD_Z
      speeds[i] = FALL_SPEED_MIN + Math.random() * FALL_SPEED_RANGE
      sizes[i] = Math.random() * 0.6 + 0.2 // 0.2–0.8 size multiplier
    }

    return { positions, speeds, sizes }
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return

    const pos = meshRef.current.geometry.attributes.position
      .array as Float32Array
    const elapsed = state.clock.elapsedTime

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      // Drift downward
      pos[i3 + 1] -= speeds[i]
      // Subtle lateral drift via sine wave
      pos[i3] += Math.sin(elapsed * 0.1 + i * 0.01) * 0.0005

      // Wrap particles from bottom to top
      if (pos[i3 + 1] < -SPREAD_XY / 2) {
        pos[i3 + 1] = SPREAD_XY / 2
        pos[i3] = (Math.random() - 0.5) * SPREAD_XY
        pos[i3 + 2] = (Math.random() - 0.5) * SPREAD_Z
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true
    // Very slow rotation for depth effect
    meshRef.current.rotation.y = elapsed * 0.015
    meshRef.current.rotation.x = Math.sin(elapsed * 0.05) * 0.05
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3] as [Float32Array, number]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1] as [Float32Array, number]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#c8d0e8"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
