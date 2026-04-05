'use client'

import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { CloudPlatform } from './CloudPlatform'
import { ProjectCard } from './ProjectCard'
import { CelestialGate } from './CelestialGate'

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

interface ProjectConfig {
  title: string
  description?: string
  tech?: string[]
  position: [number, number, number]
  tier: 1 | 2 | 3
  transitionType: 'first' | 'dive' | 'sweep' | 'pullback' | 'ascend'
  rotation?: [number, number, number]
  customScale?: [number, number, number]
}

interface ClusterSubConfig {
  title: string
  description?: string
  tech?: string[]
  position: [number, number, number]
  scale: [number, number, number]
  tier: 1 | 2 | 3
  minimal?: boolean
}

// Tier 1: Z=-5 to -30  |  Tier 2: Z=-40 to -75  |  Tier 3: Z=-85 to -120
const PROJECTS: ProjectConfig[] = [
  { title: 'Spline Experiments',  position: [-4,  0.8,  -10], tier: 1, transitionType: 'first',   description: 'Interactive 3D web experiences built with Spline',              tech: ['Spline', 'React', 'Three.js'] },
  { title: 'CYS Accountants',     position: [ 5,  5.8,  -20], tier: 1, transitionType: 'dive',    description: 'Professional accounting firm website with modern design',        tech: ['Next.js', 'Tailwind CSS'] },
  { title: 'AI Website',          position: [ 0, 12.8,  -30], tier: 1, transitionType: 'dive',    description: 'AI-powered web application with intelligent features',            tech: ['Next.js', 'OpenAI API', 'React'] },
  { title: 'RyderDigital',        position: [-4, 32,    -45], tier: 2, transitionType: 'pullback', description: 'Web design agency portfolio and services',                       tech: ['Next.js', 'GSAP', 'Tailwind CSS'] },
  { title: 'MVPcommunity',        position: [ 6, 40,    -60], tier: 2, transitionType: 'dive',    description: 'Community platform connecting founders and builders',             tech: ['Next.js', 'Supabase', 'Real-time'] },
  { title: 'Baseaim',             position: [ 0, 47,    -75], tier: 2, transitionType: 'dive',    description: 'Full-service digital agency specializing in web and growth',      tech: ['Next.js', 'React', 'Node.js'] },
  { title: 'Airtable Clone',      position: [-7, 64.5,  -90], tier: 3, transitionType: 'pullback', description: 'Full-stack database application inspired by Airtable',           tech: ['Next.js', 'PostgreSQL', 'Real-time Sync'] },
  { title: 'The Observatory',     position: [-7, 118,  -105], tier: 3, transitionType: 'ascend', rotation: [0.4, 0, 0], customScale: [22, 4.5, 18], description: 'This portfolio — an immersive experience spanning multiple dimensions' },
]

// Baseaim archipelago — sub-islands rendered around the main Baseaim cluster stop
// PLANE 2 (tier 2) — upper/behind the main island
// PLANE 1 (tier 1) — lower/in-front, including the Funnels pipeline cluster
const BASEAIM_SUBS: ClusterSubConfig[] = [
  // — PLANE 1 (all Baseaim sub-islands) —
  { title: 'Baseaim.co Website',       position: [-8, 42,   -66], scale: [4.8, 1.0, 4.0], tier: 1, description: 'Agency website for Baseaim digital services',      tech: ['Next.js', 'Tailwind', 'Framer Motion'] },
  { title: 'Baseaim Auditor Software', position: [ 7, 42.5, -68], scale: [5.5, 1.1, 4.5], tier: 1, description: 'Automated website auditing software',               tech: ['Next.js', 'Puppeteer', 'AI Analysis'] },
  { title: 'Baseaim Client Dashboard', position: [-7, 44,   -70], scale: [4.5, 0.9, 3.5], tier: 1, description: 'Client management dashboard for Baseaim agency',    tech: ['React', 'Node.js', 'Tailwind'] },
  { title: 'Baseaim Funnels',         position: [ 6, 45,   -73], scale: [5.5, 1.1, 4.5], tier: 1, description: 'Conversion-optimized sales funnel system',           tech: ['Next.js', 'Analytics', 'A/B Testing'] },
  // Funnel pipeline — minimal text labels, cascading arc off the Funnels island
  { title: 'AB Tested VSLs',          position: [10, 44.5, -70], scale: [2.0, 0.5, 1.8], tier: 1, minimal: true },
  { title: 'Preframe',                position: [12, 44,   -72], scale: [2.0, 0.5, 1.8], tier: 1, minimal: true },
  { title: 'Thank You',               position: [12, 43.5, -74], scale: [2.0, 0.5, 1.8], tier: 1, minimal: true },
  { title: 'Onboarding',             position: [10, 43,   -76], scale: [2.0, 0.5, 1.8], tier: 1, minimal: true },
]

