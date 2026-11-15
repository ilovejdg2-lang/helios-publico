import { getActiveMissionId } from './session'

export type MissionReminder = {
  id: string
  titleEs: string
  titleEn: string
  bodyEs: string
  bodyEn: string
  dueAt: number
  kind: 'wake' | 'indicator' | 'appointment' | 'followup'
  status: 'pending' | 'done' | 'snoozed' | 'skipped'
  snoozeUntil?: number
  skipReason?: string
}

const KEY = 'helios.reminders.v1'
const NOTIFY_OPT = 'helios.reminders.notify'

function storageKey(missionId: string) {
  return `${KEY}:${missionId}`
}

export function remindersEnabledNotify() {
  try {
    return localStorage.getItem(NOTIFY_OPT) !== '0'
  } catch {
    return true
  }
}

export function setRemindersNotify(enabled: boolean) {
  localStorage.setItem(NOTIFY_OPT, enabled ? '1' : '0')
}

export function listReminders(missionId = getActiveMissionId()): MissionReminder[] {
  if (!missionId) return []
  try {
    const raw = localStorage.getItem(storageKey(missionId))
    if (!raw) return seedReminders(missionId)
    const parsed = JSON.parse(raw) as MissionReminder[]
    return Array.isArray(parsed) ? parsed : seedReminders(missionId)
  } catch {
    return seedReminders(missionId)
  }
}

function writeReminders(missionId: string, items: MissionReminder[]) {
  localStorage.setItem(storageKey(missionId), JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('helios:reminders', { detail: { missionId } }))
}

function seedReminders(missionId: string): MissionReminder[] {
  const now = Date.now()
  const items: MissionReminder[] = [
    {
      id: 'wake-daily',
      kind: 'wake',
      titleEs: 'Chequeo después del despertar',
      titleEn: 'Post-wake check-in',
      bodyEs: 'Completá el chequeo del día. Un recordatorio vencido es pendiente, no evidencia de enfermedad.',
      bodyEn: 'Complete today’s check-in. An overdue reminder is pending work, not evidence of illness.',
      dueAt: now - 5 * 60 * 1000,
      status: 'pending',
    },
    {
      id: 'indicators-daily',
      kind: 'indicator',
      titleEs: 'Registros de indicadores',
      titleEn: 'Indicator logs',
      bodyEs: 'Registrá al menos un indicador (sueño, ánimo o vital) cuando tu turno lo permita.',
      bodyEn: 'Log at least one indicator (sleep, mood or vital) when your shift allows.',
      dueAt: now + 2 * 60 * 60 * 1000,
      status: 'pending',
    },
    {
      id: 'wellbeing',
      kind: 'followup',
      titleEs: 'Actividad de bienestar',
      titleEn: 'Wellbeing activity',
      bodyEs: 'Actividad configurada de misión (estiramiento / descanso breve). Opcional.',
      bodyEn: 'Configured mission wellbeing activity (stretch / short rest). Optional.',
      dueAt: now + 4 * 60 * 60 * 1000,
      status: 'pending',
    },
  ]
  writeReminders(missionId, items)
  return items
}

export function ensureReminders(missionId: string) {
  const existing = listReminders(missionId)
  if (existing.length === 0) return seedReminders(missionId)
  return existing
}

export function updateReminder(
  missionId: string,
  id: string,
  patch: Partial<Pick<MissionReminder, 'status' | 'snoozeUntil' | 'skipReason' | 'dueAt'>>,
) {
  const next = listReminders(missionId).map((item) => (item.id === id ? { ...item, ...patch } : item))
  writeReminders(missionId, next)
  return next
}

export function dueReminders(missionId = getActiveMissionId(), now = Date.now()) {
  return listReminders(missionId || undefined).filter((item) => {
    if (item.status === 'done' || item.status === 'skipped') return false
    if (item.status === 'snoozed' && item.snoozeUntil && item.snoozeUntil > now) return false
    return item.dueAt <= now
  })
}

export async function requestNotifyPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export async function fireDueNotifications(missionId: string, en: boolean) {
  if (!remindersEnabledNotify()) return 0
  if (typeof window === 'undefined' || !('Notification' in window)) return 0
  if (Notification.permission !== 'granted') return 0
  const due = dueReminders(missionId)
  let n = 0
  for (const item of due.slice(0, 3)) {
    const tag = `helios-${item.id}`
    try {
      // Avoid spamming the same reminder tag within the session.
      const stampKey = `helios.notify.fired.${item.id}`
      if (sessionStorage.getItem(stampKey) === '1') continue
      new Notification(en ? item.titleEn : item.titleEs, {
        body: en ? item.bodyEn : item.bodyEs,
        tag,
        silent: false,
      })
      sessionStorage.setItem(stampKey, '1')
      n += 1
    } catch {
      /* ignore */
    }
  }
  return n
}
