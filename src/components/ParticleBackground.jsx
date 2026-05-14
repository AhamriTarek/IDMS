import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const PARTICLE_COUNT = 120
const CONNECTION_DISTANCE = 130
const MOUSE_STRENGTH = 0.06

export default function ParticleBackground({ className = '' }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // ── Scene setup ─────────────────────────────────────────────────────────
    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    camera.position.z = 280

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // ── Particles ────────────────────────────────────────────────────────────
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = []
    const spread = 280

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * spread * 2
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 1.2
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread

      velocities.push({
        x: (Math.random() - 0.5) * 0.18,
        y: (Math.random() - 0.5) * 0.18,
        z: (Math.random() - 0.5) * 0.06,
      })
    }

    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const particleMat = new THREE.PointsMaterial({
      color: 0x00D4FF,
      size: 2.2,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
    })

    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // ── Connection lines ─────────────────────────────────────────────────────
    // Max connections = n*(n-1)/2 but we cap geometry to avoid buffer overflow
    const maxLines  = PARTICLE_COUNT * 8
    const linePositions = new Float32Array(maxLines * 6)
    const lineGeo   = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))

    const lineMat = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({ color: 0x00D4FF, transparent: true, opacity: 0.12 })
    )
    scene.add(lineMat)

    // ── Mouse tracking ───────────────────────────────────────────────────────
    const mouse = { x: 0, y: 0 }
    const handleMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', handleMouseMove)

    // ── Resize ───────────────────────────────────────────────────────────────
    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // ── Animation loop ───────────────────────────────────────────────────────
    let frameId
    const pos = particleGeo.attributes.position.array

    const animate = () => {
      frameId = requestAnimationFrame(animate)

      // Move particles
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2
        pos[ix] += velocities[i].x
        pos[iy] += velocities[i].y
        pos[iz] += velocities[i].z

        // Bounce off bounding box
        if (Math.abs(pos[ix]) > spread)     velocities[i].x *= -1
        if (Math.abs(pos[iy]) > spread * 0.6) velocities[i].y *= -1
        if (Math.abs(pos[iz]) > spread * 0.5) velocities[i].z *= -1
      }
      particleGeo.attributes.position.needsUpdate = true

      // Rebuild connection lines
      let lineIdx = 0
      for (let a = 0; a < PARTICLE_COUNT && lineIdx < maxLines - 1; a++) {
        for (let b = a + 1; b < PARTICLE_COUNT && lineIdx < maxLines - 1; b++) {
          const dx = pos[a*3]   - pos[b*3]
          const dy = pos[a*3+1] - pos[b*3+1]
          const dz = pos[a*3+2] - pos[b*3+2]
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
          if (dist < CONNECTION_DISTANCE) {
            linePositions[lineIdx*6]   = pos[a*3];   linePositions[lineIdx*6+1] = pos[a*3+1]; linePositions[lineIdx*6+2] = pos[a*3+2]
            linePositions[lineIdx*6+3] = pos[b*3];   linePositions[lineIdx*6+4] = pos[b*3+1]; linePositions[lineIdx*6+5] = pos[b*3+2]
            lineIdx++
          }
        }
      }
      lineGeo.setDrawRange(0, lineIdx * 2)
      lineGeo.attributes.position.needsUpdate = true

      // Mouse parallax
      camera.position.x += (mouse.x * 30 - camera.position.x) * MOUSE_STRENGTH
      camera.position.y += (-mouse.y * 20 - camera.position.y) * MOUSE_STRENGTH
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  )
}
