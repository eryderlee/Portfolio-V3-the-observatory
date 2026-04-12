'use client'

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Jellyfish
// ============================================================================

interface JellyfishDef {
  position:   [number, number, number]
  bellRadius: number
  speedMult:  number   // 0.2 = nearly idle, 1.0 = active
  color:      string
  phase:      number
  driftPhase: number
  driftAmp:   number
}

// 5 jellyfish — 2 nearly idle (speedMult 0.2), 3 moderately active.
// Bell radii range from 0.3 (tiny) to 1.2 (large).
const JELLYFISH_DEFS: JellyfishDef[] = [
  { position: [ 4,  -6,  -3], bellRadius: 0.5, speedMult: 1.0, color: '#00c8e8', phase: 0.0, driftPhase: 0.7, driftAmp: 0.8 },
  { position: [-5,  -9,  -5], bellRadius: 0.3, speedMult: 0.2, color: '#00b4d0', phase: 1.2, driftPhase: 1.5, driftAmp: 0.2 }, // idle
  { position: [ 3, -12,  -4], bellRadius: 0.9, speedMult: 0.7, color: '#00d4c4', phase: 2.4, driftPhase: 0.3, driftAmp: 0.6 },
  { position: [-3, -18,  -7], bellRadius: 1.2, speedMult: 0.2, color: '#00e0d8', phase: 0.8, driftPhase: 2.1, driftAmp: 0.2 }, // idle
  { position: [ 7, -14,  -6], bellRadius: 0.6, speedMult: 0.6, color: '#00bcd4', phase: 3.6, driftPhase: 0.9, driftAmp: 0.5 },
]

const TENTACLE_COUNT = 8

function Jellyfish({
  data,
  elapsed,
}: {
  data:    JellyfishDef
  elapsed: React.MutableRefObject<number>
}) {
  const groupRef     = useRef<THREE.Group>(null)
  const bellRef      = useRef<THREE.Mesh>(null)
  const innerGlowRef = useRef<THREE.Mesh>(null)

  const tentacleGeos = useMemo(() => {
    const r = data.bellRadius
    return Array.from({ length: TENTACLE_COUNT }, (_, i) => {
      const angle = (i / TENTACLE_COUNT) * Math.PI * 2
      const bx    = Math.cos(angle) * r * 0.85
      const bz    = Math.sin(angle) * r * 0.85
      const len   = 2.0 + (i % 3) * 0.8
      const geo   = new THREE.BufferGeometry()
      geo.setAttribute(
        'position',
        new THREE.BufferAttribute(
          new Float32Array([bx, -r * 0.2, bz, bx * 0.3, -(r * 0.2 + len), bz * 0.3]),
          3,
        ),
      )
      return geo
    })
  }, [data.bellRadius])

  useFrame(() => {
    const t  = elapsed.current
    const sp = data.speedMult

    const pulse = 1 + 0.18 * Math.sin((t * 1.8 + data.phase) * sp)

    if (bellRef.current) {
      bellRef.current.scale.y = 0.52 * pulse
    }
    if (groupRef.current) {
      groupRef.current.position.x = data.position[0] + Math.sin(t * 0.18 * sp + data.driftPhase) * data.driftAmp
      groupRef.current.position.z = data.position[2] + Math.cos(t * 0.12 * sp + data.driftPhase) * data.driftAmp * 0.5
    }
    if (innerGlowRef.current) {
      const glowAlpha = 0.15 + 0.12 * Math.abs(Math.sin((t * 1.8 + data.phase) * sp))
      ;(innerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = glowAlpha
    }
  })

  return (
    <group ref={groupRef} position={data.position}>
      {/* Bell — flattened sphere, Y-scaled on every frame */}
      <mesh ref={bellRef}>
        <sphereGeometry args={[data.bellRadius, 16, 10]} />
        <meshStandardMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Inner glow — pulses with bell */}
      <mesh ref={innerGlowRef} position={[0, -data.bellRadius * 0.15, 0]}>
        <sphereGeometry args={[data.bellRadius * 0.55, 10, 8]} />
        <meshBasicMaterial
          color={data.color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Tentacles */}
      {tentacleGeos.map((geo, i) => (
        <lineSegments key={i} geometry={geo}>
          <lineBasicMaterial color={data.color} transparent opacity={0.3} depthWrite={false} />
        </lineSegments>
      ))}
    </group>
  )
}

