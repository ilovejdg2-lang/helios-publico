import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { densityForWidth, MOTION, readThemeDark, SPACE } from '../../../motion/tokens'
import { useSceneLifecycle } from '../../../hooks/useSceneLifecycle'

export type StageItem = {
  id: string
  title: string
  lead: string
  items: readonly string[]
}

type Props = {
  stages: StageItem[]
  reduced: boolean
  lang: 'es' | 'en'
}

type Body = {
  id: string
  angle: number
  speed: number
  radius: number
  color: string
  label: string
}

/**
 * Sistema orbital conceptual para las tres etapas de misión.
 * Inspirado en la idea de Orbital Hero Section; no usa elementos keplerianos reales
 * ni el código de 21st.dev. Representación artística, no simulación astronómica.
 */
export function OrbitalMission({ stages, reduced, lang }: Props) {
  const en = lang === 'en'
  const [active, setActive] = useState(stages[0]?.id ?? '')
  const selected = useMemo(() => stages.find((s) => s.id === active) ?? stages[0], [active, stages])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { ref: hostRef, node: host, running } = useSceneLifecycle(!reduced)
  const labelId = useId()

  useEffect(() => {
    if (stages[0] && !stages.some((s) => s.id === active)) setActive(stages[0].id)
  }, [stages, active])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !host || reduced) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    let last = performance.now()
    const colors = [SPACE.mint, SPACE.lilac, SPACE.rose]
    const bodies: Body[] = stages.slice(0, 3).map((stage, i) => ({
      id: stage.id,
      angle: (i / 3) * Math.PI * 2,
      speed: 0.28 + i * 0.08,
      radius: 0.42 + i * 0.18,
      color: colors[i] ?? SPACE.accent,
      label: stage.title,
    }))
    const sparks: Array<{ x: number; y: number; life: number; color: string }> = []

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
    }

    const hitTest = (x: number, y: number) => {
      const cx = w * 0.5
      const cy = h * 0.52
      const R = Math.min(w, h) * 0.42
      for (const body of bodies) {
        const rx = R * body.radius * 1.35
        const ry = R * body.radius * 0.55
        const bx = cx + Math.cos(body.angle) * rx
        const by = cy + Math.sin(body.angle) * ry
        if ((x - bx) ** 2 + (y - by) ** 2 < 22 ** 2) return body.id
      }
      return null
    }

    const onClick = (event: MouseEvent) => {
      const rect = host.getBoundingClientRect()
      const id = hitTest(event.clientX - rect.left, event.clientY - rect.top)
      if (id) setActive(id)
    }

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const dark = readThemeDark()
      const cx = w * 0.5
      const cy = h * 0.52
      const R = Math.min(w, h) * 0.42

      ctx.clearRect(0, 0, w, h)
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.55)
      bg.addColorStop(0, dark ? 'rgba(221,212,243,0.12)' : 'rgba(221,212,243,0.35)')
      bg.addColorStop(1, 'transparent')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // Órbitas
      for (let i = 0; i < bodies.length; i += 1) {
        const body = bodies[i]!
        const rx = R * body.radius * 1.35
        const ry = R * body.radius * 0.55
        ctx.strokeStyle = dark ? 'rgba(255,255,255,0.16)' : 'rgba(24,32,38,0.14)'
        ctx.lineWidth = body.id === active ? 2 : 1
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, -0.2, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Núcleo HELIOS
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.22)
      core.addColorStop(0, SPACE.accent)
      core.addColorStop(0.55, '#ff6b9a')
      core.addColorStop(1, 'rgba(245,0,79,0)')
      ctx.fillStyle = core
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.22, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `700 ${Math.max(12, R * 0.08)}px Outfit, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('HELIOS', cx, cy + 4)

      for (const body of bodies) {
        if (running) body.angle += body.speed * dt
        const rx = R * body.radius * 1.35
        const ry = R * body.radius * 0.55
        const x = cx + Math.cos(body.angle) * rx
        const y = cy + Math.sin(body.angle) * ry
        const isActive = body.id === active

        // Estela
        for (let k = 1; k <= 10; k += 1) {
          const t = body.angle - k * 0.08
          const tx = cx + Math.cos(t) * rx
          const ty = cy + Math.sin(t) * ry
          ctx.globalAlpha = (1 - k / 10) * (isActive ? 0.55 : 0.28)
          ctx.fillStyle = body.color
          ctx.beginPath()
          ctx.arc(tx, ty, isActive ? 3.2 : 2.2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1

        ctx.fillStyle = body.color
        ctx.shadowColor = body.color
        ctx.shadowBlur = isActive ? 18 : 8
        ctx.beginPath()
        ctx.arc(x, y, isActive ? 12 : 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.strokeStyle = isActive ? SPACE.accent : 'rgba(255,255,255,0.5)'
        ctx.lineWidth = isActive ? 2.5 : 1.2
        ctx.stroke()

        if (running && Math.random() < 0.04 * densityForWidth(w)) {
          sparks.push({ x, y, life: 1, color: body.color })
        }
      }

      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const s = sparks[i]!
        s.life -= dt * 1.4
        if (s.life <= 0) {
          sparks.splice(i, 1)
          continue
        }
        ctx.globalAlpha = s.life
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.arc(s.x, s.y - (1 - s.life) * 16, 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      raf = requestAnimationFrame(draw)
    }

    resize()
    raf = requestAnimationFrame(draw)
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    host.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      host.removeEventListener('click', onClick)
    }
  }, [active, host, reduced, running, stages])

  return (
    <div className="orbital-mission">
      <div className="orbital-stage" ref={hostRef}>
        {reduced ? (
          <div className="orbital-static" aria-hidden="true" />
        ) : (
          <canvas ref={canvasRef} className="orbital-canvas" aria-hidden="true" />
        )}
        <p className="orbital-note">
          {en
            ? 'Conceptual representation · not a precise astronomical simulation'
            : 'Representación conceptual · no es una simulación astronómica precisa'}
        </p>
      </div>

      <div className="orbital-panel" aria-labelledby={labelId}>
        <div className="orbital-tabs" role="tablist" aria-label={en ? 'Mission stages' : 'Etapas de la misión'}>
          {stages.map((stage, index) => (
            <button
              key={stage.id}
              type="button"
              role="tab"
              aria-selected={stage.id === selected?.id}
              className={stage.id === selected?.id ? 'is-active' : undefined}
              onClick={() => setActive(stage.id)}
            >
              <span>{index + 1}</span>
              {stage.title}
            </button>
          ))}
        </div>
        {selected ? (
          <article role="tabpanel">
            <h2 id={labelId}>{selected.title}</h2>
            <p className="pub-muted">{selected.lead}</p>
            <ul>
              {selected.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ) : null}
      </div>
    </div>
  )
}
