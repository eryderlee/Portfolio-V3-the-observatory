'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// Gate sits HIGH in the scene — camera starts low at [0, -5, 8] looking UP at the gate.
// As the player scrolls, the camera ASCENDS toward the gate (heavenly stairway effect).
const GATE_X = 0
const GATE_Y = 15
const GATE_Z = -6
const PANEL_W = 7.5     // each panel 7.5 wide → 15 total gate width
const PANEL_H = 25      // imposing height
const PANEL_D = 0.4

// Gate opens slightly after scroll begins, fully open at 8%
const GATE_OPEN_START = 0.02
const GATE_OPEN_AT    = 0.08
const GATE_HIDE_AT    = 0.22   // hidden once camera is well past

export function CelestialGate({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const outerRef   = useRef<THREE.Group>(null)
  const leftRef    = useRef<THREE.Group>(null)
  const rightRef   = useRef<THREE.Group>(null)
  const lightRef   = useRef<THREE.PointLight>(null)

  useFrame(() => {
    const p = progressRef.current
    const gateProgress = Math.min(1, Math.max(0, (p - GATE_OPEN_START) / (GATE_OPEN_AT - GATE_OPEN_START)))

    // Rotate panels open: left swings -120°, right swings +120°
    if (leftRef.current)  leftRef.current.rotation.y  = -gateProgress * (Math.PI * 2 / 3)
    if (rightRef.current) rightRef.current.rotation.y =  gateProgress * (Math.PI * 2 / 3)

    // Light behind gates floods in as they open
    if (lightRef.current) lightRef.current.intensity = gateProgress * 20

    // Hide everything once the camera is well past
    if (outerRef.current) outerRef.current.visible = p < GATE_HIDE_AT
  })

  return (
    <group ref={outerRef}>

      {/* ── Gate panels — high up at [0, 15, -6] ── */}
      <group position={[GATE_X, GATE_Y, GATE_Z]}>

        {/* Left panel — hinge at x = -PANEL_W */}
        <group ref={leftRef} position={[-PANEL_W, 0, 0]}>
          <RoundedBox args={[PANEL_W, PANEL_H, PANEL_D]} position={[PANEL_W / 2, 0, 0]} radius={0.12} smoothness={4}>
            <meshStandardMaterial color="#c89010" emissive="#daa520" emissiveIntensity={0.75} roughness={0.35} metalness={0.75} />
          </RoundedBox>
          {/* Glowing seam bar at the closing edge */}
          <RoundedBox args={[0.28, PANEL_H * 0.9, PANEL_D * 1.3]} position={[PANEL_W - 0.14, 0, 0]} radius={0.06} smoothness={3}>
            <meshStandardMaterial color="#f5e080" emissive="#f5e040" emissiveIntensity={2.0} roughness={0.2} metalness={0.9} />
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

        {/* Right panel — hinge at x = +PANEL_W */}
        <group ref={rightRef} position={[PANEL_W, 0, 0]}>
          <RoundedBox args={[PANEL_W, PANEL_H, PANEL_D]} position={[-PANEL_W / 2, 0, 0]} radius={0.12} smoothness={4}>
            <meshStandardMaterial color="#c89010" emissive="#daa520" emissiveIntensity={0.75} roughness={0.35} metalness={0.75} />
          </RoundedBox>
          {/* Glowing seam bar */}
          <RoundedBox args={[0.28, PANEL_H * 0.9, PANEL_D * 1.3]} position={[-(PANEL_W - 0.14), 0, 0]} radius={0.06} smoothness={3}>
            <meshStandardMaterial color="#f5e080" emissive="#f5e040" emissiveIntensity={2.0} roughness={0.2} metalness={0.9} />
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

        {/* Gate lintel — grand header bar spanning the full gate width */}
        <RoundedBox args={[PANEL_W * 2 + 1.8, 1.4, PANEL_D * 1.5]} position={[0, PANEL_H / 2 + 0.7, 0]} radius={0.1} smoothness={3}>
          <meshStandardMaterial color="#c89010" emissive="#daa520" emissiveIntensity={1.0} roughness={0.3} metalness={0.85} />
        </RoundedBox>

        {/* Light behind gates — floods through as panels open */}
        <pointLight
          ref={lightRef}
          position={[0, 0, -4]}
          intensity={0}
          color="#f5e080"
          distance={80}
          decay={1.5}
        />
      </group>

      {/* ── Cloud stair platforms — heavenly stairway ascending to the gate ── */}

      {/* Bottom stairs near camera start (world Y ≈ 0) */}
      <RoundedBox args={[4.5, 1.5, 3.5]} position={[-7, -1, 4]} radius={0.55} smoothness={4}>
        <meshStandardMaterial color="#e8e0d0" emissive="#f5e080" emissiveIntensity={0.18} roughness={0.85} metalness={0.05} />
      </RoundedBox>
      <RoundedBox args={[4.5, 1.5, 3.5]} position={[7, -1, 4]} radius={0.55} smoothness={4}>
        <meshStandardMaterial color="#e8e0d0" emissive="#f5e080" emissiveIntensity={0.18} roughness={0.85} metalness={0.05} />
      </RoundedBox>

      {/* Mid stairs (world Y ≈ 5) */}
      <RoundedBox args={[5.5, 1.8, 4]} position={[-9, 5, 1]} radius={0.65} smoothness={4}>
        <meshStandardMaterial color="#e8e0d0" emissive="#f5e080" emissiveIntensity={0.2} roughness={0.85} metalness={0.05} />
      </RoundedBox>
      <RoundedBox args={[5.5, 1.8, 4]} position={[9, 5, 1]} radius={0.65} smoothness={4}>
        <meshStandardMaterial color="#e8e0d0" emissive="#f5e080" emissiveIntensity={0.2} roughness={0.85} metalness={0.05} />
      </RoundedBox>

      {/* Upper stairs (world Y ≈ 10) */}
      <RoundedBox args={[6, 2, 4.5]} position={[-10, 10, -3]} radius={0.7} smoothness={4}>
        <meshStandardMaterial color="#ede8dc" emissive="#f5e080" emissiveIntensity={0.22} roughness={0.82} metalness={0.06} />
      </RoundedBox>
      <RoundedBox args={[6, 2, 4.5]} position={[10, 10, -3]} radius={0.7} smoothness={4}>
        <meshStandardMaterial color="#ede8dc" emissive="#f5e080" emissiveIntensity={0.22} roughness={0.82} metalness={0.06} />
      </RoundedBox>

      {/* Gate-level flanking clouds (beside the gate at Y ≈ 15) */}
      <RoundedBox args={[7, 2.5, 5]} position={[-15, 15, -6]} radius={0.85} smoothness={4}>
        <meshStandardMaterial color="#f0ead8" emissive="#daa520" emissiveIntensity={0.25} roughness={0.8} metalness={0.08} />
      </RoundedBox>
      <RoundedBox args={[7, 2.5, 5]} position={[15, 15, -6]} radius={0.85} smoothness={4}>
        <meshStandardMaterial color="#f0ead8" emissive="#daa520" emissiveIntensity={0.25} roughness={0.8} metalness={0.08} />
      </RoundedBox>

      {/* Upper cloud canopy above the gate */}
      <RoundedBox args={[11, 2, 6]} position={[0, 29, -7]} radius={0.95} smoothness={4}>
        <meshStandardMaterial color="#f5f0e4" emissive="#f5e080" emissiveIntensity={0.2} roughness={0.8} metalness={0.05} />
      </RoundedBox>
      <RoundedBox args={[5.5, 1.5, 4]} position={[-11, 26, -7]} radius={0.7} smoothness={4}>
        <meshStandardMaterial color="#ede8dc" emissive="#f5e080" emissiveIntensity={0.18} roughness={0.82} metalness={0.05} />
      </RoundedBox>
      <RoundedBox args={[5.5, 1.5, 4]} position={[11, 26, -7]} radius={0.7} smoothness={4}>
        <meshStandardMaterial color="#ede8dc" emissive="#f5e080" emissiveIntensity={0.18} roughness={0.82} metalness={0.05} />
      </RoundedBox>

      {/* Atmospheric point lights on the stair clouds */}
      <pointLight position={[-7, 0, 4]}  intensity={3} color="#f5e080" distance={14} decay={2} />
      <pointLight position={[7,  0, 4]}  intensity={3} color="#f5e080" distance={14} decay={2} />
      <pointLight position={[0,  7, 0]}  intensity={5} color="#daa520" distance={22} decay={2} />
      <pointLight position={[0, 14, -5]} intensity={6} color="#f5e080" distance={25} decay={1.8} />
      <pointLight position={[0, 27, -7]} intensity={4} color="#f5e080" distance={18} decay={2} />
    </group>
  )
}
