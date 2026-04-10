'use client'

import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { BioluminescentParticles } from './BioluminescentParticles'

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

  // Surface — camera enters from above, peering into the dark
  push(new THREE.Vector3(  0,  6,  12), new THREE.Vector3( 0,  -2,   2))
  push(new THREE.Vector3(  0,  2,   6), new THREE.Vector3( 0,  -6,  -2))

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

// ---------------------------------------------------------------------------

function AbyssSceneContent({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const { camera, scene } = useThree()
  const smoothProgress = useRef(0)
  const qStart = useRef(new THREE.Quaternion())
  const qEnd   = useRef(new THREE.Quaternion())
  const fogRef = useRef<THREE.FogExp2 | null>(null)

  useEffect(() => {
    const bg = new THREE.Color('#0a1628')
    scene.background = bg
    const fog = new THREE.FogExp2(new THREE.Color('#050d1a'), 0.022)
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

    // Fog thickens as camera descends deeper
    if (fogRef.current) {
      const targetDensity = THREE.MathUtils.lerp(0.018, 0.038, t)
      fogRef.current.density = THREE.MathUtils.damp(fogRef.current.density, targetDensity, 2, delta)
    }
  })

  return (
    <>
      <ambientLight intensity={0.04} color="#002233" />

      {/* Tier 1 — Twilight Zone lights */}
      <pointLight position={[-3, -10,  -2]} intensity={3.5} color="#00c8b4" distance={20} decay={2}   />
      <pointLight position={[ 3, -15,  -6]} intensity={2.5} color="#008870" distance={15} decay={2}   />
      <pointLight position={[ 0, -20, -10]} intensity={3.0} color="#00a090" distance={18} decay={2}   />

      {/* Tier 2 — Midnight Zone lights */}
      <pointLight position={[ 5, -28,  -8]} intensity={5.5} color="#00c8b4" distance={30} decay={1.8} />
      <pointLight position={[-3, -38, -13]} intensity={4.5} color="#00b4a0" distance={24} decay={2}   />
      <pointLight position={[ 4, -44, -17]} intensity={4.5} color="#00c8b4" distance={26} decay={1.8} />

      {/* Tier 3 — The Abyss lights — eerie, brighter bioluminescence */}
      <pointLight position={[-4, -52, -10]} intensity={7.0} color="#00d0c0" distance={34} decay={1.5} />
      <pointLight position={[ 3, -60, -15]} intensity={6.0} color="#009080" distance={28} decay={1.8} />
      <pointLight position={[ 0, -68, -19]} intensity={8.0} color="#00c8b4" distance={38} decay={1.5} />

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

      {/* Tier 3 particles — densest, most vivid */}
      <BioluminescentParticles
        count={175}
        spread={[30, 22, 24]}
        position={[0, -62, -17]}
        intensity={1.2}
      />

      <EffectComposer>
        <Bloom luminanceThreshold={0.12} luminanceSmoothing={0.85} intensity={2.0} mipmapBlur />
      </EffectComposer>
    </>
  )
}

export default function AbyssScene({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  return (
    <Canvas
      camera={{ position: [0, 6, 12], fov: 50, near: 0.1, far: 280 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      }}
      style={{ background: '#0a1628' }}
    >
      <Suspense fallback={null}>
        <AbyssSceneContent progressRef={progressRef} />
      </Suspense>
    </Canvas>
  )
}
