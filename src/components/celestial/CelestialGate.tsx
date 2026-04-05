'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// Gate is positioned along the camera's entry line of sight:
// Camera starts at [0, -13.2, 1] looking toward [-4, 0.8, -10].
// Gate center at [0, -5, -5] falls roughly on that line, spanning
// the full vertical range the camera sweeps through on entry.
const GATE_X = 0
const GATE_Y = -5
const GATE_Z = -5
const PANEL_W = 7       // half-width — each panel is 7 units wide
const PANEL_H = 20      // tall enough to fill view
const PANEL_D = 0.35

const GATE_OPEN_AT = 0.18   // fully rotated open by 18% scroll progress
const GATE_HIDE_AT = 0.25   // hidden entirely by 25% (panels folded back, no longer needed)

export function CelestialGate({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const outerRef   = useRef<THREE.Group>(null)
  const leftRef    = useRef<THREE.Group>(null)
  const rightRef   = useRef<THREE.Group>(null)
  const lightRef   = useRef<THREE.PointLight>(null)

  useFrame(() => {
    const p = progressRef.current
    const gateProgress = Math.min(1, p / GATE_OPEN_AT)

    // Rotate panels open: left swings -120°, right swings +120°
    if (leftRef.current)  leftRef.current.rotation.y  = -gateProgress * (Math.PI * 2 / 3)
    if (rightRef.current) rightRef.current.rotation.y =  gateProgress * (Math.PI * 2 / 3)

    // Light behind gates floods in as they open, then dies as gates hide
    if (lightRef.current) lightRef.current.intensity = gateProgress * 20

    // Hide the whole gate once the camera is well past it
    if (outerRef.current) outerRef.current.visible = p < GATE_HIDE_AT
  })

  return (
    <group ref={outerRef} position={[GATE_X, GATE_Y, GATE_Z]} rotation={[Math.PI * 0.3, 0, 0]}>

      {/* ── Left panel — hinge at x = -PANEL_W ── */}
      <group ref={leftRef} position={[-PANEL_W, 0, 0]}>
        {/* Main panel body */}
        <RoundedBox args={[PANEL_W, PANEL_H, PANEL_D]} position={[PANEL_W / 2, 0, 0]} radius={0.12} smoothness={4}>
          <meshStandardMaterial
            color="#c89010"
            emissive="#daa520"
            emissiveIntensity={0.75}
            roughness={0.35}
            metalness={0.75}
          />
        </RoundedBox>
        {/* Glowing seam bar at the closing edge */}
        <RoundedBox args={[0.28, PANEL_H * 0.9, PANEL_D * 1.3]} position={[PANEL_W - 0.14, 0, 0]} radius={0.06} smoothness={3}>
          <meshStandardMaterial
            color="#f5e080"
            emissive="#f5e040"
            emissiveIntensity={2.0}
            roughness={0.2}
            metalness={0.9}
          />
        </RoundedBox>
        {/* Horizontal crossbar — upper */}
        <RoundedBox args={[PANEL_W * 0.8, 0.5, PANEL_D * 1.2]} position={[PANEL_W / 2, PANEL_H * 0.3, 0]} radius={0.08} smoothness={3}>
          <meshStandardMaterial color="#daa520" emissive="#c89010" emissiveIntensity={1.1} roughness={0.3} metalness={0.8} />
        </RoundedBox>
        {/* Horizontal crossbar — lower */}
        <RoundedBox args={[PANEL_W * 0.8, 0.5, PANEL_D * 1.2]} position={[PANEL_W / 2, -PANEL_H * 0.28, 0]} radius={0.08} smoothness={3}>
          <meshStandardMaterial color="#daa520" emissive="#c89010" emissiveIntensity={1.1} roughness={0.3} metalness={0.8} />
        </RoundedBox>
      </group>

      {/* ── Right panel — hinge at x = +PANEL_W ── */}
      <group ref={rightRef} position={[PANEL_W, 0, 0]}>
        {/* Main panel body */}
        <RoundedBox args={[PANEL_W, PANEL_H, PANEL_D]} position={[-PANEL_W / 2, 0, 0]} radius={0.12} smoothness={4}>
          <meshStandardMaterial
            color="#c89010"
            emissive="#daa520"
            emissiveIntensity={0.75}
            roughness={0.35}
            metalness={0.75}
          />
        </RoundedBox>
        {/* Glowing seam bar */}
        <RoundedBox args={[0.28, PANEL_H * 0.9, PANEL_D * 1.3]} position={[-(PANEL_W - 0.14), 0, 0]} radius={0.06} smoothness={3}>
          <meshStandardMaterial
            color="#f5e080"
            emissive="#f5e040"
            emissiveIntensity={2.0}
            roughness={0.2}
            metalness={0.9}
          />
        </RoundedBox>
        {/* Upper crossbar */}
        <RoundedBox args={[PANEL_W * 0.8, 0.5, PANEL_D * 1.2]} position={[-PANEL_W / 2, PANEL_H * 0.3, 0]} radius={0.08} smoothness={3}>
          <meshStandardMaterial color="#daa520" emissive="#c89010" emissiveIntensity={1.1} roughness={0.3} metalness={0.8} />
        </RoundedBox>
        {/* Lower crossbar */}
        <RoundedBox args={[PANEL_W * 0.8, 0.5, PANEL_D * 1.2]} position={[-PANEL_W / 2, -PANEL_H * 0.28, 0]} radius={0.08} smoothness={3}>
          <meshStandardMaterial color="#daa520" emissive="#c89010" emissiveIntensity={1.1} roughness={0.3} metalness={0.8} />
        </RoundedBox>
      </group>

      {/* Light source behind the gates — floods through as panels open */}
      <pointLight
        ref={lightRef}
        position={[0, 0, -4]}
        intensity={0}
        color="#f5e080"
        distance={60}
        decay={1.5}
      />
    </group>
  )
}
