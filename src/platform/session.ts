import { clearRoleScopedUiState, clearWorkspace } from './workspace'

const SESSION_KEY = 'helios-demo-session'
const MISSION_KEY = 'helios-active-mission'
const PROFILE_KEY = 'helios-demo-profile'

export type StoredProfile = {
  id: string
  displayName: string
  title: string
  demoRole: string
}

export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY)
}

export function setSession(token: string, profile: StoredProfile) {
  localStorage.setItem(SESSION_KEY, token)
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  try {
    window.dispatchEvent(new Event('helios-workspace-changed'))
  } catch {
    /* ignore */
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(PROFILE_KEY)
  localStorage.removeItem(MISSION_KEY)
  clearWorkspace()
  clearRoleScopedUiState()
}

export function getStoredProfile(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? (JSON.parse(raw) as StoredProfile) : null
  } catch {
    return null
  }
}

export function getActiveMissionId(): string | null {
  return localStorage.getItem(MISSION_KEY)
}

export function setActiveMissionId(missionId: string) {
  const previous = localStorage.getItem(MISSION_KEY)
  localStorage.setItem(MISSION_KEY, missionId)
  if (previous && previous !== missionId) clearRoleScopedUiState()
}

export function clearActiveMission() {
  localStorage.removeItem(MISSION_KEY)
  clearRoleScopedUiState()
}