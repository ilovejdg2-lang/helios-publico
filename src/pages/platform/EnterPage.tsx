import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeliosLogo } from '../../components/HeliosLogo'
import { LocaleThemeSwitch } from '../../components/LocaleThemeSwitch'
import { OrbitalBackdrop } from '../../components/role/RoleArt'
import { QuironFigure } from '../../components/quiron/QuironFigure'
import { useLocale } from '../../i18n'
import { platformApi, type Profile } from '../../platform/api'
import { ROLE_CARDS } from '../../platform/roleCatalog'
import { clearActiveMission, setSession } from '../../platform/session'
import {
  DEMO_ROLE_PROFILES,
  type WorkspaceRole,
  clearWorkspace,
  setDemoExplore,
  setWorkspaceMode,
  setWorkspaceRole,
} from '../../platform/workspace'
import '../../platform/platform.css'
import '../../platform/enter.css'

export function EnterPage() {
  const navigate = useNavigate()
  const { lang } = useLocale()
  const en = lang === 'en'
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [selected, setSelected] = useState<WorkspaceRole | null>(null)

  useEffect(() => {
    document.title = en ? 'HELIOS · Explore' : 'HELIOS · Explorar'
    let alive = true
    setLoading(true)
    platformApi.profiles()
      .then((data) => {
        if (alive) setProfiles(data.profiles)
      })
      .catch((err: Error) => {
        if (alive) setError(err.message || (en ? 'Could not load roles' : 'No se pudieron cargar los roles'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => { alive = false }
  }, [en])

  async function explore(role: WorkspaceRole) {
    setSelected(role)
    setBusy(role)
    setError('')
    const profileId = DEMO_ROLE_PROFILES[role]
    const profile = profiles.find((item) => item.id === profileId)
      || profiles.find((item) => item.demoRole === role)
    if (!profile) {
      setError(en ? 'Demo profile missing for this role' : 'Falta el perfil demo de este rol')
      setBusy(null)
      return
    }
    try {
      const result = await platformApi.select(profile.id)
      setSession(result.token, {
        id: result.profile.id,
        displayName: result.profile.displayName,
        title: result.profile.title,
        demoRole: result.profile.demoRole,
      })
      clearActiveMission()
      clearWorkspace()
      setWorkspaceRole(role)
      setWorkspaceMode('demo')
      setDemoExplore(true)
      navigate('/misiones')
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not start demo' : 'No se pudo iniciar la demo'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="enter">
      <div className="enter-bg" aria-hidden="true">
        <OrbitalBackdrop className="enter-orbit" />
      </div>
      {(loading || busy) ? (
        <div className="plat-loader" role="status" aria-live="polite">
          <span className="plat-spinner" aria-hidden="true" />
          <p>{busy ? (en ? 'Opening experience…' : 'Abriendo experiencia…') : (en ? 'Loading…' : 'Cargando…')}</p>
        </div>
      ) : null}

      <header className="enter-top">
        <HeliosLogo variant="wordmark" />
        <div className="enter-top-actions">
          <LocaleThemeSwitch />
          <Link className="enter-link" to="/">{en ? 'Site' : 'Sitio'}</Link>
        </div>
      </header>

      <main className="enter-main">
        <div className="enter-hero">
          <p className="enter-badge">{en ? 'Space Apps · role demo' : 'Space Apps · demo por rol'}</p>
          <h1>{en ? 'How do you want to explore the mission?' : '¿Cómo querés explorar la misión?'}</h1>
          <p className="enter-lead">{en ? 'Pick a role.' : 'Elegí un rol.'}</p>
          <p className="enter-lead">
            <Link className="enter-link" to="/misiones/evidencia">
              {en ? 'Open NASA evidence →' : 'Abrir evidencia NASA →'}
            </Link>
          </p>
          <div className="enter-quiron" aria-hidden="true">
            <QuironFigure className="enter-quiron-fig" />
            <span>{en ? 'Quirón walks with you' : 'Quirón te acompaña'}</span>
          </div>
        </div>

        {error ? <p className="enter-error" role="alert">{error}</p> : null}

        <div className="enter-grid" aria-busy={loading || Boolean(busy)}>
          {ROLE_CARDS.map((card, index) => {
            const Art = card.Art
            const isOn = selected === card.id
            return (
              <article
                key={card.id}
                className={`enter-card enter-card-${card.id}${isOn ? ' is-on' : ''}`}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="enter-card-art">
                  <Art />
                </div>
                <h2>{en ? card.name.en : card.name.es}</h2>
                <p>{en ? card.blurb.en : card.blurb.es}</p>
                <ul>
                  {(en ? card.caps.en : card.caps.es).map((cap) => (
                    <li key={cap}>{cap}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="enter-cta"
                  disabled={busy !== null || loading}
                  onClick={() => void explore(card.id)}
                >
                  {en ? card.cta.en : card.cta.es}
                </button>
              </article>
            )
          })}
        </div>
      </main>
    </div>
  )
}