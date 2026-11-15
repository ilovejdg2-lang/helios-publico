import { useEffect, useRef, useState } from 'react'
import type { AppState } from '../../../shared/types'
import type { CareAiOptions, CareDraft } from '../../../shared/careSchema'
import { revokeSpaceModel } from '../../ai/client'
import { platformApi } from '../../platform/api'
import { getActiveMissionId } from '../../platform/session'

export const LOCAL_CARE: CareAiOptions = { modelConsent: false, historyConsent: false, dataConsent: false }
/** Free-form care chat uses the model by default; no privacy checklist in the UI. */
export const AI_CARE: CareAiOptions = { modelConsent: true, historyConsent: true, dataConsent: false }

export function CareAiControls({ conversationId, messageCount, locale, state: _state, disabled, onChange, onCancel }: {
  conversationId: string; messageCount: number; locale: 'es' | 'en'; state: AppState | null; disabled: boolean
  onChange: (options: CareAiOptions) => void; onCancel: () => void
}) {
  const en = locale === 'en'
  const [options, setOptions] = useState<CareAiOptions>(AI_CARE)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<CareDraft | null>(null)
  const [summary, setSummary] = useState('')
  const [recipient, setRecipient] = useState('')
  const [recipients, setRecipients] = useState<Array<{ id: string; role: string }>>([])
  const [notice, setNotice] = useState('')
  const request = useRef<AbortController | null>(null)
  /** Quirón consent grant `{ sessionId, token }` — NOT a call to `/api/monitoring`. */
  const grant = useRef<CareAiOptions['monitoring']>(undefined)

  useEffect(() => {
    setOptions(AI_CARE)
    onChange(AI_CARE)
    return () => {
      request.current?.abort()
      if (grant.current) void revokeSpaceModel(grant.current)
      onChange(LOCAL_CARE)
    }
  }, [onChange])

  async function generateDraft() {
    onCancel()
    const controller = new AbortController(); request.current = controller
    setBusy(true); setError(''); setNotice(''); setDraft(null)
    try {
      const result = await platformApi.quironDraft(conversationId, locale, options, controller.signal)
      const missionId = getActiveMissionId()
      const mission = missionId ? await platformApi.mission(missionId) : null
      if (controller.signal.aborted) return
      setDraft(result); setSummary(result.text); setRecipient('')
      setRecipients((mission?.members ?? []).filter(m => m.status === 'active' && ['medic', 'psychologist'].includes(m.role))
        .map(m => ({ id: m.profileId, role: m.role })))
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not generate draft')
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }

  async function approve() {
    if (!draft || !recipient || draft.expectedMessages !== messageCount || !summary.trim()) return
    setBusy(true); setError('')
    try {
      await platformApi.quironSummary(conversationId, summary.trim(), recipient, draft.expectedMessages)
      setDraft(null); setSummary('')
      setNotice(en ? 'Summary approved for the selected professional. No notification was sent.' : 'Resumen aprobado para el profesional seleccionado. No se envió ninguna notificación.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not approve summary') }
    finally { setBusy(false) }
  }

  return <div className="quiron-care-controls">
    <button type="button" disabled={disabled || busy || messageCount < 3} onClick={() => void generateDraft()}>{en ? 'Prepare a summary for review' : 'Preparar resumen para revisión'}</button>
    {draft ? <div>
      <p>{en ? 'Draft only — not shared. Review and edit before approving.' : 'Solo borrador: no se ha compartido. Revísalo y edítalo antes de aprobar.'} {draft.source === 'model' ? draft.model : (en ? 'Local engine' : 'Motor local')}</p>
      <label>{en ? 'Summary to review' : 'Resumen para revisar'}<textarea value={summary} maxLength={2000} onChange={e => setSummary(e.target.value)} /></label>
      <label>{en ? 'Professional recipient' : 'Profesional destinatario'}<select value={recipient} onChange={e => setRecipient(e.target.value)}>
        <option value="">{en ? 'Choose a professional' : 'Elige un profesional'}</option>
        {recipients.map(r => <option key={r.id} value={r.id}>{r.id} · {r.role}</option>)}
      </select></label>
      {draft.expectedMessages !== messageCount ? <p>{en ? 'The conversation changed. Generate a new draft.' : 'La conversación cambió. Genera un borrador nuevo.'}</p> : null}
      <button type="button" disabled={disabled || busy || !recipient || !summary.trim() || draft.expectedMessages !== messageCount} onClick={() => void approve()}>{en ? 'Approve and share this summary' : 'Aprobar y compartir este resumen'}</button>
      <button type="button" onClick={() => setDraft(null)}>{en ? 'Discard draft' : 'Descartar borrador'}</button>
      {draft.notice ? <p>{draft.notice}</p> : null}
    </div> : null}
    {error ? <p role="alert">{error}</p> : null}
    {notice ? <p role="status">{notice}</p> : null}
  </div>
}
