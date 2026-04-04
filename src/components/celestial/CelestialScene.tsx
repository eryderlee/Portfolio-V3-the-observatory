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

// 20 control points: zigzag that swoops close to each project then pulls back
// Layout: Tier1 Y≈0-15, Tier2 Y≈30-47, Tier3 Y≈62-80
const CURVE_POINTS = [
  new THREE.Vector3(0, -14, 11),       //  1: wide entry below all tiers
  new THREE.Vector3(-5, -2, 3.5),      //  2: approach tier1-left
  new THREE.Vector3(-4, 1.5, 1.5),     //  3: CLOSE – Spline Experiments
  new THREE.Vector3(5.5, 3, 5),        //  4: swing right + pull back
  new THREE.Vector3(4, 6.5, 1.5),      //  5: CLOSE – CYS Accountants
  new THREE.Vector3(-1, 10, 5.5),      //  6: pull left + back
  new THREE.Vector3(0.5, 13.5, 1.5),   //  7: CLOSE – AI Website
  new THREE.Vector3(2, 21, 9),         //  8: big pull back between tiers
  new THREE.Vector3(-5.5, 29, 4),      //  9: drop into tier2-left approach
  new THREE.Vector3(-4.5, 32.5, 1.5),  // 10: CLOSE – RyderDigital
  new THREE.Vector3(6, 37, 5),         // 11: swing right
  new THREE.Vector3(5, 40.5, 1.5),     // 12: CLOSE – MVPcommunity
  new THREE.Vector3(-1, 44, 5.5),      // 13: pull left
  new THREE.Vector3(0.5, 47.5, 1.5),   // 14: CLOSE – Baseaim.co Website
  new THREE.Vector3(2, 55, 10),        // 15: big pull back between tiers
  new THREE.Vector3(-6.5, 61, 4.5),    // 16: approach tier3-left
  new THREE.Vector3(-5.5, 65, 1.5),    // 17: CLOSE – Airtable Clone
  new THREE.Vector3(6, 70, 5.5),       // 18: swing right
  new THREE.Vector3(5, 74, 1.5),       // 19: CLOSE – Baseaim Client Dashboard
  new THREE.Vector3(0, 82, 7),         // 20: finale, look upon tier3 apex
]

