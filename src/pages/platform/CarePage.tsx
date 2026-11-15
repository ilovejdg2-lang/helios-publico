import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { getActiveMissionId, getSessionToken } from '../../platform/session'

/** La experiencia de cuidado vive dentro del dashboard (/app/mi-salud). */
export function CarePage() {
  useEffect(() => {
    document.title = 'HELIOS · Mi salud'
  }, [])

  if (!getSessionToken()) return <Navigate to="/entrar" replace />
  if (!getActiveMissionId()) return <Navigate to="/misiones" replace />
  return <Navigate to="/app/mi-salud" replace />
}