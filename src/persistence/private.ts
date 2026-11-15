import { openDB } from 'idb'

async function database() {
  return openDB('vitalink-private', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('notes')) db.createObjectStore('notes')
    },
  })
}

export async function readPrivate(crewId: string): Promise<string | null> {
  const db = await database()
  const value: unknown = await db.get('notes', crewId)
  return typeof value === 'string' ? value : null
}

export async function writePrivate(crewId: string, note: string): Promise<void> {
  const db = await database()
  await db.put('notes', note.slice(0, 2000), crewId)
}

export async function clearPrivate(): Promise<void> {
  const db = await database()
  await db.clear('notes')
}
