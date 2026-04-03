'use client'

import dynamic from 'next/dynamic'

// Three.js requires browser APIs — must be loaded client-side only
const Scene = dynamic(() => import('./Scene'), {
  ssr: false,
  loading: () => null,
})

export function SceneWrapper() {
  return <Scene />
}
