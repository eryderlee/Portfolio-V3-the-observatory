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
}

export const DIMENSIONS: Dimension[] = [
  {
    id: 'observatory',
    name: 'The Observatory',
    label: 'Hub',
    description: 'The space between spaces',
    accentColor: '#a0a8c0',
  },
  {
    id: 'core',
    name: 'The Core',
    label: 'About',
    description: 'Where all paths converge',
    accentColor: '#daa520',
  },
  {
    id: 'celestial',
    name: 'The Celestial Realm',
    label: 'Celestial',
    description: 'Where craft becomes art',
    accentColor: '#daa520',
  },
  {
    id: 'abyss',
    name: 'The Abyss',
    label: 'Abyss',
    description: 'Depth without limit',
    accentColor: '#00c8b4',
  },
  {
    id: 'convergence',
    name: 'The Convergence',
    label: 'Convergence',
    description: 'Neither here nor there',
    accentColor: '#9664ff',
  },
  {
    id: 'codex',
    name: 'The Codex',
    label: 'Codex',
    description: 'Knowledge made permanent',
    accentColor: '#c89632',
  },
  {
    id: 'signal',
    name: 'The Signal',
    label: 'Signal',
    description: 'Transmission in progress',
    accentColor: '#ff2233',
  },
  {
    id: 'archive',
    name: 'The Archive',
    label: 'Archive',
    description: 'What remains',
    accentColor: '#8888aa',
  },
]
