'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Jellyfish
// ============================================================================

const JF_DATA: { x: number; y: number; z: number; ph: number }[] = [
  { x: -4, y: -3,  z: -3, ph: 0.0 },
  { x:  5, y: -7,  z: -5, ph: 1.3 },
  { x: -7, y: -11, z: -4, ph: 2.6 },
  { x:  3, y: -14, z: -7, ph: 0.8 },
  { x: -2, y: -18, z: -6, ph: 4.1 },
]

const BELL_R = 0.7
const T_N    = 6   // tentacles per jellyfish
const B_N    = 5   // beads per tentacle
const JF_N   = JF_DATA.length           // 5
const BEAD_N = JF_N * T_N * B_N         // 150

function JellyfishLayer() {
  const bellRef = useRef<THREE.InstancedMesh>(null)
  const beadRef = useRef<THREE.InstancedMesh>(null)
  const dummy   = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ clock }) => {
    const t    = clock.getElapsedTime()
    const bell = bellRef.current
    const bead = beadRef.current
    if (!bell || !bead) return

    for (let i = 0; i < JF_N; i++) {
      const { x: ox, y: oy, z: oz, ph } = JF_DATA[i]

      // Slow horizontal drift
      const wx = ox + Math.sin(t * 0.20 + ph) * 1.4
      const wy = oy + Math.sin(t * 0.14 + ph * 0.8) * 0.35
      const wz = oz + Math.cos(t * 0.17 + ph * 1.1) * 1.1

      // Asymmetric pump — quick squeeze, slow open
      const pulse = 1 - 0.22 * Math.max(0, Math.sin(t * 5.0 + ph))

      dummy.position.set(wx, wy, wz)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, pulse, 1)
      dummy.updateMatrix()
      bell.setMatrixAt(i, dummy.matrix)

      // Tentacle beads — sine-wave sway increases with drop distance
      for (let j = 0; j < T_N; j++) {
        const ang = (j / T_N) * Math.PI * 2
        const tx  = wx + Math.cos(ang) * (BELL_R * 0.8)
        const tz  = wz + Math.sin(ang) * (BELL_R * 0.8)
        for (let k = 0; k < B_N; k++) {
          const drop = 0.28 + k * 0.32
          const sway = Math.min(k * 0.10, 0.45)
          const px   = tx + Math.sin(t * 1.4 + ph + j * 0.9 + k * 0.4) * sway
          const pz   = tz + Math.cos(t * 1.2 + ph * 0.9 + j * 1.1)     * sway
          dummy.position.set(px, wy - drop, pz)
          dummy.scale.set(1, 1, 1)
          dummy.updateMatrix()
          bead.setMatrixAt(i * T_N * B_N + j * B_N + k, dummy.matrix)
        }
      }
    }

    bell.instanceMatrix.needsUpdate = true
    bead.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      {/* Bell domes — translucent teal, additive blending */}
      <instancedMesh ref={bellRef} args={[undefined, undefined, JF_N]} frustumCulled={false}>
        <sphereGeometry args={[BELL_R, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color="#00c8b4"
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* Tentacle beads */}
      <instancedMesh ref={beadRef} args={[undefined, undefined, BEAD_N]} frustumCulled={false}>
        <sphereGeometry args={[0.05, 5, 3]} />
        <meshBasicMaterial
          color="#00c8b4"
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </>
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

function FishSchool({
  def,
  elapsed,
}: {
  def:     SchoolDef
  elapsed: React.MutableRefObject<number>
}) {
  const fishState = useRef(
    Array.from({ length: def.count }, (_, i) => ({
      angle:    (i / def.count) * Math.PI * 2 + (i * 0.37) % 1.0,
      yOffset:  (((i * 17 + 5) % 23) / 23 - 0.5) * 2.5,
      zOffset:  (((i * 11 + 3) % 17) / 17 - 0.5) * 1.8,
      speed:    0.8 + ((i * 13 + 7) % 11) / 11 * 0.5,
      bobPhase: (i * 2.39996) % (Math.PI * 2),
    })),
  )

  const meshRefs = useRef<(THREE.Mesh | null)[]>(Array(def.count).fill(null))

  useFrame(() => {
    const t = elapsed.current
    const r = def.orbitRadius

    for (let i = 0; i < def.count; i++) {
      const fish = fishState.current[i]
      fish.angle += 0.016 * 0.3 * fish.speed * def.baseSpeed

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

function Whale({ elapsed }: { elapsed: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const t = elapsed.current
    if (!groupRef.current) return
    groupRef.current.position.x = 5   + Math.sin(t * 0.07) * 1.8
    groupRef.current.position.y = -38 + Math.sin(t * 0.05) * 1.2
    // Slow gentle roll
    groupRef.current.rotation.z = Math.sin(t * 0.06) * 0.07
  })

  return (
    // Angled so the whale swims diagonally past the camera (not nose-on)
    <group ref={groupRef} position={[5, -38, -17]} rotation={[0, 0.55, 0]}>
      {/* Main body — large dark blue elongated shape */}
      <mesh scale={[1.6, 1.1, 4.8]}>
        <sphereGeometry args={[2.5, 22, 14]} />
        <meshStandardMaterial
          color="#0a1a3a"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>
      {/* Tail peduncle — narrows toward the tail */}
      <mesh position={[0, 0, -10]} scale={[0.65, 0.5, 2.2]}>
        <sphereGeometry args={[2.5, 14, 10]} />
        <meshStandardMaterial
          color="#0a1a3a"
          roughness={0.95}
        />
      </mesh>
      {/* Tail fluke — flat horizontal fan */}
      <mesh position={[0, 0, -14]} rotation={[0, 0.2, 0]} scale={[3.4, 0.12, 1.1]}>
        <sphereGeometry args={[2.0, 10, 6]} />
        <meshStandardMaterial
          color="#0a1a3a"
          roughness={0.95}
        />
      </mesh>
      {/* Dorsal fin */}
      <mesh position={[0, 3.4, 1.5]} rotation={[0.35, 0, 0]} scale={[0.14, 1.4, 1.0]}>
        <sphereGeometry args={[1.5, 8, 6]} />
        <meshStandardMaterial
          color="#0a1a3a"
          roughness={0.95}
        />
      </mesh>
      {/* Pectoral fin (left) */}
      <mesh position={[-3.2, -0.8, 3]} rotation={[0.2, 0, 0.4]} scale={[1.6, 0.1, 0.9]}>
        <sphereGeometry args={[1.5, 8, 6]} />
        <meshStandardMaterial
          color="#0a1a3a"
          roughness={0.95}
        />
      </mesh>
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
      <JellyfishLayer />
      {SCHOOL_DEFS.map((def, i) => (
        <FishSchool key={i} def={def} elapsed={elapsed} />
      ))}
      <Whale elapsed={elapsed} />
    </>
  )
}