const PLATFORM_SCALES: Record<1 | 2 | 3, [number, number, number]> = {
  1: [4.5, 0.9, 3.5],
  2: [6.5, 1.3, 5.5],
  3: [9,   2,   7.5],
}

// How far below the card position the platform centre sits (increases with tier scale)
const PLATFORM_Y_OFFSETS: Record<1 | 2 | 3, number> = { 1: 1.8, 2: 2.0, 3: 2.5 }

// ---------------------------------------------------------------------------
// Camera path generator
// ---------------------------------------------------------------------------
// Close-up = project position + Z+3 (pull 3 units toward viewer, same X/Y).
// dive     → straight to close-up, no intermediate keyframe
// sweep    → arc through a wide-X midpoint (opposite X direction) at mid-Y/Z
// pullback → retract toward viewer in Z (prevZ+15) at mid-Y, then dive in
// ---------------------------------------------------------------------------
function buildCameraPath(projects: ProjectConfig[]): {
  curve: THREE.CatmullRomCurve3
  quaternions: THREE.Quaternion[]
} {
  const points: THREE.Vector3[] = []
  const quats:  THREE.Quaternion[] = []

  const closeUpOf = (p: ProjectConfig) =>
    new THREE.Vector3(p.position[0], p.position[1], p.position[2] + 3)

  const push = (v: THREE.Vector3, lookAt: [number, number, number]) => {
    points.push(v)
    quats.push(lookAtQuat([v.x, v.y, v.z], lookAt))
  }

  // Gate approach — camera starts LOW looking UP at the gate high above.
  // Gate is at [0, 15, -6]. Camera ascends like climbing heavenly stairs.
  push(new THREE.Vector3(0, -5, 8),  [0, 15, -6])  // start: looking up at gate
  push(new THREE.Vector3(0,  2, 4),  [0, 15, -6])  // rising, approaching
  push(new THREE.Vector3(0,  8, 0),  [0, 15, -6])  // level with gate, about to pass through

  const first = projects[0]
  // Just past gate — transitioning toward first island
  push(new THREE.Vector3(0, 10, -5), first.position)

  // First close-up
  push(closeUpOf(first), first.position)

  for (let i = 1; i < projects.length; i++) {
    const proj   = projects[i]
    const cu     = closeUpOf(proj)
    const prevCu = closeUpOf(projects[i - 1])

    if (proj.transitionType === 'dive') {
      push(cu, proj.position)
    } else if (proj.transitionType === 'sweep') {
      // Swing wide on X in the direction opposite to the target island
      push(
        new THREE.Vector3(
          proj.position[0] >= 0 ? -9 : 9,
          (prevCu.y + cu.y) / 2,
          (prevCu.z + cu.z) / 2,
        ),
        proj.position,
      )
      push(cu, proj.position)
    } else if (proj.transitionType === 'pullback') {
      // Retract toward viewer before diving in
      push(
        new THREE.Vector3(prevCu.x, (prevCu.y + cu.y) / 2, prevCu.z + 15),
        proj.position,
      )
      push(cu, proj.position)
    } else if (proj.transitionType === 'ascend') {
      // Force straight vertical: 2 intermediates all share Observatory's exact X/Z.
      // CatmullRomCurve3 cannot deviate in X or Z when all control points are collinear.
      const yRange = cu.y - prevCu.y
      push(new THREE.Vector3(proj.position[0], prevCu.y + yRange * 0.33, cu.z), proj.position)
      push(new THREE.Vector3(proj.position[0], prevCu.y + yRange * 0.67, cu.z), proj.position)
      push(cu, proj.position)
    }
  }

  // Finale — pull slightly above last close-up
  const last   = projects[projects.length - 1]
  const lastCu = closeUpOf(last)
  push(new THREE.Vector3(0, last.position[1] + 8, lastCu.z), last.position)

  return { curve: new THREE.CatmullRomCurve3(points), quaternions: quats }
}

const { curve: CURVE, quaternions: Q_KEYFRAMES } = buildCameraPath(PROJECTS)

// ---------------------------------------------------------------------------

