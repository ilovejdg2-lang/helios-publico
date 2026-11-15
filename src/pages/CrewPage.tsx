import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CarouselStrip } from '../components/CarouselStrip'
import { CrewHelmet } from '../components/CrewHelmet'
import { SpaceRequests } from '../components/SpaceRequests'
import { Field } from '../components/ui'
import { canReadPrivateWellbeing } from '../domain/access'
import { CREW, crewById, crewDuty, crewPlace } from '../domain/crew'
import { ageLabel, formatValue } from '../domain/format'
import { crewPosture, latestMeasurement } from '../domain/selectors'
import type { EvidenceKind, ObservedKind } from '../domain/selectors'
import { SIMULATED_PINS, simulatedPinMatches } from '../domain/spaceAccess'
import { latestVisibleRequest } from '../domain/spaceRequests'
import { readPrivate, writePrivate } from '../persistence/private'
import { useLocale } from '../i18n'
import { useApp } from '../state/store'
import type { CrewId } from '../../shared/types'

type Filter = 'all' | 'change' | 'stable' | 'missing'

const EVIDENCE_LABEL: Record<EvidenceKind, string> = {
  actualizada: 'Evidencia actualizada',
  incompleta: 'Evidencia incompleta',
  pendiente: 'Evidencia pendiente',
  no_confiable: 'Evidencia no confiable',
}

const STATUS_LABEL: Record<ObservedKind, string> = {
  change: 'Requiere revisión',
  stable: 'En línea base',
  no_recent_evaluation: 'Sin evaluación',
}

