import { Gauge, Pause, Play } from 'lucide-react'
import type { Speed } from '../../shared/types'
import { useLocale } from '../i18n'
import { useApp } from '../state/store'

const SPEEDS: Speed[] = [1, 2, 5, 10]

function formatSimClock(at: number, originAt: number): string {
  const elapsed = Math.max(0, at - originAt)
  const totalMin = Math.floor(elapsed / 60_000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function SimClockControls() {
  const { state, dispatch } = useApp()
  const { lang } = useLocale()
  const en = lang === 'en'
  const { running, speed, simulatedAt, originAt } = state.clock
  const label = formatSimClock(simulatedAt, originAt)

  return (
    <div className="sim-clock" role="group" aria-label={en ? 'Simulation clock' : 'Reloj de simulación'}>
      <button
        type="button"
        className="helios-pill sim-clock-toggle"
        data-testid="sim-clock-toggle"
        aria-pressed={running}
        title={running ? (en ? 'Pause simulation' : 'Pausar simulación') : en ? 'Run simulation' : 'Reanudar simulación'}
        onClick={() => dispatch({ type: 'setRunning', running: !running })}
      >
        {running ? <Pause size={16} strokeWidth={2} aria-hidden="true" /> : <Play size={16} strokeWidth={2} aria-hidden="true" />}
        <span>{running ? (en ? 'Pause' : 'Pausa') : en ? 'Play' : 'Play'}</span>
      </button>
      <label className="helios-pill sim-clock-speed">
        <Gauge size={16} strokeWidth={2} aria-hidden="true" />
        <span className="sr-only">{en ? 'Simulation speed' : 'Velocidad de simulación'}</span>
        <select
          data-testid="sim-clock-speed"
          value={speed}
          aria-label={en ? 'Simulation speed' : 'Velocidad de simulación'}
          onChange={(event) => dispatch({ type: 'setSpeed', speed: Number(event.target.value) as Speed })}
        >
          {SPEEDS.map((value) => (
            <option key={value} value={value}>
              ×{value}
            </option>
          ))}
        </select>
      </label>
      <span className="helios-pill sim-clock-time" title={en ? 'Simulated mission time' : 'Tiempo simulado de misión'} data-testid="sim-clock-time">
        {label}
      </span>
    </div>
  )
}
