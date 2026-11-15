import { platformApi, type HealthIndicatorReading, type IndicatorKind } from './api'

export type OfflineOpType = 'indicator' | 'symptom' | 'appointment' | 'wake'

export type OfflineOp = {
  id: string
  createdAt: number
  type: OfflineOpType
  missionId: string
  payload: Record<string, unknown>
  status: 'pending' | 'failed'
  lastError?: string
}

const KEY = 'helios.offline.queue.v1'

function readQueue(): OfflineOp[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as OfflineOp[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(items: OfflineOp[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('helios:offline-queue', { detail: { count: items.length } }))
}

export function listOfflineOps() {
  return readQueue()
}

export function pendingOfflineCount() {
  return readQueue().filter((item) => item.status === 'pending' || item.status === 'failed').length
}

export function enqueueOfflineOp(input: Omit<OfflineOp, 'id' | 'createdAt' | 'status'>) {
  const op: OfflineOp = {
    ...input,
    id: `off-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    status: 'pending',
  }
  const next = [...readQueue(), op]
  writeQueue(next)
  return op
}

export function isBrowserOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

async function runOp(op: OfflineOp) {
  switch (op.type) {
    case 'indicator':
      await platformApi.addIndicator(op.missionId, {
        kind: String(op.payload.kind) as IndicatorKind,
        value: Number(op.payload.value),
        valueSecondary: op.payload.valueSecondary == null ? null : Number(op.payload.valueSecondary),
        measuredAt: op.payload.measuredAt == null ? undefined : Number(op.payload.measuredAt),
        unit: op.payload.unit == null ? undefined : String(op.payload.unit),
        origin: (op.payload.origin as HealthIndicatorReading['origin']) || 'manual',
        context: op.payload.context == null ? undefined : String(op.payload.context),
        quality: (op.payload.quality as HealthIndicatorReading['quality']) || 'unknown',
        notes: op.payload.notes == null ? undefined : String(op.payload.notes),
        bodyRegion: op.payload.bodyRegion == null ? null : String(op.payload.bodyRegion),
      })
      return
    case 'symptom':
      await platformApi.addSymptom(op.missionId, {
        description: String(op.payload.description || ''),
        startedAt: op.payload.startedAt == null ? null : Number(op.payload.startedAt),
        intensity: op.payload.intensity == null ? null : Number(op.payload.intensity),
        context: String(op.payload.context || ''),
        source: String(op.payload.source || 'self_report'),
        bodyRegion: op.payload.bodyRegion == null ? null : String(op.payload.bodyRegion),
      })
      return
    case 'appointment':
      await platformApi.requestAppointment(op.missionId, op.payload)
      return
    case 'wake':
      await platformApi.completeWake(op.missionId, op.payload)
      return
    default:
      throw new Error('Unknown offline operation')
  }
}

/** Flush pending local operations when the Earth link returns. */
export async function flushOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (!isBrowserOnline()) return { synced: 0, failed: 0 }
  const queue = readQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }
  const remaining: OfflineOp[] = []
  let synced = 0
  let failed = 0
  for (const op of queue) {
    try {
      await runOp(op)
      synced += 1
    } catch (err) {
      failed += 1
      remaining.push({
        ...op,
        status: 'failed',
        lastError: err instanceof Error ? err.message : 'sync failed',
      })
    }
  }
  writeQueue(remaining)
  return { synced, failed }
}

let listening = false
export function startOfflineQueueListener() {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('online', () => {
    void flushOfflineQueue()
  })
  void flushOfflineQueue()
}
