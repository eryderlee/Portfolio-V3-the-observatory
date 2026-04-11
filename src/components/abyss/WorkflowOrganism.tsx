'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { WorkflowGraph } from './parseN8nWorkflow'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WorkflowOrganismProps {
  graph:    WorkflowGraph
  position: [number, number, number]
  /** Multiplier applied to node positions — controls organism footprint */
  scale?:   number
}

// ---------------------------------------------------------------------------
// WorkflowOrganism
//
// Renders a single n8n workflow as a bioluminescent 3D network:
//   • InstancedMesh of teal spheres  — one per node
//   • LineSegments                   — one per edge, additive teal
//   • InstancedMesh of bright spheres — data packets travelling each edge
//   • PointLight                     — warm ambient glow at the organism centre
// ---------------------------------------------------------------------------

export function WorkflowOrganism({ graph, position, scale = 1.0 }: WorkflowOrganismProps) {
  const nodesMeshRef   = useRef<THREE.InstancedMesh>(null)
  const packetsMeshRef = useRef<THREE.InstancedMesh>(null)

  // ── Scale node positions into world space ──────────────────────────────────
  const nodeVecs = useMemo(
    () => graph.nodes.map(n =>
      new THREE.Vector3(
        n.position[0] * scale,
        n.position[1] * scale,
        n.position[2] * scale,
      )
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graph.nodes, scale],
  )

  // ── Node-id → index lookup ─────────────────────────────────────────────────
  const nodeIndex = useMemo(() => {
    const m = new Map<string, number>()
    graph.nodes.forEach((n, i) => m.set(n.id, i))
    return m
  }, [graph.nodes])

  // ── Edge geometry + endpoint pairs for packet animation ───────────────────
  const { edgeGeo, edgePairs } = useMemo(() => {
    const ec    = graph.edges.length
    const verts = new Float32Array(ec * 6)
    const pairs: [THREE.Vector3, THREE.Vector3][] = []

    graph.edges.forEach((e, i) => {
      const fi = nodeIndex.get(e.from) ?? 0
      const ti = nodeIndex.get(e.to)   ?? 0
      const f  = nodeVecs[fi]
      const t  = nodeVecs[ti]
      verts[i * 6]     = f.x; verts[i * 6 + 1] = f.y; verts[i * 6 + 2] = f.z
      verts[i * 6 + 3] = t.x; verts[i * 6 + 4] = t.y; verts[i * 6 + 5] = t.z
      pairs.push([f, t])
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    return { edgeGeo: geo, edgePairs: pairs }
  }, [graph.edges, nodeVecs, nodeIndex])

  // ── Packet animation state — deterministic stagger ────────────────────────
  const { pT, pS } = useMemo(() => {
    const n  = graph.edges.length
    const pT = new Float32Array(n)
    const pS = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pT[i] = i / Math.max(1, n)           // staggered starts across [0,1)
      pS[i] = 0.06 + (i % 11) * 0.012     // speeds: 0.06 – 0.18 units/s
    }
    return { pT, pS }
  }, [graph.edges.length])

  // ── Write node instance matrices after mount ───────────────────────────────
  useEffect(() => {
    const mesh = nodesMeshRef.current
    if (!mesh) return
    const mat4 = new THREE.Matrix4()
    nodeVecs.forEach((v, i) => {
      mat4.setPosition(v)
      mesh.setMatrixAt(i, mat4)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [nodeVecs])

  // Reusable scratch objects — never recreated
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tmp   = useMemo(() => new THREE.Vector3(), [])

  // ── Animate data packets ───────────────────────────────────────────────────
  useFrame((_, dt) => {
    const packets = packetsMeshRef.current
    if (!packets || edgePairs.length === 0) return

    for (let i = 0; i < edgePairs.length; i++) {
      pT[i] = (pT[i] + pS[i] * dt) % 1.0
      tmp.lerpVectors(edgePairs[i][0], edgePairs[i][1], pT[i])
      dummy.position.copy(tmp)
      dummy.updateMatrix()
      packets.setMatrixAt(i, dummy.matrix)
    }
    packets.instanceMatrix.needsUpdate = true
  })

  // Guard: InstancedMesh count must be >= 1
  const packetCount = Math.max(1, graph.edges.length)

  return (
    <group position={position}>

      {/* ── Node spheres — teal, additive ──────────────────────────────────── */}
      <instancedMesh
        ref={nodesMeshRef}
        args={[undefined, undefined, graph.nodes.length]}
        frustumCulled
      >
        <sphereGeometry args={[0.13, 8, 6]} />
        <meshBasicMaterial
          color="#00c8b4"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.9}
        />
      </instancedMesh>

      {/* ── Connection lines — dim teal, additive ──────────────────────────── */}
      <lineSegments frustumCulled>
        <primitive object={edgeGeo} attach="geometry" />
        <lineBasicMaterial
          color="#007a6a"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.4}
        />
      </lineSegments>

      {/* ── Data-flow packets — bright cyan, additive ──────────────────────── */}
      <instancedMesh
        ref={packetsMeshRef}
        args={[undefined, undefined, packetCount]}
        frustumCulled
      >
        <sphereGeometry args={[0.06, 6, 4]} />
        <meshBasicMaterial
          color="#55ffee"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={1.0}
        />
      </instancedMesh>

      {/* ── Bioluminescent core glow ────────────────────────────────────────── */}
      <pointLight
        color="#00d0c0"
        intensity={scale * 0.65}
        distance={scale * 5.5}
        decay={2}
      />
    </group>
  )
}
