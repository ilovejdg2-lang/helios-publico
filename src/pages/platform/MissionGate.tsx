import { Navigate, useLocation } from 'react-router-dom'
import { getActiveMissionId, getSessionToken } from '../../platform/session'
import type { ReactNode } from 'react'

/** Requiere perfil demo + misión activa antes del dashboard Shell. */
export function MissionGate({ children }: { children: ReactNode }) {
  const location = useLocation()
  if (!getSessionToken()) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  }
  if (!getActiveMissionId()) {
    return <Navigate to="/misiones" replace />
  }
  return children
}