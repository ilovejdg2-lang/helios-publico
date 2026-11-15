import { useMemo, useState } from 'react'
import { SharedCareSummaries } from '../../components/quiron/SharedCareSummaries'
import { Link } from 'react-router-dom'
import { useLocale } from '../../i18n'
import { profileDisplayName } from '../../platform/copy'
import { grantToSubject } from '../../platform/grants'
import { MedicArt } from '../../components/role/RoleArt'
import { AboardCheckInBoard } from '../../components/role/AboardCheckInBoard'
import { RoleContextBar } from './RoleContextBar'
import { useMissionWorkspace } from './useMissionWorkspace'
import '../../platform/role-dash.css'

type CaseRow = {
  id: string
  label: string
  reason: string
  granted: boolean
}

export function MedicHome() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { profile, detail, appointments, grants, loading, error, role, mode, missionId } = useMissionWorkspace()
  const [selected, setSelected] = useState<string | null>(() => sessionStorage.getItem('helios-medic-case'))

  const cases: CaseRow[] = useMemo(() => {
    const members = detail?.members.filter((m) => m.status === 'active' && m.profileId !== profile?.id) ?? []
    return members.map((m) => {
      const granted = grantToSubject(grants, m.profileId, profile?.id)
      return {
        id: m.profileId,
        label: profileDisplayName(m.profileId),
        reason: granted
          ? (en ? 'Authorized physical follow-up' : 'Seguimiento físico autorizado')
          : (en ? 'No grant yet' : 'Sin permiso aún'),
        granted,
      }
    })
  }, [detail?.members, grants, profile?.id, en])

  const active = cases.find((c) => c.id === selected) || null

  function pick(id: string) {
    setSelected(id)
    sessionStorage.setItem('helios-medic-case', id)
  }

  return (
    <div className="rd rd-medic">
      <div className="rd-bg" aria-hidden="true"><MedicArt /></div>
      <header className="rd-head">
        <p className="rd-kicker">{en ? 'Care & follow-up' : 'Atención y seguimiento'}</p>
        <h1>{en ? 'Medical care' : 'Atención médica'}</h1>
        <RoleContextBar
          missionName={detail?.mission.name}
          stage={detail?.mission.stage}
          role={role}
          mode={mode}
          subject={active?.label}
        />
        <p className="rd-muted">
          {en
            ? 'Your own heart rate is not the hero of this workspace. Personal health lives under “My health”. After revoke, this list must show “Ask access” — that is the consent demo for judges.'
            : 'Tu frecuencia cardíaca no es el bloque protagonista. La salud personal está en “Mi salud”. Tras revocar, esta lista debe decir “Pedir acceso”: esa es la demo de consentimiento para el jurado.'}
        </p>
      </header>

      {missionId && detail?.mission.stage === 'aboard' ? (
        <AboardCheckInBoard missionId={missionId} en={en} />
      ) : null}

      {error ? <p className="plat-error">{error}</p> : null}
      {loading ? <p className="rd-muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}

      <section className="rd-card">
        <h2>{en ? 'Schedule strip' : 'Franja de agenda'}</h2>
        {appointments.length === 0 ? (
          <div className="rd-empty">
            <strong>{en ? 'No appointments' : 'Sin citas'}</strong>
            <span className="rd-muted">{en ? 'Confirm or reschedule when requests arrive.' : 'Confirmá o reprogramá cuando lleguen solicitudes.'}</span>
          </div>
        ) : (
          <ul className="rd-list">
            {appointments.slice(0, 4).map((item, index) => (
              <li className="rd-row" key={index}>
                <div>
                  <strong>{en ? 'Visit' : 'Consulta'} #{index + 1}</strong>
                  <span>{JSON.stringify(item).slice(0, 90)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="rd-layout">
        <section className="rd-card">
          <h2>{en ? 'Pending cases' : 'Casos pendientes'}</h2>
          {cases.length === 0 ? (
            <div className="rd-empty">
              <strong>{en ? 'No patients in this mission yet' : 'Todavía no hay pacientes en esta misión'}</strong>
              <span className="rd-muted">{en ? 'Invite crew or wait for join requests.' : 'Invitá tripulación o esperá solicitudes de ingreso.'}</span>
            </div>
          ) : (
            <ul className="rd-list">
              {cases.map((item) => (
                <li key={item.id}>
                  <button type="button" className={`rd-row${selected === item.id ? ' is-on' : ''}`} onClick={() => pick(item.id)} style={{ width: '100%', border: 0, cursor: 'pointer', textAlign: 'left' }}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.reason}</span>
                    </div>
                    <span className="rd-chip">{item.granted ? (en ? 'Granted' : 'Autorizado') : (en ? 'Ask access' : 'Pedir acceso')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rd-card">
          <h2>{en ? 'Case detail' : 'Detalle del caso'}</h2>
          {!active ? (
            <div className="rd-empty">
              <strong>{en ? 'Select a case' : 'Seleccioná un caso'}</strong>
              <span className="rd-muted">{en ? 'Only granted categories are readable from the backend.' : 'Solo se leen categorías concedidas desde el backend.'}</span>
            </div>
          ) : active.granted ? (
            <>
              <p><strong>{active.label}</strong></p>
              <p className="rd-muted">{active.reason}</p>
              <p className="rd-muted">{en ? 'Measurements and alerts appear only inside the granted permission. No psych notes are copied automatically.' : 'Mediciones y alertas aparecen solo dentro del permiso. No se copian notas psicológicas automáticamente.'}</p>
              <div className="rd-actions">
                <Link className="rd-btn" to="/app/medico">{en ? 'Review case' : 'Revisar caso'}</Link>
                <Link className="rd-btn ghost" to="/misiones/evidencia">{en ? 'Evidence' : 'Consultar evidencia'}</Link>
                <Link className="rd-btn ghost" to="/app/mi-salud">{en ? 'My health' : 'Ver mi salud'}</Link>
              </div>
            </>
          ) : (
            <>
              <div className="rd-empty">
                <strong>{en ? 'No information' : 'Sin información'}</strong>
                <span className="rd-muted">{en ? 'Absence of records is not confirmed wellness. Request access to proceed.' : 'La ausencia de registros no es bienestar confirmado. Pedí acceso para continuar.'}</span>
              </div>
              <div className="rd-actions">
                <Link className="rd-btn" to="/app/mi-salud">{en ? 'Request access' : 'Solicitar acceso'}</Link>
                <Link className="rd-btn ghost" to="/app/recursos">{en ? 'Resources' : 'Consultar recursos'}</Link>
              </div>
            </>
          )}
        </section>
      </div>

      <SharedCareSummaries />
      <section className="rd-card">
        <h2>{en ? 'Requests & follow-ups' : 'Solicitudes y seguimientos'}</h2>
        <div className="rd-actions">
          <Link className="rd-btn" to="/app/medico">{en ? 'Log follow-up' : 'Registrar seguimiento'}</Link>
          <Link className="rd-btn ghost" to="/app/mi-salud">{en ? 'My health' : 'Mi salud'}</Link>
        </div>
      </section>
    </div>
  )
}
