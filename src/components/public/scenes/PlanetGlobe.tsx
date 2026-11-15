import { useEffect, useRef } from 'react'
import { densityForWidth, MOTION, readThemeDark, SPACE } from '../../../motion/tokens'
import { useSceneLifecycle } from '../../../hooks/useSceneLifecycle'

type Props = { playing: boolean; reduced: boolean }

type OrbitDot = {
  speed: number
  phase: number
  color: string
  trail: number
  rx: number
  ry: number
  rot: number
  satellite?: boolean
}
type Star = { x: number; y: number; r: number; tw: number; z: number }

function buildWorldMap(w = 960, h = 480) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const ocean = ctx.createLinearGradient(0, 0, 0, h)
  ocean.addColorStop(0, '#0f3d62')
  ocean.addColorStop(0.4, '#1a6a8c')
  ocean.addColorStop(0.7, '#187896')
  ocean.addColorStop(1, '#0d3554')
  ctx.fillStyle = ocean
  ctx.fillRect(0, 0, w, h)

  // Profundidad oceánica
  ctx.fillStyle = 'rgba(8, 40, 70, 0.35)'
  for (let i = 0; i < 30; i += 1) {
    ctx.beginPath()
    ctx.ellipse(Math.random() * w, 80 + Math.random() * (h - 160), 40 + Math.random() * 90, 12 + Math.random() * 24, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  const land = (points: Array<[number, number]>, color: string) => {
    ctx.beginPath()
    points.forEach(([lon, lat], i) => {
      const x = ((lon + 180) / 360) * w
      const y = ((90 - lat) / 180) * h
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }

  const g = '#3a9a6c'
  const g2 = '#52b87f'
  const g3 = '#2d7a55'
  land([[-168, 66], [-140, 70], [-100, 72], [-60, 72], [-50, 60], [-55, 48], [-80, 28], [-100, 22], [-120, 32], [-140, 50], [-160, 58]], g)
  land([[-125, 50], [-105, 42], [-95, 30], [-110, 25], [-125, 35]], g3)
  land([[-90, 18], [-75, 12], [-70, -5], [-78, -22], [-68, -45], [-52, -55], [-70, -52], [-88, -25], [-95, 5]], g2)
  land([[-12, 58], [8, 62], [30, 66], [42, 55], [28, 45], [5, 42], [-8, 48]], g)
  land([[-18, 36], [12, 38], [38, 32], [48, 8], [42, -22], [28, -34], [12, -8], [-5, 12]], '#469868')
  land([[48, 72], [90, 74], [130, 68], [150, 52], [140, 30], [110, 22], [85, 28], [60, 42], [50, 58]], g)
  land([[95, 40], [120, 35], [135, 25], [125, 18], [100, 22]], g3)
  land([[112, -12], [148, -14], [154, -28], [140, -40], [118, -32]], g2)
  land([[165, -35], [178, -38], [175, -48], [165, -45]], g3)
  land([[-55, 82], [-25, 84], [-10, 74], [-40, 70]], '#e8eef5')
  land([[-180, -70], [180, -70], [180, -90], [-180, -90]], '#edf3f8')

  // Nubes
  const clouds = document.createElement('canvas')
  clouds.width = w
  clouds.height = h
  const cctx = clouds.getContext('2d')
  if (cctx) {
    cctx.fillStyle = 'rgba(255,255,255,0.16)'
    for (let i = 0; i < 55; i += 1) {
      cctx.beginPath()
      cctx.ellipse(Math.random() * w, Math.random() * h * 0.7, 24 + Math.random() * 70, 8 + Math.random() * 16, Math.random() * 0.8, 0, Math.PI * 2)
      cctx.fill()
    }
    ctx.drawImage(clouds, 0, 0)
  }

  return canvas
}

/**
 * Globo grande del hero HELIOS (Canvas 2D propio).
 * Mapeo esférico por bandas + órbitas + satélite.
 */
export function PlanetGlobe({ playing, reduced }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { ref: hostRef, node: host, running } = useSceneLifecycle(playing && !reduced)
  const pointer = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !host || reduced) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const map = buildWorldMap()
    let raf = 0
    let w = 0
    let h = 0
    let spinPx = 0
    let cloudDrift = 0
    let ambient = 0
    let last = performance.now()
    const orbits: OrbitDot[] = [
      { speed: 0.7, phase: 0.4, color: SPACE.accent, trail: 16, rx: 1.22, ry: 0.38, rot: -0.42 },
      { speed: 0.42, phase: 1.8, color: SPACE.turquoise, trail: 20, rx: 1.42, ry: 0.48, rot: 0.32, satellite: true },
      { speed: 0.28, phase: 3.1, color: SPACE.softLilac, trail: 22, rx: 1.62, ry: 0.56, rot: -0.18 },
    ]
    const stars: Star[] = []
    const links: Array<{ a: number; b: number; phase: number }> = [
      { a: 0, b: 1, phase: 0 },
      { a: 1, b: 2, phase: 1.2 },
    ]

    const resize = () => {
      const rect = host.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, MOTION.dprCap)
      w = Math.max(1, Math.floor(rect.width))
      h = Math.max(1, Math.floor(rect.height))
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      stars.length = 0
      const count = Math.floor(140 * densityForWidth(w))
      for (let i = 0; i < count; i += 1) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.5 + Math.random() * 1.8,
          tw: Math.random() * Math.PI * 2,
          z: 0.2 + Math.random() * 0.8,
        })
      }
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const rect = host.getBoundingClientRect()
      pointer.current.x = (event.clientX - rect.left) / Math.max(rect.width, 1)
      pointer.current.y = (event.clientY - rect.top) / Math.max(rect.height, 1)
    }
    const onLeave = () => {
      pointer.current.x = 0.5
      pointer.current.y = 0.5
    }

    const drawSphere = (cx: number, cy: number, radius: number) => {
      const bands = Math.max(72, Math.floor(radius * 1.35))
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.clip()

      for (let i = 0; i < bands; i += 1) {
        const ny = (i / (bands - 1)) * 2 - 1
        const half = Math.sqrt(Math.max(0, 1 - ny * ny))
        if (half < 0.01) continue
        const y = cy + ny * radius
        const width = half * radius * 2
        const lat = Math.asin(Math.max(-1, Math.min(1, ny)))
        const v = 0.5 - lat / Math.PI
        const sy = Math.max(0, Math.min(map.height - 1, Math.floor(v * map.height)))
        const destX = cx - width / 2
        // Compresión perspectival: muestrear menos del mapa en los polos ya está en half
        const srcW = map.width
        const sx = ((spinPx % map.width) + map.width) % map.width
        ctx.drawImage(map, sx, sy, srcW - sx, 1, destX, y, width * ((srcW - sx) / srcW), Math.ceil((radius * 2) / bands) + 1)
        if (sx > 0) {
          ctx.drawImage(map, 0, sy, sx, 1, destX + width * ((srcW - sx) / srcW), y, width * (sx / srcW), Math.ceil((radius * 2) / bands) + 1)
        }
      }

      // Capa de nubes desplazada
      ctx.globalAlpha = 0.22
      for (let i = 0; i < bands; i += 8) {
        const ny = (i / (bands - 1)) * 2 - 1
        const half = Math.sqrt(Math.max(0, 1 - ny * ny))
        if (half < 0.05) continue
        const y = cy + ny * radius
        const width = half * radius * 2
        const lat = Math.asin(Math.max(-1, Math.min(1, ny)))
        const v = 0.5 - lat / Math.PI
        const sy = Math.max(0, Math.min(map.height - 1, Math.floor(v * map.height)))
        const sx = ((spinPx * 0.65 + cloudDrift) % map.width + map.width) % map.width
        ctx.drawImage(map, sx, sy, 40, 1, cx - width / 2, y, width, 2)
      }
      ctx.globalAlpha = 1

      const shade = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy)
      shade.addColorStop(0, 'rgba(6,10,22,0.62)')
      shade.addColorStop(0.38, 'rgba(6,10,22,0.08)')
      shade.addColorStop(0.62, 'rgba(255,255,255,0.1)')
      shade.addColorStop(1, 'rgba(6,10,22,0.5)')
      ctx.fillStyle = shade
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)

      const gloss = ctx.createRadialGradient(cx - radius * 0.38, cy - radius * 0.42, 0, cx, cy, radius)
      gloss.addColorStop(0, 'rgba(255,255,255,0.38)')
      gloss.addColorStop(0.3, 'rgba(255,255,255,0.1)')
      gloss.addColorStop(1, 'transparent')
      ctx.fillStyle = gloss
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
      ctx.restore()
    }

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const dark = readThemeDark()
      const animate = playing && running
      if (animate) {
        spinPx = (spinPx + map.width * 0.045 * dt) % map.width
        cloudDrift = (cloudDrift + map.width * 0.02 * dt) % map.width
        ambient += dt * 0.7
      }

      ctx.clearRect(0, 0, w, h)

      // Nebulosas profundas
      const g1 = ctx.createRadialGradient(w * 0.2, h * 0.2, 0, w * 0.2, h * 0.2, w * 0.55)
      g1.addColorStop(0, dark ? 'rgba(184,166,232,0.28)' : 'rgba(184,166,232,0.4)')
      g1.addColorStop(1, 'transparent')
      ctx.fillStyle = g1
      ctx.fillRect(0, 0, w, h)
      const g2 = ctx.createRadialGradient(w * 0.85, h * 0.75, 0, w * 0.85, h * 0.75, w * 0.5)
      g2.addColorStop(0, dark ? 'rgba(245,0,79,0.16)' : 'rgba(247,220,230,0.38)')
      g2.addColorStop(1, 'transparent')
      ctx.fillStyle = g2
      ctx.fillRect(0, 0, w, h)
      const g3 = ctx.createRadialGradient(w * 0.55, h * 0.45, 0, w * 0.55, h * 0.45, w * 0.35)
      g3.addColorStop(0, dark ? 'rgba(126,214,195,0.14)' : 'rgba(205,235,221,0.3)')
      g3.addColorStop(1, 'transparent')
      ctx.fillStyle = g3
      ctx.fillRect(0, 0, w, h)

      const parallaxX = (pointer.current.x - 0.5) * 28
      const parallaxY = (pointer.current.y - 0.5) * 18
      for (const star of stars) {
        if (animate) star.tw += 0.035 * star.z
        const a = 0.28 + Math.abs(Math.sin(star.tw)) * 0.6
        ctx.fillStyle = `rgba(255,255,255,${a})`
        ctx.beginPath()
        ctx.arc(star.x + parallaxX * star.z, star.y + parallaxY * star.z, star.r * star.z, 0, Math.PI * 2)
        ctx.fill()
      }

      const tiltX = (pointer.current.y - 0.5) * 12
      const tiltY = (pointer.current.x - 0.5) * 14
      const cx = w * 0.54 + tiltY * 1.6
      const cy = h * 0.52 + tiltX * 1.2
      // Planeta grande: ~52% del lado menor
      const radius = Math.min(w, h) * 0.52

      // Atmósfera amplia
      const atm = ctx.createRadialGradient(cx, cy, radius * 0.75, cx, cy, radius * 1.38)
      atm.addColorStop(0, 'transparent')
      atm.addColorStop(0.55, dark ? 'rgba(126,214,195,0.18)' : 'rgba(205,235,221,0.35)')
      atm.addColorStop(0.82, dark ? 'rgba(184,166,232,0.28)' : 'rgba(183,166,232,0.4)')
      atm.addColorStop(1, 'transparent')
      ctx.fillStyle = atm
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 1.38, 0, Math.PI * 2)
      ctx.fill()

      drawSphere(cx, cy, radius)

      ctx.strokeStyle = dark ? 'rgba(205,235,221,0.45)' : 'rgba(255,255,255,0.55)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.stroke()

      const bodyPos: Array<{ x: number; y: number }> = []
      for (const orbit of orbits) {
        if (animate) orbit.phase += orbit.speed * dt
        const rx = radius * orbit.rx
        const ry = radius * orbit.ry
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(orbit.rot + tiltY * 0.01)
        ctx.strokeStyle = dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.38)'
        ctx.lineWidth = 1.4
        ctx.setLineDash([6, 8])
        ctx.beginPath()
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])

        for (let k = orbit.trail; k >= 0; k -= 1) {
          const t = orbit.phase - k * 0.06
          const px = Math.cos(t) * rx
          const py = Math.sin(t) * ry
          ctx.globalAlpha = Math.max(0.08, 1 - k / (orbit.trail + 1))
          ctx.fillStyle = orbit.color
          ctx.beginPath()
          ctx.arc(px, py, k === 0 ? (orbit.satellite ? 5 : 3.8) : 2.2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
        if (orbit.satellite) {
          const sx = Math.cos(orbit.phase) * rx
          const sy = Math.sin(orbit.phase) * ry
          ctx.fillStyle = '#fff'
          ctx.fillRect(sx - 5, sy - 2, 10, 4)
          ctx.fillStyle = orbit.color
          ctx.fillRect(sx + 4, sy - 5, 3, 10)
          bodyPos.push({ x: cx + sx * Math.cos(orbit.rot) - sy * Math.sin(orbit.rot), y: cy + sx * Math.sin(orbit.rot) + sy * Math.cos(orbit.rot) })
        } else {
          const px = Math.cos(orbit.phase) * rx
          const py = Math.sin(orbit.phase) * ry
          bodyPos.push({
            x: cx + px * Math.cos(orbit.rot) - py * Math.sin(orbit.rot),
            y: cy + px * Math.sin(orbit.rot) + py * Math.cos(orbit.rot),
          })
        }
        ctx.restore()
      }

      // Enlaces entre nodos orbitales
      ctx.lineWidth = 1
      for (const link of links) {
        if (animate) link.phase += dt
        const a = bodyPos[link.a]
        const b = bodyPos[link.b]
        if (!a || !b) continue
        const pulse = 0.25 + Math.abs(Math.sin(link.phase * 2)) * 0.45
        ctx.strokeStyle = `rgba(245,0,79,${pulse})`
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.quadraticCurveTo(cx, cy - radius * 0.2, b.x, b.y)
        ctx.stroke()
      }

      const pulse = 0.5 + Math.sin(ambient) * 0.5
      ctx.fillStyle = dark ? `rgba(126,214,195,${0.05 + pulse * 0.06})` : `rgba(245,0,79,${0.04 + pulse * 0.05})`
      ctx.beginPath()
      ctx.arc(cx, cy, radius * (1.45 + pulse * 0.05), 0, Math.PI * 2)
      ctx.fill()

      raf = requestAnimationFrame(draw)
    }

    resize()
    raf = requestAnimationFrame(draw)
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
    }
  }, [host, playing, reduced, running])

  return (
    <div className="planet-host" ref={hostRef}>
      {reduced ? (
        <div className="planet-static" aria-hidden="true">
          <div className="planet-static-orb" />
          <div className="planet-static-ring" />
          <div className="planet-static-ring ring-b" />
        </div>
      ) : (
        <canvas ref={canvasRef} className="planet-canvas" aria-hidden="true" />
      )}
    </div>
  )
}
