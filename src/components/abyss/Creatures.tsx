'use client'

import { useRef, useMemo } from 'react'
import { useFrame }        from '@react-three/fiber'
import * as THREE          from 'three'

// ============================================================================
// Jellyfish — instanced rendering with size variety and idle/active differences
// ============================================================================

const JF_DATA = [
  { x:  4, y:  -6, z: -3, ph: 0.0, radius: 0.5, speedMult: 1.0, driftPhase: 0.7, driftAmp: 0.8 },
  { x: -5, y:  -9, z: -5, ph: 1.2, radius: 0.3, speedMult: 0.2, driftPhase: 1.5, driftAmp: 0.2 }, // idle
  { x:  3, y: -12, z: -4, ph: 2.4, radius: 0.9, speedMult: 0.7, driftPhase: 0.3, driftAmp: 0.6 },
  { x: -3, y: -18, z: -7, ph: 0.8, radius: 1.2, speedMult: 0.2, driftPhase: 2.1, driftAmp: 0.2 }, // idle
  { x:  7, y: -14, z: -6, ph: 3.6, radius: 0.6, speedMult: 0.6, driftPhase: 0.9, driftAmp: 0.5 },
]

const JF_N = JF_DATA.length
const T_N  = 6   // tentacles per jellyfish
const B_N  = 5   // beads per tentacle

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
      const { x: ox, y: oy, z: oz, ph, radius: r, speedMult: sp, driftPhase: dp, driftAmp: da } = JF_DATA[i]

      // Slow horizontal drift — idle jellyfish drift very little
      const wx = ox + Math.sin(t * 0.20 * sp + dp) * 1.4 * da
      const wy = oy + Math.sin(t * 0.14 * sp + ph * 0.8) * 0.35
      const wz = oz + Math.cos(t * 0.17 * sp + ph * 1.1) * 1.1 * da * 0.5

      // Asymmetric pump — active jellyfish pulse faster
      const pulse = 1 - 0.22 * Math.max(0, Math.sin(t * 5.0 * sp + ph))

      dummy.position.set(wx, wy, wz)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(r, pulse * r, r)
      dummy.updateMatrix()
      bell.setMatrixAt(i, dummy.matrix)

      // Tentacle beads — offset from bell rim, sway with current
      for (let j = 0; j < T_N; j++) {
        const ang = (j / T_N) * Math.PI * 2
        const tx  = wx + Math.cos(ang) * (r * 0.8)
        const tz  = wz + Math.sin(ang) * (r * 0.8)
        for (let k = 0; k < B_N; k++) {
          const drop = r * 0.4 + k * r * 0.46
          const sway = Math.min(k * 0.10, 0.45)
          const px   = tx + Math.sin(t * 1.4 * sp + ph + j * 0.9 + k * 0.4) * sway
          const pz   = tz + Math.cos(t * 1.2 * sp + ph * 0.9 + j * 1.1)     * sway
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
        <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
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
      <instancedMesh ref={beadRef} args={[undefined, undefined, JF_N * T_N * B_N]} frustumCulled={false}>
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
// Fish Schools — lazy orbital drift, no dispersal
// ============================================================================

interface SchoolDef {
  center:      [number, number, number]
  count:       number
  orbitRadius: number
  baseSpeed:   number
}

// 5 schools spanning twilight → midnight → abyss zones
// baseSpeed is ~35% of prior values for lazy drift
const SCHOOL_DEFS: SchoolDef[] = [
  { center: [ -4,  -7,  -4], count: 18, orbitRadius: 3.5, baseSpeed: 0.32 },
  { center: [  6, -16,  -7], count: 22, orbitRadius: 4.0, baseSpeed: 0.25 },
  { center: [ -8, -25, -10], count: 16, orbitRadius: 3.2, baseSpeed: 0.39 },
  { center: [  5, -36, -13], count: 20, orbitRadius: 4.5, baseSpeed: 0.28 },
  { center: [ -5, -46, -14], count: 24, orbitRadius: 3.8, baseSpeed: 0.21 },
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
      fish.angle += 0.016 * fish.speed * def.baseSpeed

      const x = def.center[0] + Math.cos(fish.angle) * r
      const y = def.center[1] + fish.yOffset + Math.sin(t * 0.8 + fish.bobPhase) * 0.3
      const z = def.center[2] + Math.sin(fish.angle) * r * 0.55 + fish.zOffset

      const mesh = meshRefs.current[i]
      if (mesh) {
        mesh.position.set(x, y, z)
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
// Whale — dark navy silhouette, no bioluminescence
// ============================================================================

function Whale({ elapsed }: { elapsed: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const t = elapsed.current
    if (!groupRef.current) return
    groupRef.current.position.x = 5   + Math.sin(t * 0.07) * 1.8
    groupRef.current.position.y = -38 + Math.sin(t * 0.05) * 1.2
    groupRef.current.rotation.z = Math.sin(t * 0.06) * 0.07
  })

  return (
    <group ref={groupRef} position={[5, -38, -17]} rotation={[0, 0.55, 0]}>
      {/* Main body */}
      <mesh scale={[1.6, 1.1, 4.8]}>
        <sphereGeometry args={[2.5, 22, 14]} />
        <meshBasicMaterial color="#0a1832" depthWrite={false} />
      </mesh>
      {/* Tail peduncle */}
      <mesh position={[0, 0, -10]} scale={[0.65, 0.5, 2.2]}>
        <sphereGeometry args={[2.5, 14, 10]} />
        <meshBasicMaterial color="#0a1832" depthWrite={false} />
      </mesh>
      {/* Tail fluke */}
      <mesh position={[0, 0, -14]} rotation={[0, 0.2, 0]} scale={[3.4, 0.12, 1.1]}>
        <sphereGeometry args={[2.0, 10, 6]} />
        <meshBasicMaterial color="#0a1832" depthWrite={false} />
      </mesh>
      {/* Dorsal fin */}
      <mesh position={[0, 3.4, 1.5]} rotation={[0.35, 0, 0]} scale={[0.14, 1.4, 1.0]}>
        <sphereGeometry args={[1.5, 8, 6]} />
        <meshBasicMaterial color="#0a1832" depthWrite={false} />
      </mesh>
      {/* Pectoral fin (left) */}
      <mesh position={[-3.2, -0.8, 3]} rotation={[0.2, 0, 0.4]} scale={[1.6, 0.1, 0.9]}>
        <sphereGeometry args={[1.5, 8, 6]} />
        <meshBasicMaterial color="#0a1832" depthWrite={false} />
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
