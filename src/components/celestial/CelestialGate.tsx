'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// Gate sits HIGH in the scene — camera starts far back at [0, -5, 28] looking UP at the gate.
// As the player scrolls, the camera ASCENDS toward the gate (heavenly stairway effect).
const GATE_X = 0
const GATE_Y = 15
const GATE_Z = -6
const PANEL_W = 5.5     // each panel 5.5 wide → 11 total gate width
const PANEL_H = 14      // small from far; grows dramatically as you approach
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

      {/* ── Cloud stair platforms — heavenly stairway ascending alongside the camera path ──
           Camera path: [0,-5,28] → [0,2,16] → [0,10,4] → [0,14,0] → through gate
           Clouds track the camera's Y and Z at each step, flanking it left/right ── */}

      {/* Step 1 — beside camera start (Y≈-4, Z≈22): large, bright anchors */}
      <RoundedBox args={[9, 3.5, 7]} position={[-11, -4, 22]} radius={0.8} smoothness={4}>
        <meshStandardMaterial color="#e8e0d0" emissive="#f5e080" emissiveIntensity={0.65} roughness={0.78} metalness={0.06} />
      </RoundedBox>
      <RoundedBox args={[9, 3.5, 7]} position={[11, -4, 22]} radius={0.8} smoothness={4}>
        <meshStandardMaterial color="#e8e0d0" emissive="#f5e080" emissiveIntensity={0.65} roughness={0.78} metalness={0.06} />
      </RoundedBox>

      {/* Step 2 — beside second camera keyframe (Y≈2, Z≈14): rising platforms */}
      <RoundedBox args={[10, 4, 7.5]} position={[-13, 2, 14]} radius={0.9} smoothness={4}>
        <meshStandardMaterial color="#ece5d4" emissive="#f5e080" emissiveIntensity={0.75} roughness={0.76} metalness={0.07} />
      </RoundedBox>
      <RoundedBox args={[10, 4, 7.5]} position={[13, 2, 14]} radius={0.9} smoothness={4}>
        <meshStandardMaterial color="#ece5d4" emissive="#f5e080" emissiveIntensity={0.75} roughness={0.76} metalness={0.07} />
      </RoundedBox>

      {/* Step 3 — beside third camera keyframe (Y≈10, Z≈2): upper approach */}
      <RoundedBox args={[11, 4.5, 8]} position={[-14, 10, 2]} radius={1.0} smoothness={4}>
        <meshStandardMaterial color="#ede8dc" emissive="#f5e080" emissiveIntensity={0.85} roughness={0.74} metalness={0.08} />
      </RoundedBox>
      <RoundedBox args={[11, 4.5, 8]} position={[14, 10, 2]} radius={1.0} smoothness={4}>
        <meshStandardMaterial color="#ede8dc" emissive="#f5e080" emissiveIntensity={0.85} roughness={0.74} metalness={0.08} />
      </RoundedBox>

      {/* Gate-level flanking clouds (beside the gate at Y≈15, Z=-6): grandest step */}
      <RoundedBox args={[12, 5, 9]} position={[-16, 15, -6]} radius={1.1} smoothness={4}>
        <meshStandardMaterial color="#f0ead8" emissive="#daa520" emissiveIntensity={1.0} roughness={0.72} metalness={0.09} />
      </RoundedBox>
      <RoundedBox args={[12, 5, 9]} position={[16, 15, -6]} radius={1.1} smoothness={4}>
        <meshStandardMaterial color="#f0ead8" emissive="#daa520" emissiveIntensity={1.0} roughness={0.72} metalness={0.09} />
      </RoundedBox>

      {/* Upper cloud canopy above the gate */}
      <RoundedBox args={[13, 3, 8]} position={[0, 25, -7]} radius={1.1} smoothness={4}>
        <meshStandardMaterial color="#f5f0e4" emissive="#f5e080" emissiveIntensity={0.7} roughness={0.75} metalness={0.06} />
      </RoundedBox>
      <RoundedBox args={[8, 2.5, 6]} position={[-14, 22, -8]} radius={0.9} smoothness={4}>
        <meshStandardMaterial color="#ede8dc" emissive="#f5e080" emissiveIntensity={0.6} roughness={0.78} metalness={0.06} />
      </RoundedBox>
      <RoundedBox args={[8, 2.5, 6]} position={[14, 22, -8]} radius={0.9} smoothness={4}>
        <meshStandardMaterial color="#ede8dc" emissive="#f5e080" emissiveIntensity={0.6} roughness={0.78} metalness={0.06} />
      </RoundedBox>

      {/* Atmospheric point lights on the stair clouds — stronger to ensure visibility */}
      <pointLight position={[-11, -3, 22]} intensity={8}  color="#f5e080" distance={20} decay={2} />
      <pointLight position={[ 11, -3, 22]} intensity={8}  color="#f5e080" distance={20} decay={2} />
      <pointLight position={[-13,  3, 14]} intensity={10} color="#daa520" distance={26} decay={2} />
      <pointLight position={[ 13,  3, 14]} intensity={10} color="#daa520" distance={26} decay={2} />
      <pointLight position={[  0, 10,  2]} intensity={12} color="#f5e080" distance={32} decay={1.8} />
      <pointLight position={[  0, 14, -5]} intensity={14} color="#f5e080" distance={35} decay={1.8} />
      <pointLight position={[  0, 24, -7]} intensity={8}  color="#f5e080" distance={22} decay={2} />
    </group>
  )
}
