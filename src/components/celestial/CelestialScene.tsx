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

// 20 control points: entry, zigzag with varied transitions, finale.
// Islands span deep Z (T1: -5→-25, T2: -32→-55, T3: -60→-75) for massive scale.
// Transition patterns — no two consecutive the same:
//   DIVE:      fly past current island, push deeper in Z without pulling back
//   SWEEP:     prominent lateral X-arc while advancing Z moderately
//   PULL-BACK: retract in Z for dramatic tier reveal (T1→T2 and T2→T3)
// Sequence: dive, sweep, pull-back, sweep, dive, pull-back, dive
const CURVE_POINTS = [
  new THREE.Vector3(0, -14, 11),       //  1: entry — wide, far below
  new THREE.Vector3(-3, -2, 3),        //  2: approach Spline from above-right
  new THREE.Vector3(-5, 1.5, -2),      //  3: CLOSE – Spline Experiments
  new THREE.Vector3(2, 4.5, -8),       //  4: DIVE → CYS: swing right, push deeper
  new THREE.Vector3(5, 6.5, -12),      //  5: CLOSE – CYS Accountants
  new THREE.Vector3(-3, 9, -16),       //  6: SWEEP → AIWeb: arc left, moderate Z advance
  new THREE.Vector3(0, 13.5, -22),     //  7: CLOSE – AI Website
  new THREE.Vector3(3, 22, -8),        //  8: PULL-BACK (T1→T2): rise high, big Z retract
  new THREE.Vector3(-5, 28, -26),      //  9: approach Ryder: sweep left, push forward
  new THREE.Vector3(-7, 33, -29),      // 10: CLOSE – RyderDigital
  new THREE.Vector3(2, 37, -36),       // 11: SWEEP → MVP: swing right, moderate Z advance
  new THREE.Vector3(6, 41, -42),       // 12: CLOSE – MVPcommunity
  new THREE.Vector3(1, 45, -47),       // 13: DIVE → Baseaim: push deeper, drift center
  new THREE.Vector3(0, 48, -52),       // 14: CLOSE – Baseaim.co Website
  new THREE.Vector3(4, 56, -38),       // 15: PULL-BACK (T2→T3): rise, big Z retract
  new THREE.Vector3(-4, 61, -50),      // 16: approach Airtable: sweep left, dive forward
  new THREE.Vector3(-7, 65.5, -57),    // 17: CLOSE – Airtable Clone
  new THREE.Vector3(3, 70, -62),       // 18: DIVE → Dashboard: swing right, push deeper
  new THREE.Vector3(6, 74.5, -67),     // 19: CLOSE – Baseaim Client Dashboard
  new THREE.Vector3(0, 82, -72),       // 20: finale — gaze toward Apex
]

