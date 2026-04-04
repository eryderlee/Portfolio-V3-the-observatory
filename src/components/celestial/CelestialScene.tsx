'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { CloudPlatform } from './CloudPlatform'
import { ProjectCard } from './ProjectCard'

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

// 20 control points: zigzag that swoops close to each project then pulls back.
// Islands are now scattered across deep Z (T1: -3→-12, T2: -14→-22, T3: -20→-28).
// Camera pushes steadily forward in Z with each tier; the T1→T2 transition is a
// forward dive (no pull-back), T2→T3 uses a dramatic retract then re-approach.
const CURVE_POINTS = [
  new THREE.Vector3(0, -14, 11),      //  1: wide entry, near
  new THREE.Vector3(-5, -2, 4),       //  2: approach tier1-left
  new THREE.Vector3(-4, 0.8, -1),     //  3: CLOSE – Spline Experiments
  new THREE.Vector3(5.5, 3, 2),       //  4: swing right, pull back slightly
  new THREE.Vector3(5, 6.5, -5),      //  5: CLOSE – CYS Accountants
  new THREE.Vector3(-1, 10, -3),      //  6: swing left
  new THREE.Vector3(0.5, 13.5, -10),  //  7: CLOSE – AI Website (pushes deep)
  new THREE.Vector3(-2, 20, -14),     //  8: rise + push even deeper – no Z retract!
  new THREE.Vector3(-6, 29, -12),     //  9: T2-left approach, slight Z ease-back
  new THREE.Vector3(-6, 33, -12),     // 10: CLOSE – RyderDigital
  new THREE.Vector3(6, 37, -12),      // 11: swing right (same Z)
  new THREE.Vector3(6, 41, -16),      // 12: CLOSE – MVPcommunity (deeper)
  new THREE.Vector3(-1, 44, -15),     // 13: swing left
  new THREE.Vector3(0.5, 47.5, -20),  // 14: CLOSE – Baseaim.co Website (very deep)
  new THREE.Vector3(2, 56, -5),       // 15: big pull-back between tiers (dramatic reveal)
  new THREE.Vector3(-7, 60, -10),     // 16: approach tier3-left
  new THREE.Vector3(-6, 65, -18),     // 17: CLOSE – Airtable Clone
  new THREE.Vector3(6.5, 70, -15),    // 18: swing right, slight Z ease-back
  new THREE.Vector3(5.5, 74, -24),    // 19: CLOSE – Baseaim Client Dashboard
  new THREE.Vector3(0, 82, -25),      // 20: finale – gaze upon tier3 apex
]

// Each keyframe looks toward the nearest island; close-ups look directly at it.
// Island centers (midpoint of platform and card): Spline[-4,0,-3], CYS[5,5.4,-7],
// AIWeb[0,12.9,-12], Ryder[-7,32,-14], MVP[6,40,-18], Baseaim[0,47,-22],
// AirtableClone[-7,64.25,-20], Dashboard[6,73.25,-26], Apex[0,80,-28].
const Q_KEYFRAMES = [
  lookAtQuat([0, -14, 11],      [-4, 0, -3]),          //  1: look toward Spline
  lookAtQuat([-5, -2, 4],       [-4, 0, -3]),          //  2: look at Spline
  lookAtQuat([-4, 0.8, -1],     [-4, 0, -3]),          //  3: CLOSE – Spline
  lookAtQuat([5.5, 3, 2],       [5, 5.4, -7]),         //  4: look at CYS
  lookAtQuat([5, 6.5, -5],      [5, 5.4, -7]),         //  5: CLOSE – CYS
  lookAtQuat([-1, 10, -3],      [0, 12.9, -12]),       //  6: look forward-deep at AI Website
  lookAtQuat([0.5, 13.5, -10],  [0, 12.9, -12]),       //  7: CLOSE – AI Website
  lookAtQuat([-2, 20, -14],     [-7, 32, -14]),        //  8: look ahead-left: RyderDigital
  lookAtQuat([-6, 29, -12],     [-7, 32, -14]),        //  9: look at RyderDigital
  lookAtQuat([-6, 33, -12],     [-7, 32, -14]),        // 10: CLOSE – RyderDigital
  lookAtQuat([6, 37, -12],      [6, 40, -18]),         // 11: look forward at MVPcommunity
  lookAtQuat([6, 41, -16],      [6, 40, -18]),         // 12: CLOSE – MVPcommunity
  lookAtQuat([-1, 44, -15],     [0, 47, -22]),         // 13: look forward-deep at Baseaim.co
  lookAtQuat([0.5, 47.5, -20],  [0, 47, -22]),         // 14: CLOSE – Baseaim.co Website
  lookAtQuat([2, 56, -5],       [-7, 64.25, -20]),     // 15: dramatic reveal – T3 emerges from depth
  lookAtQuat([-7, 60, -10],     [-7, 64.25, -20]),     // 16: look at Airtable Clone
  lookAtQuat([-6, 65, -18],     [-7, 64.25, -20]),     // 17: CLOSE – Airtable Clone
  lookAtQuat([6.5, 70, -15],    [6, 73.25, -26]),      // 18: look at Client Dashboard
  lookAtQuat([5.5, 74, -24],    [6, 73.25, -26]),      // 19: CLOSE – Baseaim Dashboard
  lookAtQuat([0, 82, -25],      [0, 80, -28]),         // 20: finale – apex platform
]

