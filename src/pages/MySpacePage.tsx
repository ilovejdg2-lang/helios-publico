import * as Switch from '@radix-ui/react-switch'
import { useEffect, useRef, useState } from 'react'
import type { AppState, CrewId } from '../../shared/types'
import { recentSpaceMessages } from '../ai/spaceMemory'
import {
  askSpaceModel,
  authorizeSpaceModel,
  revokeSpaceModel,
} from '../ai/client'
import { buildSpaceContext } from '../ai/spaceContext'
import { canReadMySpace } from '../domain/access'
import { CREW, crewById } from '../domain/crew'
import { SIMULATED_PINS, simulatedPinMatches } from '../domain/spaceAccess'
import {
  answerSpace,
  applySpaceProposal,
  openSpace,
} from '../domain/spaceEngine'
import { spacePreview } from '../domain/spacePreview'
import {
  readSpace,
  writeSpace,
  type SpaceDataUse,
  type SpaceRecord,
  type SpaceShareLevel,
} from '../persistence/space'
import { useLocale } from '../i18n'
import { useApp } from '../state/store'
import { Field } from '../components/ui'

const QUICK = [
  'Estoy cansada',
  'Necesito descansar',
  'Quiero hablar con alguien',
  'Me siento mal ahora',
] as const

const LEVELS: { id: SpaceShareLevel; label: string }[] = [
  { id: 'solo_yo', label: 'Solo yo' },
  { id: 'generica', label: 'Genérica' },
  { id: 'medico', label: 'Médico de vuelo' },
  { id: 'equipo', label: 'Equipo' },
]

const SWITCHES: { id: keyof SpaceDataUse; label: string }[] = [
  { id: 'sleep', label: 'Sueño' },
  { id: 'pulse', label: 'Pulso' },
  { id: 'symptoms', label: 'Síntomas' },
]

