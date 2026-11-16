import { useEffect, useMemo, useState } from 'react'
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
type ApptRow = { id: string; specialty?: string; status?: string; reason?: string }

export function MyHealthPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  useEffect(() => {
    document.title = en ? 'HELIOS · My Health' : 'HELIOS · Mi salud'
  }, [en])
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

  async function reloadIndicators() {
    if (!missionId) return
    const data = await platformApi.listIndicators(missionId)
    setIndicators(data.items)
    try { setRecordCount(Number(localStorage.getItem('helios.progress.records') || '0')) } catch { /* ignore */ }
  }

  useEffect(() => {
    void reloadIndicators().catch(() => undefined)
  }, [missionId])

  const routine = useMemo(() => {
    const items: { id: string; label: string; status: 'pending' | 'done' | 'overdue' }[] = []
    const wakeDone = Boolean(wakeNote && !/incomplete|sin completar|pending/i.test(wakeNote))
    items.push({
      id: 'wake',
      label: en ? 'Post-wake check-in' : 'Chequeo después del despertar',
      status: wakeDone ? 'done' : 'pending',
    })
    items.push({
      id: 'sleep',
      label: en ? 'Rest / sleep log' : 'Descanso / sueño',
      status: indicators.some((i) => i.kind === 'sleep_hours') ? 'done' : 'pending',
    })
    const openAppts = (appointments as ApptRow[]).filter((a) => a.status === 'requested' || a.status === 'pending_confirm')
    items.push({
      id: 'appts',
      label: en ? 'Pending appointments' : 'Citas pendientes',
      status: openAppts.length ? 'overdue' : 'done',
    })
    items.push({
      id: 'follow',
      label: en ? 'Professional follow-ups / shared summaries' : 'Seguimientos / resúmenes compartidos',
      status: 'pending',
    })
    return items
  }, [wakeNote, indicators, appointments, en])

  const medicId = detail?.members.find((m) => m.role === 'medic' && m.status === 'active')?.profileId
  const psychId = detail?.members.find((m) => m.role === 'psychologist' && m.status === 'active')?.profileId
  const env = detail?.mission.environment || 'space_station'

  return (
    <div className="rd rd-crew">
      <div className="rd-bg" aria-hidden="true"><CrewArt /></div>
      <header className="rd-head">
        <p className="rd-kicker">{en ? 'Personal space' : 'Espacio personal'}</p>
        <h1>{en ? 'My Health' : 'Mi salud'}</h1>
        <RoleContextBar
          missionName={detail?.mission.name}
          stage={detail?.mission.stage}
          role={role}
          mode={mode}
          subject={profile?.displayName}
        />
        <p className="rd-muted">
          {en
            ? `Mission environment: ${env.replace('_', ' ')} · Professional workspace (${role ? roleLabel(role, true) : '—'}) stays separate from these personal records.`
            : `Entorno de misión: ${env.replace('_', ' ')} · El espacio profesional (${role ? roleLabel(role, false) : '—'}) permanece separado de estos registros personales.`}
        </p>
        <div className="rd-actions">
          <Link className="rd-btn ghost" to="/app">{en ? 'Back to workspace' : 'Volver al espacio'}</Link>
          <Link className="rd-btn ghost" to="/app/riesgos">{en ? '5 hazards & risks' : '5 peligros y riesgos'}</Link>
          <Link className="rd-btn ghost" to="/misiones/evidencia">{en ? 'Evidence' : 'Evidencia'}</Link>
        </div>
      </header>

      {loading ? <p className="rd-muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}

      <section className="rd-card">
        <h2>{en ? 'Mission routine' : 'Rutina de misión'}</h2>
        <ul className="health-mini-list">
          {routine.map((item) => (
            <li key={item.id}>
              <strong>{item.label}</strong>
              {' · '}
              {item.status === 'done' ? (en ? 'Done' : 'Hecho') : item.status === 'overdue' ? (en ? 'Pending / overdue' : 'Pendiente / vencido') : (en ? 'Pending' : 'Pendiente')}
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

      <BodyMap
        indicators={indicators}
        symptoms={symptoms as SymptomRow[]}
      />

      <section className="rd-card">
        <h2>{en ? 'Act: appointments, grants & urgent help' : 'Actuar: citas, permisos y ayuda urgente'}</h2>
        <p className="rd-muted">
          {en
            ? `Appointments: ${appointments.length} · Grants: ${grants.length}. Urgent cases are not resolved with a future appointment alone.`
            : `Citas: ${appointments.length} · Permisos: ${grants.length}. Los casos urgentes no se resuelven solo con una cita futura.`}
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
      <PlatformIndicatorCharts missionId={missionId} />

      <section className="rd-card" data-testid="consent-demo">
        <h2>{en ? 'Act: appointments, grants & urgent help' : 'Actuar: citas, permisos y ayuda urgente'}</h2>
        <p className="rd-muted">
          {en
            ? `Judge path: Share vitals with medic → switch to Sofía (medic) → Revoke here → medic sees “Ask access”. Appointments: ${appointments.length} · Active grants: ${(grants as GrantRow[]).filter(isActiveGrant).length}.`
            : `Ruta jurado: Compartir vitales con médica → cambiar a Sofía (médica) → Revocar aquí → médica ve “Pedir acceso”. Citas: ${appointments.length} · Permisos activos: ${(grants as GrantRow[]).filter(isActiveGrant).length}.`}
          </button>
          <button
            type="button"
            className="rd-btn ghost"
            disabled={!missionId}
            onClick={() => void (async () => {
              if (!missionId) return
              await platformApi.requestAppointment(missionId, {
                specialty: 'psicologo',
                reason: en ? 'Emotional support (can wait)' : 'Apoyo emocional (puede esperar)',
                modality: 'aboard',
              })
              await refresh({ silent: true })
            })()}
          >
            {en ? 'Psychological Consultation' : 'Consulta psicológica'}
          </button>
          <button
            type="button"
            className="rd-btn"
            disabled={!missionId || !medicId || grantBusy}
            onClick={() => void (async () => {
              if (!missionId || !medicId) return
              setGrantBusy(true)
              try {
                await platformApi.grant(missionId, {
                  granteeProfileId: medicId,
                  categories: ['vitals', 'symptoms', 'sleep'],
                  scopeNote: en ? 'Crew-authorized share for mission medic' : 'Compartido por el tripulante con médica de misión',
                })
                await refresh({ silent: true })
              } finally {
                setGrantBusy(false)
              }
            })()}
          >
            {en ? 'Share vitals with medic' : 'Compartir vitales con médica'}
          </button>
          <button
            type="button"
            className="rd-btn ghost"
            disabled={!missionId || !psychId || grantBusy}
            onClick={() => void (async () => {
              if (!missionId || !psychId) return
              setGrantBusy(true)
              try {
                await platformApi.grant(missionId, {
                  granteeProfileId: psychId,
                  categories: ['symptoms', 'sleep'],
                  scopeNote: en ? 'Crew-authorized share for psychologist' : 'Compartido por el tripulante con psicología',
                })
                await refresh({ silent: true })
              } finally {
                setGrantBusy(false)
              }
            })()}
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
              const result = await platformApi.urgent(missionId) as { limitation?: string; requested?: boolean }
              setUrgentNote(result.limitation || (en
                ? 'Urgent flow opened. Follow the versioned protocol and human contact — do not wait for a future slot alone.'
                : 'Flujo urgente abierto. Seguí el protocolo versionado y el contacto humano — no esperes solo una cita futura.'))
              window.dispatchEvent(new CustomEvent('helios:quiron-care', { detail: { topic: 'physical' } }))
              await refresh({ silent: true })
            })()}
          >
            {en ? 'Urgent help now' : 'Ayuda urgente ahora'}
          </button>
        </div>
        {urgentNote ? <p className="rd-ok" role="status">{urgentNote}</p> : null}
        <ul className="health-mini-list">
          {(grants as GrantRow[]).filter((g) => !g.revokedAt).slice(0, 8).map((g) => (
            <li key={g.id}>
              {en ? 'Grant to' : 'Permiso a'} {g.granteeProfileId} · {(g.categories || []).join(', ')}
              <button
                type="button"
                className="rd-btn ghost"
                style={{ marginLeft: 8 }}
                onClick={() => void platformApi.revokeGrant(g.id).then(() => refresh({ silent: true }))}
              >
                {en ? 'Revoke' : 'Revocar'}
              </button>
            </li>
          ))}
        </ul>
      </section>

        <h3 style={{ margin: '14px 0 8px', fontSize: '0.95rem' }}>
          {en ? 'Active consents (you can revoke anytime)' : 'Consentimientos activos (podés revocar cuando quieras)'}
        </h3>
        <ul className="health-mini-list">
          {(grants as GrantRow[]).filter(isActiveGrant).slice(0, 8).map((g) => (
            <li key={g.id}>
              <strong>{profileDisplayName(g.granteeProfileId)}</strong>
              {' · '}
              {(g.categories || []).join(', ') || (en ? 'categories n/a' : 'sin categorías')}
              {g.scopeNote ? <span className="rd-muted"> — {g.scopeNote}</span> : null}
              <button
                type="button"
                className="rd-btn ghost"
                style={{ marginLeft: 8 }}
                data-testid={`revoke-grant-${g.id}`}
                onClick={() => void platformApi.revokeGrant(g.id).then(() => refresh({ silent: true }))}
              >
                {en ? 'Revoke now' : 'Revocar ahora'}
              </button>
            </li>
          ))}
          {(grants as GrantRow[]).filter(isActiveGrant).length === 0 ? (
            <li className="rd-muted">
              {en
                ? 'No active shares. Medic and psychologist cannot read your indicators until you grant.'
                : 'Sin compartidos activos. Médica y psicología no pueden leer tus indicadores hasta que concedás.'}
            </li>
          ) : null}
              try { localStorage.setItem('helios.progress.optout', next ? '1' : '0') } catch { /* ignore */ }
            }}
          />
          {en ? 'Disable progress cues' : 'Desactivar señales de progreso'}
        </label>
        {!progressOptOut ? (
          <p>{en ? `Indicators logged (local cue): ${recordCount}` : `Indicadores registrados (señal local): ${recordCount}`}</p>
        ) : null}
      </section>
    </div>
  )
}
