'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { BioluminescentParticles } from './BioluminescentParticles'
import { Bubbles }                              from './Bubbles'
import { WorkflowOrganism }                     from './WorkflowOrganism'
import { WORKFLOW_GRAPHS, WORKFLOW_PLACEMENTS } from './workflowData'

// ---------------------------------------------------------------------------
// Camera path — descends from surface through 3 depth tiers
// Tier 1 (Twilight):  Y =  0 → -20
// Tier 2 (Midnight):  Y = -22 → -44
// Tier 3 (Abyss):     Y = -46 → -68
// ---------------------------------------------------------------------------
function buildAbyssPath(): {
  curve: THREE.CatmullRomCurve3
  quaternions: THREE.Quaternion[]
} {
  const points: THREE.Vector3[] = []
  const quats:  THREE.Quaternion[] = []

  const push = (pos: THREE.Vector3, lookAt: THREE.Vector3) => {
    points.push(pos)
    const m = new THREE.Matrix4().lookAt(pos, lookAt, new THREE.Vector3(0, 1, 0))
    quats.push(new THREE.Quaternion().setFromRotationMatrix(m))
  }

  // Surface — camera just below the surface, looking slightly UP toward the light above,
  // then tilting downward as the descent begins
  push(new THREE.Vector3(  0,  2,  10), new THREE.Vector3( 0,   7,   5))
  push(new THREE.Vector3(  0,  0,   6), new THREE.Vector3( 0,  -4,  -2))

  // ── Tier 1: Twilight Zone ─────────────────────────────────────────────────
  push(new THREE.Vector3( -3,  -4,   3), new THREE.Vector3(-2, -10,  -4))
  push(new THREE.Vector3( -2, -10,  -4), new THREE.Vector3( 3, -17,  -8))
  push(new THREE.Vector3(  3, -17,  -8), new THREE.Vector3( 0, -22, -12))

  // ── Tier 2: Midnight Zone ─────────────────────────────────────────────────
  push(new THREE.Vector3(  4, -25,  -6), new THREE.Vector3(-3, -32, -10))
  push(new THREE.Vector3( -3, -32, -10), new THREE.Vector3( 4, -40, -16))
  push(new THREE.Vector3(  4, -40, -16), new THREE.Vector3( 0, -46, -20))

  // ── Tier 3: The Abyss ─────────────────────────────────────────────────────
  push(new THREE.Vector3( -4, -50,  -9), new THREE.Vector3( 3, -58, -14))
  push(new THREE.Vector3(  3, -58, -14), new THREE.Vector3( 0, -65, -19))
  push(new THREE.Vector3(  0, -65, -19), new THREE.Vector3( 0, -72, -24))

  // Final rest — deepest point
  push(new THREE.Vector3(  0, -73, -16), new THREE.Vector3( 0, -80, -20))

  return {
    curve: new THREE.CatmullRomCurve3(points),
    quaternions: quats,
  }
}

const { curve: ABYSS_CURVE, quaternions: ABYSS_Q } = buildAbyssPath()

// Color constants for dynamic lerp — never mutated
const SURFACE_COLOR = new THREE.Color('#102850')
const DEEP_COLOR    = new THREE.Color('#000000')

// ---------------------------------------------------------------------------
// Light rays — thin plane shafts simulating surface light; gone by t=0.1
// ---------------------------------------------------------------------------
function LightRays({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null)
  const mat0Ref  = useRef<THREE.MeshBasicMaterial>(null)
  const mat1Ref  = useRef<THREE.MeshBasicMaterial>(null)
  const mat2Ref  = useRef<THREE.MeshBasicMaterial>(null)
  const mat3Ref  = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(() => {
    const t    = progressRef.current
    const base = Math.max(0, 1 - t / 0.1)
    if (mat0Ref.current) mat0Ref.current.opacity = 0.07 * base
    if (mat1Ref.current) mat1Ref.current.opacity = 0.06 * base
    if (mat2Ref.current) mat2Ref.current.opacity = 0.08 * base
    if (mat3Ref.current) mat3Ref.current.opacity = 0.05 * base
    if (groupRef.current) groupRef.current.visible = base > 0
  })

  return (
    <group ref={groupRef}>
      <mesh position={[-3, 5, -2]} rotation={[0, 0.3, 0]}>
        <planeGeometry args={[0.8, 40]} />
        <meshBasicMaterial ref={mat0Ref} color="#88bbee" transparent opacity={0.07}
          blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[2, 6, -4]} rotation={[0, -0.4, 0]}>
        <planeGeometry args={[1.0, 38]} />
        <meshBasicMaterial ref={mat1Ref} color="#88bbee" transparent opacity={0.06}
          blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-6, 4, -6]} rotation={[0, 0.1, 0]}>
        <planeGeometry args={[0.6, 35]} />
        <meshBasicMaterial ref={mat2Ref} color="#88bbee" transparent opacity={0.08}
          blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[5, 5, -3]} rotation={[0, -0.2, 0]}>
        <planeGeometry args={[0.7, 36]} />
        <meshBasicMaterial ref={mat3Ref} color="#99ccff" transparent opacity={0.05}
          blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Motion streaks — thin upward-rushing lines visible during the descent plunge
