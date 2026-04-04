'use client'

import { useRef, useEffect } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

interface CloudPlatformProps {
  position: [number, number, number]
  scale: [number, number, number]
  emissive?: boolean
  bright?: boolean
  rotation?: [number, number, number]
}

export function CloudPlatform({ position, scale, emissive = false, bright = false, rotation }: CloudPlatformProps) {
  const groupRef = useRef<THREE.Group>(null)
  const emissiveIntensity = bright ? 0.9 : emissive ? 0.45 : 0.08
  const baseColor = bright ? '#f5e088' : emissive ? '#daa520' : '#e8d8a8'
  const emissiveColor = bright ? '#f5e060' : emissive ? '#c89010' : '#000000'

  // Cleanup on unmount
  useEffect(() => {
    const group = groupRef.current
    return () => {
      if (!group) return
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
    }
  }, [])

  return (
    <group ref={groupRef} position={position} rotation={rotation ?? [0, 0, 0]}>
      {/* Main platform body */}
      <RoundedBox args={[scale[0], scale[1], scale[2]]} radius={0.35} smoothness={4}>
        <meshStandardMaterial
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.75}
          metalness={0.05}
        />
      </RoundedBox>

      {/* Sub-cloud bump left */}
      <RoundedBox
        args={[scale[0] * 0.55, scale[1] * 0.9, scale[2] * 0.5]}
        position={[-scale[0] * 0.22, scale[1] * 0.65, 0]}
        radius={0.4}
        smoothness={4}
      >
        <meshStandardMaterial
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity * 0.7}
          roughness={0.85}
        />
      </RoundedBox>

      {/* Sub-cloud bump right */}
      <RoundedBox
        args={[scale[0] * 0.4, scale[1] * 0.7, scale[2] * 0.4]}
        position={[scale[0] * 0.28, scale[1] * 0.55, scale[2] * 0.08]}
        radius={0.35}
        smoothness={4}
      >
        <meshStandardMaterial
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity * 0.55}
          roughness={0.9}
        />
      </RoundedBox>
    </group>
  )
}
