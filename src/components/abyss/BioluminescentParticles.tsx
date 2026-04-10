'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const VERT = /* glsl */ `
  uniform float uTime;
  attribute float aOffset;
  attribute float aSpeed;
  attribute float aSize;

  void main() {
    vec3 pos = position;

    // Layered sine waves — organic bioluminescent drift
    float driftX = sin(uTime * aSpeed        + aOffset)        * 0.45
                 + sin(uTime * aSpeed * 0.71 + aOffset * 1.37) * 0.25
                 + sin(uTime * aSpeed * 0.38 + aOffset * 2.14) * 0.12;
    float driftY = cos(uTime * aSpeed * 0.53 + aOffset * 0.92) * 0.35
                 + cos(uTime * aSpeed * 0.29 + aOffset * 1.68) * 0.20;
    float driftZ = sin(uTime * aSpeed * 0.63 + aOffset * 0.61) * 0.38
                 + sin(uTime * aSpeed * 0.44 + aOffset * 1.22) * 0.18;

    pos.x += driftX;
    pos.y += driftY;
    pos.z += driftZ;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;

    // Perspective-correct point size
    gl_PointSize = aSize * (300.0 / -mvPos.z);
  }
`

const FRAG = /* glsl */ `
  uniform vec3  uColor;
  uniform float uTime;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;

    // Soft glow — tight core, wide halo
    float alpha = 1.0 - smoothstep(0.0, 0.5, r);
    alpha *= alpha;

    // Subtle per-particle pulse from screen position
    float pulse = 0.72 + 0.28 * sin(uTime * 1.6 + gl_FragCoord.x * 0.04 + gl_FragCoord.y * 0.06);

    gl_FragColor = vec4(uColor, alpha * pulse);
  }
`

interface BioluminescentParticlesProps {
  count?:     number
  spread?:    [number, number, number]
  position?:  [number, number, number]
  baseColor?: string
  intensity?: number
}

export function BioluminescentParticles({
  count     = 500,
  spread    = [20, 15, 20],
  position  = [0, 0, 0],
  baseColor = '#00c8b4',
  intensity = 1.0,
}: BioluminescentParticlesProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const [geo, mat] = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos    = new Float32Array(count * 3)
    const offset = new Float32Array(count)
    const speed  = new Float32Array(count)
    const size   = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * spread[0]
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread[1]
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread[2]
      offset[i]      = Math.random() * Math.PI * 2
      speed[i]       = 0.22 + Math.random() * 0.52
      size[i]        = 2.2 + Math.random() * 5.8
    }

    g.setAttribute('position', new THREE.BufferAttribute(pos,    3))
    g.setAttribute('aOffset',  new THREE.BufferAttribute(offset, 1))
    g.setAttribute('aSpeed',   new THREE.BufferAttribute(speed,  1))
    g.setAttribute('aSize',    new THREE.BufferAttribute(size,   1))

    const m = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime:  { value: 0 },
        uColor: { value: new THREE.Color(baseColor) },
      },
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
      transparent: true,
    })

    return [g, m] as const
  }, [count, spread, baseColor])

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime() * intensity
    }
  })

  return (
    <points position={position}>
      <primitive object={geo} attach="geometry" />
      <primitive object={mat} attach="material" ref={matRef} />
    </points>
  )
}