export function CrewPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state, dispatch, authenticatedCrewId, unlockSpace } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [note, setNote] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const spaceOpen = state.role === 'astronaut' && authenticatedCrewId === state.sessionCrewId
  const pinHint = CREW.map((crew) => `${crew.name.split(' ')[0]} ${SIMULATED_PINS[crew.id]}`).join(' · ')
  const selected = CREW.find((item) => item.id === state.selectedCrewId) ?? CREW[0]
  const sessionCrew = crewById(state.sessionCrewId)
  const allowed = selected ? canReadPrivateWellbeing(state.role, state.sessionCrewId, selected.id) : false
  const roleValue = `${state.role}:${state.sessionCrewId}`

  useEffect(() => {
    if (!selected || !allowed) {
      setNote('')
      setLoaded(false)
      return
    }
    let active = true
    readPrivate(selected.id)
      .then((value) => { if (active) { setNote(value ?? ''); setLoaded(true) } })
      .catch(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [selected, allowed])

  const visible = CREW.filter((crew) => {
    const posture = crewPosture(state, crew.id)
    if (filter === 'change') return posture.observed === 'change'
    if (filter === 'stable') return posture.observed === 'stable'
    if (filter === 'missing') return posture.observed === 'no_recent_evaluation'
    return true
  })

  const setRole = (value: string) => {
    const [role, crewId] = value.split(':')
    if (role === 'medical' || role === 'ops' || role === 'astronaut') {
      setPin('')
      setPinError('')
      dispatch({ type: 'setRole', role, sessionCrewId: (crewId as CrewId) || state.sessionCrewId })
    }
  }

  const roles = [
    { value: 'medical:elena-torres', label: en ? 'Medical team' : 'Equipo médico' },
    { value: 'ops:elena-torres', label: en ? 'Operations' : 'Operaciones' },
    ...CREW.map((crew) => ({ value: `astronaut:${crew.id}`, label: `Ast. ${crew.name}` })),
  ]
  const filters = [
    ['all', en ? 'All' : 'Todas'],
    ['change', en ? 'With change' : 'Con cambio'],
    ['stable', en ? 'Within baseline' : 'En línea base'],
    ['missing', en ? 'No recent data' : 'Sin datos recientes'],
  ] as const
  const evidenceLabel = en
    ? { actualizada: 'Updated evidence', incompleta: 'Incomplete evidence', pendiente: 'Evidence pending', no_confiable: 'Unreliable evidence' }
    : EVIDENCE_LABEL
  const statusLabel = en
    ? { change: 'Needs review', stable: 'Within baseline', no_recent_evaluation: 'No evaluation' }
    : STATUS_LABEL

  return (
    <div className="page crew-page">
      <div className="crew-top">
        <header className="crew-heading">
          <p className="crew-kicker">{en ? 'Crew' : 'Tripulación'}</p>
          <h1>{en ? 'Four people, one record' : 'Cuatro personas, un mismo registro'}</h1>
          <p>
            {en ? 'Observed state and evidence quality are calculated separately.' : 'El estado observado y la calidad de la evidencia se calculan aparte.'}
            <br />
            {en ? 'Missing data does not mean stability.' : 'Falta de datos no significa estabilidad.'}
          </p>
        </header>
        <fieldset className="crew-roles" data-testid="role-select">
          <legend>{en ? 'Simulated role' : 'Rol simulado'}</legend>
          {roles.map((role) => {
            const selectedRole = state.role === 'medical'
              ? role.value === 'medical:elena-torres'
              : state.role === 'ops'
                ? role.value === 'ops:elena-torres'
                : role.value === roleValue
            return (
              <label key={role.value} className={selectedRole ? 'is-selected' : undefined}>
                <input
                  type="radio"
                  name="simulated-role"
                  value={role.value}
                  checked={selectedRole}
                  onChange={() => setRole(role.value)}
                />
                {role.label}
              </label>
            )
          })}
        </fieldset>
      </div>

      <div className="crew-filters" role="group" aria-label={en ? 'Filter crew' : 'Filtrar tripulación'}>
        {filters.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>

      <CarouselStrip className="crew-board-carousel" trackClassName="crew-board" label={en ? 'Crew board' : 'Tablero de tripulación'}>
        {visible.map((crew) => {
          const posture = crewPosture(state, crew.id)
          const hr = latestMeasurement(state, crew.id, 'heart_rate')
          const sleep = latestMeasurement(state, crew.id, 'sleep_hours')
          const request = latestVisibleRequest(state, crew.id)
          const alert = posture.observed === 'change'
          return (
            <button
              key={crew.id}
              type="button"
              className={alert ? 'crew-tile is-alert' : 'crew-tile'}
              aria-pressed={crew.id === selected?.id}
              onClick={() => dispatch({ type: 'selectCrew', crewId: crew.id })}
            >
              <span className="crew-tile-avatar">
                <CrewHelmet id={crew.id} name={crew.name} selected={alert} />
              </span>
              <strong className="crew-tile-name">{crew.name}</strong>
              <span className="crew-tile-duty">{crewDuty(crew, lang)}</span>
              <span className="crew-rule" />
              <span className="crew-tile-location">{crewPlace(crew, lang)}</span>
              <span className="crew-rule" />
              <span className="crew-tile-hr">
                <Heart aria-hidden="true" size={22} fill="currentColor" />
                {hr ? (
                  <>
                    <b>{formatValue('heart_rate', hr.value)}</b>
                    <small>{en ? 'bpm' : 'lpm'}</small>
                  </>
                ) : <b>{en ? 'No recent pulse' : 'Sin pulso reciente'}</b>}
              </span>
              <span className="crew-tile-sleep">
                {sleep ? `${en ? 'Sleep' : 'Descanso'} ${formatValue('sleep_hours', sleep.value)} h` : (en ? 'No sleep record' : 'Sin registro de descanso')}
              </span>
              {request ? <span className="crew-tile-request" data-testid={`crew-request-${crew.id}`}>{en ? 'Request' : 'Solicitud'} · {request.line}</span> : null}
              <span className="crew-rule" />
              <span className="crew-tile-evidence">{evidenceLabel[posture.evidence]}</span>
              <span className={`crew-status is-${posture.observed}`}>
                {posture.observed === 'change' ? <span className="crew-status-bang" aria-hidden="true">!</span> : null}
                {statusLabel[posture.observed]}
              </span>
            </button>
          )
        })}
      </CarouselStrip>
      {visible.length === 0 ? <p className="empty">{en ? 'Nobody matches that filter.' : 'Nadie coincide con ese filtro.'}</p> : null}

      <div className="crew-extra">
        {state.role === 'astronaut' ? (
          <section className="callout">
            <strong>Acceso simulado a Mi espacio</strong>
            {spaceOpen ? (
              <p>Sesión simulada abierta para {sessionCrew.name}. Al recargar la página hay que repetir el PIN.</p>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!simulatedPinMatches(state.sessionCrewId, pin)) {
                    setPinError('Ese PIN simulado no corresponde a esta persona.')
                    return
                  }
                  setPinError('')
                  unlockSpace(state.sessionCrewId)
                }}
              >
                <p>{en ? 'This PIN is simulated. It is only for the demonstration and does not protect the data. Whoever controls the browser can read IndexedDB.' : 'Este PIN es simulado. Sirve solo para la demostración y no protege los datos. Quien controla el navegador puede leer IndexedDB.'}</p>
                <p className="muted">{en ? 'Demonstration codes' : 'Códigos de demostración'}: {pinHint}.</p>
                <Field id="space-pin" label={`${en ? 'Simulated PIN for' : 'PIN simulado de'} ${sessionCrew.name}`} error={pinError}>
                  <input
                    id="space-pin"
                    data-testid="space-pin"
                    inputMode="numeric"
                    autoComplete="off"
                    value={pin}
                    aria-invalid={Boolean(pinError)}
                    aria-describedby={pinError ? 'space-pin-error' : undefined}
                    onChange={(event) => {
                      setPin(event.target.value)
                      if (pinError) setPinError('')
                    }}
                  />
                </Field>
                <button className="btn btn-primary" type="submit" data-testid="space-pin-submit">{en ? 'Open simulated session' : 'Abrir sesión simulada'}</button>
              </form>
            )}
          </section>
        ) : null}
        <SpaceRequests />
        {selected ? (
          <section className="detail">
            <div className="spread">
              <h2>{selected.name}</h2>
              <div className="row">
                <Link className="btn btn-primary" to="/app/monitor">{en ? 'Open monitor' : 'Abrir monitor'}</Link>
                <Link className="btn" to="/app/historial">{en ? 'View history' : 'Ver historial'}</Link>
              </div>
            </div>
            <p>{crewPlace(selected, lang)} · {en ? 'clock activity' : 'última actividad del reloj'} {ageLabel(state.clock.simulatedAt, state.clock.simulatedAt)}</p>
            <p>{crewPosture(state, selected.id).summary}</p>
            <div className="callout">
              <strong>{en ? 'Private wellbeing' : 'Bienestar privado'}</strong>
              {allowed && loaded ? (
                <form onSubmit={(event) => { event.preventDefault(); void writePrivate(selected.id, note) }}>
                  <Field id="private-note" label={en ? 'Note visible only to this person in this browser' : 'Nota visible solo para esta persona en este navegador'}>
                    <textarea id="private-note" value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} />
                  </Field>
                  <button className="btn" type="submit">{en ? 'Save private note' : 'Guardar nota privada'}</button>
                  <p className="muted">{en ? 'The medical team does not load this store. Whoever controls the browser can read IndexedDB: it is not a security boundary.' : 'El equipo médico no carga este almacén. Quien controla el navegador puede leer IndexedDB: no es una frontera de seguridad.'}</p>
                </form>
              ) : (
                <p>{en ? 'This simulated role does not open this module. Hiding the card would not be enough, so the read is not even requested.' : 'Con el rol simulado actual este módulo no se consulta. Ocultar la tarjeta no sería suficiente, así que la lectura ni siquiera se pide.'}</p>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
