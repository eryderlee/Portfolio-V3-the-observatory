'use client'

import { useRef, useMemo } from 'react'
import { useFrame }        from '@react-three/fiber'
import * as THREE          from 'three'

// ─────────────────────────────────────────────────────────────────────────────
// Jellyfish — surface / twilight zone  (world Y > -20)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Fish Schools — mid-depth (world Y -20 to -45)
// ─────────────────────────────────────────────────────────────────────────────

const SCHOOL_DATA: {
  cx: number; cy: number; cz: number
  rx: number; rz: number
  spd: number; off: number
}[] = [
  { cx:  4, cy: -26, cz: -8,  rx: 4.5, rz: 2.5, spd: 0.14, off: 0.0 },
  { cx: -5, cy: -38, cz: -12, rx: 3.5, rz: 2.0, spd: 0.18, off: 1.2 },
]

const FISH_EACH = 10
const FISH_N    = SCHOOL_DATA.length * FISH_EACH  // 20

function FishSchools() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy   = useMemo(() => new THREE.Object3D(), [])
  const ahead   = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const t    = clock.getElapsedTime()
    const mesh = meshRef.current
    if (!mesh) return

    let idx = 0
    for (let s = 0; s < SCHOOL_DATA.length; s++) {
      const { cx, cy, cz, rx, rz, spd, off } = SCHOOL_DATA[s]
      for (let i = 0; i < FISH_EACH; i++) {
        const angle = t * spd + (i / FISH_EACH) * Math.PI * 2 + off
        const na    = angle + 0.05

        const x = cx + rx * Math.cos(angle)
        const y = cy + Math.sin(t * 0.35 + i * 0.55) * 0.6
        const z = cz + rz * Math.sin(angle)

        ahead.set(cx + rx * Math.cos(na), y, cz + rz * Math.sin(na))

        dummy.position.set(x, y, z)
        dummy.lookAt(ahead)
        dummy.scale.set(1, 0.6, 2.5)
        dummy.updateMatrix()
        mesh.setMatrixAt(idx++, dummy.matrix)
      }
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, FISH_N]} frustumCulled={false}>
      <sphereGeometry args={[0.18, 6, 4]} />
      <meshBasicMaterial
        color="#005566"
        transparent
        opacity={0.32}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Whale / Leviathan — deep zone (world Y < -50)
// ─────────────────────────────────────────────────────────────────────────────

function Whale() {
  const groupRef = useRef<THREE.Group>(null)
  const rotY     = useRef(Math.PI * 0.5)

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return
    const t  = clock.getElapsedTime()

    const wx = Math.sin(t * 0.05) * 35
    const wy = -62 + Math.sin(t * 0.12) * 1.5

    // Smooth turn to face direction of horizontal travel
    const vx  = Math.cos(t * 0.05)
    const tgt = vx >= 0 ? Math.PI * 0.5 : -Math.PI * 0.5
    rotY.current = THREE.MathUtils.damp(rotY.current, tgt, 0.4, delta)

    groupRef.current.position.set(wx, wy, -28)
    groupRef.current.rotation.y = rotY.current
    groupRef.current.rotation.z = Math.sin(t * 0.18) * 0.04
  })

  return (
    <group ref={groupRef}>
      {/* Massive near-black silhouette */}
      <mesh scale={[8, 3, 20]}>
        <sphereGeometry args={[1, 16, 8]} />
        <meshBasicMaterial color="#0c1a14" depthWrite={false} />
      </mesh>
      {/* Faint bioluminescent edge glow */}
      <mesh scale={[8.4, 3.2, 20.5]}>
        <sphereGeometry args={[1, 16, 8]} />
        <meshBasicMaterial
          color="#004433"
          transparent
          opacity={0.09}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Dim underglow — something ancient breathing in the dark */}
      <pointLight color="#003322" intensity={0.6} distance={20} decay={2} />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Creatures — top-level export
// ─────────────────────────────────────────────────────────────────────────────

interface CreaturesProps {
  progressRef: React.MutableRefObject<number>
}

export function Creatures({ progressRef: _progressRef }: CreaturesProps) {
  return (
    <>
      <JellyfishLayer />
      <FishSchools />
      <Whale />
    </>
  )
}
