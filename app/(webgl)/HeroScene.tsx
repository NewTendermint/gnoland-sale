"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"

/**
 * First WebGL example for the Hero window: a voxel cluster on a transparent
 * canvas, desktop-only, driven by native `.screen` scroll. As the window crosses
 * the viewport the cluster rotates a little and drifts vertically inside the
 * window (internal parallax). Value-lerped, render-on-demand: the loop runs only
 * while scrolling/settling and only while the window is visible, so it is 0 GPU
 * at rest -> no fans. The real .vox scene + ambient sway come later.
 * See docs/specs/2026-06-04-webgl-motion-system-design.md.
 */

// Tunable knobs.
const TURNS = 0 // full turns across the window transit (0 = no rotation for now)
const INTERNAL_PARALLAX = 0 // vertical drift inside the window, world units
const MODEL_SCALE = 1.2 // model size
const MODEL_Y = 0 // vertical offset of the model in the window
// Static scene (both 0) -> skip the scroll listener entirely (no work on scroll).
const SCENE_MOTION = TURNS !== 0 || INTERNAL_PARALLAX !== 0

function ScrollDriven({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null)
  const invalidate = useThree((s) => s.invalidate)
  const gl = useThree((s) => s.gl)
  const target = useRef(0) // transit 0..1
  const current = useRef(0)

  useEffect(() => {
    const screen = document.querySelector<HTMLElement>(".screen")
    if (!screen) return
    const canvas = gl.domElement
    let first = true
    const compute = () => {
      const sr = screen.getBoundingClientRect()
      const r = canvas.getBoundingClientRect()
      // Skip work entirely when the window is off-screen (no wasted frames).
      if (r.bottom <= sr.top || r.top >= sr.bottom) return
      const vh = screen.clientHeight
      const top = r.top - sr.top
      // transit: 0 when the window just enters (top at viewport bottom),
      // 1 when it just exits (bottom at viewport top).
      const transit = vh > 0 ? (vh - top) / (vh + r.height) : 0
      target.current = Math.min(1, Math.max(0, transit))
      if (first) {
        current.current = target.current // snap on first read (no spin-up on load)
        first = false
      }
      invalidate()
    }
    compute()
    screen.addEventListener("scroll", compute, { passive: true })
    window.addEventListener("resize", compute, { passive: true })
    return () => {
      screen.removeEventListener("scroll", compute)
      window.removeEventListener("resize", compute)
    }
  }, [gl, invalidate])

  useFrame(() => {
    current.current += (target.current - current.current) * 0.1
    const g = group.current
    if (g) {
      const t = current.current
      g.rotation.y = t * Math.PI * 2 * TURNS // gentle spin across the transit
      g.position.y = (t - 0.5) * INTERNAL_PARALLAX // internal parallax (drift in-window)
    }
    // Keep rendering until the lerp has settled, then stop (idle = 0 GPU).
    if (Math.abs(target.current - current.current) > 0.0005) invalidate()
  })

  return <group ref={group}>{children}</group>
}

function VoxelCluster() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const invalidate = useThree((s) => s.invalidate)
  const geometry = useMemo(() => new THREE.BoxGeometry(0.9, 0.9, 0.9), [])
  const material = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), [])

  const instances = useMemo(() => {
    const out: { x: number; y: number; z: number; color: THREE.Color }[] = []
    const n = 5
    for (let x = 0; x < n; x++) {
      for (let z = 0; z < n; z++) {
        const h = 1 + Math.round(Math.abs(Math.sin(x * 1.1) + Math.cos(z * 0.7)) * 2)
        for (let y = 0; y < h; y++) {
          out.push({
            x: x - (n - 1) / 2,
            y: y - 1,
            z: z - (n - 1) / 2,
            color: new THREE.Color().setHSL(0.43, 0.5, 0.45 + (y / 4) * 0.25),
          })
        }
      }
    }
    return out
  }, [])

  useEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    instances.forEach((it, i) => {
      m.makeTranslation(it.x, it.y, it.z)
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, it.color)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    invalidate()
  }, [instances, invalidate])

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, instances.length]}
      rotation={[0.35, 0, 0]}
      scale={MODEL_SCALE}
      position={[0, MODEL_Y, 0]}
    />
  )
}

export function HeroScene() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let webgl = false
    try {
      webgl = Boolean(document.createElement("canvas").getContext("webgl2"))
    } catch {
      webgl = false
    }
    setEnabled(!touch && !reduced && webgl)
  }, [])

  if (!enabled) return null

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [5, 4, 7], fov: 35 }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {SCENE_MOTION ? (
        <ScrollDriven>
          <VoxelCluster />
        </ScrollDriven>
      ) : (
        <VoxelCluster />
      )}
    </Canvas>
  )
}
