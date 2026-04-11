'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Tiny rising air bubbles — champagne-speck size, drift upward slowly
const VERT = /* glsl */ `
  uniform float uTime;
  attribute float aOffset;
  attribute float aSpeed;
  attribute float aSize;

  void main() {
    vec3 pos = position;

    // Cycle upward through a fixed range, staggered by aOffset
    float cycleT = mod(uTime * aSpeed + aOffset, 1.0);
    pos.y += (cycleT - 0.5) * 10.0;

    // Slight wobble side-to-side as real bubbles do
    pos.x += sin(uTime * 0.28 + aOffset * 6.28) * 0.10;
    pos.z += cos(uTime * 0.21 + aOffset * 4.19) * 0.07;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;

    // Perspective-correct; small base size so they read as specks
    gl_PointSize = aSize * (180.0 / -mvPos.z);
  }
`

const FRAG = /* glsl */ `
  uniform float uOpacity;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r  = length(uv);
    if (r > 0.5) discard;

    // Soft bright speck — quick falloff, very light blue-white
    float alpha = 1.0 - smoothstep(0.08, 0.5, r);
    alpha *= alpha * 0.65;

    gl_FragColor = vec4(0.88, 0.97, 1.0, alpha * uOpacity);
  }
`

interface BubblesProps {
  count?:       number
  spread?:      [number, number, number]
  position?:    [number, number, number]
  progressRef?: React.MutableRefObject<number>
}

export function Bubbles({
  count       = 28,
  spread      = [20, 7, 18],
  position    = [0, 0, -2],
  progressRef,
}: BubblesProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const [geo, mat] = useMemo(() => {
    const g      = new THREE.BufferGeometry()
    const pos    = new Float32Array(count * 3)
    const offset = new Float32Array(count)
    const speed  = new Float32Array(count)
    const size   = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * spread[0]
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread[1]
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread[2]
      // Stagger phases so they don't all teleport at once
      offset[i]      = Math.random()
      // 14–26 second rise cycle — lazy and natural
      speed[i]       = 0.038 + Math.random() * 0.038
      // Tiny: 0.55–1.35 (champagne-speck scale)
      size[i]        = 0.55 + Math.random() * 0.80
    }

    g.setAttribute('position', new THREE.BufferAttribute(pos,    3))
    g.setAttribute('aOffset',  new THREE.BufferAttribute(offset, 1))
    g.setAttribute('aSpeed',   new THREE.BufferAttribute(speed,  1))
    g.setAttribute('aSize',    new THREE.BufferAttribute(size,   1))

    const m = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime:    { value: 0 },
        uOpacity: { value: 1.0 },
      },
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
      transparent: true,
    })

    return [g, m] as const
  }, [count, spread])

  useFrame(({ clock }) => {
    if (!matRef.current) return
    matRef.current.uniforms.uTime.value = clock.getElapsedTime()

    // Fade out as the camera descends past the first ~20% of depth
    if (progressRef) {
      const p    = progressRef.current
      const fade = Math.max(0, 1 - p / 0.20)
      matRef.current.uniforms.uOpacity.value = fade
    }
  })

  return (
    <points position={position}>
      <primitive object={geo} attach="geometry" />
      <primitive object={mat} attach="material" ref={matRef} />
    </points>
  )
}
