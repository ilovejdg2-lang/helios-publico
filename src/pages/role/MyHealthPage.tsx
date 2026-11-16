import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BodyMap } from '../../components/health/BodyMap'
import { HealthIndicatorsPanel } from '../../components/health/HealthIndicatorsPanel'
import { MissionRemindersPanel } from '../../components/health/MissionRemindersPanel'
import { OfflineSyncBar } from '../../components/health/OfflineSyncBar'
import { PlatformIndicatorCharts } from '../../components/health/PlatformIndicatorCharts'
import { DailyCarePanel } from '../../components/role/DailyCarePanel'
import { CrewArt } from '../../components/role/RoleArt'
import { useLocale } from '../../i18n'
import { platformApi, type HealthIndicatorReading } from '../../platform/api'
import { profileDisplayName, roleLabel } from '../../platform/copy'
import { isActiveGrant, type PlatformGrant } from '../../platform/grants'
import '../../platform/role-dash.css'
import { RoleContextBar } from './RoleContextBar'
import { useMissionWorkspace } from './useMissionWorkspace'

type GrantRow = PlatformGrant & { id: string; granteeProfileId: string; categories: string[] }
type SymptomRow = { description?: string; bodyRegion?: string | null; createdAt?: number }
type ApptRow = { status?: string }

