import { FileText, Inbox, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { answerLocal } from '../domain/analysis'
import { canManageComms } from '../domain/access'
import { CREW } from '../domain/crew'
import { auditActionLabel, formatMission, roleLabel } from '../domain/format'
import { useLocale } from '../i18n'
import { useApp } from '../state/store'
import { SpaceRequests } from '../components/SpaceRequests'
import { Field, Modal } from '../components/ui'
import type { AppState, Communication, Episode } from '../../shared/types'

const ORDER = ['draft', 'queued', 'sent', 'received'] as const

export function MedicalPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state, dispatch, backendError } = useApp()
  const allowed = canManageComms(state.role)
  const crew = CREW.find((item) => item.id === state.selectedCrewId)
  const episode = state.episodes.find((item) => item.id === state.selectedEpisodeId && item.crewId === state.selectedCrewId) ?? null
  const caseKey = `${state.selectedCrewId}:${episode?.id ?? 'none'}`
  const draft = draftFor(state, state.selectedCrewId, episode?.id ?? null)
  const [subject, setSubject] = useState(() => draft?.subject ?? defaultSubject(episode, crew?.name ?? '', en))
  const [body, setBody] = useState(() => draft?.body ?? '')
  const [loadedKey, setLoadedKey] = useState(caseKey)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [choice, setChoice] = useState<string | null>(null)
  const seenNotice = useRef(state.notice?.text ?? '')
  const pendingKey = useRef<string | null>(null)

  if (loadedKey !== caseKey) {
    const nextDraft = draftFor(state, state.selectedCrewId, episode?.id ?? null)
    setLoadedKey(caseKey)
    setSubject(nextDraft?.subject ?? defaultSubject(episode, crew?.name ?? '', en))
    setBody(nextDraft?.body ?? '')
    setError('')
    setNote('')
    setChoice(null)
    setSaving(false)
    pendingKey.current = null
  }

  useEffect(() => {
    if (!saving) return
    const text = state.notice?.text ?? ''
    if (backendError || (text && text !== seenNotice.current)) {
      setSaving(false)
      if (state.notice?.tone === 'ok') pendingKey.current = null
    }
  }, [backendError, saving, state.notice])

  function localSummary(): string | null {
    if (!episode) return null
    return answerLocal(state, episode.id, en ? 'Summary for the specialist.' : 'Resumen para el especialista.')?.summary ?? null
  }

  function applySummary(summary: string, mode: 'replace' | 'append') {
    setBody((current) => {
      if (current.trim() === summary.trim()) return current
      if (mode === 'replace') return summary
      if (current.includes(summary)) return current
      return current.trim() ? `${current.replace(/\s+$/, '')}\n\n${summary}` : summary
    })
    setNote(en ? 'The local summary is in the text. Nothing was sent.' : 'El resumen local está en el texto. No se envió nada.')
    setChoice(null)
  }

  function copySummary() {
    const summary = localSummary()
    if (!summary) {
      setNote(en
        ? 'There is no open episode for this person, so there is no local summary to copy.'
        : 'No hay un episodio abierto para esta persona, así que no hay un resumen local que copiar.')
      return
    }
    const current = body.trim()
    if (!current) {
      applySummary(summary, 'replace')
      return
    }
    if (current === summary.trim() || body.includes(summary)) {
      setNote(en ? 'That summary is already in the text. It was not duplicated.' : 'Ese resumen ya está en el texto. No se duplicó.')
      return
    }
    setChoice(summary)
  }

  function saveDraft() {
    if (saving) return
    if (!allowed) {
      setError(en ? 'This simulated role can view the queue, but cannot save a draft.' : 'Este rol simulado puede mirar la cola, pero no puede guardar un borrador.')
      return
    }
    if (subject.trim().length < 3 || body.trim().length < 3) {
      setError(en ? 'Subject and text are required.' : 'Asunto y texto son obligatorios.')
      return
    }
    if (body.trim().length > 4000) {
      setError(en ? 'The message is over the 4000 character limit.' : 'El mensaje supera el límite de 4000 caracteres.')
      return
    }
    setError('')
    const current = draftFor(state, state.selectedCrewId, episode?.id ?? null)
    if (current && current.subject === subject.trim() && current.body === body.trim()) {
      setNote(en ? 'Draft saved. It is not queued or sent yet.' : 'Borrador guardado. Todavía no está en cola ni fue enviado.')
      return
    }
    seenNotice.current = state.notice?.text ?? ''
    setSaving(true)
    if (current) {
      dispatch({ type: 'updateCommunicationDraft', id: current.id, subject, body })
      return
    }
    const idempotencyKey = pendingKey.current ?? `draft-${caseKey}-${crypto.randomUUID()}`
    pendingKey.current = idempotencyKey
    dispatch({
      type: 'createCommunication',
      crewId: state.selectedCrewId,
      episodeId: episode?.id ?? null,
      subject,
      body,
      idempotencyKey,
    })
  }

  return (
    <div className="med-page">
      <header className="med-head">
        <p className="kicker">{en ? 'Medical team' : 'Equipo Médico'}</p>
        <h1>{en ? 'Guidance and the Earth link' : 'Orientación y enlace con Tierra'}</h1>
        <p className="lede">
          {en
            ? <>Draft, queued, sent, and received are different states. Sent does not mean received.<br />The role is simulated in this browser.</>
            : <>Borrador, cola, enviado y recibido son estados distintos. Enviado no significa recibido.<br />El rol es simulado en este navegador.</>}
        </p>
      </header>
      {!allowed ? <p className="callout callout-amber">{en ? 'This simulated role can view the queue, but cannot draft or deliver messages.' : 'Este rol simulado puede mirar la cola, pero no preparar ni entregar mensajes.'}</p> : null}
      <section className="med-panel" aria-labelledby="med-prepare">
        <h2 id="med-prepare">{en ? 'Prepare guidance' : 'Preparar orientación'}</h2>
        <Field id="comm-subject" label={en ? 'Subject' : 'Asunto'} error={error}>
          <input
            id="comm-subject"
            data-testid="comm-subject"
            value={subject}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'comm-subject-error' : undefined}
            onChange={(event) => setSubject(event.target.value)}
          />
        </Field>
        <Field id="comm-body" label={en ? 'Text' : 'Texto'}>
          <textarea id="comm-body" data-testid="comm-body" value={body} maxLength={4000} onChange={(event) => setBody(event.target.value)} />
        </Field>
        <div className="med-actions">
          <button className="med-copy" type="button" data-testid="copy-summary" onClick={copySummary}>
            <FileText aria-hidden="true" size={18} strokeWidth={1.75} />
            {en ? 'Copy local summary into the draft' : 'Copiar resumen local al borrador'}
          </button>
          <button className="med-save" type="button" data-testid="save-draft" aria-busy={saving} disabled={saving || !allowed} onClick={saveDraft}>
            {saving ? (en ? 'Saving…' : 'Guardando…') : (en ? 'Save Draft' : 'Guardar borrador')}
          </button>
        </div>
        <p className="med-status" role="status">{note}</p>
      </section>
      <div className="med-rest">
        <SpaceRequests />
        <section className="panel">
          <div className="spread">
            <h2>{en ? 'Messages' : 'Mensajes'}</h2>
            <div className="row">
              <button className="btn" type="button" data-testid="deliver-comm" disabled={!allowed || state.link === 'down'} onClick={() => dispatch({ type: 'deliverQueued' })}><Send aria-hidden="true" size={18} strokeWidth={1.75} /> {en ? 'Mark sent' : 'Marcar enviados'}</button>
              <button className="btn" type="button" data-testid="confirm-comm" disabled={!allowed || state.link === 'down'} onClick={() => dispatch({ type: 'confirmReceived' })}><Inbox aria-hidden="true" size={18} strokeWidth={1.75} /> {en ? 'Confirm receipt' : 'Confirmar recepción'}</button>
            </div>
          </div>
          {state.link === 'down' ? <p className="callout callout-amber">{en ? 'The link is down. The queue is kept and is not marked sent.' : 'El enlace está cortado. La cola se conserva y no se marca como enviada.'}</p> : null}
          <p className="muted">{en ? 'Saving a draft does not queue, send, or mark it received. A simulated receipt is not a real acknowledgement.' : 'Guardar un borrador no lo pone en cola, no lo envía y no lo marca como recibido. Un acuse de esta simulación no es una confirmación real.'}</p>
          <dl className="quiet-metrics">
            {ORDER.map((status) => (
              <div key={status} className="metric"><dt>{statusLabel(status, en)}</dt><dd>{state.communications.filter((item) => item.status === status).length}</dd></div>
            ))}
          </dl>
          {state.communications.length === 0 ? <p className="muted">{en ? 'There are no messages in this scenario.' : 'No hay mensajes en este escenario.'}</p> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>{en ? 'Sequence' : 'Secuencia'}</th><th>{en ? 'Subject' : 'Asunto'}</th><th>{en ? 'Status' : 'Estado'}</th><th>{en ? 'Queued' : 'En cola'}</th><th>{en ? 'Sent' : 'Enviado'}</th><th>{en ? 'Received' : 'Recibido'}</th><th></th></tr></thead>
                <tbody>
                  {[...state.communications].sort((a, b) => a.sequence - b.sequence).map((item) => (
                    <tr key={item.id}>
                      <td>{item.sequence}</td>
                      <td>{item.subject}<br /><span className="muted">{CREW.find((person) => person.id === item.crewId)?.name}</span></td>
                      <td>{statusLabel(item.status, en)}</td>
                      <td>{item.queuedAt ? formatMission(item.queuedAt) : '—'}</td>
                      <td>{item.sentAt ? formatMission(item.sentAt) : '—'}</td>
                      <td>{item.receivedAt ? formatMission(item.receivedAt) : '—'}</td>
                      <td>{item.status === 'draft' ? <button className="btn" type="button" data-testid="queue-comm" disabled={!allowed} onClick={() => dispatch({ type: 'transitionCommunication', id: item.id, status: 'queued' })}>{en ? 'Queue' : 'Poner en cola'}</button> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="panel">
          <h2>{en ? 'Recent audit' : 'Auditoría reciente'}</h2>
          <ul>{state.audit.slice(-8).reverse().map((item) => <li key={item.id}>{formatMission(item.at)} · {roleLabel(item.actor)} · {auditActionLabel(item.action)} · {item.detail}</li>)}</ul>
        </section>
      </div>
      <Modal
        open={choice !== null}
        title={en ? 'The draft already has text' : 'El borrador ya tiene texto'}
        description={en ? 'Choose whether to keep it, add the summary, or replace it. Nothing is sent.' : 'Elegí si lo conservás, si añadís el resumen o si lo reemplazás. No se envía nada.'}
        onClose={() => setChoice(null)}
      >
        <div className="row">
          <button className="btn" type="button" onClick={() => { setChoice(null); setNote(en ? 'The text you wrote was kept.' : 'Se conservó el texto que escribiste.') }}>{en ? 'Keep' : 'Conservar'}</button>
          <button className="btn" type="button" onClick={() => choice && applySummary(choice, 'append')}>{en ? 'Add' : 'Añadir'}</button>
          <button className="btn btn-primary" type="button" onClick={() => choice && applySummary(choice, 'replace')}>{en ? 'Replace' : 'Reemplazar'}</button>
        </div>
      </Modal>
    </div>
  )
}

function draftFor(state: AppState, crewId: AppState['selectedCrewId'], episodeId: string | null): Communication | null {
  return state.communications
    .filter((item) => item.status === 'draft' && item.crewId === crewId && item.episodeId === episodeId)
    .sort((a, b) => b.sequence - a.sequence)[0] ?? null
}

function defaultSubject(episode: Episode | null, crewName: string, en: boolean): string {
  const prefix = en ? 'Review' : 'Revisión'
  return `${prefix} - ${episode?.title ?? crewName}`
}

function statusLabel(status: string, en: boolean): string {
  if (status === 'draft') return en ? 'Draft' : 'Borrador'
  if (status === 'queued') return en ? 'Queued' : 'En cola'
  if (status === 'sent') return en ? 'Sent' : 'Enviado'
  return en ? 'Received' : 'Recibido'
}
