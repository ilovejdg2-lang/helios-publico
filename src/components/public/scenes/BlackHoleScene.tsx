import { useEffect, useRef } from 'react'
import { densityForWidth, MOTION, readThemeDark, SPACE } from '../../../motion/tokens'
import { useSceneLifecycle } from '../../../hooks/useSceneLifecycle'

type Props = { reduced: boolean; caption?: string }

type Dust = {
  angle: number
  radius: number
  speed: number
  size: number
  color: string
  z: number
}

/**
 * Escena artística de halo / disco de acreción (inspirada visualmente en Black Hole Hero Section).
 * Implementación propia HELIOS en Canvas 2D — no reutiliza el ray-marcher de 21st.dev (API key requerida).
 * Presentada como recurso artístico de exploración espacial, no como modelo físico ni médico.
 */
export function BlackHoleScene({ reduced, caption }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { ref: hostRef, node: host, running } = useSceneLifecycle(!reduced)
  const pointer = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !host || reduced) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    let last = performance.now()
    let swirl = 0
    const dust: Dust[] = []
    const palette = [SPACE.accent, SPACE.rose, SPACE.lilac, SPACE.mint, SPACE.turquoise, SPACE.softLilac]

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
      dust.length = 0
      const count = Math.floor(320 * densityForWidth(w))
      for (let i = 0; i < count; i += 1) {
        dust.push({
          angle: Math.random() * Math.PI * 2,
          radius: 0.22 + Math.random() * 0.72,
          speed: 0.35 + Math.random() * 1.1,
          size: 0.8 + Math.random() * 2.4,
          color: palette[i % palette.length]!,
          z: 0.4 + Math.random() * 0.6,
        })
      }
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const rect = host.getBoundingClientRect()
      pointer.current.x = (event.clientX - rect.left) / Math.max(rect.width, 1)
      pointer.current.y = (event.clientY - rect.top) / Math.max(rect.height, 1)
    }

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const dark = readThemeDark()
      const cx = w * (0.5 + (pointer.current.x - 0.5) * 0.04)
      const cy = h * (0.5 + (pointer.current.y - 0.5) * 0.04)
      const R = Math.min(w, h) * 0.38

      ctx.clearRect(0, 0, w, h)

      // Nebulosa de fondo
      const neb = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7)
      neb.addColorStop(0, dark ? 'rgba(40,20,40,0.9)' : 'rgba(30,18,36,0.92)')
      neb.addColorStop(0.45, dark ? 'rgba(24,16,36,0.85)' : 'rgba(22,14,32,0.88)')
      neb.addColorStop(1, 'rgba(10,12,22,0.2)')
      ctx.fillStyle = neb
      ctx.fillRect(0, 0, w, h)

      if (running) swirl += dt * 0.55

      // Halo externo
      const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.55)
      halo.addColorStop(0, 'transparent')
      halo.addColorStop(0.45, dark ? 'rgba(245,0,79,0.12)' : 'rgba(245,0,79,0.18)')
      halo.addColorStop(0.7, dark ? 'rgba(184,166,232,0.2)' : 'rgba(221,212,243,0.28)')
      halo.addColorStop(1, 'transparent')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(cx, cy, R * 1.55, 0, Math.PI * 2)
      ctx.fill()

      // Disco: partículas en elipses con curvatura cerca del centro
      for (const p of dust) {
        if (running) p.angle += p.speed * dt * (0.7 + (1 - p.radius) * 1.4)
        const bend = 1 + Math.pow(1 - Math.min(1, p.radius), 2) * 0.55
        const rx = R * p.radius * bend * 1.35
        const ry = R * p.radius * 0.42 * bend
        const ang = p.angle + swirl * (1 - p.radius) * 0.4
        // Distorsión “lente” cerca del horizonte de eventos
        const warp = 1 + Math.sin(ang * 2 + swirl) * 0.04 * (1 - p.radius)
        const x = cx + Math.cos(ang) * rx * warp
        const y = cy + Math.sin(ang) * ry * warp + Math.sin(ang + swirl) * (1 - p.radius) * 6

        // Estela corta
        ctx.strokeStyle = p.color
        ctx.globalAlpha = 0.18 * p.z
        ctx.lineWidth = p.size * 0.6
        ctx.beginPath()
        ctx.moveTo(x, y)
        const back = ang - 0.18
        ctx.lineTo(
          cx + Math.cos(back) * rx * warp,
          cy + Math.sin(back) * ry * warp,
        )
        ctx.stroke()

        ctx.globalAlpha = 0.35 + p.z * 0.55
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(x, y, p.size * (0.7 + p.z * 0.4), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // Anillo brillante (lado lejano del disco)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(-0.2)
      const ring = ctx.createLinearGradient(-R * 1.2, 0, R * 1.2, 0)
      ring.addColorStop(0, 'rgba(205,235,221,0)')
      ring.addColorStop(0.25, 'rgba(245,0,79,0.55)')
      ring.addColorStop(0.5, 'rgba(221,212,243,0.85)')
      ring.addColorStop(0.75, 'rgba(126,214,195,0.55)')
      ring.addColorStop(1, 'rgba(247,220,230,0)')
      ctx.strokeStyle = ring
      ctx.lineWidth = 10
      ctx.shadowColor = SPACE.accent
      ctx.shadowBlur = 24
      ctx.beginPath()
      ctx.ellipse(0, 0, R * 1.05, R * 0.34, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.restore()

      // Sombra / horizonte
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.42)
      core.addColorStop(0, '#000')
      core.addColorStop(0.65, '#05060c')
      core.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = core
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.42, 0, Math.PI * 2)
      ctx.fill()

      // Lente tenue sobre el borde
      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.28)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.4, 0, Math.PI * 2)
      ctx.stroke()

      raf = requestAnimationFrame(draw)
    }

    resize()
    raf = requestAnimationFrame(draw)
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    host.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      host.removeEventListener('pointermove', onMove)
    }
  }, [host, reduced, running])

  return (
    <figure className="blackhole-scene" ref={hostRef}>
      {reduced ? (
        <div className="blackhole-static" aria-hidden="true" />
      ) : (
        <canvas ref={canvasRef} className="blackhole-canvas" aria-hidden="true" />
      )}
      <figcaption>
        {caption ?? 'Recurso artístico de exploración espacial · no representa un proceso médico de HELIOS'}
      </figcaption>
    </figure>
  )
}