export function MySpacePage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state, dispatch, authenticatedCrewId, unlockSpace } = useApp()
  const allowed = canReadMySpace(
    state.role,
    authenticatedCrewId,
    state.sessionCrewId,
  )
  const [record, setRecord] = useState<SpaceRecord | null>(null)
  const [draft, setDraft] = useState('')
  const [level, setLevel] = useState<SpaceShareLevel>('generica')
  const [note, setNote] = useState('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [modelConsent, setModelConsent] = useState(false)
  const [historyConsent, setHistoryConsent] = useState(false)
  const [missionConsent, setMissionConsent] = useState(false)
  const [responding, setResponding] = useState(false)
  const [modelStatus, setModelStatus] = useState('')
  const activeRequest = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const grant = useRef<{
    sessionId: string
    token: string
    expiresAt: number
  } | null>(null)
  const historyStart = useRef(0)
  const stateRef = useRef(state)
  stateRef.current = state
  function cancelResponse() {
    generation.current += 1
    activeRequest.current?.abort()
    activeRequest.current = null
    setResponding(false)
  }
  function revokeConsent() {
    cancelResponse()
    const access = grant.current
    grant.current = null
    if (access) void revokeSpaceModel(access)
    historyStart.current = recordRef.current?.messages.length ?? 0
    setModelStatus('')
  }
  const ownerKey = `${state.role}:${state.sessionCrewId}:${authenticatedCrewId}`
  const owner = useRef(ownerKey)
  owner.current = ownerKey
  const draftRef = useRef<HTMLTextAreaElement>(null)
  const recordRef = useRef<SpaceRecord | null>(null)
  recordRef.current = record

  useEffect(() => {
    if (!allowed) {
      setRecord(null)
      return
    }
    let active = true
    readSpace(state.role, authenticatedCrewId, state.sessionCrewId)
      .then(async (result) => {
        if (!active || !result.ok) return
        if (result.record.messages.some((item) => item.role === 'assistant')) {
          historyStart.current = result.record.messages.length
          recordRef.current = result.record
          setRecord(result.record)
          return
        }
        const opening = openSpace(
          stateRef.current,
          state.sessionCrewId,
          result.record.dataUse,
          lang,
        )
        const next = {
          ...result.record,
          messages: [
            ...result.record.messages,
            {
              id: `space-open-${stateRef.current.clock.simulatedAt}`,
              role: 'assistant' as const,
              text: opening,
              at: stateRef.current.clock.simulatedAt,
            },
          ],
        }
        const saved = await writeSpace(
          state.role,
          authenticatedCrewId,
          state.sessionCrewId,
          next,
        )
        if (!active) return
        historyStart.current = (saved.ok ? next : result.record).messages.length
        recordRef.current = saved.ok ? next : result.record
        setRecord(saved.ok ? next : result.record)
      })
      .catch(() => {
        if (active) setNote('No se pudo abrir tu espacio en este navegador.')
      })
    return () => {
      active = false
    }
  }, [allowed, authenticatedCrewId, state.role, state.sessionCrewId, lang])

  useEffect(() => {
    setModelConsent(false)
    setHistoryConsent(false)
    setMissionConsent(false)
    setResponding(false)
    activeRequest.current = null
    return () => {
      generation.current += 1
      activeRequest.current?.abort()
      const access = grant.current
      grant.current = null
      if (access) void revokeSpaceModel(access)
    }
  }, [ownerKey])

  const sessionCrew = crewById(state.sessionCrewId)
  const firstName = sessionCrew.name.split(' ')[0] ?? sessionCrew.name
  const preview = spacePreview(firstName, level, draft)
  const received = sharedSymptoms(state, state.sessionCrewId)

  async function commit(next: SpaceRecord) {
    const scope = owner.current
    recordRef.current = next
    setRecord(next)
    const saved = await writeSpace(
      state.role,
      authenticatedCrewId,
      state.sessionCrewId,
      next,
    )
    if (!saved.ok && owner.current === scope)
      setNote(
        en
          ? 'This simulated role cannot save this space.'
          : 'Este rol simulado no puede guardar en este espacio.',
      )
  }

  async function appendMessage(text: string) {
    const current = recordRef.current
    if (!current || !allowed || responding || activeRequest.current) return
    const trimmed = text.trim().slice(0, 2000)
    if (!trimmed) return
    const localHistory = current.messages.slice(historyStart.current).slice(-12)
    const turn = answerSpace(
      state,
      state.sessionCrewId,
      current.dataUse,
      trimmed,
      localHistory,
      lang,
    )
    const at = state.clock.simulatedAt
    const id = crypto.randomUUID()
    const assistantId = `space-assistant-${id}`
    const next: SpaceRecord = {
      ...current,
      messages: [
        ...current.messages,
        { id: `space-user-${id}`, role: 'user', text: trimmed, at },
        {
          id: assistantId,
          role: 'assistant',
          text: turn.assistantText,
          at,
          source: 'local_engine' as const,
        },
      ].slice(-200) as SpaceRecord['messages'],
    }
    historyStart.current = Math.max(
      0,
      historyStart.current - Math.max(0, current.messages.length + 2 - 200),
    )
    setDraft(trimmed)
    // Keep the person's sharing level unchanged; suggestions are not consent.
    if (turn.requiereHumanoAhora) {
      dispatch({
        type: 'raiseSpaceAlert',
        crewId: state.sessionCrewId,
        categories: turn.categories,
        idempotencyKey: `space-escalate-${id}`,
      })
    }
    void commit(next)
    if (turn.requiereHumanoAhora || !modelConsent) return
    const controller = new AbortController()
    activeRequest.current = controller
    const version = ++generation.current
    const scope = owner.current
    setResponding(true)
    setModelStatus('')
    try {
      const sessionId = sessionStorage.getItem('vitalink-simulation-id') ?? ''
      if (
        !grant.current ||
        grant.current.expiresAt <= Date.now() ||
        grant.current.sessionId !== sessionId
      ) {
        const access = await authorizeSpaceModel(
          sessionId,
          state.sessionCrewId,
          pin,
          { ...current.dataUse, mission: missionConsent },
          historyConsent,
          AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
        )
        if (
          controller.signal.aborted ||
          version !== generation.current ||
          owner.current !== scope
        ) {
          void revokeSpaceModel({ sessionId, ...access })
          return
        }
        grant.current = { sessionId, ...access }
      }
      const context = buildSpaceContext(
        state,
        state.sessionCrewId,
        current.dataUse,
        trimmed,
      )
      context.locale = lang
      context.selectedLevel = level
      context.history = historyConsent
        ? recentSpaceMessages(localHistory, trimmed)
        : []
      // Authoritative simulation data is selected by Nest, never sent as client claims.
      context.datosPersona = { measurements: [], symptoms: [] }
      const response = await askSpaceModel(
        context,
        controller.signal,
        grant.current,
      )
      if (
        controller.signal.aborted ||
        version !== generation.current ||
        owner.current !== scope
      )
        return
      if (!response.ok) {
        setModelStatus(
          en
            ? 'The model is unavailable. The local response remains available.'
            : 'El modelo no está disponible. Se conserva la respuesta local.',
        )
        return
      }
      const applied = applySpaceProposal(turn, response.proposal, level)
      const latest = recordRef.current
      if (!latest || !latest.messages.some((m) => m.id === assistantId)) return
      void commit({
        ...latest,
        messages: latest.messages.map((m) =>
          m.id === assistantId
            ? { ...m, text: applied.text, source: applied.source, model: response.model, toolsUsed: response.toolsUsed }
            : m,
        ),
      })
      const names =
        response.toolsUsed
          ?.filter((t) => t.status === 'ok')
          .map((t) => t.name) ?? []
      setModelStatus(
        names.length
          ? `${en ? 'Simulation data consulted' : 'Datos de simulación consultados'}: ${names.join(', ')}`
          : en
            ? 'Model response; no simulation tools consulted.'
            : 'Respuesta del modelo; sin consultas a herramientas.',
      )
    } catch {
      if (
        !controller.signal.aborted &&
        version === generation.current &&
        owner.current === scope
      )
        setModelStatus(
          en
            ? 'Model access failed. Check the demo PIN and backend connection. Local conversation remains available.'
            : 'No se pudo autorizar el modelo. Revisá el PIN simulado y la conexión con Nest. La conversación local sigue disponible.',
        )
    } finally {
      if (version === generation.current && owner.current === scope) {
        activeRequest.current = null
        setResponding(false)
      }
    }
  }

  function saveRequest(status: 'mine' | 'sent') {
    const current = recordRef.current
    const trimmed = draft.trim()
    if (!current || !trimmed) return
    if (status === 'sent') {
      if (level === 'solo_yo') return
      dispatch({
        type: 'sendSpaceRequest',
        crewId: state.sessionCrewId,
        level,
        text: trimmed,
        idempotencyKey: `space-send-${state.sessionCrewId}-${state.clock.simulatedAt}-${current.requests.length}`,
      })
    }
    const shown = spacePreview(firstName, level, trimmed)
    const withMessage: SpaceRecord = current.messages.some(
      (item) => item.role === 'user' && item.text === trimmed,
    )
      ? current
      : {
          ...current,
          messages: [
            ...current.messages,
            {
              id: `space-msg-${state.clock.simulatedAt}-${current.messages.length}`,
              role: 'user',
              text: trimmed,
              at: state.clock.simulatedAt,
            },
          ],
        }
    const next: SpaceRecord = {
      ...withMessage,
      requests: [
        ...withMessage.requests,
        {
          id: `space-req-${state.clock.simulatedAt}-${withMessage.requests.length}`,
          preview: shown.teamLine ?? trimmed,
          shareLevel: level,
          status,
          at: state.clock.simulatedAt,
        },
      ],
    }
    setNote(
      status === 'sent'
        ? 'La solicitud quedó en el panel del equipo, con el nivel que elegiste. La conversación sigue en este espacio.'
        : 'Guardada solo para ti.',
    )
    void commit(next)
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="kicker">
            {en ? 'Emotional wellbeing' : 'Bienestar emocional'}
          </p>
          <h1>{en ? 'My space · Private' : 'Mi espacio · Privado'}</h1>
          <p className="lede">
            {en
              ? 'A private conversation with Quirón Bot. Review, edit, and authorize a summary before sharing it. The full conversation does not appear on the general panel.'
              : 'Conversación privada con Quirón Bot. Revisá, editá y autorizá un resumen antes de compartirlo. La conversación completa no aparece en el panel general.'}
          </p>
        </div>
      </header>
      {state.role !== 'astronaut' ? (
        <p className="callout">{en ? 'This simulated role does not open this module. Hiding the card would not be enough, so the read is not even requested.' : 'Con el rol simulado actual este módulo no se consulta. Ocultar la tarjeta no sería suficiente, así que la lectura ni siquiera se pide.'}</p>
      ) : null}
      {state.role === 'astronaut' && !allowed ? (
        <PinGate
          name={sessionCrew.name}
          pin={pin}
          pinError={pinError}
          onPin={setPin}
          onClearError={() => setPinError('')}
          onSubmit={() => {
            if (!simulatedPinMatches(state.sessionCrewId, pin)) {
              setPinError('Ese PIN simulado no corresponde a esta persona.')
              return
            }
            setPinError('')
            unlockSpace(state.sessionCrewId)
          }}
        />
      ) : null}
      {allowed && !record && (
        <p role="status">
          {note ||
            (en ? 'Opening your local space…' : 'Abriendo tu espacio local…')}
        </p>
      )}
      {allowed && record ? (
        <div className="stack">
          <details className="fold">
            <summary>{en ? 'What cannot stay only here' : 'Qué no puede quedarse solo aquí'}</summary>
            <p>{en ? 'Send publishes the preview for the level you choose. Generic does not include the reason or the data. Flight surgeon and Team include the text. The conversation stays here. If you write a protocol emergency, the local engine creates an alert: chest pain, fainting, trouble breathing, confusion, thoughts of harming yourself or others, and a risk to the ship.' : 'Enviar publica la vista previa del nivel que elijas. Genérica no incluye el motivo ni los datos. Médico de vuelo y Equipo incluyen el texto. La conversación se queda aquí. Si escribes una urgencia del protocolo, el motor local crea una alerta en el Centro de alertas: dolor en el pecho, desmayo, dificultad para respirar, confusión, pensamientos de hacerse daño o de dañar a otros, y un riesgo para la nave.'}</p>
          </details>
          <section className="panel">
            <h2>{en ? 'Model consent' : 'Consentimiento para el modelo'}</h2>
            <p>
              {en
                ? 'Optional. The current message and authorized recent conversation are sent to the configured AI provider. This does not share anything with the team. These choices last only while this page is open.'
                : 'Opcional. El mensaje actual y la conversación reciente autorizada se envían al proveedor de IA configurado. Esto no comparte nada con el equipo. Estas opciones duran solo mientras esta página está abierta.'}
            </p>
            <label>
              <input
                type="checkbox"
                data-testid="space-model-consent"
                checked={modelConsent}
                onChange={(e) => {
                  revokeConsent()
                  setModelConsent(e.target.checked)
                }}
              />{' '}
              {en
                ? 'Allow the model to respond'
                : 'Permitir respuestas del modelo'}
            </label>
            <label>
              <input
                type="checkbox"
                data-testid="space-history-consent"
                checked={historyConsent}
                onChange={(e) => {
                  revokeConsent()
                  setHistoryConsent(e.target.checked)
                }}
              />{' '}
              {en
                ? 'Include recent conversation (up to 12 messages)'
                : 'Incluir conversación reciente (hasta 12 mensajes)'}
            </label>
            <label>
              <input
                type="checkbox"
                checked={missionConsent}
                onChange={(e) => {
                  revokeConsent()
                  setMissionConsent(e.target.checked)
                }}
              />{' '}
              {en
                ? 'Allow read-only mission context'
                : 'Permitir consulta del contexto de misión'}
            </label>
            {modelConsent && (
              <label className="field">
                {en
                  ? 'Demo PIN to authorize the model'
                  : 'PIN simulado para autorizar el modelo'}
                <input
                  value={pin}
                  onChange={(e) => {
                    revokeConsent()
                    setPin(e.target.value)
                  }}
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="off"
                />
              </label>
            )}
            <p className="muted">
              {en
                ? 'Public demo PINs and IndexedDB do not provide real authentication or confidential storage. Mission tools require the backend; the local conversation works without them.'
                : 'Los PIN públicos e IndexedDB no proporcionan autenticación ni almacenamiento confidencial real. Las herramientas requieren Nest; la conversación local funciona sin ellas.'}
            </p>
          </section>
          <section className="panel">
            <h2>{en ? 'Data I use' : 'Datos que uso'}</h2>
            <div className="stack">
              {(en ? [
                { id: 'sleep' as const, label: 'Sleep' },
                { id: 'pulse' as const, label: 'Pulse' },
                { id: 'symptoms' as const, label: 'Symptoms' },
              ] : SWITCHES).map((item) => (
                <div key={item.id} className="switch-row">
                  <label htmlFor={`space-use-${item.id}`}>{item.label}</label>
                  <Switch.Root
                    id={`space-use-${item.id}`}
                    className="switch"
                    checked={record.dataUse[item.id]}
                    onCheckedChange={(checked) => {
                      const current = recordRef.current
                      if (!current) return
                      revokeConsent()
                      void commit({
                        ...current,
                        dataUse: { ...current.dataUse, [item.id]: checked },
                      })
                    }}
                  >
                    <Switch.Thumb className="switch-thumb" />
                  </Switch.Root>
                </div>
              ))}
            </div>
          </section>
          <p className="callout" data-testid="space-received">
            {received.length > 0
              ? `Esto ya lo recibió el equipo: ${received.join(', ')}.`
              : 'El equipo no tiene un autorreporte tuyo en este escenario.'}{' '}
            Lo que escribas aquí es privado hasta que tú lo envíes.
          </p>
          <section className="panel">
            <h2>{en ? 'How you feel' : 'Cómo te sientes'}</h2>
            <button type="button" className="chip" data-testid="space-new-conversation" onClick={() => {
              revokeConsent()
              historyStart.current = 0
              setDraft('')
              const current = recordRef.current
              if (current) void commit({ ...current, messages: [] })
            }}>{en ? 'New conversation (clears this chat)' : 'Nueva conversación (borra este chat)'}</button>
            <div className="chat-log" aria-live="polite">
              {record.messages.length === 0 ? <p className="muted">{en ? 'There are no messages in your space yet.' : 'Todavía no hay mensajes en tu espacio.'}</p> : null}
              {record.messages.map((message) => (
                <article key={message.id} className={message.role === 'user' ? 'bubble user' : 'bubble'}>
                  {message.role === 'assistant' ? <span className="muted">{message.source === 'model' ? (en ? 'Model' : 'Modelo') : (en ? 'Local engine' : 'Motor local')}</span> : null}
                  <p>{message.text}</p>
                  {message.source === 'model' && message.model && <p className="muted">{message.model.startsWith('gemini-') ? 'Gemini' : (en ? 'Model' : 'Modelo')} · {message.model}</p>}
                  {message.source === 'model' && message.toolsUsed?.some((t) => t.status === 'ok') && <details>
                    <summary>{en ? 'Evidence consulted' : 'Evidencia consultada'}</summary>
                    <ul>{message.toolsUsed.filter((t) => t.status === 'ok').map((t, i) => <li key={`${t.name}-${i}`}>{t.name}</li>)}</ul>
                    <p className="muted">{en ? 'Authorized simulation data. No notification was sent.' : 'Datos de simulación autorizados. No se envió ninguna notificación.'}</p>
                  </details>}
                </article>
              ))}
            </div>
            {record.messages
              .at(-1)
              ?.text.includes('no debe quedarse solo entre tú y yo') ||
            record.messages
              .at(-1)
              ?.text.includes('should not stay only between you and me') ? (
              <div className="row" data-testid="space-escalation">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    setLevel('medico')
                    setDraft('Necesito al médico de vuelo ahora')
                  }}
                >
                  Médico de vuelo
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setLevel('equipo')
                    setDraft('Necesito a un compañero ahora')
                  }}
                >
                  Compañero
                </button>
              </div>
            ) : null}
            <div className="chips" role="group" aria-label="Respuestas rápidas">
              {(en
                ? [
                    'I am tired',
                    'I need to rest',
                    'I want to talk to someone',
                    'I feel unwell now',
                  ]
                : QUICK
              ).map((text) => (
                <button
                  key={text}
                  type="button"
                  className="chip"
                  disabled={responding}
                  onClick={() => {
                    void appendMessage(text)
                  }}
                >
                  {text}
                </button>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void appendMessage(draft)
              }}
            >
              <Field id="space-draft" label={en ? 'Request text' : 'Texto de la solicitud'}>
                <textarea
                  id="space-draft"
                  ref={draftRef}
                  data-testid="space-draft"
                  maxLength={2000}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
              </Field>
              <button
                className="btn"
                type="submit"
                disabled={responding || !draft.trim()}
              >
                {en ? 'Talk' : 'Conversar'}
              </button>
              {responding && (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    cancelResponse()
                    setModelStatus(
                      en
                        ? 'Canceled. The local response remains available.'
                        : 'Cancelado. Se conserva la respuesta local.',
                    )
                  }}
                >
                  {en ? 'Cancel response' : 'Cancelar respuesta'}
                </button>
              )}
              <p role="status" aria-live="polite">
                {responding
                  ? en
                    ? 'Quiron is responding…'
                    : 'Quirón está respondiendo…'
                  : modelStatus}
              </p>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  cancelResponse()
                  dispatch({
                    type: 'raiseSpaceAlert',
                    crewId: state.sessionCrewId,
                    categories: ['explicit human support request'],
                    idempotencyKey: crypto.randomUUID(),
                  })
                  setNote(
                    en
                      ? 'A simulated alert was requested. Contact a crew member directly; no real person has been notified.'
                      : 'Se solicitó una alerta simulada. Contactá directamente a un compañero; no se notificó a ninguna persona real.',
                  )
                }}
              >
                {en
                  ? 'I need human support now'
                  : 'Necesito ayuda humana ahora'}
              </button>
            </form>
          </section>
          <section className="panel">
            <h2>{en ? 'Request' : 'Solicitud'}</h2>
            <p className="muted">Vista previa de lo que vería el equipo.</p>
            <p data-testid="space-preview">
              {draft.trim()
                ? preview.cardText
                : 'Escribe algo para armar la solicitud.'}
            </p>
            <div className="chips" role="group" aria-label={en ? 'Sharing level' : 'Nivel de compartir'}>
              {(en ? [
                { id: 'solo_yo' as const, label: 'Only me' },
                { id: 'generica' as const, label: 'Generic' },
                { id: 'medico' as const, label: 'Flight surgeon' },
                { id: 'equipo' as const, label: 'Team' },
              ] : LEVELS).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="chip"
                  aria-pressed={level === item.id}
                  onClick={() => {
                    cancelResponse()
                    setLevel(item.id)
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="row">
              <button
                className="btn btn-primary"
                type="button"
                data-testid="space-send"
                disabled={!draft.trim() || level === 'solo_yo'}
                onClick={() => saveRequest('sent')}
              >
                {en ? 'Send' : 'Enviar'}
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => draftRef.current?.focus()}
              >
                {en ? 'Edit' : 'Editar'}
              </button>
              <button
                className="btn"
                type="button"
                data-testid="space-keep"
                disabled={!draft.trim()}
                onClick={() => saveRequest('mine')}
              >
                Guardar solo para mí
              </button>
            </div>
            {level === 'solo_yo' ? (
              <p className="muted">
                Con Solo yo, Enviar queda deshabilitado. Usa Guardar solo para
                mí.
              </p>
            ) : null}
            {note ? (
              <p className="callout" data-testid="space-note">
                {note}
              </p>
            ) : null}
            {record.requests.length > 0 ? (
              <ul className="timeline">
                {record.requests
                  .slice()
                  .reverse()
                  .map((item) => (
                    <li key={item.id}>
                      <span className="dot" aria-hidden="true" />
                      <span>
                        {item.status === 'sent' ? 'Enviar' : 'Solo para mí'} ·{' '}
                        {item.preview}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  )
}

function sharedSymptoms(state: AppState, crewId: CrewId): string[] {
  const seen = new Set<string>()
  const labels: string[] = []
  for (const report of state.symptoms) {
    if (report.crewId !== crewId) continue
    for (const symptom of report.symptoms) {
      if (seen.has(symptom)) continue
      seen.add(symptom)
      labels.push(symptom)
    }
  }
  return labels
}

function PinGate({
  name,
  pin,
  pinError,
  onPin,
  onClearError,
  onSubmit,
}: {
  name: string
  pin: string
  pinError: string
  onPin: (value: string) => void
  onClearError: () => void
  onSubmit: () => void
}) {
  const pinHint = CREW.map(
    (crew) => `${crew.name.split(' ')[0]} ${SIMULATED_PINS[crew.id]}`,
  ).join(' · ')
  return (
    <section className="callout">
      <strong>Acceso simulado a Mi espacio</strong>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <p>
          Este PIN es simulado. Sirve solo para la demostración y no protege los
          datos. Quien controla el navegador puede leer IndexedDB.
        </p>
        <p className="muted">Códigos de demostración: {pinHint}.</p>
        <Field
          id="space-page-pin"
          label={`PIN simulado de ${name}`}
          error={pinError}
        >
          <input
            id="space-page-pin"
            data-testid="space-page-pin"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            aria-invalid={Boolean(pinError)}
            aria-describedby={pinError ? 'space-page-pin-error' : undefined}
            onChange={(event) => {
              onPin(event.target.value)
              if (pinError) onClearError()
            }}
          />
        </Field>
        <button className="btn btn-primary" type="submit">
          Abrir sesión simulada
        </button>
      </form>
    </section>
  )
}
