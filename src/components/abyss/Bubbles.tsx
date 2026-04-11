'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const VERT = /* glsl */`
  uniform float uTime;
  attribute float aOffset;
  attribute float aRiseSpeed;
  attribute float aWobble;
  attribute float aSize;

  void main() {
    vec3 pos = position;

    // Rising motion: each bubble climbs 12 world units, wraps back to bottom
    float rangeY = 12.0;
    pos.y = -1.0 + mod(uTime * aRiseSpeed + aOffset * rangeY, rangeY);

    // Gentle horizontal wobble as they rise
    pos.x += sin(uTime * 0.9 + aOffset * 6.283) * aWobble;
    pos.z += cos(uTime * 0.6 + aOffset * 4.189) * aWobble * 0.35;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = aSize * (300.0 / -mvPos.z);
  }
`

const FRAG = /* glsl */`
  uniform float uOpacity;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r  = length(uv);
    if (r > 0.5) discard;

    // Hollow sphere look: bright rim, near-transparent core
    float rim  = smoothstep(0.30, 0.47, r);
    float core = (1.0 - smoothstep(0.0, 0.30, r)) * 0.15;

    // Small highlight offset to upper-left (light from above)
    float highlight = smoothstep(0.22, 0.0, length(uv - vec2(-0.12, 0.14)));

    float alpha = (rim * 0.6 + core + highlight * 0.28) * uOpacity;

    vec3 col = mix(vec3(0.60, 0.88, 1.0), vec3(1.0, 1.0, 1.0), rim + highlight * 0.6);

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`

interface BubblesProps {
  count?:       number
  progressRef:  React.MutableRefObject<number>
}

export function Bubbles({ count = 42, progressRef }: BubblesProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const [geo, mat] = useMemo(() => {
    const g         = new THREE.BufferGeometry()
    const pos       = new Float32Array(count * 3)
    const offset    = new Float32Array(count)
    const riseSpeed = new Float32Array(count)
    const wobble    = new Float32Array(count)
    const size      = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 12   // X: -6 to 6
      pos[i * 3 + 1] = 0                              // Y overridden by shader
      pos[i * 3 + 2] = Math.random() * 14 - 3         // Z: -3 to 11
      offset[i]      = Math.random()                   // phase 0–1
      riseSpeed[i]   = 0.5 + Math.random() * 1.0      // 0.5–1.5 units/sec
      wobble[i]      = 0.1 + Math.random() * 0.35     // 0.1–0.45 amplitude
      size[i]        = 4 + Math.random() * 9           // point radius
    }

    g.setAttribute('position',   new THREE.BufferAttribute(pos,       3))
    g.setAttribute('aOffset',    new THREE.BufferAttribute(offset,    1))
    g.setAttribute('aRiseSpeed', new THREE.BufferAttribute(riseSpeed, 1))
    g.setAttribute('aWobble',    new THREE.BufferAttribute(wobble,    1))
    g.setAttribute('aSize',      new THREE.BufferAttribute(size,      1))

    const m = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime:    { value: 0 },
        uOpacity: { value: 1 },
      },
      blending:    THREE.NormalBlending,
      depthWrite:  false,
      transparent: true,
    })

    return [g, m] as const
  }, [count])

  useFrame(({ clock }) => {
    if (!matRef.current) return
    matRef.current.uniforms.uTime.value    = clock.getElapsedTime()
    matRef.current.uniforms.uOpacity.value = Math.max(0, 1 - progressRef.current / 0.15)
  })

  return (
    <points>
      <primitive object={geo} attach="geometry" />
      <primitive object={mat} attach="material" ref={matRef} />
    </points>
  )
}
