import type { WorkflowGraph } from './parseN8nWorkflow'
import type { WorkflowNode, WorkflowEdge } from './parseN8nWorkflow'

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
// City cluster types
// ---------------------------------------------------------------------------

export interface OrganismPlacement {
  graph:    WorkflowGraph
  /** Position relative to the city centre (local space) */
  position: [number, number, number]
  scale:    number
}

export interface AbyssCityData {
  name:       string
  /** Hex colour for the whole city — nodes, lights, tendrils */
  color:      string
  /** World-space centre of the city */
  center:     [number, number, number]
  /** Approximate bounding radius — used for camera framing */
  radius:     number
  core:       OrganismPlacement
  satellites: OrganismPlacement[]
}

// ---------------------------------------------------------------------------
// City 1 — Content Hive  (Y = -15, cyan #00e5cc)
// Core: Article Generator (40 nodes)
// 3 compact satellites
// ---------------------------------------------------------------------------

const CITY_CONTENT_HIVE: AbyssCityData = {
  name:   'Content Hive',
  color:  '#00e5cc',
  center: [0, -15, -8],
  radius: 10,
  core: {
    graph:    buildWorkflow('Article Generator',     40, 25, 0xabcdef),
    position: [0, 0, 0],
    scale:    4.5,
  },
  satellites: [
    { graph: buildWorkflow('Email Inbox Manager',    21, 16, 0x1a2b3c), position: [9,    0.5,  0   ], scale: 2.5 },
    { graph: buildWorkflow('Crypto Market Analyzer', 29, 26, 0x4d5e6f), position: [-4.5, -0.5, 7.8 ], scale: 3.0 },
    { graph: buildWorkflow('LinkedIn Lead Builder',  39, 37, 0x7a8b9c), position: [-4.5, 0.5, -7.8 ], scale: 3.5 },
  ],
}

// ---------------------------------------------------------------------------
// City 2 — Email Citadel  (Y = -32, blue #0066ff)
// Core: Email Management Lvl 3 (59 nodes)
// 5 satellites in spoke pattern
// ---------------------------------------------------------------------------

const CITY_EMAIL_CITADEL: AbyssCityData = {
  name:   'Email Citadel',
  color:  '#0066ff',
  center: [0, -32, -12],
  radius: 17,
  core: {
    graph:    buildWorkflow('Email Management Lvl 3', 59, 35, 0x5f4e3d),
    position: [0, 0, 0],
    scale:    6.0,
  },
  // Spokes at 0°, 72°, 144°, 216°, 288°  (r = 16)
  satellites: [
    { graph: buildWorkflow('Create Audit',     47, 45, 0x321fed), position: [16,    1,   0     ], scale: 5.0 },
    { graph: buildWorkflow('Email Router',     18, 14, 0x2b3c4d), position: [4.94, -0.5, 15.22 ], scale: 2.0 },
    { graph: buildWorkflow('Response Tracker', 22, 18, 0x3c4d5e), position: [-12.94, 0.5, 9.41 ], scale: 2.5 },
    { graph: buildWorkflow('Spam Filter AI',   15, 12, 0x4e5f70), position: [-12.94, -1, -9.41 ], scale: 1.8 },
    { graph: buildWorkflow('Thread Analyzer',  25, 20, 0x607182), position: [4.94,  0.5, -15.22], scale: 2.8 },
  ],
}

// ---------------------------------------------------------------------------
// City 3 — Lead Forge  (Y = -50, purple #8800cc)
// Core: Data Enricher (82 nodes)
// 8 satellites spread web-like
// ---------------------------------------------------------------------------

const CITY_LEAD_FORGE: AbyssCityData = {
  name:   'Lead Forge',
  color:  '#8800cc',
  center: [0, -50, -16],
  radius: 30,
  core: {
    graph:    buildWorkflow('Data Enricher', 82, 73, 0x9c8b7a),
    position: [0, 0, 0],
    scale:    8.0,
  },
  // 8 directions at 45° increments, varying radii (24 – 28)
  satellites: [
    { graph: buildWorkflow('CRM Updater',       20, 16, 0xaa1122), position: [27,     0,    0     ], scale: 2.5 },
    { graph: buildWorkflow('LinkedIn Scraper',  28, 24, 0xbb2233), position: [17.68,  2,   17.68  ], scale: 3.2 },
    { graph: buildWorkflow('Contact Verifier',  15, 12, 0xcc3344), position: [0,     -1,   28     ], scale: 2.0 },
    { graph: buildWorkflow('Industry Mapper',   22, 18, 0xdd4455), position: [-16.97, 1.5, 16.97  ], scale: 2.8 },
    { graph: buildWorkflow('Deal Scorer',       19, 15, 0xee5566), position: [-26,    0,    0     ], scale: 2.3 },
    { graph: buildWorkflow('Profile Builder',   24, 20, 0xff6677), position: [-19.8, -2,  -19.8   ], scale: 3.0 },
    { graph: buildWorkflow('Intent Tracker',    18, 14, 0x112233), position: [0,      1,  -25     ], scale: 2.2 },
    { graph: buildWorkflow('Segment Builder',   21, 17, 0x223344), position: [19.09, -1.5, -19.09 ], scale: 2.6 },
  ],
}

// ---------------------------------------------------------------------------
// City 4 — Agent Sanctum  (Y = -70, red #cc0033)
// Core: AI Voice Agent (92 nodes)
// 5 satellites in loose orbit
// ---------------------------------------------------------------------------

const CITY_AGENT_SANCTUM: AbyssCityData = {
  name:   'Agent Sanctum',
  color:  '#cc0033',
  center: [0, -70, -20],
  radius: 40,
  core: {
    graph:    buildWorkflow('AI Voice Agent (Vapi)',  92, 46, 0xc3d4e5),
    position: [0, 0, 0],
    scale:    9.0,
  },
  // Loose orbit at 0°, 72°, 144°, 216°, 288°  (r = 36 – 39)
  satellites: [
    { graph: buildWorkflow('Voice Transcriber',   25, 20, 0xd4e5f6), position: [37,     2,    0     ], scale: 3.0 },
    { graph: buildWorkflow('Intent Classifier',   20, 16, 0xe5f607), position: [12.05, -2,   37.09  ], scale: 2.5 },
    { graph: buildWorkflow('Response Generator',  22, 18, 0xf607b8), position: [-29.12, 3,   21.17  ], scale: 2.8 },
    { graph: buildWorkflow('Memory Manager',      18, 14, 0x07b8c9), position: [-30.74, -3, -22.34  ], scale: 2.3 },
    { graph: buildWorkflow('Sentiment Analyzer',  19, 15, 0xb8c907), position: [11.43,  2,  -35.19  ], scale: 2.5 },
  ],
}

// ---------------------------------------------------------------------------
// Exported city array — ordered shallowest → deepest
// ---------------------------------------------------------------------------

export const CITY_DEFINITIONS: AbyssCityData[] = [
  CITY_CONTENT_HIVE,
  CITY_EMAIL_CITADEL,
  CITY_LEAD_FORGE,
  CITY_AGENT_SANCTUM,
]
