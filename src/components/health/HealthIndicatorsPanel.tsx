import { useEffect, useMemo, useState } from 'react'
import { useLocale } from '../../i18n'
import {
  INDICATOR_CATALOG,
  catalogEntry,
  evaluateIndicatorState,
  formatIndicatorValue,
  stateLabel,
  type IndicatorVisualState,
} from '../../domain/healthIndicators'
import {
  platformApi,
  type HealthIndicatorReading,
  type IndicatorKind,
} from '../../platform/api'
import { enqueueOfflineOp, isBrowserOnline } from '../../platform/offlineQueue'

const PERIODS = [
  { id: '24h', ms: 24 * 60 * 60 * 1000, es: '24 h', en: '24 h' },
  { id: '7d', ms: 7 * 24 * 60 * 60 * 1000, es: '7 días', en: '7 days' },
  { id: '30d', ms: 30 * 24 * 60 * 60 * 1000, es: '30 días', en: '30 days' },
] as const

function stateClass(state: IndicatorVisualState) {
  return `health-state health-state-${state}`
}

export function HealthIndicatorsPanel({
  missionId,
  onChanged,
}: {
  missionId: string | null
  onChanged?: () => Promise<void> | void
}) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [items, setItems] = useState<HealthIndicatorReading[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['id']>('7d')
  const [explainKind, setExplainKind] = useState<IndicatorKind | null>(null)
  const [kind, setKind] = useState<IndicatorKind>('heart_rate')
  const [value, setValue] = useState('72')
  const [valueSecondary, setValueSecondary] = useState('78')
  const [context, setContext] = useState('rest')
  const [quality, setQuality] = useState<HealthIndicatorReading['quality']>('good')
  const [origin, setOrigin] = useState<HealthIndicatorReading['origin']>('manual')
  const [notes, setNotes] = useState('')

  async function load() {
    if (!missionId) return
    const data = await platformApi.listIndicators(missionId)
    setItems(data.items)
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Error'))
  }, [missionId])

  const byKind = useMemo(() => {
    const map = new Map<IndicatorKind, HealthIndicatorReading[]>()
    for (const entry of INDICATOR_CATALOG) map.set(entry.kind, [])
    for (const item of items) {
      const list = map.get(item.kind) || []
      list.push(item)
      map.set(item.kind, list)
    }
    for (const [, list] of map) list.sort((a, b) => b.measuredAt - a.measuredAt)
    return map
  }, [items])

  const periodMs = PERIODS.find((p) => p.id === period)?.ms || PERIODS[1].ms
  const selectedMeta = catalogEntry(kind)
  const explain = explainKind ? catalogEntry(explainKind) : null

  async function save() {
    if (!missionId) {
      setError(en ? 'No active mission' : 'No hay misión activa')
      return
    }
    setBusy(true)
    setError('')
    setOk('')
    try {
      const primary = Number(value)
      const secondary = selectedMeta?.needsSecondary ? Number(valueSecondary) : null
      if (selectedMeta?.needsSecondary && !Number.isFinite(secondary)) {
        throw new Error(en ? 'Blood pressure needs systolic and diastolic.' : 'La presión arterial necesita sistólica y diastólica.')
      }
      const payload = {
        kind,
        value: primary,
        valueSecondary: secondary,
        origin,
        context,
        quality,
        notes,
        bodyRegion: selectedMeta?.bodyRegion ?? null,
        unit: selectedMeta?.unit,
        measuredAt: Date.now(),
      }
      if (!isBrowserOnline()) {
        enqueueOfflineOp({ type: 'indicator', missionId, payload })
        setOk(en ? 'Saved offline — queued for sync.' : 'Guardado offline — en cola de sync.')
      } else {
        try {
          await platformApi.addIndicator(missionId, payload)
          setOk(en ? 'Indicator saved.' : 'Indicador guardado.')
        } catch (err) {
          enqueueOfflineOp({ type: 'indicator', missionId, payload })
          setOk(en
            ? `Network error — queued locally (${err instanceof Error ? err.message : 'error'}).`
            : `Error de red — encolado local (${err instanceof Error ? err.message : 'error'}).`)
        }
      }
      await load().catch(() => undefined)
      await onChanged?.()
      try {
        const raw = localStorage.getItem('helios.progress.optout')
        if (raw !== '1') {
          const key = 'helios.progress.records'
          const n = Number(localStorage.getItem(key) || '0') + 1
          localStorage.setItem(key, String(n))
        }
      } catch { /* ignore */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not save' : 'No se pudo guardar'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rd-stack health-indicators">
      {error ? <p className="rd-error" role="alert">{error}</p> : null}
      {ok ? <p className="rd-ok">{ok}</p> : null}

      <section className="rd-card">
        <h2>{en ? 'Log health indicators' : 'Registrar indicadores'}</h2>
        <div className="rd-form-grid">
          <div className="rd-field">
            <label htmlFor="ind-kind">{en ? 'Indicator' : 'Indicador'}</label>
            <select id="ind-kind" value={kind} onChange={(e) => setKind(e.target.value as IndicatorKind)} disabled={busy}>
              {INDICATOR_CATALOG.map((item) => (
                <option key={item.kind} value={item.kind}>{en ? item.name.en : item.name.es}</option>
              ))}
            </select>
          </div>
          {kind === 'mood' ? (
            <div className="rd-field">
              <label htmlFor="ind-mood">{en ? 'Mood self-report' : 'Autorreporte de ánimo'}</label>
              <select id="ind-mood" value={value} onChange={(e) => setValue(e.target.value)} disabled={busy}>
                {(catalogEntry('mood')?.moodScale || []).map((step) => (
                  <option key={step.value} value={step.value}>{en ? step.en : step.es}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="rd-field">
              <label htmlFor="ind-value">
                {selectedMeta?.needsSecondary
                  ? (en ? 'Systolic' : 'Sistólica')
                  : (en ? `Value (${selectedMeta?.unit || ''})` : `Valor (${selectedMeta?.unit || ''})`)}
              </label>
              <input id="ind-value" type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} disabled={busy} />
            </div>
          )}
          {selectedMeta?.needsSecondary ? (
            <div className="rd-field">
              <label htmlFor="ind-dia">{en ? 'Diastolic' : 'Diastólica'}</label>
              <input id="ind-dia" type="number" step="any" value={valueSecondary} onChange={(e) => setValueSecondary(e.target.value)} disabled={busy} />
            </div>
          ) : null}
          <div className="rd-field">
            <label htmlFor="ind-context">{en ? 'Context' : 'Contexto'}</label>
            <select id="ind-context" value={context} onChange={(e) => setContext(e.target.value)} disabled={busy}>
              <option value="rest">{en ? 'Rest' : 'Reposo'}</option>
              <option value="activity">{en ? 'Activity' : 'Actividad'}</option>
              <option value="post_wake">{en ? 'After wake' : 'Tras despertar'}</option>
              <option value="unspecified">{en ? 'Unspecified' : 'Sin especificar'}</option>
            </select>
          </div>
          <div className="rd-field">
            <label htmlFor="ind-origin">{en ? 'Origin' : 'Origen'}</label>
            <select id="ind-origin" value={origin} onChange={(e) => setOrigin(e.target.value as HealthIndicatorReading['origin'])} disabled={busy}>
              <option value="manual">{en ? 'Manual' : 'Manual'}</option>
              <option value="sensor">{en ? 'Sensor' : 'Sensor'}</option>
              <option value="import">{en ? 'Import' : 'Importación'}</option>
              <option value="simulation">{en ? 'Simulation' : 'Simulación'}</option>
            </select>
          </div>
          <div className="rd-field">
            <label htmlFor="ind-quality">{en ? 'Quality' : 'Calidad'}</label>
            <select id="ind-quality" value={quality} onChange={(e) => setQuality(e.target.value as HealthIndicatorReading['quality'])} disabled={busy}>
              <option value="good">{en ? 'Good' : 'Buena'}</option>
              <option value="fair">{en ? 'Fair' : 'Aceptable'}</option>
              <option value="poor">{en ? 'Poor' : 'Pobre'}</option>
              <option value="unknown">{en ? 'Unknown' : 'Desconocida'}</option>
            </select>
          </div>
          <div className="rd-field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="ind-notes">{en ? 'Notes (optional)' : 'Observaciones (opcional)'}</label>
            <input id="ind-notes" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={busy} />
          </div>
        </div>
        <div className="rd-actions">
          <button type="button" className="rd-btn" disabled={busy || !missionId} onClick={() => void save()}>
            {en ? 'Save indicator' : 'Guardar indicador'}
          </button>
          <button type="button" className="rd-btn ghost" onClick={() => setExplainKind(kind)}>
            {en ? 'Understand this indicator' : 'Entender este indicador'}
          </button>
        </div>
      </section>

      {explain ? (
        <section className="rd-card" role="dialog" aria-label={en ? 'Indicator help' : 'Ayuda del indicador'}>
          <h2>{en ? explain.name.en : explain.name.es}</h2>
          <dl className="health-explain">
            <dt>{en ? 'What it is' : 'Qué representa'}</dt>
            <dd>{en ? explain.explain.what.en : explain.explain.what.es}</dd>
            <dt>{en ? 'Why record it' : 'Para qué registrarlo'}</dt>
            <dd>{en ? explain.explain.why.en : explain.explain.why.es}</dd>
            <dt>{en ? 'What can affect it' : 'Qué puede afectarlo'}</dt>
            <dd>{en ? explain.explain.factors.en : explain.explain.factors.es}</dd>
            <dt>{en ? 'How to record' : 'Cómo registrar'}</dt>
            <dd>{en ? explain.explain.howToRecord.en : explain.explain.howToRecord.es}</dd>
            <dt>{en ? 'When to review' : 'Cuándo revisar'}</dt>
            <dd>{en ? explain.explain.whenToReview.en : explain.explain.whenToReview.es}</dd>
            <dt>{en ? 'Limits' : 'Limitaciones'}</dt>
            <dd>{en ? explain.explain.limits.en : explain.explain.limits.es}</dd>
          </dl>
          <ul className="health-mini-list">
            {explain.explain.sources.map((source) => (
              <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>
            ))}
          </ul>
          <button type="button" className="rd-btn ghost" onClick={() => setExplainKind(null)}>{en ? 'Close' : 'Cerrar'}</button>
        </section>
      ) : null}

      <section className="rd-card">
        <div className="rd-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>{en ? 'Status cards' : 'Tarjetas de estado'}</h2>
          <label className="rd-field" style={{ margin: 0 }}>
            <span className="sr-only">{en ? 'Period' : 'Periodo'}</span>
            <select value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}>
              {PERIODS.map((p) => <option key={p.id} value={p.id}>{en ? p.en : p.es}</option>)}
            </select>
          </label>
        </div>
        <div className="health-card-grid">
          {INDICATOR_CATALOG.map((entry) => {
            const series = (byKind.get(entry.kind) || []).filter((item) => Date.now() - item.measuredAt <= periodMs)
            const latest = series[0]
            const previous = series[1]
            const evalState = evaluateIndicatorState(latest, previous)
            return (
              <article key={entry.kind} className="health-status-card">
                <header>
                  <strong>{en ? entry.name.en : entry.name.es}</strong>
                  <span className={stateClass(evalState.state)}>{stateLabel(evalState.state, en)}</span>
                </header>
                <p className="health-value">
                  {latest ? formatIndicatorValue(latest, en) : (en ? 'No data' : 'Sin datos')}
                </p>
                {latest ? (
                  <p className="rd-muted">
                    {new Date(latest.measuredAt).toLocaleString()} · {latest.origin} · {latest.quality}
                  </p>
                ) : null}
                <button type="button" className="rd-btn ghost" onClick={() => setExplainKind(entry.kind)}>
                  {en ? 'Understand' : 'Entender'}
                </button>
                {series.length > 1 && entry.kind !== 'blood_pressure' && entry.kind !== 'mood' ? (
                  <Spark values={series.slice(0, 12).map((s) => s.value).reverse()} label={entry.unit} />
                ) : series.length > 1 && entry.kind === 'blood_pressure' ? (
                  <p className="rd-muted">{en ? 'BP history listed below (dual values, not mixed on one axis).' : 'Historial de PA abajo (valores duales, sin mezclar ejes).'}</p>
                ) : null}
              </article>
            )
          })}
        </div>
      </section>

      <section className="rd-card">
        <h2>{en ? 'Recent readings' : 'Lecturas recientes'}</h2>
        {items.length === 0 ? (
          <p className="rd-muted">{en ? 'No indicators yet.' : 'Todavía no hay indicadores.'}</p>
        ) : (
          <ul className="health-mini-list">
            {items.slice(0, 20).map((item) => (
              <li key={item.id}>
                <strong>{en ? catalogEntry(item.kind)?.name.en : catalogEntry(item.kind)?.name.es}</strong>
                {' · '}
                {formatIndicatorValue(item, en)}
                {' · '}
                {new Date(item.measuredAt).toLocaleString()}
                {' · '}
                {item.origin}/{item.quality}
                {item.notes ? ` · ${item.notes}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Spark({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100
    const y = 28 - ((v - min) / span) * 24
    return `${x},${y}`
  }).join(' ')
  return (
    <svg className="health-spark" viewBox="0 0 100 32" role="img" aria-label={`${label} trend`}>
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
    </svg>
  )
}
