'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { AbyssCityData } from './workflowData'
import { WorkflowOrganism } from './WorkflowOrganism'

// ---------------------------------------------------------------------------
// AbyssalCity
//
// Renders a cluster of WorkflowOrganism instances as a single named city:
//   • Inner group rotates slowly around the Y axis
//   • Thin glowing tendrils connect core → each satellite
//   • Point light at city centre using city colour
//   • Ambient glow sphere at city centre (static, spherically symmetric)
//   • Drei Html label pinned above the city centre (outside rotation)
// ---------------------------------------------------------------------------

interface AbyssalCityProps {
  city: AbyssCityData
}

export function AbyssalCity({ city }: AbyssalCityProps) {
  const innerRef = useRef<THREE.Group>(null)

  // Slow Y-axis rotation — satellites orbit the core
  useFrame((_, dt) => {
    if (innerRef.current) innerRef.current.rotation.y += dt * 0.04
  })

  // ── Tendril geometry — core (0,0,0) to each satellite position ────────────
  const tendrilGeo = useMemo(() => {
    const sats = city.satellites
    const verts = new Float32Array(sats.length * 6) // 2 verts × 3 coords
    sats.forEach((sat, i) => {
      verts[i * 6]     = 0; verts[i * 6 + 1] = 0; verts[i * 6 + 2] = 0
      verts[i * 6 + 3] = sat.position[0]
      verts[i * 6 + 4] = sat.position[1]
      verts[i * 6 + 5] = sat.position[2]
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    return geo
  }, [city.satellites])

  // Total node count across all organisms in this city
  const totalNodes = city.core.graph.nodes.length
    + city.satellites.reduce((n, s) => n + s.graph.nodes.length, 0)

  const labelY = city.core.scale * 0.9 + 2.5

  return (
    <group position={city.center}>

      {/* ── Static: light + glow + label ─────────────────────────────────── */}

      {/* Central point light — colour-matched, strong enough to tint fog */}
      <pointLight
        color={city.color}
        intensity={14}
        distance={city.radius * 3.5}
        decay={1.5}
      />

      {/* Soft ambient halo sphere */}
      <mesh>
        <sphereGeometry args={[city.core.scale * 1.2, 16, 12]} />
        <meshBasicMaterial
          color={city.color}
          transparent
          opacity={0.035}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* City label — above city centre, always faces camera */}
      <Html
        center
        position={[0, labelY, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div style={{
          background: 'rgba(0, 5, 14, 0.88)',
          border: `1px solid ${city.color}55`,
          borderRadius: '4px',
          padding: '5px 14px',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}>
          <div style={{
            color: city.color,
            fontSize: '13px',
            fontFamily: 'var(--font-sofia-condensed)',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}>
            {city.name}
          </div>
          <div style={{
            color: `${city.color}90`,
            fontSize: '9px',
            fontFamily: 'var(--font-sofia-condensed)',
            letterSpacing: '0.08em',
          }}>
            {totalNodes} nodes · {city.satellites.length + 1} systems
          </div>
        </div>
      </Html>

      {/* ── Rotating inner group ──────────────────────────────────────────── */}
      <group ref={innerRef}>

        {/* Tendril connections — thin lines core → satellites */}
        <lineSegments>
          <primitive object={tendrilGeo} attach="geometry" />
          <lineBasicMaterial
            color={city.color}
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>

        {/* Core organism */}
        <WorkflowOrganism
          graph={city.core.graph}
          position={city.core.position}
          scale={city.core.scale}
          color={city.color}
        />

        {/* Satellite organisms */}
        {city.satellites.map(sat => (
          <WorkflowOrganism
            key={sat.graph.name}
            graph={sat.graph}
            position={sat.position}
            scale={sat.scale}
            color={city.color}
          />
        ))}

      </group>
    </group>
  )
}
