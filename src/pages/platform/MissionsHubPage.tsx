import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeliosLogo } from '../../components/HeliosLogo'
import { LocaleThemeSwitch } from '../../components/LocaleThemeSwitch'
import { MissionProcessStrip } from '../../components/platform/MissionProcessStrip'
import { useLocale } from '../../i18n'
import { platformApi, type MissionRow } from '../../platform/api'
import { MISSION_PROCESS_STEPS, roleLabel, stageBlurb, stageLabel } from '../../platform/copy'
import { clearSession, getSessionToken, getStoredProfile, setActiveMissionId } from '../../platform/session'
import {
  clearRoleScopedUiState,
  isDemoExplore,
  resolveAuthorizedRole,
  setWorkspaceMode,
  setWorkspaceRole,
} from '../../platform/workspace'
import '../../platform/platform.css'

type StageFilter = 'all' | (typeof MISSION_PROCESS_STEPS)[number]

/** Una sola misión por etapa: la última de la lista, que es la más reciente. */
function onePerStage(rows: MissionRow[]): MissionRow[] {
  const latest = new Map<string, MissionRow>()
  for (const row of rows) latest.set(row.mission.stage, row)
  return MISSION_PROCESS_STEPS.flatMap((stage) => {
    const row = latest.get(stage)
    return row ? [row] : []
  })
}

