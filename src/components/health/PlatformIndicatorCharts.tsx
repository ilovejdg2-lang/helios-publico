import { useEffect, useMemo, useState } from 'react'
import { TrendChart } from '../Charts'
import { useLocale } from '../../i18n'
import { catalogEntry } from '../../domain/healthIndicators'
import { autoDomain, chartablePlatformKinds, platformDailySeries } from '../../domain/platformIndicatorSeries'
import { platformApi, type HealthIndicatorReading, type IndicatorKind } from '../../platform/api'

/** Charts platform care-layer indicators with one unit per chart. */
export function PlatformIndicatorCharts({ missionId }: { missionId: string | null }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [items, setItems] = useState<HealthIndicatorReading[]>([])
  const [error, setError] = useState('')
  const [kind, setKind] = useState<IndicatorKind>('heart_rate')

  useEffect(() => {
    if (!missionId) return
    void platformApi.listIndicators(missionId)
      .then((data) => {
        setItems(data.items)
        const kinds = chartablePlatformKinds(data.items)
        if (kinds.length && !kinds.includes(kind)) setKind(kinds[0]!)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'))
  }, [missionId])

  const kinds = useMemo(() => chartablePlatformKinds(items), [items])
  const series = useMemo(() => platformDailySeries(items, kind), [items, kind])
  const scale = useMemo(() => autoDomain(series), [series])
  const meta = catalogEntry(kind)
  const moodItems = items.filter((item) => item.kind === 'mood').slice(0, 12)

  if (!missionId) {
    return <p className="rd-muted">{en ? 'No active mission for platform charts.' : 'No hay misión activa para gráficos platform.'}</p>
  }

  return (
    <section className="rd-card" data-testid="platform-indicator-charts">
      <h2>{en ? 'Platform indicator history' : 'Historial de indicadores (platform)'}</h2>
      <p className="rd-muted">
        {en
          ? 'Care-layer readings from Mi salud. Each chart uses a single unit — incompatible units are never mixed on one axis.'
          : 'Lecturas de la capa de cuidado (Mi salud). Cada gráfico usa una sola unidad — nunca se mezclan unidades incompatibles en el mismo eje.'}
      </p>
      {error ? <p className="rd-error" role="alert">{error}</p> : null}
      {kinds.length === 0 ? (
        <p className="rd-muted">{en ? 'No platform indicators to chart yet.' : 'Todavía no hay indicadores platform para graficar.'}</p>
      ) : (
        <>
          <label className="rd-field">
            <span>{en ? 'Series' : 'Serie'}</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as IndicatorKind)}>
              {kinds.map((id) => (
                <option key={id} value={id}>{en ? catalogEntry(id)?.name.en : catalogEntry(id)?.name.es}</option>
              ))}
            </select>
          </label>
          <div className="hist-card" style={{ marginTop: 12 }}>
            <h3 style={{ marginTop: 0 }}>
              {en ? meta?.name.en : meta?.name.es}
              {kind === 'blood_pressure' ? (en ? ' (systolic)' : ' (sistólica)') : ''}
              {' · '}
              {meta?.unit}
            </h3>
            <TrendChart
              points={series}
              unit={meta?.unit || ''}
              domain={scale.domain}
              ticks={scale.ticks}
              empty={en ? 'No records for this indicator.' : 'Sin registros para este indicador.'}
            />
          </div>
          {kind === 'blood_pressure' ? (
            <p className="rd-muted">
              {en
                ? 'Diastolic values stay in the reading list (second number). They are not plotted on the systolic axis.'
                : 'Los valores diastólicos quedan en la lista de lecturas (segundo número). No se dibujan en el eje de la sistólica.'}
            </p>
          ) : null}
        </>
      )}
      {moodItems.length ? (
        <div style={{ marginTop: 12 }}>
          <h3>{en ? 'Mood self-reports (categorical)' : 'Autorreportes de ánimo (categóricos)'}</h3>
          <ul className="health-mini-list">
            {moodItems.map((item) => (
              <li key={item.id}>
                {item.value}/5 · {new Date(item.measuredAt).toLocaleString()} · {item.origin}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