function SceneContent({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const { camera, scene } = useThree()
  const smoothProgress = useRef(0)
  const qStart = useRef(new THREE.Quaternion())
  const qEnd   = useRef(new THREE.Quaternion())

  useEffect(() => {
    const bg = new THREE.Color('#1e1004')
    scene.background = bg
    scene.fog = new THREE.FogExp2(bg, 0.005)
    return () => { scene.fog = null; scene.background = null }
  }, [scene])

  useFrame((_, delta) => {
    const target = progressRef.current
    smoothProgress.current = THREE.MathUtils.damp(smoothProgress.current, target, 4, delta)
    const t = Math.max(0, Math.min(1, smoothProgress.current))

    camera.position.copy(CURVE.getPoint(t))

    const segment = t * (Q_KEYFRAMES.length - 1)
    const segIdx  = Math.min(Math.floor(segment), Q_KEYFRAMES.length - 2)
    const segT    = segment - Math.floor(segment)
    qStart.current.copy(Q_KEYFRAMES[segIdx])
    qEnd.current.copy(Q_KEYFRAMES[segIdx + 1])
    camera.quaternion.slerpQuaternions(qStart.current, qEnd.current, segT)
  })

  return (
    <>
      <ambientLight intensity={0.25} color="#daa520" />

      {/* Tier 1 lights — Z -10 to -30 */}
      <pointLight position={[-4,  0.8,  -8]} intensity={8}  color="#f5e080" distance={40} decay={1.5} />
      <pointLight position={[ 5,  5.8, -18]} intensity={4}  color="#daa520" distance={25} decay={2} />
      <pointLight position={[ 0, 12.8, -28]} intensity={4}  color="#f0d060" distance={28} decay={2} />

      {/* Tier 2 lights — Z -45 to -75 */}
      <pointLight position={[-7, 32,   -43]} intensity={10} color="#f5e080" distance={55} decay={1.5} />
      <pointLight position={[ 6, 40,   -58]} intensity={5}  color="#f0d060" distance={38} decay={2} />
      <pointLight position={[ 0, 47,   -73]} intensity={5}  color="#daa520" distance={38} decay={2} />

      {/* Tier 3 lights — Z -90 to -120 */}
      <pointLight position={[-7, 64.5,  -88]} intensity={14} color="#f5e080" distance={65} decay={1.5} />
      <pointLight position={[-7, 116, -103]} intensity={9}  color="#f5e080" distance={55} decay={1.5} />
      <pointLight position={[ 0, 80,   -118]} intensity={8}  color="#f0d060" distance={45} decay={2} />

      {/* Sparkles at each tier's depth midpoint */}
      <group position={[0,  5,  -20]}>
        <Sparkles count={150} scale={[30, 30, 25]} size={2.5} speed={0.18} opacity={0.55} color="#f5e080" />
        <Sparkles count={80}  scale={[22, 22, 20]} size={5}   speed={0.08} opacity={0.35} color="#daa520" />
      </group>
      <group position={[0, 40,  -58]}>
        <Sparkles count={150} scale={[30, 30, 35]} size={2.5} speed={0.18} opacity={0.55} color="#f5e080" />
        <Sparkles count={80}  scale={[22, 22, 28]} size={5}   speed={0.08} opacity={0.35} color="#daa520" />
      </group>
      <group position={[0, 68, -100]}>
        <Sparkles count={150} scale={[30, 30, 35]} size={2.5} speed={0.18} opacity={0.55} color="#f5e080" />
        <Sparkles count={80}  scale={[22, 22, 28]} size={5}   speed={0.08} opacity={0.35} color="#daa520" />
        <Sparkles count={50}  scale={[16, 16, 20]} size={8}   speed={0.04} opacity={0.28} color="#ffffff" />
      </group>

      {/* Islands — auto-placed from PROJECTS data */}
      {PROJECTS.map((p) => {
        const scale = p.customScale ?? PLATFORM_SCALES[p.tier]
        const yOffset = p.customScale
          ? p.customScale[1] / 2 + 1.5
          : PLATFORM_Y_OFFSETS[p.tier]
        return (
          <group key={p.title}>
            <CloudPlatform
              position={[p.position[0], p.position[1] - yOffset, p.position[2]]}
              scale={scale}
              rotation={p.rotation}
              emissive={p.tier >= 2}
              bright={p.tier === 3}
            />
            <ProjectCard
              position={p.position}
              title={p.title}
              tier={p.tier}
              description={p.description}
              tech={p.tech}
            />
          </group>
        )
      })}

      {/* Baseaim archipelago sub-islands */}
      {BASEAIM_SUBS.map(sub => (
        <group key={sub.title}>
          <CloudPlatform
            position={[sub.position[0], sub.position[1] - 1.8, sub.position[2]]}
            scale={sub.scale}
            emissive={sub.tier >= 2}
          />
          <ProjectCard
            position={sub.position}
            title={sub.title}
            tier={sub.tier}
            description={sub.description}
            tech={sub.tech}
            minimal={sub.minimal}
          />
        </group>
      ))}

      {/* Gate entrance — visible only during the first ~12-19% of scroll */}
      <CelestialGate progressRef={progressRef} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.28} luminanceSmoothing={0.85} intensity={1.4} mipmapBlur />
      </EffectComposer>
    </>
  )
}

export default function CelestialScene({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  return (
    <Canvas
      camera={{ position: [0, -5, 8], fov: 55, near: 0.1, far: 350 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      style={{ background: '#1e1004' }}
    >
      <Suspense fallback={null}>
        <SceneContent progressRef={progressRef} />
      </Suspense>
    </Canvas>
  )
}
