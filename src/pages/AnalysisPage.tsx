import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DEMO_PROTOCOLS } from '../../shared/protocols'
import type { AnalysisResult } from '../../shared/types'
import { analysisIsStale, episodeFingerprint, runLocalAnalysis } from '../domain/analysis'
import { buildAnalysisContext } from '../ai/context'
import { askModel, getAiHealth, type AiHealth } from '../ai/client'
import { useApp } from '../state/store'
import { SciencePanel } from '../components/SciencePanel'
import { CREW } from '../domain/crew'
import { briefForCrew } from '../domain/scienceBrief'
import { useLocale } from '../i18n'
import { alertKindLabel, alertReasonLabel } from '../domain/alertCopy'

const QUESTIONS_ES = [
  '¿Qué cambió respecto a las últimas mediciones?',
  '¿Qué información falta?',
  '¿En qué datos se basa esta alerta?',
  '¿Qué equipo tenemos para repetir la medición?',
  'Prepará un resumen para mi especialista.',
  '¿Qué debo revisar antes de abordar?',
  '¿Qué seguimiento tengo pendiente después de regresar?',
]

const QUESTIONS_EN = [
  'What changed compared with the latest readings?',
  'What information is missing?',
  'Which data is this alert based on?',
  'What equipment do we have to repeat the measurement?',
  'Prepare a summary for my specialist.',
  'What should I review before boarding?',
  'What follow-up is still open after I return?',
]

