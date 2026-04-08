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

// Tier 1: Z=-14 to -42 | Tier 2: Z=-58 to -90 | Tier 3: Z=-110 to -128
// Plane 1: BookeepAI Dashboard, CYS Accountants, CoFarming Hub, Baseaim Archipelago (cluster)
// Plane 2: RyderDigital, MVPcommunity | Plane 3: Airtable Clone | Final: The Observatory
const PROJECTS: ProjectConfig[] = [
  { title: 'BookeepAI Dashboard', position: [ -8, 14,   -14], tier: 1, transitionType: 'first',   description: 'Internal bookkeeping operations dashboard',               tech: ['React', 'Supabase', 'Tailwind'] },
  { title: 'CYS Accountants',     position: [ 10, 15,   -28], tier: 1, transitionType: 'dive',    description: 'Professional accounting firm website with modern design',  tech: ['Next.js', 'Tailwind CSS'] },
  { title: 'CoFarming Hub',       position: [  0, 17,   -42], tier: 1, transitionType: 'dive',    description: 'Community platform for collaborative farming',             tech: ['HTML', 'CSS', 'Node.js'] },
  { title: 'RyderDigital',        position: [-11, 35,   -58], tier: 2, transitionType: 'pullback', description: 'Web design agency portfolio and services',                tech: ['Next.js', 'GSAP', 'Tailwind CSS'] },
  { title: 'MVPcommunity',        position: [ 12, 43,   -74], tier: 2, transitionType: 'dive',    description: 'Community platform connecting founders and builders',      tech: ['Next.js', 'Supabase', 'Real-time'] },
  { title: 'Baseaim',             position: [  0, 50,   -90], tier: 2, transitionType: 'dive',    description: 'Full-service digital agency specializing in web and growth', tech: ['Next.js', 'React', 'Node.js'] },
  { title: 'Airtable Clone',      position: [-13, 64,  -110], tier: 3, transitionType: 'pullback', description: 'Full-stack database application inspired by Airtable',    tech: ['Next.js', 'PostgreSQL', 'Real-time Sync'] },
  { title: 'The Observatory',     position: [ -7, 118, -128], tier: 3, transitionType: 'ascend', rotation: [0.4, 0, 0], customScale: [22, 4.5, 18], description: 'This portfolio — an immersive experience spanning multiple dimensions' },
]

// Baseaim archipelago — sub-islands rendered around the main Baseaim cluster stop
// PLANE 2 (tier 2) — upper/behind the main island
// PLANE 1 (tier 1) — lower/in-front, including the Funnels pipeline cluster
const BASEAIM_SUBS: ClusterSubConfig[] = [
  // — PLANE 1 (all Baseaim sub-islands) — Z offset from main Baseaim at [0, 50, -90]
  { title: 'Baseaim.co Website',       position: [-8, 47,   -81], scale: [4.8, 1.0, 4.0], tier: 1, description: 'Agency website for Baseaim digital services',                    tech: ['Next.js', 'Tailwind', 'Framer Motion'] },
  { title: 'ROI Audit Agent',          position: [ 7, 47.5, -83], scale: [5.5, 1.1, 4.5], tier: 1, description: 'AI ROI calculator for customer service automation',               tech: ['Next.js', 'Supabase', 'AI Analysis'] },
  { title: 'Baseaim Client Dashboard', position: [-7, 49,   -85], scale: [4.5, 0.9, 3.5], tier: 1, description: 'Client management dashboard for Baseaim agency',                 tech: ['React', 'Node.js', 'Tailwind'] },
  { title: 'Baseaim Funnels',          position: [ 6, 50,   -88], scale: [5.5, 1.1, 4.5], tier: 1, description: 'Conversion-optimized sales funnel system',                       tech: ['Next.js', 'Analytics', 'A/B Testing'] },
  { title: 'equity.baseaim.co',        position: [-9, 48.5, -87], scale: [4.5, 0.9, 3.5], tier: 1, description: 'Real-time equity tracking dashboard with visualizations',        tech: ['React', 'Supabase', 'Tailwind'] },
  // Funnel pipeline — minimal text labels, cascading arc off the Funnels island
  { title: 'AB Tested VSLs',           position: [10, 49.5, -85], scale: [2.0, 0.5, 1.8], tier: 1, minimal: true },
  { title: 'Preframe',                 position: [12, 49,   -87], scale: [2.0, 0.5, 1.8], tier: 1, minimal: true },
  { title: 'Thank You',                position: [12, 48.5, -89], scale: [2.0, 0.5, 1.8], tier: 1, minimal: true },
  { title: 'Onboarding',               position: [10, 48,   -91], scale: [2.0, 0.5, 1.8], tier: 1, minimal: true },
]

