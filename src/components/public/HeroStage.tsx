import { Activity, Radio, Route } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocale } from '../../i18n'

const PlanetGlobe = lazy(() =>
  import('./scenes/PlanetGlobe').then((m) => ({ default: m.PlanetGlobe })),
)

/** Escena protagonista del hero con HUD instrumental. */
export function HeroStage({ reduced }: { reduced: boolean }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [playing, setPlaying] = useState(!reduced)
  const [stage, setStage] = useState(1)

  useEffect(() => {
    setPlaying(!reduced)
  }, [reduced])

  useEffect(() => {
    if (reduced || !playing) return
    const id = window.setInterval(() => setStage((value) => (value % 3) + 1), 4200)
    return () => window.clearInterval(id)
  }, [playing, reduced])

  const stageLabel =
    stage === 1
      ? en
        ? 'Pre-flight'
        : 'Preembarque'
      : stage === 2
        ? en
          ? 'On board'
          : 'A bordo'
        : en
          ? 'Post-mission'
          : 'Posmisión'

  return (
    <div className="hero-stage">
      <div className="hero-stage-grid" aria-hidden="true" />
      <div className="hero-stage-glow" />
      <Suspense
        fallback={
          <div className="planet-static" aria-hidden="true">
            <div className="planet-static-orb" />
            <div className="planet-static-ring" />
          </div>
        }
      >
        <PlanetGlobe playing={playing} reduced={reduced} />
      </Suspense>

      <div className="hero-hud" aria-label={en ? 'Conceptual visualization panels' : 'Paneles de visualización conceptual'}>
        <article className="hud-panel hud-stage">
          <header>
            <Route size={14} aria-hidden="true" />
            <span>{en ? 'Mission stage' : 'Etapa de misión'}</span>
          </header>
          <strong>{stageLabel}</strong>
          <div className="hud-stage-dots" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <span key={n} className={n === stage ? 'is-on' : undefined} />
            ))}
          </div>
          <p>01 · {en ? 'Conceptual cycle' : 'Ciclo conceptual'}</p>
        </article>

        <article className="hud-panel hud-bio">
          <header>
            <Activity size={14} aria-hidden="true" />
            <span>{en ? 'Biometric signal' : 'Señal biométrica'}</span>
          </header>
          <svg className="hud-wave" viewBox="0 0 160 36" aria-hidden="true">
            <path
              className={playing && !reduced ? 'hud-wave-path' : undefined}
              d="M0 22h18l6-14 8 28 7-18 10 8h20l5-10 7 18 6-12h43"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p>{en ? 'Simulated waveform' : 'Onda simulada'}</p>
        </article>

        <article className="hud-panel hud-link">
          <header>
            <Radio size={14} aria-hidden="true" />
            <span>{en ? 'Earth link' : 'Enlace con Tierra'}</span>
          </header>
          <div className="hud-link-line" aria-hidden="true">
            <span className={playing && !reduced ? 'hud-pulse' : undefined} />
            <span className={playing && !reduced ? 'hud-pulse delay' : undefined} />
          </div>
          <strong>{en ? 'Delayed · conceptual' : 'Con demora · conceptual'}</strong>
          <p>{en ? 'No live connection' : 'Sin conexión en vivo'}</p>
        </article>
      </div>

      <p className="hero-viz-label">
        {en ? 'Conceptual visualization · Simulated data' : 'Visualización conceptual · Datos simulados'}
      </p>

      <button
        type="button"
        className="hero-play"
        onClick={() => setPlaying((value) => !value)}
        aria-pressed={playing}

      >
        {playing ? (en ? 'Pause scene' : 'Pausar escena') : en ? 'Resume scene' : 'Reanudar escena'}
      </button>
    </div>
  )
}
