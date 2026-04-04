'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { CloudPlatform } from './CloudPlatform'
import { ProjectCard } from './ProjectCard'

// Compute a lookAt quaternion at module init time (no runtime cost)
function lookAtQuat(
  from: [number, number, number],
  to: [number, number, number],
): THREE.Quaternion {
  const m = new THREE.Matrix4().lookAt(
    new THREE.Vector3(from[0], from[1], from[2]),
    new THREE.Vector3(to[0], to[1], to[2]),
    new THREE.Vector3(0, 1, 0),
  )
  return new THREE.Quaternion().setFromRotationMatrix(m)
}

// 7 control points that push deep into Z while weaving left↔right and rising in Y
// Z travels from +6 (near) to -25 (deep) — 31 units of forward depth
const CURVE_POINTS = [
  new THREE.Vector3(0, -8, 6),        // entry: below all tiers, near
  new THREE.Vector3(-2, -1, 0),       // tier-1 left approach
  new THREE.Vector3(4, 4, -6),        // swing right, tier-1 right area
  new THREE.Vector3(-1, 8, -12),      // push deep left, rising
  new THREE.Vector3(3.5, 11, -17),    // zoom deep right into tier-2
  new THREE.Vector3(-1.5, 14, -21),   // sweep left + push deeper, tier-3 approach
  new THREE.Vector3(0.5, 19, -25),    // final deep push toward apex
]

// Per-keyframe rotations: each looks toward the nearest island at that stage
const Q_KEYFRAMES = [
  lookAtQuat([0, -8, 6],        [-3.5, -1, -4]),      // look toward tier-1 left island
  lookAtQuat([-2, -1, 0],       [5, 1.5, -8]),        // look right at CYS island (far right)
  lookAtQuat([4, 4, -6],        [0, 3.5, -13]),       // look forward-left at AI Website (deep)
  lookAtQuat([-1, 8, -12],      [-6, 7.5, -16]),      // look left at RyderDigital (far left)
  lookAtQuat([3.5, 11, -17],    [0, 11.5, -22]),      // look forward at Baseaim.co (very deep)
  lookAtQuat([-1.5, 14, -21],   [-5.5, 14.5, -24]),   // look at Airtable Clone (far left deep)
  lookAtQuat([0.5, 19, -25],    [0, 19, -29]),        // settle on tier-3 apex
]

