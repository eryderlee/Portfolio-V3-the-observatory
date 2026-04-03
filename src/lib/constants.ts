// src/lib/constants.ts

export type DimensionId =
  | 'observatory'
  | 'core'
  | 'celestial'
  | 'abyss'
  | 'convergence'
  | 'codex'
  | 'signal'
  | 'archive'

export interface Dimension {
  id: DimensionId
  name: string
  label: string
  description: string
  accentColor: string
  thresholdText: string
}

export const DIMENSIONS: Dimension[] = [
  {
    id: 'observatory',
    name: 'The Observatory',
    label: 'Hub',
    description: 'The space between spaces',
    accentColor: '#a0a8c0',
    thresholdText: 'Step Into The Observatory',
  },
  {
    id: 'core',
    name: 'The Core',
    label: 'About',
    description: 'Where all paths converge',
    accentColor: '#daa520',
    thresholdText: 'Enter The Core',
  },
  {
    id: 'celestial',
    name: 'The Celestial Realm',
    label: 'Celestial',
    description: 'Where craft becomes art',
    accentColor: '#daa520',
    thresholdText: 'Ascend to The Celestial Realm',
  },
  {
    id: 'abyss',
    name: 'The Abyss',
    label: 'Abyss',
    description: 'Depth without limit',
    accentColor: '#00c8b4',
    thresholdText: 'Descend into The Abyss',
  },
  {
    id: 'convergence',
    name: 'The Convergence',
    label: 'Convergence',
    description: 'Neither here nor there',
    accentColor: '#9664ff',
    thresholdText: 'Where Realities Collide',
  },
  {
    id: 'codex',
    name: 'The Codex',
    label: 'Codex',
    description: 'Knowledge made permanent',
    accentColor: '#c89632',
    thresholdText: 'Unseal The Codex',
  },
  {
    id: 'signal',
    name: 'The Signal',
    label: 'Signal',
    description: 'Transmission in progress',
    accentColor: '#ff2233',
    thresholdText: 'Tune In to The Signal',
  },
  {
    id: 'archive',
    name: 'The Archive',
    label: 'Archive',
    description: 'What remains',
    accentColor: '#8888aa',
    thresholdText: 'Echoes of Past Realities',
  },
]
