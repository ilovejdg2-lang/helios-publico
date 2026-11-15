import { Brain, Check, ClipboardPlus, Heart, Package, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MeasurementKind } from '../../shared/types'
import { runLocalAnalysis } from '../domain/analysis'
import { CREW, crewDuty, crewPlace } from '../domain/crew'
import { ageLabel, formatValue, kindLabel } from '../domain/format'
import { crewPosture, isReliable, latestMeasurement, openEpisode } from '../domain/selectors'
import { CarouselStrip } from '../components/CarouselStrip'
import { CrewHelmet } from '../components/CrewHelmet'
import { useLocale } from '../i18n'
import { HeartWave } from '../components/HeartWave'
import { Badge, Field, Modal } from '../components/ui'
import { useApp } from '../state/store'

const SYMPTOMS = ['cansancio', 'mareo', 'cefalea', 'nausea', 'otro'] as const

const SYMPTOM_LABEL = {
  en: { cansancio: 'Fatigue', mareo: 'Dizziness', cefalea: 'Headache', nausea: 'Nausea', otro: 'Other' },
  es: { cansancio: 'Cansancio', mareo: 'Mareo', cefalea: 'Dolor de cabeza', nausea: 'Náusea', otro: 'Otro' },
} as const

export function MonitorPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { lang } = useLocale()
  const { state, dispatch, backendMode, monitoringLatest } = useApp()
  const en = lang === 'en'
  const crew = CREW.find((item) => item.id === state.selectedCrewId) ?? CREW[0]
  const posture = crew ? crewPosture(state, crew.id) : null
  const hr = crew ? latestMeasurement(state, crew.id, 'heart_rate') : null
  const trusted = hr ? isReliable(hr, state.clock.simulatedAt) : false
  const episode = crew ? openEpisode(state, crew.id) : null
  const analysis = episode ? runLocalAnalysis(state, episode.id) : null
  const symptoms = crew ? state.symptoms.filter((item) => item.crewId === crew.id) : []
  const alerts = crew ? state.alerts.filter((item) => item.crewId === crew.id && item.status !== 'closed') : []
  const resources = state.resources.filter((item) => item.quantity > 0).slice(0, 3)
  const unit = en ? 'bpm' : 'lpm'
  const baseline = crew ? `${crew.baseline.hrMin}-${crew.baseline.hrMax} ${unit}` : ''
  const hrAbove = Boolean(crew && hr && hr.value > crew.baseline.hrMax)
  const hrText = hr ? `${formatValue('heart_rate', hr.value)} ${unit}` : null
  const shellClass = embedded ? 'monitor-page monitor-embedded' : 'page monitor-page'
  const [apiDelta, setApiDelta] = useState<string | null>(null)

  useEffect(() => {
    if (!crew || backendMode !== 'connected') {
      setApiDelta(null)
      return
    }
    let alive = true
    void monitoringLatest(crew.id, 'heart_rate').then((data) => {
      if (!alive || !data?.comparison || data.measurement == null) {
        if (alive) setApiDelta(null)
        return
      }
      const over = data.comparison.deltaFromMaximum
      setApiDelta(
        en
          ? `Nest monitoring: ${over > 0 ? `+${over.toFixed(0)} above baseline max` : `${Math.abs(over).toFixed(0)} within/under max`}`
          : `Monitoreo Nest: ${over > 0 ? `+${over.toFixed(0)} sobre el máximo de línea base` : `${Math.abs(over).toFixed(0)} dentro/bajo el máximo`}`,
      )
    })
    return () => { alive = false }
  }, [crew, backendMode, monitoringLatest, en, hr?.id])

  if (!crew || !posture) {
    return (
      <div className={shellClass}>
        <p className="muted">{en ? 'No crew member available.' : 'No hay tripulante disponible.'}</p>
      </div>
    )
  }

  return (
    <div className={shellClass}>
      <CarouselStrip className="crew-carousel" trackClassName="crew-picker" label={en ? 'Crew' : 'Tripulación'}>
        {CREW.map((item) => (
          <button
            key={item.id}
            type="button"
            className="crew-pick"
            data-testid={`crew-${item.id}`}
            aria-pressed={item.id === crew.id}
            aria-label={
              item.id === crew.id
                ? en
                  ? `${item.name}, selected`
                  : `${item.name}, seleccionada`
                : item.name
            }
            onClick={() => dispatch({ type: 'selectCrew', crewId: item.id })}
          >
            <CrewHelmet id={item.id} name={item.name} selected={item.id === crew.id} />
            <span aria-hidden="true">{item.name.split(' ')[0]}</span>
          </button>
        ))}
      </CarouselStrip>

      <header className="monitor-id">
        <div className="monitor-avatar">
          <CrewHelmet id={crew.id} name={crew.name} selected />
        </div>
        <p className="monitor-kicker">{embedded ? (en ? 'Mission center' : 'Centro') : 'Monitor'}</p>
        <h1 className="monitor-name">{crew.name}</h1>
        <p className="monitor-meta">{crewDuty(crew, lang)} · {crewPlace(crew, lang)}</p>
        <p className="monitor-summary">
          {hrAbove && hrText
            ? en
              ? `Heart rate (${hrText}) is above baseline (${baseline}).`
              : `La frecuencia cardíaca (${hrText}) está por encima de su línea base (${baseline}).`
            : posture.summary}
        </p>
      </header>

      <section className="monitor-card" aria-label={en ? 'Current reading' : 'Lectura actual'}>
        <div className="monitor-card-hr">
          <div className="hr-hero">
            <Heart aria-hidden="true" size={36} strokeWidth={2.25} fill="currentColor" />
            <p className="hr-value" aria-live="off">
              {hr ? formatValue('heart_rate', hr.value) : '—'}
              <span>{unit}</span>
            </p>
          </div>
          <HeartWave />
          <div className="hr-foot">
            <p>{trusted ? (en ? 'Recent heart-rate reading.' : 'Lectura reciente de frecuencia cardíaca.') : (en ? 'This number is not used as a current evaluation.' : 'Esta cifra no se usa como evaluación actual.')}</p>
            <p className="muted">
              {hr
                ? en
                  ? `Measured ${ageLabel(state.clock.simulatedAt, hr.measuredAt)} / received ${ageLabel(state.clock.simulatedAt, hr.receivedAt)} / Signal ${hr.signalQuality}/100`
                  : `Medida ${ageLabel(state.clock.simulatedAt, hr.measuredAt)} / recibida ${ageLabel(state.clock.simulatedAt, hr.receivedAt)} / Señal ${hr.signalQuality}/100`
                : en ? 'There is no pulse measurement.' : 'No hay una medición de pulso.'}
            </p>
            {apiDelta ? <p className="muted">{apiDelta}</p> : null}
          </div>
        </div>
        <div className="monitor-card-trust">
          <h2>{en ? 'How reliable the data is' : 'Qué tan confiable son los datos'}</h2>
          <p>{posture.evidenceDetail}</p>
          <dl className="trust-metrics">
            <Vital stateNow={state.clock.simulatedAt} crewId={crew.id} kind="spo2" />
            <Vital stateNow={state.clock.simulatedAt} crewId={crew.id} kind="temperature" />
            <Vital stateNow={state.clock.simulatedAt} crewId={crew.id} kind="sleep_hours" />
          </dl>
        </div>
      </section>

      <section className="monitor-actions panel" aria-label={en ? 'Monitor actions' : 'Acciones del monitor'}>
        <div className="spread">
          <h2>{en ? 'What you can do now' : 'Qué puedes hacer ahora'}</h2>
          <Badge tone={posture.observed === 'change' ? 'amber' : posture.observed === 'stable' ? 'ok' : 'bad'}>
            {posture.observed === 'change' ? (en ? 'Observed change' : 'Cambio observado') : posture.observed === 'stable' ? (en ? 'Within baseline' : 'Dentro de línea base') : (en ? 'No recent evaluation' : 'Sin evaluación reciente')}
          </Badge>
        </div>
        <p className="muted">{analysis?.summary ?? (en ? 'There is no open health episode. Sensor alerts do not open one by themselves.' : 'No hay un episodio de salud abierto. Las alertas de sensor no abren uno por sí solas.')}</p>
        <div className="row">
          <SymptomButton />
          <RepeatButton />
          {episode ? <Link className="btn btn-primary" to="/app/analisis"><Brain aria-hidden="true" size={18} strokeWidth={1.75} /> {en ? 'Open analysis' : 'Abrir análisis'}</Link> : <Link className="btn" to="/app/analisis"><Brain aria-hidden="true" size={18} strokeWidth={1.75} /> {en ? 'View analysis' : 'Ver análisis'}</Link>}
          {alerts[0] ? <button className="btn" type="button" onClick={() => { const first = alerts[0]; if (first) dispatch({ type: 'ackAlert', alertId: first.id }) }}><Check aria-hidden="true" size={18} strokeWidth={1.75} /> {en ? 'Confirm notice' : 'Confirmar aviso'}</button> : null}
          <Link className="btn" to="/app/recursos"><Package aria-hidden="true" size={18} strokeWidth={1.75} /> {en ? 'Inventory' : 'Inventario'}</Link>
        </div>
        {symptoms.length > 0 ? (
          <ul>
            {symptoms.map((item) => (
              <li key={item.id}>{item.symptoms.map((id) => SYMPTOM_LABEL[lang][id as keyof typeof SYMPTOM_LABEL.en] ?? id).join(', ') || (en ? 'Note' : 'Nota')} — {item.note || (en ? 'no note' : 'sin nota')} · {ageLabel(state.clock.simulatedAt, item.reportedAt)}</li>
            ))}
          </ul>
        ) : null}
        {resources.length > 0 ? (
          <p className="muted">{en ? 'Resources' : 'Recursos'}: {resources.map((item) => `${item.name} (${item.quantity})`).join(' · ')}</p>
        ) : null}
      </section>
    </div>
  )
}