function SceneContent({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const { camera, scene } = useThree()
  const smoothProgress = useRef(0)
  const curve = useMemo(() => new THREE.CatmullRomCurve3(CURVE_POINTS), [])
  const qStart = useRef(new THREE.Quaternion())
  const qEnd = useRef(new THREE.Quaternion())

  useEffect(() => {
    const fog = new THREE.FogExp2(new THREE.Color('#1e1004'), 0.018)
    scene.fog = fog
    return () => { scene.fog = null }
  }, [scene])

  useFrame((_, delta) => {
    const target = progressRef.current
    smoothProgress.current = THREE.MathUtils.damp(smoothProgress.current, target, 4, delta)
    const t = Math.max(0, Math.min(1, smoothProgress.current))

    // Drive camera position along CatmullRom curve
    const pos = curve.getPoint(t)
    camera.position.copy(pos)

    // Smooth rotation via Quaternion.slerp between lookAt keyframes
    const segment = t * (Q_KEYFRAMES.length - 1)
    const segIdx = Math.min(Math.floor(segment), Q_KEYFRAMES.length - 2)
    const segT = segment - Math.floor(segment)
    qStart.current.copy(Q_KEYFRAMES[segIdx])
    qEnd.current.copy(Q_KEYFRAMES[segIdx + 1])
    camera.quaternion.slerpQuaternions(qStart.current, qEnd.current, segT)
  })

  return (
    <>
      <ambientLight intensity={0.25} color="#daa520" />
      {/* Lights spread across the full Z depth of the scene */}
      <pointLight position={[0, 22, -2]}  intensity={5}   color="#f5e080" distance={55} decay={1.5} />
      <pointLight position={[-5, 5, -6]}  intensity={2.5} color="#daa520" distance={32} decay={2} />
      <pointLight position={[6, 4, -10]}  intensity={1.8} color="#c8921a" distance={26} decay={2} />
      <pointLight position={[-3, 13, -18]} intensity={2.5} color="#f0d060" distance={38} decay={1.8} />
      <pointLight position={[3, 18, -26]} intensity={3}   color="#f5e080" distance={32} decay={1.8} />

      {/* Sparkles recentered to cover the full depth of the scene */}
      <group position={[0, 5, -12]}>
        <Sparkles count={300} scale={[50, 50, 50]} size={2.5} speed={0.18} opacity={0.55} color="#f5e080" />
        <Sparkles count={150} scale={[35, 35, 40]} size={5}   speed={0.08} opacity={0.35} color="#daa520" />
        <Sparkles count={80}  scale={[22, 22, 30]} size={8}   speed={0.04} opacity={0.25} color="#ffffff" />
      </group>

      {/* Tier 1 — scattered across Z=-4 to Z=-13, with wide X spread */}
      <CloudPlatform position={[-3.5, -1, -4]}  scale={[4.5, 0.9, 3.5]} />
      <CloudPlatform position={[5, 1.5, -8]}    scale={[3.5, 0.7, 2.8]} />
      <CloudPlatform position={[0, 3.5, -13]}   scale={[5.5, 0.8, 4.2]} />
      <ProjectCard position={[-3.5, 0.8, -4]}   title="Spline Experiments" tier={1} />
      <ProjectCard position={[5, 3.2, -8]}       title="CYS Accountants"   tier={1} />
      <ProjectCard position={[0, 5.3, -13]}      title="AI Website"        tier={1} />

      {/* Tier 2 — deep and wide: Z=-16 to Z=-22, X pushed far out */}
      <CloudPlatform position={[-6, 7.5, -16]}  scale={[6.5, 1.3, 5.5]} emissive />
      <CloudPlatform position={[4.5, 9.5, -19]} scale={[5.5, 1.1, 4.5]} emissive />
      <CloudPlatform position={[0, 11.5, -22]}  scale={[8, 1.4, 6]}     emissive />
      <ProjectCard position={[-6, 9.3, -16]}    title="RyderDigital"        tier={2} />
      <ProjectCard position={[4.5, 11.3, -19]}  title="MVPcommunity"        tier={2} />
      <ProjectCard position={[0, 13.4, -22]}    title="Baseaim.co Website"  tier={2} />

      {/* Tier 3 — very far: Z=-24 to Z=-29, imposing and distant */}
      <CloudPlatform position={[-5.5, 14.5, -24]} scale={[9, 2, 7.5]}   emissive bright />
      <CloudPlatform position={[5.5, 16.5, -27]}  scale={[8, 1.8, 6.5]} emissive bright />
      <CloudPlatform position={[0, 19, -29]}       scale={[13, 2.5, 10]} emissive bright />
      <ProjectCard position={[-5.5, 17, -24]}      title="Airtable Clone"          tier={3} />
      <ProjectCard position={[5.5, 18.8, -27]}     title="Baseaim Client Dashboard" tier={3} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.28} luminanceSmoothing={0.85} intensity={1.4} mipmapBlur />
      </EffectComposer>
    </>
  )
}

// Self-contained Canvas — dynamically imported (ssr: false) from CelestialRealm
export default function CelestialScene({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  return (
    <Canvas
      camera={{ position: [0, -8, 6], fov: 60, near: 0.1, far: 130 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      style={{ background: '#0d0702' }}
    >
      <Suspense fallback={null}>
        <SceneContent progressRef={progressRef} />
      </Suspense>
    </Canvas>
  )
}
