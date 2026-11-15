import { useEffect, useState } from 'react'
import { useLocale } from '../../i18n'
import {
  dueReminders,
  ensureReminders,
  fireDueNotifications,
  listReminders,
  requestNotifyPermission,
  remindersEnabledNotify,
  setRemindersNotify,
  updateReminder,
  type MissionReminder,
} from '../../platform/missionReminders'

export function MissionRemindersPanel({ missionId }: { missionId: string | null }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [items, setItems] = useState<MissionReminder[]>([])
  const [notify, setNotify] = useState(remindersEnabledNotify())
  const [perm, setPerm] = useState<string>('default')

  function reload() {
    if (!missionId) return
    setItems(ensureReminders(missionId))
  }

  useEffect(() => {
    reload()
    if (missionId) void fireDueNotifications(missionId, en)
    const onChange = () => reload()
    window.addEventListener('helios:reminders', onChange)
    return () => window.removeEventListener('helios:reminders', onChange)
  }, [missionId, en])

  useEffect(() => {
    if (typeof Notification !== 'undefined') setPerm(Notification.permission)
  }, [])

  if (!missionId) return null
  const due = dueReminders(missionId)

  return (
    <section className="rd-card" data-testid="mission-reminders">
      <h2>{en ? 'Mission reminders' : 'Recordatorios de misión'}</h2>
      <p className="rd-muted">
        {en
          ? 'In-app reminders plus optional browser notifications. Overdue ≠ illness or wellness.'
          : 'Recordatorios in-app y notificaciones del navegador opcionales. Vencido ≠ enfermedad ni bienestar.'}
      </p>
      <label className="rd-field" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={notify}
          onChange={(e) => {
            const next = e.target.checked
            setNotify(next)
            setRemindersNotify(next)
          }}
        />
        {en ? 'Enable browser notifications for due reminders' : 'Activar notificaciones del navegador para vencidos'}
      </label>
      <div className="rd-actions">
        <button
          type="button"
          className="rd-btn ghost"
          onClick={() => void requestNotifyPermission().then((result) => {
            setPerm(String(result))
            if (result === 'granted' && missionId) void fireDueNotifications(missionId, en)
          })}
        >
          {en ? `Permission: ${perm}` : `Permiso: ${perm}`}
        </button>
      </div>
      {due.length ? (
        <p className="rd-ok">{en ? `${due.length} due now` : `${due.length} vencidos ahora`}</p>
      ) : (
        <p className="rd-muted">{en ? 'Nothing overdue right now.' : 'Nada vencido ahora.'}</p>
      )}
      <ul className="health-mini-list">
        {items.map((item) => {
          const overdue = due.some((d) => d.id === item.id)
          return (
            <li key={item.id}>
              <strong>{en ? item.titleEn : item.titleEs}</strong>
              {' · '}
              {item.status}
              {overdue ? (en ? ' · OVERDUE (pending)' : ' · VENCIDO (pendiente)') : ''}
              <div className="rd-actions" style={{ marginTop: 6 }}>
                <button
                  type="button"
                  className="rd-btn"
                  onClick={() => setItems(updateReminder(missionId, item.id, { status: 'done' }))}
                >
                  {en ? 'Complete' : 'Completar'}
                </button>
                <button
                  type="button"
                  className="rd-btn ghost"
                  onClick={() => setItems(updateReminder(missionId, item.id, {
                    status: 'snoozed',
                    snoozeUntil: Date.now() + 60 * 60 * 1000,
                    dueAt: Date.now() + 60 * 60 * 1000,
                  }))}
                >
                  {en ? 'Snooze 1h' : 'Posponer 1h'}
                </button>
                <button
                  type="button"
                  className="rd-btn ghost"
                  onClick={() => {
                    const reason = window.prompt(en ? 'Skip reason' : 'Motivo de omisión') || (en ? 'Skipped' : 'Omitido')
                    setItems(updateReminder(missionId, item.id, { status: 'skipped', skipReason: reason }))
                  }}
                >
                  {en ? 'Skip + reason' : 'Omitir + motivo'}
                </button>
              </div>
              {item.skipReason ? <span className="rd-muted"> · {item.skipReason}</span> : null}
            </li>
          )
        })}
      </ul>
      {/* keep listReminders referenced for debugging clarity */}
      <span className="sr-only">{listReminders(missionId).length}</span>
    </section>
  )
}