// Per-keyframe rotations — close-up frames look directly at their project
const Q_KEYFRAMES = [
  lookAtQuat([0, -14, 11],      [0, 2, -2]),           //  1: look up toward first tier
  lookAtQuat([-5, -2, 3.5],     [-4, 0.8, -3]),        //  2: look at tier1-left
  lookAtQuat([-4, 1.5, 1.5],    [-4, 0.8, -3]),        //  3: CLOSE – Spline Experiments
  lookAtQuat([5.5, 3, 5],       [4, 6, -4]),           //  4: look at tier1-right
  lookAtQuat([4, 6.5, 1.5],     [4, 6, -4]),           //  5: CLOSE – CYS Accountants
  lookAtQuat([-1, 10, 5.5],     [0.5, 12.8, -3]),      //  6: look at tier1-center
  lookAtQuat([0.5, 13.5, 1.5],  [0, 12.8, -3]),        //  7: CLOSE – AI Website
  lookAtQuat([2, 21, 9],        [0, 11, -3]),          //  8: look back at tier1 center
  lookAtQuat([-5.5, 29, 4],     [-5, 32, -3.5]),       //  9: look at tier2-left
  lookAtQuat([-4.5, 32.5, 1.5], [-5, 32, -3.5]),       // 10: CLOSE – RyderDigital
  lookAtQuat([6, 37, 5],        [5, 40, -5]),          // 11: look at tier2-right
  lookAtQuat([5, 40.5, 1.5],    [5, 40, -5]),          // 12: CLOSE – MVPcommunity
  lookAtQuat([-1, 44, 5.5],     [0, 47, -4]),          // 13: look at tier2-center
  lookAtQuat([0.5, 47.5, 1.5],  [0, 47, -4]),          // 14: CLOSE – Baseaim.co Website
  lookAtQuat([2, 55, 10],       [0, 45, -4]),          // 15: look back at tier2
  lookAtQuat([-6.5, 61, 4.5],   [-6, 64.5, -4.5]),     // 16: look at tier3-left
  lookAtQuat([-5.5, 65, 1.5],   [-6, 64.5, -4.5]),     // 17: CLOSE – Airtable Clone
  lookAtQuat([6, 70, 5.5],      [5, 73.5, -6]),        // 18: look at tier3-right
  lookAtQuat([5, 74, 1.5],      [5, 73.5, -6]),        // 19: CLOSE – Baseaim Dashboard
  lookAtQuat([0, 82, 7],        [0, 80, -5.5]),        // 20: finale – apex platform
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
      {/* Tier 1 lights (Y ≈ 0–15) */}
      <pointLight position={[0, 2, 5]}   intensity={8}  color="#f5e080" distance={30} decay={1.5} />
      <pointLight position={[-3, 6, 2]}  intensity={3}  color="#daa520" distance={18} decay={2} />
      {/* Tier 2 lights (Y ≈ 30–47) */}
      <pointLight position={[0, 38, 5]}  intensity={10} color="#f5e080" distance={35} decay={1.5} />
      <pointLight position={[3, 43, 0]}  intensity={4}  color="#f0d060" distance={22} decay={2} />
      {/* Tier 3 lights (Y ≈ 62–80) */}
      <pointLight position={[0, 65, 5]}  intensity={14} color="#f5e080" distance={40} decay={1.5} />
      <pointLight position={[-3, 71, 0]} intensity={5}  color="#daa520" distance={25} decay={2} />
      <pointLight position={[3, 80, -2]} intensity={8}  color="#f0d060" distance={28} decay={2} />

      {/* Sparkles: one group per tier zone */}
      <group position={[0, 5, 0]}>
        <Sparkles count={150} scale={30} size={2.5} speed={0.18} opacity={0.55} color="#f5e080" />
        <Sparkles count={80}  scale={22} size={5}   speed={0.08} opacity={0.35} color="#daa520" />
      </group>
      <group position={[0, 38, 0]}>
        <Sparkles count={150} scale={30} size={2.5} speed={0.18} opacity={0.55} color="#f5e080" />
        <Sparkles count={80}  scale={22} size={5}   speed={0.08} opacity={0.35} color="#daa520" />
      </group>
      <group position={[0, 68, 0]}>
        <Sparkles count={150} scale={30} size={2.5} speed={0.18} opacity={0.55} color="#f5e080" />
        <Sparkles count={80}  scale={22} size={5}   speed={0.08} opacity={0.35} color="#daa520" />
        <Sparkles count={50}  scale={16} size={8}   speed={0.04} opacity={0.28} color="#ffffff" />
      </group>

      {/* Tier 1 — Y ≈ 0–15 */}
      <CloudPlatform position={[-4, -1, -3]}  scale={[4.5, 0.9, 3.5]} />
      <CloudPlatform position={[4, 4, -4]}    scale={[3.5, 0.7, 2.8]} />
      <CloudPlatform position={[0, 11, -3]}   scale={[5.5, 0.8, 4.2]} />
      <ProjectCard position={[-4, 0.8, -3]}   title="Spline Experiments"  tier={1} />
      <ProjectCard position={[4, 6, -4]}      title="CYS Accountants"     tier={1} />
      <ProjectCard position={[0, 12.8, -3]}   title="AI Website"          tier={1} />

      {/* Tier 2 — Y ≈ 30–47 */}
      <CloudPlatform position={[-5, 30, -3.5]} scale={[6.5, 1.3, 5.5]} emissive />
      <CloudPlatform position={[5, 38, -5]}    scale={[5.5, 1.1, 4.5]} emissive />
      <CloudPlatform position={[0, 45, -4]}    scale={[8, 1.4, 6]}     emissive />
      <ProjectCard position={[-5, 32, -3.5]}   title="RyderDigital"       tier={2} />
      <ProjectCard position={[5, 40, -5]}      title="MVPcommunity"       tier={2} />
      <ProjectCard position={[0, 47, -4]}      title="Baseaim.co Website" tier={2} />

      {/* Tier 3 — Y ≈ 62–80 */}
      <CloudPlatform position={[-6, 62, -4.5]}  scale={[9, 2, 7.5]}   emissive bright />
      <CloudPlatform position={[5, 71, -6]}     scale={[8, 1.8, 6.5]} emissive bright />
      <CloudPlatform position={[0, 80, -5.5]}   scale={[13, 2.5, 10]} emissive bright />
      <ProjectCard position={[-6, 64.5, -4.5]}  title="Airtable Clone"           tier={3} />
      <ProjectCard position={[5, 73.5, -6]}     title="Baseaim Client Dashboard" tier={3} />

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