// They simulate particles rushing past the camera as it falls through water.
// Count, length, and opacity all scale with scroll speed; gone by mid-depth.
// ---------------------------------------------------------------------------
function MotionStreaks({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const COUNT = 60

  const streakData = useRef(
    Array.from({ length: COUNT }, () => ({
      x:      (Math.random() - 0.5) * 22,
      y:      (Math.random() - 0.5) * 26,
      z:      (Math.random() - 0.5) * 18,
      speed:  8 + Math.random() * 14,
      length: 0.22 + Math.random() * 0.55,
    })),
  )

  const geo = useMemo(() => {
    const g    = new THREE.BufferGeometry()
    const arr  = new Float32Array(COUNT * 6) // 2 verts × 3 coords per streak
    const attr = new THREE.BufferAttribute(arr, 3)
    attr.setUsage(THREE.DynamicDrawUsage)
    g.setAttribute('position', attr)
    return g
  }, [])

  const matRef = useRef<THREE.LineBasicMaterial>(null)
  const prevT  = useRef(0)

  useFrame(({ camera }, delta) => {
    const t = progressRef.current

    // Fade: visible in first half, fully gone by t = 0.5
    const fade = Math.max(0, 1 - t / 0.5)
    if (matRef.current) matRef.current.opacity = fade * 0.45

    if (fade <= 0.01) {
      geo.setDrawRange(0, 0)
      prevT.current = t
      return
    }
    geo.setDrawRange(0, COUNT * 2)

    // Per-frame progress delta → scroll speed boost
    const dT          = Math.abs(t - prevT.current)
    prevT.current     = t
    const scrollBoost = 1 + Math.min((dT / Math.max(delta, 0.001)) * 60, 8)

    const camY    = camera.position.y
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
    const arr     = posAttr.array as Float32Array

    for (let i = 0; i < COUNT; i++) {
      const s = streakData.current[i]

      // Rush upward (camera plunges down, particles appear to rush upward)
      s.y += delta * s.speed * scrollBoost

      // Reset below camera when streak passes above view
      if (s.y > camY + 13) {
        s.y = camY - 14 - Math.random() * 8
        s.x = (Math.random() - 0.5) * 22
        s.z = (Math.random() - 0.5) * 18
      }

      // Stretch length with speed — longer streaks = more motion blur feel
      const len = s.length * Math.min(1 + scrollBoost * 0.35, 2.8)

      arr[i * 6]     = s.x
      arr[i * 6 + 1] = s.y
      arr[i * 6 + 2] = s.z
      arr[i * 6 + 3] = s.x
      arr[i * 6 + 4] = s.y + len
      arr[i * 6 + 5] = s.z
    }

    posAttr.needsUpdate = true
  })

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial
        ref={matRef}
        color="#8ab8d8"
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </lineSegments>
  )
}

// ---------------------------------------------------------------------------

