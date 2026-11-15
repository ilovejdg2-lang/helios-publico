import { openDB } from 'idb'
import type { CrewId, Role } from '../../shared/types'
import { readOwnedSpace, writeOwnedSpace } from '../domain/spaceAccess'

export interface SpaceMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: number
  source?: 'local_engine' | 'model'
  model?: string
  toolsUsed?: { name: string; status: string }[]
}

export interface SpaceDataUse {
  sleep: boolean
  pulse: boolean
  symptoms: boolean
}

export type SpaceShareLevel = 'solo_yo' | 'generica' | 'medico' | 'equipo'

export interface SpaceRequestEntry {
  id: string
  preview: string
  shareLevel: SpaceShareLevel
  status: 'mine' | 'sent'
  at: number
}

export interface SpaceRecord {
  messages: SpaceMessage[]
  dataUse: SpaceDataUse
  requests: SpaceRequestEntry[]
}

const SHARE: ReadonlySet<string> = new Set([
  'solo_yo',
  'generica',
  'medico',
  'equipo',
])

export function emptySpaceRecord(): SpaceRecord {
  return {
    messages: [],
    dataUse: { sleep: true, pulse: true, symptoms: true },
    requests: [],
  }
}

async function database() {
  return openDB('vitalink-space', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('records'))
        db.createObjectStore('records')
    },
  })
}

function asRecord(value: unknown): SpaceRecord {
  if (!value || typeof value !== 'object') return emptySpaceRecord()
  const record = value as Partial<SpaceRecord>
  return {
    messages: Array.isArray(record.messages)
      ? record.messages.filter(isMessage).slice(-200)
      : [],
    dataUse: {
      sleep: record.dataUse?.sleep !== false,
      pulse: record.dataUse?.pulse !== false,
      symptoms: record.dataUse?.symptoms !== false,
    },
    requests: Array.isArray(record.requests)
      ? record.requests.filter(isRequest).slice(-100)
      : [],
  }
}

function isMessage(value: unknown): value is SpaceMessage {
  if (!value || typeof value !== 'object') return false
  const message = value as Partial<SpaceMessage>
  const sourceOk =
    message.source === undefined ||
    message.source === 'local_engine' ||
    message.source === 'model'
  return (
    sourceOk &&
    (message.model === undefined || (typeof message.model === 'string' && message.model.length <= 120)) &&
    (message.toolsUsed === undefined || (Array.isArray(message.toolsUsed) && message.toolsUsed.length <= 4 && message.toolsUsed.every((t) => t && typeof t === 'object' && typeof t.name === 'string' && t.name.length <= 80 && typeof t.status === 'string' && t.status.length <= 30))) &&
    typeof message.id === 'string' &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.text === 'string' &&
    typeof message.at === 'number'
  )
}

function isRequest(value: unknown): value is SpaceRequestEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<SpaceRequestEntry>
  return (
    typeof entry.id === 'string' &&
    typeof entry.preview === 'string' &&
    typeof entry.shareLevel === 'string' &&
    SHARE.has(entry.shareLevel) &&
    (entry.status === 'mine' || entry.status === 'sent') &&
    typeof entry.at === 'number'
  )
}

async function loadRecord(ownerId: CrewId): Promise<SpaceRecord> {
  const db = await database()
  return asRecord(await db.get('records', ownerId))
}

async function saveRecordNow(
  ownerId: CrewId,
  record: SpaceRecord,
): Promise<void> {
  const db = await database()
  const next = asRecord(record)
  await db.put(
    'records',
    {
      messages: next.messages.map((item) => ({
        ...item,
        text: item.text.slice(0, 2000),
      })),
      dataUse: next.dataUse,
      requests: next.requests.map((item) => ({
        ...item,
        preview: item.preview.slice(0, 500),
      })),
    },
    ownerId,
  )
}

export function readSpace(
  role: Role,
  authenticatedCrewId: CrewId | null,
  ownerId: CrewId,
) {
  return readOwnedSpace(role, authenticatedCrewId, ownerId, loadRecord)
}

export function writeSpace(
  role: Role,
  authenticatedCrewId: CrewId | null,
  ownerId: CrewId,
  record: SpaceRecord,
) {
  return writeOwnedSpace(role, authenticatedCrewId, ownerId, record, saveRecord)
}

export async function clearSpace(): Promise<void> {
  const db = await database()
  await db.clear('records')
}

// Serialize existing local writes per owner. No extra conversation store is created.
const writes = new Map<CrewId, Promise<void>>()
function saveRecord(ownerId: CrewId, record: SpaceRecord): Promise<void> {
  const snapshot = structuredClone(record)
  const pending = (writes.get(ownerId) ?? Promise.resolve())
    .catch(() => undefined)
    .then(() => saveRecordNow(ownerId, snapshot))
  writes.set(ownerId, pending)
  void pending
    .finally(() => {
      if (writes.get(ownerId) === pending) writes.delete(ownerId)
    })
    .catch(() => undefined)
  return pending
}
