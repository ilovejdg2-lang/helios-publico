/** Workspace role for UI composition. Authorization always comes from backend membership. */

import { useEffect, useState } from 'react'

export type WorkspaceRole = 'chief' | 'crew' | 'medic' | 'psychologist'

export const WORKSPACE_ROLES: WorkspaceRole[] = ['chief', 'crew', 'medic', 'psychologist']

const ROLE_KEY = 'helios-workspace-role'
const MODE_KEY = 'helios-workspace-mode'
const DEMO_FLAG = 'helios-demo-explore'
const ROLE_EVENT = 'helios-workspace-changed'

export type WorkspaceMode = 'demo' | 'authorized'

/** Demo profile ids used only for exploration — selecting a card logs into that profile. */
export const DEMO_ROLE_PROFILES: Record<WorkspaceRole, string> = {
  chief: 'elena-torres',
  crew: 'mateo-ruiz',
  medic: 'sofia-chen',
  psychologist: 'alex-morgan',
}

function notifyWorkspaceChanged() {
  try {
    window.dispatchEvent(new Event(ROLE_EVENT))
  } catch {
    /* ignore */
  }
}

export function isWorkspaceRole(value: string | null | undefined): value is WorkspaceRole {
  return value === 'chief' || value === 'crew' || value === 'medic' || value === 'psychologist'
}

export function getWorkspaceRole(): WorkspaceRole | null {
  const raw = localStorage.getItem(ROLE_KEY)
  return isWorkspaceRole(raw) ? raw : null
}

export function setWorkspaceRole(role: WorkspaceRole) {
  if (getWorkspaceRole() === role) return
  localStorage.setItem(ROLE_KEY, role)
  notifyWorkspaceChanged()
}

export function getWorkspaceMode(): WorkspaceMode {
  return localStorage.getItem(MODE_KEY) === 'authorized' ? 'authorized' : 'demo'
}

export function setWorkspaceMode(mode: WorkspaceMode) {
  if (getWorkspaceMode() === mode) return
  localStorage.setItem(MODE_KEY, mode)
  notifyWorkspaceChanged()
}

export function setDemoExplore(flag: boolean) {
  const current = isDemoExplore()
  if (current === flag) return
  if (flag) localStorage.setItem(DEMO_FLAG, '1')
  else localStorage.removeItem(DEMO_FLAG)
  notifyWorkspaceChanged()
}

export function isDemoExplore(): boolean {
  return localStorage.getItem(DEMO_FLAG) === '1'
}

export function clearWorkspace() {
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(MODE_KEY)
  localStorage.removeItem(DEMO_FLAG)
  notifyWorkspaceChanged()
}

/** Reactive workspace role — updates without a full page reload. */
export function useWorkspaceRole(): WorkspaceRole | null {
  const [role, setRole] = useState<WorkspaceRole | null>(() => getWorkspaceRole())
  useEffect(() => {
    const sync = () => setRole(getWorkspaceRole())
    window.addEventListener(ROLE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(ROLE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return role
}

/** Resolve UI role strictly from membership; never trust a free client pick for privileges. */
export function resolveAuthorizedRole(
  membershipRole: string,
  fallbackProfileRole?: string,
): WorkspaceRole | null {
  if (isWorkspaceRole(membershipRole)) return membershipRole
  if (isWorkspaceRole(fallbackProfileRole)) return fallbackProfileRole
  if (membershipRole === 'ops') return 'chief'
  return null
}

export function clearRoleScopedUiState() {
  try {
    sessionStorage.removeItem('helios-medic-case')
    sessionStorage.removeItem('helios-psych-case')
    sessionStorage.removeItem('helios-chief-panel')
  } catch {
    /* ignore */
  }
}