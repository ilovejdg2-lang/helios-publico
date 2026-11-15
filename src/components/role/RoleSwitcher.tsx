import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useLocale } from '../../i18n'
import { platformApi } from '../../platform/api'
import { ROLE_CARDS } from '../../platform/roleCatalog'
import { getActiveMissionId, setSession } from '../../platform/session'
import {
  DEMO_ROLE_PROFILES,
  clearRoleScopedUiState,
  setDemoExplore,
  setWorkspaceMode,
  setWorkspaceRole,
  useWorkspaceRole,
  type WorkspaceRole,
} from '../../platform/workspace'
import '../../platform/role-dash.css'

/** Único control visible para cambiar de rol demo (mantiene la misión activa). */
export function RoleSwitcher() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const current = useWorkspaceRole()
  const currentLabel = ROLE_CARDS.find((card) => card.id === current)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function switchTo(role: WorkspaceRole) {
    if (role === current) {
      setOpen(false)
      return
    }
    // Close overlay first so the dark scrim never sticks during the API round-trip.
    setOpen(false)
    setBusy(true)
    setError('')
    try {
      const profileId = DEMO_ROLE_PROFILES[role]
      const result = await platformApi.select(profileId)
      const missionId = getActiveMissionId()
      setSession(result.token, {
        id: result.profile.id,
        displayName: result.profile.displayName,
        title: result.profile.title,
        demoRole: result.profile.demoRole,
      })
      clearRoleScopedUiState()
      setWorkspaceRole(role)
      setWorkspaceMode('demo')
      setDemoExplore(true)
      // SPA only — hard reload remounts AppProvider and can leave a blank/black boot screen.
      navigate(missionId ? '/app' : '/misiones', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not switch role' : 'No se pudo cambiar de rol'))
      setOpen(true)
    } finally {
      setBusy(false)
    }
  }

  const dialog =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div className="role-switch-layer" role="presentation">
            <button
              type="button"
              className="role-switch-scrim"
              aria-label={en ? 'Close role menu' : 'Cerrar menú de rol'}
              onClick={() => setOpen(false)}
            />
            <div
              id="role-switch-panel"
              className="role-switch-panel"
              role="dialog"
              aria-modal="true"
              aria-label={en ? 'Choose a role' : 'Elegí un rol'}
            >
              <p className="role-switch-lead">
                {en ? 'Pick a role.' : 'Elegí un rol.'}
              </p>
              <div className="role-switch-grid">
                {ROLE_CARDS.map((card) => {
                  const Art = card.Art
                  const active = current === card.id
                  return (
                    <button
                      key={card.id}
                      type="button"
                      className={`role-switch-card${active ? ' is-on' : ''}`}
                      disabled={busy}
                      onClick={() => void switchTo(card.id)}
                    >
                      <span className="role-switch-art" aria-hidden="true">
                        <Art />
                      </span>
                      <strong>{en ? card.name.en : card.name.es}</strong>
                      <span>{en ? card.blurb.en : card.blurb.es}</span>
                    </button>
                  )
                })}
              </div>
              {error ? (
                <p className="rd-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button type="button" className="rd-btn ghost" onClick={() => setOpen(false)}>
                {en ? 'Close' : 'Cerrar'}
              </button>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div className={`role-switch${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="role-switch-trigger"
        aria-expanded={open}
        aria-controls="role-switch-panel"
        disabled={busy}
        onClick={() => setOpen((value) => !value)}
      >
        {busy ? (
          en ? 'Switching…' : 'Cambiando…'
        ) : (
          <>
            <span className="role-switch-long">
              {en
                ? `Change role${currentLabel ? ` · ${currentLabel.name.en}` : ''}`
                : `Cambiar rol${currentLabel ? ` · ${currentLabel.name.es}` : ''}`}
            </span>
            <span className="role-switch-short">{en ? 'Role' : 'Rol'}</span>
          </>
        )}
      </button>
      {dialog}
    </div>
  )
}
