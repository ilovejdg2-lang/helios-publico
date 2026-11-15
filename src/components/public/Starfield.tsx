import { useEffect, useRef } from 'react'

type Star = { x: number; y: number; z: number; r: number; tw: number }
type Spark = { x: number; y: number; vx: number; vy: number; life: number }

export function Starfield({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || reduced) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    let pointerX = 0.5
    let pointerY = 0.5
    let dark = document.documentElement.dataset.theme === 'dark'
    const stars: Star[] = []
    const sparks: Spark[] = []
    let lastSpark = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = w < 700 ? 110 : w < 1100 ? 170 : 240
      stars.length = 0
      for (let i = 0; i < count; i += 1) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: 0.2 + Math.random() * 0.8,
          r: 0.4 + Math.random() * 1.6,
          tw: Math.random() * Math.PI * 2,
        })
      }
    }

    const onMove = (event: PointerEvent) => {
      pointerX = event.clientX / Math.max(w, 1)
      pointerY = event.clientY / Math.max(h, 1)
    }

    const onTheme = () => {
      dark = document.documentElement.dataset.theme === 'dark'
    }

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h)
      const parallaxX = (pointerX - 0.5) * 24
      const parallaxY = (pointerY - 0.5) * 18

      const nebula = ctx.createRadialGradient(w * 0.2, h * 0.25, 0, w * 0.2, h * 0.25, w * 0.45)
      nebula.addColorStop(0, dark ? 'rgba(221,212,243,0.16)' : 'rgba(221,212,243,0.35)')
      nebula.addColorStop(1, 'transparent')
      ctx.fillStyle = nebula
      ctx.fillRect(0, 0, w, h)

      const nebula2 = ctx.createRadialGradient(w * 0.78, h * 0.7, 0, w * 0.78, h * 0.7, w * 0.4)
      nebula2.addColorStop(0, dark ? 'rgba(247,220,230,0.12)' : 'rgba(247,220,230,0.32)')
      nebula2.addColorStop(1, 'transparent')
      ctx.fillStyle = nebula2
      ctx.fillRect(0, 0, w, h)

      const nebula3 = ctx.createRadialGradient(w * 0.55, h * 0.15, 0, w * 0.55, h * 0.15, w * 0.3)
      nebula3.addColorStop(0, dark ? 'rgba(205,235,221,0.1)' : 'rgba(205,235,221,0.28)')
      nebula3.addColorStop(1, 'transparent')
      ctx.fillStyle = nebula3
      ctx.fillRect(0, 0, w, h)

      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(24,32,38,0.08)'
      ctx.lineWidth = 1
      for (let i = 0; i < 3; i += 1) {
        const cx = w * (0.55 + i * 0.05) + parallaxX * (0.2 + i * 0.1)
        const cy = h * 0.42 + parallaxY * (0.15 + i * 0.08)
        const rx = 120 + i * 55
        const ry = 48 + i * 18
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, -0.35, 0, Math.PI * 2)
        ctx.stroke()
        const t = now / 4000 + i
        const px = cx + Math.cos(t) * rx
        const py = cy + Math.sin(t) * ry
        ctx.fillStyle = '#F5004F'
        ctx.beginPath()
        ctx.arc(px, py, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const star of stars) {
        star.tw += 0.02 * star.z
        const alpha = 0.25 + Math.abs(Math.sin(star.tw)) * 0.55
        const x = star.x + parallaxX * star.z
        const y = star.y + parallaxY * star.z
        ctx.fillStyle = dark ? `rgba(255,255,255,${alpha})` : `rgba(24,32,38,${alpha * 0.7})`
        ctx.beginPath()
        ctx.arc(x, y, star.r * star.z, 0, Math.PI * 2)
        ctx.fill()
      }

      if (now - lastSpark > 4200 + Math.random() * 3500) {
        lastSpark = now
        sparks.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.45,
          vx: 3 + Math.random() * 4,
          vy: 1 + Math.random() * 1.5,
          life: 1,
        })
      }
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const spark = sparks[i]
        if (!spark) continue
        spark.x += spark.vx
        spark.y += spark.vy
        spark.life -= 0.016
        if (spark.life <= 0) {
          sparks.splice(i, 1)
          continue
        }
        ctx.strokeStyle = dark ? `rgba(255,255,255,${spark.life})` : `rgba(245,0,79,${spark.life * 0.7})`
        ctx.beginPath()
        ctx.moveTo(spark.x, spark.y)
        ctx.lineTo(spark.x - spark.vx * 6, spark.y - spark.vy * 6)
        ctx.stroke()
      }

      raf = requestAnimationFrame(draw)
    }

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf)
      else raf = requestAnimationFrame(draw)
    }

    resize()
    raf = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    const observer = new MutationObserver(onTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVisibility)
      observer.disconnect()
    }
  }, [reduced])

  if (reduced) return <div className="starfield starfield-static" aria-hidden="true" />
  return <canvas className="starfield" ref={ref} aria-hidden="true" />
}
