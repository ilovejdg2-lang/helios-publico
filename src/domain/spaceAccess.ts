import type { CrewId, Role } from '../../shared/types'

/** PIN de demostración. Es público y no protege los datos del navegador. */
export const SIMULATED_PINS: Record<CrewId, string> = {
  'elena-torres': '1001',
  'mateo-ruiz': '1002',
  'sofia-chen': '1003',
  'alex-morgan': '1004',
}

export function canReadMySpace(role: Role, authenticatedCrewId: CrewId | null, ownerId: CrewId): boolean {
  return role === 'astronaut' && authenticatedCrewId === ownerId
}

export function simulatedPinMatches(crewId: CrewId, pin: string): boolean {
  return pin.trim() === SIMULATED_PINS[crewId]
}

export type OwnedAccess<T> = { ok: true; record: T } | { ok: false; reason: 'denied' }

export async function readOwnedSpace<T>(
  role: Role,
  authenticatedCrewId: CrewId | null,
  ownerId: CrewId,
  load: (ownerId: CrewId) => Promise<T>,
): Promise<OwnedAccess<T>> {
  if (!canReadMySpace(role, authenticatedCrewId, ownerId)) return { ok: false, reason: 'denied' }
  return { ok: true, record: await load(ownerId) }
}

export async function writeOwnedSpace<T>(
  role: Role,
  authenticatedCrewId: CrewId | null,
  ownerId: CrewId,
  record: T,
  save: (ownerId: CrewId, record: T) => Promise<void>,
): Promise<{ ok: true } | { ok: false; reason: 'denied' }> {
  if (!canReadMySpace(role, authenticatedCrewId, ownerId)) return { ok: false, reason: 'denied' }
  await save(ownerId, record)
  return { ok: true }
}