export function MissionsHubPage() {
  const navigate = useNavigate()
  const { lang } = useLocale()
  const en = lang === 'en'
  const profile = getStoredProfile()
  const isChief = profile?.demoRole === 'chief'
  const [items, setItems] = useState<MissionRow[]>([])
  const [stageFilter, setStageFilter] = useState<StageFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const visible = useMemo(() => {
    const picked = onePerStage(items)
    return stageFilter === 'all' ? picked : picked.filter((row) => row.mission.stage === stageFilter)
  }, [items, stageFilter])

  useEffect(() => {
    document.title = en ? 'HELIOS · Missions' : 'HELIOS · Misiones'
    if (!getSessionToken()) {
      navigate('/entrar', { replace: true })
      return
    }
    void refresh()
  }, [navigate, en])

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const data = await platformApi.missions()
      setItems(data.items.filter(Boolean) as MissionRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not load missions' : 'Error al cargar misiones'))
    } finally {
      setLoading(false)
    }
  }

  function enter(missionId: string, membershipRole: string) {
    clearRoleScopedUiState()
    setActiveMissionId(missionId)
    const resolved = resolveAuthorizedRole(membershipRole, profile?.demoRole)
    if (resolved) {
      setWorkspaceRole(resolved)
      setWorkspaceMode(isDemoExplore() ? 'demo' : 'authorized')
    }
    navigate('/app')
  }

  function nextAction(stage: string, prepPercent: number) {
    if (stage === 'draft') return en ? 'Define crew size & days' : 'Definí personas y días'
    if (stage === 'preflight') {
      return prepPercent >= 80
        ? (en ? 'Ready to deploy' : 'Lista para desplegar')
        : (en ? 'Complete checklist (80%+)' : 'Completá checklist (80%+)')
    }
    if (stage === 'aboard') return en ? 'Mission in progress' : 'Misión en curso'
    return stageLabel(stage, en)
  }

  return (
    <div className="plat">
      {loading ? (
        <div className="plat-loader" role="status" aria-live="polite">
          <span className="plat-spinner" aria-hidden="true" />
          <p>{en ? 'Loading missions…' : 'Cargando misiones…'}</p>
        </div>
      ) : null}
      <div className="plat-shell">
        <div className="plat-top">
          <HeliosLogo variant="wordmark" />
          <div className="plat-top-tools">
            <LocaleThemeSwitch />
            <div className="plat-actions">
              <span className="plat-chip">{profile?.displayName}</span>
              <button
                type="button"
                className="plat-btn ghost"
                onClick={() => {
                  clearSession()
                  navigate('/entrar')
                }}
              >
                {en ? 'Switch profile' : 'Cambiar perfil'}
              </button>
            </div>
          </div>
        </div>
        <p className="plat-kicker">{en ? 'Mission hub' : 'Hub de misiones'}</p>
        <h1>{en ? 'Your mission space' : 'Tu espacio de misión'}</h1>
        <p className="plat-lead">
          {isChief
            ? (en
              ? 'Create a mission or continue one. Each card shows which process step you are in.'
              : 'Creá una misión o continuá una. Cada tarjeta muestra en qué proceso estás.')
            : (en
              ? 'Continue a mission you already belong to and see its current process step.'
              : 'Continuá una misión a la que ya pertenecés y mirá en qué proceso está.')}
        </p>
        <div className="plat-actions" style={{ marginBottom: 20 }}>
          {isChief ? (
            <Link className="plat-btn" to="/misiones/nueva">{en ? 'Create mission' : 'Crear misión'}</Link>
          ) : null}
          <Link className="plat-btn ghost" to="/misiones/evidencia">
            {en ? 'NASA evidence' : 'Evidencia NASA'}
          </Link>
          <Link className="plat-btn ghost" to="/app/riesgos">
            {en ? 'NASA Risks' : 'Riesgos NASA'}
          </Link>
        </div>

        <section className="plat-panel">
          <h2>{en ? 'Continue one of my missions' : 'Continuar una de mis misiones'}</h2>
          <div className="mission-hub-filters" role="group" aria-label={en ? 'Filter by stage' : 'Filtrar por etapa'}>
            <button type="button" aria-pressed={stageFilter === 'all'} onClick={() => setStageFilter('all')}>
              {en ? 'All' : 'Todas'}
            </button>
            {MISSION_PROCESS_STEPS.map((stage) => (
              <button
                key={stage}
                type="button"
                aria-pressed={stageFilter === stage}
                onClick={() => setStageFilter(stage)}
              >
                {stageLabel(stage, en)}
              </button>
            ))}
          </div>
          {!loading && visible.length === 0 ? (
            <p>
              {items.length === 0
                ? (en ? 'You have no active missions yet.' : 'Todavía no tenés misiones activas.')
                : (en ? 'No mission in this stage.' : 'No hay una misión en esta etapa.')}
            </p>
          ) : null}
          {error ? <p className="plat-error">{error}</p> : null}
          <div className="plat-list mission-hub-list">
            {visible.map((row) => {
              const pct = Number(row.mission.prepPercent) || 0
              return (
                <article className="mission-hub-card" key={row.mission.id}>
                  <div className="mission-hub-main">
                    <div className="mission-hub-title">
                      <strong>{row.mission.name}</strong>
                      <span className="plat-chip">{row.mission.code}</span>
                    </div>
                    <p className="mission-hub-blurb">{stageBlurb(row.mission.stage, en)}</p>
                    <MissionProcessStrip stage={row.mission.stage} en={en} compact />
                    <div className="mission-hub-meta">
                      <span className="mission-hub-stage">{stageLabel(row.mission.stage, en)}</span>
                      <span>{roleLabel(row.membership.role, en)}</span>
                      <span>{nextAction(row.mission.stage, pct)}</span>
                    </div>
                    <div className="mission-hub-prep">
                      <div className="mission-hub-prep-top">
                        <span>{en ? 'Preparation Checklist' : 'Checklist de preparación'}</span>
                        <strong className={pct >= 80 ? 'is-ok' : undefined}>{pct}%</strong>
                      </div>
                      <div className="mission-hub-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                        <span style={{ width: `${Math.min(100, pct)}%` }} />
                        <i style={{ left: '80%' }} title="80%" />
                      </div>
                    </div>
                  </div>
                  <button type="button" className="plat-btn" onClick={() => enter(row.mission.id, row.membership.role)}>
                    {en ? 'Enter dashboard' : 'Entrar al tablero'}
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
