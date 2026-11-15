import type { AlertType, CrewId, Role } from '../../shared/types'

export { canReadMySpace } from './spaceAccess'

const SENSOR_ALERTS: ReadonlySet<AlertType> = new Set(['quality', 'repeated', 'altered'])

export function canReadPrivateWellbeing(role: Role, sessionCrewId: CrewId, targetCrewId: CrewId): boolean {
  return role === 'astronaut' && sessionCrewId === targetCrewId
}

export function canRegisterSymptom(role: Role): boolean {
  return role === 'medical' || role === 'astronaut'
}

export function canUseInventory(role: Role): boolean {
  return role === 'medical' || role === 'ops'
}

export function canManageComms(role: Role): boolean {
  return role === 'medical' || role === 'ops'
}

export function canCloseHealthAlert(role: Role): boolean {
  return role === 'medical'
}

export function isSensorAlert(type: AlertType): boolean {
  return SENSOR_ALERTS.has(type)
}
