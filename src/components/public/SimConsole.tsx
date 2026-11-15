import { AlertTriangle, ArrowUpRight, Box, HeartPulse, Monitor, Radio } from 'lucide-react'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { DASHBOARD_PATH, SIMULATION_ORIGIN } from '../../content/landing'

type ModuleId = 'monitor' | 'alerts' | 'resources'

type Module = {
  id: ModuleId
  to: string
  label: string
  blurb: string
  metric: string
  unit: string
  tone: string
  Icon: typeof Monitor
}

type Props = {
  reduced: boolean
  en: boolean
}

export function SimConsole({ reduced, en }: Props) {
  const uid = useId()
  const shellRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<ModuleId | null>('monitor')
  const [armed, setArmed] = useState(false)
  const [tick, setTick] = useState(72)
  const [scan, setScan] = useState(0)

  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const sx = useSpring(mx, { stiffness: 120, damping: 22, mass: 0.4 })
  const sy = useSpring(my, { stiffness: 120, damping: 22, mass: 0.4 })
  const rotateY = useTransform(sx, [0, 1], reduced ? [0, 0] : [7, -7])
  const rotateX = useTransform(sy, [0, 1], reduced ? [0, 0] : [-5, 5])
  const glowX = useTransform(sx, (v) => `${(v * 100).toFixed(1)}%`)
  const glowY = useTransform(sy, (v) => `${(v * 100).toFixed(1)}%`)

  const modules = useMemo<Module[]>(
    () => [
      {
        id: 'monitor',
        to: DASHBOARD_PATH,
        label: 'Monitor',
        blurb: en ? 'Crew vitals & trend board' : 'Vitales y tablero de tendencias',
        metric: String(tick),
        unit: 'BPM',
        tone: '#F5004F',
        Icon: Monitor,
      },
      {
        id: 'alerts',
        to: `${SIMULATION_ORIGIN}/app/alertas`,
        label: en ? 'Alerts' : 'Alertas',
        blurb: en ? 'Priority queue & acknowledgements' : 'Cola prioritaria y acuses',
        metric: '03',
        unit: en ? 'OPEN' : 'ABIERTAS',
        tone: '#F3C56A',
        Icon: AlertTriangle,
      },
      {
        id: 'resources',
        to: `${SIMULATION_ORIGIN}/app/recursos`,
        label: en ? 'Resources' : 'Recursos',
        blurb: en ? 'Inventory & approval flow' : 'Inventario y flujo de aprobación',
        metric: '94',
        unit: '%',
        tone: '#7ED6C3',
        Icon: Box,
      },
    ],
    [en, tick],
  )

  const current = modules.find((m) => m.id === active) ?? modules[0]!

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => {
      setTick((v) => {
        const next = v + (Math.random() > 0.55 ? 1 : -1)
        return Math.min(86, Math.max(64, next))
      })
      setScan((v) => (v + 1) % 100)
    }, 900)
    return () => window.clearInterval(id)
  }, [reduced])

  const onPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType === 'touch') return
    const node = shellRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    mx.set((event.clientX - rect.left) / Math.max(rect.width, 1))
    my.set((event.clientY - rect.top) / Math.max(rect.height, 1))
  }

  const onLeave = () => {
    mx.set(0.5)
    my.set(0.5)
  }

  return (
    <motion.div
      ref={shellRef}
      className="sim-console"
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onPointerMove={onPointer}
      onPointerLeave={onLeave}
    >
      <motion.div
        className="sim-console-glow"
        aria-hidden="true"
        style={{ ['--gx' as string]: glowX, ['--gy' as string]: glowY }}
      />
      <div className="sim-console-grid" aria-hidden="true" />
      <svg className="sim-console-orbits" viewBox="0 0 800 420" aria-hidden="true">
        <ellipse className="sim-orbit" cx="400" cy="210" rx="280" ry="120" />
        <ellipse className="sim-orbit delay" cx="400" cy="210" rx="200" ry="88" />
        <g className={reduced ? undefined : 'sim-orbit-spin slow'}>
          <circle className="sim-orbit-dot" cx="680" cy="210" r="4" />
        </g>
        <g className={reduced ? undefined : 'sim-orbit-spin'}>
          <circle className="sim-orbit-dot accent" cx="520" cy="120" r="3.5" />
        </g>
      </svg>

      <header className="sim-console-head">
        <div>
          <p className="sim-kicker">
            <Radio size={14} aria-hidden="true" />
            {en ? 'Mission console · interactive preview' : 'Consola de misión · vista interactiva'}
          </p>
          <p className="sim-hint">
            {en
              ? 'Hover a module · click to enter the live simulation'
              : 'Pasá el cursor · hacé clic para entrar a la simulación viva'}
          </p>
        </div>
        <div className="sim-telemetry" aria-live="polite">
          <span>
            <HeartPulse size={14} aria-hidden="true" /> {tick} BPM
          </span>
          <span>SCAN {String(scan).padStart(2, '0')}%</span>
          <span className={armed ? 'is-on' : undefined}>{armed ? (en ? 'ARMED' : 'ARMADA') : en ? 'STANDBY' : 'EN ESPERA'}</span>
        </div>
      </header>

      <div className="sim-console-body">
        <div className="sim-core" aria-hidden="true">
          <div className={`sim-core-ring${active ? ' is-lit' : ''}`} />
          <div className="sim-core-pulse" style={{ ['--core-tone' as string]: current.tone }} />
          <svg className="sim-ecg" viewBox="0 0 240 48" preserveAspectRatio="none">
            <path
              className={reduced ? 'sim-ecg-path is-static' : 'sim-ecg-path'}
              d="M0 28 H36 L44 28 L52 8 L60 44 L68 28 H110 L118 28 L126 14 L134 40 L142 28 H240"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <p className="sim-core-label">HELIOS CORE</p>
        </div>

        <ul className="sim-modules" aria-label={en ? 'Simulation modules' : 'Módulos de simulación'}>
          {modules.map((mod, index) => {
            const selected = active === mod.id
            return (
              <li key={mod.id}>
                <motion.div
                  className={`sim-module${selected ? ' is-active' : ''}`}
                  style={{ ['--mod-tone' as string]: mod.tone }}
                  onMouseEnter={() => setActive(mod.id)}
                  onPointerDown={() => setArmed(true)}
                  whileHover={reduced ? undefined : { y: -6, scale: 1.02 }}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                >
                  <a
                    href={mod.to}
                    className="sim-module-link"
                    aria-describedby={`${uid}-${mod.id}`}
                    onMouseEnter={() => setActive(mod.id)}
                    onFocus={() => {
                      setActive(mod.id)
                      setArmed(true)
                    }}
                  >
                    <span className="sim-module-icon">
                      <mod.Icon size={18} aria-hidden="true" />
                    </span>
                    <span className="sim-module-copy">
                      <strong>{mod.label}</strong>
                      <span id={`${uid}-${mod.id}`}>{mod.blurb}</span>
                    </span>
                    <span className="sim-module-metric">
                      <em>{mod.id === 'monitor' ? tick : mod.metric}</em>
                      <small>{mod.unit}</small>
                    </span>
                    <span className="sim-module-go" aria-hidden="true">
                      <ArrowUpRight size={16} />
                    </span>
                  </a>
                  <AnimatePresence>
                    {selected && !reduced ? (
                      <motion.span
                        className="sim-module-beam"
                        initial={{ opacity: 0, scaleX: 0.4 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        style={{ originX: index === 1 ? 0.5 : index === 0 ? 1 : 0 }}
                        aria-hidden="true"
                      />
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              </li>
            )
          })}
        </ul>
      </div>

      <footer className="sim-console-foot">
        <p>
          {en
            ? 'Conceptual preview · metrics are simulated for the experience'
            : 'Vista conceptual · las métricas son simuladas para la experiencia'}
        </p>
        <a className="sim-enter" href={DASHBOARD_PATH} onPointerEnter={() => setArmed(true)}>
          {en ? 'Enter simulation' : 'Entrar a la simulación'}
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </footer>
    </motion.div>
  )
}