// Island card centers (lookAt targets for close-up keyframes):
// Spline[-5,0.8,-5], CYS[5,5.8,-15], AIWeb[0,12.8,-25],
// Ryder[-7,32,-32], MVP[6,40,-45], Baseaim[0,47,-55],
// Airtable[-7,64.5,-60], Dashboard[6,73.5,-70], Apex[0,78,-75]
const Q_KEYFRAMES = [
  lookAtQuat([0, -14, 11],     [-5, 0, -5]),           //  1: look toward Spline
  lookAtQuat([-3, -2, 3],      [-5, 0.8, -5]),         //  2: look at Spline card
  lookAtQuat([-5, 1.5, -2],    [-5, 0.8, -5]),         //  3: CLOSE – Spline (centered on card)
  lookAtQuat([2, 4.5, -8],     [5, 5.8, -15]),         //  4: look at CYS
  lookAtQuat([5, 6.5, -12],    [5, 5.8, -15]),         //  5: CLOSE – CYS
  lookAtQuat([-3, 9, -16],     [0, 12.8, -25]),        //  6: look toward AIWeb
  lookAtQuat([0, 13.5, -22],   [0, 12.8, -25]),        //  7: CLOSE – AIWeb
  lookAtQuat([3, 22, -8],      [-7, 32, -32]),         //  8: pull-back — look deep at Ryder
  lookAtQuat([-5, 28, -26],    [-7, 32, -32]),         //  9: look at Ryder
  lookAtQuat([-7, 33, -29],    [-7, 32, -32]),         // 10: CLOSE – Ryder
  lookAtQuat([2, 37, -36],     [6, 40, -45]),          // 11: look at MVP
  lookAtQuat([6, 41, -42],     [6, 40, -45]),          // 12: CLOSE – MVP
  lookAtQuat([1, 45, -47],     [0, 47, -55]),          // 13: look at Baseaim
  lookAtQuat([0, 48, -52],     [0, 47, -55]),          // 14: CLOSE – Baseaim
  lookAtQuat([4, 56, -38],     [-7, 64.5, -60]),       // 15: pull-back — look deep at Airtable
  lookAtQuat([-4, 61, -50],    [-7, 64.5, -60]),       // 16: look at Airtable
  lookAtQuat([-7, 65.5, -57],  [-7, 64.5, -60]),       // 17: CLOSE – Airtable
  lookAtQuat([3, 70, -62],     [6, 73.5, -70]),        // 18: look at Dashboard
  lookAtQuat([6, 74.5, -67],   [6, 73.5, -70]),        // 19: CLOSE – Dashboard
  lookAtQuat([0, 82, -72],     [0, 78, -75]),          // 20: finale – Apex
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
      {/* Tier 1 lights — near each island */}
      <pointLight position={[-3, 2, -5]}    intensity={8}  color="#f5e080" distance={35} decay={1.5} />
      <pointLight position={[3, 8, -15]}    intensity={3}  color="#daa520" distance={22} decay={2} />
      <pointLight position={[0, 14, -25]}   intensity={4}  color="#f0d060" distance={28} decay={2} />
      {/* Tier 2 lights */}
      <pointLight position={[-4, 33, -32]}  intensity={10} color="#f5e080" distance={42} decay={1.5} />
      <pointLight position={[4, 43, -50]}   intensity={5}  color="#f0d060" distance={32} decay={2} />
      {/* Tier 3 lights */}
      <pointLight position={[-4, 65, -60]}  intensity={14} color="#f5e080" distance={50} decay={1.5} />
      <pointLight position={[5, 74, -70]}   intensity={6}  color="#daa520" distance={35} decay={2} />
      <pointLight position={[0, 79, -75]}   intensity={9}  color="#f0d060" distance={35} decay={2} />

      {/* Sparkles centred at each tier's Z midpoint to cover full depth range */}
      <group position={[0, 5, -15]}>
        <Sparkles count={150} scale={[35, 35, 28]} size={2.5} speed={0.18} opacity={0.55} color="#f5e080" />
        <Sparkles count={80}  scale={[25, 25, 22]} size={5}   speed={0.08} opacity={0.35} color="#daa520" />
      </group>
      <group position={[0, 38, -43]}>
        <Sparkles count={150} scale={[35, 35, 30]} size={2.5} speed={0.18} opacity={0.55} color="#f5e080" />
        <Sparkles count={80}  scale={[25, 25, 25]} size={5}   speed={0.08} opacity={0.35} color="#daa520" />
      </group>
      <group position={[0, 68, -67]}>
        <Sparkles count={150} scale={[35, 35, 25]} size={2.5} speed={0.18} opacity={0.55} color="#f5e080" />
        <Sparkles count={80}  scale={[25, 25, 20]} size={5}   speed={0.08} opacity={0.35} color="#daa520" />
        <Sparkles count={50}  scale={[18, 18, 15]} size={8}   speed={0.04} opacity={0.28} color="#ffffff" />
      </group>

      {/* Tier 1 — Y ≈ 0–15, Z scattered from -5 to -25 */}
      <CloudPlatform position={[-5, -1, -5]}   scale={[4.5, 0.9, 3.5]} />
      <CloudPlatform position={[5, 4, -15]}    scale={[3.5, 0.7, 2.8]} />
      <CloudPlatform position={[0, 11, -25]}   scale={[5.5, 0.8, 4.2]} />
      <ProjectCard position={[-5, 0.8, -5]}    title="Spline Experiments" tier={1} />
      <ProjectCard position={[5, 5.8, -15]}    title="CYS Accountants"   tier={1} />
      <ProjectCard position={[0, 12.8, -25]}   title="AI Website"        tier={1} />

      {/* Tier 2 — Y ≈ 30–47, Z scattered from -32 to -55 */}
      <CloudPlatform position={[-7, 30, -32]}  scale={[6.5, 1.3, 5.5]} emissive />
      <CloudPlatform position={[6, 38, -45]}   scale={[5.5, 1.1, 4.5]} emissive />
      <CloudPlatform position={[0, 45, -55]}   scale={[8, 1.4, 6]}     emissive />
      <ProjectCard position={[-7, 32, -32]}    title="RyderDigital"       tier={2} />
      <ProjectCard position={[6, 40, -45]}     title="MVPcommunity"       tier={2} />
      <ProjectCard position={[0, 47, -55]}     title="Baseaim.co Website" tier={2} />

      {/* Tier 3 — Y ≈ 62–80, Z scattered from -60 to -75 */}
      <CloudPlatform position={[-7, 62, -60]}  scale={[9, 2, 7.5]}   emissive bright />
      <CloudPlatform position={[6, 71, -70]}   scale={[8, 1.8, 6.5]} emissive bright />
      <CloudPlatform position={[0, 78, -75]}   scale={[13, 2.5, 10]} emissive bright />
      <ProjectCard position={[-7, 64.5, -60]}  title="Airtable Clone"           tier={3} />
      <ProjectCard position={[6, 73.5, -70]}   title="Baseaim Client Dashboard" tier={3} />

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
