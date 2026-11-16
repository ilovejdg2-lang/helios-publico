import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeliosLogo } from '../../components/HeliosLogo'
import { LocaleThemeSwitch } from '../../components/LocaleThemeSwitch'
import { useLocale } from '../../i18n'
import { platformApi, type MissionEnvironment, type PrepItem, type PrepSuggestion, type StartCheck } from '../../platform/api'
import { getSessionToken, getStoredProfile, setActiveMissionId } from '../../platform/session'
import '../../platform/platform.css'

export function MissionWizardPage() {
  const navigate = useNavigate()
  const { lang } = useLocale()
  const en = lang === 'en'
  const profile = getStoredProfile()
  const [step, setStep] = useState(1)
  const [missionId, setMissionId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState(en ? 'HELIOS Mission' : 'Misión HELIOS')
  const [destination, setDestination] = useState(en ? 'Orbital habitat (simulation)' : 'Hábitat orbital (simulación)')
  const [environment, setEnvironment] = useState<MissionEnvironment>('space_station')
  const [durationDays, setDurationDays] = useState(30)
  /** Default = 4 personas del monitor (Elena, Mateo, Sofía, Alex). */
  const [plannedCrewCount, setPlannedCrewCount] = useState(4)
  const [activities, setActivities] = useState(en ? 'Operations, exercise, demo EVA' : 'Operaciones, ejercicio, EVA demo')
  const [prep, setPrep] = useState<PrepItem[]>([])
  const [percent, setPercent] = useState(0)
  const [suggestions, setSuggestions] = useState<PrepSuggestion[]>([])
  const [startCheck, setStartCheck] = useState<StartCheck | null>(null)

  const steps = useMemo(
    () => (en ? ['Data', 'Crew', 'Prep', 'Review'] : ['Datos', 'Tripulación', 'Preparación', 'Revisión']),
    [en],
  )

  const quironTip = en
    ? 'Quirón recommends including medical and psychological coverage in the plan. This is a HELIOS suggestion, not a NASA requirement.'
    : 'Quirón recomienda incluir cobertura médica y psicológica en la planificación. Es una sugerencia HELIOS, no una obligación NASA.'

  useEffect(() => {
    document.title = en ? 'HELIOS · New mission' : 'HELIOS · Nueva misión'
    if (!getSessionToken()) {
      navigate('/entrar', { replace: true })
      return
    }
    if (profile?.demoRole !== 'chief') {
      navigate('/misiones', { replace: true })
    }
  }, [navigate, en, profile?.demoRole])

  async function createAndContinue() {
    setError('')
    setBusy(true)
    try {
      const created = await platformApi.createMission({
        name,
        destination,
        environment,
        durationDays,
        plannedCrewCount,
        activities: activities.split(',').map((item) => item.trim()).filter(Boolean),
        timezone: 'UTC',
      })
      setMissionId(created.mission.id)
      setActiveMissionId(created.mission.id)
      setPrep(created.prepItems)
      setPercent(created.prepPercent)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not create mission' : 'No se pudo crear'))
    } finally {
      setBusy(false)
    }
  }

  async function loadPrep() {
    if (!missionId) return
    const data = await platformApi.prep(missionId)
    setPrep(data.items)
    setPercent(data.percent)
  }

  async function askQuironPrep() {
    if (!missionId) return
    setBusy(true)
    try {
      const data = await platformApi.suggestPrep(missionId)
      setSuggestions(data.suggestions)
    } finally {
      setBusy(false)
    }
  }

  async function verifyItem(item: PrepItem) {
    if (!missionId) return
    await platformApi.upsertPrep(missionId, {
      ...item,
      status: 'cargado_verificado',
      evidence: item.evidence || (en ? 'Verified in assistant' : 'Verificado en asistente'),
      qtyAvailable: item.qtyAvailable ?? item.qtyRequired ?? 1,
    })
    await loadPrep()
  }

  async function refreshStart() {
    if (!missionId) return
    setStartCheck(await platformApi.startCheck(missionId))
  }

  async function startMission() {
    if (!missionId) return
    setError('')
    setBusy(true)
    try {
      await platformApi.start(missionId)
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not start' : 'No se pudo iniciar'))
      await refreshStart()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="plat">
      {busy ? (
        <div className="plat-loader" role="status" aria-live="polite">
          <span className="plat-spinner" aria-hidden="true" />
          <p>{en ? 'Working…' : 'Procesando…'}</p>
        </div>
      ) : null}
      <div className="plat-shell">
        <div className="plat-top">
          <HeliosLogo variant="wordmark" />
          <div className="plat-top-tools">
            <LocaleThemeSwitch />
            <Link className="plat-btn ghost" to="/misiones">{en ? 'Back to hub' : 'Volver al hub'}</Link>
          </div>
        </div>
        <p className="plat-kicker">{en ? 'Creation assistant' : 'Asistente de creación'}</p>
        <h1>{en ? 'New mission with Quirón' : 'Nueva misión con Quirón'}</h1>
        <p className="plat-lead">{quironTip}</p>
        <div className="plat-steps">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              className={`plat-step${step === index + 1 ? ' is-on' : ''}`}
              onClick={() => (missionId || index === 0 ? setStep(index + 1) : undefined)}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>
        {error ? <p className="plat-error">{error}</p> : null}

        {step === 1 ? (
          <section className="plat-panel">
            <h2>{en ? 'Step 1 · General data' : 'Paso 1 · Datos generales'}</h2>
            <div className="plat-field">
              <label>{en ? 'Name' : 'Nombre'}</label>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="plat-field">
              <label>{en ? 'Destination / scenario' : 'Destino / escenario'}</label>
              <input value={destination} onChange={(event) => setDestination(event.target.value)} />
            </div>
            <div className="plat-field">
              <label>{en ? 'Mission environment' : 'Entorno de misión'}</label>
              <select value={environment} onChange={(event) => setEnvironment(event.target.value as MissionEnvironment)}>
                <option value="spacecraft">{en ? 'Spacecraft' : 'Nave espacial'}</option>
                <option value="space_station">{en ? 'Space station' : 'Estación espacial'}</option>
                <option value="rover">{en ? 'Rover' : 'Rover'}</option>
                <option value="surface_base">{en ? 'Lunar / planetary base' : 'Base lunar o planetaria'}</option>
                <option value="training">{en ? 'Training scenario' : 'Escenario de entrenamiento'}</option>
              </select>
              <p className="plat-muted">
                {en
                  ? 'Adapts copy and prep context only. Does not invent different medical thresholds.'
                  : 'Adapta textos y contexto de preparación. No inventa umbrales médicos distintos.'}
              </p>
            </div>
            <div className="plat-field">
              <label>{en ? 'Estimated duration (days)' : 'Duración estimada (días)'}</label>
              <input type="number" value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))} />
            </div>
            <div className="plat-field">
              <label>{en ? 'Planned people (chief also counts)' : 'Personas previstas (el jefe también cuenta)'}</label>
              <input type="number" value={plannedCrewCount} onChange={(event) => setPlannedCrewCount(Number(event.target.value))} />
            </div>
            <div className="plat-field">
              <label>{en ? 'Activities (comma-separated)' : 'Actividades (separadas por coma)'}</label>
              <textarea value={activities} onChange={(event) => setActivities(event.target.value)} />
            </div>
            <button type="button" className="plat-btn" disabled={busy} onClick={() => void createAndContinue()}>
              {en ? 'Save and continue' : 'Guardar y continuar'}
            </button>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="plat-panel">
            <h2>{en ? 'Step 2 · Crew' : 'Paso 2 · Tripulación'}</h2>
            <p>
              {en
                ? 'You are chief of this mission. Invite others with the mission code from the hub. Each person uses their own profile button; there are no shared passwords.'
                : 'Quedaste como jefe de esta misión. Podés invitar con el código de la misión desde el hub. Cada persona activa su propia cuenta (botón de perfil); no hay contraseñas compartidas.'}
            </p>
            <p className="plat-ok">
              {en
                ? 'Code is available in the hub after creation. Fictional participants must be marked as demo.'
                : 'Código disponible en el hub tras crear. Participantes ficticios deben marcarse como demo.'}
            </p>
            <div className="plat-actions">
              <button type="button" className="plat-btn" onClick={() => setStep(3)}>
                {en ? 'Continue to prep' : 'Continuar a preparación'}
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="plat-panel">
            <h2>{en ? 'Step 3 · Preparation' : 'Paso 3 · Preparación'}</h2>
            <p>
              {en ? 'Current prep:' : 'Preparación actual:'} <strong>{percent}%</strong>{' '}
              ({en ? 'completed = verified; a suggestion does not count' : 'completado = verificado; una sugerencia no cuenta'}).
            </p>
            <div className="plat-actions">
              <button type="button" className="plat-btn" onClick={() => void askQuironPrep()}>
                {en ? 'Ask Quirón to help prepare resources' : 'Quiero que Quirón me ayude a preparar los recursos'}
              </button>
              <button type="button" className="plat-btn ghost" onClick={() => void loadPrep()}>
                {en ? 'Refresh list' : 'Actualizar lista'}
              </button>
            </div>
            {suggestions.length ? (
              <div className="plat-list" style={{ marginTop: 12 }}>
                {suggestions.map((item) => (
                  <div className="plat-row" key={item.title}>
                    <div>
                      <strong>{item.title}</strong>
                      <div>{item.reason}</div>
                      <div>{item.source} · {item.assumptions}</div>
                    </div>
                    <span className="plat-chip">{item.qty ?? (en ? 'n/a' : 'n/d')}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="plat-list" style={{ marginTop: 16 }}>
              {prep.map((item) => (
                <div className="plat-row" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <div>{item.status}{item.critical ? (en ? ' · critical' : ' · crítico') : ''}</div>
                    <div>{item.source}</div>
                  </div>
                  <button
                    type="button"
                    className="plat-btn ghost"
                    disabled={item.status === 'cargado_verificado'}
                    onClick={() => void verifyItem(item)}
                  >
                    {en ? 'Verify' : 'Verificar'}
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="plat-btn"
              style={{ marginTop: 12 }}
              onClick={() => {
                void refreshStart()
                setStep(4)
              }}
            >
              {en ? 'Go to review' : 'Ir a revisión'}
            </button>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="plat-panel">
            <h2>{en ? 'Step 4 · Review and start' : 'Paso 4 · Revisión y comienzo'}</h2>
            <p>
              {en
                ? 'The 80% rule is a HELIOS simulation rule; it is not medical certification or a NASA requirement.'
                : 'El 80% es regla HELIOS de simulación; no es certificación médica ni requisito NASA.'}
            </p>
            <button type="button" className="plat-btn ghost" onClick={() => void refreshStart()}>
              {en ? 'Recalculate conditions' : 'Recalcular condiciones'}
            </button>
            {startCheck ? (
              <div style={{ marginTop: 12 }}>
                <p>{en ? 'Prep:' : 'Preparación:'} {startCheck.percent}%</p>
                {startCheck.blockers.length ? (
                  <ul>{startCheck.blockers.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : (
                  <p className="plat-ok">{en ? 'Conditions met.' : 'Condiciones cumplidas.'}</p>
                )}
                <p>{startCheck.disclaimer}</p>
              </div>
            ) : null}
            <div className="plat-actions">
              <button type="button" className="plat-btn" disabled={!startCheck?.ok || busy} onClick={() => void startMission()}>
                {en ? 'Start simulated mission' : 'Iniciar misión simulada'}
              </button>
              <button type="button" className="plat-btn ghost" onClick={() => navigate('/app')}>
                {en ? 'Enter planning (pre-flight)' : 'Entrar a planificación (preembarque)'}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}