function Vital({ crewId, kind, stateNow }: { crewId: (typeof CREW)[number]['id']; kind: MeasurementKind; stateNow: number }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state } = useApp()
  const reading = latestMeasurement(state, crewId, kind)
  const trusted = reading ? isReliable(reading, stateNow) : false
  const unit = kind === 'spo2' ? '%' : kind === 'temperature' ? 'C' : 'h'
  return (
    <div className="trust-metric">
      <dt>{kindLabel(kind)}</dt>
      <dd>
        {reading ? (
          <>
            <strong>{formatValue(kind, reading.value)}{kind === 'spo2' ? '%' : unit === 'C' ? 'C' : 'h'}</strong>
            <span>{trusted ? (en ? 'Current' : 'Vigente') : (en ? 'Not current' : 'No vigente')}</span>
          </>
        ) : (
          <>
            <strong>—</strong>
            <span>{en ? 'No reading' : 'Sin lectura'}</span>
          </>
        )}
      </dd>
    </div>
  )
}

function SymptomButton() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const labels = SYMPTOM_LABEL[lang]
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const key = useRef('')
  return (
    <>
      <button className="btn btn-primary" type="button" data-testid="open-symptom" onClick={() => { key.current = `sym-${state.seq}-${state.symptoms.length}`; setOpen(true) }}>
        <ClipboardPlus aria-hidden="true" size={18} strokeWidth={1.75} /> {en ? 'Record symptoms' : 'Registrar síntomas'}
      </button>
      <Modal open={open} title={en ? 'Record how they feel' : 'Registrar cómo se siente'} description={en ? 'The text is simulated clinical data. It is not an order for the system.' : 'El texto es un dato clínico simulado. No es una orden para el sistema.'} onClose={() => setOpen(false)}>
        {SYMPTOMS.map((id) => (
          <label key={id} className="check">
            <input data-testid={`symptom-${id}`} type="checkbox" checked={picked.includes(id)} onChange={() => setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} />
            {labels[id]}
          </label>
        ))}
        <Field id="symptom-note" label={en ? 'Note' : 'Nota'} error={error}>
          <textarea id="symptom-note" data-testid="symptom-note" maxLength={2000} value={note} aria-invalid={Boolean(error)} aria-describedby={error ? 'symptom-note-error' : undefined} onChange={(event) => setNote(event.target.value)} />
        </Field>
        <button className="btn btn-primary" type="button" data-testid="save-symptom" onClick={() => {
          if (picked.length === 0 && note.trim() === '') { setError(en ? 'Enter at least one symptom or a note.' : 'Indicá al menos un síntoma o una nota.'); return }
          if (picked.includes('otro') && note.trim() === '') { setError(en ? 'If you choose Other, the note is required.' : 'Si elegís Otro, la nota es obligatoria.'); return }
          dispatch({ type: 'addSymptom', crewId: state.selectedCrewId, symptoms: picked, note, idempotencyKey: key.current })
          setOpen(false); setPicked([]); setNote(''); setError('')
        }}>{en ? 'Save report' : 'Guardar reporte'}</button>
      </Modal>
    </>
  )
}

function RepeatButton() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [atRest, setAtRest] = useState(false)
  const key = useRef('')
  return (
    <>
      <button className="btn" type="button" data-testid="open-repeat" onClick={() => { key.current = `rep-${state.seq}`; setOpen(true) }}><RefreshCw aria-hidden="true" size={18} strokeWidth={1.75} /> {en ? 'Repeat measurement' : 'Repetir medición'}</button>
      <Modal open={open} title={en ? 'Repeat heart rate' : 'Repetir frecuencia cardíaca'} description={en ? 'If the scenario has no reading, a value is not invented.' : 'Si el escenario no tiene una lectura, no se inventa un valor.'} onClose={() => setOpen(false)}>
        <label className="check"><input data-testid="rest-check" type="checkbox" checked={atRest} onChange={(event) => setAtRest(event.target.checked)} /> {en ? 'The person is at rest' : 'La persona está en reposo'}</label>
        <button className="btn btn-primary" type="button" data-testid="save-repeat" onClick={() => { dispatch({ type: 'repeatMeasurement', crewId: state.selectedCrewId, idempotencyKey: key.current, atRest }); setOpen(false) }}>{en ? 'Record' : 'Registrar'}</button>
      </Modal>
    </>
  )
}
