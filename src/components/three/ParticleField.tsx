'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 3000
const SPREAD_XY = 25
const SPREAD_Z = 14

export function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null)

  const { velocities, geometry, material } = useMemo(() => {
    const positions  = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = new Float32Array(PARTICLE_COUNT * 3)
    const alphas     = new Float32Array(PARTICLE_COUNT)
    const sizes      = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      // Random positions scattered through the volume
      positions[i3]     = (Math.random() - 0.5) * SPREAD_XY
      positions[i3 + 1] = (Math.random() - 0.5) * SPREAD_XY
      positions[i3 + 2] = (Math.random() - 0.5) * SPREAD_Z

      // Random 3D drift velocity — cubic bias toward near-zero (suspended in space)
      const speed = Math.pow(Math.random(), 2.5) * 0.0022 + 0.00004
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      velocities[i3]     = Math.sin(phi) * Math.cos(theta) * speed
      velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed
      velocities[i3 + 2] = Math.cos(phi) * speed

      // Distribution: fine dim dust only — subtle background texture
      const r = Math.random()
      if (r < 0.82) {
        // Fine cosmic dust — barely perceptible
        alphas[i] = 0.02 + Math.random() * 0.05
        sizes[i]  = 0.2  + Math.random() * 0.4
      } else if (r < 0.97) {
        // Mid-range specks
        alphas[i] = 0.06 + Math.random() * 0.08
        sizes[i]  = 0.4  + Math.random() * 0.6
      } else {
        // Occasional slightly brighter dot (~3%) — still very small
        alphas[i] = 0.12 + Math.random() * 0.10
        sizes[i]  = 0.6  + Math.random() * 0.6
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('a_alpha',  new THREE.BufferAttribute(alphas, 1))
    geometry.setAttribute('a_size',   new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_color: { value: new THREE.Color('#c8d0e8') },
      },
      vertexShader: /* glsl */`
        attribute float a_alpha;
        attribute float a_size;
        varying float v_alpha;

        void main() {
          v_alpha = a_alpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = a_size * (120.0 / -mv.z);
          gl_Position  = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */`
        uniform vec3 u_color;
        varying float v_alpha;

        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          if (d > 1.0) discard;
          // Soft glow falloff — brighter at center, fades to edge
          float soft = 1.0 - smoothstep(0.0, 1.0, d);
          gl_FragColor = vec4(u_color, v_alpha * soft);
        }
      `,
      transparent: true,
      depthWrite: false,
    })

    return { velocities, geometry, material }
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return

    const pos  = pointsRef.current.geometry.attributes.position.array as Float32Array
    const t    = state.clock.elapsedTime
    const hXY  = SPREAD_XY / 2
    const hZ   = SPREAD_Z  / 2

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      // Drift + near-imperceptible wander (no directional bias)
      pos[i3]     += velocities[i3]     + Math.sin(t * 0.07 + i * 0.19) * 0.00005
      pos[i3 + 1] += velocities[i3 + 1] + Math.cos(t * 0.05 + i * 0.11) * 0.00005
      pos[i3 + 2] += velocities[i3 + 2]

      // Wrap — particles that drift out reappear on the opposite side
      if (pos[i3]     >  hXY) pos[i3]     = -hXY
      if (pos[i3]     < -hXY) pos[i3]     =  hXY
      if (pos[i3 + 1] >  hXY) pos[i3 + 1] = -hXY
      if (pos[i3 + 1] < -hXY) pos[i3 + 1] =  hXY
      if (pos[i3 + 2] >  hZ)  pos[i3 + 2] = -hZ
      if (pos[i3 + 2] < -hZ)  pos[i3 + 2] =  hZ
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true

    // Barely perceptible slow rotation — adds depth without calling attention
    pointsRef.current.rotation.y = t * 0.006
    pointsRef.current.rotation.x = Math.sin(t * 0.03) * 0.025
  })

  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  )
}