function SceneContent({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const { camera, scene } = useThree()
  const smoothProgress = useRef(0)
  const curve = useMemo(() => new THREE.CatmullRomCurve3(CURVE_POINTS), [])
  const qStart = useRef(new THREE.Quaternion())
  const qEnd = useRef(new THREE.Quaternion())

  useEffect(() => {
    const fog = new THREE.FogExp2(new THREE.Color('#1e1004'), 0.016)
    scene.fog = fog
    return () => { scene.fog = null }
  }, [scene])

  useFrame((_, delta) => {
    const target = progressRef.current
    smoothProgress.current = THREE.MathUtils.damp(smoothProgress.current, target, 4, delta)
    const t = Math.max(0, Math.min(1, smoothProgress.current))

    const pos = curve.getPoint(t)
    camera.position.copy(pos)

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
      {/* Tier 1 lights — placed at island Z depths */}
      <pointLight position={[0, 2, -1]}    intensity={8}  color="#f5e080" distance={30} decay={1.5} />
      <pointLight position={[-3, 6, -5]}   intensity={3}  color="#daa520" distance={18} decay={2} />
      <pointLight position={[0, 13, -10]}  intensity={3}  color="#f0d060" distance={20} decay={2} />
      {/* Tier 2 lights */}
      <pointLight position={[0, 38, -15]}  intensity={10} color="#f5e080" distance={38} decay={1.5} />
      <pointLight position={[3, 43, -19]}  intensity={4}  color="#f0d060" distance={25} decay={2} />
      {/* Tier 3 lights */}
      <pointLight position={[0, 65, -18]}  intensity={14} color="#f5e080" distance={45} decay={1.5} />
      <pointLight position={[-3, 71, -23]} intensity={5}  color="#daa520" distance={28} decay={2} />
      <pointLight position={[3, 80, -25]}  intensity={8}  color="#f0d060" distance={30} decay={2} />

      {/* Sparkles centred at each tier's Z midpoint so they cover the full depth */}
      <group position={[0, 5, -6]}>
        <Sparkles count={150} scale={[30, 30, 20]} size={2.5} speed={0.18} opacity={0.55} color="#f5e080" />
        <Sparkles count={80}  scale={[22, 22, 16]} size={5}   speed={0.08} opacity={0.35} color="#daa520" />
      </group>
      <group position={[0, 38, -17]}>
        <Sparkles count={150} scale={[30, 30, 20]} size={2.5} speed={0.18} opacity={0.55} color="#f5e080" />
        <Sparkles count={80}  scale={[22, 22, 16]} size={5}   speed={0.08} opacity={0.35} color="#daa520" />
      </group>
      <group position={[0, 68, -22]}>
        <Sparkles count={150} scale={[30, 30, 20]} size={2.5} speed={0.18} opacity={0.55} color="#f5e080" />
        <Sparkles count={80}  scale={[22, 22, 16]} size={5}   speed={0.08} opacity={0.35} color="#daa520" />
        <Sparkles count={50}  scale={[16, 16, 12]} size={8}   speed={0.04} opacity={0.28} color="#ffffff" />
      </group>

      {/* Tier 1 — Y ≈ 0–15, Z scattered from -3 to -12 */}
      <CloudPlatform position={[-4, -1, -3]}   scale={[4.5, 0.9, 3.5]} />
      <CloudPlatform position={[5, 4, -7]}     scale={[3.5, 0.7, 2.8]} />
      <CloudPlatform position={[0, 11, -12]}   scale={[5.5, 0.8, 4.2]} />
      <ProjectCard position={[-4, 0.8, -3]}    title="Spline Experiments" tier={1} />
      <ProjectCard position={[5, 5.8, -7]}     title="CYS Accountants"   tier={1} />
      <ProjectCard position={[0, 12.8, -12]}   title="AI Website"        tier={1} />

      {/* Tier 2 — Y ≈ 30–47, Z scattered from -14 to -22 (deep, wide X spread) */}
      <CloudPlatform position={[-7, 30, -14]}  scale={[6.5, 1.3, 5.5]} emissive />
      <CloudPlatform position={[6, 38, -18]}   scale={[5.5, 1.1, 4.5]} emissive />
      <CloudPlatform position={[0, 45, -22]}   scale={[8, 1.4, 6]}     emissive />
      <ProjectCard position={[-7, 32, -14]}    title="RyderDigital"       tier={2} />
      <ProjectCard position={[6, 40, -18]}     title="MVPcommunity"       tier={2} />
      <ProjectCard position={[0, 47, -22]}     title="Baseaim.co Website" tier={2} />

      {/* Tier 3 — Y ≈ 62–80, Z scattered from -20 to -28 (very far, imposing) */}
      <CloudPlatform position={[-7, 62, -20]}  scale={[9, 2, 7.5]}   emissive bright />
      <CloudPlatform position={[6, 71, -26]}   scale={[8, 1.8, 6.5]} emissive bright />
      <CloudPlatform position={[0, 80, -28]}   scale={[13, 2.5, 10]} emissive bright />
      <ProjectCard position={[-7, 64.5, -20]}  title="Airtable Clone"           tier={3} />
      <ProjectCard position={[6, 73.5, -26]}   title="Baseaim Client Dashboard" tier={3} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.28} luminanceSmoothing={0.85} intensity={1.4} mipmapBlur />
      </EffectComposer>
    </>
  )
}

export default function CelestialScene({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  return (
    <Canvas
      camera={{ position: [0, -14, 11], fov: 55, near: 0.1, far: 200 }}
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
