import { useEffect, useState } from 'react'
import { platformApi } from '../../platform/api'

type WakeRow = {
  profileId: string
  displayName: string
  role: string
  status: string
  payload: Record<string, unknown>
}

/** Resumen del día a bordo: cómo amaneció cada integrante. */
export function AboardCheckInBoard({ missionId, en }: { missionId: string; en: boolean }) {
  const [items, setItems] = useState<WakeRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    platformApi.wakeCrew(missionId)
      .then((data) => { if (alive) setItems(data.items) })
      .catch((err: Error) => { if (alive) setError(err.message || 'Error') })
    return () => { alive = false }
  }, [missionId])

  return (
    <section className="chief-launch" aria-label={en ? 'Daily Check-in' : 'Chequeo a bordo'}>
      <div className="chief-launch-head">
        <div>
          <h2>{en ? 'How the crew woke up' : 'Cómo amaneció la tripulación'}</h2>
          <p className="muted">
            {en
              ? 'Sleep, physical and emotional state, and whether they reported symptoms today.'
              : 'Sueño, estado físico y emocional, y si reportaron síntomas hoy.'}
          </p>
        </div>
      </div>
      {error ? <p className="field-error">{error}</p> : null}
      {items.length === 0 && !error ? <p className="muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}
      <ul className="chief-launch-list">
        {items.map((row) => {
          const p = row.payload || {}
          const done = row.status === 'completed'
          return (
            <li key={row.profileId}>
              <div className={done ? 'is-on' : undefined} style={{ display: 'grid', gap: 4, padding: '10px 12px' }}>
                <strong>{row.displayName}</strong>
                <span className="muted">
                  {done
                    ? (en
                      ? `Slept ${String(p.sleptAt || '—')} · woke ${String(p.wokeAt || '—')} · rest ${String(p.rest ?? '—')}/5 · physical ${String(p.physical || '—')} · emotional ${String(p.emotional || '—')} · symptoms ${p.symptoms ? 'yes' : 'no'}`
                      : `Acostó ${String(p.sleptAt || '—')} · despertó ${String(p.wokeAt || '—')} · descanso ${String(p.rest ?? '—')}/5 · físico ${String(p.physical || '—')} · emocional ${String(p.emotional || '—')} · síntomas ${p.symptoms ? 'sí' : 'no'}`)
                    : (en ? 'Check-in pending' : 'Chequeo pendiente')}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