export function AnalysisPage() {
  const { state, dispatch, analyzeEpisode } = useApp()
  const { lang, copy } = useLocale()
  const en = lang === 'en'
  const location = useLocation()
  const linkedId = (location.state as { alertId?: string } | null)?.alertId
  const linked = linkedId ? state.alerts.find((item) => item.id === linkedId) : undefined
  const episode = linked
    ? state.episodes.find((item) => item.id === linked.episodeId)
    : state.episodes.find((item) => item.id === state.selectedEpisodeId) ?? state.episodes.find((item) => item.status !== 'closed')
  const linkedName = linked?.crewId ? CREW.find((crew) => crew.id === linked.crewId)?.name : undefined
  const [health, setHealth] = useState<AiHealth | null>(null)
  const [pending, setPending] = useState(false)
  const [modelError, setModelError] = useState('')
  const [question, setQuestion] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const flight = useRef('')

  useEffect(() => {
    const controller = new AbortController()
    void getAiHealth(controller.signal).then(setHealth)
    return () => controller.abort()
  }, [])

  const local = episode ? runLocalAnalysis(state, episode.id) : null
  const saved = episode ? [...state.analyses].reverse().find((item) => item.episodeId === episode.id && item.source === 'model') : undefined
  const stale = saved && episode ? analysisIsStale(state, saved.fingerprint, episode.id) : false
  const chat = episode ? state.chats.filter((item) => item.episodeId === episode.id) : []

  async function send(text: string, mode: 'model' | 'local') {
    if (!episode || pending) return
    const trimmed = text.trim()
    if (!trimmed) return
    const key = `${mode}-${episode.id}-${trimmed}-${state.chats.length}`
    if (flight.current === key) return
    flight.current = key
    dispatch({
      type: 'appendChat',
      message: { id: `${key}-user`, episodeId: episode.id, role: 'user', text: trimmed, source: 'user', at: state.clock.simulatedAt, idempotencyKey: `${key}-user`, result: null },
    })
    if (mode === 'local') {
      setPending(true)
      let result: AnalysisResult | null = null
      try {
        result = await analyzeEpisode(episode.id, trimmed)
      } catch {
        setModelError('No se pudo consultar el motor determinista.')
      } finally {
        setPending(false)
      }
      if (result) {
        dispatch({
          type: 'appendChat',
          message: { id: `${key}-local`, episodeId: episode.id, role: 'assistant', text: result.summary, source: 'local_engine', at: state.clock.simulatedAt, idempotencyKey: `${key}-local`, result },
        })
      }
      flight.current = ''
      return
    }
    const context = buildAnalysisContext(state, episode.id, trimmed, lang)
    if (!context) return
    const controller = new AbortController()
    abortRef.current = controller
    setPending(true)
    setModelError('')
    const response = await askModel('/api/ai/chat', context, controller.signal)
    setPending(false)
    flight.current = ''
    if (!response.ok) {
      if (response.code !== 'aborted') setModelError(response.message)
      dispatch({
        type: 'appendChat',
        message: { id: `${key}-error`, episodeId: episode.id, role: 'assistant', text: response.message, source: 'error', at: state.clock.simulatedAt, idempotencyKey: `${key}-error`, result: null },
      })
      return
    }
    dispatch({
      type: 'recordAnalysis',
      idempotencyKey: `${key}-record`,
      record: {
        id: `${key}-record`,
        episodeId: episode.id,
        crewId: episode.crewId,
        source: 'model',
        createdAt: state.clock.simulatedAt,
        model: response.model,
        fingerprint: episodeFingerprint(state, episode.id),
        snapshot: snapshot(state, episode.id),
        result: response.result,
      },
    })
    dispatch({
      type: 'appendChat',
      message: { id: `${key}-model`, episodeId: episode.id, role: 'assistant', text: response.result.summary, source: 'model', at: state.clock.simulatedAt, idempotencyKey: `${key}-model`, result: response.result },
    })
  }

  const emptyText = linked
    ? `${linkedName ? `${linkedName}: ` : ''}${alertKindLabel(linked.type, linked.title, en)}. ${alertReasonLabel(linked, linkedName, en)} ${en ? 'A sensor alert, on its own, does not open a health episode.' : 'Una alerta de sensor, por sí sola, no abre un episodio de salud.'}`
    : (en ? 'There is no open health episode. A sensor alert, on its own, does not create one.' : 'No hay un episodio de salud abierto. Una alerta de sensor, por sí sola, no crea uno.')

  return (
    <div className="an-page">
      <header className="an-head">
        <p className="kicker">{en ? 'Analysis' : 'Análisis'}</p>
        <h1>{episode ? episode.title : (en ? 'No open episode' : 'Sin episodio abierto')}</h1>
        <p className="lede">
          {en
            ? 'The local engine is always available. A model answer is labeled separately and does not run actions.'
            : 'El motor local siempre está disponible. Una respuesta del modelo se etiqueta aparte y no ejecuta acciones.'}
        </p>
      </header>
      {!local || !episode ? <p className="an-card an-empty">{emptyText}</p> : (
        <>
          <section className="an-card" data-testid="analysis-local">
            <h2>{en ? 'Simulated analysis engine' : 'Motor de análisis simulado'}</h2>
            <p className="an-summary">{local.summary}</p>
            <h3>{en ? 'Evidence' : 'Evidencia'}</h3>
            <div className="an-lines">
              {local.evidence.map((item) => (
                <p key={`${item.refType}-${item.refId}`}>{item.statement} ({item.refId})</p>
              ))}
            </div>
            <p className="sr-only">
              {en
                ? 'Valid integrity is not the same as clinical accuracy. Demonstration checks are not a validated clinical protocol. Resource availability is not a prescription.'
                : 'Una integridad válida no equivale a una medición clínicamente precisa. Las comprobaciones son de demostración, no un protocolo clínico validado. La disponibilidad de un recurso no es una indicación de uso.'}
            </p>
          </section>
          <section className="an-card" aria-label={en ? 'Missing information, checks and cited resources' : 'Información faltante, comprobaciones y recursos citados'}>
            <h3>{en ? 'Missing' : 'Falta'}</h3>
            <div className="an-lines">
              {local.missing.length === 0
                ? <p>{en ? 'The local engine does not mark another gap in this episode.' : 'El motor local no marca otro dato faltante en este episodio.'}</p>
                : local.missing.map((item) => <p key={item}>{item}</p>)}
            </div>
            <h3>{en ? 'Checks' : 'Comprobaciones'}</h3>
            <div className="an-lines">
              {local.checks.map((item) => <p key={item.protocolId}>{item.title}. {item.why}</p>)}
            </div>
            <h3>{en ? 'Cited resources' : 'Recursos citados'}</h3>
            <div className="an-lines">
              {local.resources.length === 0
                ? <p>{en ? 'No ready resource is cited. Availability is not assumed from the example text.' : 'No se cita un recurso listo. No se supone disponibilidad solo porque un ejemplo la mencione.'}</p>
                : local.resources.map((item) => <p key={item.resourceId}>{item.note}</p>)}
            </div>
          </section>
          {saved ? (
            <section className="an-card an-model" aria-label={en ? 'Model answer' : 'Respuesta del modelo'}>
              <h2>{en ? 'Model answer' : 'Respuesta del modelo'}</h2>
              {stale ? <p>{en ? 'Measurements changed after this answer. It may be out of date.' : 'Las mediciones cambiaron después de esta respuesta. Puede estar desactualizada.'}</p> : null}
              <p className="an-summary">{saved.result.summary}</p>
              <p className="an-meta">{en ? 'Source: model' : 'Origen: modelo'}{saved.model ? ` · ${saved.model}` : ''}. {en ? 'It does not close alerts, change inventory, or send anything.' : 'No cierra alertas, no cambia el inventario ni envía nada.'}</p>
            </section>
          ) : null}
          <details className="an-more">
            <summary>{en ? 'Ask the local engine' : 'Preguntar al motor local'}</summary>
            <SciencePanel brief={briefForCrew(state, episode.crewId, lang)} />
            <p>{copy.analysisNasa}</p>
            <div className="questions">
              {(en ? QUESTIONS_EN : QUESTIONS_ES).map((item) => (
                <button key={item} type="button" className="btn btn-ghost" data-testid="ask-local" onClick={() => void send(item, 'local')}>{item}</button>
              ))}
            </div>
            <div className="chat-log" aria-live="polite">
              {chat.map((message) => (
                <article key={message.id} className={message.role === 'user' ? 'bubble user' : 'bubble'}>
                  <strong>{message.source === 'model' ? (en ? 'AI connected' : 'IA conectada') : message.source === 'local_engine' ? (en ? 'Local analysis' : 'Análisis local') : message.source === 'error' ? (en ? 'Service unavailable' : 'Servicio no disponible') : (en ? 'Question' : 'Pregunta')}</strong>
                  <p>{message.text}</p>
                </article>
              ))}
            </div>
            <form onSubmit={(event) => { event.preventDefault(); void send(question, 'local'); setQuestion('') }}>
              <label className="field" htmlFor="ask">{en ? 'Question' : 'Pregunta'}
                <textarea id="ask" value={question} maxLength={1000} onChange={(event) => setQuestion(event.target.value)} />
              </label>
              <div className="row">
                <button className="btn btn-primary" type="submit" disabled={pending || question.trim().length < 3}>{en ? 'Answer with the local engine' : 'Responder con el motor local'}</button>
                <button className="btn" type="button" disabled={!health?.configured || pending || question.trim().length < 3} onClick={() => void send(question, 'model')}>{en ? 'Ask the model' : 'Preguntar al modelo'}</button>
                {pending ? <button className="btn" type="button" onClick={() => abortRef.current?.abort()}>{en ? 'Cancel' : 'Cancelar'}</button> : null}
              </div>
            </form>
            {modelError ? <p role="alert">{modelError} {health?.reachable === false ? (en ? 'The local engine above stays available.' : 'El motor local de arriba sigue disponible.') : ''}</p> : null}
            {health && !health.configured ? <p>{en ? 'The remote model is not connected. The blocks above come from the local engine.' : 'El modelo remoto no está conectado. Los bloques de arriba salen del motor local.'}</p> : null}
          </details>
        </>
      )}
    </div>
  )
}

function snapshot(state: { measurements: { id: string; crewId: string }[]; symptoms: { id: string; episodeId: string; crewId: string }[]; resources: { id: string }[]; alerts: { id: string; crewId: string | null }[] }, episodeId: string) {
  const episodeCrew = state.symptoms.find((item) => item.episodeId === episodeId)
  return {
    measurementIds: state.measurements.filter((item) => episodeCrew && item.crewId === episodeCrew.crewId).map((item) => item.id).slice(0, 20),
    symptomIds: state.symptoms.filter((item) => item.episodeId === episodeId).map((item) => item.id),
    resourceIds: state.resources.map((item) => item.id),
    alertIds: state.alerts.filter((item) => episodeCrew && item.crewId === episodeCrew.crewId).map((item) => item.id),
    protocolIds: DEMO_PROTOCOLS.map((item) => item.id),
  }
}

