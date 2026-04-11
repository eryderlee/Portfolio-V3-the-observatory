import type { WorkflowGraph, WorkflowNode, WorkflowEdge } from './parseN8nWorkflow'

// ---------------------------------------------------------------------------
// Deterministic LCG — produces identical layouts across renders
// ---------------------------------------------------------------------------

function lcg(seed: number) {
  let s = seed | 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0
    return (s >>> 0) / 0x100000000
  }
}

// ---------------------------------------------------------------------------
// Organic layout generator
//
// Nodes are scattered around cluster centres placed on a sphere surface,
// giving a biological / neural-net silhouette.  Positions are normalised to
// roughly ±0.5 so the caller can scale them freely.
// ---------------------------------------------------------------------------

function buildWorkflow(
  name:      string,
  nodeCount: number,
  edgeCount: number,
  seed:      number,
): WorkflowGraph {
  const rand = lcg(seed)

  // ── Cluster centres ────────────────────────────────────────────────────────
  const clusterCount = Math.max(2, Math.ceil(nodeCount / 12))
  const centres: [number, number, number][] = []

  for (let c = 0; c < clusterCount; c++) {
    const theta = rand() * Math.PI * 2
    const phi   = Math.acos(2 * rand() - 1)
    const r     = 0.18 + rand() * 0.28           // 0.18 – 0.46
    centres.push([
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi) * 0.45,               // flatten Z → disc-like silhouette
    ])
  }

  // ── Nodes ─────────────────────────────────────────────────────────────────
  const nodes: WorkflowNode[] = []
  for (let i = 0; i < nodeCount; i++) {
    const [cx, cy, cz] = centres[Math.floor(rand() * clusterCount)]
    const jitter       = 0.07 + rand() * 0.09
    nodes.push({
      id:    `${name}#${i}`,
      label: `Node ${i}`,
      type:  'generic',
      position: [
        cx + (rand() - 0.5) * jitter * 2,
        cy + (rand() - 0.5) * jitter * 2,
        cz + (rand() - 0.5) * jitter * 0.5,
      ],
    })
  }

  // ── Edges ─────────────────────────────────────────────────────────────────
  const edges:  WorkflowEdge[] = []
  const edgeSet = new Set<string>()

  // Spanning-tree skeleton keeps the graph connected
  for (let i = 1; i < nodeCount && edges.length < edgeCount; i++) {
    const j   = Math.floor(rand() * i)
    const key = `${j}:${i}`
    if (!edgeSet.has(key)) {
      edgeSet.add(key)
      edges.push({ from: `${name}#${j}`, to: `${name}#${i}` })
    }
  }

  // Random additional edges to reach target density
  let tries = 0
  while (edges.length < edgeCount && tries < edgeCount * 25) {
    tries++
    const a  = Math.floor(rand() * nodeCount)
    const b  = Math.floor(rand() * nodeCount)
    if (a === b) continue
    const lo = Math.min(a, b), hi = Math.max(a, b)
    const key = `${lo}:${hi}`
    if (!edgeSet.has(key)) {
      edgeSet.add(key)
      edges.push({ from: `${name}#${lo}`, to: `${name}#${hi}` })
    }
  }

  return { name, nodes, edges }
}

// ---------------------------------------------------------------------------
// 8 hardcoded workflows — sorted shallowest → deepest (fewest → most nodes)
// ---------------------------------------------------------------------------

export const WORKFLOW_GRAPHS: WorkflowGraph[] = [
  buildWorkflow('Email Inbox Manager',      21,  16, 0x1a2b3c),
  buildWorkflow('Crypto Market Analyzer',   29,  26, 0x4d5e6f),
  buildWorkflow('LinkedIn Lead Builder',    39,  37, 0x7a8b9c),
  buildWorkflow('Article Generator',        40,  25, 0xabcdef),
  buildWorkflow('Create Audit',             47,  45, 0x321fed),
  buildWorkflow('Email Management Lvl 3',   59,  35, 0x5f4e3d),
  buildWorkflow('Data Enricher',            82,  73, 0x9c8b7a),
  buildWorkflow('AI Voice Agent (Vapi)',     92,  46, 0xc3d4e5),
]

// World-space placements: [x, y, z] and scale
// Sorted shallowest → deepest to match WORKFLOW_GRAPHS order.
// Y values follow the camera tiers:
//   Tier 1 (Twilight)  →  Y  -4 to -20
//   Tier 2 (Midnight)  →  Y -22 to -44
//   Tier 3 (Abyss)     →  Y -46 to -73
// X offsets keep organisms in peripheral view as the camera descends.

export const WORKFLOW_PLACEMENTS: {
  position: [number, number, number]
  scale:    number
}[] = [
  { position: [ -9,  -14,  -5], scale: 3.0 },  // Email Inbox Manager
  { position: [  9,  -23,  -8], scale: 3.8 },  // Crypto Market Analyzer
  { position: [-11,  -31, -10], scale: 4.5 },  // LinkedIn Lead Builder
  { position: [  8,  -38, -13], scale: 4.8 },  // Article Generator
  { position: [ -7,  -44, -15], scale: 5.2 },  // Create Audit
  { position: [  9,  -53, -12], scale: 5.8 },  // Email Management Lvl 3
  { position: [-10,  -61, -16], scale: 7.0 },  // Data Enricher
  { position: [  6,  -68, -18], scale: 8.0 },  // AI Voice Agent (Vapi) — deepest
]
