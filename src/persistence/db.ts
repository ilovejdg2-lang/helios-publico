import { openDB } from 'idb'
import { stateSchema } from '../../shared/stateSchema'
import type { AppState } from '../../shared/types'

async function database() {
  return openDB('vitalink', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv')
    },
  })
}

export async function loadState(): Promise<AppState | null> {
  const db = await database()
  const value: unknown = await db.get('kv', 'state')
  if (value === undefined || value === null) return null
  const parsed = stateSchema.safeParse(value)
  if (!parsed.success) throw new Error('El estado local requiere recuperación. Se conserva la copia original.')
  return parsed.data
}

export async function saveState(state: AppState): Promise<void> {
  const db = await database()
  await db.put('kv', { ...state, notice: null }, 'state')
}
