import type { AppState, CrewId, Role, SharedRequestLevel, SpaceRequest } from '../../shared/types'

export function requestVisibleTo(role: Role, level: SharedRequestLevel): boolean {
  if (role === 'ops') return false
  if (level === 'medico') return role === 'medical'
  return role === 'medical' || role === 'astronaut'
}

export function visibleSpaceRequests(state: AppState): SpaceRequest[] {
  return state.spaceRequests.filter((item) => requestVisibleTo(state.role, item.level)).slice().reverse()
}

export function latestVisibleRequest(state: AppState, crewId: CrewId): SpaceRequest | null {
  const match = state.spaceRequests.filter((item) => item.crewId === crewId && requestVisibleTo(state.role, item.level))
  return match[match.length - 1] ?? null
}