export function MyHealthPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const {
    missionId,
    detail,
    role,
    mode,
    profile,
    wakeNote,
    symptoms,
    appointments,
    grants,
    loading,
    refresh,
  } = useMissionWorkspace()
  const [indicators, setIndicators] = useState<HealthIndicatorReading[]>([])
  const [urgentNote, setUrgentNote] = useState('')
  const [grantBusy, setGrantBusy] = useState(false)
  const [progressOptOut, setProgressOptOut] = useState(() => {
    try { return localStorage.getItem('helios.progress.optout') === '1' } catch { return false }
  })
  const [recordCount, setRecordCount] = useState(() => {
    try { return Number(localStorage.getItem('helios.progress.records') || '0') } catch { return 0 }
  })

  useEffect(() => {
    document.title = en ? 'HELIOS · My health' : 'HELIOS · Mi salud'
  }, [en])

  const reloadIndicators = useCallback(async () => {
    if (!missionId) return
    const data = await platformApi.listIndicators(missionId)
    setIndicators(data.items)
    try { setRecordCount(Number(localStorage.getItem('helios.progress.records') || '0')) } catch { /* ignore */ }
  }, [missionId])

  useEffect(() => {
    void reloadIndicators().catch(() => undefined)
  }, [reloadIndicators])

  const routine = useMemo(() => {
    const openAppointments = (appointments as ApptRow[]).filter(
      (item) => item.status === 'requested' || item.status === 'pending_confirm',
    )
    return [
      {
        id: 'wake',
        label: en ? 'Post-wake check-in' : 'Chequeo después del despertar',
        status: wakeNote && !/incomplete|sin completar|pending/i.test(wakeNote) ? 'done' : 'pending',
      },
      {
        id: 'sleep',
        label: en ? 'Rest / sleep log' : 'Descanso / sueño',
        status: indicators.some((item) => item.kind === 'sleep_hours') ? 'done' : 'pending',
      },
      {
        id: 'appointments',
        label: en ? 'Pending appointments' : 'Citas pendientes',
        status: openAppointments.length ? 'overdue' : 'done',
      },
    ] as const
  }, [appointments, en, indicators, wakeNote])

  const medicId = detail?.members.find((member) => member.role === 'medic' && member.status === 'active')?.profileId
  const psychId = detail?.members.find((member) => member.role === 'psychologist' && member.status === 'active')?.profileId
  const environment = detail?.mission.environment || 'space_station'

  async function shareWith(profileId: string | undefined, categories: string[], note: string) {
    if (!missionId || !profileId) return
    setGrantBusy(true)
    try {
      await platformApi.grant(missionId, { granteeProfileId: profileId, categories, scopeNote: note })
      await refresh({ silent: true })
    } finally {
      setGrantBusy(false)
    }
  }

  return (
    <div className="rd rd-crew">
      <div className="rd-bg" aria-hidden="true"><CrewArt /></div>
      <header className="rd-head">
        <p className="rd-kicker">{en ? 'Personal space' : 'Espacio personal'}</p>
        <h1>{en ? 'My health' : 'Mi salud'}</h1>
        <RoleContextBar
          missionName={detail?.mission.name}
          stage={detail?.mission.stage}
          role={role}
          mode={mode}
          subject={profile?.displayName}
        />
        <p className="rd-muted">
          {en
            ? `Mission environment: ${environment.replace('_', ' ')} · Professional workspace (${role ? roleLabel(role, true) : '—'}) stays separate from these personal records.`
            : `Entorno de misión: ${environment.replace('_', ' ')} · El espacio profesional (${role ? roleLabel(role, false) : '—'}) permanece separado de estos registros personales.`}
        </p>
        <div className="rd-actions">
          <Link className="rd-btn ghost" to="/app">{en ? 'Back to workspace' : 'Volver al espacio'}</Link>
          <Link className="rd-btn ghost" to="/app/riesgos">{en ? '5 hazards & risks' : '5 peligros y riesgos'}</Link>
          <Link className="rd-btn ghost" to="/misiones/evidencia">{en ? 'Evidence' : 'Evidencia'}</Link>
        </div>
      </header>

      {loading ? <p className="rd-muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}
      <OfflineSyncBar />
      <MissionRemindersPanel missionId={missionId} />

      <section className="rd-card">
        <h2>{en ? 'Mission routine' : 'Rutina de misión'}</h2>
        <ul className="health-mini-list">
          {routine.map((item) => (
            <li key={item.id}>
              <strong>{item.label}</strong>
              {' · '}
              {item.status === 'done' ? (en ? 'Done' : 'Hecho') : item.status === 'overdue'
                ? (en ? 'Pending / overdue' : 'Pendiente / vencido')
                : (en ? 'Pending' : 'Pendiente')}
            </li>
          ))}
        </ul>
      </section>

      <DailyCarePanel
        missionId={missionId}
        wakeNote={wakeNote}
        symptomCount={symptoms.length}
        onChanged={() => refresh({ silent: true })}
      />

      <HealthIndicatorsPanel
        missionId={missionId}
        onChanged={async () => {
          await reloadIndicators()
          await refresh({ silent: true })
        }}
      />
      <PlatformIndicatorCharts missionId={missionId} />
      <BodyMap indicators={indicators} symptoms={symptoms as SymptomRow[]} />

      <section className="rd-card" data-testid="consent-demo">
        <h2>{en ? 'Appointments, sharing & urgent help' : 'Citas, permisos y ayuda urgente'}</h2>
        <p className="rd-muted">
          {en
            ? `Appointments: ${appointments.length} · Active grants: ${(grants as GrantRow[]).filter(isActiveGrant).length}.`
            : `Citas: ${appointments.length} · Permisos activos: ${(grants as GrantRow[]).filter(isActiveGrant).length}.`}
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
            {en ? 'Request medical appointment' : 'Solicitar cita médica'}
          </button>
          <button
            type="button"
            className="rd-btn ghost"
            disabled={!missionId}
            onClick={() => void (async () => {
              if (!missionId) return
              await platformApi.requestAppointment(missionId, {
                specialty: 'psicologo',
                reason: en ? 'Emotional support' : 'Apoyo emocional',
                modality: 'aboard',
              })
              await refresh({ silent: true })
            })()}
          >
            {en ? 'Request psychology appointment' : 'Solicitar cita psicológica'}
          </button>
          <button
            type="button"
            className="rd-btn"
            disabled={!missionId || !medicId || grantBusy}
            onClick={() => void shareWith(
              medicId,
              ['vitals', 'symptoms', 'sleep'],
              en ? 'Crew-authorized share for mission medic' : 'Compartido con médica de misión',
            )}
          >
            {en ? 'Share vitals with medic' : 'Compartir vitales con médica'}
          </button>
          <button
            type="button"
            className="rd-btn ghost"
            disabled={!missionId || !psychId || grantBusy}
            onClick={() => void shareWith(
              psychId,
              ['symptoms', 'sleep'],
              en ? 'Crew-authorized share for psychologist' : 'Compartido con psicología',
            )}
          >
            {en ? 'Share with psychologist' : 'Compartir con psicología'}
          </button>
          <button
            type="button"
            className="rd-btn"
            style={{ background: '#b3003a', color: '#fff' }}
            disabled={!missionId}
            onClick={() => void (async () => {
              if (!missionId) return
              const result = await platformApi.urgent(missionId) as { limitation?: string }
              setUrgentNote(result.limitation || (en
                ? 'Urgent flow opened. Follow the versioned protocol and human contact.'
                : 'Flujo urgente abierto. Seguí el protocolo versionado y el contacto humano.'))
              window.dispatchEvent(new CustomEvent('helios:quiron-care', { detail: { topic: 'physical' } }))
              await refresh({ silent: true })
            })()}
          >
            {en ? 'Urgent help now' : 'Ayuda urgente ahora'}
          </button>
        </div>
        {urgentNote ? <p className="rd-ok" role="status">{urgentNote}</p> : null}
        <ul className="health-mini-list">
          {(grants as GrantRow[]).filter(isActiveGrant).map((grant) => (
            <li key={grant.id}>
              <strong>{profileDisplayName(grant.granteeProfileId)}</strong>
              {' · '}
              {(grant.categories || []).join(', ') || (en ? 'categories n/a' : 'sin categorías')}
              <button
                type="button"
                className="rd-btn ghost"
                style={{ marginLeft: 8 }}
                onClick={() => void platformApi.revokeGrant(grant.id).then(() => refresh({ silent: true }))}
              >
                {en ? 'Revoke' : 'Revocar'}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rd-card">
        <label className="rd-check">
          <input
            type="checkbox"
            checked={progressOptOut}
            onChange={(event) => {
              const next = event.target.checked
              setProgressOptOut(next)
              try { localStorage.setItem('helios.progress.optout', next ? '1' : '0') } catch { /* ignore */ }
            }}
          />
          <span>{en ? 'Disable progress cues' : 'Desactivar señales de progreso'}</span>
        </label>
        {!progressOptOut
          ? <p>{en ? `Indicators logged (local cue): ${recordCount}` : `Indicadores registrados (señal local): ${recordCount}`}</p>
          : null}
      </section>
    </div>
  )
}