function AbyssSceneContent({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const { camera, scene } = useThree()
  const smoothProgress = useRef(0)
  const qStart     = useRef(new THREE.Quaternion())
  const qEnd       = useRef(new THREE.Quaternion())
  const fogRef     = useRef<THREE.FogExp2 | null>(null)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  // bgColor is mutated in-place each frame; scene.background holds the same reference
  const bgColor    = useRef(new THREE.Color('#102850'))

  useEffect(() => {
    scene.background = bgColor.current
    const fog = new THREE.FogExp2(new THREE.Color('#102850'), 0.015)
    scene.fog = fog
    fogRef.current = fog
    return () => { scene.fog = null; scene.background = null }
  }, [scene])

  useFrame((_, delta) => {
    const target = progressRef.current
    smoothProgress.current = THREE.MathUtils.damp(smoothProgress.current, target, 4, delta)
    const t = Math.max(0, Math.min(1, smoothProgress.current))

    camera.position.copy(ABYSS_CURVE.getPoint(t))

    const segment = t * (ABYSS_Q.length - 1)
    const segIdx  = Math.min(Math.floor(segment), ABYSS_Q.length - 2)
    const segT    = segment - Math.floor(segment)
    qStart.current.copy(ABYSS_Q[segIdx])
    qEnd.current.copy(ABYSS_Q[segIdx + 1])
    camera.quaternion.slerpQuaternions(qStart.current, qEnd.current, segT)

    // Dynamic background — exponential curve: ~96% black by t=0.3, pure black by t=0.45
    const darkT = 1 - Math.pow(Math.max(0, 1 - t / 0.45), 3)
    bgColor.current.lerpColors(SURFACE_COLOR, DEEP_COLOR, darkT)

    // Dynamic fog — ramp up aggressively in first 30% of scroll, then hold at max
    if (fogRef.current) {
      fogRef.current.color.lerpColors(SURFACE_COLOR, DEEP_COLOR, darkT)
      const fogT        = Math.min(1, Math.pow(t / 0.3, 0.6))
      const targetDensity = THREE.MathUtils.lerp(0.015, 0.14, fogT)
      fogRef.current.density = THREE.MathUtils.damp(fogRef.current.density, targetDensity, 2, delta)
    }

    // Dynamic ambient — quadratic drop, gone completely by t=0.25
    if (ambientRef.current) {
      ambientRef.current.intensity = 0.18 * Math.pow(Math.max(0, 1 - t / 0.25), 2)
    }
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.18} color="#8ab4d4" />

      {/* Light rays from above — surface only, fade by mid-depth */}
      <LightRays progressRef={progressRef} />

      {/* Air bubbles at the entrance — tiny rising specks, gone as you descend */}
      <Bubbles progressRef={progressRef} />

      {/* Speed lines — thin streaks rushing upward during the plunge */}
      <MotionStreaks progressRef={progressRef} />

      {/* Tier 1 — Twilight Zone lights */}
      <pointLight position={[-3, -10,  -2]} intensity={3.5} color="#00c8b4" distance={20} decay={2}   />
      <pointLight position={[ 3, -15,  -6]} intensity={2.5} color="#008870" distance={15} decay={2}   />
      <pointLight position={[ 0, -20, -10]} intensity={3.0} color="#00a090" distance={18} decay={2}   />

      {/* Tier 2 — Midnight Zone lights */}
      <pointLight position={[ 5, -28,  -8]} intensity={5.5} color="#00c8b4" distance={30} decay={1.8} />
      <pointLight position={[-3, -38, -13]} intensity={4.5} color="#00b4a0" distance={24} decay={2}   />
      <pointLight position={[ 4, -44, -17]} intensity={4.5} color="#00c8b4" distance={26} decay={1.8} />

      {/* Tier 3 — The Abyss lights — eerie bioluminescence */}
      <pointLight position={[-4, -52, -10]} intensity={7.0} color="#00d0c0" distance={34} decay={1.5} />
      <pointLight position={[ 3, -60, -15]} intensity={6.0} color="#009080" distance={28} decay={1.8} />
      <pointLight position={[ 0, -68, -19]} intensity={8.0} color="#00c8b4" distance={38} decay={1.5} />

      {/* Deep void — faint ancient glow far below, barely visible through the abyss */}
      <mesh position={[15, -82, -32]}>
        <sphereGeometry args={[10, 8, 6]} />
        <meshBasicMaterial color="#006688" transparent opacity={0.18}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[-12, -86, -28]}>
        <sphereGeometry args={[7, 8, 6]} />
        <meshBasicMaterial color="#004422" transparent opacity={0.14}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Tier 1 particles — sparse, dim */}
      <BioluminescentParticles
        count={150}
        spread={[24, 18, 20]}
        position={[0, -10, -4]}
        intensity={0.9}
      />

      {/* Tier 2 particles — denser */}
      <BioluminescentParticles
        count={175}
        spread={[28, 20, 24]}
        position={[0, -36, -13]}
        intensity={0.85}
      />

      {/* Tier 3 particles — fade out in deepest 20% with rare flickers */}
      <BioluminescentParticles
        count={175}
        spread={[30, 22, 24]}
        position={[0, -62, -17]}
        intensity={1.2}
        progressRef={progressRef}
        depthFadeStart={0.8}
      />

      {/* ── Workflow organisms — n8n graphs rendered as bioluminescent networks */}
      {WORKFLOW_GRAPHS.map((graph, i) => (
        <WorkflowOrganism
          key={graph.name}
          graph={graph}
          position={WORKFLOW_PLACEMENTS[i].position}
          scale={WORKFLOW_PLACEMENTS[i].scale}
        />
      ))}

      <EffectComposer>
        <Bloom luminanceThreshold={0.12} luminanceSmoothing={0.85} intensity={2.0} mipmapBlur />
      </EffectComposer>
    </>
  )
}

export default function AbyssScene({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  return (
    <Canvas
      camera={{ position: [0, 2, 10], fov: 50, near: 0.1, far: 280 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      }}
      style={{ background: '#102850' }}
    >
      <Suspense fallback={null}>
        <AbyssSceneContent progressRef={progressRef} />
      </Suspense>
    </Canvas>
  )
}