// ============================================================================
// Fish Schools
// ============================================================================

interface SchoolDef {
  center:      [number, number, number]
  count:       number
  orbitRadius: number
  baseSpeed:   number
}

// 5 schools spanning twilight → midnight → abyss zones
const SCHOOL_DEFS: SchoolDef[] = [
  { center: [ -4,  -7,  -4], count: 18, orbitRadius: 3.5, baseSpeed: 0.9 },
  { center: [  6, -16,  -7], count: 22, orbitRadius: 4.0, baseSpeed: 0.7 },
  { center: [ -8, -25, -10], count: 16, orbitRadius: 3.2, baseSpeed: 1.1 },
  { center: [  5, -36, -13], count: 20, orbitRadius: 4.5, baseSpeed: 0.8 },
  { center: [ -5, -46, -14], count: 24, orbitRadius: 3.8, baseSpeed: 0.6 },
]

// When camera Y is within this many units of a school's Y, trigger dispersal
const DISPERSE_Y_THRESHOLD = 8
const DISPERSE_SPEED_MULT  = 3.5
const DISPERSE_RADIUS_MULT = 1.8

function FishSchool({
  def,
  elapsed,
}: {
  def:     SchoolDef
  elapsed: React.MutableRefObject<number>
}) {
  const { camera } = useThree()

  const fishState = useRef(
    Array.from({ length: def.count }, (_, i) => ({
      angle:    (i / def.count) * Math.PI * 2 + (i * 0.37) % 1.0,
      yOffset:  (((i * 17 + 5) % 23) / 23 - 0.5) * 2.5,
      zOffset:  (((i * 11 + 3) % 17) / 17 - 0.5) * 1.8,
      speed:    0.8 + ((i * 13 + 7) % 11) / 11 * 0.5,
      bobPhase: (i * 2.39996) % (Math.PI * 2),
    })),
  )

  const meshRefs      = useRef<(THREE.Mesh | null)[]>(Array(def.count).fill(null))
  const disperseLevel = useRef(0)
  const lastTrigger   = useRef(-999)

  useFrame(() => {
    const t    = elapsed.current
    const camY = camera.position.y

    if (Math.abs(camY - def.center[1]) < DISPERSE_Y_THRESHOLD) {
      lastTrigger.current = t
    }

    const timeSince = t - lastTrigger.current
    if (timeSince < 1.0) {
      disperseLevel.current = Math.min(1, disperseLevel.current + 0.06)
    } else {
      // Gradual recovery over ~4 seconds after the 1s hold
      disperseLevel.current = Math.max(0, disperseLevel.current - 0.005)
    }

    const d          = disperseLevel.current
    const speedMult  = 1 + d * (DISPERSE_SPEED_MULT - 1)
    const radiusMult = 1 + d * (DISPERSE_RADIUS_MULT - 1)
    const r          = def.orbitRadius * radiusMult

    for (let i = 0; i < def.count; i++) {
      const fish = fishState.current[i]
      fish.angle += 0.016 * fish.speed * speedMult * def.baseSpeed

      const x = def.center[0] + Math.cos(fish.angle) * r
      const y = def.center[1] + fish.yOffset + Math.sin(t * 0.8 + fish.bobPhase) * 0.3
      const z = def.center[2] + Math.sin(fish.angle) * r * 0.55 + fish.zOffset

      const mesh = meshRefs.current[i]
      if (mesh) {
        mesh.position.set(x, y, z)
        // Orient fish along orbital direction
        mesh.rotation.y = Math.atan2(-Math.sin(fish.angle), Math.cos(fish.angle) * 0.55)
      }
    }
  })

  return (
    <group>
      {Array.from({ length: def.count }, (_, i) => (
        <mesh key={i} ref={(el) => { meshRefs.current[i] = el }}>
          <coneGeometry args={[0.05, 0.22, 4]} />
          <meshStandardMaterial
            color="#a0e0d8"
            emissive="#00c8b4"
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}

// ============================================================================
// Whale
// ============================================================================

// Bioluminescent marking positions in whale-local space
const BIO_SPOTS: [number, number, number][] = [
  [-1.5,  1.0,  3.5],
  [ 1.0, -0.6,  6.5],
  [ 1.2,  0.5, -2.0],
]

function Whale({ elapsed }: { elapsed: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null)
  const bioRefs  = useRef<(THREE.Mesh | null)[]>([])

  useFrame(() => {
    const t = elapsed.current
    if (!groupRef.current) return
    groupRef.current.position.x = 5   + Math.sin(t * 0.07) * 1.8
    groupRef.current.position.y = -38 + Math.sin(t * 0.05) * 1.2
    // Slow gentle roll
    groupRef.current.rotation.z = Math.sin(t * 0.06) * 0.07

    // Bio-spot flicker — each on its own rhythm
    for (let i = 0; i < bioRefs.current.length; i++) {
      const mesh = bioRefs.current[i]
      if (!mesh) continue
      ;(mesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.4 + 0.9 * Math.sin(t * 2.3 + i * 1.7)
    }
  })

  return (
    // Angled so the whale swims diagonally past the camera (not nose-on)
    <group ref={groupRef} position={[5, -38, -17]} rotation={[0, 0.55, 0]}>
      {/* Main body — large dark elongated shape */}
      <mesh scale={[1.6, 1.1, 4.8]}>
        <sphereGeometry args={[2.5, 22, 14]} />
        <meshStandardMaterial
          color="#050f1a"
          emissive="#00c8b4"
          emissiveIntensity={0.45}
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>
      {/* Tail peduncle — narrows toward the tail */}
      <mesh position={[0, 0, -10]} scale={[0.65, 0.5, 2.2]}>
        <sphereGeometry args={[2.5, 14, 10]} />
        <meshStandardMaterial
          color="#050f1a"
          emissive="#00c8b4"
          emissiveIntensity={0.38}
          roughness={0.95}
        />
      </mesh>
      {/* Tail fluke — flat horizontal fan */}
      <mesh position={[0, 0, -14]} rotation={[0, 0.2, 0]} scale={[3.4, 0.12, 1.1]}>
        <sphereGeometry args={[2.0, 10, 6]} />
        <meshStandardMaterial
          color="#050f1a"
          emissive="#00c8b4"
          emissiveIntensity={0.32}
          roughness={0.95}
        />
      </mesh>
      {/* Dorsal fin */}
      <mesh position={[0, 3.4, 1.5]} rotation={[0.35, 0, 0]} scale={[0.14, 1.4, 1.0]}>
        <sphereGeometry args={[1.5, 8, 6]} />
        <meshStandardMaterial
          color="#050f1a"
          emissive="#00c8b4"
          emissiveIntensity={0.42}
          roughness={0.95}
        />
      </mesh>
      {/* Pectoral fin (left) */}
      <mesh position={[-3.2, -0.8, 3]} rotation={[0.2, 0, 0.4]} scale={[1.6, 0.1, 0.9]}>
        <sphereGeometry args={[1.5, 8, 6]} />
        <meshStandardMaterial
          color="#050f1a"
          emissive="#00c8b4"
          emissiveIntensity={0.38}
          roughness={0.95}
        />
      </mesh>
      {/* Bioluminescent markings — teal glowing spots */}
      {BIO_SPOTS.map((pos, i) => (
        <mesh
          key={i}
          ref={(el) => { bioRefs.current[i] = el }}
          position={pos}
        >
          <sphereGeometry args={[0.22, 8, 6]} />
          <meshStandardMaterial
            color="#00ffee"
            emissive="#00ffdd"
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}
    </group>
  )
}

// ============================================================================
// Creatures — composite
// ============================================================================

export function Creatures({
  progressRef: _progressRef,
}: {
  progressRef: React.MutableRefObject<number>
}) {
  const elapsed = useRef(0)

  useFrame((_, delta) => {
    elapsed.current += delta
  })

  return (
    <>
      {JELLYFISH_DEFS.map((jf, i) => (
        <Jellyfish key={i} data={jf} elapsed={elapsed} />
      ))}
      {SCHOOL_DEFS.map((def, i) => (
        <FishSchool key={i} def={def} elapsed={elapsed} />
      ))}
      <Whale elapsed={elapsed} />
    </>
  )
}