const PLATFORM_SCALES: Record<1 | 2 | 3, [number, number, number]> = {
  1: [3.5, 0.7, 2.8],   // smaller: subtle, mysterious
  2: [6.5, 1.3, 5.5],   // medium: grander
  3: [10,  2.2, 8.5],   // largest: most imposing
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

  // Gate approach — camera starts FAR BACK looking UP at the gate high above.
  // Gate is at [0, 15, -6]. Camera ascends like climbing heavenly stairs.
  push(new THREE.Vector3(0, -5, 28), [0, 15, -6])  // start: far back, looking up at gate
  push(new THREE.Vector3(0,  2, 16), [0, 15, -6])  // rising, approaching
  push(new THREE.Vector3(0, 10,  4), [0, 15, -6])  // near gate, still ascending

  const first = projects[0]
  // Level off AT the gate — camera reaches gate height then stops ascending
  push(new THREE.Vector3(0, 14,  0), [0, 15, -6])   // at gate level, stop ascending
  push(new THREE.Vector3(0, 14, -5), first.position) // through gate, level flight begins

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
  const qStart  = useRef(new THREE.Quaternion())
  const qEnd    = useRef(new THREE.Quaternion())
  const fogRef  = useRef<THREE.FogExp2 | null>(null)

  useEffect(() => {
    const bg = new THREE.Color('#1e1004')
    scene.background = bg
    const fog = new THREE.FogExp2(bg, 0.012)
    scene.fog = fog
    fogRef.current = fog
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

    // Dynamic fog: thick/mysterious at Tier 1 (t≈0), clear/grand at Tier 3 (t≈1)
    if (fogRef.current) {
      const targetDensity = THREE.MathUtils.lerp(0.012, 0.003, t)
      fogRef.current.density = THREE.MathUtils.damp(fogRef.current.density, targetDensity, 2, delta)
    }
  })

  return (
    <>
      <ambientLight intensity={0.18} color="#daa520" />

      {/* Tier 1 lights — softer/dimmer (mysterious) */}
      <pointLight position={[ -8, 14,   -12]} intensity={4}  color="#f0d870" distance={30} decay={2} />
      <pointLight position={[ 10, 15,   -26]} intensity={3}  color="#daa520" distance={22} decay={2} />
      <pointLight position={[  0, 17,   -40]} intensity={3}  color="#f0d060" distance={24} decay={2} />

      {/* Tier 2 lights — grander/brighter */}
      <pointLight position={[-11, 35,   -56]} intensity={12} color="#f5e080" distance={60} decay={1.5} />
      <pointLight position={[ 12, 43,   -72]} intensity={7}  color="#f0d060" distance={42} decay={1.8} />
      <pointLight position={[  0, 50,   -88]} intensity={7}  color="#daa520" distance={42} decay={1.8} />

      {/* Tier 3 lights — brightest/most intense */}
      <pointLight position={[-13, 64,  -108]} intensity={20} color="#f5e080" distance={80} decay={1.3} />
      <pointLight position={[ -7, 116, -126]} intensity={14} color="#fff0a0" distance={70} decay={1.5} />
      <pointLight position={[  0,  90, -126]} intensity={12} color="#f0d060" distance={55} decay={1.8} />

      {/* Sparkles — tiered: subtle Tier 1 → spectacular Tier 3. Total ≈ 950 */}
      <group position={[0, 15,  -28]}>{/* Tier 1: dim/sparse — mysterious */}
        <Sparkles count={80}  scale={[22, 22, 20]} size={1.8} speed={0.15} opacity={0.38} color="#f5e080" />
        <Sparkles count={40}  scale={[16, 16, 16]} size={3.5} speed={0.06} opacity={0.22} color="#daa520" />
      </group>
      <group position={[0, 43,  -74]}>{/* Tier 2: medium density */}
        <Sparkles count={160} scale={[32, 32, 38]} size={2.5} speed={0.18} opacity={0.55} color="#f5e080" />
        <Sparkles count={90}  scale={[24, 24, 30]} size={5.5} speed={0.08} opacity={0.38} color="#daa520" />
      </group>
      <group position={[0, 64, -118]}>{/* Tier 3: densest, largest — grand reveal */}
        <Sparkles count={250} scale={[36, 36, 40]} size={3.2} speed={0.20} opacity={0.65} color="#f5e080" />
        <Sparkles count={150} scale={[28, 28, 32]} size={6.5} speed={0.10} opacity={0.45} color="#daa520" />
        <Sparkles count={100} scale={[20, 20, 24]} size={9}   speed={0.05} opacity={0.30} color="#ffffff" />
        <Sparkles count={80}  scale={[14, 14, 18]} size={12}  speed={0.03} opacity={0.18} color="#fff8e0" />
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
        <Bloom luminanceThreshold={0.35} luminanceSmoothing={0.9} intensity={1.2} mipmapBlur />
      </EffectComposer>
    </>
  )
}

export default function CelestialScene({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  return (
    <Canvas
      camera={{ position: [0, -5, 28], fov: 45, near: 0.1, far: 350 }}
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
