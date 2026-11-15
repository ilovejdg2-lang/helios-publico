import { useEffect, useRef } from 'react'
import { densityForWidth, MOTION, readThemeDark, SPACE } from '../../../motion/tokens'
import { useSceneLifecycle } from '../../../hooks/useSceneLifecycle'

type Props = { reduced: boolean; label: string }

type Node = { x: number; y: number; vx: number; vy: number; r: number; color: string }

/**
 * Red visual conceptual de nodos y conexiones para Datos.
 * Decoración artística: no representa ubicaciones reales ni enlaces clínicos.
 */
export function DataNetwork({ reduced, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { ref: hostRef, node: host, running } = useSceneLifecycle(!reduced)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !host || reduced) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    let last = performance.now()
    const nodes: Node[] = []
    const colors = [SPACE.accent, SPACE.mint, SPACE.lilac, SPACE.turquoise, SPACE.rose]

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
      nodes.length = 0
      const count = Math.floor(18 * densityForWidth(w))
      for (let i = 0; i < count; i += 1) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 18,
          vy: (Math.random() - 0.5) * 18,
          r: 3 + Math.random() * 4,
          color: colors[i % colors.length]!,
        })
      }
    }

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const dark = readThemeDark()
      ctx.clearRect(0, 0, w, h)

      ctx.fillStyle = dark ? '#10131E' : '#141824'
      ctx.fillRect(0, 0, w, h)

      const bg = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, Math.max(w, h) * 0.58)
      bg.addColorStop(0, dark ? 'rgba(221,212,243,0.14)' : 'rgba(221,212,243,0.16)')
      bg.addColorStop(0.55, 'rgba(245,0,79,0.08)')
      bg.addColorStop(1, 'transparent')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      if (running) {
        for (const n of nodes) {
          n.x += n.vx * dt
          n.y += n.vy * dt
          if (n.x < 0 || n.x > w) n.vx *= -1
          if (n.y < 0 || n.y > h) n.vy *= -1
        }
      }

      const linkDist = Math.min(w, h) * 0.28
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i]!
          const b = nodes[j]!
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d = Math.hypot(dx, dy)
          if (d < linkDist) {
            ctx.strokeStyle = `rgba(255,255,255,${(dark ? 0.2 : 0.16) * (1 - d / linkDist)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      for (const n of nodes) {
        ctx.fillStyle = n.color
        ctx.shadowColor = n.color
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      raf = requestAnimationFrame(draw)
    }

    resize()
    raf = requestAnimationFrame(draw)
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [host, reduced, running])

  return (
    <figure className="data-network" ref={hostRef}>
      {reduced ? <div className="data-network-static" aria-hidden="true" /> : <canvas ref={canvasRef} aria-hidden="true" />}
      <figcaption>{label}</figcaption>
    </figure>
  )
}
