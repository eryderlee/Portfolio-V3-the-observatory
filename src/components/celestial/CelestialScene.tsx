'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { CloudPlatform } from './CloudPlatform'
import { ProjectCard } from './ProjectCard'

// Camera fly-through path
const CURVE_POINTS = [
  new THREE.Vector3(0, -8, 9),
  new THREE.Vector3(-1.5, -2, 7),
  new THREE.Vector3(1, 4, 5.5),
  new THREE.Vector3(-1, 10, 4.5),
  new THREE.Vector3(0.5, 14, 3.5),
  new THREE.Vector3(0, 19, 2.5),
]

const Q_KEYFRAMES = [
  new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.15, 0, 0)),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, -0.1, 0)),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.25, 0.08, 0)),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.3, -0.05, 0)),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, 0.05, 0)),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.1, 0, 0)),
]

function SceneContent({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const { camera, scene } = useThree()
  const smoothProgress = useRef(0)
  const curve = useMemo(() => new THREE.CatmullRomCurve3(CURVE_POINTS), [])
  const qStart = useRef(new THREE.Quaternion())
  const qEnd = useRef(new THREE.Quaternion())

  useEffect(() => {
    const fog = new THREE.FogExp2(new THREE.Color('#1e1004'), 0.022)
    scene.fog = fog
    return () => { scene.fog = null }
  }, [scene])

  useFrame(() => {
    const target = progressRef.current
    smoothProgress.current += (target - smoothProgress.current) * 0.06
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
      <pointLight position={[0, 20, 3]} intensity={4} color="#f5e080" distance={35} decay={1.5} />
      <pointLight position={[-4, 9, 2]} intensity={2} color="#daa520" distance={22} decay={2} />
      <pointLight position={[5, -1, 4]} intensity={1.2} color="#c8921a" distance={16} decay={2} />
      <pointLight position={[3, 15, -2]} intensity={1.8} color="#f0d060" distance={18} decay={2} />

      <Sparkles count={250} scale={32} size={2.5} speed={0.18} opacity={0.55} color="#f5e080" />
      <Sparkles count={120} scale={22} size={5} speed={0.08} opacity={0.35} color="#daa520" />
      <Sparkles count={60} scale={14} size={8} speed={0.04} opacity={0.25} color="#ffffff" />

      {/* Tier 1 */}
      <CloudPlatform position={[-3.5, -1, -3]} scale={[4.5, 0.9, 3.5]} />
      <CloudPlatform position={[2.5, 1.2, -4.5]} scale={[3.5, 0.7, 2.8]} />
      <CloudPlatform position={[0, 3.5, -3.5]} scale={[5.5, 0.8, 4.2]} />
      <ProjectCard position={[-3.5, 0.8, -3]} title="Spline Experiments" tier={1} />
      <ProjectCard position={[2.5, 2.4, -4.5]} title="CYS Accountants" tier={1} />
      <ProjectCard position={[0, 4.8, -3.5]} title="AI Website" tier={1} />

      {/* Tier 2 */}
      <CloudPlatform position={[-4.5, 7.5, -3.5]} scale={[6.5, 1.3, 5.5]} emissive />
      <CloudPlatform position={[3.5, 9.5, -5]} scale={[5.5, 1.1, 4.5]} emissive />
      <CloudPlatform position={[0, 11.5, -4]} scale={[8, 1.4, 6]} emissive />
      <ProjectCard position={[-4.5, 9.2, -3.5]} title="RyderDigital" tier={2} />
      <ProjectCard position={[3.5, 11.2, -5]} title="MVPcommunity" tier={2} />
      <ProjectCard position={[0, 13.4, -4]} title="Baseaim.co Website" tier={2} />

      {/* Tier 3 */}
      <CloudPlatform position={[-5.5, 14.5, -4.5]} scale={[9, 2, 7.5]} emissive bright />
      <CloudPlatform position={[4.5, 16.5, -6]} scale={[8, 1.8, 6.5]} emissive bright />
      <CloudPlatform position={[0, 19, -5.5]} scale={[13, 2.5, 10]} emissive bright />
      <ProjectCard position={[-5.5, 17, -4.5]} title="Airtable Clone" tier={3} />
      <ProjectCard position={[4.5, 18.8, -6]} title="Baseaim Client Dashboard" tier={3} />

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
      camera={{ position: [0, -8, 9], fov: 60, near: 0.1, far: 120 }}
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
