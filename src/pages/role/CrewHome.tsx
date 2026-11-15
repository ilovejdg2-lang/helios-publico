import { Link } from 'react-router-dom'
import { useLocale } from '../../i18n'
import { platformApi } from '../../platform/api'
import { CrewArt } from '../../components/role/RoleArt'
import { DailyCarePanel } from '../../components/role/DailyCarePanel'
import { RoleContextBar } from './RoleContextBar'
import { useMissionWorkspace } from './useMissionWorkspace'
import '../../platform/role-dash.css'

export function CrewHome() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const {
    missionId,
    profile,
    detail,
    wakeNote,
    symptoms,
    appointments,
    grants,
    loading,
    error,
    role,
    mode,
    refresh,
  } = useMissionWorkspace()
  const name = profile?.displayName?.split(' ')[0] || (en ? 'crew' : 'tripulante')

  return (
    <div className="rd rd-crew">
      <div className="rd-bg" aria-hidden="true"><CrewArt /></div>
      <header className="rd-head">
        <p className="rd-kicker">{en ? 'My health' : 'Mi salud'}</p>
        <h1>{en ? `Hi, ${name}. How are you feeling today?` : `Hola, ${name}. ¿Cómo te sentís hoy?`}</h1>
        <RoleContextBar
          missionName={detail?.mission.name}
          stage={detail?.mission.stage}
          role={role}
          mode={mode}
        />
      </header>

      {error ? <p className="rd-error" role="alert">{error}</p> : null}
      {loading ? <p className="rd-muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}

      <DailyCarePanel
        missionId={missionId}
        wakeNote={wakeNote}
        symptomCount={symptoms.length}
        onChanged={() => refresh({ silent: true })}
      />

      <div className="rd-band">
        <section className="rd-card">
          <h2>{en ? 'Appointments' : 'Citas'}</h2>
          <p className="rd-muted">
            {appointments.length
              ? (en ? `${appointments.length} request(s)` : `${appointments.length} solicitud(es)`)
              : (en ? 'No appointments yet' : 'Todavía no hay citas')}
          </p>
          <div className="rd-actions">
            <button
              type="button"
              className="rd-btn"
              disabled={!missionId}
              onClick={() => void (async () => {
                if (!missionId) return
                await platformApi.requestAppointment(missionId, {
                  specialty: 'medico',
                  reason: en ? 'Non-urgent follow-up' : 'Seguimiento no urgente',
                  modality: 'aboard',
                })
                await refresh({ silent: true })
              })()}
            >
              {en ? 'Request care' : 'Solicitar atención'}
            </button>
            <Link className="rd-btn ghost" to="/app/mi-salud">
              {en ? `Grants: ${grants.length}` : `Permisos: ${grants.length}`}
            </Link>
          </div>
        </section>
        <section className="rd-card">
          <h2>{en ? 'More' : 'Más'}</h2>
          <div className="rd-actions">
            <Link className="rd-btn ghost" to="/app/monitor">{en ? 'Monitor' : 'Monitor'}</Link>
            <Link className="rd-btn ghost" to="/app/mi-salud">{en ? 'Permissions' : 'Permisos'}</Link>
          </div>
        </section>
      </div>
    </div>
  )
}