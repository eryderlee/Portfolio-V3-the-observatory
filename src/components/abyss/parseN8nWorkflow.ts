// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkflowNode {
  id:       string
  label:    string
  type:     string
  position: [number, number, number]
}

export interface WorkflowEdge {
  from: string
  to:   string
}

export interface WorkflowGraph {
  name:  string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

// ---------------------------------------------------------------------------
// n8n JSON shapes
// ---------------------------------------------------------------------------

interface N8nNode {
  id:       string
  name:     string
  type:     string
  position: [number, number]
}

interface N8nConnectionTarget {
  node:  string
  type:  string
  index: number
}

interface N8nWorkflowJSON {
  name:        string
  nodes:       N8nNode[]
  connections: Record<string, { main: N8nConnectionTarget[][] }>
}

// ---------------------------------------------------------------------------
// Parser
// n8n uses screen-space coords (x right, y down).
// We map to 3D: x right, y up (flipped), z = 0.
// positionScale shrinks the large pixel values to world units.
// ---------------------------------------------------------------------------

export function parseN8nWorkflow(
  json:          N8nWorkflowJSON,
  positionScale: number = 0.008,
): WorkflowGraph {
  const nodeByName = new Map<string, WorkflowNode>()

  for (const n of json.nodes) {
    nodeByName.set(n.name, {
      id:    n.id,
      label: n.name,
      type:  n.type,
      position: [
        n.position[0] * positionScale,
        n.position[1] * -positionScale, // flip Y
        0,
      ],
    })
  }

  const edges: WorkflowEdge[] = []

  for (const [fromName, conns] of Object.entries(json.connections)) {
    if (!nodeByName.has(fromName)) continue
    for (const outputGroup of conns.main) {
      for (const target of outputGroup) {
        if (nodeByName.has(target.node)) {
          edges.push({ from: fromName, to: target.node })
        }
      }
    }
  }

  return {
    name:  json.name,
    nodes: Array.from(nodeByName.values()),
    edges,
  }
}
