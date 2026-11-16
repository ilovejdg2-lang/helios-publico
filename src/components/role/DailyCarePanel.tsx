import { useEffect, useState } from 'react'
import { useLocale } from '../../i18n'
import { platformApi } from '../../platform/api'
import { enqueueOfflineOp, isBrowserOnline } from '../../platform/offlineQueue'

function nowTimeValue() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function timeToTodayMs(value: string) {
  const [h, m] = value.split(':').map(Number)
  const d = new Date()
  d.setHours(h || 0, m || 0, 0, 0)
  return d.getTime()
}

/** Chequeo + síntomas + Quirón embebidos en el dashboard (sin salir a otra página). */
export function DailyCarePanel({
  missionId,
  wakeNote,
  symptomCount,
  onChanged,
}: {
  missionId: string | null
  wakeNote: string
  symptomCount: number
  onChanged: () => Promise<void> | void
}) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [wakeTime, setWakeTime] = useState(nowTimeValue)
  const [sleepTime, setSleepTime] = useState('23:00')
  const [rest, setRest] = useState(3)
  const [physical, setPhysical] = useState(en ? 'acceptable' : 'aceptable')
  const [emotional, setEmotional] = useState(en ? 'stable' : 'estable')
  const [hasSymptoms, setHasSymptoms] = useState(false)
  const [symptom, setSymptom] = useState('')

  useEffect(() => {
    setOk('')
  }, [wakeNote, symptomCount])

  function openQuiron(topic?: 'physical' | 'emotional') {
    window.dispatchEvent(new CustomEvent('helios:quiron-care', { detail: { topic: topic || null } }))
  }

  async function run(fn: () => Promise<void>, success?: string) {
    if (!missionId) {
      setError(en ? 'No active mission' : 'No hay misión activa')
      return
    }
    setBusy(true)
    setError('')
    setOk('')
    try {
      await fn()
      await onChanged()
      if (success) setOk(success)
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not save' : 'No se pudo guardar'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rd-stack">
      {error ? <p className="rd-error" role="alert">{error}</p> : null}
      {ok ? <p className="rd-ok">{ok}</p> : null}
      {busy ? <p className="rd-muted" aria-live="polite">{en ? 'Saving…' : 'Guardando…'}</p> : null}

      <section className="rd-card">
        <h2>{en ? 'Daily Check-in' : 'Chequeo diario'}</h2>
        <p className="rd-muted">
          {en ? 'Status:' : 'Estado:'}{' '}
          <strong>{wakeNote || (en ? 'Incomplete' : 'Sin completar')}</strong>
        </p>
        <div className="rd-form-grid">
          <div className="rd-field">
            <label htmlFor="sleep-time">{en ? 'Went to sleep' : 'Hora en que te acostaste'}</label>
            <input
              id="sleep-time"
              type="time"
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="rd-field">
            <label htmlFor="wake-time">{en ? 'Woke up' : 'Hora en que te levantaste'}</label>
            <input
              id="wake-time"
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="rd-field">
            <label htmlFor="rest-score">{en ? 'Rest quality (1–5)' : 'Calidad del descanso (1–5)'}</label>
            <input
              id="rest-score"
              type="number"
              min={1}
              max={5}
              value={rest}
              onChange={(e) => setRest(Number(e.target.value) || 1)}
              disabled={busy}
            />
          </div>
          <div className="rd-field">
            <label htmlFor="physical">{en ? 'Physical state' : 'Estado físico'}</label>
            <select id="physical" value={physical} onChange={(e) => setPhysical(e.target.value)} disabled={busy}>
              <option value={en ? 'good' : 'bien'}>{en ? 'Good' : 'Bien'}</option>
              <option value={en ? 'acceptable' : 'aceptable'}>{en ? 'Acceptable' : 'Aceptable'}</option>
              <option value={en ? 'tired' : 'cansado'}>{en ? 'Tired' : 'Cansado/a'}</option>
              <option value={en ? 'unwell' : 'mal'}>{en ? 'Unwell' : 'Mal'}</option>
            </select>
          </div>
          <div className="rd-field">
            <label htmlFor="emotional">{en ? 'Emotional state' : 'Estado emocional'}</label>
            <select id="emotional" value={emotional} onChange={(e) => setEmotional(e.target.value)} disabled={busy}>
              <option value={en ? 'stable' : 'estable'}>{en ? 'Stable' : 'Estable'}</option>
              <option value={en ? 'anxious' : 'ansioso'}>{en ? 'Anxious' : 'Ansioso/a'}</option>
              <option value={en ? 'low' : 'bajo'}>{en ? 'Low mood' : 'Ánimo bajo'}</option>
              <option value={en ? 'stressed' : 'estresado'}>{en ? 'Stressed' : 'Estresado/a'}</option>
            </select>
          </div>
          <label className="rd-check" htmlFor="has-symptoms">
            <input
              id="has-symptoms"
              type="checkbox"
              checked={hasSymptoms}
              onChange={(e) => setHasSymptoms(e.target.checked)}
              disabled={busy}
            />
            <span>{en ? 'I have symptoms today' : 'Hoy tengo síntomas'}</span>
          </label>
        </div>
        <div className="rd-actions">
          <button
            type="button"
            className="rd-btn"
            disabled={busy || !missionId || !wakeTime}
            onClick={() => void run(async () => {
              await platformApi.wake(missionId!, true)
              const wakeAt = timeToTodayMs(wakeTime)
              let sleepAt = timeToTodayMs(sleepTime)
              if (sleepAt >= wakeAt) sleepAt -= 24 * 60 * 60 * 1000
              await platformApi.addSleep(missionId!, {
                startAt: sleepAt,
                endAt: wakeAt,
                quality: rest,
                kind: 'night',
              })
              await platformApi.completeWake(missionId!, {
                wokeAt: wakeTime,
                sleptAt: sleepTime,
                sleep: en ? 'logged' : 'registrado',
                rest,
                physical,
                emotional,
                symptoms: hasSymptoms,
                recordedAt: new Date().toISOString(),
              })
            }, en ? `Day logged · woke at ${wakeTime}` : `Día registrado · te levantaste a las ${wakeTime}`)}
          >
            {en ? 'Save my day' : 'Guardar mi día'}
          </button>
          <button
            type="button"
            className="rd-btn ghost"
            disabled={busy || !missionId}
            onClick={() => {
              setWakeTime(nowTimeValue())
              void run(async () => {
                await platformApi.wake(missionId!, true)
              }, en ? 'Marked as just woke up' : 'Marcado: acabo de despertar')
            }}
          >
            {en ? 'I just woke up' : 'Acabo de despertar'}
          </button>
        </div>
      </section>

      <section className="rd-card">
        <h2>{en ? 'Update anytime' : 'Actualizar en cualquier momento'}</h2>
        <div className="rd-field">
          <label htmlFor="symptom-now">{en ? 'Symptom or how you feel' : 'Síntoma o cómo te sentís'}</label>
          <input
            id="symptom-now"
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            placeholder={en ? 'e.g. mild headache' : 'ej. dolor de cabeza leve'}
            disabled={busy}
          />
        </div>
        <div className="rd-actions">
          <button
            type="button"
            className="rd-btn"
            disabled={busy || !symptom.trim() || !missionId}
            onClick={() => void run(async () => {
              await platformApi.addSymptom(missionId!, {
                description: symptom.trim(),
                intensity: 3,
                context: 'self',
                source: 'self_report',
              const payload = {
                description: symptom.trim(),
                intensity: 3,
                context: 'self',
                source: 'self_report',
                bodyRegion: null as string | null,
              }
              if (!isBrowserOnline()) {
                enqueueOfflineOp({ type: 'symptom', missionId: missionId!, payload })
              } else {
                try {
                  await platformApi.addSymptom(missionId!, payload)
                } catch {
                  enqueueOfflineOp({ type: 'symptom', missionId: missionId!, payload })
                }
              }
          <button
            type="button"
            className="rd-btn ghost"
            disabled={busy || !missionId}
            onClick={() => void run(async () => {
              const end = Date.now()
              await platformApi.addSleep(missionId!, {
                startAt: end - 40 * 60 * 1000,
                endAt: end,
                quality: 3,
                kind: 'nap',
              })
            }, en ? 'Nap logged' : 'Siesta registrada')}
          >
            {en ? 'Log nap' : 'Registrar siesta'}
          </button>
        </div>
        <p className="rd-muted">{en ? `Symptoms on file: ${symptomCount}` : `Síntomas registrados: ${symptomCount}`}</p>
      </section>

      <section className="rd-card">
        <h2>{en ? 'Talk with Quirón' : 'Hablar con Quirón'}</h2>
        <p className="rd-muted">
          {en
            ? 'Open Quirón and choose physical health or emotional wellbeing inside the chat.'
            : 'Abrí Quirón y elegí salud física o bienestar emocional dentro del chat.'}
        </p>
        <div className="rd-actions">
          <button type="button" className="rd-btn" disabled={!missionId} onClick={() => openQuiron('physical')}>
            {en ? 'Physical health' : 'Salud física'}
          </button>
          <button type="button" className="rd-btn ghost" disabled={!missionId} onClick={() => openQuiron('emotional')}>
            {en ? 'Emotional wellbeing' : 'Bienestar emocional'}
          </button>
        </div>
      </section>
    </div>
  )
}