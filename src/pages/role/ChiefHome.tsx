import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { MissionProcessStrip } from '../../components/platform/MissionProcessStrip'
import { AboardCheckInBoard } from '../../components/role/AboardCheckInBoard'
import { ChiefLaunchPanel } from '../../components/role/ChiefLaunchPanel'
import { useLocale } from '../../i18n'
import { platformApi } from '../../platform/api'
import { profileDisplayName, roleLabel, stageBlurb } from '../../platform/copy'
import { getActiveMissionId } from '../../platform/session'
import { MonitorPage } from '../MonitorPage'
import { RoleContextBar } from './RoleContextBar'
import { useMissionWorkspace } from './useMissionWorkspace'
import '../../platform/role-dash.css'

/** Centro del jefe = monitor original (cascos) + código de misión + solicitudes reales. */
export function ChiefHome() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { detail, role, mode, loading, missionId, refresh, prep, percent, error: workspaceError } = useMissionWorkspace()
  const activeMissionId = missionId || getActiveMissionId()
  const rosterLocked = Boolean(detail?.mission.rosterLocked)
  const stage = detail?.mission.stage
  const afterDeploy = stage === 'aboard' || stage === 'postmission' || stage === 'archived' || stage === 'cancelled'
  const crewAddsBlocked = afterDeploy || rosterLocked
  const analysisStale = Boolean(detail?.mission.analysisStale)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [missionCode, setMissionCode] = useState(detail?.mission.code || '')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = en ? 'HELIOS · Mission center' : 'HELIOS · Centro de misión'
  }, [en])

  useEffect(() => {
    if (detail?.mission.code) setMissionCode(detail.mission.code)
  }, [detail?.mission.code])

  useEffect(() => {
    if (!activeMissionId || missionCode) return
    let alive = true
    platformApi.mission(activeMissionId)
      .then((data) => {
        if (alive) setMissionCode(data.mission.code)
      })
      .catch(() => undefined)
    return () => { alive = false }
  }, [activeMissionId, missionCode])

  const pending = (detail?.members || []).filter((member) => member.status === 'pending')
  /** Personas del equipo visible (cascos): excluye mesa Ops. Default = 4. */
  const crewSeatCount = (detail?.members || []).filter(
    (member) => member.status === 'active' && member.role !== 'ops',
  ).length

  async function decide(membershipId: string, accept: boolean) {
    if (!activeMissionId || (accept && crewAddsBlocked)) return
    setBusyId(membershipId)
    setError('')
    setNote('')
    try {
      await platformApi.decideJoin(activeMissionId, membershipId, accept)
      await refresh({ silent: true })
      setNote(accept
        ? (en
          ? 'Join request accepted. Re-analyze before takeoff if the plan changed.'
          : 'Solicitud aceptada. Volvé a analizar antes de despegar si cambió el plan.')
        : (en ? 'Join request rejected.' : 'Solicitud rechazada.'))
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not update request' : 'No se pudo actualizar la solicitud'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page monitor-page chief-center">
      <div className="chief-center-bar">
        <div>
          <p className="monitor-kicker">{en ? 'Mission center' : 'Centro de misión'}</p>
          <RoleContextBar
            missionName={detail?.mission.name}
            stage={stage}
            role={role}
            mode={mode}
          />
          {stage ? (
            <>
              <p className="muted chief-invite-note">{stageBlurb(stage, en)}</p>
              <MissionProcessStrip stage={stage} en={en} compact />
            </>
          ) : null}
          {loading ? <p className="muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}
          {crewAddsBlocked ? (
            <p className="muted chief-invite-note">
              {en
                ? 'Mission deployed: no more astronauts can be added.'
                : 'Misión desplegada: ya no se pueden agregar más astronautas.'}
            </p>
          ) : analysisStale ? (
            <p className="muted chief-invite-note">
              {en
                ? 'Changes pending: run analysis again before takeoff.'
                : 'Hay cambios pendientes: volvé a analizar antes de despegar.'}
            </p>
          ) : null}
          {workspaceError || error ? <p className="field-error" role="alert">{workspaceError || error}</p> : null}
          {note ? <p className="muted chief-invite-note">{note}</p> : null}
        </div>
        <div className="chief-invite">
          <button
            type="button"
            className="btn btn-primary"
            disabled={crewAddsBlocked}
            title={crewAddsBlocked
              ? (en ? 'Crew locked after deploy' : 'Tripulación bloqueada tras el despliegue')
              : undefined}
            onClick={() => {
              setInviteOpen((value) => !value)
              setNote('')
              setError('')
            }}
          >
            <UserPlus aria-hidden="true" size={18} strokeWidth={1.75} />
            {en ? 'Add people' : 'Agregar personas'}
            {pending.length > 0 ? ` (${pending.length})` : ''}
          </button>
          {inviteOpen ? (
            <div className="chief-invite-panel">
              <p>
                {en
                  ? 'Share the mission code so others can request to join from the hub. Accept pending requests here — a name typed alone does not create access.'
                  : 'Compartí el código para que otros pidan ingreso desde el hub. Aceptá solicitudes aquí: un nombre solo no crea acceso.'}
              </p>
              <p>
                <strong>{en ? 'Code' : 'Código'}:</strong> {missionCode || '—'}
              </p>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn"
                  disabled={!missionCode}
                  onClick={() => {
                    if (!missionCode) return
                    void navigator.clipboard?.writeText(missionCode)
                      .then(() => setNote(en ? 'Code copied' : 'Código copiado'))
                      .catch(() => setNote(missionCode))
                  }}
                >
                  {en ? 'Copy code' : 'Copiar código'}
                </button>
                <Link className="btn" to="/misiones">{en ? 'Mission hub' : 'Hub de misiones'}</Link>
                <Link className="btn" to="/app/tripulacion">{en ? 'Crew board' : 'Tablero de tripulación'}</Link>
                <Link className="btn" to="/app/mi-salud">{en ? 'My health' : 'Mi salud'}</Link>
              </div>

              <div className="chief-pending" style={{ marginTop: 14 }}>
                <strong>{en ? 'Pending requests' : 'Solicitudes pendientes'}</strong>
                {pending.length === 0 ? (
                  <p className="muted">{en ? 'No pending join requests.' : 'No hay solicitudes pendientes.'}</p>
                ) : (
                  <ul className="chief-pending-list">
                    {pending.map((member) => (
                      <li key={member.id} className="chief-pending-row">
                        <span>
                          {profileDisplayName(member.profileId)}
                          {' · '}
                          {roleLabel(member.role, en)}
                        </span>
                        <span className="row" style={{ gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={crewAddsBlocked || busyId === member.id}
                            onClick={() => void decide(member.id, true)}
                          >
                            {en ? 'Accept' : 'Aceptar'}
                          </button>
                          <button
                            type="button"
                            className="btn"
                            disabled={busyId === member.id}
                            onClick={() => void decide(member.id, false)}
                          >
                            {en ? 'Reject' : 'Rechazar'}
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {activeMissionId && stage === 'aboard' ? (
        <AboardCheckInBoard missionId={activeMissionId} en={en} />
      ) : null}

      {activeMissionId ? (
        <ChiefLaunchPanel
          missionId={activeMissionId}
          stage={stage}
          plannedCrewCount={detail?.mission.plannedCrewCount}
          teamSize={crewSeatCount || 4}
          durationDays={detail?.mission.durationDays}
          prep={prep}
          percent={percent}
          analysisStale={analysisStale}
          onChanged={() => refresh({ silent: true })}
        />
      ) : null}

      <MonitorPage embedded />
    </div>
  )
}
